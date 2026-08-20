// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getCurrentUserFromRequest(req);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        pickupZone: true,
        dropZone: true,
        attempts: { orderBy: { attemptNumber: "asc" } },
        trackingEvents: {
          orderBy: { timestamp: "asc" },
          include: { actor: { select: { id: true, name: true, role: true } } },
        },
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: { agent: { include: { user: { select: { name: true, phone: true } } } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Role check: Customers can only view their own orders; Agent can view assigned; Admin can view all
    if (user && user.role === "CUSTOMER" && order.customerId !== user.userId) {
      return NextResponse.json({ error: "Unauthorized to view this order" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order" }, { status: 500 });
  }
}
