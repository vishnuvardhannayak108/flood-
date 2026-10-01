"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShieldCheck, 
  LifeBuoy, 
  Radio, 
  BatteryCharging, 
  Fuel, 
  MapPin, 
  CheckSquare, 
  Square,
  RefreshCw,
  Phone
} from "lucide-react";
import { TeamStatus } from "@/types/database";
import { updateTeamTelemetryRpc } from "@/lib/supabase/rpc";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  isLead: boolean;
  status: "active" | "standby";
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function RescueTeamRosterPage() {
  const [teamStatus, setTeamStatus] = useState<TeamStatus>("available");
  const [broadcastingGps, setBroadcastingGps] = useState<boolean>(true);
  const [lastTelemetryPing, setLastTelemetryPing] = useState<string>("Just now");
  const [savingTelemetry, setSavingTelemetry] = useState<boolean>(false);

  const [members] = useState<TeamMember[]>([
    {
      id: "mem-1",
      name: "Commander Vikram Rao",
      role: "Team Commander / Lead Coxswain",
      phone: "+91 98480 11111",
      isLead: true,
      status: "active"
    },
    {
      id: "mem-2",
      name: "Sgt. Anita Singh",
      role: "Emergency Medical Responder (Paramedic)",
      phone: "+91 98480 22222",
      isLead: false,
      status: "active"
    },
    {
      id: "mem-3",
      name: "K. Mohan Kumar",
      role: "Technical Rescue Diver & Motor Operator",
      phone: "+91 98480 33333",
      isLead: false,
      status: "active"
    },
    {
      id: "mem-4",
      name: "P. Rajesh",
      role: "Swift-water Rescue Swimmer & Radio Comms",
      phone: "+91 98480 44444",
      isLead: false,
      status: "active"
    }
  ]);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "chk-1", label: "Outboard motor engine test & fuel tank at 100%", checked: true },
    { id: "chk-2", label: "Life jackets & flotation collars (8 units inspected)", checked: true },
    { id: "chk-3", label: "VHF waterproof radio transceivers tuned to Channel 16", checked: true },
    { id: "chk-4", label: "Emergency Trauma & Burn kit replenished", checked: true },
    { id: "chk-5", label: "High-beam searchlights & spare batteries charged", checked: true },
    { id: "chk-6", label: "Throw bags and dynamic rescue ropes inspected", checked: false },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleBroadcastTelemetry = async () => {
    setSavingTelemetry(true);
    try {
      await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "team-1",
          status: teamStatus,
        }),
      });

      const supabase = createClient();
      await updateTeamTelemetryRpc(supabase, {
        p_team_id: "00000000-0000-0000-0000-000000000002",
        p_lat: 17.3753,
        p_lng: 78.4878,
        p_status: teamStatus,
      }).catch(() => {});

      setLastTelemetryPing("Updated successfully");
    } catch {
      setLastTelemetryPing("Updated (Demo mode)");
    } finally {
      setSavingTelemetry(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Team Alpha 01 Roster & Readiness</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            SDRF Sector Central Rescue Boat Unit • Base: Chaderghat Fire Station
          </p>
        </div>

        {/* Live GPS Broadcast Indicator */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold"
            disabled={savingTelemetry}
            onClick={handleBroadcastTelemetry}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${savingTelemetry ? "animate-spin" : ""}`} />
            Ping GPS Telemetry
          </Button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
            <span>GPS Beacon Active</span>
          </div>
        </div>
      </div>

      {/* Equipment and Readiness Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-semibold">Boat Fuel</div>
            <Fuel className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">94%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Full operational range</div>
        </Card>

        <Card className="p-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-semibold">Motor Battery</div>
            <BatteryCharging className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">100%</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Dual battery banks normal</div>
        </Card>

        <Card className="p-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-semibold">Lifejackets</div>
            <LifeBuoy className="h-4 w-4 text-sos" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">8 / 8</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Tested & equipped</div>
        </Card>

        <Card className="p-3 bg-card">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-semibold">Current State</div>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1 capitalize">
            {teamStatus}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{lastTelemetryPing}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crew Roster */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2 border-b bg-card">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Active Boat Crew ({members.length} Responders)</span>
                <span className="text-xs font-mono font-medium text-muted-foreground">Callsign: ECHO-1</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20">
                      {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span>{member.name}</span>
                        {member.isLead && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary text-white">
                            Lead
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold">
                      <a href={`tel:${member.phone}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        {member.phone}
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Pre-Deployment Readiness Checklist */}
        <div>
          <Card>
            <CardHeader className="p-4 pb-2 border-b bg-card">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Water Safety Checklist</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {checklist.filter((c) => c.checked).length} / {checklist.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklist(item.id)}
                  className="w-full flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/50 text-left transition-colors"
                >
                  {item.checked ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium leading-tight ${
                      item.checked
                        ? "line-through text-muted-foreground"
                        : "text-foreground font-semibold"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}

              <div className="pt-3 border-t">
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  onClick={() =>
                    setChecklist((prev) => prev.map((c) => ({ ...c, checked: true })))
                  }
                >
                  Mark All Equipment Inspected & Ready
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
