// src/components/ui/PriceBreakdownCard.tsx
import React from "react";
import { Calculator, CheckCircle, Info, Sparkles } from "lucide-react";

interface PriceBreakdownCardProps {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  pickupZoneName?: string;
  dropZoneName?: string;
  zoneType: "INTRA" | "INTER" | string;
  orderType: "B2B" | "B2C" | string;
  paymentType: "PREPAID" | "COD" | string;
  baseCharge: number;
  baseWeightKg?: number;
  weightCharge: number;
  extraRatePerKg?: number;
  codSurcharge: number;
  totalAmount: number;
  rateCardName?: string;
}

export function PriceBreakdownCard({
  actualWeightKg,
  volumetricWeightKg,
  chargeableWeightKg,
  lengthCm,
  breadthCm,
  heightCm,
  pickupZoneName,
  dropZoneName,
  zoneType,
  orderType,
  paymentType,
  baseCharge,
  baseWeightKg = 1.0,
  weightCharge,
  extraRatePerKg,
  codSurcharge,
  totalAmount,
  rateCardName,
}: PriceBreakdownCardProps) {
  const isVolumetricHigher = volumetricWeightKg > actualWeightKg;
  const additionalWeight = Math.max(0, Math.round((chargeableWeightKg - baseWeightKg) * 100) / 100);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Transparent Pricing Calculation
          </h4>
        </div>
        {rateCardName && (
          <span className="text-[11px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
            {rateCardName}
          </span>
        )}
      </div>

      {/* Weight Computation Formula Box */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span>Actual Physical Weight:</span>
          <span className="font-semibold text-slate-900 font-mono">{actualWeightKg} kg</span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span className="flex items-center gap-1">
            Volumetric Weight:
            <span className="text-[10px] text-slate-400 font-mono">({lengthCm}×{breadthCm}×{heightCm} ÷ 5000)</span>
          </span>
          <span className="font-semibold text-slate-900 font-mono">{volumetricWeightKg} kg</span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-medium">
          <span className="text-slate-800 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Billed Chargeable Weight:
          </span>
          <span className="font-bold text-blue-700 text-sm font-mono">
            {chargeableWeightKg} kg
            {isVolumetricHigher && (
              <span className="text-[10px] text-amber-600 font-normal ml-1">(Volumetric applied)</span>
            )}
          </span>
        </div>
      </div>

      {/* Itemized Cost Breakdown */}
      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex justify-between items-center">
          <span>
            Route & Zone: <strong>{pickupZoneName || "Origin"}</strong> → <strong>{dropZoneName || "Destination"}</strong>
          </span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800 uppercase">
            {zoneType}-ZONE ({orderType})
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span>Base Delivery Rate (up to {baseWeightKg} kg):</span>
          <span className="font-semibold text-slate-800 font-mono">₹{baseCharge.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>
            Additional Weight ({additionalWeight} kg {extraRatePerKg ? `@ ₹${extraRatePerKg}/kg` : ""}):
          </span>
          <span className="font-semibold text-slate-800 font-mono">₹{weightCharge.toFixed(2)}</span>
        </div>

        {paymentType === "COD" ? (
          <div className="flex justify-between items-center text-amber-800 bg-amber-50 px-2 py-1 rounded">
            <span>Cash on Delivery (COD) Handling Surcharge:</span>
            <span className="font-bold font-mono">+₹{codSurcharge.toFixed(2)}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-emerald-700">
            <span>Prepaid Discount / No COD Surcharge:</span>
            <span className="font-mono">₹0.00</span>
          </div>
        )}
      </div>

      {/* Final Total Amount in INR */}
      <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
        <div>
          <span className="text-xs text-slate-500 font-medium">Total Payable Amount</span>
          <p className="text-[10px] text-slate-400">Inclusive of all logistics surcharges</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            ₹{totalAmount.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 block font-medium">INR</span>
        </div>
      </div>
    </div>
  );
}
