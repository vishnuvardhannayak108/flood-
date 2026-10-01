import React from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LayoutDashboard, ClipboardList, ShieldCheck, Home as HomeIcon } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Mobile Header for Admin */}
        <header className="lg:hidden flex h-14 items-center justify-between px-4 border-b bg-card">
          <BrandLogo size={24} showText={true} />
          <div className="flex items-center gap-2">
            <LiveIndicator />
            <ThemeToggle />
          </div>
        </header>

        {/* Admin Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Navigation for Admin */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t grid grid-cols-4 h-16">
          <Link
            href="/admin"
            className="flex flex-col items-center justify-center gap-1 text-primary text-xs font-semibold"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Overview</span>
          </Link>
          <Link
            href="/admin/requests"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs font-semibold"
          >
            <ClipboardList className="h-5 w-5" />
            <span>Requests</span>
          </Link>
          <Link
            href="/admin/teams"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs font-semibold"
          >
            <ShieldCheck className="h-5 w-5" />
            <span>Teams</span>
          </Link>
          <Link
            href="/admin/shelters"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs font-semibold"
          >
            <HomeIcon className="h-5 w-5" />
            <span>Shelters</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
