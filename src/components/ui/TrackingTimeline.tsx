// src/components/ui/TrackingTimeline.tsx
"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ArrowRightCircle,
  AlertTriangle,
  Calendar,
  User,
  ShieldCheck,
  RotateCcw,
  MapPin,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface TrackingEvent {
  id: string;
  previousStatus?: string | null;
  newStatus: string;
  timestamp: string | Date;
  actorRole: string;
  location?: string | null;
  notes?: string | null;
  actor?: {
    name?: string;
    role?: string;
  } | null;
}

interface DeliveryAttempt {
  id: string;
  attemptNumber: number;
  status: string;
  failureReason?: string | null;
  notes?: string | null;
  attemptedAt: string | Date;
}

interface TrackingTimelineProps {
  status: string;
  trackingNumber: string;
  events: TrackingEvent[];
  attempts?: DeliveryAttempt[];
  failureReason?: string | null;
  failureNotes?: string | null;
  rescheduledDate?: string | Date | null;
  rescheduleSlot?: string | null;
  onOpenReschedule?: () => void;
  isCustomerView?: boolean;
}

const LIFECYCLE_STEPS = [
  { key: "CREATED", label: "Order Created", desc: "Shipment registered & verified" },
  { key: "PICKED_UP", label: "Picked Up", desc: "Agent collected parcel from pickup location" },
  { key: "IN_TRANSIT", label: "In Transit", desc: "Moving through logistics hub" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Courier is on the way to destination" },
  { key: "DELIVERED", label: "Delivered", desc: "Successfully delivered to customer" },
];

export function TrackingTimeline({
  status,
  trackingNumber,
  events = [],
  attempts = [],
  failureReason,
  failureNotes,
  rescheduledDate,
  rescheduleSlot,
  onOpenReschedule,
  isCustomerView = false,
}: TrackingTimelineProps) {
  const getStepIndex = (st: string) => {
    switch (st) {
      case "CREATED": return 0;
      case "PICKED_UP": return 1;
      case "IN_TRANSIT": return 2;
      case "OUT_FOR_DELIVERY": return 3;
      case "DELIVERED": return 4;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(status);

  return (
    <div className="space-y-6">
      {/* Failed Delivery Notice Banner with Reschedule CTA */}
      {status === "FAILED" && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-5 shadow-xs animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">Delivery Attempt Failed</h3>
                <p className="text-sm text-rose-700 mt-1 font-medium">
                  Reason: <span className="font-semibold">{failureReason?.replace(/_/g, " ") || "Recipient Unavailable"}</span>
                </p>
                {failureNotes && (
                  <p className="text-xs text-rose-600 mt-0.5 italic">Note: &ldquo;{failureNotes}&rdquo;</p>
                )}
                <p className="text-xs text-rose-600 mt-2">
                  Don&apos;t worry! Your parcel is safe at our nearest distribution hub. Please select a convenient date for delivery.
                </p>
              </div>
            </div>

            {onOpenReschedule && (
              <button
                onClick={onOpenReschedule}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Reschedule Delivery
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rescheduled Success Notice */}
      {rescheduledDate && status !== "FAILED" && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 flex items-center justify-between gap-3 text-indigo-900 text-sm">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="font-bold">Delivery Rescheduled:</span> Expected on{" "}
              <strong>
                {new Date(rescheduledDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </strong>{" "}
              {rescheduleSlot && `(${rescheduleSlot})`}
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps Bar (Desktop & Tablet) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">Delivery Progress</h4>
        
        <div className="relative flex items-center justify-between">
          {/* Connector Line */}
          <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200 -z-0" />
          <div
            className={`absolute left-4 top-4 h-0.5 -z-0 transition-all duration-500 ${
              status === "FAILED" ? "bg-rose-500" : "bg-blue-600"
            }`}
            style={{
              width:
                status === "FAILED"
                  ? "75%"
                  : `${Math.max(0, (currentStepIdx / (LIFECYCLE_STEPS.length - 1)) * 100)}%`,
            }}
          />

          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx > idx;
            const isCurrent = currentStepIdx === idx && status !== "FAILED";
            const isFailedStep = status === "FAILED" && idx === 3; // out for delivery failed

            return (
              <div key={step.key} className="flex flex-col items-center text-center z-10 w-24">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                    isFailedStep
                      ? "bg-rose-600 text-white ring-4 ring-rose-100"
                      : isCompleted
                      ? "bg-blue-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                      : "bg-white border-2 border-slate-300 text-slate-400"
                  }`}
                >
                  {isFailedStep ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-xs font-medium mt-2 leading-tight ${
                    isFailedStep
                      ? "text-rose-700 font-bold"
                      : isCurrent
                      ? "text-blue-700 font-bold"
                      : isCompleted
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Chronological Vertical Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Tracking Activity Timeline</h4>
            <p className="text-xs text-slate-500">Immutable chronological audit history</p>
          </div>
          <span className="text-xs font-mono text-slate-400">#{trackingNumber}</span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No tracking activity logged yet.</p>
          ) : (
            events.map((event, idx) => {
              const isFirst = idx === events.length - 1;
              const isFailureEvent = event.newStatus === "FAILED";
              const isDeliveredEvent = event.newStatus === "DELIVERED";

              return (
                <div key={event.id} className="relative group">
                  {/* Timeline node icon */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isFailureEvent
                        ? "bg-rose-500 border-white text-white ring-2 ring-rose-200"
                        : isDeliveredEvent
                        ? "bg-emerald-500 border-white text-white ring-2 ring-emerald-200"
                        : isFirst
                        ? "bg-blue-600 border-white text-white ring-2 ring-blue-200"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>

                  {/* Event content box */}
                  <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={event.newStatus} size="sm" />
                        {event.location && (
                          <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] text-slate-500 font-mono">
                        {new Date(event.timestamp).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 leading-relaxed font-medium">
                      {event.notes || `Status updated to ${event.newStatus.replace(/_/g, " ")}`}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Recorded by:{" "}
                        <strong className="text-slate-700 font-semibold">
                          {event.actor?.name || event.actorRole}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delivery Attempts Card (if multiple attempts exist) */}
      {attempts && attempts.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Delivery Attempts History ({attempts.length} Attempts)
          </h4>
          <div className="space-y-2.5">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                    #{att.attemptNumber}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">
                      {att.status === "DELIVERED"
                        ? "Delivered Successfully"
                        : att.status === "FAILED"
                        ? `Failed (${att.failureReason?.replace(/_/g, " ") || "Unreachable"})`
                        : "Attempt in progress"}
                    </span>
                    {att.notes && <p className="text-[11px] text-slate-500">{att.notes}</p>}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(att.attemptedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
