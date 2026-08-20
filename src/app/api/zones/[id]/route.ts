// src/app/api/zones/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        areas: true,
        agents: { include: { user: true } },
      },
    });

    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, zone });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch zone" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const { name, city, state, active, areas } = await req.json();

    const updatedZone = await prisma.$transaction(async (tx) => {
      const zone = await tx.zone.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          city: city !== undefined ? city : undefined,
          state: state !== undefined ? state : undefined,
          active: active !== undefined ? active : undefined,
        },
      });

      if (Array.isArray(areas)) {
        // Clear old areas and re-insert
        await tx.zoneArea.deleteMany({ where: { zoneId: id } });
        for (const item of areas) {
          if (item.areaName && item.pincode) {
            await tx.zoneArea.create({
              data: {
                zoneId: id,
                areaName: item.areaName.trim(),
                pincode: item.pincode.trim(),
              },
            });
          }
        }
      }

      return zone;
    });

    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update zone" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    // Toggle active status to preserve historical orders
    const zone = await prisma.zone.findUnique({ where: { id } });
    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

    const updated = await prisma.zone.update({
      where: { id },
      data: { active: !zone.active },
    });

    return NextResponse.json({
      success: true,
      message: `Zone ${updated.name} ${updated.active ? "activated" : "deactivated"} successfully.`,
      zone: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update zone" }, { status: 500 });
  }
}
