"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

export type ConnectionState = "connected" | "reconnecting" | "offline";

interface LiveIndicatorProps {
  className?: string;
  state?: ConnectionState;
}

export function LiveIndicator({ className, state }: LiveIndicatorProps) {
  const { t } = useTranslation();
  const [internalState, setInternalState] = useState<ConnectionState>(state || "connected");

  useEffect(() => {
    if (state) {
      setInternalState(state);
      return;
    }

    const handleOnline = () => setInternalState("connected");
    const handleOffline = () => setInternalState("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setInternalState("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [state]);

  const configs: Record<ConnectionState, { dot: string; text: string; label: string }> = {
    connected: {
      dot: "bg-emerald-500 animate-pulse",
      text: "text-emerald-800 dark:text-emerald-300",
      label: t("common.connected", "Connected"),
    },
    reconnecting: {
      dot: "bg-amber-500 animate-ping",
      text: "text-amber-800 dark:text-amber-300",
      label: t("common.reconnecting", "Reconnecting..."),
    },
    offline: {
      dot: "bg-red-500",
      text: "text-red-800 dark:text-red-300",
      label: t("common.offline", "Offline"),
    },
  };

  const current = configs[internalState];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all",
        internalState === "connected" && "bg-emerald-500/10 border-emerald-500/30",
        internalState === "reconnecting" && "bg-amber-500/10 border-amber-500/30",
        internalState === "offline" && "bg-red-500/15 border-red-500/30",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", current.dot)} />
      <span className={cn("text-[11px] font-medium tracking-tight", current.text)}>
        {current.label}
      </span>
    </div>
  );
}
