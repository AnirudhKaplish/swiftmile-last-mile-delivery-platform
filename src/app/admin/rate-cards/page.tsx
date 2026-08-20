// src/app/admin/rate-cards/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Edit2,
  Save,
  Calculator,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Layers,
} from "lucide-react";
import { PriceBreakdownCard } from "@/components/ui/PriceBreakdownCard";

export default function AdminRateCardsPage() {
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Sandbox simulation state
  const [simL, setSimL] = useState(30);
  const [simB, setSimB] = useState(20);
  const [simH, setSimH] = useState(15);
  const [simWt, setSimWt] = useState(2.5);
  const [simType, setSimType] = useState<"B2C" | "B2B">("B2C");
  const [simZoneType, setSimZoneType] = useState<"INTRA" | "INTER">("INTRA");
  const [simPay, setSimPay] = useState<"PREPAID" | "COD">("PREPAID");
  const [simResult, setSimResult] = useState<any>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rate-cards");
      const data = await res.json();
      if (data.rateCards) {
        setRateCards(data.rateCards);
        if (!editingCard && data.rateCards.length > 0) {
          setEditingCard(JSON.parse(JSON.stringify(data.rateCards[0])));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setSaving(true);
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/rate-cards/${editingCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCard),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Rate card '${editingCard.name}' updated successfully in database!`);
        fetchCards();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Failed to update rate card");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Run live simulation whenever inputs or active cards change
  useEffect(() => {
    const card = rateCards.find((c) => c.orderType === simType) || editingCard;
    if (!card) return;

    const vol = Math.round(((simL * simB * simH) / 5000) * 100) / 100;
    const chg = Math.max(simWt, vol);
    const baseWt = card.baseWeightKg || 1.0;
    const addl = Math.max(0, Math.round((chg - baseWt) * 100) / 100);

    const baseCharge = simZoneType === "INTRA" ? card.intraZoneBaseRate : card.interZoneBaseRate;
    const extraRate = simZoneType === "INTRA" ? card.intraZoneExtraPerKg : card.interZoneExtraPerKg;
    const weightCharge = Math.round(addl * extraRate * 100) / 100;
    const codSurcharge = simPay === "COD" ? card.codSurcharge : 0;
    const total = Math.round((baseCharge + weightCharge + codSurcharge) * 100) / 100;

    setSimResult({
      actualWeightKg: simWt,
      volumetricWeightKg: vol,
      chargeableWeightKg: chg,
      baseWeightKg: baseWt,
      baseCharge,
      weightCharge,
      extraRatePerKg: extraRate,
      codSurcharge,
      totalAmount: total,
      zoneType: simZoneType,
      rateCardName: card.name,
    });
  }, [simL, simB, simH, simWt, simType, simZoneType, simPay, editingCard, rateCards]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rate Cards & Pricing Engine</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dynamic Indian rupee (₹ INR) intra/inter zone pricing rules stored in PostgreSQL/Prisma
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2-Column Layout: Rate Card Editor & Live Rate Simulation Sandbox */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Rate Card Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Select Rate Card to Edit
              </h2>
              <div className="flex gap-1.5">
                {rateCards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setEditingCard(JSON.parse(JSON.stringify(c)))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      editingCard?.id === c.id
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {c.orderType} Card
                  </button>
                ))}
              </div>
            </div>

            {editingCard && (
              <form onSubmit={handleSaveCard} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Card Name</label>
                  <input
                    type="text"
                    value={editingCard.name}
                    onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                    Intra-Zone Rates (Same Zone Pickup & Drop)
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Base Price (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={editingCard.intraZoneBaseRate}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            intraZoneBaseRate: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Extra Rate (₹ / kg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={editingCard.intraZoneExtraPerKg}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            intraZoneExtraPerKg: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                    Inter-Zone Rates (Cross Zone Pickup & Drop)
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Base Price (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={editingCard.interZoneBaseRate}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            interZoneBaseRate: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Extra Rate (₹ / kg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={editingCard.interZoneExtraPerKg}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            interZoneExtraPerKg: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Included Base Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingCard.baseWeightKg}
                      onChange={(e) =>
                        setEditingCard({
                          ...editingCard,
                          baseWeightKg: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      COD Flat Surcharge (₹ INR)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={editingCard.codSurcharge}
                      onChange={(e) =>
                        setEditingCard({
                          ...editingCard,
                          codSurcharge: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving Changes..." : "Save Rate Card Config"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Live Rate Simulation Sandbox */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Live Rate Simulation Sandbox
              </h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Real-Time Calculation
              </span>
            </div>

            {/* Sandbox Inputs */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Length (cm)</label>
                <input
                  type="number"
                  value={simL}
                  onChange={(e) => setSimL(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Breadth (cm)</label>
                <input
                  type="number"
                  value={simB}
                  onChange={(e) => setSimB(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={simH}
                  onChange={(e) => setSimH(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Actual Wt (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simWt}
                  onChange={(e) => setSimWt(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Order Type</label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="B2C">B2C Retail</option>
                  <option value="B2B">B2B Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zone Type</label>
                <select
                  value={simZoneType}
                  onChange={(e) => setSimZoneType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="INTRA">INTRA-Zone</option>
                  <option value="INTER">INTER-Zone</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSimPay("PREPAID")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  simPay === "PREPAID"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Prepaid Mode
              </button>
              <button
                type="button"
                onClick={() => setSimPay("COD")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  simPay === "COD"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Cash on Delivery (COD)
              </button>
            </div>

            {/* Calculated Breakdown Display */}
            {simResult && (
              <PriceBreakdownCard
                actualWeightKg={simResult.actualWeightKg}
                volumetricWeightKg={simResult.volumetricWeightKg}
                chargeableWeightKg={simResult.chargeableWeightKg}
                lengthCm={simL}
                breadthCm={simB}
                heightCm={simH}
                pickupZoneName={simZoneType === "INTRA" ? "Zone A" : "Zone A (South)"}
                dropZoneName={simZoneType === "INTRA" ? "Zone A" : "Zone B (East)"}
                zoneType={simResult.zoneType}
                orderType={simType}
                paymentType={simPay}
                baseCharge={simResult.baseCharge}
                baseWeightKg={simResult.baseWeightKg}
                weightCharge={simResult.weightCharge}
                extraRatePerKg={simResult.extraRatePerKg}
                codSurcharge={simResult.codSurcharge}
                totalAmount={simResult.totalAmount}
                rateCardName={simResult.rateCardName}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
