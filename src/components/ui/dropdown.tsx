"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-56 overflow-hidden rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      role="menuitem"
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)] disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
