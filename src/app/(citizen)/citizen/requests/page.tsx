"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { UrgencyBadge } from "@/components/shared/urgency-badge";
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Plus, 
  AlertOctagon,
  RefreshCw
} from "lucide-react";
import { RequestStatus, UrgencyLevel } from "@/lib/status";

interface RequestItem {
  id: string;
  shortCode: string;
  type: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  peopleCount: number;
  createdAt: string;
  address: string;
  assignedTeam?: string;
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests");
      const json = await res.json();
      if (json.data) {
        setRequests(json.data);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span>My Emergency Requests</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active and past rescue dispatches.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={fetchRequests}
            title="Refresh requests"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button size="sm" asChild className="h-8 text-xs font-bold bg-sos hover:bg-sos/90">
            <Link href="/citizen/sos">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New SOS
            </Link>
          </Button>
        </div>
      </div>

      {loading && requests.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="text-xs text-muted-foreground">Loading your emergency requests...</div>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-8 text-center border-dashed space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground">No Active Requests</div>
            <p className="text-xs text-muted-foreground mt-1">
              You haven&apos;t submitted any emergency SOS requests yet.
            </p>
          </div>
          <Button size="sm" asChild className="bg-sos hover:bg-sos/90 font-bold text-xs">
            <Link href="/citizen/sos">Trigger Emergency SOS</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((item) => (
            <Card key={item.id} className="border shadow-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded">
                      #{item.shortCode}
                    </span>
                    <UrgencyBadge urgency={item.urgency} />
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground">{item.type}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{item.address}</span>
                    <span>•</span>
                    <span>{item.peopleCount} {item.peopleCount === 1 ? "person" : "people"}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.createdAt}
                  </span>

                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold" asChild>
                    <Link href={`/citizen/requests/${item.id}`}>
                      Track Status
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
