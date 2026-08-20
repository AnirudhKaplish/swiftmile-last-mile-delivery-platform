// src/components/ui/AssignAgentModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, UserCheck, Zap, AlertCircle, ShieldAlert } from "lucide-react";

interface AssignAgentModalProps {
  orderId: string;
  trackingNumber: string;
  currentAgentId?: string | null;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignAgentModal({
  orderId,
  trackingNumber,
  currentAgentId,
  currentStatus,
  isOpen,
  onClose,
  onSuccess,
}: AssignAgentModalProps) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId || "");
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [overrideReason, setOverrideReason] = useState("");
  const [activeTab, setActiveTab] = useState<"ASSIGN" | "OVERRIDE">("ASSIGN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/agents")
        .then((r) => r.json())
        .then((d) => {
          if (d.agents) {
            setAgents(d.agents);
            if (!selectedAgentId && d.agents.length > 0) {
              const avail = d.agents.find((a: any) => a.status === "AVAILABLE");
              if (avail) setSelectedAgentId(avail.id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAutoAssign = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/auto-assign`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-assignment failed");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to auto-assign agent");
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selectedAgentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Manual assignment failed");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to assign agent");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason) {
      setError("An audit reason is required for manual status overrides.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: `Admin Override: ${overrideReason}`,
          failureReason: newStatus === "FAILED" ? "ADMIN_OVERRIDE" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to override status");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Admin Operations Dispatch</h3>
            <p className="text-xs text-slate-500 font-mono">Order #{trackingNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mt-4">
          <button
            onClick={() => {
              setActiveTab("ASSIGN");
              setError("");
            }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === "ASSIGN"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Agent Assignment
          </button>
          <button
            onClick={() => {
              setActiveTab("OVERRIDE");
              setError("");
            }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
              activeTab === "OVERRIDE"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Status Override
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === "ASSIGN" ? (
          <div className="mt-4 space-y-4">
            {/* 1-Click Auto Assign */}
            <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Intelligent Auto-Assignment
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Calculates zone proximity, agent availability, and workload score.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={loading}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                {loading ? "Assigning..." : "Auto Assign"}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink-0 mx-3 text-[10px] uppercase font-bold text-slate-400">or manual assign</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleManualAssign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Delivery Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="">-- Choose an Agent --</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.user?.name} ({a.vehicleType} - {a.vehicleNumber}) [{a.status} | {a.activeDeliveries} active]
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={loading || !selectedAgentId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-lg transition shadow-xs cursor-pointer"
                >
                  Confirm Manual Assignment
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleStatusOverride} className="mt-4 space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Audit Notice:</strong> Status overrides bypass normal state machine constraints but are permanently logged with your admin identity.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Target Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
              >
                <option value="CREATED">CREATED</option>
                <option value="PICKED_UP">PICKED_UP</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Reason / Justification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Customer verified via phone, parcel recovered from hub"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                disabled={loading || !overrideReason}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition shadow-xs cursor-pointer"
              >
                Apply Status Override
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
