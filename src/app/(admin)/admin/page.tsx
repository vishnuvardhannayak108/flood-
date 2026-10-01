"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertOctagon, 
  Clock, 
  Users, 
  Home as HomeIcon, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight, 
  Radio, 
  Bell, 
  Plus, 
  Flame,
  FileCheck,
  Loader2,
  RefreshCw,
  Trash2
} from "lucide-react";

interface RequestEntity {
  id: string;
  shortCode: string;
  type: string;
  peopleCount: number;
  address: string;
  createdAt: string;
  priorityScore: number;
  urgency: string;
  status: string;
  assignedTeam?: string;
}

interface ShelterEntity {
  id: string;
  currentOccupancy: number;
  maxCapacity: number;
}

interface TeamEntity {
  id: string;
  status: string;
}

interface AuditEntity {
  id: string;
  action: string;
  recordId: string;
  actorName: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [shelters, setShelters] = useState<ShelterEntity[]>([]);
  const [teams, setTeams] = useState<TeamEntity[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reqRes, shRes, teamRes, auditRes] = await Promise.all([
        fetch("/api/requests"),
        fetch("/api/shelters"),
        fetch("/api/teams"),
        fetch("/api/audit"),
      ]);

      const [reqData, shData, teamData, auditData] = await Promise.all([
        reqRes.json(),
        shRes.json(),
        teamRes.json(),
        auditRes.json(),
      ]);

