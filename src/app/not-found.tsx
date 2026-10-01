import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
      <BrandLogo size={40} className="mb-4" />
      <h2 className="text-3xl font-extrabold tracking-tight">404 — Page Not Found</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        The requested emergency coordination page does not exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return to FERRCS Home</Link>
      </Button>
    </div>
  );
}
