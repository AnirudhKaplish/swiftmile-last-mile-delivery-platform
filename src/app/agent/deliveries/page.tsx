// src/app/agent/deliveries/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FailureModal } from "@/components/ui/FailureModal";
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Phone,
  Package,
  Search,
  ExternalLink,
} from "lucide-react";

export default function AgentDeliveriesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFailedOrder, setSelectedFailedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchDeliveries = async () => {
    setLoading(true);
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
    fetchDeliveries();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchDeliveries();
      } else {
        alert(data.error || "Status transition failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "ACTIVE") return ["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status);
    if (statusFilter === "DELIVERED") return o.status === "DELIVERED";
    if (statusFilter === "FAILED") return o.status === "FAILED";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today&apos;s Assigned Route</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Execute doorstep delivery milestones and collect COD payments
          </p>
        </div>
        <Link
          href="/agent/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Agent Dashboard
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex gap-2 text-xs">
        {[
          { key: "ALL", label: "All Assigned" },
          { key: "ACTIVE", label: "Active Queue" },
          { key: "DELIVERED", label: "Delivered" },
          { key: "FAILED", label: "Failed Attempts" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              statusFilter === tab.key
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading deliveries...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No deliveries match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Info Column */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    #{order.trackingNumber}
                  </span>
                  <StatusBadge status={order.status} size="sm" />
                  <span
                    className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                      order.paymentType === "COD"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {order.paymentType === "COD" ? `COD: ₹${order.totalAmount}` : "PREPAID"}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup Origin</span>
                    <p className="text-slate-800 font-medium flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      {order.pickupAddress} ({order.pickupZone?.name})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Drop Destination</span>
                    <p className="text-slate-800 font-medium flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      {order.dropAddress} ({order.dropZone?.name})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Customer: <strong className="text-slate-800">{order.customer?.name}</strong></span>
                  {order.customer?.phone && (
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <Phone className="w-3 h-3" /> {order.customer.phone}
                    </span>
                  )}
                  <span>Weight: <strong>{order.chargeableWeightKg} kg</strong></span>
                </div>
              </div>

              {/* Action Buttons Column */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0 justify-end">
                {order.status === "CREATED" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "PICKED_UP")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Mark Picked Up
                  </button>
                )}

                {order.status === "PICKED_UP" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "IN_TRANSIT")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Mark In Transit
                  </button>
                )}

                {order.status === "IN_TRANSIT" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Mark Out For Delivery
                  </button>
                )}

                {order.status === "OUT_FOR_DELIVERY" && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    ✓ Complete Delivery
                  </button>
                )}

                {["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status) && (
                  <button
                    onClick={() => setSelectedFailedOrder(order)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Mark Failed
                  </button>
                )}

                <Link
                  href={`/track/${order.trackingNumber}`}
                  className="px-3 py-1.5 text-center text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1"
                >
                  Tracking Timeline <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Failure Modal */}
      {selectedFailedOrder && (
        <FailureModal
          orderId={selectedFailedOrder.id}
          trackingNumber={selectedFailedOrder.trackingNumber}
          isOpen={!!selectedFailedOrder}
          onClose={() => setSelectedFailedOrder(null)}
          onSuccess={() => {
            setSelectedFailedOrder(null);
            fetchDeliveries();
          }}
        />
      )}
    </div>
  );
}
