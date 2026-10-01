"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { WifiOff, PhoneCall, AlertOctagon, RefreshCw } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-lg border-2 text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/60 text-sos flex items-center justify-center">
            <WifiOff className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">You are Offline</CardTitle>
          <CardDescription className="text-sm">
            Network connection lost. FERRCS has cached vital emergency instructions and shelters locally.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/40 p-4 rounded-lg border border-red-200 dark:border-red-900 text-left space-y-2">
            <div className="text-xs font-bold text-sos uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="h-4 w-4" />
              Life-Threatening Emergency?
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              If cellular data is disabled, regular voice and SMS continue to operate on low-frequency tower bands.
            </p>
            <div className="pt-1 flex flex-col gap-2">
              <Button variant="sos" className="w-full font-bold h-11" asChild>
                <a href="tel:112">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Emergency 112 Directly
                </a>
              </Button>
              <Button variant="outline" className="w-full text-xs font-semibold" asChild>
                <a href="sms:112?body=EMERGENCY%20FLOOD%20HELP%20NEEDED">
                  Send Emergency SMS to 112
                </a>
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="ghost" onClick={() => typeof window !== "undefined" && window.location.reload()} className="text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Check Connection & Reload
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
