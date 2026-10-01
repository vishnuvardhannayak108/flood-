"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertOctagon, 
  MapPin, 
  Users, 
  CheckCircle2, 
  PhoneCall, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  Share2, 
  Undo2, 
  Camera, 
  Plus, 
  Minus,
  Sparkles,
  Loader2,
  Navigation
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitSosRpc, updateSosDetailsRpc, cancelRequestRpc } from "@/lib/supabase/rpc";
import { getRapidLocation, GeoCoordinates, formatCoordinates } from "@/lib/geo";
import { enqueueOfflineRequest } from "@/lib/offline-queue";
import { UrgencyLevel } from "@/lib/status";
import { IncidentType } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";

export default function SOSFlowPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-semibold">Initializing emergency dispatch connection...</p>
        </div>
      }
    >
      <SOSFlowContent />
    </Suspense>
  );
}

function SOSFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoTrigger = searchParams.get("auto") === "true";
  const { t } = useTranslation();
  const supabase = createClient();

  // Stepper: 1 = Submitting SOS, 2 = Optional Details, 3 = Confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string>("FR-" + Math.floor(1000 + Math.random() * 9000));
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(true);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);

  // Undo Timer (5 seconds)
  const [undoSecondsLeft, setUndoSecondsLeft] = useState(5);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optional details
  const [peopleCount, setPeopleCount] = useState(1);
  const [hasVulnerable, setHasVulnerable] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>(["Trapped"]);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState("+91 91000 00002");
  const [updatingDetails, setUpdatingDetails] = useState(false);

  const QUICK_CHIPS = [
    { id: "Trapped", label: "Trapped / Surrounded by Water", urgency: "critical" },
    { id: "Medical", label: "Medical Emergency", urgency: "critical" },
    { id: "WaterRising", label: "Water Level Rising Fast", urgency: "high" },
    { id: "FoodWater", label: "Need Food & Clean Water", urgency: "medium" },
    { id: "Vulnerable", label: "Elderly or Infant with Me", urgency: "critical" },
  ];

  const toggleChip = (id: string) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    if (id === "Vulnerable") {
      setHasVulnerable((v) => !v);
    }
  };

  // Immediate Submission on mount
  useEffect(() => {
    let isMounted = true;

    async function executeInitialSOS() {
      setSubmitting(true);
      const coords = await getRapidLocation();
      if (!isMounted) return;
      setLocation(coords);

      const payload = {
        p_client_request_id: clientRequestId,
        p_lat: coords.lat,
        p_lng: coords.lng,
        p_accuracy: coords.accuracy,
        p_contact_phone: phone,
        p_people_count: 1,
        p_has_vulnerable: false,
        p_declared_urgency: "critical" as UrgencyLevel,
        p_type: "trapped" as IncidentType,
        p_description: "Immediate SOS triggered via mobile emergency button",
        p_address_text: `Proximity to ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      };

      if (!navigator.onLine) {
        await enqueueOfflineRequest("sos", payload);
        setIsOfflineQueued(true);
        setSubmitting(false);
        setStep(2);
        return;
      }

      try {
        // 1. Post to unified API store
        const apiRes = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.lat,
            lng: coords.lng,
            phone,
            peopleCount: 1,
            hasVulnerable: false,
            urgency: "critical",
            type: "trapped",
            description: "Immediate SOS triggered via mobile emergency button",
          }),
        });
        const apiData = await apiRes.json();
        if (apiData?.data) {
          setRequestId(apiData.data.id);
          if (apiData.data.shortCode) setShortCode(apiData.data.shortCode);
        }

        // 2. Also invoke Supabase RPC if available
        await submitSosRpc(supabase, payload).catch(() => {});
      } catch (err) {
        await enqueueOfflineRequest("sos", payload);
        setIsOfflineQueued(true);
      } finally {
        if (isMounted) {
          setSubmitting(false);
          setStep(2); // Automatically advance to optional details
        }
      }
    }

    executeInitialSOS();

    return () => {
      isMounted = false;
    };
  }, []);

  // 5-second countdown timer for Step 3
  useEffect(() => {
    if (step === 3 && undoSecondsLeft > 0) {
      undoIntervalRef.current = setInterval(() => {
        setUndoSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(undoIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      };
    }
  }, [step, undoSecondsLeft]);

  // Handle Cancel Request
  const handleCancelSOS = async () => {
    if (requestId) {
      await cancelRequestRpc(supabase, {
        p_request_id: requestId,
        p_reason: "Cancelled by citizen within undo period",
      });
    }
    router.push("/citizen");
  };

  // Submit optional details update
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingDetails(true);

    const isCritical = selectedChips.includes("Trapped") || selectedChips.includes("Medical") || hasVulnerable;
    const urgency: UrgencyLevel = isCritical ? "critical" : "high";

    if (requestId) {
      // 1. Update API store
      await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peopleCount,
          hasVulnerable,
          urgency,
          status: "prioritized",
          note: `${selectedChips.join(", ")}. Note: ${note}`,
        }),
      }).catch(() => {});

      // 2. Also call Supabase RPC
      await updateSosDetailsRpc(supabase, {
        p_request_id: requestId,
        p_people_count: peopleCount,
        p_has_vulnerable: hasVulnerable,
        p_declared_urgency: urgency,
        p_type: selectedChips.includes("Medical") ? ("medical" as IncidentType) : ("trapped" as IncidentType),
        p_description: `${selectedChips.join(", ")}. Note: ${note}`,
        p_media_urls: [] as string[],
      }).catch(() => {});
    }

    setUpdatingDetails(false);
    setStep(3);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* STEP 1: INITIAL SUBMITTING SPINNER */}
      {step === 1 && (
        <Card className="text-center p-8 border-2 border-sos/40 shadow-xl space-y-4">
          <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-950 text-sos mx-auto flex items-center justify-center animate-pulse">
            <AlertOctagon className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-foreground">Locking Location & Sending SOS</h2>
            <p className="text-xs text-muted-foreground">
              Connecting to nearest rescue dispatch node...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary pt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>High-Accuracy GPS Lock in progress</span>
          </div>
        </Card>
      )}

      {/* STEP 2: OPTIONAL DETAILS (SKIPPABLE) */}
      {step === 2 && (
        <Card className="border-2 border-primary/40 shadow-lg">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-red-100 text-sos dark:bg-red-950 px-2 py-0.5 rounded">
                SOS SENT • #{shortCode}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Step 2 of 2</span>
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Add Details (Optional)</CardTitle>
            <CardDescription className="text-xs">
              Your SOS request and GPS location are already logged. Adding details helps rescue boats bring proper equipment.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSaveDetails} className="space-y-4">
              {/* Quick Situation Chips */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  What is happening right now?
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chip) => {
                    const active = selectedChips.includes(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => toggleChip(chip.id)}
                        className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground hover:bg-muted border-border"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* People Count Stepper */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Number of People Needing Evacuation
                </Label>
                <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg border">
                  <span className="text-sm font-semibold text-foreground pl-2">
                    {peopleCount} {peopleCount === 1 ? "Person" : "People"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPeopleCount((p) => Math.max(1, p - 1))}
                      disabled={peopleCount <= 1}
                      className="h-9 w-9 rounded-md"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-base">{peopleCount}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPeopleCount((p) => Math.min(25, p + 1))}
                      className="h-9 w-9 rounded-md"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vulnerable Persons Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/10 border-amber-500/30">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">Elderly / Infant / Disabled with me</div>
                  <div className="text-[11px] text-muted-foreground">Increases rescue priority score</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasVulnerable}
                  onChange={(e) => setHasVulnerable(e.target.checked)}
                  className="h-5 w-5 rounded border-amber-500 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Short Note */}
              <div className="space-y-1.5">
                <Label htmlFor="sosNote" className="text-xs font-semibold">
                  Additional Landmarks / Room Location
                </Label>
                <Input
                  id="sosNote"
                  placeholder="e.g. 2nd floor balcony, blue gate, water rising"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Button type="submit" className="w-full h-12 text-base font-bold bg-primary" disabled={updatingDetails}>
                  {updatingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Details & View Tracker
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(3)}
                  className="w-full text-xs text-muted-foreground"
                >
                  Skip and View Status Now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: CONFIRMATION & TRACKER LAUNCHER */}
      {step === 3 && (
        <Card className="border-2 border-emerald-500/50 shadow-xl space-y-4">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="font-mono text-sm font-extrabold bg-muted px-3 py-1 rounded inline-block mx-auto">
              Request ID: #{shortCode}
            </div>
            <CardTitle className="text-2xl font-black text-foreground pt-1">
              Help Request Dispatched
            </CardTitle>
            <CardDescription className="text-xs">
              A rescue boat unit is being assigned to your coordinates. Stay calm and keep phone active.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 5-Second Undo Toast */}
            {undoSecondsLeft > 0 && (
              <div className="p-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg flex items-center justify-between text-xs shadow-lg animate-in fade-in">
                <span>Accidental press? Cancel within <strong>{undoSecondsLeft}s</strong></span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCancelSOS}
                  className="h-7 text-xs px-2.5 font-bold"
                >
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                  Cancel SOS
                </Button>
              </div>
            )}

            {/* Location Details Card */}
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
              <div className="text-muted-foreground font-semibold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Locked GPS Coordinates:
              </div>
              <div className="font-mono text-foreground font-bold">
                {location ? formatCoordinates(location.lat, location.lng) : "Hyderabad Center (~17.3850° N, 78.4867° E)"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Accuracy: ±{location?.accuracy || 15} meters
              </div>
            </div>

            {/* Offline notification & SMS Fallback */}
            {isOfflineQueued && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs space-y-2">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  ⚠️ Request Saved Locally (Offline)
                </div>
                <p className="text-muted-foreground text-[11px]">
                  FERRCS will sync this automatically when connection recovers. For immediate guarantee, tap below to send an emergency SMS.
                </p>
                <Button size="sm" variant="outline" className="w-full font-bold text-xs" asChild>
                  <a href={`sms:112?body=FERRCS%20SOS%20HELP:%20Lat%20${location?.lat}%20Lng%20${location?.lng}%20Code%20${shortCode}`}>
                    Send Pre-filled Emergency SMS to 112
                  </a>
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button className="w-full h-12 text-sm font-bold bg-primary" asChild>
                <Link href={`/citizen/requests/${shortCode}`}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Track Live Rescue Progress
                </Link>
              </Button>

              <Button variant="outline" className="w-full h-11 text-xs font-semibold" asChild>
                <Link href="/citizen/shelters">
                  Find Nearest Safe Shelter
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
