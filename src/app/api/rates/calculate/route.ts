// src/app/api/rates/calculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { calculateDeliveryPrice } from "@/lib/services/rate-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderType = "B2C",
      paymentType = "PREPAID",
      pickupZoneId,
      dropZoneId,
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
    } = body;

    if (!pickupZoneId || !dropZoneId) {
      return NextResponse.json(
        { error: "Pickup and Drop zones must be identified before calculating rate." },
        { status: 400 }
      );
    }

    if (!lengthCm || !breadthCm || !heightCm || !actualWeightKg) {
      return NextResponse.json(
        { error: "Package dimensions (L, B, H in cm) and actual weight (kg) are required." },
        { status: 400 }
      );
    }

    const result = await calculateDeliveryPrice({
      orderType: orderType === "B2B" ? "B2B" : "B2C",
      paymentType: paymentType === "COD" ? "COD" : "PREPAID",
      pickupZoneId,
      dropZoneId,
      lengthCm: Number(lengthCm),
      breadthCm: Number(breadthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Rate calculation API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate delivery price" },
      { status: 400 }
    );
  }
}
