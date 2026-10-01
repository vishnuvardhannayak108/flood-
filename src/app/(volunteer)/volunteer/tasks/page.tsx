"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  Search, 
  HeartHandshake, 
  Navigation,
  Loader2,
  RefreshCw
} from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

interface TaskItem {
  id: string;
  title: string;
  category: "food" | "medical" | "shelter" | "sandbags";
  location: string;
  lat: number;
  lng: number;
  timeSlot: string;
  needed: number;
  joined: number;
  urgency: "urgent" | "normal";
  description: string;
  status: "open" | "joined" | "completed";
}

export default function VolunteerTasksBoardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/volunteer/tasks");
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleJoin = async (id: string) => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const isJoined = t.status === "joined";
        return {
          ...t,
          status: isJoined ? "open" : "joined",
          joined: isJoined ? Math.max(0, t.joined - 1) : t.joined + 1,
        };
      })
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

  const filtered = tasks.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.location.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      {/* Top Header */}
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo size={26} showText={true} />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/volunteer">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HeartHandshake className="h-6 w-6 text-emerald-600" />
              <span>Volunteer Community Task Board</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select open relief tasks across distribution points, medical camps, and shelters.
            </p>
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
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 px-3 py-1.5 rounded-md">
              <span>{tasks.filter((t) => t.status === "joined").length} Active Claims</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by keyword, area, or task type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-md border bg-background text-xs font-semibold"
              aria-label="Filter task category"
            >
              <option value="all">All Task Categories</option>
              <option value="food">Food & Rations</option>
              <option value="medical">Medical First Aid</option>
              <option value="shelter">Shelter Logistics</option>
              <option value="sandbags">Sandbagging & Defense</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-semibold">Loading real-time community task board...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <HeartHandshake className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            <p className="text-sm font-semibold">No tasks matching the selected filter.</p>
          </Card>
        ) : (
          /* Tasks List */
          <div className="space-y-4">
            {filtered.map((task) => (
              <Card
                key={task.id}
                className={`border-l-4 transition-all hover:shadow-md ${
                  task.status === "joined"
                    ? "border-l-primary bg-primary/5"
                    : task.urgency === "urgent"
                    ? "border-l-red-500"
                    : "border-l-emerald-500"
                }`}
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-foreground">
                        {task.title}
                      </span>
                      {task.urgency === "urgent" && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{task.joined} of {task.needed} Volunteers Joined</span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-foreground font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {task.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {task.timeSlot}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.lat && task.lng && (
                        <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Map
                          </a>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        className={`h-8 text-xs font-bold ${
                          task.status === "joined"
                            ? "bg-muted text-foreground hover:bg-muted/80"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                        onClick={() => handleToggleJoin(task.id)}
                      >
                        {task.status === "joined" ? "Leave Mission" : "Join Shift"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
