// src/lib/services/reschedule-service.ts
import { prisma } from "../prisma";
import { autoAssignOrder } from "./assignment-service";
import { createTrackingEvent } from "./order-service";

export interface RescheduleInput {
  orderId: string;
  rescheduledDate: Date | string;
  rescheduleSlot?: string;
  rescheduleReason?: string;
  actorId?: string;
  actorRole?: string;
}

export async function rescheduleDelivery(input: RescheduleInput) {
  const { orderId, rescheduledDate, rescheduleSlot, rescheduleReason, actorId, actorRole = "CUSTOMER" } = input;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      attempts: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.status !== "FAILED" && actorRole !== "ADMIN") {
    throw new Error(`Only FAILED delivery orders can be rescheduled. Current status is ${order.status}.`);
  }

  const parsedDate = new Date(rescheduledDate);
  const formattedDate = parsedDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const slotText = rescheduleSlot || "General Delivery Hours";
  const reasonText = rescheduleReason || "Customer Requested Date Modification";

  const nextAttemptNum = (order.attempts?.length || 0) + 1;

  // 1. Transaction to update order and create attempt
  await prisma.$transaction(async (tx) => {
    // Reset order status to IN_TRANSIT for the next scheduled delivery day
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "IN_TRANSIT",
        rescheduledDate: parsedDate,
        rescheduleSlot: slotText,
        rescheduleReason: reasonText,
        failureReason: null,
        failureNotes: null,
      },
    });

    // Create a new DeliveryAttempt record preserving history
    await tx.deliveryAttempt.create({
      data: {
        orderId: order.id,
        attemptNumber: nextAttemptNum,
        status: "IN_TRANSIT",
        notes: `Rescheduled for ${formattedDate} (${slotText}). Reason: ${reasonText}`,
      },
    });

    // Notify customer
    await tx.notification.create({
      data: {
        userId: order.customerId,
        orderId: order.id,
        title: "Delivery Rescheduled Successfully",
        message: `Your package #${order.trackingNumber} has been rescheduled for ${formattedDate} (${slotText}).`,
        type: "DELIVERY_RESCHEDULED",
      },
    });
  });

  // 2. Add Reschedule Event to Tracking History
  await createTrackingEvent({
    orderId: order.id,
    previousStatus: "FAILED",
    newStatus: "IN_TRANSIT",
    actorId: actorId || order.customerId,
    actorRole,
    notes: `Delivery Rescheduled to ${formattedDate} [${slotText}]. Reason: ${reasonText} (Attempt #${nextAttemptNum})`,
  });

  // 3. Trigger auto-assignment of an available agent for the new attempt
  const assignment = await autoAssignOrder(order.id, actorId, "SYSTEM");

  return prisma.order.findUnique({
    where: { id: order.id },
    include: {
      pickupZone: true,
      dropZone: true,
      attempts: { orderBy: { attemptNumber: "asc" } },
      trackingEvents: { orderBy: { timestamp: "asc" }, include: { actor: true } },
    },
  });
}
