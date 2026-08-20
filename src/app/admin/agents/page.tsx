// src/app/admin/agents/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Truck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Star,
  RefreshCw,
  Phone,
  Mail,
  Edit2,
  Save,
  X,
} from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [zoneDraft, setZoneDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAgentsData = async () => {
    setLoading(true);
    try {
      const [aRes, zRes] = await Promise.all([fetch("/api/agents"), fetch("/api/zones")]);
      const aData = await aRes.json();
      const zData = await zRes.json();
      if (aData.agents) setAgents(aData.agents);
      if (zData.zones) setZones(zData.zones);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsData();
  }, []);

  const openEdit = (agent: any) => {
    setEditingAgent(agent);
    setStatusDraft(agent.status);
    setZoneDraft(agent.currentZoneId || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusDraft,
          currentZoneId: zoneDraft || null,
        }),
      });
      if (res.ok) {
        setEditingAgent(null);
        fetchAgentsData();
      } else {
        alert("Failed to update agent profile");
      }
    } catch {
      alert("Error updating agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Fleet Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor agent availability, assigned zones, vehicle types, and active delivery loads
          </p>
        </div>

        <button
          onClick={fetchAgentsData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Fleet
        </button>
      </div>

      {/* Agents Fleet Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
            Loading courier fleet roster...
          </div>
        ) : (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{agent.user?.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{agent.user?.phone || "N/A"}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      agent.status === "AVAILABLE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : agent.status === "BUSY"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Assigned Zone:</span>
                    <span className="font-semibold text-slate-900">
                      {agent.currentZone?.name || "Unassigned"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Vehicle:</span>
                    <span className="font-medium text-slate-800">
                      {agent.vehicleType} ({agent.vehicleNumber})
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Active Workload:</span>
                    <span className="font-bold text-blue-700 font-mono">
                      {agent.activeDeliveries} parcels in route
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Rating:</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {agent.rating} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => openEdit(agent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Status & Zone
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Agent Modal */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Update Agent: {editingAgent.user?.name}
              </h3>
              <button
                onClick={() => setEditingAgent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Availability Status
                </label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="AVAILABLE">AVAILABLE (Accepting Orders)</option>
                  <option value="BUSY">BUSY (Capacity Reached)</option>
                  <option value="OFFLINE">OFFLINE (Off Shift)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Zone
                </label>
                <select
                  value={zoneDraft}
                  onChange={(e) => setZoneDraft(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="">-- No Zone Assigned --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Agent Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
