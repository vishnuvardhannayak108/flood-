"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Phone, 
  Clock, 
  ArrowUpRight, 
  CopyCheck, 
  ShieldAlert, 
  Flame,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import { RequestStatus, UrgencyLevel } from "@/lib/status";

interface AdminRequestItem {
  id: string;
  shortCode: string;
  citizenName: string;
  phone: string;
  urgency: UrgencyLevel;
  type: string;
  peopleCount: number;
  hasVulnerable: boolean;
  priorityScore: number;
  status: RequestStatus;
  createdAt: string;
  address: string;
  assignedTeam?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AdminRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedForAssign, setSelectedForAssign] = useState<AdminRequestItem | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>("Team Alpha 01");
  const [duplicateDrawerItem, setDuplicateDrawerItem] = useState<AdminRequestItem | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const json = await res.json();
      if (json.data) {
        setRequests(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (urgencyFilter !== "all" && r.urgency !== urgencyFilter) return false;
    if (
      searchQuery &&
      !r.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !r.address.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleAssignTeam = async (reqId: string, teamName: string) => {
    // Optimistic
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: "assigned" as RequestStatus, assignedTeam: teamName } : r
      )
    );
    setSelectedForAssign(null);

    try {
      await fetch(`/api/requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "assigned",
          assignedTeam: teamName,
          note: `Assigned to ${teamName} by Dispatcher`,
        }),
      });
      fetchRequests();
    } catch {
      // fallback
    }
  };

  const handleMarkDuplicate = async (reqId: string, primaryCode: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? { ...r, status: "duplicate" as RequestStatus, isDuplicate: true, duplicateOf: primaryCode }
          : r
      )
    );
    setDuplicateDrawerItem(null);

    try {
      await fetch(`/api/requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "duplicate",
          note: `Marked duplicate of #${primaryCode}`,
        }),
      });
      fetchRequests();
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <span>Emergency SOS Master Registry</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full life-cycle view of distress requests with algorithmic priority scores and deduplication detection.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
            {requests.filter((r) => r.status === "prioritized").length} Unassigned High Priority
          </span>
          <span className="px-3 py-1.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
            {requests.filter((r) => r.isDuplicate).length} Flagged Duplicates
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code (#FR-...), citizen name, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-xs font-semibold text-foreground"
            aria-label="Filter status"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="prioritized">Prioritized</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
            <option value="duplicate">Duplicates</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-xs font-semibold text-foreground"
            aria-label="Filter urgency"
          >
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Requests Data Table */}
      <Card className="overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="p-3 pl-4">Request #</th>
                <th className="p-3">Citizen Contact</th>
                <th className="p-3">Urgency & Priority</th>
                <th className="p-3">People & Hazards</th>
                <th className="p-3">Location</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Team</th>
                <th className="p-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    req.isDuplicate ? "bg-purple-50/20 dark:bg-purple-950/10" : ""
                  }`}
                >
                  <td className="p-3 pl-4 font-mono font-bold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>#{req.shortCode}</span>
                      {req.isDuplicate && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded font-black">
                          DUP
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-normal">
                      {req.createdAt}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-bold text-foreground">{req.citizenName}</div>
                    <div className="text-muted-foreground font-mono">{req.phone}</div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <UrgencyBadge urgency={req.urgency} />
                      <span className="font-extrabold text-sos flex items-center gap-0.5">
                        <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {req.priorityScore}
                      </span>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-foreground flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{req.peopleCount} individuals</span>
                    </div>
                    {req.hasVulnerable && (
                      <div className="text-[10px] text-red-600 font-bold">
                        Has infant / elderly
                      </div>
                    )}
                  </td>

                  <td className="p-3 max-w-[200px] truncate text-foreground font-medium" title={req.address}>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{req.address}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <StatusBadge status={req.status} />
                  </td>

                  <td className="p-3 font-semibold text-foreground">
                    {req.assignedTeam ? (
                      <span className="text-primary font-bold">{req.assignedTeam}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>

                  <td className="p-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-bold"
                        onClick={() => setSelectedForAssign(req)}
                      >
                        Assign
                      </Button>

                      {req.isDuplicate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs font-bold text-purple-600"
                          onClick={() => setDuplicateDrawerItem(req)}
                        >
                          Review Dup
                        </Button>
                      )}

                      <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                        <Link href={`/admin/requests/${req.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Dispatch Modal */}
      {selectedForAssign && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl border-2">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Dispatch Rescue Crew to #{selectedForAssign.shortCode}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="text-xs space-y-1 p-3 rounded-md bg-muted/40 border">
                <div><strong>Victim:</strong> {selectedForAssign.citizenName} ({selectedForAssign.peopleCount} persons)</div>
                <div><strong>Location:</strong> {selectedForAssign.address}</div>
                <div><strong>Urgency:</strong> {selectedForAssign.urgency.toUpperCase()} (Distress Score: {selectedForAssign.priorityScore})</div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Select Rescue Boat Unit
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full p-2.5 rounded-md border bg-background text-sm font-semibold"
                >
                  <option value="Team Alpha 01">Team Alpha 01 (Chaderghat Base - 4 Responders, Motor Zodiac)</option>
                  <option value="Team Bravo 02">Team Bravo 02 (Moosarambagh NDRF - 6 Responders, Heavy Raft)</option>
                  <option value="Team Charlie 03">Team Charlie 03 (SDRF Central Reserve - 4 Responders)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 font-bold"
                  onClick={() => handleAssignTeam(selectedForAssign.id, selectedTeam)}
                >
                  Confirm Dispatch Order
                </Button>
                <Button variant="outline" onClick={() => setSelectedForAssign(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Duplicate Review Drawer */}
      {duplicateDrawerItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-card shadow-2xl border-2 border-purple-400">
            <CardHeader className="p-4 border-b bg-purple-50 dark:bg-purple-950/40">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <CopyCheck className="h-5 w-5 text-purple-600" />
                Duplicate Incident Comparison Drawer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Algorithmic deduplication identified this SOS as sharing proximity (within 150m) and timestamp with #{duplicateDrawerItem.duplicateOf}.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <div className="font-bold text-foreground">Candidate Duplicate #{duplicateDrawerItem.shortCode}</div>
                  <div>Citizen: {duplicateDrawerItem.citizenName}</div>
                  <div>Phone: {duplicateDrawerItem.phone}</div>
                  <div>Location: {duplicateDrawerItem.address}</div>
                  <div>Time: {duplicateDrawerItem.createdAt}</div>
                </div>

                <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-1">
                  <div className="font-bold text-primary">Primary Target #{duplicateDrawerItem.duplicateOf}</div>
                  <div>Citizen: K. Venkatesh</div>
                  <div>Phone: +91 94401 22334</div>
                  <div>Location: Amberpet low-lying colony</div>
                  <div>Status: Verified / In Queue</div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                  onClick={() => setDuplicateDrawerItem(null)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Keep Tagged as Duplicate (Merge With Primary)
                </Button>
                <Button
                  variant="outline"
                  className="text-xs font-bold text-red-600"
                  onClick={() => {
                    setRequests((prev) =>
                      prev.map((r) =>
                        r.id === duplicateDrawerItem.id
                          ? { ...r, status: "verified" as RequestStatus, isDuplicate: false }
                          : r
                      )
                    );
                    setDuplicateDrawerItem(null);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark Unique (Un-merge)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
