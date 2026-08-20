// src/app/admin/zones/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Save,
  X,
  AlertCircle,
} from "lucide-react";

export default function AdminZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [areas, setAreas] = useState<{ areaName: string; pincode: string }[]>([
    { areaName: "", pincode: "" },
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zones");
      const data = await res.json();
      if (data.zones) setZones(data.zones);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const openCreateModal = () => {
    setEditingZone(null);
    setCode("");
    setName("");
    setCity("Bengaluru");
    setState("Karnataka");
    setAreas([{ areaName: "", pincode: "" }]);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (z: any) => {
    setEditingZone(z);
    setCode(z.code);
    setName(z.name);
    setCity(z.city);
    setState(z.state);
    setAreas(
      z.areas && z.areas.length > 0
        ? z.areas.map((a: any) => ({ areaName: a.areaName, pincode: a.pincode }))
        : [{ areaName: "", pincode: "" }]
    );
    setError("");
    setIsModalOpen(true);
  };

  const handleAddAreaRow = () => {
    setAreas([...areas, { areaName: "", pincode: "" }]);
  };

  const handleRemoveAreaRow = (index: number) => {
    setAreas(areas.filter((_, i) => i !== index));
  };

  const handleAreaChange = (index: number, field: "areaName" | "pincode", value: string) => {
    const next = [...areas];
    next[index][field] = value;
    setAreas(next);
  };

  const handleToggleActive = async (zoneId: string) => {
    try {
      await fetch(`/api/zones/${zoneId}`, { method: "DELETE" });
      fetchZones();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code,
        name,
        city,
        state,
        areas: areas.filter((a) => a.areaName.trim() && a.pincode.trim()),
      };

      const url = editingZone ? `/api/zones/${editingZone.id}` : "/api/zones";
      const method = editingZone ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save zone");

      setIsModalOpen(false);
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Logistics Zone Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure delivery zones, serviceable areas, and 6-digit Indian postal pincodes
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Delivery Zone
        </button>
      </div>

      {/* Zones Grid / Table */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">Loading zones...</div>
        ) : (
          zones.map((zone) => (
            <div
              key={zone.id}
              className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition ${
                zone.active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {zone.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        zone.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {zone.active ? "Active Service Zone" : "Deactivated"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{zone.name}</h3>
                  <p className="text-xs text-slate-500">{zone.city}, {zone.state}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(zone)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    title="Edit Zone"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(zone.id)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                      zone.active
                        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={zone.active ? "Deactivate Zone" : "Activate Zone"}
                  >
                    {zone.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Serviceable Areas & Pincodes Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Mapped Areas & Pincodes ({zone.areas?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {zone.areas && zone.areas.length > 0 ? (
                    zone.areas.map((area: any) => (
                      <span
                        key={area.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs text-slate-700"
                      >
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <strong>{area.areaName}</strong> ({area.pincode})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No areas mapped yet</span>
                  )}
                </div>
              </div>

              {/* Zone Stats */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Fleet: <strong>{zone._count?.agents || 0} couriers</strong></span>
                <span>Handled: <strong>{(zone._count?.pickupOrders || 0) + (zone._count?.dropOrders || 0)} orders</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingZone ? `Edit Zone: ${editingZone.code}` : "Add New Delivery Zone"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zone Code (e.g. BLR_WEST)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingZone}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 uppercase font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zone Name (e.g. Bengaluru West Zone)
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Serviceable Areas Sub-form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Serviceable Areas & 6-Digit Pincodes
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAreaRow}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Area
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {areas.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Area Name (e.g. Koramangala)"
                        value={a.areaName}
                        onChange={(e) => handleAreaChange(idx, "areaName", e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Pincode (e.g. 560034)"
                        maxLength={6}
                        value={a.pincode}
                        onChange={(e) => handleAreaChange(idx, "pincode", e.target.value)}
                        className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-mono"
                      />
                      {areas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAreaRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition cursor-pointer"
                >
                  {saving ? "Saving..." : editingZone ? "Update Zone" : "Create Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
