import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantStyles: Record<AlertVariant, { icon: React.ElementType; classes: string }> = {
  info: { icon: Info, classes: "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]" },
  success: { icon: CheckCircle2, classes: "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]" },
  warning: { icon: AlertTriangle, classes: "border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]" },
  error: { icon: XCircle, classes: "border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]" },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, classes } = variantStyles[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-[10px] border p-3 text-sm", classes, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-[color:var(--color-text-muted)] [&>*]:text-inherit">{children}</div>}
      </div>
    </div>
  );
}
