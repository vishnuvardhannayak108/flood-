"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, HomeIcon, Bell, User, AlertOctagon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export function CitizenBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: "/citizen", label: t("nav.home", "Home"), icon: Home, exact: true },
    { href: "/citizen/requests", label: t("nav.requests", "Requests"), icon: ClipboardList },
    { href: "/citizen/shelters", label: t("nav.shelters", "Shelters"), icon: HomeIcon },
    { href: "/citizen/alerts", label: t("nav.alerts", "Alerts"), icon: Bell },
    { href: "/citizen/profile", label: t("nav.profile", "Profile"), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t shadow-lg pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors citizen-touch-target ${
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.75px]"}`} />
              <span className="text-[11px] leading-tight select-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
