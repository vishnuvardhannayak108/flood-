import React from "react";
import Link from "next/link";
import { RescueSidebar } from "@/components/layout/rescue-sidebar";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LiveIndicator } from "@/components/shared/live-indicator";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Inbox, Compass, Map as MapIcon, Users } from "lucide-react";

export default function RescueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <RescueSidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b bg-card">
          <BrandLogo size={24} showText={true} />
          <div className="flex items-center gap-2">
            <LiveIndicator />
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation for Responders */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t grid grid-cols-4 h-16">
          <Link
            href="/rescue"
            className="flex flex-col items-center justify-center gap-1 text-primary text-xs font-semibold"
          >
            <Inbox className="h-5 w-5" />
            <span>Queue</span>
          </Link>
          <Link
            href="/rescue/operations"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs font-semibold"
          >
            <Compass className="h-5 w-5" />
            <span>Active</span>
          </Link>
          <Link
            href="/rescue/map"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs font-semibold"
          >
            <MapIcon className="h-5 w-5" />
            <span>Map</span>
          </Link>
          <Link
            href="/rescue/team"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs font-semibold"
          >
            <Users className="h-5 w-5" />
            <span>Team</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
