"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { 
  Inbox, 
  Compass, 
  Map as MapIcon, 
  History, 
  Users, 
  ShieldCheck, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamStatus } from "@/types/database";

export function RescueSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [status, setStatus] = useState<TeamStatus>("available");

  const navItems = [
    { href: "/rescue", label: "Priority Queue", icon: Inbox, exact: true },
    { href: "/rescue/operations", label: "Active Operations", icon: Compass },
    { href: "/rescue/map", label: "Tactical Map", icon: MapIcon },
    { href: "/rescue/history", label: "Mission History", icon: History },
    { href: "/rescue/team", label: "Team Roster", icon: Users },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r bg-card transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand & Team Header */}
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && <BrandLogo size={26} showText={true} />}
        {collapsed && <BrandLogo size={26} showText={false} />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 text-muted-foreground ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Team Availability Control */}
      <div className="p-4 border-b bg-muted/30">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Team Alpha 01</span>
              <LiveIndicator />
            </div>
            <div className="flex rounded-md border p-1 bg-background text-xs">
              {(["available", "busy", "offline"] as TeamStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1 rounded text-center font-semibold capitalize transition-colors ${
                    status === s
                      ? s === "available"
                        ? "bg-emerald-500 text-white"
                        : s === "busy"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span
              className={`h-3 w-3 rounded-full ${
                status === "available"
                  ? "bg-emerald-500 ring-2 ring-emerald-300"
                  : status === "busy"
                  ? "bg-amber-500 ring-2 ring-amber-300"
                  : "bg-slate-400"
              }`}
              title={`Status: ${status}`}
            />
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls */}
      <div className="p-3 border-t flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-xs text-muted-foreground font-medium">Dark / Light</span>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
          <Link href="/login" title="Sign Out">
            <LogOut className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </aside>
  );
}
