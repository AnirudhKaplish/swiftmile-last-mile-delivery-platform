// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/services/order-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Role-based authorization: Customers cannot directly change order delivery status
    if (user.role === "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden. Customers cannot directly modify delivery status. Use rescheduling for failed orders." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes, failureReason, failureNotes, location } = body;

    if (!status) {
      return NextResponse.json({ error: "New status is required" }, { status: 400 });
    }

    // If agent, verify assignment
    if (user.role === "DELIVERY_AGENT") {
      const agentProfile = await prisma.agentProfile.findUnique({
        where: { userId: user.userId },
      });

      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.assignedAgentId && agentProfile && order.assignedAgentId !== agentProfile.id) {
        return NextResponse.json(
          { error: "Forbidden. This delivery is assigned to another courier executive." },
          { status: 403 }
        );
      }
    }

    if (status === "FAILED" && !failureReason) {
      return NextResponse.json(
        { error: "A failure reason is mandatory when marking a delivery as Failed." },
        { status: 400 }
      );
    }

    const updatedOrder = await updateOrderStatus({
      orderId: id,
      newStatus: status,
      actorId: user.userId,
      actorRole: user.role,
      location,
      notes,
      failureReason,
      failureNotes,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Update Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update order status" },
      { status: 400 }
    );
  }
}
