"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Bell, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CitizenHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="max-w-md mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/citizen" className="flex items-center">
          <BrandLogo size={24} showText={true} />
        </Link>

        <div className="flex items-center gap-2">
          <LiveIndicator />
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href="/citizen/alerts"
            className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            aria-label="View Emergency Alerts"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sos animate-ping" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sos" />
          </Link>
        </div>
      </div>
    </header>
  );
}
