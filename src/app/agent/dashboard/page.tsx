// src/app/agent/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FailureModal } from "@/components/ui/FailureModal";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFailedOrder, setSelectedFailedOrder] = useState<any>(null);

  const fetchAssigned = async () => {
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
    fetchAssigned();
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
        fetchAssigned();
      } else {
        alert(data.error || "Status transition failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const pendingCount = orders.filter((o) => ["CREATED", "PICKED_UP", "IN_TRANSIT"].includes(o.status)).length;
  const outCount = orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const failedCount = orders.filter((o) => o.status === "FAILED").length;

  const activeQueue = orders.filter((o) => !["DELIVERED"].includes(o.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Agent Greeting Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
              <Truck className="w-3.5 h-3.5" /> Fleet Delivery Executive
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Good morning, {user?.name || "Agent"}!
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm mt-1">
              Vehicle: <strong>{user?.agentProfile?.vehicleType || "Motorcycle"} ({user?.agentProfile?.vehicleNumber || "KA-01-EA-1001"})</strong> • Zone: <strong>{user?.agentProfile?.currentZone?.name || "Bengaluru Fleet"}</strong>
            </p>
          </div>

          <Link
            href="/agent/deliveries"
            className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
          >
            Open Today&apos;s Route Queue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Pickup</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{pendingCount}</p>
          <span className="text-[11px] text-amber-600 font-medium">To be collected</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Out for Delivery</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{outCount}</p>
          <span className="text-[11px] text-blue-600 font-medium">Active on road</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Deliveries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{deliveredCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Successfully delivered</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Failed Attempts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{failedCount}</p>
          <span className="text-[11px] text-rose-600 font-medium">Recorded failures</span>
        </div>
      </div>

      {/* Active Route Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Active Delivery Route</h2>
            <p className="text-xs text-slate-500">Perform real-time step transitions during your route</p>
          </div>
          <Link
            href="/agent/deliveries"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Manage All Deliveries <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading assigned route...</div>
        ) : activeQueue.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">All deliveries complete!</h3>
            <p className="text-xs text-slate-500">No pending packages in your active route right now.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeQueue.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        #{order.trackingNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Customer: <strong className="text-slate-800">{order.customer?.name}</strong>
                      </span>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup</span>
                        <p className="font-medium text-slate-800">{order.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Drop Destination</span>
                        <p className="font-medium text-slate-800">{order.dropAddress}</p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-slate-600">
                      <span>Weight: <strong>{order.chargeableWeightKg} kg</strong></span>
                      <span
                        className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                          order.paymentType === "COD"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {order.paymentType === "COD" ? `Collect COD: ₹${order.totalAmount}` : "PREPAID"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step Transition Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {order.status === "CREATED" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "PICKED_UP")}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Mark Picked Up
                    </button>
                  )}

                  {order.status === "PICKED_UP" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "IN_TRANSIT")}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Mark In Transit
                    </button>
                  )}

                  {order.status === "IN_TRANSIT" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "OUT_FOR_DELIVERY")}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Mark Out For Delivery
                    </button>
                  )}

                  {order.status === "OUT_FOR_DELIVERY" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      ✓ Mark Delivered
                    </button>
                  )}

                  {/* Failure Button available on active orders */}
                  {["CREATED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status) && (
                    <button
                      onClick={() => setSelectedFailedOrder(order)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Mark Failed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Failure Reason Modal */}
      {selectedFailedOrder && (
        <FailureModal
          orderId={selectedFailedOrder.id}
          trackingNumber={selectedFailedOrder.trackingNumber}
          isOpen={!!selectedFailedOrder}
          onClose={() => setSelectedFailedOrder(null)}
          onSuccess={() => {
            setSelectedFailedOrder(null);
            fetchAssigned();
          }}
        />
      )}
    </div>
  );
}
