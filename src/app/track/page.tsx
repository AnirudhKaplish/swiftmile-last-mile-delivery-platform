// src/app/track/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Truck, ArrowRight, ShieldCheck, MapPin } from "lucide-react";

export default function TrackSearchPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    router.push(`/track/${encodeURIComponent(trackingNumber.trim())}`);
  };

  const sampleNumbers = [
    "TRK-IN-2026-10492",
    "TRK-IN-2026-88319",
    "TRK-IN-2026-90214",
    "TRK-IN-2026-64218",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
          <Truck className="w-8 h-8" />
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Your Delivery Shipment
        </h1>
        <p className="text-slate-500 text-sm">
          Enter your 16-character SwiftMile tracking ID to view live location, delivery agent details, and milestone timestamps.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-8 flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="e.g. TRK-IN-2026-10492"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono font-semibold"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            Track <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Sample Numbers */}
        <div className="pt-4">
          <span className="text-xs text-slate-400 font-medium">Try sample seeded tracking IDs:</span>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {sampleNumbers.map((num) => (
              <button
                key={num}
                onClick={() => {
                  setTrackingNumber(num);
                  router.push(`/track/${num}`);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-mono transition cursor-pointer border border-slate-200"
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Verified Courier Fleet</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Every package is handled by a background-verified delivery executive.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <MapPin className="w-5 h-5 text-emerald-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Zone-Optimized Speed</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Deterministic routing algorithms guarantee fast last-mile fulfillment.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <Truck className="w-5 h-5 text-indigo-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">1-Click Rescheduling</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Seamlessly choose a new delivery slot if you were unavailable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
