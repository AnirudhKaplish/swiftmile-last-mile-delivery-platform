// src/app/api/orders/[id]/reschedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { rescheduleDelivery } from "@/lib/services/reschedule-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    const { id } = await params;
    const body = await req.json();
    const { rescheduledDate, rescheduleSlot, rescheduleReason } = body;

    if (!rescheduledDate) {
      return NextResponse.json({ error: "A new delivery date is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization: If customer is logged in, ensure they own the order
    if (user && user.role === "CUSTOMER" && order.customerId !== user.userId) {
      return NextResponse.json({ error: "Forbidden. You can only reschedule your own orders." }, { status: 403 });
    }

    const updatedOrder = await rescheduleDelivery({
      orderId: id,
      rescheduledDate,
      rescheduleSlot,
      rescheduleReason,
      actorId: user?.userId,
      actorRole: user?.role || "CUSTOMER",
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Reschedule Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reschedule order" }, { status: 400 });
  }
}
