"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertOctagon, 
  ShieldAlert, 
  Home as HomeIcon, 
  Radio, 
  MapPin, 
  Users, 
  CheckCircle2, 
  PhoneCall,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface PublicStats {
  active_rescues: number;
  open_shelters: number;
  total_completed: number;
  available_teams: number;
}

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PublicStats>({
    active_rescues: 14,
    open_shelters: 8,
    total_completed: 182,
    available_teams: 6,
  });

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Real-time Disaster Response & Rescue Grid</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.1]">
            Help, coordinated. <br className="hidden sm:inline" />
            <span className="text-primary">When seconds count in flood zones.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One resilient platform connecting stranded citizens, disaster rescue teams, safe shelters, and live flood intelligence. Sub-3-tap life-saving dispatch.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="sos"
              size="lg"
              className="w-full sm:w-auto text-lg h-14 px-8 shadow-xl shadow-red-500/25 citizen-touch-target"
              asChild
            >
              <Link href="/citizen">
                <AlertOctagon className="h-6 w-6 mr-2" />
                I Need Help / SOS
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-base h-14 px-8 border-2 border-primary/40 hover:border-primary citizen-touch-target"
              asChild
            >
              <Link href="/rescue">
                <ShieldAlert className="h-5 w-5 mr-2 text-primary" />
                I'm a Responder / Team
              </Link>
            </Button>
          </div>

          {/* Secure Credential Sign In Action */}
          <div className="pt-6 border-t max-w-xl mx-auto">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <span>Secure Multi-Agency Access:</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Sign In with Credentials
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/register"
                className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground px-4 py-2 rounded-md font-medium border transition-colors"
              >
                Register New Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Operational Counters (Public Aggregate) */}
      <section className="border-y bg-card py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 rounded-card bg-background border flex flex-col items-center text-center">
            <Radio className="h-6 w-6 text-primary mb-2 animate-pulse" />
            <span className="text-3xl font-extrabold text-foreground">{stats.active_rescues}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              Active Rescues
            </span>
          </div>

          <div className="p-4 rounded-card bg-background border flex flex-col items-center text-center">
            <HomeIcon className="h-6 w-6 text-safe mb-2" />
            <span className="text-3xl font-extrabold text-safe">{stats.open_shelters}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              Open Safe Shelters
            </span>
          </div>

          <div className="p-4 rounded-card bg-background border flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-indigo-500 mb-2" />
            <span className="text-3xl font-extrabold text-foreground">{stats.available_teams}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              Teams Deployed
            </span>
          </div>

          <div className="p-4 rounded-card bg-background border flex flex-col items-center text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
            <span className="text-3xl font-extrabold text-foreground">{stats.total_completed}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              Citizens Evacuated
            </span>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How FERRCS Coordinates Disaster Relief</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Engineered to operate reliably under extreme cellular congestion and wet-device conditions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-sos">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/60 text-sos flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-lg">Instant SOS Capture</h3>
              <p className="text-sm text-muted-foreground">
                A single 1.2-second hold locks high-accuracy GPS and registers your emergency immediately. Details can be appended later or queued offline.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-lg">Algorithmic Triage</h3>
              <p className="text-sm text-muted-foreground">
                Emergency requests are scored dynamically by trapped count, vulnerable persons, water severity, and waiting duration, routing directly to nearby rescue boats.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-safe">
            <CardContent className="pt-6 space-y-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-safe flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-lg">Live Rescue & Shelter</h3>
              <p className="text-sm text-muted-foreground">
                Citizens track responder status live on a simple timeline with direct contact. Real-time shelter capacities and road accessibility keep people safe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
