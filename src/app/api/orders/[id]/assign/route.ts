// src/app/api/orders/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { manualAssignOrder } from "@/lib/services/assignment-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required for assignment" }, { status: 400 });
    }

    const result = await manualAssignOrder(id, agentId, user.userId, "ADMIN");
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to assign agent" }, { status: 400 });
  }
}
