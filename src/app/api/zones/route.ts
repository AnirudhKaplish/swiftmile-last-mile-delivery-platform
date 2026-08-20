// src/app/api/zones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        areas: true,
        agents: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
        _count: {
          select: {
            pickupOrders: true,
            dropOrders: true,
            agents: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch zones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { code, name, city = "Bengaluru", state = "Karnataka", areas } = await req.json();

    if (!code || !name) {
      return NextResponse.json({ error: "Zone code and name are required." }, { status: 400 });
    }

    const existing = await prisma.zone.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: `Zone with code '${code}' already exists.` }, { status: 400 });
    }

    const newZone = await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.create({
        data: {
          code: code.toUpperCase().trim(),
          name,
          city,
          state,
          active: true,
        },
      });

      if (Array.isArray(areas) && areas.length > 0) {
        for (const item of areas) {
          if (item.areaName && item.pincode) {
            await tx.zoneArea.create({
              data: {
                zoneId: zone.id,
                areaName: item.areaName.trim(),
                pincode: item.pincode.trim(),
              },
            });
          }
        }
      }

      return zone;
    });

    return NextResponse.json({ success: true, zone: newZone });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create zone" }, { status: 500 });
  }
}
