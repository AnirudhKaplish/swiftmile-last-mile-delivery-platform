// src/app/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calculator,
  RotateCcw,
  CheckCircle2,
  Building2,
  UserCheck,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { loginAsDemo } = useAuth();
  const [quickTracking, setQuickTracking] = useState("");

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTracking.trim()) return;
    router.push(`/track/${encodeURIComponent(quickTracking.trim())}`);
  };

  return (
    <div className="space-y-16 py-10 sm:py-16 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Enterprise Platform Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 sm:p-14 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Dispatch Engine • SLA 99.4%
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-100">
            Last-Mile Delivery OS for Modern Commerce
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
            Automate rate calculations, zone-level routing, courier dispatch, and doorstep exception handling on a single unified platform.
          </p>

          {/* Quick Tracking Search Bar */}
          <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row gap-2.5 pt-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Consignment or Tracking ID (e.g. TRK-IN-2026-10492)..."
                value={quickTracking}
                onChange={(e) => setQuickTracking(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Track Consignment <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SI Metric Units (cm / kg)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> INR (₹) Dynamic Billing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automated Fleet Assignment
            </span>
          </div>
        </div>

        {/* Minimalist Watermark */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-8 translate-y-8">
          <Truck className="w-80 h-80 text-white" />
        </div>
      </section>

      {/* Role-Based Workspaces Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dedicated Workspaces</h2>
            <p className="text-xs text-slate-500 mt-0.5">Instant one-click access to each operational persona</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Customer Workspace */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Client Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Self-serve booking wizard, live dimensional price quotes, verified address zone mapping, and real-time delivery timelines with 1-click slot rescheduling.
              </p>
            </div>

            <button
              onClick={() => loginAsDemo("CUSTOMER")}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              Open Client Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Courier Dispatch Workspace */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Field Operations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mobile-optimized courier queue, doorstep status milestones (`PICKED_UP` $\rightarrow$ `DELIVERED`), COD cash collection indicators, and failure exception logging.
              </p>
            </div>

            <button
              onClick={() => loginAsDemo("DELIVERY_AGENT")}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              Open Field Operations <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Admin Operations Control */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col justify-between space-y-6 hover:border-slate-300 transition">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Control Tower</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Centralized dispatch intelligence, multi-criteria order filters, manual and automated courier assignment, zone pincode CRUD, and dynamic rate-card configurations.
              </p>
            </div>

            <button
              onClick={() => loginAsDemo("ADMIN")}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              Open Control Tower <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities Grid */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xs space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Capabilities</h2>
          <p className="text-xs text-slate-500 mt-0.5">Standardized architecture engineered for high-volume last-mile logistics</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Volumetric Engine</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calculates $(L \times B \times H)/5000$ in centimeters, applying the greater of physical or dimensional weight against base and incremental rate cards.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Deterministic Assignment</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scores available fleet couriers by pickup zone proximity, current active load balance, and deterministic tie-breakers with complete audit reasoning.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Exception & Rescheduling</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Captures doorstep failure reasons, relieves courier capacity, and allows customers to reschedule for convenient delivery slots without losing attempt history.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Immutable Audit Trail</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enforces a strict state machine lifecycle where every transition, courier assignment, and administrative override is permanently recorded.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
