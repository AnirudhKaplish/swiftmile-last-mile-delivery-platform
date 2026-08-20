// src/lib/services/assignment-service.ts
import { prisma } from "../prisma";
import { getZoneProximityScore } from "./zone-service";
import { createTrackingEvent } from "./order-service";

export interface AssignmentResult {
  success: boolean;
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  reason: string;
  matchedScore?: number;
}

/**
 * Deterministically finds and assigns the best available delivery agent for an order.
 * Priority order:
 * 1. Status == AVAILABLE
 * 2. Exact pickup zone match (Score bonus)
 * 3. Proximity score to pickup zone (Lower distance is better)
 * 4. Lower active workload (activeDeliveries)
 * 5. Deterministic tie-breakers: Higher Rating -> Lexicographical agent ID
 */
export async function autoAssignOrder(
  orderId: string,
  actorId?: string,
  actorRole: string = "SYSTEM"
): Promise<AssignmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      pickupZone: true,
      dropZone: true,
    },
  });

  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  // 1. Find all AVAILABLE agents
  const availableAgents = await prisma.agentProfile.findMany({
    where: {
      status: "AVAILABLE",
    },
    include: {
      user: true,
      currentZone: true,
    },
  });

  if (availableAgents.length === 0) {
    // Record failure in tracking event
    await createTrackingEvent({
      orderId: order.id,
      previousStatus: order.status,
      newStatus: order.status,
      actorId,
      actorRole,
      notes: "Auto-assignment attempt: No agents currently AVAILABLE in the fleet.",
    });

    return {
      success: false,
      reason: "No delivery agents are currently available.",
    };
  }

  // 2. Score and sort available agents deterministically
  const scoredAgents = availableAgents.map((agent) => {
    const isExactZoneMatch = agent.currentZoneId === order.pickupZoneId;
    const proximityScore = agent.currentZone
      ? getZoneProximityScore(agent.currentZone.code, order.pickupZone.code)
      : 2.0;

    // Weighted composite score:
    // exact match gives 0, proximity adds 0-3, workload adds 1.0 per active delivery
    const compositeScore = (isExactZoneMatch ? 0 : 2) + proximityScore + agent.activeDeliveries * 1.5;

    return {
      agent,
      isExactZoneMatch,
      proximityScore,
      compositeScore,
    };
  });

  // Sort deterministically:
  // 1. Lowest composite score
  // 2. Exact zone match (boolean true first)
  // 3. Lowest active deliveries
  // 4. Highest rating
  // 5. Agent ID string ascending (deterministic tie-breaker)
  scoredAgents.sort((a, b) => {
    if (a.compositeScore !== b.compositeScore) {
      return a.compositeScore - b.compositeScore;
    }
    if (a.isExactZoneMatch !== b.isExactZoneMatch) {
      return a.isExactZoneMatch ? -1 : 1;
    }
    if (a.agent.activeDeliveries !== b.agent.activeDeliveries) {
      return a.agent.activeDeliveries - b.agent.activeDeliveries;
    }
    if (a.agent.rating !== b.agent.rating) {
      return b.agent.rating - a.agent.rating; // higher rating first
    }
    return a.agent.id.localeCompare(b.agent.id);
  });

  const bestChoice = scoredAgents[0];
  const chosenAgent = bestChoice.agent;

  const assignmentReason = bestChoice.isExactZoneMatch
    ? `Auto-assigned: Exact pickup zone match (${order.pickupZone.name}), workload ${chosenAgent.activeDeliveries} active pkg, rating ${chosenAgent.rating}★`
    : `Auto-assigned: Closest zone proximity (${chosenAgent.currentZone?.name || 'Central'}), workload ${chosenAgent.activeDeliveries} active pkg, rating ${chosenAgent.rating}★`;

  // 3. Execute Assignment Transaction
  await prisma.$transaction(async (tx) => {
    // Update order
    await tx.order.update({
      where: { id: order.id },
      data: {
        assignedAgentId: chosenAgent.id,
        assignedAgentName: chosenAgent.user.name,
        assignedAgentPhone: chosenAgent.user.phone || chosenAgent.vehicleNumber,
      },
    });

    // Deactivate previous active assignments for this order
    await tx.deliveryAssignment.updateMany({
      where: { orderId: order.id, active: true },
      data: { active: false },
    });

    // Create new assignment record with audit reason
    await tx.deliveryAssignment.create({
      data: {
        orderId: order.id,
        agentId: chosenAgent.id,
        active: true,
        reason: assignmentReason,
      },
    });

    // Update agent workload
    const newActiveCount = chosenAgent.activeDeliveries + 1;
    await tx.agentProfile.update({
      where: { id: chosenAgent.id },
      data: {
        activeDeliveries: newActiveCount,
        // If agent reaches 5 active deliveries, temporarily set status to BUSY
        status: newActiveCount >= 5 ? "BUSY" : "AVAILABLE",
      },
    });

    // Notify customer
    await tx.notification.create({
      data: {
        userId: order.customerId,
        orderId: order.id,
        title: "Delivery Agent Assigned",
        message: `Agent ${chosenAgent.user.name} (${chosenAgent.vehicleType} - ${chosenAgent.vehicleNumber}) has been assigned to deliver order #${order.trackingNumber}.`,
        type: "AGENT_ASSIGNED",
      },
    });
  });

  // 4. Record Tracking History
  await createTrackingEvent({
    orderId: order.id,
    previousStatus: order.status,
    newStatus: order.status,
    actorId: actorId || chosenAgent.userId,
    actorRole,
    notes: `Assigned to Agent: ${chosenAgent.user.name} (${chosenAgent.vehicleType} ${chosenAgent.vehicleNumber}). Reason: ${assignmentReason}`,
  });

  return {
    success: true,
    agentId: chosenAgent.id,
    agentName: chosenAgent.user.name,
    agentPhone: chosenAgent.user.phone || chosenAgent.vehicleNumber,
    reason: assignmentReason,
    matchedScore: bestChoice.compositeScore,
  };
}

