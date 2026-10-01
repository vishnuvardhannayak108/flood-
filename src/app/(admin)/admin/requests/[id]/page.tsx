"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Users, 
  Clock, 
  Flame, 
  FileText, 
  History, 
  Navigation,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { RequestStatus, UrgencyLevel } from "@/lib/status";

interface RequestDetail {
  id: string;
  shortCode: string;
  urgency: UrgencyLevel;
  priorityScore: number;
  type: string;
  citizenName: string;
  phone: string;
  peopleCount: number;
  hasVulnerable: boolean;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  description: string;
  status: RequestStatus;
  assignedTeam?: string;
  history: Array<{ status: string; time: string; note: string }>;
}

export default function AdminRequestDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RequestStatus>("prioritized");
  const [adminNote, setAdminNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRequest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/requests/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setRequest(data.data);
        setStatus(data.data.status);
      } else {
        setErrorMsg(data.error || "Emergency request not found in crisis store.");
      }
    } catch {
      setErrorMsg("Failed to communicate with disaster management network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: adminNote || `Status manually overridden to ${status.toUpperCase()} by System HQ`,
          actorName: "System Administrator",
          actorRole: "admin",
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRequest(data.data);
        setSuccessMsg(`Status updated to ${status.toUpperCase()} and logged to audit trail.`);
        setAdminNote("");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(data.error || "Failed to update emergency request.");
      }
    } catch {
      setErrorMsg("Network failure applying status override.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading mission dossier #{id}...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-3 bg-sos/10 text-sos rounded-full w-fit mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Request Record Not Found</h2>
        <p className="text-xs text-muted-foreground">
          {errorMsg || "The requested dispatch record does not exist or has been purged."}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/requests">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Queue
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/requests">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Requests
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {request.assignedTeam && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted border font-bold">
              Team: {request.assignedTeam}
            </span>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      {successMsg && (
        <div className="p-3 text-xs font-bold rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300">
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs font-bold rounded bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Main Request Record */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader className="p-5 border-b bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-mono">#{request.shortCode}</span>
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <h2 className="text-lg font-bold text-foreground mt-1">{request.type}</h2>
            </div>

            <div className="flex items-center gap-3 text-sm bg-muted/40 p-2.5 rounded-lg border">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Priority Score</div>
                <div className="text-xl font-black text-sos flex items-center gap-1">
                  <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                  {request.priorityScore}
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Victims Count</div>
                <div className="text-xl font-black text-foreground flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary" />
                  {request.peopleCount}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
              <span className="text-muted-foreground font-bold uppercase tracking-wider block text-[10px]">
                Citizen Identity & Phone
              </span>
              <div className="text-sm font-bold text-foreground">{request.citizenName}</div>
              <div className="text-xs font-mono text-primary font-bold">{request.phone}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Submitted: {request.createdAt}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
              <span className="text-muted-foreground font-bold uppercase tracking-wider block text-[10px]">
                Target Coordinates & Address
              </span>
              <div className="text-sm font-bold text-foreground">{request.address}</div>
              <div className="text-xs font-mono text-muted-foreground">
                {request.lat.toFixed(5)}, {request.lng.toFixed(5)}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold underline inline-flex items-center gap-1 pt-1"
              >
                <Navigation className="h-3 w-3" />
                View in Google Maps
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Incident Narrative
            </span>
            <div className="p-3 rounded-lg bg-card border text-xs leading-relaxed text-foreground font-medium">
              {request.description}
            </div>
          </div>

          {/* Admin Override Controls */}
          <div className="p-4 rounded-lg bg-muted/40 border space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Administrative Status Override & Manual Dispatch
            </span>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Change Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RequestStatus)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-xs font-bold"
                >
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                  <option value="prioritized">Prioritized</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="en_route">En Route</option>
                  <option value="on_site">On Site</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="duplicate">Duplicate</option>
                </select>
              </div>

              <div className="flex-[2]">
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Administrator Reason / Override Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manually promoted priority after GHMC commissioner directive"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-xs font-medium"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={saving}
                  className="h-10 bg-primary hover:bg-primary/90 font-bold text-xs"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Apply Override"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Audit History Log */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              State Transition Audit Trail
            </span>
            <div className="divide-y border rounded-lg overflow-hidden bg-card text-xs">
              {request.history && request.history.length > 0 ? (
                request.history.map((h, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status as RequestStatus} />
                      <span className="font-medium text-foreground">{h.note}</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">{h.time}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-muted-foreground italic text-center">
                  No state transitions recorded yet.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
