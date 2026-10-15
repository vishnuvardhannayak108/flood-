import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { PhoneCall, Shield, ExternalLink } from "lucide-react";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/60 bg-card mt-auto">
      {/* Emergency quick-access bar */}
      <div className="bg-sos/5 border-b border-sos/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="h-4 w-4 text-sos shrink-0" />
            <span>Emergency contacts are available 24/7</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 bg-sos text-white px-4 py-1.5 rounded-full text-xs font-bold hover:brightness-110 transition-all shadow-glow-sos/30"
            >
              <PhoneCall className="h-3 w-3" />
              Call 112 — National SOS
            </a>
            <a
              href="tel:01124363260"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              NDRF: 011-24363260
            </a>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Brand */}
        <div className="space-y-3">
          <BrandLogo size={28} />
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
            Mission-critical flood emergency response & rescue coordination.
            Engineered for extreme conditions.
          </p>
        </div>

        {/* Portals */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-widest">
            Portals
          </p>
          <div className="flex flex-col gap-2">
            {[
              { href: "/citizen", label: "Citizen Help & SOS" },
              { href: "/rescue", label: "Rescue Dispatch Ops" },
              { href: "/admin", label: "Operations Admin" },
              { href: "/volunteer", label: "Volunteer Hub" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group w-fit"
              >
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* System info */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-widest">
            System
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>All systems operational</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>Real-time GPS tracking active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Offline mode supported (PWA)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-border/40 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>© {year} FERRCS — Flood Emergency Response & Rescue Coordination System</span>
          <span className="font-mono">v2.0 · Disaster-hardened · PWA-ready</span>
        </div>
      </div>
    </footer>
  );
}
