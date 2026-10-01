import React from "react";
import Link from "next/link";
import { CitizenHeader } from "@/components/layout/citizen-header";
import { CitizenBottomNav } from "@/components/layout/citizen-bottom-nav";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { AlertOctagon } from "lucide-react";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 pb-20">
      <CitizenHeader />
      <OfflineBanner />
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col space-y-4">
        {children}
      </main>

      {/* Sticky SOS Quick Launcher for Citizens */}
      <div className="fixed bottom-20 right-4 z-30">
        <Link
          href="/citizen/sos"
          className="flex items-center gap-2 bg-sos text-white px-4 py-3 rounded-full shadow-xl shadow-red-500/40 font-bold hover:bg-sos/90 active:scale-95 transition-all text-sm border-2 border-white/20"
          aria-label="Instant SOS Emergency Help"
        >
          <AlertOctagon className="h-5 w-5 animate-pulse" />
          <span>SOS</span>
        </Link>
      </div>

      <CitizenBottomNav />
    </div>
  );
}
