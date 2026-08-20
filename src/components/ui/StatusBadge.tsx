// src/components/ui/StatusBadge.tsx
import React from "react";
import { CheckCircle2, Clock, Truck, Package, AlertTriangle, ArrowRightCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2",
  };

  switch (status) {
    case "CREATED":
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses[size]}`}>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Order Created
        </span>
      );
    case "PICKED_UP":
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}>
          <Package className="w-3.5 h-3.5 text-blue-600" />
          Picked Up
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses[size]}`}>
          <Truck className="w-3.5 h-3.5 text-indigo-600" />
          In Transit
        </span>
      );
    case "OUT_FOR_DELIVERY":
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-300 animate-pulse ${sizeClasses[size]}`}>
          <ArrowRightCircle className="w-3.5 h-3.5 text-amber-600" />
          Out for Delivery
        </span>
      );
    case "DELIVERED":
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Delivered
        </span>
      );
    case "FAILED":
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses[size]}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          Delivery Failed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 ${sizeClasses[size]}`}>
          {status}
        </span>
      );
  }
}
