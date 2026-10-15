"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { PhoneCall, Radio } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function PublicHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Emergency Helpline Strip */}
      <div className="bg-sos text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2.5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-1.5 font-semibold">
            <PhoneCall className="h-3 w-3 shrink-0" />
            <span>{t("emergency.nationalEmergency", "National Emergency: 112")}</span>
            <span className="hidden sm:inline opacity-50">•</span>
            <span className="hidden sm:inline">{t("emergency.ndrfHelp", "NDRF: 011-24363260")}</span>
          </div>
          <div className="ml-auto">
            <a
              href="tel:112"
              className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-1 rounded-full text-[11px] font-bold transition-colors uppercase tracking-wider"
            >
              Call 112
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="glass border-b border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <BrandLogo />
          </Link>

          {/* Status pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Operations Active</span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 border-l border-border/60 pl-3 ml-1">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href="/login">{t("auth.login", "Sign In")}</Link>
              </Button>
              <Button size="sm" asChild className="shadow-glow-primary/30">
                <Link href="/register">{t("auth.register", "Register")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
