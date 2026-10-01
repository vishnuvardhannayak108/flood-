"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Send, 
  Zap, 
  Radio, 
  Clock, 
  Loader2,
  Trash2,
  RefreshCw
} from "lucide-react";
import { 
  AlertSeverity, 
  WeatherAlertItem, 
  getSeverityColor 
} from "@/lib/weather";

export default function AdminAlertsBroadcasterPage() {
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<AlertSeverity>("warning");
  const [suggestedAction, setSuggestedAction] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (data.success && data.data) {
        setAlerts(data.data);
      }
    } catch {
      setErrorMessage("Failed to synchronize with Civil Defense broadcast gateway.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsBroadcasting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severity,
          title,
          description,
          suggestedAction: suggestedAction || undefined,
          source: "GHMC State Emergency Operation Centre",
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAlerts((prev) => [data.data, ...prev]);
        setStatusMessage("Alert broadcast live to all citizen feeds and responder dashboards.");
        setTitle("");
        setDescription("");
        setSuggestedAction("");
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setErrorMessage(data.error || "Failed to broadcast alert.");
      }
    } catch {
      setErrorMessage("Network error distributing emergency alert.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSimulateScenario = async () => {
    setIsSimulating(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage("🚨 Flash Flood Crisis Scenario triggered: Active flood missions injected and Hydrology Red Alert broadcast!");
        fetchAlerts();
        setTimeout(() => setStatusMessage(null), 7000);
      }
    } catch {
      setErrorMessage("Failed to execute emergency drill simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    // Optimistic removal
    setAlerts((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      fetchAlerts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <span>Emergency Broadcast & Crisis Simulation Center</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue real-time multi-channel weather alerts, push warnings, and test civil defense drills.
          </p>
        </div>

        {/* Crisis Simulator Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>

          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md border-2 border-red-400 animate-pulse"
            disabled={isSimulating}
            onClick={handleSimulateScenario}
          >
            <Zap className="h-4 w-4 mr-1.5" />
            {isSimulating ? "Simulating Outbreak..." : "Simulate Flash Flood Drill"}
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs font-bold rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300">
          ✓ {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-xs font-bold rounded bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300">
          ⚠ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broadcast Composer */}
        <div className="lg:col-span-1">
          <Card className="border shadow-sm">
            <CardHeader className="p-4 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Compose Emergency Alert
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleBroadcast}>
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-xs font-bold"
                  >
                    <option value="critical">CRITICAL (Red Siren / Immediate Evacuation)</option>
                    <option value="warning">WARNING (Orange / Severe Hazard Ahead)</option>
                    <option value="watch">WATCH (Yellow / Monitoring Water Rise)</option>
                    <option value="advisory">ADVISORY (Blue / General Precaution)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Alert Headline
                  </label>
                  <Input
                    required
                    placeholder="e.g. Musi River Level Alert: 4.8m Peak"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Citizen Action Directive
                  </label>
                  <Input
                    placeholder="e.g. Move immediately to higher floors"
                    value={suggestedAction}
                    onChange={(e) => setSuggestedAction(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Full Broadcast Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full p-2.5 rounded-md border bg-background text-xs font-medium"
                    placeholder="Provide affected sectors, expected flood arrival times, and road closure updates..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full bg-primary hover:bg-primary/90 font-bold text-xs h-10"
                >
                  <Radio className="h-4 w-4 mr-1.5" />
                  {isBroadcasting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    "Broadcast Immediate Alert"
                  )}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>

        {/* Active Broadcasts Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active Warning Feeds ({alerts.length})
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              Direct Push Gateway
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-semibold">Loading active weather bulletins...</p>
            </div>
          ) : alerts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p className="text-sm font-semibold">No emergency alerts currently active.</p>
              <p className="text-xs mt-1">Use the composer on the left or simulate a flood drill.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const style = getSeverityColor(alert.severity);

                return (
                  <Card key={alert.id} className={`border ${style.border}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${style.badgeBg} ${style.badgeText}`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.issuedAt}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteAlert(alert.id)}
                          aria-label="Revoke alert"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <CardTitle className="text-base font-bold text-foreground mt-1">
                        {alert.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 space-y-2 text-xs">
                      <p className="text-foreground/90 font-medium leading-relaxed">
                        {alert.description}
                      </p>

                      {alert.suggestedAction && (
                        <div className="p-2 rounded bg-muted text-[11px] font-semibold text-foreground">
                          Directive: {alert.suggestedAction}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                        <span>Source: <strong>{alert.source}</strong></span>
                        <span>Expires: <strong>{alert.expiresAt}</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
