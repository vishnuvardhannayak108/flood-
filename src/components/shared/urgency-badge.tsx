import React from "react";
import { cn } from "@/lib/utils";
import { URGENCY_MAP, UrgencyLevel } from "@/lib/status";
import { AlertCircle, AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  className?: string;
  showIcon?: boolean;
}

export function UrgencyBadge({ urgency, className, showIcon = true }: UrgencyBadgeProps) {
  const meta = URGENCY_MAP[urgency] || URGENCY_MAP.medium;

  const icons: Record<UrgencyLevel, React.ComponentType<{ className?: string }>> = {
    low: ShieldCheck,
    medium: AlertCircle,
    high: AlertTriangle,
    critical: AlertOctagon,
  };

  const Icon = icons[urgency] || AlertCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none transition-all",
        meta.badge,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{meta.label}</span>
    </span>
  );
}
