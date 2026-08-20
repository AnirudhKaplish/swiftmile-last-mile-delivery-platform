// src/app/customer/orders/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Truck,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/orders?${params.toString()}`);
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
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Deliveries</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track all your courier orders</p>
        </div>
        <Link
          href="/customer/create"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Delivery
        </Link>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { key: "ALL", label: "All Deliveries" },
            { key: "CREATED", label: "Pending" },
            { key: "PICKED_UP", label: "Picked Up" },
            { key: "IN_TRANSIT", label: "In Transit" },
            { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
            { key: "DELIVERED", label: "Delivered" },
            { key: "FAILED", label: "Failed / Needs Reschedule" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by tracking number, pickup or drop area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Tracking Number</th>
              <th className="py-3 px-4">Booking Date</th>
              <th className="py-3 px-4">Pickup Origin</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Billed (INR)</th>
              <th className="py-3 px-4">Agent</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {order.trackingNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="font-semibold block text-slate-900">{order.pickupArea || "Hub"}</span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-xs">{order.pickupAddress}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <span className="font-semibold block text-slate-900">{order.dropArea || "Hub"}</span>
                    <span className="text-[11px] text-slate-500 truncate block max-w-xs">{order.dropAddress}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                    ₹{order.totalAmount.toFixed(2)}
                    <span className="text-[10px] text-slate-400 block font-normal">{order.paymentType}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {order.assignedAgentName ? (
                      <span className="font-medium">{order.assignedAgentName}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/customer/track/${order.trackingNumber}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                    >
                      Track <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">No orders found.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-900">#{order.trackingNumber}</span>
                <StatusBadge status={order.status} size="sm" />
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-1.5 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">{order.pickupArea}</strong>: {order.pickupAddress}
                  </div>
                </div>
                <div className="flex items-start gap-1.5 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">{order.dropArea}</strong>: {order.dropAddress}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 font-mono">
                  ₹{order.totalAmount.toFixed(2)} ({order.paymentType})
                </span>
                <Link
                  href={`/customer/track/${order.trackingNumber}`}
                  className="inline-flex items-center gap-1 text-blue-600 font-bold"
                >
                  View Tracking <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
