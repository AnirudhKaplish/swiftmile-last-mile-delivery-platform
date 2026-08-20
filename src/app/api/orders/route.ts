// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { calculateDeliveryPrice } from "@/lib/services/rate-engine";
import { autoAssignOrder } from "@/lib/services/assignment-service";
import { createTrackingEvent, generateTrackingNumber } from "@/lib/services/order-service";
import { sendNotification } from "@/lib/services/notification-service";

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const zoneId = searchParams.get("zoneId");
    const agentId = searchParams.get("agentId");
    const orderType = searchParams.get("orderType");
    const paymentType = searchParams.get("paymentType");
    const search = searchParams.get("search");

    const where: any = {};

    // Role-based visibility
    if (user.role === "CUSTOMER") {
      where.customerId = user.userId;
    } else if (user.role === "DELIVERY_AGENT") {
      // Find agent profile ID for this user
      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: user.userId },
      });
      if (agentProfile) {
        where.assignedAgentId = agentProfile.id;
      }
    }

    // Filter criteria
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (zoneId && zoneId !== "ALL") {
      where.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
    }
    if (agentId && agentId !== "ALL") {
      where.assignedAgentId = agentId;
    }
    if (orderType && orderType !== "ALL") {
      where.orderType = orderType;
    }
    if (paymentType && paymentType !== "ALL") {
      where.paymentType = paymentType;
    }
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { pickupAddress: { contains: search } },
        { dropAddress: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: true,
        dropZone: true,
        attempts: true,
        trackingEvents: {
          orderBy: { timestamp: "asc" },
          include: { actor: { select: { name: true, role: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required to place an order" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId = user.userId, // Admin can create on behalf of customer, otherwise current user
      orderType = "B2C",
      paymentType = "PREPAID",
      pickupAddress,
      pickupPincode,
      pickupArea,
      pickupCity = "Bengaluru",
      pickupZoneId,
      dropAddress,
      dropPincode,
      dropArea,
      dropCity = "Bengaluru",
      dropZoneId,
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
    } = body;

    // Validation
    if (!pickupAddress || !pickupPincode || !pickupZoneId) {
      return NextResponse.json({ error: "Complete pickup address and detected zone are required." }, { status: 400 });
    }
    if (!dropAddress || !dropPincode || !dropZoneId) {
      return NextResponse.json({ error: "Complete drop address and detected zone are required." }, { status: 400 });
    }
    if (!lengthCm || !breadthCm || !heightCm || !actualWeightKg) {
      return NextResponse.json({ error: "Valid package dimensions and actual weight are required." }, { status: 400 });
    }

    // Dynamic Price Calculation
    const pricing = await calculateDeliveryPrice({
      orderType: orderType === "B2B" ? "B2B" : "B2C",
      paymentType: paymentType === "COD" ? "COD" : "PREPAID",
      pickupZoneId,
      dropZoneId,
      lengthCm: Number(lengthCm),
      breadthCm: Number(breadthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
    });

    const trackingNumber = generateTrackingNumber();

    // Create Order and Initial Tracking Event
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          trackingNumber,
          customerId,
          orderType,
          paymentType,
          status: "CREATED",
          pickupAddress,
          pickupPincode,
          pickupArea,
          pickupCity,
          pickupZoneId,
          dropAddress,
          dropPincode,
          dropArea,
          dropCity,
          dropZoneId,
          lengthCm: Number(lengthCm),
          breadthCm: Number(breadthCm),
          heightCm: Number(heightCm),
          actualWeightKg: Number(actualWeightKg),
          volumetricWeightKg: pricing.volumetricWeightKg,
          chargeableWeightKg: pricing.chargeableWeightKg,
          zoneType: pricing.zoneType,
          baseCharge: pricing.baseCharge,
          weightCharge: pricing.weightCharge,
          codSurcharge: pricing.codSurcharge,
          totalAmount: pricing.totalAmount,
        },
      });

      // Initial tracking event
      await tx.trackingEvent.create({
        data: {
          orderId: newOrder.id,
          previousStatus: null,
          newStatus: "CREATED",
          actorId: user.userId,
          actorRole: user.role,
          location: `${pickupArea || pickupCity} Hub`,
          notes: `Order created. Chargeable weight: ${pricing.chargeableWeightKg}kg (${pricing.zoneType}-Zone, ₹${pricing.totalAmount})`,
        },
      });

      // First delivery attempt placeholder
      await tx.deliveryAttempt.create({
        data: {
          orderId: newOrder.id,
          attemptNumber: 1,
          status: "CREATED",
          notes: "Initial delivery attempt initialized.",
        },
      });

      return newOrder;
    });

    // Auto-assign nearest available agent immediately
    const assignment = await autoAssignOrder(order.id, user.userId, "SYSTEM");

    // Dispatch notification
    await sendNotification({
      userId: customerId,
      orderId: order.id,
      title: "Order Placed Successfully",
      message: `Your delivery order #${trackingNumber} has been confirmed for ₹${pricing.totalAmount}. Tracking is now live!`,
      type: "ORDER_CREATED",
    });

    // Return created order with relations
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        pickupZone: true,
        dropZone: true,
        customer: true,
        trackingEvents: { orderBy: { timestamp: "asc" } },
        attempts: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: finalOrder,
      assignment,
      pricing,
    });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create delivery order" }, { status: 500 });
  }
}
