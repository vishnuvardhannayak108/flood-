import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function BrandLogo({ className, size = 28, showText = true }: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 font-bold tracking-tight select-none", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-primary drop-shadow-sm"
        aria-hidden="true"
      >
        {/* Shield / Droplet Silhouette */}
        <path
          d="M16 3C16 3 6 12 6 20C6 25.5228 10.4772 30 16 30C21.5228 30 26 25.5228 26 20C26 12 16 3 16 3Z"
          fill="currentColor"
          className="text-primary opacity-95"
        />
        {/* Rescue Cross in Negative Space */}
        <path
          d="M14 14H18V18H22V22H18V26H14V22H10V18H14V14Z"
          fill="white"
          className="dark:fill-slate-900"
        />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-wider text-foreground">FERRCS</span>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-widest">
            Rescue Grid
          </span>
        </div>
      )}
    </div>
  );
}
