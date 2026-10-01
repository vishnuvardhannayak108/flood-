"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  Map as MapIcon, 
  Layers, 
  MapPin, 
  Navigation, 
  Phone, 
  Users, 
  ShieldAlert, 
  Home, 
  Compass, 
  Flame, 
  Radio, 
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { UrgencyLevel, RequestStatus } from "@/lib/status";

interface TacticalMarker {
  id: string;
  type: "request" | "team" | "shelter";
  title: string;
  shortCode?: string;
  lat: number;
  lng: number;
  urgency?: UrgencyLevel;
  status?: string;
  peopleCount?: number;
  capacity?: number;
  occupied?: number;
  description?: string;
  phone?: string;
}

export default function RescueTacticalMapPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedMarker, setSelectedMarker] = useState<TacticalMarker | null>(null);
  const [markers, setMarkers] = useState<TacticalMarker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMapElements = async () => {
    try {
      const [reqRes, teamRes, shelterRes] = await Promise.all([
        fetch("/api/requests").then((r) => r.json()),
        fetch("/api/teams").then((r) => r.json()),
        fetch("/api/shelters").then((r) => r.json()),
      ]);

      const mapItems: TacticalMarker[] = [];

      // Requests
      if (reqRes.data) {
        reqRes.data.forEach((r: any) => {
          mapItems.push({
            id: r.id,
            type: "request",
            title: r.type,
            shortCode: r.shortCode,
            lat: r.lat,
            lng: r.lng,
            urgency: r.urgency,
            status: r.status,
            peopleCount: r.peopleCount,
            description: r.description,
            phone: r.phone,
          });
        });
      }

      // Teams
      if (teamRes.data) {
        teamRes.data.forEach((t: any) => {
          mapItems.push({
            id: t.id,
            type: "team",
            title: `${t.name} (${t.callsign})`,
            lat: t.lat,
            lng: t.lng,
            status: t.status,
            description: `${t.boatType} • Base: ${t.baseStation} • Lead: ${t.leadName}`,
            phone: t.leadPhone,
          });
        });
      }

      // Shelters
      if (shelterRes.data) {
        shelterRes.data.forEach((s: any) => {
          mapItems.push({
            id: s.id,
            type: "shelter",
            title: s.name,
            lat: s.lat,
            lng: s.lng,
            capacity: s.maxCapacity,
            occupied: s.currentOccupancy,
            description: `${s.address} • Facilities: ${s.facilities?.join(", ")}`,
            phone: s.contactPhone,
          });
        });
      }

      setMarkers(mapItems);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapElements();
    const interval = setInterval(fetchMapElements, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredMarkers = markers.filter((m) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "critical") return m.type === "request" && m.urgency === "critical";
    if (activeFilter === "requests") return m.type === "request";
    if (activeFilter === "teams") return m.type === "team";
    if (activeFilter === "shelters") return m.type === "shelter";
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MapIcon className="h-6 w-6 text-primary" />
            <span>Tactical Operations Map</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live geospatial overview of active requests, responder boats, and relief shelters.
          </p>
        </div>

        {/* Filter Chips & Refresh */}
        <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1.5 rounded-lg border">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={fetchMapElements}
            title="Refresh map items"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "all" ? "default" : "ghost"}
            className="h-7 text-xs font-semibold"
            onClick={() => setActiveFilter("all")}
          >
            All Elements ({markers.length})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "requests" ? "default" : "ghost"}
            className="h-7 text-xs font-semibold"
            onClick={() => setActiveFilter("requests")}
          >
            Requests ({markers.filter((m) => m.type === "request").length})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "teams" ? "default" : "ghost"}
            className="h-7 text-xs font-semibold"
            onClick={() => setActiveFilter("teams")}
          >
            Boats ({markers.filter((m) => m.type === "team").length})
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "shelters" ? "default" : "ghost"}
            className="h-7 text-xs font-semibold"
            onClick={() => setActiveFilter("shelters")}
          >
            Shelters ({markers.filter((m) => m.type === "shelter").length})
          </Button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tactical Map Canvas */}
        <div className="lg:col-span-2 relative min-h-[500px] rounded-xl border bg-slate-900 overflow-hidden shadow-inner flex flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />

          {/* Musi River Flood Water Corridor (SVG Overlay) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M -50 320 Q 200 240, 400 300 T 800 220 T 1200 280"
              fill="none"
              stroke="#0284c7"
              strokeWidth="50"
              strokeOpacity="0.4"
            />
            <path
              d="M -50 320 Q 200 240, 400 300 T 800 220 T 1200 280"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="20"
              strokeOpacity="0.6"
              strokeDasharray="8 8"
            />
          </svg>

          {/* Map Layer Legend */}
          <div className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur border border-slate-700 p-2.5 rounded-lg text-[11px] text-white space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sky-400">
              <Layers className="h-3.5 w-3.5" />
              <span>Sector: Musi River Basin</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block animate-ping" />
                <span>Distress SOS</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Rescue Boat</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Relief Shelter</span>
              </span>
            </div>
          </div>

          {/* Render Interactive Pins */}
          <div className="relative flex-1 p-6 flex flex-wrap items-center justify-around z-10">
            {filteredMarkers.map((marker, index) => {
              const isSelected = selectedMarker?.id === marker.id;
              let pinBg = "bg-primary";
              if (marker.type === "request") {
                pinBg = marker.urgency === "critical" ? "bg-red-600 animate-bounce" : "bg-amber-500";
              } else if (marker.type === "team") {
                pinBg = "bg-blue-600";
              } else if (marker.type === "shelter") {
                pinBg = "bg-emerald-600";
              }

              return (
                <button
                  key={marker.id}
                  type="button"
                  onClick={() => setSelectedMarker(marker)}
                  className={`group relative flex flex-col items-center transition-transform ${
                    isSelected ? "scale-125 z-20" : "hover:scale-110"
                  }`}
                  style={{
                    margin: `${(index * 25) % 80}px ${(index * 35) % 60}px`
                  }}
                  aria-label={marker.title}
                >
                  <div
                    className={`h-9 w-9 rounded-full ${pinBg} text-white flex items-center justify-center shadow-lg border-2 border-white`}
                  >
                    {marker.type === "request" && <Flame className="h-5 w-5" />}
                    {marker.type === "team" && <Compass className="h-5 w-5" />}
                    {marker.type === "shelter" && <Home className="h-5 w-5" />}
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-white shadow whitespace-nowrap border border-slate-700">
                    {marker.shortCode ? `#${marker.shortCode}` : marker.title.slice(0, 14)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar on Map */}
          <div className="relative z-10 p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span>Water level: <strong>+3.8m above danger mark</strong></span>
            <span>Active Pins: <strong>{markers.length}</strong></span>
          </div>
        </div>

        {/* Selected Marker Detail Card */}
        <div className="space-y-4">
          {selectedMarker ? (
            <Card className="border-t-4 border-t-primary shadow-sm h-full flex flex-col justify-between">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">
                      {selectedMarker.type.toUpperCase()} PIN
                    </span>
                    {selectedMarker.urgency && <UrgencyBadge urgency={selectedMarker.urgency} />}
                    {selectedMarker.status && <StatusBadge status={selectedMarker.status as RequestStatus} />}
                  </div>

                  <h3 className="text-lg font-bold text-foreground mt-2">
                    {selectedMarker.title}
                  </h3>
                  {selectedMarker.shortCode && (
                    <div className="text-xs font-mono font-bold text-primary">
                      Code: #{selectedMarker.shortCode}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-muted/40 rounded-lg text-xs leading-relaxed text-foreground font-medium">
                  {selectedMarker.description}
                </div>

                <div className="space-y-2 text-xs">
                  {selectedMarker.peopleCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Persons Trapped:</span>
                      <strong className="text-foreground">{selectedMarker.peopleCount}</strong>
                    </div>
                  )}
                  {selectedMarker.capacity !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Capacity / Occupied:</span>
                      <strong className="text-foreground">{selectedMarker.occupied} / {selectedMarker.capacity}</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coordinates:</span>
                    <span className="font-mono">{selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 font-bold"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.lat},${selectedMarker.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-4 w-4 mr-1.5" />
                      Navigate to Target
                    </a>
                  </Button>

                  {selectedMarker.type === "request" && (
                    <Button variant="outline" size="sm" className="w-full font-bold" asChild>
                      <Link href={`/rescue/requests/${selectedMarker.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Open Request Detail & Claims
                      </Link>
                    </Button>
                  )}

                  {selectedMarker.phone && (
                    <Button variant="secondary" size="sm" className="w-full font-bold" asChild>
                      <a href={`tel:${selectedMarker.phone}`}>
                        <Phone className="h-4 w-4 mr-1.5" />
                        Call Contact
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <MapPin className="h-8 w-8 text-slate-400" />
              <div className="font-bold text-sm text-foreground">Select a Marker on Map</div>
              <p className="text-xs">
                Tap on any SOS ping, rescue boat, or shelter icon to view live operational status and directions.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
