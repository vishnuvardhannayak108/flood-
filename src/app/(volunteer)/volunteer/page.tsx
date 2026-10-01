"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HeartHandshake, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  CheckSquare,
  Loader2,
  RefreshCw
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface VolunteerTask {
  id: string;
  title: string;
  category: "food" | "medical" | "shelter" | "sandbags";
  location: string;
  timeSlot: string;
  status: "open" | "joined" | "completed";
  needed: number;
  joined: number;
  description: string;
}

export default function VolunteerPortalPage() {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState<boolean>(true);
  const [hoursLogged, setHoursLogged] = useState<number>(14);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/volunteer/tasks");
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error("Failed to load volunteer tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (id: string) => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "joined", joined: t.joined + 1 } : t
      )
    );

    try {
      await fetch("/api/volunteer/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      fetchTasks();
    }
  };

  const handleComplete = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t))
    );
    setHoursLogged((h) => h + 3);

    try {
      await fetch("/api/volunteer/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "complete" }),
      });
    } catch {
      fetchTasks();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      {/* Top Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo size={26} showText={true} />
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="text-xs font-bold">
              <Link href="/volunteer/tasks">
                View All Volunteer Tasks
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Volunteer Relief Brigade • Sector East
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Volunteering as: <strong>Anita Desai</strong> (Certified First Responder)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              className="text-xs font-bold"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>

            <Button
              size="sm"
              variant={checkedIn ? "outline" : "default"}
              className={`font-bold text-xs ${
                checkedIn ? "border-emerald-500 text-emerald-600" : "bg-emerald-600"
              }`}
              onClick={() => setCheckedIn(!checkedIn)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {checkedIn ? "Checked In (On Active Duty)" : "Check In to Camp"}
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-3 bg-card">
            <div className="text-xs text-muted-foreground font-semibold">Total Relief Hours</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">{hoursLogged} hrs</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">GHMC Community Service Logged</div>
          </Card>

          <Card className="p-3 bg-card">
            <div className="text-xs text-muted-foreground font-semibold">Tasks Completed</div>
            <div className="text-2xl font-extrabold text-foreground mt-1">
              {tasks.filter((t) => t.status === "completed").length} Missions
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Food rations, bedding, triage</div>
          </Card>

          <Card className="p-3 bg-card">
            <div className="text-xs text-muted-foreground font-semibold">Assigned Camp Base</div>
            <div className="text-sm font-bold text-foreground mt-2 truncate">
              GHMC Amberpet Indoor Stadium
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Sector North-East</div>
          </Card>
        </div>

        {/* My Active Task Assignments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active Task Assignments ({tasks.length})
            </h2>
            <Link href="/volunteer/tasks" className="text-xs font-bold text-primary underline">
              Browse More Tasks →
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-semibold">Fetching volunteer tasks from logistics queue...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p className="text-sm font-semibold">No relief tasks currently assigned.</p>
              <Button size="sm" asChild className="mt-3 text-xs font-bold">
                <Link href="/volunteer/tasks">Browse Task Board</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className={`border-l-4 transition-all ${
                    task.status === "completed"
                      ? "border-l-slate-400 opacity-70"
                      : task.status === "joined"
                      ? "border-l-primary"
                      : "border-l-emerald-500"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            task.status === "completed"
                              ? "bg-slate-100 text-slate-700"
                              : task.status === "joined"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          {task.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {task.timeSlot}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">
                          {task.joined} / {task.needed} Volunteers Joined
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status === "open" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
                          onClick={() => handleClaim(task.id)}
                        >
                          Claim Task
                        </Button>
                      )}

                      {task.status === "joined" && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white font-bold h-9 text-xs"
                          onClick={() => handleComplete(task.id)}
                        >
                          <CheckSquare className="h-4 w-4 mr-1.5" />
                          Mark Completed
                        </Button>
                      )}

                      {task.status === "completed" && (
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Completed & Logged
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
