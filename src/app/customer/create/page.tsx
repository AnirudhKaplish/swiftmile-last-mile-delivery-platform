// src/app/customer/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PriceBreakdownCard } from "@/components/ui/PriceBreakdownCard";
import {
  MapPin,
  Package,
  Briefcase,
  CreditCard,
  Calculator,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Truck,
  Sparkles,
} from "lucide-react";

export default function CreateDeliveryWizard() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Addresses & Zones
  const [pickupAddress, setPickupAddress] = useState("Flat 402, Prestige Oasis, Koramangala 4th Block");
  const [pickupPincode, setPickupPincode] = useState("560034");
  const [pickupArea, setPickupArea] = useState("Koramangala");
  const [pickupZone, setPickupZone] = useState<any>(null);

  const [dropAddress, setDropAddress] = useState("Villa 12, Palm Meadows, Outer Ring Road, Whitefield");
  const [dropPincode, setDropPincode] = useState("560066");
  const [dropArea, setDropArea] = useState("Whitefield");
  const [dropZone, setDropZone] = useState<any>(null);

  // Step 2: Package Dimensions & Weight (Metric SI: cm, kg)
  const [lengthCm, setLengthCm] = useState(30);
  const [breadthCm, setBreadthCm] = useState(20);
  const [heightCm, setHeightCm] = useState(15);
  const [actualWeightKg, setActualWeightKg] = useState(1.5);

  // Step 3: Delivery Type
  const [orderType, setOrderType] = useState<"B2C" | "B2B">("B2C");

  // Step 4: Payment Type
  const [paymentType, setPaymentType] = useState<"PREPAID" | "COD">("PREPAID");

  // Step 5: Live Price Calculation Result
  const [pricing, setPricing] = useState<any>(null);

  // Step 6: Confirmed Order Output
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Volumetric calculation in cm
  const liveVolumetricWeight =
    lengthCm && breadthCm && heightCm
      ? Math.round(((lengthCm * breadthCm * heightCm) / 5000) * 100) / 100
      : 0;

  // Detect Pickup Zone on change & auto-populate area if returned by live API
  useEffect(() => {
    if (pickupPincode.length === 6 || pickupArea) {
      fetch("/api/zones/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pickupPincode, areaName: pickupArea, address: pickupAddress }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setPickupZone(d);
            if (d.areaName && !pickupArea) setPickupArea(d.areaName);
          }
        })
        .catch(() => {});
    }
  }, [pickupPincode, pickupArea, pickupAddress]);

  // Detect Drop Zone on change & auto-populate area if returned by live API
  useEffect(() => {
    if (dropPincode.length === 6 || dropArea) {
      fetch("/api/zones/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: dropPincode, areaName: dropArea, address: dropAddress }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setDropZone(d);
            if (d.areaName && !dropArea) setDropArea(d.areaName);
          }
        })
        .catch(() => {});
    }
  }, [dropPincode, dropArea, dropAddress]);

  // Fetch Pricing when reaching Step 5
  const fetchPriceQuote = async () => {
    if (!pickupZone?.zoneId || !dropZone?.zoneId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rates/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          paymentType,
          pickupZoneId: pickupZone.zoneId,
          dropZoneId: dropZone.zoneId,
          lengthCm,
          breadthCm,
          heightCm,
          actualWeightKg,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate quote");
      setPricing(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to compute price quote");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!pickupAddress || !pickupPincode) {
        setError("Please enter a valid pickup address and pincode.");
        return;
      }
      if (!dropAddress || !dropPincode) {
        setError("Please enter a valid drop destination address and pincode.");
        return;
      }
    }
    if (step === 2) {
      if (lengthCm <= 0 || breadthCm <= 0 || heightCm <= 0 || actualWeightKg <= 0) {
        setError("Please enter positive dimensions and actual weight in kg.");
        return;
      }
    }
    if (step === 4) {
      fetchPriceQuote();
    }
    setStep((s) => s + 1);
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType,
          paymentType,
          pickupAddress,
          pickupPincode,
          pickupArea,
          pickupCity: pickupZone?.city || "Bengaluru",
          pickupZoneId: pickupZone?.zoneId,
          dropAddress,
          dropPincode,
          dropArea,
          dropCity: dropZone?.city || "Bengaluru",
          dropZoneId: dropZone?.zoneId,
          lengthCm,
          breadthCm,
          heightCm,
          actualWeightKg,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place delivery order");

      setConfirmedOrder(data.order);
      setStep(6);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Wizard Title */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Consignment Dispatch</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter shipment routing parameters, volumetric measurements, and rate tier
        </p>
      </div>

      {/* Stepper Tabs */}
      {step < 6 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold">
            {[
              { num: 1, label: "Routing" },
              { num: 2, label: "Dimensions" },
              { num: 3, label: "Account Tier" },
              { num: 4, label: "Payment Mode" },
              { num: 5, label: "Quote & Confirmation" },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-2 ${
                  step === s.num
                    ? "text-blue-600 font-bold"
                    : step > s.num
                    ? "text-slate-800"
                    : "text-slate-400"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                    step === s.num
                      ? "bg-slate-900 text-white"
                      : step > s.num
                      ? "bg-slate-200 text-slate-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className="hidden sm:inline text-xs">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Addresses */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Origin & Destination Hubs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter 6-digit Indian postal pincodes. Geographic areas and hubs are resolved live.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Origin */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider block">
                Origin / Pickup
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <textarea
                  rows={2}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pincode (6-digit)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                    placeholder="e.g. 560034"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={pickupArea}
                    onChange={(e) => setPickupArea(e.target.value)}
                    placeholder="e.g. Koramangala"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              {pickupZone && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-center justify-between">
                  <span>Detected Hub:</span>
                  <strong className="font-bold">
                    {pickupZone.zoneName} {pickupZone.matchedBy === "LIVE_API" ? " (Live India Post)" : ""}
                  </strong>
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider block">
                Destination / Drop
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <textarea
                  rows={2}
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pincode (6-digit)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={dropPincode}
                    onChange={(e) => setDropPincode(e.target.value)}
                    placeholder="e.g. 560066"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={dropArea}
                    onChange={(e) => setDropArea(e.target.value)}
                    placeholder="e.g. Whitefield"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              {dropZone && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900 flex items-center justify-between">
                  <span>Detected Hub:</span>
                  <strong className="font-bold">
                    {dropZone.zoneName} {dropZone.matchedBy === "LIVE_API" ? " (Live India Post)" : ""}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              Continue to Package Specifications <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Package */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> Package Specifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dimensions in centimeters (cm) and actual weight in kilograms (kg)
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Length (cm)</label>
              <input
                type="number"
                min={1}
                value={lengthCm}
                onChange={(e) => setLengthCm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Breadth (cm)</label>
              <input
                type="number"
                min={1}
                value={breadthCm}
                onChange={(e) => setBreadthCm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                min={1}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Physical Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                value={actualWeightKg}
                onChange={(e) => setActualWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-blue-600" /> Volumetric Weight
              </span>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {liveVolumetricWeight} kg
              </p>
              <span className="text-[10px] text-slate-400 font-mono">
                ({lengthCm} × {breadthCm} × {heightCm}) ÷ 5000
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              Continue to Account Tier <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Tier */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" /> Service Tier Selection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Select retail consignment or enterprise commercial rate card.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOrderType("B2C")}
              className={`p-4.5 rounded-xl border text-left transition cursor-pointer ${
                orderType === "B2C"
                  ? "border-slate-900 bg-slate-50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono font-bold text-[10px] uppercase">
                B2C Standard
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Retail / Consumer Parcel</h3>
              <p className="text-xs text-slate-600 mt-1">
                Optimized for individual parcels, direct doorstep fulfillment, and e-commerce deliveries.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOrderType("B2B")}
              className={`p-4.5 rounded-xl border text-left transition cursor-pointer ${
                orderType === "B2B"
                  ? "border-slate-900 bg-slate-50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded font-mono font-bold text-[10px] uppercase">
                B2B Enterprise
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Commercial Cargo & Invoicing</h3>
              <p className="text-xs text-slate-600 mt-1">
                Higher base weight tier (2 kg included), reduced incremental weight rates, and commercial GST invoices.
              </p>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              Continue to Payment Mode <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Settlement & Collection Mode
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Select settlement method for courier dispatch.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentType("PREPAID")}
              className={`p-4.5 rounded-xl border text-left transition cursor-pointer ${
                paymentType === "PREPAID"
                  ? "border-slate-900 bg-slate-50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px] uppercase">
                Zero Surcharge
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Prepaid Settlement</h3>
              <p className="text-xs text-slate-600 mt-1">
                Settled digitally via Account Balance / UPI / Card. Standard handling.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentType("COD")}
              className={`p-4.5 rounded-xl border text-left transition cursor-pointer ${
                paymentType === "COD"
                  ? "border-slate-900 bg-slate-50 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold text-[10px] uppercase">
                Flat ₹40 Surcharge
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">Cash on Delivery (COD)</h3>
              <p className="text-xs text-slate-600 mt-1">
                Cash collected during doorstep drop. Configured cash-handling fee applied.
              </p>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              Compute Commercial Quote <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Breakdown */}
      {step === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> Commercial Quote Review
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized calculation based on active zone rate cards
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400 text-xs font-mono">
              Computing commercial logistics rates...
            </div>
          ) : pricing ? (
            <PriceBreakdownCard
              actualWeightKg={pricing.actualWeightKg}
              volumetricWeightKg={pricing.volumetricWeightKg}
              chargeableWeightKg={pricing.chargeableWeightKg}
              lengthCm={lengthCm}
              breadthCm={breadthCm}
              heightCm={heightCm}
              pickupZoneName={pickupZone?.zoneName}
              dropZoneName={dropZone?.zoneName}
              zoneType={pricing.zoneType}
              orderType={orderType}
              paymentType={paymentType}
              baseCharge={pricing.baseCharge}
              baseWeightKg={pricing.baseWeightKg}
              weightCharge={pricing.weightCharge}
              extraRatePerKg={pricing.extraRatePerKg}
              codSurcharge={pricing.codSurcharge}
              totalAmount={pricing.totalAmount}
              rateCardName={pricing.rateCardName}
            />
          ) : (
            <p className="text-xs text-rose-500">Failed to load price calculation.</p>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => setStep(4)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={handleConfirmOrder}
              disabled={loading || !pricing}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? "Confirming..." : `Authorize & Book Consignment (₹${pricing?.totalAmount.toFixed(2)})`}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Confirmed */}
      {step === 6 && confirmedOrder && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-6 animate-fade-in shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold text-[10px] uppercase">
              Consignment Booked
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Shipment Scheduled for Dispatch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Waybill: <strong>#{confirmedOrder.trackingNumber}</strong>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Origin Hub:</span>
              <span className="font-semibold text-slate-800">{confirmedOrder.pickupZone?.name || "Origin"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Destination Hub:</span>
              <span className="font-semibold text-slate-800">{confirmedOrder.dropZone?.name || "Destination"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Chargeable Weight:</span>
              <span className="font-semibold text-slate-800">{confirmedOrder.chargeableWeightKg} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Total Billed:</span>
              <span className="font-bold text-slate-900">₹{confirmedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => router.push(`/customer/track/${confirmedOrder.trackingNumber}`)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" /> View Consignment Tracking
            </button>
            <button
              onClick={() => router.push("/customer/dashboard")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
