// src/lib/services/order-service.ts
import { prisma } from "../prisma";

export interface CreateTrackingEventInput {
  orderId: string;
  previousStatus?: string | null;
  newStatus: string;
  actorId?: string | null;
  actorRole: string; // "CUSTOMER" | "DELIVERY_AGENT" | "ADMIN" | "SYSTEM"
  location?: string;
  notes?: string;
}

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  CREATED: ["PICKED_UP", "FAILED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [], // Terminal
  FAILED: ["IN_TRANSIT", "OUT_FOR_DELIVERY"], // Via Reschedule or Admin override
};

/**
 * Creates an immutable tracking event in the database.
 */
export async function createTrackingEvent(input: CreateTrackingEventInput) {
  let validActorId = null;
  if (input.actorId) {
    const userExists = await prisma.user.findUnique({
      where: { id: input.actorId },
      select: { id: true },
    });
    if (userExists) {
      validActorId = userExists.id;
    }
  }

  return prisma.trackingEvent.create({
    data: {
      orderId: input.orderId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      actorId: validActorId,
      actorRole: input.actorRole,
      location: input.location,
      notes: input.notes,
    },
  });
}

/**
 * Validates whether a status transition is permitted by the state machine.
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
  actorRole: string = "DELIVERY_AGENT"
): { valid: boolean; error?: string } {
  // Admin is permitted to override with audit logging
  if (actorRole === "ADMIN") {
    return { valid: true };
  }

  if (currentStatus === "DELIVERED") {
    return {
      valid: false,
      error: "Order has already been DELIVERED. Status cannot be modified.",
    };
  }

  if (currentStatus === newStatus) {
    return {
      valid: false,
      error: `Order is already in ${currentStatus} status.`,
    };
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid transition from ${currentStatus} to ${newStatus}. Allowed next states: ${allowed.join(", ") || "None (terminal)"}.`,
    };
  }

  return { valid: true };
}

/**
 * Updates order status, validates lifecycle, updates agent stats, and records tracking history.
 */
export async function updateOrderStatus(input: {
  orderId: string;
  newStatus: string;
  actorId?: string;
  actorRole: string;
  location?: string;
  notes?: string;
  failureReason?: string;
  failureNotes?: string;
}) {
  const { orderId, newStatus, actorId, actorRole, location, notes, failureReason, failureNotes } = input;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Lifecycle validation
  const validation = isValidStatusTransition(order.status, newStatus, actorRole);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const previousStatus = order.status;

  // Perform transactional update
  await prisma.$transaction(async (tx) => {
    // 1. Update order
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        failureReason: newStatus === "FAILED" ? failureReason : order.failureReason,
        failureNotes: newStatus === "FAILED" ? failureNotes : order.failureNotes,
      },
    });

    // 2. If status is DELIVERED or FAILED, manage delivery attempts & agent workload
    if (newStatus === "DELIVERED") {
      if (order.assignedAgentId) {
        const agent = await tx.agentProfile.findUnique({ where: { id: order.assignedAgentId } });
        if (agent && agent.activeDeliveries > 0) {
          await tx.agentProfile.update({
            where: { id: agent.id },
            data: {
              activeDeliveries: Math.max(0, agent.activeDeliveries - 1),
              status: "AVAILABLE",
            },
          });
        }
      }
    } else if (newStatus === "FAILED") {
      // Create a DeliveryAttempt record for the failed attempt
      const existingAttempts = await tx.deliveryAttempt.count({ where: { orderId: order.id } });
      await tx.deliveryAttempt.create({
        data: {
          orderId: order.id,
          attemptNumber: existingAttempts + 1,
          status: "FAILED",
          failureReason: failureReason || "Delivery Attempt Failed",
          notes: failureNotes,
        },
      });

      // Relieve agent active count so they can take other orders
      if (order.assignedAgentId) {
        const agent = await tx.agentProfile.findUnique({ where: { id: order.assignedAgentId } });
        if (agent && agent.activeDeliveries > 0) {
          await tx.agentProfile.update({
            where: { id: agent.id },
            data: {
              activeDeliveries: Math.max(0, agent.activeDeliveries - 1),
              status: "AVAILABLE",
            },
          });
        }
      }
    }

    // 3. Create Notification for Customer
    let notifTitle = `Order Status: ${newStatus.replace(/_/g, " ")}`;
    let notifMsg = `Your shipment #${order.trackingNumber} is now ${newStatus.replace(/_/g, " ").toLowerCase()}.`;

    if (newStatus === "DELIVERED") {
      notifTitle = "Package Delivered!";
      notifMsg = `Your package #${order.trackingNumber} has been successfully delivered.`;
    } else if (newStatus === "FAILED") {
      notifTitle = "Delivery Attempt Failed";
      notifMsg = `Delivery attempt for #${order.trackingNumber} could not be completed (${failureReason || "Address unreachable"}). Please reschedule a convenient delivery date.`;
    } else if (newStatus === "OUT_FOR_DELIVERY") {
      notifTitle = "Out For Delivery";
      notifMsg = `Agent is on the way with your package #${order.trackingNumber}.`;
    }

    await tx.notification.create({
      data: {
        userId: order.customerId,
        orderId: order.id,
        title: notifTitle,
        message: notifMsg,
        type: newStatus === "FAILED" ? "DELIVERY_FAILED" : "STATUS_UPDATE",
      },
    });
  });

  // 4. Create immutable Tracking Event
  const trackingNotes =
    newStatus === "FAILED"
      ? `Failed: ${failureReason}. Notes: ${failureNotes || "None"}`
      : actorRole === "ADMIN" && previousStatus !== newStatus
      ? `Admin Status Override: ${notes || "Manual status adjustment by Operations"}`
      : notes || `Shipment marked as ${newStatus.replace(/_/g, " ")}`;

  await createTrackingEvent({
    orderId: order.id,
    previousStatus,
    newStatus,
    actorId,
    actorRole,
    location,
    notes: trackingNotes,
  });

  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      pickupZone: true,
      dropZone: true,
      trackingEvents: {
        orderBy: { timestamp: "asc" },
        include: { actor: true },
      },
      attempts: {
        orderBy: { attemptNumber: "asc" },
      },
    },
  });
}

/**
 * Generate a clean Indian courier tracking number format: TRK-IN-YYYY-XXXXX
 */
export function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `TRK-IN-${year}-${randomDigits}`;
}
