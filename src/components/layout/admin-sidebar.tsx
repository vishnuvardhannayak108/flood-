"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { 
  LayoutDashboard, 
  ClipboardList, 
  AlertTriangle, 
  Users, 
  Home as HomeIcon, 
  Bell, 
  BarChart3, 
  FileCheck, 
  Settings, 
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/requests", label: "Emergency Requests", icon: ClipboardList },
    { href: "/admin/incidents", label: "Incident Verification", icon: AlertTriangle },
    { href: "/admin/teams", label: "Rescue Teams", icon: ShieldCheck },
    { href: "/admin/users", label: "User Directory", icon: Users },
    { href: "/admin/shelters", label: "Shelter Operations", icon: HomeIcon },
    { href: "/admin/alerts", label: "Alert Broadcaster", icon: Bell },
    { href: "/admin/reports", label: "Analytics & Export", icon: BarChart3 },
    { href: "/admin/audit", label: "Audit Log", icon: FileCheck },
    { href: "/admin/settings", label: "System Parameters", icon: Settings },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col border-r bg-card transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
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

      <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Ops</span>
            <LiveIndicator />
          </div>
        ) : (
          <div className="mx-auto">
            <LiveIndicator />
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

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