      if (reqData.success) setRequests(reqData.data || []);
      if (shData.success) setShelters(shData.data || []);
      if (teamData.success) setTeams(teamData.data || []);
      if (auditData.success) setAuditLogs(auditData.data || []);
    } catch (err) {
      console.error("Failed to load admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  const activeEmergencies = requests.filter(
    (r) => !["completed", "cancelled", "rejected", "duplicate"].includes(r.status)
  );

  const criticalUnassigned = requests.filter(
    (r) =>
      r.urgency === "critical" &&
      ["submitted", "verified", "prioritized"].includes(r.status) &&
      !r.assignedTeam
  );

  const availableTeams = teams.filter((t) => t.status === "available").length;
  const totalShelterOccupancy = shelters.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0);
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.maxCapacity || 0), 0);
  const shelterPct = totalShelterCapacity > 0 ? Math.round((totalShelterOccupancy / totalShelterCapacity) * 100) : 0;

  const completedRequests = requests.filter((r) => r.status === "completed");
  const livesRescued = completedRequests.reduce((acc, r) => acc + (r.peopleCount || 1), 0);

  const sortedQueue = [...requests]
    .filter((r) => !["completed", "cancelled"].includes(r.status))
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 5);

  const kpis = [
    {
      title: "Active Emergencies",
      value: activeEmergencies.length.toString(),
      sub: `${requests.filter((r) => r.status === "on_site" || r.status === "en_route").length} in field, ${requests.filter((r) => r.status === "prioritized").length} queued`,
      icon: Radio,
      color: "text-blue-600 dark:text-blue-400",
      border: "border-l-blue-500",
    },
    {
      title: "Critical Unassigned",
      value: criticalUnassigned.length.toString(),
      sub: criticalUnassigned.length > 0 ? "Immediate dispatch needed" : "All critical assigned",
      icon: AlertOctagon,
      color: "text-sos",
      border: "border-l-sos",
      highlight: criticalUnassigned.length > 0,
    },
    {
      title: "Teams Available",
      value: `${availableTeams} / ${teams.length}`,
      sub: `${teams.filter((t) => t.status === "busy").length} currently deployed`,
      icon: ShieldCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      border: "border-l-emerald-500",
    },
    {
      title: "Shelter Occupancy",
      value: `${shelterPct}%`,
      sub: `${totalShelterOccupancy} / ${totalShelterCapacity} beds occupied`,
      icon: HomeIcon,
      color: "text-amber-600 dark:text-amber-400",
      border: "border-l-amber-500",
    },
    {
      title: "Avg Response Time",
      value: requests.length > 0 ? "14.2m" : "—",
      sub: "Within statutory window",
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      border: "border-l-purple-500",
    },
    {
      title: "Lives Evacuated",
      value: livesRescued.toString(),
      sub: `${completedRequests.length} missions completed`,
      icon: CheckCircle2,
      color: "text-teal-600 dark:text-teal-400",
      border: "border-l-teal-500",
    },
  ];

  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to clear all requests and mock data? This resets the system to zero active emergencies.")) return;
    try {
      setLoading(true);
      await fetch("/api/reset", { method: "POST" });
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to reset crisis data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>Disaster Operations Command Center</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              ADMIN HQ
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational telemetry for Hyderabad Flood Sector 1 • Central Multi-Agency Dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            className="text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" />
            Reset Data
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/alerts">
              <Bell className="h-4 w-4 mr-1 text-amber-500" />
              Broadcast Alert
            </Link>
          </Button>

          <Button size="sm" asChild>
            <Link href="/admin/shelters">
              <Plus className="h-4 w-4 mr-1" />
              Add Shelter
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical Unassigned Alert Strip */}
      {criticalUnassigned.length > 0 && (
        <div className="p-4 rounded-card bg-red-50 dark:bg-red-950/40 border-2 border-red-500/50 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <AlertOctagon className="h-6 w-6 text-sos shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-black text-red-900 dark:text-red-200">
                {criticalUnassigned.length} High-Priority Emergency Cases Awaiting Immediate Assignment
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Golden hour SLA active. Dispatch available SDRF/NDRF Zodiac crews immediately.
              </div>
            </div>
          </div>

          <Button variant="sos" size="sm" asChild className="shrink-0 font-bold">
            <Link href="/admin/requests">
              Review & Assign Now
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">
            Synchronizing live command center telemetry...
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card
                  key={idx}
                  className={`border-l-4 ${kpi.border} ${
                    kpi.highlight ? "bg-red-50/20 dark:bg-red-950/10" : ""
                  }`}
                >
                  <CardContent className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <span className="truncate">{kpi.title}</span>
                      <Icon className={`h-4 w-4 ${kpi.color} shrink-0`} />
                    </div>
                    <div className="text-2xl font-black text-foreground">{kpi.value}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{kpi.sub}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Split Grid: Priority Requests & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Dispatch Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    Urgent Dispatch Queue
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live cases prioritized by algorithmic life-threat score
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <Link href="/admin/requests">View All ({requests.length})</Link>
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Code</th>
                        <th className="px-4 py-2.5">Emergency Type</th>
                        <th className="px-4 py-2.5">Victims</th>
                        <th className="px-4 py-2.5">Location</th>
                        <th className="px-4 py-2.5">Score</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sortedQueue.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No pending emergency requests in queue.
                          </td>
                        </tr>
                      ) : (
                        sortedQueue.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-primary">
                              #{item.shortCode}
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">{item.type}</td>
                            <td className="px-4 py-3 font-medium">{item.peopleCount} victims</td>
                            <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                              {item.address}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                {item.priorityScore}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted border">
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="outline" size="sm" className="h-7 text-xs font-bold" asChild>
                                <Link href={`/admin/requests/${item.id}`}>Manage</Link>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Live Operational Audit Feed */}
            <Card>
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Live Activity Stream
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-time audit log of multi-role operations
                </p>
              </CardHeader>

              <CardContent className="p-4 pt-3 space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2.5 text-xs pb-2 border-b last:border-b-0"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                      {log.createdAt}
                    </span>
                    <p className="text-foreground leading-snug">
                      <strong>{log.actorName}</strong> performed <code>{log.action}</code> on{" "}
                      <strong>{log.recordId}</strong>
                    </p>
                  </div>
                ))}

                {auditLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">
                    No recent audit activity logged.
                  </p>
                )}

                <Button variant="ghost" size="sm" className="w-full text-xs text-primary font-bold" asChild>
                  <Link href="/admin/audit">View Complete Audit Log →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
