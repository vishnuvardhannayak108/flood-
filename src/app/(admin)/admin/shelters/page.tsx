"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  Plus, 
  MapPin, 
  Users, 
  Search, 
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface AdminShelterItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  maxCapacity: number;
  currentOccupancy: number;
  status: "open" | "full" | "closed";
  facilities: string[];
  contactPhone: string;
  contactPerson: string;
}

export default function AdminSheltersPage() {
  const [shelters, setShelters] = useState<AdminShelterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCapacity, setNewCapacity] = useState(300);
  const [newPhone, setNewPhone] = useState("");
  const [newLead, setNewLead] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchShelters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shelters");
      const data = await res.json();
      if (data.success && data.data) {
        setShelters(data.data);
      }
    } catch {
      setErrorMsg("Failed to synchronize with shelter management network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const handleAdjustOccupancy = async (id: string, delta: number) => {
    const current = shelters.find((s) => s.id === id);
    if (!current) return;

    const newOcc = Math.max(0, current.currentOccupancy + delta);
    const newStatus = newOcc >= current.maxCapacity ? "full" : "open";

    // Optimistic UI update
    setShelters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, currentOccupancy: newOcc, status: newStatus } : s))
    );

    try {
      const res = await fetch("/api/shelters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          currentOccupancy: newOcc,
          actorName: "Disaster Admin",
          actorRole: "admin",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchShelters();
      }
    } catch {
      fetchShelters();
    }
  };

  const handleSetStatus = async (id: string, status: "open" | "full" | "closed") => {
    setShelters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );

    try {
      const res = await fetch("/api/shelters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          actorName: "Disaster Admin",
          actorRole: "admin",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchShelters();
      }
    } catch {
      fetchShelters();
    }
  };

  const handleAddShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setSaving(true);
    try {
      const payload = {
        name: newName,
        address: newAddress || "Hyderabad Flood Relief Zone",
        lat: 17.3850,
        lng: 78.4867,
        maxCapacity: Number(newCapacity),
        currentOccupancy: 0,
        status: "open" as const,
        facilities: ["Clean Water", "Medical Post", "Dry Clothing", "Sanitation"],
        contactPhone: newPhone || "+91 94400 00000",
        contactPerson: newLead || "GHMC Relief Officer",
      };

      const res = await fetch("/api/shelters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShelters((prev) => [...prev, data.data]);
        setNewName("");
        setNewAddress("");
        setNewCapacity(300);
        setNewPhone("");
        setNewLead("");
        setShowAddModal(false);
      }
    } catch {
      setErrorMsg("Failed to register new relief shelter.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = shelters.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span>Relief Shelters Management & Capacity Engine</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time occupant counts, adjust headcount, and open new relief centers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShelters}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 font-bold text-xs"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Provision New Relief Shelter
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs font-bold rounded bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-300">
          ⚠ {errorMsg}
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3 bg-card">
          <div className="text-xs text-muted-foreground font-semibold">Total Sheltered Civilians</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            {shelters.reduce((acc, s) => acc + s.currentOccupancy, 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            of {shelters.reduce((acc, s) => acc + s.maxCapacity, 0)} total bed capacity
          </div>
        </Card>

        <Card className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
          <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            Open & Welcoming
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {shelters.filter((s) => s.status === "open").length} Shelters
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Ready to receive evacuees</div>
        </Card>

        <Card className="p-3 bg-red-50/50 dark:bg-red-950/20 border-red-200">
          <div className="text-xs text-red-800 dark:text-red-300 font-semibold">
            At Max Capacity
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {shelters.filter((s) => s.status === "full").length} Shelters
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Rerouting new evacuees</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shelter by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading live shelter occupancy status...</p>
        </div>
      ) : (
        /* Shelters Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((shelter) => {
            const occPct = shelter.maxCapacity > 0 
              ? Math.round((shelter.currentOccupancy / shelter.maxCapacity) * 100) 
              : 0;

            return (
              <Card key={shelter.id} className="border shadow-sm">
                <CardHeader className="p-4 pb-2 border-b bg-card">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground">
                      {shelter.name}
                    </CardTitle>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                        shelter.status === "open"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          : shelter.status === "full"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {shelter.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span>{shelter.address}</span>
                  </p>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {/* Capacity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-extrabold text-foreground">
                        {shelter.currentOccupancy} / {shelter.maxCapacity} ({occPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          shelter.status === "full"
                            ? "bg-red-600"
                            : occPct >= 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Live Headcount Stepper Buttons */}
                  <div className="flex items-center justify-between p-2 rounded bg-muted/40 border text-xs">
                    <span className="font-bold text-muted-foreground">Adjust Headcount:</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 font-bold"
                        onClick={() => handleAdjustOccupancy(shelter.id, -10)}
                      >
                        -10
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 font-bold"
                        onClick={() => handleAdjustOccupancy(shelter.id, -1)}
                      >
                        -1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 font-bold"
                        onClick={() => handleAdjustOccupancy(shelter.id, 1)}
                      >
                        +1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 font-bold"
                        onClick={() => handleAdjustOccupancy(shelter.id, 10)}
                      >
                        +10
                      </Button>
                    </div>
                  </div>

                  {/* Contact and Status Switch */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <div className="text-muted-foreground">
                      Lead: <strong>{shelter.contactPerson}</strong> ({shelter.contactPhone})
                    </div>
                    <div className="flex items-center gap-1">
                      {(["open", "full", "closed"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleSetStatus(shelter.id, st)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                            shelter.status === st
                              ? "bg-primary text-white"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Shelter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card shadow-2xl border-2">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Provision Relief Shelter
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleAddShelter}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Shelter Name
                  </label>
                  <Input
                    required
                    placeholder="e.g. Osmania Medical College Auditorium"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Full Address & Sector
                  </label>
                  <Input
                    required
                    placeholder="e.g. Koti, Sultan Bazar, Hyderabad"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Max Bed Capacity
                    </label>
                    <Input
                      type="number"
                      required
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Officer Phone
                    </label>
                    <Input
                      placeholder="+91 ..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Coordinator Name
                  </label>
                  <Input
                    placeholder="e.g. Dr. A. Ramanathan"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90 font-bold"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      "Activate Shelter"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
