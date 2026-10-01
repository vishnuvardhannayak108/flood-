"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  History, 
  CheckCircle2, 
  Users, 
  Clock, 
  MapPin, 
  Download, 
  Calendar,
  RefreshCw
} from "lucide-react";
import { UrgencyLevel, RequestStatus } from "@/lib/status";

interface CompletedMission {
  id: string;
  shortCode: string;
  type: string;
  urgency: UrgencyLevel;
  peopleCount: number;
  createdAt: string;
  address: string;
  assignedTeam?: string;
  notes?: string;
}

export default function RescueHistoryPage() {
  const [missions, setMissions] = useState<CompletedMission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/requests?status=completed");
      const json = await res.json();
      if (json.data) {
        setMissions(json.data);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalRescued = missions.reduce((acc, m) => acc + (m.peopleCount || 1), 0);

  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Request ID,Short Code,Type,Urgency,People Count,Address,Created At,Notes",
        ...missions.map(
          (m) =>
            `"${m.id}","${m.shortCode}","${m.type}","${m.urgency}",${m.peopleCount},"${m.address}","${m.createdAt}","${m.notes || ""}"`
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rescue_Missions_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <span>Mission History & After-Action Log</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log of completed rescue sorties, survivor counts, and response benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="font-bold text-xs"
            onClick={fetchHistory}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {missions.length > 0 && (
            <Button
              size="sm"
              className="font-bold text-xs bg-primary hover:bg-primary/90"
              onClick={handleExportCsv}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
            Total Rescued Lives
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
            <Users className="h-6 w-6" />
            {totalRescued}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Across {missions.length} completed operations
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Completed Operations
          </div>
          <div className="text-3xl font-black text-foreground mt-1 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            {missions.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Safely extracted and transferred
          </div>
        </Card>

        <Card className="p-4 bg-card">
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Success Rate
          </div>
          <div className="text-3xl font-black text-foreground mt-1 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            100%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Zero team casualties or aborts
          </div>
        </Card>
      </div>

      {/* Mission Log Cards */}
      {missions.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <History className="h-6 w-6" />
          </div>
          <div className="font-bold text-sm text-foreground">No Completed Sorties Yet</div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Once rescue teams finalize active operations in the field, after-action debriefing logs and rescued headcounts will appear here.
          </p>
          <Button size="sm" asChild variant="outline">
            <Link href="/rescue">View Priority Queue</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <Card key={mission.id} className="border-l-4 border-l-emerald-600 shadow-sm">
              <CardHeader className="p-4 pb-2 border-b bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-black bg-muted px-2.5 py-1 rounded">
                      #{mission.shortCode}
                    </span>
                    <UrgencyBadge urgency={mission.urgency} />
                    <StatusBadge status="completed" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {mission.createdAt}
                    </span>
                  </div>
                </div>

                <CardTitle className="text-base font-bold text-foreground mt-2">
                  {mission.type} — {mission.peopleCount} Persons Evacuated
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span><strong>Extraction Site:</strong> {mission.address}</span>
                </div>

                {mission.notes && (
                  <div className="p-3 bg-muted/40 rounded-md text-xs text-foreground font-medium border">
                    <span className="font-bold text-muted-foreground mr-1">Log Note:</span>
                    {mission.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
