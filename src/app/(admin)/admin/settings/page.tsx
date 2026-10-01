"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  Save, 
  Flame, 
  CopyCheck, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export default function AdminSettingsPage() {
  // Scoring parameters state
  const [criticalWeight, setCriticalWeight] = useState(40);
  const [highWeight, setHighWeight] = useState(25);
  const [mediumWeight, setMediumWeight] = useState(10);
  const [peopleMultiplier, setPeopleMultiplier] = useState(4);
  const [vulnerableBonus, setVulnerableBonus] = useState(15);
  const [timeEscalationWeight, setTimeEscalationWeight] = useState(2);

  // Deduplication state
  const [dupRadiusMeters, setDupRadiusMeters] = useState(150);
  const [dupWindowMinutes, setDupWindowMinutes] = useState(60);

  // Emergency Hotlines
  const [ghmcPhone, setGhmcPhone] = useState("040-21111111");
  const [ndrfPhone, setNdrfPhone] = useState("040-24445555");
  const [ambulancePhone, setAmbulancePhone] = useState("108");

  // Geofence Center
  const [centerLat, setCenterLat] = useState("17.3850");
  const [centerLng, setCenterLng] = useState("78.4867");

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <span>Crisis System Parameters & Algorithmic Weights</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure multi-factor priority weights, spatial deduplication radii, and municipal routing parameters.
          </p>
        </div>

        {savedSuccess && (
          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Parameters Updated & Broadcasted</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Priority Scoring Algorithm Weights */}
        <Card>
          <CardHeader className="p-4 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-sos" />
              1. Multi-Factor Priority Scoring Coefficients (0 - 100 Scale)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Critical Urgency Base Weight
                </label>
                <Input
                  type="number"
                  value={criticalWeight}
                  onChange={(e) => setCriticalWeight(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Default: 40 pts</span>
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">
                  High Urgency Base Weight
                </label>
                <Input
                  type="number"
                  value={highWeight}
                  onChange={(e) => setHighWeight(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Default: 25 pts</span>
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Medium Urgency Base Weight
                </label>
                <Input
                  type="number"
                  value={mediumWeight}
                  onChange={(e) => setMediumWeight(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Default: 10 pts</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  People Multiplier (per person trapped)
                </label>
                <Input
                  type="number"
                  value={peopleMultiplier}
                  onChange={(e) => setPeopleMultiplier(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Max cap: 25 pts</span>
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Vulnerable Individual Bonus
                </label>
                <Input
                  type="number"
                  value={vulnerableBonus}
                  onChange={(e) => setVulnerableBonus(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Flat: 15 pts</span>
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Wait Time Escalation (pts / 10m)
                </label>
                <Input
                  type="number"
                  value={timeEscalationWeight}
                  onChange={(e) => setTimeEscalationWeight(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Max cap: 20 pts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Deduplication Parameters */}
        <Card>
          <CardHeader className="p-4 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CopyCheck className="h-4 w-4 text-purple-600" />
              2. Spatial-Temporal Deduplication Windows
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Spatial Proximity Radius (Meters)
                </label>
                <Input
                  type="number"
                  value={dupRadiusMeters}
                  onChange={(e) => setDupRadiusMeters(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Identifies SOS submissions within this distance as potential duplicate cluster.
                </span>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Temporal Coincidence Window (Minutes)
                </label>
                <Input
                  type="number"
                  value={dupWindowMinutes}
                  onChange={(e) => setDupWindowMinutes(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Only clusters requests submitted within this time window.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Emergency Hotlines & Operations Center */}
        <Card>
          <CardHeader className="p-4 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              3. Emergency Hotline Dispatch Numbers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  GHMC Disaster Control Room
                </label>
                <Input
                  value={ghmcPhone}
                  onChange={(e) => setGhmcPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  NDRF 10th Battalion HQ
                </label>
                <Input
                  value={ndrfPhone}
                  onChange={(e) => setNdrfPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">
                  Disaster Ambulance (EMRI)
                </label>
                <Input
                  value={ambulancePhone}
                  onChange={(e) => setAmbulancePhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold px-6">
            <Save className="h-4 w-4 mr-1.5" />
            Save Configuration Parameters
          </Button>
        </div>
      </form>
    </div>
  );
}
