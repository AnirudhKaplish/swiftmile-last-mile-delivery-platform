// src/app/admin/orders/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AssignAgentModal } from "@/components/ui/AssignAgentModal";
import {
  Search,
  Filter,
  UserCheck,
  Zap,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MapPin,
  Package,
  Calendar,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState("ALL");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("ALL");

  // Selected Order for Admin Action Drawer/Modal
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<any>(null);

  const fetchFiltersData = async () => {
    try {
      const [zRes, aRes] = await Promise.all([fetch("/api/zones"), fetch("/api/agents")]);
      const zData = await zRes.json();
      const aData = await aRes.json();
      if (zData.zones) setZones(zData.zones);
      if (aData.agents) setAgents(aData.agents);
    } catch {}
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (zoneFilter !== "ALL") params.append("zoneId", zoneFilter);
      if (agentFilter !== "ALL") params.append("agentId", agentFilter);
      if (orderTypeFilter !== "ALL") params.append("orderType", orderTypeFilter);
      if (paymentTypeFilter !== "ALL") params.append("paymentType", paymentTypeFilter);
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
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, zoneFilter, agentFilter, orderTypeFilter, paymentTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Operations Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, inspect pricing breakdown, assign couriers, and manage state overrides
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Multi-Criteria Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by tracking number, customer name, pickup/drop address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zone</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="B2C">B2C Retail</option>
              <option value="B2B">B2B Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment</label>
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
            >
              <option value="ALL">All Payments</option>
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Tracking Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Origin / Drop Route</th>
                <th className="py-3 px-4">Weight (kg)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Billed (INR)</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4 text-right">Operations Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/track/${order.trackingNumber}`}
                        className="hover:text-blue-600 underline decoration-slate-300"
                      >
                        {order.trackingNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{order.customer?.name}</strong>
                      <span className="text-[10px] text-slate-400">{order.customer?.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold block">{order.pickupArea || "Origin"} → {order.dropArea || "Destination"}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{order.zoneType}-ZONE ({order.orderType})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-mono font-semibold">
                      {order.chargeableWeightKg} kg
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ₹{order.totalAmount.toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal block">{order.paymentType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.assignedAgentName ? (
                        <div>
                          <span className="font-semibold text-slate-900 block">{order.assignedAgentName}</span>
                          <span className="text-[10px] text-slate-400">{order.assignedAgentPhone}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrderForAction(order)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                      >
                        Dispatch / Override
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Action Modal */}
      {selectedOrderForAction && (
        <AssignAgentModal
          orderId={selectedOrderForAction.id}
          trackingNumber={selectedOrderForAction.trackingNumber}
          currentAgentId={selectedOrderForAction.assignedAgentId}
          currentStatus={selectedOrderForAction.status}
          isOpen={!!selectedOrderForAction}
          onClose={() => setSelectedOrderForAction(null)}
          onSuccess={() => {
            setSelectedOrderForAction(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
