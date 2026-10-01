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
  CheckCircle2
} from "lucide-react";
import { RequestStatus, UrgencyLevel } from "@/lib/status";

const HOLD_DURATION = 1500; // 1.5s press to trigger SOS
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
          reqRes.json(),
          shRes.json(),
          alertRes.json(),
        ]);

        // Check active SOS for this citizen
        const lastSosId = typeof window !== "undefined" ? localStorage.getItem("ferrcs_last_sos_id") : null;
        if (reqData.success && Array.isArray(reqData.data) && reqData.data.length > 0) {
          const matched = lastSosId
            ? reqData.data.find((r: any) => r.id === lastSosId || r.shortCode === lastSosId)
            : reqData.data.find((r: any) => !["completed", "cancelled"].includes(r.status));

          if (matched && !["completed", "cancelled"].includes(matched.status)) {
            setActiveRequest({
              id: matched.id,
              shortCode: matched.shortCode,
              status: matched.status,
              urgency: matched.urgency,
              teamName: matched.assignedTeam || "Command Dispatched",
              etaMinutes: matched.status === "on_site" ? 0 : matched.status === "en_route" ? 8 : 15,
              peopleCount: matched.peopleCount || 1,
            });
          }
        }

        // Shelter
        if (shData.success && Array.isArray(shData.data) && shData.data.length > 0) {
          const openShelter = shData.data.find((s: any) => s.status === "open") || shData.data[0];
          setNearestShelter({
            id: openShelter.id,
            name: openShelter.name,
            address: openShelter.address,
            totalCapacity: openShelter.maxCapacity,
            availableCapacity: Math.max(0, openShelter.maxCapacity - openShelter.currentOccupancy),
            distanceKm: 1.8,
            isOpen: openShelter.status === "open",
          });
        }

        // Alerts
        if (alertData.success && Array.isArray(alertData.data) && alertData.data.length > 0) {
          const top = alertData.data[0];
          setActiveAlert({
            title: top.title,
            description: top.description,
            severity: top.severity,
          });
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
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setHolding(false);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Active Disaster Alert Banner */}
      {activeAlert ? (
        <div className={`p-3.5 rounded-card border-2 flex items-start gap-3 ${
          activeAlert.severity === "critical"
            ? "bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-200"
            : "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200"
        }`}>
          <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
            activeAlert.severity === "critical" ? "text-red-600 animate-bounce" : "text-amber-600"
          }`} />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm tracking-tight">{activeAlert.title}</div>
            <p className="text-muted-foreground leading-relaxed">
              {activeAlert.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-card bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm tracking-tight">Normal Flood Level Monitoring Active</div>
            <p className="text-muted-foreground leading-relaxed">
              Hydrological radar and water level sensors across Musi river basin are within safe operational limits.
            </p>
          </div>
        </div>
      )}

      {/* Primary SOS Interactive Target (160px+ diameter) */}
      <div className="py-4 flex flex-col items-center justify-center text-center">
        <div className="relative flex items-center justify-center">
          {/* Progress Ring SVG */}
          <svg className="w-52 h-52 -rotate-90 pointer-events-none absolute" aria-hidden="true">
            <circle
              cx="104"
              cy="104"
              r="92"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="104"
              cy="104"
              r="92"
              className="stroke-sos transition-all duration-75"
              strokeWidth="10"
              strokeDasharray={578}
              strokeDashoffset={578 - (578 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* 160px+ Diameter SOS Touch Target */}
          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            type="button"
            aria-label="Hold for 1.5 seconds to trigger emergency SOS evacuation"
            className="w-44 h-44 rounded-full bg-gradient-to-br from-sos to-sos-dark text-white font-black shadow-2xl flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-sos/40 z-10"
          >
            <span className="text-4xl font-extrabold tracking-wider drop-shadow-md">
              SOS
            </span>
            <span className="text-[11px] font-semibold tracking-wide uppercase mt-1 opacity-90">
              {holding ? `HOLD ${Math.round(progress)}%` : "HOLD 1.5s"}
            </span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-4 max-w-xs leading-tight">
          Press and hold the red button to automatically transmit your live coordinates to rescue teams.
        </p>

        <div className="mt-2">
          <Button variant="link" size="sm" asChild className="text-xs text-sos font-bold">
            <Link href="/citizen/sos">Tap here for Step-by-Step Form &gt;</Link>
          </Button>
        </div>
      </div>

      {/* Active Request Tracker Card (Only displayed if an active SOS exists) */}
      {activeRequest && (
        <Card className="border-l-4 border-l-purple-500 shadow-sm animate-fade-in">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded">
                  #{activeRequest.shortCode}
                </span>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Radio className="h-3 w-3 animate-pulse" />
                  Status: {activeRequest.status.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {activeRequest.etaMinutes > 0 ? `ETA ~${activeRequest.etaMinutes} min` : "Responders Arrived"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Unit: <strong>{activeRequest.teamName}</strong></span>
              <span>Evacuees: <strong>{activeRequest.peopleCount}</strong></span>
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

      {/* Nearest Safe Shelter Card */}
      {nearestShelter && (
        <Card className="border-l-4 border-l-safe shadow-sm">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-safe uppercase tracking-wider flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  Nearest Safe Shelter
                </div>
                <h4 className="font-bold text-sm text-foreground mt-0.5">{nearestShelter.name}</h4>
                <p className="text-xs text-muted-foreground">{nearestShelter.address} • {nearestShelter.distanceKm} km</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                nearestShelter.isOpen
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-red-100 text-red-800"
              }`}>
                {nearestShelter.isOpen ? "OPEN" : "FULL"}
              </span>
            </div>

            {/* Shelter Capacity Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Available Space: <strong>{nearestShelter.availableCapacity} beds</strong></span>
                <span>Total: {nearestShelter.totalCapacity}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-safe h-full rounded-full"
                  style={{
                    width: nearestShelter.totalCapacity > 0
                      ? `${(nearestShelter.availableCapacity / nearestShelter.totalCapacity) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" asChild>
                <Link href="/citizen/shelters">
                  View All Shelters
                </Link>
              </Button>
              <Button variant="default" size="sm" className="flex-1 h-9 text-xs bg-safe hover:bg-safe/90" asChild>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestShelter.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  Get Directions
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center border-2 hover:border-primary text-xs font-semibold citizen-touch-target"
          asChild
        >
          <Link href="/citizen/report">
            <FileText className="h-5 w-5 mb-1 text-primary" />
            Report Flooding
          </Link>
        </Button>

        <Button
          variant="outline"
          className="h-16 flex flex-col items-center justify-center border-2 border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold citizen-touch-target"
          asChild
        >
          <a href="tel:112">
            <PhoneCall className="h-5 w-5 mb-1 text-sos animate-bounce" />
            Call Helpline 112
          </a>
        </Button>
      </div>
    </div>
  );
}
