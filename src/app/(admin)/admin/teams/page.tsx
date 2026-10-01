"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Users, 
  MapPin, 
  Plus, 
  LifeBuoy, 
  Phone,
  Loader2,
  AlertCircle
} from "lucide-react";
import { TeamStatus } from "@/types/database";

interface TeamItem {
  id: string;
  name: string;
  callsign: string;
  baseStation: string;
  boatType: string;
  capacity: number;
  sector: string;
  status: TeamStatus;
  responderCount: number;
  leadName: string;
  leadPhone: string;
  lat?: number;
  lng?: number;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newCallsign, setNewCallsign] = useState("");
  const [newSector, setNewSector] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (data.success && data.data) {
        setTeams(data.data);
      }
    } catch {
      setErrorMsg("Failed to synchronize with team telemetry system.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleToggleStatus = async (id: string, newStatus: TeamStatus) => {
    // Optimistic UI
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchTeams(); // Rollback if server fails
      }
    } catch {
      fetchTeams();
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;

    setSaving(true);
    try {
      const payload = {
        name: newTeamName,
        callsign: newCallsign || `ECHO-${teams.length + 1}`,
        baseStation: "Disaster Quick-Response Post",
        boatType: "Zodiac Inflatable Rescue Boat",
        capacity: 6,
        sector: newSector || "Central Hyderabad Sector",
        status: "available" as const,
        responderCount: 4,
        leadName: "Duty Rescue Officer",
        leadPhone: "+91 98480 00000",
        lat: 17.3753,
        lng: 78.4878,
      };

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTeams((prev) => [...prev, data.data]);
        setNewTeamName("");
        setNewCallsign("");
        setNewSector("");
        setShowAddModal(false);
      }
    } catch {
      setErrorMsg("Failed to register new rescue team.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>Rescue Fleet & Team Deployment</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational status, equipment manifests, and jurisdictional sectors of SDRF and NDRF rescue crews.
          </p>
        </div>

        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 font-bold text-xs"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Register New Rescue Team
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-bold rounded bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300">
          ⚠ {errorMsg}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3 bg-card">
          <div className="text-xs text-muted-foreground font-semibold">Total Teams Active</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{teams.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {teams.reduce((acc, t) => acc + (t.responderCount || 0), 0)} certified responders
          </div>
        </Card>

        <Card className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            Available For Dispatch
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {teams.filter((t) => t.status === "available").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Ready for instant callout</div>
        </Card>

        <Card className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
          <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
            Currently on Missions
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {teams.filter((t) => t.status === "busy").length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Operating in flooded zones</div>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Syncing rescue team fleet statuses...</p>
        </div>
      ) : teams.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <LifeBuoy className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
          <p className="text-sm font-semibold">No rescue teams configured in database.</p>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="mt-4 bg-primary text-xs font-bold"
          >
            Register Initial Team
          </Button>
        </Card>
      ) : (
        /* Teams Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <Card key={team.id} className="border shadow-sm">
              <CardHeader className="p-4 pb-2 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-card px-2 py-0.5 rounded border">
                        {team.callsign}
                      </span>
                      <CardTitle className="text-base font-bold text-foreground">
                        {team.name}
                      </CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{team.sector}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        team.status === "available"
                          ? "bg-emerald-500 animate-pulse"
                          : team.status === "busy"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold capitalize text-foreground">
                      {team.status}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-muted/30 border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Vessel / Equipment
                    </span>
                    <span className="font-semibold text-foreground">{team.boatType}</span>
                  </div>
                  <div className="p-2.5 rounded bg-muted/30 border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Base Station
                    </span>
                    <span className="font-semibold text-foreground">{team.baseStation}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded border bg-card text-xs">
                  <div>
                    <div className="font-bold text-foreground">{team.leadName}</div>
                    <div className="text-muted-foreground font-mono">{team.leadPhone}</div>
                  </div>
                  <Button size="sm" variant="outline" asChild className="h-7 text-xs font-bold">
                    <a href={`tel:${team.leadPhone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Call Lead
                    </a>
                  </Button>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-muted-foreground font-semibold">Change Readiness:</span>
                  <div className="flex rounded border p-0.5 bg-background">
                    {(["available", "busy", "offline"] as TeamStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleStatus(team.id, s)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize transition-colors ${
                          team.status === s
                            ? s === "available"
                              ? "bg-emerald-600 text-white"
                              : s === "busy"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-600 text-white"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl border-2">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Register New Rescue Team
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleAddTeam}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Team Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Team Echo 05"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Radio Callsign
                  </label>
                  <Input
                    placeholder="e.g. ECHO-5"
                    value={newCallsign}
                    onChange={(e) => setNewCallsign(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Operating Sector
                  </label>
                  <Input
                    placeholder="e.g. Sector South-West - Rajendranagar"
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90 font-bold"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register Team"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
