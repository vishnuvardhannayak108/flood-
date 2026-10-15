"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Zap,
  Shield,
  Clock,
  ChevronRight,
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
  const [stats] = useState<PublicStats>({
    active_rescues: 14,
    open_shelters: 8,
    total_completed: 182,
    available_teams: 6,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ═══════════════════════════════════ HERO ═══════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-16 md:py-24">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-hero-mesh dark:bg-hero-mesh-dark pointer-events-none" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          {/* Status badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
            style={{
              background: "hsl(var(--primary) / 0.08)",
              borderColor: "hsl(var(--primary) / 0.25)",
              color: "hsl(var(--primary))",
            }}
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Real-time Disaster Response · Rescue Grid Active</span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="text-primary/70">24/7</span>
          </div>

          {/* Headline */}
          <div
            className={`space-y-4 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-foreground">
              Help, coordinated.{" "}
              <br className="hidden sm:block" />
              <span className="text-gradient-primary">
                When seconds count.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              One resilient platform connecting stranded citizens, rescue teams,
              safe shelters, and live flood intelligence.{" "}
              <span className="text-foreground font-semibold">
                Sub-3-tap life-saving dispatch.
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {/* Primary SOS CTA */}
            <Button
              variant="sos"
              size="xl"
              className="w-full sm:w-auto group relative overflow-hidden"
              asChild
            >
              <Link href="/citizen">
                <AlertOctagon className="h-6 w-6 mr-2.5 shrink-0" />
                <span className="font-black text-lg">I Need Help / SOS</span>
                <ChevronRight className="h-5 w-5 ml-2 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {/* Secondary responder CTA */}
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto group border-2"
              asChild
            >
              <Link href="/rescue">
                <ShieldAlert className="h-5 w-5 mr-2 text-primary shrink-0" />
                <span>I&apos;m a Responder / Team</span>
                <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Secondary auth links */}
          <div
            className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-xs text-muted-foreground font-medium">
              Multi-agency access:
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Sign In
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Register Account
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ LIVE STAT COUNTERS ════════════════════════════ */}
      <section className="px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Radio,
              value: stats.active_rescues,
              label: "Active Rescues",
              color: "text-sos",
              bg: "bg-sos/8 border-sos/20",
              iconAnim: "animate-pulse",
            },
            {
              icon: HomeIcon,
              value: stats.open_shelters,
              label: "Open Shelters",
              color: "text-safe",
              bg: "bg-safe/8 border-safe/20",
              iconAnim: "",
            },
            {
              icon: Users,
              value: stats.available_teams,
              label: "Teams Deployed",
              color: "text-primary",
              bg: "bg-primary/8 border-primary/20",
              iconAnim: "",
            },
            {
              icon: CheckCircle2,
              value: stats.total_completed,
              label: "Citizens Evacuated",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-500/8 border-emerald-500/20",
              iconAnim: "",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`relative p-4 sm:p-5 rounded-xl border ${stat.bg} flex flex-col gap-2 overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${stat.color} ${stat.iconAnim}`} />
                  <span className={`text-2xl sm:text-3xl font-black ${stat.color} tabular-nums`}>
                    {stat.value}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════ HOW IT WORKS ═══════════════════════════════ */}
      <section className="px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">
              How FERRCS Works
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Engineered for extreme conditions
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Built to operate under cellular congestion, low-power devices, and
              wet-screen conditions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                icon: Zap,
                title: "Instant SOS Capture",
                description:
                  "A 1.5-second hold locks high-accuracy GPS and registers your emergency immediately. Details can be appended offline.",
                color: "text-sos",
                accent: "border-t-sos/70",
                bg: "from-sos/5 to-transparent",
              },
              {
                step: "02",
                icon: Shield,
                title: "Algorithmic Triage",
                description:
                  "AI-powered priority scoring based on trapped count, vulnerability profile, water severity, and wait time routes rescue units optimally.",
                color: "text-warning",
                accent: "border-t-warning/70",
                bg: "from-warning/5 to-transparent",
              },
              {
                step: "03",
                icon: Clock,
                title: "Live Rescue & Shelter",
                description:
                  "Citizens track responder status on a live timeline with direct contact. Real-time shelter capacities and road conditions stay current.",
                color: "text-safe",
                accent: "border-t-safe/70",
                bg: "from-safe/5 to-transparent",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className={`relative rounded-xl border border-border bg-gradient-to-b ${item.bg} p-6 border-t-2 ${item.accent} space-y-4 group hover:shadow-md transition-shadow duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border shadow-sm`}
                    >
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <span className="text-4xl font-black text-border/70 select-none">
                      {item.step}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ BOTTOM CTA STRIP ══════════════════════════════ */}
      <section className="px-4 sm:px-6 py-10 border-t border-border/40">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Need emergency assistance right now?
            </h3>
            <p className="text-sm text-muted-foreground">
              Our rescue teams are on standby 24 hours a day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button variant="sos" size="lg" asChild className="w-full sm:w-auto">
              <Link href="/citizen">
                <AlertOctagon className="h-5 w-5 mr-2" />
                Request Help Now
              </Link>
            </Button>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sos hover:text-sos/80 transition-colors"
            >
              <PhoneCall className="h-4 w-4" />
              Call 112
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
