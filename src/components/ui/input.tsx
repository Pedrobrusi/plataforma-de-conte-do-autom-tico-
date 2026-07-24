import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] outline-none transition-colors",
          "focus-visible:border-[color:var(--color-accent-purple)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-purple)]/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "aria-[invalid=true]:border-[color:var(--color-danger)] aria-[invalid=true]:focus-visible:ring-[color:var(--color-danger)]/30",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-24 w-full rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] outline-none transition-colors",
          "focus-visible:border-[color:var(--color-accent-purple)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-purple)]/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-[color:var(--color-text)]", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-[color:var(--color-danger)]">
      {children}
    </p>
  );
}
