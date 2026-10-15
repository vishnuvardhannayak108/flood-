"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Bell } from "lucide-react";

export function CitizenHeader() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border/60">
      <div className="max-w-md mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/citizen"
          className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <BrandLogo size={24} showText={true} />
        </Link>

        <div className="flex items-center gap-1.5">
          <LiveIndicator />
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Alerts bell */}
          <Link
            href="/citizen/alerts"
            className="relative flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
            aria-label="View Emergency Alerts"
          >
            <Bell className="h-4.5 w-4.5" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sos opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sos" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
