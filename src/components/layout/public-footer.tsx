import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

export function PublicFooter() {
  return (
    <footer className="w-full border-t bg-card text-card-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <BrandLogo size={24} />
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Flood Emergency Response & Rescue Coordination System. Disaster-hardened.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
          <Link href="/citizen" className="hover:text-primary transition-colors">
            Citizen Portal
          </Link>
          <Link href="/rescue" className="hover:text-primary transition-colors">
            Rescue Dispatch
          </Link>
          <Link href="/admin" className="hover:text-primary transition-colors">
            Operations Admin
          </Link>
          <a href="tel:112" className="text-sos font-bold hover:underline">
            SOS 112
          </a>
        </div>
      </div>
    </footer>
  );
}
