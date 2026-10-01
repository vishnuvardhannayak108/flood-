"use client";

import React, { useEffect, useState } from "react";
import { 
  getPendingRequests, 
  replayPendingQueue, 
  clearPendingQueue, 
  QueuedRequest 
} from "@/lib/offline-queue";
import { createClient } from "@/lib/supabase/client";
import { WifiOff, RefreshCw, Radio, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const checkPending = async () => {
    try {
      const list = await getPendingRequests();
      setPendingCount(list.length);
      return list.length;
    } catch {
      return 0;
    }
  };

  const syncQueue = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setIsSyncing(true);
    setSyncStatus("Synchronizing with emergency response servers...");

    const supabase = createClient();

    try {
      await replayPendingQueue(async (item: QueuedRequest) => {
        try {
          if (item.type === "sos") {
            const body = {
              lat: item.payload?.p_lat ?? item.payload?.lat ?? 17.3753,
              lng: item.payload?.p_lng ?? item.payload?.lng ?? 78.4878,
              phone: item.payload?.p_contact_phone ?? item.payload?.phone ?? "+91 98490 00000",
              peopleCount: item.payload?.p_people_count ?? item.payload?.peopleCount ?? 1,
              hasVulnerable: item.payload?.p_has_vulnerable ?? item.payload?.hasVulnerable ?? false,
              urgency: item.payload?.p_declared_urgency ?? item.payload?.urgency ?? "critical",
              type: item.payload?.p_type ?? item.payload?.type ?? "Trapped Civilian",
              description: item.payload?.p_description ?? item.payload?.description ?? "Transmitted from offline cache",
              address: item.payload?.p_address_text ?? item.payload?.address ?? "Hyderabad Flood Zone",
              citizenName: item.payload?.p_citizen_name ?? item.payload?.citizenName ?? "Evacuee",
            };

            const res = await fetch("/api/requests", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

            // Also trigger Supabase RPC in background if online
            try {
              await supabase.rpc("submit_sos", item.payload);
            } catch {
              // fallback
            }

            return res.ok;
          } else if (item.type === "incident") {
            const body = {
              title: item.payload?.p_title ?? item.payload?.title ?? "Flood Incident Report",
              description: item.payload?.p_description ?? item.payload?.description ?? "",
              waterLevelCm: item.payload?.p_water_level_cm ?? item.payload?.waterLevelCm ?? 50,
              locationName: item.payload?.p_location_name ?? item.payload?.locationName ?? "Hyderabad",
              lat: item.payload?.p_lat ?? item.payload?.lat ?? 17.385,
              lng: item.payload?.p_lng ?? item.payload?.lng ?? 78.486,
              reporterName: item.payload?.p_reporter_name ?? item.payload?.reporterName ?? "Citizen",
            };

            const res = await fetch("/api/incidents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });

            try {
              await supabase.rpc("report_flood_incident", item.payload);
            } catch {
              // fallback
            }

            return res.ok;
          } else if (item.type === "status_update") {
            const id = item.payload?.id || item.payload?.p_request_id;
            if (id) {
              const res = await fetch(`/api/requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item.payload),
              });
              return res.ok;
            }
          }
          return true;
        } catch (err) {
          console.error("Replay failure for item", item, err);
          return false;
        }
      });
    } catch (e) {
      console.error("Sync queue error", e);
    } finally {
      const remaining = await checkPending();
      setIsSyncing(false);
      if (remaining === 0) {
        setSyncStatus("All offline dispatches synced successfully!");
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus(null);
      }
    }
  };

  const handleDiscard = async () => {
    await clearPendingQueue();
    await checkPending();
  };

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    checkPending().then((count) => {
      // Auto-sync if online and items exist
      if (typeof navigator !== "undefined" && navigator.onLine && count > 0) {
        syncQueue();
      }
    });

    const handleOnline = () => {
      setIsOffline(false);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOutboxUpdate = () => {
      checkPending().then((count) => {
        if (typeof navigator !== "undefined" && navigator.onLine && count > 0) {
          syncQueue();
        }
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("ferrcs_outbox_updated", handleOutboxUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("ferrcs_outbox_updated", handleOutboxUpdate);
    };
  }, []);

  if (!isOffline && pendingCount === 0 && !syncStatus) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 shadow-md transition-all">
      <div className="flex items-center gap-2">
        {isOffline ? (
          <WifiOff className="h-4 w-4 shrink-0 animate-bounce" />
        ) : (
          <Radio className="h-4 w-4 shrink-0 animate-pulse text-amber-200" />
        )}
        <span>
          {syncStatus
            ? syncStatus
            : isOffline
            ? pendingCount > 0
              ? `Offline: ${pendingCount} request(s) queued locally. Will send automatically on reconnection.`
              : "You are currently offline. Emergency services will cache instructions locally."
            : `${pendingCount} offline request(s) pending sync.`}
        </span>
      </div>

      {!isOffline && pendingCount > 0 && (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={syncQueue}
            disabled={isSyncing}
            className="h-7 text-xs px-2.5 font-bold bg-white text-amber-900 hover:bg-white/90"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDiscard}
            disabled={isSyncing}
            className="h-7 text-xs px-2 font-bold text-white hover:bg-amber-700 hover:text-white"
            title="Discard pending offline requests"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Discard</span>
          </Button>
        </div>
      )}
    </div>
  );
}
