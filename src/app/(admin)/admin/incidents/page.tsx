"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  Waves, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { VerificationStatus } from "@/types/database";

interface IncidentItem {
  id: string;
  title: string;
  description: string;
  waterLevelCm: number;
  locationName: string;
  lat: number;
  lng: number;
  reporterName: string;
  reportedAt: string;
  status: VerificationStatus;
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchIncidents = async () => {
    try {
      const res = await fetch("/api/incidents");
      const json = await res.json();
      if (json.data) {
        setIncidents(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: VerificationStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );

    try {
      await fetch("/api/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchIncidents();
    } catch {
      // fallback
    }
  };

  const filtered = incidents.filter((inc) => {
    if (statusFilter !== "all" && inc.status !== statusFilter) return false;
    if (
      searchQuery &&
      !inc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inc.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <span>Community Flood Incident Verification Queue</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review crowdsourced flood depth reports before publishing to public maps and emergency routing engines.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {incidents.filter((i) => i.status === "pending").length} Pending Verification
          </span>
          <span className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {incidents.filter((i) => i.status === "verified").length} Verified & Active
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports by area, description, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-md border bg-background text-xs font-semibold text-foreground cursor-pointer"
            aria-label="Filter verification status"
          >
            <option value="all">All Incidents ({incidents.length})</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <Card
            key={item.id}
            className={`border-l-4 transition-all ${
              item.status === "pending"
                ? "border-l-amber-500"
                : item.status === "verified"
                ? "border-l-emerald-500"
                : "border-l-slate-400 opacity-75"
            }`}
          >
            <CardHeader className="p-4 sm:p-5 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-extrabold uppercase ${
                      item.status === "pending"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : item.status === "verified"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.reportedAt}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 border border-sky-200 text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Waves className="h-3.5 w-3.5" />
                    <span>Water Depth: <strong>{item.waterLevelCm} cm</strong></span>
                  </div>
                </div>
              </div>

              <CardTitle className="text-base sm:text-lg font-bold text-foreground mt-2">
                {item.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
              <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                {item.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1 font-semibold text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{item.locationName}</span>
                  <span className="font-mono text-muted-foreground">({item.lat.toFixed(4)}, {item.lng.toFixed(4)})</span>
                </div>

                <div>
                  Reported by: <strong>{item.reporterName}</strong>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-bold">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Inspect Location on Map
                  </a>
                </Button>

                {item.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-bold border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleUpdateStatus(item.id, "rejected")}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject Report
                    </Button>

                    <Button
                      size="sm"
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpdateStatus(item.id, "verified")}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verify & Publish
                    </Button>
                  </div>
                )}

                {item.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => handleUpdateStatus(item.id, "pending")}
                  >
                    Reset to Pending
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
