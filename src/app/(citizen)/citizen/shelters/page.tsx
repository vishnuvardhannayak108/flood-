"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  MapPin, 
  Phone, 
  Users, 
  Search, 
  Filter, 
  Navigation, 
  HeartPulse, 
  Utensils, 
  Zap, 
  Baby, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Compass
} from "lucide-react";
import { getRapidLocation, calculateDistanceKm, DEFAULT_COORDINATES } from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";

interface ShelterDisplay {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  maxCapacity: number;
  currentOccupancy: number;
  status: "open" | "full" | "closed";
  facilities: string[];
  contactPhone: string;
  contactPerson: string;
}

export default function CitizenSheltersPage() {
  const [shelters, setShelters] = useState<ShelterDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(DEFAULT_COORDINATES);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const fetchShelters = async () => {
    try {
      const res = await fetch("/api/shelters");
      const json = await res.json();
      if (json.data) {
        const pos = await getRapidLocation().catch(() => DEFAULT_COORDINATES);
        setUserCoords({ lat: pos.lat, lng: pos.lng });
        const list = json.data.map((s: ShelterDisplay) => {
          const dist = calculateDistanceKm(pos.lat, pos.lng, s.lat, s.lng);
          return { ...s, distanceKm: dist };
        });
        setShelters(list);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  // Geolocation & shelters fetch on mount
  useEffect(() => {
    fetchShelters();
  }, []);

  const filtered = shelters
    .filter((s) => {
      if (filterType === "open" && s.status !== "open") return false;
      if (filterType === "medical" && !s.facilities.some((f) => f.toLowerCase().includes("medical") || f.toLowerCase().includes("first aid"))) {
        return false;
      }
      if (
        searchQuery &&
        !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.address.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span>Emergency Relief Shelters</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Safe shelters with verified dry accommodation, medical supplies, and hot meals. Sorted by distance from your current position.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold"
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
          <Button
            size="sm"
            variant={viewMode === "map" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold"
            onClick={() => setViewMode("map")}
          >
            Tactical Map
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by shelter name, landmark, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filterType === "all" ? "default" : "outline"}
            className="h-10 text-xs font-semibold"
            onClick={() => setFilterType("all")}
          >
            All ({shelters.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === "open" ? "default" : "outline"}
            className="h-10 text-xs font-semibold"
            onClick={() => setFilterType("open")}
          >
            Open with Capacity
          </Button>
          <Button
            size="sm"
            variant={filterType === "medical" ? "default" : "outline"}
            className="h-10 text-xs font-semibold"
            onClick={() => setFilterType("medical")}
          >
            <HeartPulse className="h-3.5 w-3.5 mr-1 text-red-500" />
            Medical Posts
          </Button>
        </div>
      </div>

      {/* Map View Mode */}
      {viewMode === "map" && (
        <Card className="p-4 bg-slate-900 border text-white space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-sky-400">
              <Compass className="h-4 w-4" />
              Relief Shelter Locations & Proximity
            </span>
            <span className="text-slate-400 font-mono">
              Center: {userCoords.lat.toFixed(4)}°N, {userCoords.lng.toFixed(4)}°E
            </span>
          </div>

          <div className="relative min-h-[350px] rounded-lg bg-slate-950 border border-slate-800 p-6 flex flex-wrap items-center justify-around overflow-hidden">
            {filtered.map((shelter, idx) => {
              const isFull = shelter.status === "full";
              return (
                <div
                  key={shelter.id}
                  className="flex flex-col items-center p-2 rounded-lg bg-slate-900/90 border border-slate-700 shadow-md max-w-[200px] text-center"
                  style={{ margin: `${(idx * 20) % 60}px 10px` }}
                >
                  <div
                    className={`h-8 w-8 rounded-full ${
                      isFull ? "bg-red-600" : "bg-emerald-600"
                    } text-white flex items-center justify-center font-bold text-xs mb-1`}
                  >
                    <Home className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-bold text-white truncate w-full">
                    {shelter.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {shelter.distanceKm} km away • {shelter.currentOccupancy}/{shelter.maxCapacity}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 h-6 text-[10px] bg-primary hover:bg-primary/90 w-full font-bold"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Navigate
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Shelters List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {filtered.map((shelter) => {
            const occupancyPct = Math.round(
              (shelter.currentOccupancy / shelter.maxCapacity) * 100
            );
            const isFull = shelter.status === "full" || occupancyPct >= 100;
            const isNearFull = occupancyPct >= 80 && !isFull;

            return (
              <Card
                key={shelter.id}
                className={`transition-all hover:shadow-md ${
                  isFull
                    ? "border-l-4 border-l-red-500 opacity-90"
                    : isNearFull
                    ? "border-l-4 border-l-amber-500"
                    : "border-l-4 border-l-emerald-500"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Row: Name and Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-foreground">
                          {shelter.name}
                        </h2>
                        {isFull ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200">
                            Shelter Full
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                            Open ({shelter.maxCapacity - shelter.currentOccupancy} Spaces Left)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{shelter.address}</span>
                      </p>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                      <span className="text-sm font-extrabold text-primary flex items-center gap-1">
                        <Compass className="h-4 w-4" />
                        {shelter.distanceKm} km
                      </span>
                      <span className="text-[11px] text-muted-foreground">from your GPS</span>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Occupancy Status</span>
                      <span className="font-bold text-foreground">
                        {shelter.currentOccupancy} / {shelter.maxCapacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isFull
                            ? "bg-red-600"
                            : isNearFull
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Facilities Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {shelter.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-muted/60 text-foreground border flex items-center gap-1"
                      >
                        {fac.toLowerCase().includes("medical") && (
                          <HeartPulse className="h-3 w-3 text-red-500" />
                        )}
                        {fac.toLowerCase().includes("meal") && (
                          <Utensils className="h-3 w-3 text-amber-500" />
                        )}
                        {fac.toLowerCase().includes("power") && (
                          <Zap className="h-3 w-3 text-yellow-500" />
                        )}
                        {fac.toLowerCase().includes("baby") && (
                          <Baby className="h-3 w-3 text-blue-500" />
                        )}
                        <span>{fac}</span>
                      </span>
                    ))}
                  </div>

                  {/* Action & Contact Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground">
                      <span>Camp Lead: <strong>{shelter.contactPerson}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="h-9 font-bold text-xs">
                        <a href={`tel:${shelter.contactPhone}`}>
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          Call Shelter
                        </a>
                      </Button>

                      <Button
                        size="sm"
                        className="h-9 bg-primary hover:bg-primary/90 font-bold text-xs"
                        asChild
                      >
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.lat},${shelter.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-3.5 w-3.5 mr-1.5" />
                          Get Driving / Walking Directions
                        </a>
                      </Button>
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