/**
 * Manually assigns a specific delivery agent to an order.
 */
export async function manualAssignOrder(
  orderId: string,
  agentId: string,
  actorId: string,
  actorRole: string = "ADMIN"
): Promise<AssignmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const agent = await prisma.agentProfile.findUnique({
    where: { id: agentId },
    include: { user: true, currentZone: true },
  });

  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  const reason = `Manually assigned by Admin to ${agent.user.name} (${agent.vehicleType} - ${agent.vehicleNumber})`;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        assignedAgentId: agent.id,
        assignedAgentName: agent.user.name,
        assignedAgentPhone: agent.user.phone || agent.vehicleNumber,
      },
    });

    await tx.deliveryAssignment.updateMany({
      where: { orderId: order.id, active: true },
      data: { active: false },
    });

    await tx.deliveryAssignment.create({
      data: {
        orderId: order.id,
        agentId: agent.id,
        active: true,
        reason,
      },
    });

    await tx.agentProfile.update({
      where: { id: agent.id },
      data: {
        activeDeliveries: agent.activeDeliveries + 1,
      },
    });

    await tx.notification.create({
      data: {
        userId: order.customerId,
        orderId: order.id,
        title: "Delivery Agent Assigned",
        message: `Agent ${agent.user.name} has been assigned to your order #${order.trackingNumber}.`,
        type: "AGENT_ASSIGNED",
      },
    });
  });

  await createTrackingEvent({
    orderId: order.id,
    previousStatus: order.status,
    newStatus: order.status,
    actorId,
    actorRole,
    notes: reason,
  });

  return {
    success: true,
    agentId: agent.id,
    agentName: agent.user.name,
    agentPhone: agent.user.phone || agent.vehicleNumber,
    reason,
  };
}
