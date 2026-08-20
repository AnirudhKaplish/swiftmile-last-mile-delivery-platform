// src/app/customer/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Plus,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const activeDeliveries = orders.filter((o) =>
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const pendingOrders = orders.filter((o) => o.status === "CREATED");
  const failedOrders = orders.filter((o) => o.status === "FAILED");

  const latestActive = activeDeliveries[0] || orders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shipment Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of your active consignments and dispatch history
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <Search className="w-3.5 h-3.5" /> Track Waybill
          </Link>
          <Link
            href="/customer/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Book Shipment
          </Link>
        </div>
      </div>

      {/* Action Required / Failed Deliveries Banner */}
      {failedOrders.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900">
                {failedOrders.length} Delivery Exception{failedOrders.length > 1 ? "s" : ""} Requiring Attention
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Reschedule a preferred date or time slot to initiate a secondary delivery attempt.
              </p>
            </div>
          </div>
          <Link
            href={`/customer/track/${failedOrders[0].trackingNumber}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-2xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reschedule Attempt
          </Link>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Transit</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeDeliveries.length}</p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Active on delivery route</span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{deliveredOrders.length}</p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Successfully completed</span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Dispatch</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingOrders.length}</p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Awaiting courier pickup</span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{failedOrders.length}</p>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Requires action</span>
        </div>
      </div>

      {/* Featured Active Shipment Overview */}
      {latestActive && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-slate-900">
                Waybill #{latestActive.trackingNumber}
              </span>
              <StatusBadge status={latestActive.status} size="sm" />
            </div>
            <Link
              href={`/customer/track/${latestActive.trackingNumber}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              View Full Timeline <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-5 text-xs">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Origin</span>
              <p className="font-semibold text-slate-900 mt-0.5">{latestActive.pickupAddress}</p>
              <p className="text-[11px] text-slate-500">{latestActive.pickupZone?.name}</p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Destination</span>
              <p className="font-semibold text-slate-900 mt-0.5">{latestActive.dropAddress}</p>
              <p className="text-[11px] text-slate-500">{latestActive.dropZone?.name}</p>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Consignment Specs</span>
              <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                {latestActive.chargeableWeightKg} kg • ₹{latestActive.totalAmount.toFixed(2)} ({latestActive.paymentType})
              </p>
              <p className="text-[11px] text-slate-500">
                Courier: {latestActive.assignedAgentName || "Auto-assigning..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Deliveries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Consignments</h3>
            <p className="text-[11px] text-slate-500">Latest shipments linked to your account</p>
          </div>
          <Link
            href="/customer/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            All Shipments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] font-mono tracking-wider">
                <th className="py-2.5 px-4">Waybill Number</th>
                <th className="py-2.5 px-4">Route</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Loading consignments...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {order.trackingNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span>{order.pickupArea || "Origin"}</span> → <span>{order.dropArea || "Destination"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px] font-mono">
                        {order.orderType} • {order.paymentType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/customer/track/${order.trackingNumber}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Track <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
