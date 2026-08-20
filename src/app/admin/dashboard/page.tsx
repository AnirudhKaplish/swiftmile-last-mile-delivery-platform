// src/app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Users,
  BarChart3,
  TrendingUp,
  MapPin,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/dashboard");
      const d = await res.json();
      if (d.success) setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-xs font-mono" suppressHydrationWarning>
        Loading operations telemetry...
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in" suppressHydrationWarning>
      {/* Operations Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Control Tower & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fleet utilization, SLA delivery fulfillment, and revenue metrics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/rate-cards"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            Rate Cards
          </Link>
          <Link
            href="/admin/orders"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition"
          >
            Order Console
          </Link>
        </div>
      </div>

      {/* 6 Key Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Volume</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">{stats.totalOrders || 0}</p>
          <span className="text-[10px] text-slate-400">Total consignments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">In Transit</span>
          <p className="text-xl font-black text-blue-700 mt-1 font-mono">{stats.activeDeliveries || 0}</p>
          <span className="text-[10px] text-blue-600">Active on route</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">Fulfilled</span>
          <p className="text-xl font-black text-emerald-700 mt-1 font-mono">{stats.deliveredToday || 0}</p>
          <span className="text-[10px] text-emerald-600">Delivered</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider block">Exceptions</span>
          <p className="text-xl font-black text-rose-700 mt-1 font-mono">{stats.failedDeliveries || 0}</p>
          <span className="text-[10px] text-rose-600">Failed / Reschedule</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Gross Revenue</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">
            ₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString("en-IN") : "0"}
          </p>
          <span className="text-[10px] text-slate-400">Billed INR</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Available Fleet</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.availableAgentsCount || 0} / {stats.totalAgentsCount || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">{stats.successRate || 100}% SLA</span>
        </div>
      </div>

      {/* Analytics Breakdown Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Lifecycle Status Breakdown
            </h3>
            <span className="text-[11px] font-mono text-slate-400">{stats.totalOrders} total</span>
          </div>

          <div className="space-y-3 pt-1">
            {(charts.statusDistribution || []).map((item: any) => {
              const pct = stats.totalOrders > 0 ? Math.round((item.count / stats.totalOrders) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.status.replace(/_/g, " ")}</span>
                    <span className="text-slate-900 font-mono font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === "DELIVERED"
                          ? "bg-emerald-600"
                          : item.status === "FAILED"
                          ? "bg-rose-600"
                          : item.status === "OUT_FOR_DELIVERY"
                          ? "bg-amber-500"
                          : "bg-slate-900"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Geographic Origin Volume
            </h3>
            <Link href="/admin/zones" className="text-[11px] font-semibold text-blue-600 hover:text-blue-800">
              Zones Config →
            </Link>
          </div>

          <div className="space-y-3 pt-1">
            {(charts.zoneDistribution || []).map((item: any) => {
              const pct = stats.totalOrders > 0 ? Math.round((item.count / stats.totalOrders) * 100) : 0;
              return (
                <div key={item.zoneId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.zoneName}</span>
                    <span className="text-slate-900 font-mono font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-800"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Dispatches Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Dispatches Feed</h3>
            <p className="text-[11px] text-slate-500">Real-time last-mile operational stream</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            All Orders <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] font-mono tracking-wider">
                <th className="py-2.5 px-4">Waybill</th>
                <th className="py-2.5 px-4">Client</th>
                <th className="py-2.5 px-4">Origin Hub</th>
                <th className="py-2.5 px-4">Destination Hub</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    {order.trackingNumber}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {order.customer?.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {order.pickupZone?.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {order.dropZone?.name}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/track/${order.trackingNumber}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Audit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
