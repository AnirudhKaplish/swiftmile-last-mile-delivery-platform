// src/lib/constants.ts

export const ROLES = {
  CUSTOMER: "CUSTOMER",
  DELIVERY_AGENT: "DELIVERY_AGENT",
  ADMIN: "ADMIN",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

export const ORDER_STATUS = {
  CREATED: "CREATED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
} as const;

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const AGENT_STATUS = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  OFFLINE: "OFFLINE",
} as const;

export type AgentStatusType = (typeof AGENT_STATUS)[keyof typeof AGENT_STATUS];

export const ORDER_TYPES = {
  B2C: "B2C",
  B2B: "B2B",
} as const;

export const PAYMENT_TYPES = {
  PREPAID: "PREPAID",
  COD: "COD",
} as const;

export const FAILURE_REASONS = [
  { value: "CUSTOMER_UNAVAILABLE", label: "Customer Unavailable / Phone Unreachable" },
  { value: "INCORRECT_ADDRESS", label: "Incomplete / Incorrect Delivery Address" },
  { value: "CUSTOMER_REJECTED", label: "Customer Refused Delivery / Cancelled at Doorstep" },
  { value: "COD_AMOUNT_UNAVAILABLE", label: "Cash / Payment Not Available for COD" },
  { value: "ENTRY_RESTRICTED", label: "Premises / Gated Community Entry Restricted" },
  { value: "WEATHER_OR_TRAFFIC", label: "Severe Weather / Route Inaccessible" },
  { value: "DAMAGED_PARCEL", label: "Package Outer Seal Compromised / Damaged" },
] as const;

export const RESCHEDULE_SLOTS = [
  { value: "MORNING", label: "Morning (09:00 AM - 01:00 PM)" },
  { value: "AFTERNOON", label: "Afternoon (01:00 PM - 05:00 PM)" },
  { value: "EVENING", label: "Evening (05:00 PM - 09:00 PM)" },
] as const;

export const STATUS_PROGRESSION: Record<string, number> = {
  CREATED: 1,
  PICKED_UP: 2,
  IN_TRANSIT: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  FAILED: 0,
};

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CREATED: { label: "Order Created", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
  PICKED_UP: { label: "Picked Up", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  IN_TRANSIT: { label: "In Transit", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  DELIVERED: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  FAILED: { label: "Delivery Failed", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};
