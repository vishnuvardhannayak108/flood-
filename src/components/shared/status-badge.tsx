import React from "react";
import { cn } from "@/lib/utils";
import { REQUEST_STATUS_MAP, RequestStatus } from "@/lib/status";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const meta = REQUEST_STATUS_MAP[status] || {
    label: status,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    icon: () => null,
  };

  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none",
        meta.badgeClass,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{meta.label}</span>
    </span>
  );
}
