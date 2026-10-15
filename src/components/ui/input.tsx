import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm",
          // Typography
          "text-foreground placeholder:text-muted-foreground/60",
          // Transitions + focus
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-primary/60",
          // Hover (light lift)
          "hover:border-primary/40",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
          // Shadow
          "shadow-inner-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
