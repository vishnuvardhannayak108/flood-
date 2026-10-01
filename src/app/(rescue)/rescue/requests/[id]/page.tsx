"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Users, 
  Clock, 
  ShieldAlert, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Radio,
  FileText,
  RefreshCw
} from "lucide-react";
import { UrgencyLevel, RequestStatus } from "@/lib/status";

interface RequestDetail {
  id: string;
  shortCode: string;
  urgency: UrgencyLevel;
  type: string;
  peopleCount: number;
  hasVulnerable: boolean;
  priorityScore: number;
  distanceKm: number;
  createdAt: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  citizenName: string;
  status: RequestStatus;
  description: string;
  assignedTeam?: string;
  notes?: string;
  history: Array<{ status: RequestStatus; time: string; note: string }>;
}

export default function RescueRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescuedCount, setRescuedCount] = useState<number>(1);
  const [completeNote, setCompleteNote] = useState<string>("");
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/requests/${id}`);
      const json = await res.json();
      if (json.data) {
        setRequest(json.data);
        setRescuedCount(json.data.peopleCount || 1);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStateTransition = async (nextStatus: RequestStatus, note?: string) => {
    if (!id) return;
    setLoadingAction(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          note: note || `Responder updated status to ${nextStatus}`,
          assignedTeam: "Team Alpha 01",
        }),
      });
      const json = await res.json();
      if (json.data) {
        setRequest(json.data);
      }
      setActionMessage(`Status updated to ${nextStatus.toUpperCase()}`);
    } catch {
      setActionMessage(`Updated status to ${nextStatus.toUpperCase()}`);
    } finally {
      setLoadingAction(false);
      setShowCompleteModal(false);
    }
  };

  if (loading && !request) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
        <div className="text-xs text-muted-foreground">Loading mission parameters...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <div className="font-bold text-base text-foreground">Mission Request Not Found</div>
        <p className="text-xs text-muted-foreground">The requested emergency signal could not be located in the dispatch registry.</p>
        <Button size="sm" asChild variant="outline">
          <Link href="/rescue">Return to Priority Queue</Link>
        </Button>
      </div>
    );
  }

  const isAcceptedOrActive = ["accepted", "en_route", "on_site"].includes(request.status);
  const isCompleted = request.status === "completed";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/rescue">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Priority Queue
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 text-sm font-semibold rounded-md bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300">
          ✓ {actionMessage}
        </div>
      )}

      {/* Main Mission Card */}
      <Card className="border-t-4 border-t-sos shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-3 border-b bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black font-mono tracking-tight text-foreground">
                  #{request.shortCode}
                </h1>
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <p className="text-lg font-bold text-foreground mt-1">
                {request.type}
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm bg-muted/50 p-2.5 rounded-lg border">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-bold">Priority Score</div>
                <div className="text-xl font-black text-sos flex items-center gap-1">
                  <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                  {request.priorityScore}
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-[11px] text-muted-foreground uppercase font-bold">People at Risk</div>
                <div className="text-xl font-black text-foreground flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary" />
                  {request.peopleCount}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Situation Description */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Incident Narrative
            </h3>
            <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-foreground text-sm leading-relaxed font-medium">
              {request.description}
            </div>
          </div>

          {/* Location & Navigation Block */}
          <div className="space-y-3 p-4 rounded-lg border bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Target Coordinates & Address
                </div>
                <div className="text-sm font-bold text-foreground mt-1">
                  {request.address}
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  GPS: {request.lat.toFixed(5)}, {request.lng.toFixed(5)} ({request.distanceKm} km from base)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  asChild
                  className="bg-primary hover:bg-primary/90 font-bold"
                >
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4 mr-1.5" />
                    Launch GPS Navigation
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Citizen Contact Block (Masked vs Unmasked) */}
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <div className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground">
              Contact & Verification Details
            </div>
            
            {isAcceptedOrActive || isCompleted ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {request.citizenName}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    Direct Phone: {request.phone}
                  </div>
                </div>

                <Button size="sm" variant="outline" asChild className="border-primary text-primary font-bold">
                  <a href={`tel:${request.phone}`}>
                    <Phone className="h-4 w-4 mr-1.5" />
                    Call Citizen Direct
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded bg-muted">
                <span>Citizen phone is locked until mission is claimed by your crew.</span>
                <span className="font-mono">••••••••••</span>
              </div>
            )}
          </div>

          {/* Operational State Machine Actions */}
          <div className="border-t pt-5 space-y-3">
            <div className="text-xs uppercase tracking-wider font-extrabold text-foreground">
              Mission Execution Action
            </div>

            {/* State: Not yet accepted */}
            {!isAcceptedOrActive && !isCompleted && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-extrabold text-base h-12"
                  disabled={loadingAction}
                  onClick={() => handleStateTransition("accepted", "Team Alpha 01 accepted mission")}
                >
                  <ShieldAlert className="h-5 w-5 mr-2" />
                  Accept & Claim Rescue Mission
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 font-bold"
                  disabled={loadingAction}
                  onClick={() => router.push("/rescue")}
                >
                  Return to Queue
                </Button>
              </div>
            )}

            {/* State: Accepted -> Move to En Route */}
            {request.status === "accepted" && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 rounded-md text-xs font-medium text-blue-900 dark:text-blue-200">
                  Mission accepted. Prepare equipment and launch boat towards sector.
                </div>
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base h-12"
                  disabled={loadingAction}
                  onClick={() => handleStateTransition("en_route", "Boat departed base, heading towards citizen location")}
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Depart Base & Mark En Route
                </Button>
              </div>
            )}

            {/* State: En Route -> Move to On Site */}
            {request.status === "en_route" && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-md text-xs font-medium text-amber-900 dark:text-amber-200">
                  Boat is en route. Tap below when you reach target perimeter.
                </div>
                <Button
                  size="lg"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-base h-12"
                  disabled={loadingAction}
                  onClick={() => handleStateTransition("on_site", "Rescue team arrived on site at target building")}
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Confirm On Site (Boat Arrived)
                </Button>
              </div>
            )}

            {/* State: On Site -> Complete Rescue */}
            {request.status === "on_site" && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-md text-xs font-medium text-emerald-900 dark:text-emerald-200">
                  Rescue in progress on site. Evacuate individuals and record headcount before completion.
                </div>
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base h-12"
                  onClick={() => setShowCompleteModal(true)}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Complete Rescue Operation
                </Button>
              </div>
            )}

            {/* State: Completed */}
            {isCompleted && (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-200 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>Operation marked COMPLETED. Citizens evacuated safely.</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/rescue">Next In Queue</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl border-2">
            <CardHeader className="p-5 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Finalize Rescue Operation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Confirmed Evacuated Count
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 text-lg font-bold"
                    onClick={() => setRescuedCount((c) => Math.max(1, c - 1))}
                  >
                    -
                  </Button>
                  <div className="text-2xl font-black text-foreground w-12 text-center">
                    {rescuedCount}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 text-lg font-bold"
                    onClick={() => setRescuedCount((c) => c + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Debriefing Notes / Transit Shelter
                </label>
                <textarea
                  className="w-full p-2.5 text-sm rounded-md border bg-background font-medium"
                  rows={3}
                  placeholder="e.g. Transferred survivors to GHMC Amberpet Indoor Stadium Shelter."
                  value={completeNote}
                  onChange={(e) => setCompleteNote(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  disabled={loadingAction}
                  onClick={() =>
                    handleStateTransition(
                      "completed",
                      completeNote || `Rescued ${rescuedCount} individuals successfully.`
                    )
                  }
                >
                  {loadingAction ? "Finalizing..." : "Confirm & Close Mission"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
