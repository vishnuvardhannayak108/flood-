"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  Compass, 
  MapPin, 
  Users, 
  Clock, 
  ArrowUpRight, 
  Phone, 
  Radio, 
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { RequestStatus, UrgencyLevel } from "@/lib/status";

interface ActiveMission {
  id: string;
  shortCode: string;
  citizenName: string;
  phone: string;
  peopleCount: number;
  urgency: UrgencyLevel;
  address: string;
  status: RequestStatus;
  createdAt: string;
  assignedTeam?: string;
  notes?: string;
}

export default function RescueActiveOperationsPage() {
  const [operations, setOperations] = useState<ActiveMission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveOps = async () => {
    try {
      const res = await fetch("/api/requests");
      const json = await res.json();
      if (json.data) {
        const active = json.data.filter((r: ActiveMission) =>
          ["accepted", "en_route", "on_site"].includes(r.status)
        );
        setOperations(active);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOps();
    const interval = setInterval(fetchActiveOps, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (id: string, currentStatus: RequestStatus) => {
    let next: RequestStatus = currentStatus;
    if (currentStatus === "accepted") next = "en_route";
    else if (currentStatus === "en_route") next = "on_site";
    else if (currentStatus === "on_site") next = "completed";

    // Optimistic
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status: next } : op))
    );

    try {
      await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          note: `Advanced to ${next} by crew`,
        }),
      });
      fetchActiveOps();
    } catch {
      // fallback
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <span>Active Rescue Operations</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time tracking of missions currently in field deployment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-bold"
            onClick={fetchActiveOps}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 px-3 py-1.5 rounded-md">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>{operations.length} Active Deployments</span>
          </div>
        </div>
      </div>

      {operations.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Compass className="h-6 w-6" />
          </div>
          <div className="font-bold text-sm text-foreground">No Missions Currently Deployed</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            All claimed operations have been resolved or are awaiting assignment from the Priority Queue.
          </p>
          <Button size="sm" asChild variant="outline">
            <Link href="/rescue">Open Priority Queue</Link>
          </Button>
        </Card>
      ) : (
        /* Grid of Operations */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {operations.map((op) => (
            <Card
              key={op.id}
              className={`border-l-4 ${
                op.urgency === "critical" ? "border-l-sos" : "border-l-primary"
              } shadow-sm`}
            >
              <CardHeader className="p-4 pb-2 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black bg-card px-2 py-0.5 rounded border">
                      #{op.shortCode}
                    </span>
                    <UrgencyBadge urgency={op.urgency} />
                  </div>
                  <StatusBadge status={op.status} />
                </div>
                <CardTitle className="text-base font-bold text-foreground mt-2">
                  {op.assignedTeam || "Team Alpha 01"} • {op.peopleCount} Evacuees
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-foreground font-bold">{op.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Logged: {op.createdAt}</span>
                  </div>
                </div>

                {/* Citizen Contact Strip */}
                <div className="flex items-center justify-between p-2.5 rounded-md bg-card border text-xs">
                  <div>
                    <div className="font-bold text-foreground">{op.citizenName}</div>
                    <div className="text-muted-foreground font-mono">{op.phone}</div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="h-8 text-xs font-bold">
                    <a href={`tel:${op.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Call Direct
                    </a>
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link href={`/rescue/requests/${op.id}`}>
                      View Full Details
                      <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>

                  {op.status !== "completed" && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 font-bold text-xs"
                      onClick={() => handleAdvanceStatus(op.id, op.status)}
                    >
                      {op.status === "accepted" && "Advance: En Route →"}
                      {op.status === "en_route" && "Advance: On Site →"}
                      {op.status === "on_site" && "Finalize: Complete ✓"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
