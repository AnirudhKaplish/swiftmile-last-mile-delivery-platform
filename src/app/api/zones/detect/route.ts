// src/app/api/zones/detect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { detectZoneFromAddress } from "@/lib/services/zone-service";

export async function POST(req: NextRequest) {
  try {
    const { pincode, areaName, address } = await req.json();

    const detection = await detectZoneFromAddress(pincode, areaName, address);
    return NextResponse.json({ success: true, ...detection });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to detect zone" }, { status: 400 });
  }
}
