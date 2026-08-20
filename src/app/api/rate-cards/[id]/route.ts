// src/app/api/rate-cards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();

    const updated = await prisma.rateCard.update({
      where: { id },
      data: {
        name: data.name,
        intraZoneBaseRate: data.intraZoneBaseRate !== undefined ? Number(data.intraZoneBaseRate) : undefined,
        intraZoneExtraPerKg: data.intraZoneExtraPerKg !== undefined ? Number(data.intraZoneExtraPerKg) : undefined,
        interZoneBaseRate: data.interZoneBaseRate !== undefined ? Number(data.interZoneBaseRate) : undefined,
        interZoneExtraPerKg: data.interZoneExtraPerKg !== undefined ? Number(data.interZoneExtraPerKg) : undefined,
        baseWeightKg: data.baseWeightKg !== undefined ? Number(data.baseWeightKg) : undefined,
        codSurcharge: data.codSurcharge !== undefined ? Number(data.codSurcharge) : undefined,
        active: data.active !== undefined ? Boolean(data.active) : undefined,
      },
    });

    return NextResponse.json({ success: true, rateCard: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update rate card" }, { status: 500 });
  }
}
