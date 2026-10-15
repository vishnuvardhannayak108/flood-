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
  const [internalState, setInternalState] = useState<ConnectionState>(
    state || "connected"
  );

  useEffect(() => {
    if (state) {
      setInternalState(state);
      return;
    }

    const handleOnline = () => setInternalState("connected");
    const handleOffline = () => setInternalState("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setInternalState("offline");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [state]);

  const configs: Record<
    ConnectionState,
    { dot: string; bg: string; text: string; label: string }
  > = {
    connected: {
      dot: "bg-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/25",
      text: "text-emerald-700 dark:text-emerald-400",
      label: t("common.connected", "Live"),
    },
    reconnecting: {
      dot: "bg-amber-400 animate-ping",
      bg: "bg-amber-500/10 border-amber-500/25",
      text: "text-amber-700 dark:text-amber-400",
      label: t("common.reconnecting", "Reconnecting…"),
    },
    offline: {
      dot: "bg-red-400",
      bg: "bg-red-500/10 border-red-500/25",
      text: "text-red-700 dark:text-red-400",
      label: t("common.offline", "Offline"),
    },
  };

  const current = configs[internalState];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-300",
        current.bg,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {internalState === "connected" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", current.dot)} />
      </span>
      <span className={cn("tracking-tight", current.text)}>{current.label}</span>
    </div>
  );
}
