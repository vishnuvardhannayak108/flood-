"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  AlertOctagon, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Filter, 
  ShieldAlert, 
  Check, 
  Phone, 
  ArrowUpRight,
  Flame,
  Radio,
  RefreshCw,
  Zap
} from "lucide-react";
import { UrgencyLevel, RequestStatus } from "@/lib/status";

interface QueueItem {
  id: string;
  shortCode: string;
  urgency: UrgencyLevel;
  type: string;
  peopleCount: number;
  hasVulnerable: boolean;
  priorityScore: number;
  distanceKm: number;
  createdAt: string;
  address: string;
  status: RequestStatus;
  description: string;
  assignedTeam?: string;
}

export default function RescueQueuePage() {
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests");
      const json = await res.json();
      if (json.data) {
        setRequests(json.data);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptRequest = async (id: string) => {
    // Optimistic
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "accepted" as RequestStatus, assignedTeam: "Team Alpha 01" } : r
      )
    );

    try {
      await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "accepted",
          assignedTeam: "Team Alpha 01",
          note: "Accepted by Team Alpha 01",
        }),
      });
      fetchQueue();
    } catch {
      // fallback
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate" }),
      });
      fetchQueue();
    } finally {
      setSimulating(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (filterUrgency !== "all" && r.urgency !== filterUrgency) return false;
    if (
      searchQuery &&
      !r.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.type.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Operational Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Rescue Priority Queue</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
              {requests.filter((r) => r.urgency === "critical" && r.status !== "completed").length} CRITICAL
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked by multi-factor distress score (people, vulnerable individuals, water level, wait time).
          </p>
        </div>

        {/* Live Audio / ARIA notification status & Refresh */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-bold"
            onClick={fetchQueue}
            title="Refresh queue"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs font-bold"
            disabled={simulating}
            onClick={handleSimulate}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            {simulating ? "Simulating..." : "Inject Test Flood SOS"}
          </Button>

          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Live Dispatch Active</span>
          </div>
        </div>
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-card">
          <div className="text-xs text-muted-foreground font-semibold">Queue Total</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {requests.filter((r) => r.status !== "completed").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Active uncompleted</div>
        </Card>

        <Card className="p-3 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <div className="text-xs text-sos font-bold">Critical Priority</div>
          <div className="text-2xl font-extrabold text-sos mt-1">
            {requests.filter((r) => r.urgency === "critical" && r.status !== "completed").length}
          </div>
          <div className="text-[11px] text-red-650 dark:text-red-400 mt-0.5">Needs immediate boat</div>
        </Card>

        <Card className="p-3 bg-card">
          <div className="text-xs text-muted-foreground font-semibold">Deployed Teams</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {requests.filter((r) => ["accepted", "en_route", "on_site"].includes(r.status)).length || 2}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Crews deployed</div>
        </Card>

        <Card className="p-3 bg-card">
          <div className="text-xs text-muted-foreground font-semibold">Rescued Completed</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {requests.filter((r) => r.status === "completed").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Safely evacuated</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search request #ID, area, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:inline" />
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-sm font-semibold text-foreground cursor-pointer outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by urgency"
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">Critical Only</option>
            <option value="high">High & Critical</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
            <Check className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Sector Clear • Priority Queue Empty</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No pending emergency distress signals in this sector. You can submit an SOS from the Citizen portal or inject a test crisis scenario.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button size="sm" asChild variant="outline">
              <Link href="/citizen/sos">Submit Citizen SOS</Link>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold" onClick={handleSimulate}>
              <Zap className="h-3.5 w-3.5 mr-1" />
              Simulate Flash Flood Outbreak
            </Button>
          </div>
        </Card>
      ) : (
        /* Requests Queue List */
        <div className="space-y-3">
          {filtered.map((item) => {
            const isCritical = item.urgency === "critical";

            return (
              <Card
                key={item.id}
                className={`transition-all hover:shadow-md ${
                  isCritical
                    ? "border-l-4 border-l-sos bg-red-50/20 dark:bg-red-950/10"
                    : "border-l-4 border-l-primary"
                }`}
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black bg-muted px-2.5 py-1 rounded">
                        #{item.shortCode}
                      </span>
                      <UrgencyBadge urgency={item.urgency} />
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1 text-primary">
                        <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        Score: <strong>{item.priorityScore}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="space-y-1">
                    <div className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>{item.type}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {item.peopleCount} {item.peopleCount === 1 ? "Person" : "People"}
                        {item.hasVulnerable && " (Vulnerable: Child/Elderly)"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{item.address}</span>
                    </p>
                  </div>

                  {/* Action footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {item.assignedTeam ? (
                        <span>Assigned to: <strong>{item.assignedTeam}</strong></span>
                      ) : (
                        <span>Ready for boat dispatch claim</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/rescue/requests/${item.id}`}>
                          View Details
                          <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>

                      {item.status !== "accepted" && item.status !== "en_route" && item.status !== "on_site" && item.status !== "completed" ? (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(item.id)}
                          className="bg-primary hover:bg-primary/90 font-bold"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                          Accept Mission
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                          asChild
                        >
                          <Link href={`/rescue/requests/${item.id}`}>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Active (Advance Status →)
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
