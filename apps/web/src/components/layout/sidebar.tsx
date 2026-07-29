"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, X } from "lucide-react";
import { navSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-bg)] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="cta-gradient flex size-8 items-center justify-center rounded-[10px] text-sm font-bold text-white">
              {siteConfig.shortName.slice(0, 1)}
            </span>
            <span className="truncate">{siteConfig.name}</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] p-1.5 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface)] lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
                {section.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} onNavigate={onClose} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavLink({
  item,
  onNavigate,
}: {
  item: (typeof navSections)[number]["items"][number];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-purple)]",
          isActive
            ? "bg-[color:var(--color-surface)] text-[color:var(--color-text)]"
            : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-text)]",
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{item.label}</span>
        {item.status === "planned" && (
          <Clock
            className="ml-auto size-3.5 shrink-0 text-[color:var(--color-text-muted)]"
            aria-label={`Em construção — fase ${item.phase}`}
          />
        )}
      </Link>
    </li>
  );
}
