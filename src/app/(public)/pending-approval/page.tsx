import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Clock, ShieldAlert, ArrowLeft, PhoneCall } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-lg border-2 border-amber-500/40 text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Credentials Under Review</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Your responder account application has been received and logged in our system. For community safety, all rescue team and volunteer credentials require administrative approval before dispatch queue access is granted.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-left text-xs space-y-1.5 border">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              What happens next?
            </div>
            <p className="text-muted-foreground">
              An operations supervisor will verify your organization details. Once verified, logging in will automatically route you to the live dispatch queue.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Urgent deployment? Contact Control Room: 011-24363260</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Link>
          </Button>
          <Button variant="ghost" className="w-full text-xs" asChild>
            <Link href="/citizen">
              Go to Citizen View in the meantime
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
