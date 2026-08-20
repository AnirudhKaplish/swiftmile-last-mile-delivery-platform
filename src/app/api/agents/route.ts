// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const agents = await prisma.agentProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
        assignments: {
          where: { active: true },
          include: {
            order: {
              select: {
                id: true,
                trackingNumber: true,
                status: true,
                pickupAddress: true,
                dropAddress: true,
                paymentType: true,
                totalAmount: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch agents" }, { status: 500 });
  }
}
