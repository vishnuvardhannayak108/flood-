"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, HomeIcon, Bell, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto px-3 pb-3">
        {/* Floating pill nav */}
        <div className="glass border border-border/60 rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-5 h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-all duration-200 citizen-touch-target relative",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute top-2.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive ? "stroke-[2.5px] scale-105" : "stroke-[1.75px]"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] leading-tight select-none font-medium transition-all",
                      isActive ? "font-bold" : ""
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
