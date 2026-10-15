"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  Home,
  FileText,
  PhoneCall,
  Radio,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { RequestStatus, UrgencyLevel } from "@/lib/status";
import { cn } from "@/lib/utils";

const HOLD_DURATION = 1500;
const INTERVAL_STEP = 30;

interface ActiveRequestState {
  id: string;
  shortCode: string;
  status: RequestStatus;
  urgency: UrgencyLevel;
  teamName: string;
  etaMinutes: number;
  peopleCount: number;
}

interface ShelterPreview {
  id: string;
  name: string;
  address: string;
  availableCapacity: number;
  totalCapacity: number;
  distanceKm: number;
  isOpen: boolean;
}

interface AlertPreview {
  title: string;
  description: string;
  severity: string;
}

export default function CitizenHomePage() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeRequest, setActiveRequest] = useState<ActiveRequestState | null>(null);
  const [nearestShelter, setNearestShelter] = useState<ShelterPreview | null>(null);
  const [activeAlert, setActiveAlert] = useState<AlertPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCitizenContext() {
      try {
        const [reqRes, shRes, alertRes] = await Promise.all([
          fetch("/api/requests"),
          fetch("/api/shelters"),
          fetch("/api/alerts"),
        ]);
        const [reqData, shData, alertData] = await Promise.all([
          reqRes.json(), shRes.json(), alertRes.json(),
        ]);

        const lastSosId = typeof window !== "undefined" ? localStorage.getItem("ferrcs_last_sos_id") : null;
        if (reqData.success && Array.isArray(reqData.data) && reqData.data.length > 0) {
          const matched = lastSosId
            ? reqData.data.find((r: any) => r.id === lastSosId || r.shortCode === lastSosId)
            : reqData.data.find((r: any) => !["completed", "cancelled"].includes(r.status));
          if (matched && !["completed", "cancelled"].includes(matched.status)) {
            setActiveRequest({
              id: matched.id, shortCode: matched.shortCode, status: matched.status,
              urgency: matched.urgency, teamName: matched.assignedTeam || "Command Dispatched",
              etaMinutes: matched.status === "on_site" ? 0 : matched.status === "en_route" ? 8 : 15,
              peopleCount: matched.peopleCount || 1,
            });
          }
        }
        if (shData.success && Array.isArray(shData.data) && shData.data.length > 0) {
          const s = shData.data.find((s: any) => s.status === "open") || shData.data[0];
          setNearestShelter({
            id: s.id, name: s.name, address: s.address,
            totalCapacity: s.maxCapacity,
            availableCapacity: Math.max(0, s.maxCapacity - s.currentOccupancy),
            distanceKm: 1.8, isOpen: s.status === "open",
          });
        }
        if (alertData.success && Array.isArray(alertData.data) && alertData.data.length > 0) {
          const top = alertData.data[0];
          setActiveAlert({ title: top.title, description: top.description, severity: top.severity });
        }
      } catch (err) {
        console.error("Failed to load live citizen data", err);
      } finally {
        setLoading(false);
      }
    }
    loadCitizenContext();
  }, []);

  const startHold = () => {
    setHolding(true);
    setProgress(0);
    const startTime = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(holdIntervalRef.current!);
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 200]);
        }
        router.push("/citizen/sos?auto=true");
      }
    }, INTERVAL_STEP);
  };

  const endHold = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <div className="space-y-4 pb-4">

      {/* ── Alert Banner ── */}
      {activeAlert ? (
        <div className={cn(
          "p-4 rounded-xl border-l-4 flex items-start gap-3",
          activeAlert.severity === "critical"
            ? "bg-sos/8 border-sos text-foreground"
            : "bg-warning/8 border-warning text-foreground"
        )}>
          <AlertTriangle className={cn(
            "h-5 w-5 shrink-0 mt-0.5",
            activeAlert.severity === "critical" ? "text-sos animate-bounce" : "text-warning"
          )} />
          <div>
            <div className="font-bold text-sm">{activeAlert.title}</div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activeAlert.description}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border-l-4 border-safe bg-safe/8 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-safe shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-foreground">Normal Flood Level Monitoring</div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Hydrological radar and water level sensors across Musi river basin are within safe limits.
            </p>
          </div>
        </div>
      )}

      {/* ── Primary SOS Hold Button ── */}
      <div className="py-4 flex flex-col items-center justify-center text-center gap-4">
        <div className="relative flex items-center justify-center">
          {/* Progress Ring */}
          <svg className="w-52 h-52 -rotate-90 pointer-events-none absolute" aria-hidden="true">
            <circle cx="104" cy="104" r="92" className="stroke-border" strokeWidth="6" fill="transparent" />
            <circle
              cx="104" cy="104" r="92"
              className="stroke-sos transition-all duration-75"
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={578}
              strokeDashoffset={578 - (578 * progress) / 100}
            />
          </svg>

          {/* Outer glow ring when holding */}
          {holding && (
            <div className="absolute w-52 h-52 rounded-full animate-ping bg-sos/10 pointer-events-none" />
          )}

          {/* SOS Button */}
          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            type="button"
            aria-label="Hold for 1.5 seconds to trigger emergency SOS"
            className={cn(
              "w-44 h-44 rounded-full text-white font-black flex flex-col items-center justify-center",
              "transition-all duration-200 cursor-pointer select-none z-10",
              "focus:outline-none focus:ring-4 focus:ring-sos/30",
              holding
                ? "scale-[0.97] brightness-95"
                : "animate-sos-glow hover:brightness-105 active:scale-[0.97]",
              "bg-gradient-to-br from-sos to-sos-dark shadow-glow-sos"
            )}
          >
            <span className="text-4xl font-black tracking-wider drop-shadow">SOS</span>
            <span className="text-[11px] font-bold tracking-wider uppercase mt-1 opacity-90">
              {holding ? `Releasing ${Math.round(progress)}%` : "Hold 1.5s"}
            </span>
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Hold the button to transmit your live GPS coordinates to the nearest rescue team.
          </p>
          <Button variant="link" size="sm" asChild className="text-xs text-sos font-bold h-auto p-0">
            <Link href="/citizen/sos">Tap for step-by-step form <ArrowRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </div>
      </div>

      {/* ── Active Request Tracker ── */}
      {activeRequest && (
        <Card className="border-l-4 border-l-primary animate-fade-in overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold bg-muted px-2 py-0.5 rounded-md border border-border">
                  #{activeRequest.shortCode}
                </span>
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-pulse" />
                  {activeRequest.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {activeRequest.etaMinutes > 0 ? `~${activeRequest.etaMinutes} min` : "On Site"}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Unit: <strong className="text-foreground">{activeRequest.teamName}</strong></span>
              <span>Evacuees: <strong className="text-foreground">{activeRequest.peopleCount}</strong></span>
            </div>
            <Button size="sm" className="w-full h-10 text-xs font-bold" asChild>
              <Link href={`/citizen/requests/${activeRequest.id || activeRequest.shortCode}`}>
                <Navigation className="h-3.5 w-3.5 mr-1.5" />
                Track Live Rescue Status
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Nearest Shelter Card ── */}
      {nearestShelter && (
        <Card className="border-l-4 border-l-safe overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-black text-safe uppercase tracking-widest flex items-center gap-1 mb-0.5">
                  <Home className="h-3 w-3" /> Nearest Safe Shelter
                </div>
                <h4 className="font-bold text-sm text-foreground truncate">{nearestShelter.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{nearestShelter.address} · {nearestShelter.distanceKm} km</p>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                nearestShelter.isOpen
                  ? "bg-safe/15 text-safe border border-safe/25"
                  : "bg-sos/15 text-sos border border-sos/25"
              )}>
                {nearestShelter.isOpen ? "OPEN" : "FULL"}
              </span>
            </div>

            {/* Capacity bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Available: <strong className="text-foreground">{nearestShelter.availableCapacity} beds</strong></span>
                <span>Total: {nearestShelter.totalCapacity}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-safe rounded-full transition-all"
                  style={{
                    width: nearestShelter.totalCapacity > 0
                      ? `${(nearestShelter.availableCapacity / nearestShelter.totalCapacity) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" asChild>
                <Link href="/citizen/shelters">All Shelters</Link>
              </Button>
              <Button size="sm" className="flex-1 h-9 text-xs bg-safe hover:bg-safe/90 text-white shadow-glow-safe/30" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestShelter.address)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Directions
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Quick Action Tiles ── */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-1.5 border-2 hover:border-primary/50 hover:bg-primary/5 text-xs font-bold citizen-touch-target"
          asChild
        >
          <Link href="/citizen/report">
            <FileText className="h-5 w-5 text-primary" />
            Report Flooding
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center gap-1.5 border-2 border-sos/30 hover:border-sos/50 hover:bg-sos/5 text-xs font-bold citizen-touch-target"
          asChild
        >
          <a href="tel:112">
            <PhoneCall className="h-5 w-5 text-sos animate-bounce" />
            Call 112
          </a>
        </Button>
      </div>
    </div>
  );
}
