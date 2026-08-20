// src/app/api/rate-cards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const rateCards = await prisma.rateCard.findMany({
      orderBy: { orderType: "asc" },
    });
    return NextResponse.json({ success: true, rateCards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch rate cards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin authorization required" }, { status: 403 });
    }

    const {
      name,
      orderType,
      intraZoneBaseRate,
      intraZoneExtraPerKg,
      interZoneBaseRate,
      interZoneExtraPerKg,
      baseWeightKg = 1.0,
      codSurcharge = 40.0,
    } = await req.json();

    if (!name || !orderType) {
      return NextResponse.json({ error: "Rate card name and orderType (B2B/B2C) are required" }, { status: 400 });
    }

    const newCard = await prisma.rateCard.create({
      data: {
        name,
        orderType,
        intraZoneBaseRate: Number(intraZoneBaseRate),
        intraZoneExtraPerKg: Number(intraZoneExtraPerKg),
        interZoneBaseRate: Number(interZoneBaseRate),
        interZoneExtraPerKg: Number(interZoneExtraPerKg),
        baseWeightKg: Number(baseWeightKg),
        codSurcharge: Number(codSurcharge),
        active: true,
      },
    });

    return NextResponse.json({ success: true, rateCard: newCard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create rate card" }, { status: 500 });
  }
}
