// src/app/api/agents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, currentZoneId, vehicleType, vehicleNumber } = await req.json();

    const agent = await prisma.agentProfile.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Role check: Only admin or the agent themselves can update status
    if (user.role !== "ADMIN" && agent.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.agentProfile.update({
      where: { id },
      data: {
        status: status || undefined,
        currentZoneId: currentZoneId !== undefined ? currentZoneId : undefined,
        vehicleType: vehicleType || undefined,
        vehicleNumber: vehicleNumber || undefined,
      },
      include: {
        user: { select: { name: true, phone: true } },
        currentZone: true,
      },
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update agent" }, { status: 500 });
  }
}
