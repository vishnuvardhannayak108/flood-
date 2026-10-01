"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function PublicHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      {/* Emergency Helpline Strip */}
      <div className="bg-sos text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-3.5 w-3.5 animate-bounce" />
          <span>{t("emergency.nationalEmergency", "National Emergency: 112")}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{t("emergency.ndrfHelp", "NDRF: 011-24363260")}</span>
        </div>
        <a
          href="tel:112"
          className="bg-white text-sos px-2.5 py-0.5 rounded text-[11px] font-bold hover:bg-slate-100 transition-colors uppercase tracking-wider"
        >
          {t("emergency.call112", "Call 112")}
        </a>
      </div>

      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          <BrandLogo />
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2 border-l pl-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">{t("auth.login", "Sign In")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">{t("auth.register", "Register")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
