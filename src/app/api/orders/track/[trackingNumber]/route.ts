// src/app/api/orders/track/[trackingNumber]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const cleanNumber = decodeURIComponent(trackingNumber).trim();

    const order = await prisma.order.findUnique({
      where: { trackingNumber: cleanNumber },
      include: {
        pickupZone: true,
        dropZone: true,
        attempts: { orderBy: { attemptNumber: "asc" } },
        trackingEvents: {
          orderBy: { timestamp: "asc" },
          select: {
            id: true,
            previousStatus: true,
            newStatus: true,
            timestamp: true,
            actorRole: true,
            location: true,
            notes: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Shipment not found with tracking number " + cleanNumber }, { status: 404 });
    }

    // Return sanitized public tracking details
    return NextResponse.json({
      success: true,
      shipment: {
        id: order.id,
        trackingNumber: order.trackingNumber,
        status: order.status,
        orderType: order.orderType,
        paymentType: order.paymentType,
        pickupArea: order.pickupArea || order.pickupCity,
        pickupCity: order.pickupCity,
        pickupPincode: order.pickupPincode,
        dropArea: order.dropArea || order.dropCity,
        dropCity: order.dropCity,
        dropPincode: order.dropPincode,
        pickupZone: order.pickupZone.name,
        dropZone: order.dropZone.name,
        actualWeightKg: order.actualWeightKg,
        chargeableWeightKg: order.chargeableWeightKg,
        assignedAgentName: order.assignedAgentName,
        assignedAgentPhone: order.assignedAgentPhone,
        failureReason: order.failureReason,
        failureNotes: order.failureNotes,
        rescheduledDate: order.rescheduledDate,
        rescheduleSlot: order.rescheduleSlot,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        timeline: order.trackingEvents,
        attempts: order.attempts,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch public tracking info" }, { status: 500 });
  }
}
