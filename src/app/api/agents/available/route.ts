// src/app/api/agents/available/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const availableAgents = await prisma.agentProfile.findMany({
      where: { status: "AVAILABLE" },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        currentZone: true,
      },
      orderBy: [{ activeDeliveries: "asc" }, { rating: "desc" }],
    });

    return NextResponse.json({ success: true, agents: availableAgents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch available agents" }, { status: 500 });
  }
}
