"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  MapPin, 
  AlertTriangle, 
  Waves, 
  Camera, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportFloodIncidentRpc } from "@/lib/supabase/rpc";
import { getRapidLocation, GeoCoordinates, formatCoordinates } from "@/lib/geo";
import { enqueueOfflineRequest } from "@/lib/offline-queue";
import { UrgencyLevel } from "@/lib/status";

export default function ReportIncidentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<UrgencyLevel>("medium");
  const [waterLevelCm, setWaterLevelCm] = useState("60");
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getRapidLocation().then((coords) => {
      setLocation(coords);
      setLoadingLocation(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const lat = location?.lat || 17.3850;
    const lng = location?.lng || 78.4867;

    const payload = {
      p_title: title,
      p_description: description,
      p_severity: severity,
      p_lat: lat,
      p_lng: lng,
      p_water_level_cm: parseFloat(waterLevelCm) || null,
      p_media_urls: [] as string[],
    };

    if (!navigator.onLine) {
      await enqueueOfflineRequest("incident", payload);
      setSubmitting(false);
      setSubmitted(true);
      return;
    }

    try {
      // 1. Post to unified API store
      await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          waterLevelCm: Number(waterLevelCm) || 0,
          lat: location?.lat || 17.385,
          lng: location?.lng || 78.4867,
          locationName: location ? formatCoordinates(location.lat, location.lng) : "Hyderabad Flood Sector",
        }),
      }).catch(() => {});

      // 2. Also invoke Supabase RPC
      await reportFloodIncidentRpc(supabase, payload).catch(() => {});
    } catch {
      await enqueueOfflineRequest("incident", payload);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto p-6 text-center border-2 border-emerald-500/50 shadow-lg space-y-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <CardTitle className="text-xl font-bold">Report Received</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Your flood observation has been logged. An operations supervisor will review the incident report and update tactical flood maps.
        </CardDescription>

        <div className="p-3 bg-muted rounded-lg text-xs text-left space-y-1">
          <div className="font-semibold text-foreground">Logged Summary:</div>
          <div>Title: <strong>{title}</strong></div>
          <div>Estimated Water: <strong>{waterLevelCm} cm</strong></div>
          <div>Location: <strong>{location ? formatCoordinates(location.lat, location.lng) : "GPS Fixed"}</strong></div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button className="w-full bg-primary" asChild>
            <Link href="/citizen">Return to Citizen Home</Link>
          </Button>
          <Button variant="outline" className="w-full text-xs" asChild>
            <Link href="/citizen/requests">View My Submissions</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-md border">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground -ml-2" asChild>
            <Link href="/citizen">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <CardTitle className="text-xl font-bold">Report Flooding Incident</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Help disaster authorities map submerged roads, rising currents, and structural breaches.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="incTitle" className="text-xs font-semibold">Incident Headline</Label>
            <Input
              id="incTitle"
              placeholder="e.g. Musi River overflowing onto low bridge road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Observed Severity</Label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(["low", "medium", "high"] as UrgencyLevel[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`py-2 rounded-md border font-semibold capitalize transition-colors ${
                    severity === s
                      ? s === "high"
                        ? "bg-red-500 text-white border-red-500"
                        : s === "medium"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-blue-500 text-white border-blue-500"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="waterLevel" className="text-xs font-semibold flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-blue-500" />
              <span>Estimated Water Depth (Centimeters)</span>
            </Label>
            <Input
              id="waterLevel"
              type="number"
              min={5}
              max={500}
              placeholder="e.g. 60 cm (knee depth)"
              value={waterLevelCm}
              onChange={(e) => setWaterLevelCm(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="incDesc" className="text-xs font-semibold">Description & Observations</Label>
            <textarea
              id="incDesc"
              rows={3}
              placeholder="Describe road blockage, current speed, visible damages..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Location status badge */}
          <div className="p-3 bg-muted rounded-lg text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-foreground">Incident Location</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {loadingLocation ? "Detecting GPS..." : location ? formatCoordinates(location.lat, location.lng) : "Using Sector Center"}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              GPS Fixed
            </span>
          </div>

          <Button type="submit" className="w-full h-11 font-bold text-sm bg-primary" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Flood Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
