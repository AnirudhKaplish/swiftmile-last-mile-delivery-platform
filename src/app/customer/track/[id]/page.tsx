// src/app/customer/track/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TrackingTimeline } from "@/components/ui/TrackingTimeline";
import { RescheduleModal } from "@/components/ui/RescheduleModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  UserCheck,
  Calendar,
  CreditCard,
  Package,
  RotateCcw,
  RefreshCw,
  Share2,
} from "lucide-react";

export default function CustomerTrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumberOrId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchOrderData = async () => {
    try {
      // First try fetching public tracking or direct order endpoint
      const res = await fetch(`/api/orders/track/${encodeURIComponent(trackingNumberOrId)}`);
      const data = await res.json();
      if (data.shipment) {
        setOrder(data.shipment);
      } else {
        // Fallback to internal ID fetch
        const res2 = await fetch(`/api/orders/${trackingNumberOrId}`);
        const data2 = await res2.json();
        if (data2.order) setOrder(data2.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, [trackingNumberOrId]);

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/track/${order?.trackingNumber}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        Loading real-time tracking details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Shipment Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          We could not locate shipment with reference &ldquo;{trackingNumberOrId}&rdquo;.
        </p>
        <Link
          href="/customer/orders"
          className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Deliveries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/customer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deliveries
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Link Copied!" : "Share Tracking Link"}
          </button>
          <button
            onClick={fetchOrderData}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Shipment Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Official Indian Courier Tracking
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              #{order.trackingNumber}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} size="lg" />
          </div>
        </div>

        {/* Route Snapshot */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Origin Pickup</span>
            <p className="text-xs font-bold text-slate-900 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              {order.pickupArea || "Hub"}, {order.pickupCity} ({order.pickupPincode})
            </p>
            <span className="text-[11px] text-slate-500 block pl-4">{order.pickupZone}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Destination Drop</span>
            <p className="text-xs font-bold text-slate-900 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              {order.dropArea || "Hub"}, {order.dropCity} ({order.dropPincode})
            </p>
            <span className="text-[11px] text-slate-500 block pl-4">{order.dropZone}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery Agent</span>
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              {order.assignedAgentName || "Auto-assigned Courier"}
            </p>
            {order.assignedAgentPhone && (
              <span className="text-[11px] text-slate-500 block pl-5 font-mono">
                {order.assignedAgentPhone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <TrackingTimeline
        status={order.status}
        trackingNumber={order.trackingNumber}
        events={order.timeline || order.trackingEvents || []}
        attempts={order.attempts || []}
        failureReason={order.failureReason}
        failureNotes={order.failureNotes}
        rescheduledDate={order.rescheduledDate}
        rescheduleSlot={order.rescheduleSlot}
        onOpenReschedule={() => setIsRescheduleOpen(true)}
        isCustomerView={true}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        orderId={order.id}
        trackingNumber={order.trackingNumber}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onSuccess={() => {
          fetchOrderData();
        }}
      />
    </div>
  );
}
