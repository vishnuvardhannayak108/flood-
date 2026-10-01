"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  Clock, 
  MapPin, 
  ArrowUpRight, 
  Phone, 
  Waves, 
  TrendingUp, 
  LifeBuoy,
  Info
} from "lucide-react";
import { 
  HYDRO_GAUGES, 
  getSeverityColor, 
  WeatherAlertItem 
} from "@/lib/weather";

export default function CitizenAlertsPage() {
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();
      if (json.data) {
        setAlerts(json.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter((a) => {
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-sos" />
            <span>Emergency Weather & Flood Alerts</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official emergency broadcasts from IMD Hyderabad, GHMC Disaster Cell, and Telangana Irrigation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-300 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 animate-pulse text-red-600" />
            <span>Live Broadcast Feed</span>
          </div>
        </div>
      </div>

      {/* Hydrological Gauge Readings Strip */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Waves className="h-4 w-4 text-primary" />
          <span>Live River Gauges & Reservoir Discharge</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {HYDRO_GAUGES.map((gauge, idx) => (
            <Card key={idx} className="p-3 bg-card border-l-4 border-l-sky-500">
              <div className="text-xs font-bold text-foreground truncate">
                {gauge.gaugeName}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xl font-black text-primary">
                  {gauge.currentLevelM} m
                </div>
                <div className="text-[11px] font-bold text-red-600 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {gauge.trend.toUpperCase()}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 flex justify-between">
                <span>Danger: {gauge.dangerLevelM} m</span>
                <span>{gauge.flowRateCusecs} cusecs</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={filterSeverity === "all" ? "default" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilterSeverity("all")}
        >
          All Warnings ({alerts.length})
        </Button>
        <Button
          size="sm"
          variant={filterSeverity === "critical" ? "destructive" : "outline"}
          className="h-8 text-xs font-semibold"
          onClick={() => setFilterSeverity("critical")}
        >
          Critical Flood Only
        </Button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filtered.map((alert) => {
          const style = getSeverityColor(alert.severity);

          return (
            <Card
              key={alert.id}
              className={`transition-all hover:shadow-md ${style.border} bg-card`}
            >
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider ${style.badgeBg} ${style.badgeText}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Issued: {alert.issuedAt}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Expires {alert.expiresAt}</span>
                  </div>
                </div>

                <CardTitle className="text-base sm:text-lg font-bold text-foreground mt-2 leading-snug">
                  {alert.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                  {alert.description}
                </p>

                {alert.suggestedAction && (
                  <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <LifeBuoy className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Immediate Citizen Action: </span>
                      {alert.suggestedAction}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                    <span>Source: <strong>{alert.source}</strong></span>
                  </div>

                  <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold text-primary">
                    <Link href="/citizen/shelters">
                      Find Open Evacuation Shelter →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Hotlines Strip */}
      <Card className="p-4 bg-muted/40 border">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Emergency Distress Hotlines (24/7 Toll-Free)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <a
            href="tel:040-21111111"
            className="p-2.5 rounded border bg-card hover:border-primary flex items-center justify-between font-semibold"
          >
            <span>GHMC Flood Cell</span>
            <Phone className="h-3.5 w-3.5 text-primary" />
          </a>
          <a
            href="tel:108"
            className="p-2.5 rounded border bg-card hover:border-primary flex items-center justify-between font-semibold"
          >
            <span>Disaster Ambulance</span>
            <Phone className="h-3.5 w-3.5 text-primary" />
          </a>
          <a
            href="tel:101"
            className="p-2.5 rounded border bg-card hover:border-primary flex items-center justify-between font-semibold"
          >
            <span>Fire & Rescue</span>
            <Phone className="h-3.5 w-3.5 text-primary" />
          </a>
          <a
            href="tel:112"
            className="p-2.5 rounded border bg-card hover:border-primary flex items-center justify-between font-semibold"
          >
            <span>National Emergency</span>
            <Phone className="h-3.5 w-3.5 text-primary" />
          </a>
        </div>
      </Card>
    </div>
  );
}
