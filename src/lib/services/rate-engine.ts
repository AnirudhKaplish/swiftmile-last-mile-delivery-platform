// src/lib/services/rate-engine.ts
import { prisma } from "../prisma";

export interface RateCalculationInput {
  orderType: "B2B" | "B2C";
  paymentType: "PREPAID" | "COD";
  pickupZoneId: string;
  dropZoneId: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  actualWeightKg: number;
}

export interface RateCalculationResult {
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  actualWeightKg: number;
  baseWeightKg: number;
  additionalWeightKg: number;
  zoneType: "INTRA" | "INTER";
  rateCardName: string;
  baseCharge: number;
  weightCharge: number;
  extraRatePerKg: number;
  codSurcharge: number;
  totalAmount: number;
  breakdown: {
    formulaVolumetric: string;
    formulaChargeable: string;
    formulaTotal: string;
  };
}

/**
 * Calculate volumetric weight using the standard courier volumetric formula: (L x B x H) / 5000
 * Units: Dimensions in cm, Weight in kg
 */
export function calculateVolumetricWeight(
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0) return 0;
  const vol = (lengthCm * breadthCm * heightCm) / 5000;
  return Math.round(vol * 100) / 100;
}

/**
 * Chargeable weight is the higher of actual weight and volumetric weight.
 */
export function calculateChargeableWeight(
  actualWeightKg: number,
  volumetricWeightKg: number
): number {
  return Math.max(
    Math.round(actualWeightKg * 100) / 100,
    Math.round(volumetricWeightKg * 100) / 100
  );
}

/**
 * Executes dynamic rate calculation from active database RateCards.
 */
export async function calculateDeliveryPrice(
  input: RateCalculationInput
): Promise<RateCalculationResult> {
  const {
    orderType,
    paymentType,
    pickupZoneId,
    dropZoneId,
    lengthCm,
    breadthCm,
    heightCm,
    actualWeightKg,
  } = input;

  if (actualWeightKg <= 0) {
    throw new Error("Actual weight must be greater than 0 kg");
  }

  // 1. Calculate Volumetric & Chargeable Weight
  const volumetricWeightKg = calculateVolumetricWeight(lengthCm, breadthCm, heightCm);
  const chargeableWeightKg = calculateChargeableWeight(actualWeightKg, volumetricWeightKg);

  // 2. Determine Zone Type (Intra vs Inter)
  const zoneType: "INTRA" | "INTER" = pickupZoneId === dropZoneId ? "INTRA" : "INTER";

  // 3. Fetch active RateCard for orderType from DB
  let rateCard = await prisma.rateCard.findFirst({
    where: {
      orderType: orderType,
      active: true,
    },
  });

  // Fallback rate card if none exists in DB
  if (!rateCard) {
    if (orderType === "B2B") {
      rateCard = {
        id: "default-b2b",
        name: "Standard B2B Commercial Card",
        orderType: "B2B",
        intraZoneBaseRate: 80.0,
        intraZoneExtraPerKg: 18.0,
        interZoneBaseRate: 140.0,
        interZoneExtraPerKg: 25.0,
        baseWeightKg: 2.0,
        codSurcharge: 50.0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      rateCard = {
        id: "default-b2c",
        name: "Standard B2C Retail Card",
        orderType: "B2C",
        intraZoneBaseRate: 50.0,
        intraZoneExtraPerKg: 25.0,
        interZoneBaseRate: 90.0,
        interZoneExtraPerKg: 35.0,
        baseWeightKg: 1.0,
        codSurcharge: 40.0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // 4. Calculate Rate Components
  const baseWeightKg = rateCard.baseWeightKg || 1.0;
  const additionalWeightKg = Math.max(0, Math.round((chargeableWeightKg - baseWeightKg) * 100) / 100);

  const baseCharge = zoneType === "INTRA" ? rateCard.intraZoneBaseRate : rateCard.interZoneBaseRate;
  const extraRatePerKg = zoneType === "INTRA" ? rateCard.intraZoneExtraPerKg : rateCard.interZoneExtraPerKg;

  // Weight charge applies on additional weight above base weight
  const weightCharge = Math.round(additionalWeightKg * extraRatePerKg * 100) / 100;

  // COD Surcharge applies only when payment is COD (Flat ₹ amount)
  const codSurcharge = paymentType === "COD" ? rateCard.codSurcharge : 0.0;

  const totalAmount = Math.round((baseCharge + weightCharge + codSurcharge) * 100) / 100;

  return {
    volumetricWeightKg,
    chargeableWeightKg,
    actualWeightKg,
    baseWeightKg,
    additionalWeightKg,
    zoneType,
    rateCardName: rateCard.name,
    baseCharge,
    weightCharge,
    extraRatePerKg,
    codSurcharge,
    totalAmount,
    breakdown: {
      formulaVolumetric: `(${lengthCm} cm × ${breadthCm} cm × ${heightCm} cm) ÷ 5000 = ${volumetricWeightKg} kg`,
      formulaChargeable: `MAX(${actualWeightKg} kg actual, ${volumetricWeightKg} kg volumetric) = ${chargeableWeightKg} kg`,
      formulaTotal: `₹${baseCharge} (Base up to ${baseWeightKg}kg) + ₹${weightCharge} (Extra ${additionalWeightKg}kg @ ₹${extraRatePerKg}/kg) + ₹${codSurcharge} (COD Surcharge) = ₹${totalAmount}`,
    },
  };
}
