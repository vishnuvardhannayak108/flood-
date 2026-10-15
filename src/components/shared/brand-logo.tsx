import React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: "default" | "white" | "compact";
}

export function BrandLogo({
  className,
  size = 28,
  showText = true,
  variant = "default",
}: BrandLogoProps) {
  const isWhite = variant === "white";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 font-bold tracking-tight select-none",
        className
      )}
    >
      {/* Shield + Cross Mark */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer glow ring */}
          <circle
            cx="18"
            cy="18"
            r="16"
            className={isWhite ? "fill-white/10" : "fill-primary/10"}
          />
          {/* Core shield droplet */}
          <path
            d="M18 4C18 4 8 13 8 21.5C8 27.299 12.701 32 18 32C23.299 32 28 27.299 28 21.5C28 13 18 4 18 4Z"
            className={isWhite ? "fill-white" : "fill-primary"}
          />
          {/* Negative cross */}
          <rect x="15.5" y="13" width="5" height="14" rx="1.5" fill={isWhite ? "hsl(var(--primary))" : "white"} className={isWhite ? "" : "dark:fill-slate-950"} />
          <rect x="12" y="16.5" width="12" height="5" rx="1.5" fill={isWhite ? "hsl(var(--primary))" : "white"} className={isWhite ? "" : "dark:fill-slate-950"} />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-black tracking-wider",
              size >= 28 ? "text-xl" : "text-base",
              isWhite ? "text-white" : "text-foreground"
            )}
          >
            FERRCS
          </span>
          <span
            className={cn(
              "uppercase font-semibold tracking-widest",
              size >= 28 ? "text-[9px]" : "text-[8px]",
              isWhite
                ? "text-white/60"
                : "text-muted-foreground"
            )}
          >
            Rescue Grid
          </span>
        </div>
      )}
    </div>
  );
}
