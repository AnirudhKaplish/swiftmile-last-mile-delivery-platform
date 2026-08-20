// src/app/api/orders/[id]/auto-assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { autoAssignOrder } from "@/lib/services/assignment-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "CUSTOMER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const result = await autoAssignOrder(id, user.userId, user.role);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Auto-assignment failed" }, { status: 400 });
  }
}
