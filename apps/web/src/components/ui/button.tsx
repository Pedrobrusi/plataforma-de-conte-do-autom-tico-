import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "cta-gradient text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090A] focus-visible:ring-[color:var(--color-accent-pink)]",
  secondary:
    "bg-[color:var(--color-surface)] text-[color:var(--color-text)] border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-purple)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-surface)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-purple)]",
  danger:
    "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/30 hover:bg-[color:var(--color-danger)]/20 focus-visible:ring-2 focus-visible:ring-[color:var(--color-danger)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-[10px] font-medium transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
