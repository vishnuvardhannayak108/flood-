"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { 
  ArrowLeft, 
  PhoneCall, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  XCircle, 
  Radio, 
  LifeBuoy,
  RefreshCw
} from "lucide-react";
import { RequestStatus, REQUEST_STATUS_MAP, UrgencyLevel } from "@/lib/status";

interface RequestData {
  id: string;
  shortCode: string;
  status: RequestStatus;
  urgency: UrgencyLevel;
  type: string;
  peopleCount: number;
  hasVulnerable: boolean;
  address: string;
  description: string;
  assignedTeam?: string;
  createdAt: string;
  history: Array<{ status: RequestStatus; time: string; note: string }>;
}

export default function RequestTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${id}`);
      const json = await res.json();
      if (json.data) {
        setRequest(json.data);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
    // Poll every 3 seconds for live responder status updates
    const interval = setInterval(fetchRequest, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const trackerSteps: RequestStatus[] = [
    "submitted",
    "verified",
    "prioritized",
    "assigned",
    "accepted",
    "en_route",
    "on_site",
    "completed",
  ];

  const currentStatus = request?.status || "prioritized";
  const currentStepIndex = REQUEST_STATUS_MAP[currentStatus]?.stepIndex || 2;

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", note: "Cancelled by citizen" }),
      });
      fetchRequest();
    } catch {
      // fallback
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !request) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
        <div className="text-xs text-muted-foreground">Connecting to live tracking satellite...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground -ml-2" asChild>
          <Link href="/citizen/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="font-mono text-xs font-bold bg-muted px-2.5 py-1 rounded">
          Request #{request?.shortCode || id}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span>Live Tracking</span>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <Card className="border-2 border-primary/40 shadow-md">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <UrgencyBadge urgency={request?.urgency || "critical"} />
            <StatusBadge status={currentStatus} />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-foreground">
              {currentStatus === "assigned"
                ? "Rescue Team Assigned"
                : currentStatus === "accepted"
                ? "Team Preparing Launch"
                : currentStatus === "en_route"
                ? "Rescue Boat En Route"
                : currentStatus === "on_site"
                ? "Rescue Team Arrived On Site"
                : currentStatus === "completed"
                ? "Rescue Completed"
                : currentStatus === "cancelled"
                ? "Request Cancelled"
                : "Awaiting Dispatch"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {request?.assignedTeam
                ? `Assigned to ${request.assignedTeam}. Keep your phone line clear.`
                : "Disaster operations center is actively monitoring your distress signal."}
            </p>
          </div>

          {/* Assigned Crew Strip */}
          {request?.assignedTeam && currentStatus !== "completed" && (
            <div className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Unit</div>
                <div className="text-xs font-bold text-foreground">{request.assignedTeam}</div>
              </div>
              <Button size="sm" variant="outline" asChild className="h-8 text-xs font-bold">
                <a href="tel:112">
                  <PhoneCall className="h-3 w-3 mr-1" />
                  Call Base
                </a>
              </Button>
            </div>
          )}

          {/* Vertical Progress Tracker */}
          <div className="pt-2 border-t space-y-2">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Dispatch Progression
            </div>
            <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
              {trackerSteps.map((stepKey, idx) => {
                const stepMeta = REQUEST_STATUS_MAP[stepKey];
                const isPassed = stepMeta.stepIndex <= currentStepIndex;
                const isCurrent = stepKey === currentStatus;

                return (
                  <div key={stepKey} className="relative flex items-center justify-between text-xs">
                    <span
                      className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isPassed
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-muted text-transparent"
                      }`}
                    >
                      {isPassed && <CheckCircle2 className="h-2.5 w-2.5" />}
                    </span>

                    <span
                      className={`font-semibold ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {stepMeta.label}
                    </span>

                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-primary/10 text-primary rounded">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location and Info */}
          <div className="pt-2 border-t text-xs space-y-1 text-muted-foreground">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{request?.address}</span>
            </div>
            <div>
              Headcount: <strong>{request?.peopleCount} individuals</strong>
              {request?.hasVulnerable && " (Includes Infant/Elderly)"}
            </div>
          </div>

          {/* Cancellation button if not completed */}
          {currentStatus !== "completed" && currentStatus !== "cancelled" && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                disabled={cancelling}
                onClick={handleCancel}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                {cancelling ? "Cancelling..." : "Cancel Emergency Request (I am Safe)"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
