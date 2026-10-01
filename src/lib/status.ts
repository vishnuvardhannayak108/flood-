import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Navigation, 
  ShieldAlert, 
  Truck, 
  XCircle, 
  Flame,
  Info,
  Radio
} from "lucide-react";
import React from "react";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type RequestStatus = 
  | "submitted"
  | "verified"
  | "prioritized"
  | "assigned"
  | "accepted"
  | "en_route"
  | "on_site"
  | "completed"
  | "cancelled"
  | "rejected"
  | "duplicate";

export type AlertSeverity = "info" | "advisory" | "warning" | "emergency";

export interface StatusMeta {
  label: string;
  colorClass: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
  stepIndex: number;
}

export const URGENCY_MAP: Record<UrgencyLevel, { label: string; color: string; badge: string; pulse?: boolean }> = {
  low: {
    label: "Low",
    color: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300",
  },
  medium: {
    label: "Medium",
    color: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200 border-blue-300 dark:border-blue-800",
  },
  high: {
    label: "High",
    color: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-800",
  },
  critical: {
    label: "Critical",
    color: "text-red-650 dark:text-red-400 font-bold",
    badge: "bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200 border-red-500 ring-2 ring-red-400 animate-pulse",
    pulse: true,
  },
};

export const REQUEST_STATUS_MAP: Record<RequestStatus, StatusMeta> = {
  submitted: {
    label: "Submitted",
    colorClass: "text-slate-650",
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    icon: Clock,
    stepIndex: 1,
  },
  verified: {
    label: "Verified",
    colorClass: "text-blue-650",
    badgeClass: "bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300",
    icon: Info,
    stepIndex: 2,
  },
  prioritized: {
    label: "Prioritized",
    colorClass: "text-indigo-650",
    badgeClass: "bg-indigo-50 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300",
    icon: Flame,
    stepIndex: 2,
  },
  assigned: {
    label: "Assigned",
    colorClass: "text-purple-650",
    badgeClass: "bg-purple-50 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300",
    icon: Radio,
    stepIndex: 3,
  },
  accepted: {
    label: "Accepted",
    colorClass: "text-amber-650",
    badgeClass: "bg-amber-50 text-amber-850 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
    icon: ShieldAlert,
    stepIndex: 4,
  },
  en_route: {
    label: "En Route",
    colorClass: "text-orange-650",
    badgeClass: "bg-orange-50 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 animate-pulse",
    icon: Truck,
    stepIndex: 5,
  },
  on_site: {
    label: "On Site",
    colorClass: "text-orange-700",
    badgeClass: "bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200 border-orange-500",
    icon: Navigation,
    stepIndex: 6,
  },
  completed: {
    label: "Completed",
    colorClass: "text-emerald-650",
    badgeClass: "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
    icon: CheckCircle2,
    stepIndex: 7,
  },
  cancelled: {
    label: "Cancelled",
    colorClass: "text-slate-500",
    badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300",
    icon: XCircle,
    stepIndex: 0,
  },
  rejected: {
    label: "Declined",
    colorClass: "text-rose-600",
    badgeClass: "bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300",
    icon: XCircle,
    stepIndex: 0,
  },
  duplicate: {
    label: "Duplicate",
    colorClass: "text-gray-500",
    badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-300",
    icon: HelpCircle,
    stepIndex: 0,
  },
};

export const ALERT_SEVERITY_MAP: Record<AlertSeverity, { label: string; badge: string; border: string }> = {
  info: {
    label: "Information",
    badge: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
    border: "border-blue-400",
  },
  advisory: {
    label: "Advisory",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    border: "border-amber-400",
  },
  warning: {
    label: "Warning",
    badge: "bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-200",
    border: "border-orange-500",
  },
  emergency: {
    label: "Emergency",
    badge: "bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-200 font-bold animate-pulse",
    border: "border-red-600",
  },
};

// Allowed State Machine Transitions
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  submitted: ["verified", "prioritized", "cancelled", "rejected", "duplicate"],
  verified: ["prioritized", "assigned", "cancelled", "duplicate"],
  prioritized: ["assigned", "cancelled", "duplicate"],
  assigned: ["accepted", "rejected", "cancelled"],
  accepted: ["en_route", "cancelled"],
  en_route: ["on_site", "cancelled"],
  on_site: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: ["prioritized", "assigned"], // Can be re-dispatched
  duplicate: [],
};

export const REQUEST_STATUSES: RequestStatus[] = [
  "submitted",
  "verified",
  "prioritized",
  "assigned",
  "accepted",
  "en_route",
  "on_site",
  "completed",
  "cancelled",
  "rejected",
  "duplicate",
];

export function isValidTransition(from: RequestStatus, to: RequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: RequestStatus): boolean {
  return ["completed", "cancelled", "duplicate"].includes(status);
}

export function canCancelRequest(status: RequestStatus): boolean {
  return !isTerminalStatus(status);
}
