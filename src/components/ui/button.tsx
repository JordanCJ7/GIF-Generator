import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          {
            "bg-accent-blue hover:bg-blue-600 text-white focus:ring-accent-blue shadow-lg shadow-blue-500/20": variant === "primary",
            "bg-card hover:bg-zinc-800 text-zinc-100 border border-border focus:ring-zinc-500": variant === "secondary",
            "bg-accent-red hover:bg-red-600 text-white focus:ring-accent-red shadow-lg shadow-red-500/20": variant === "danger",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
