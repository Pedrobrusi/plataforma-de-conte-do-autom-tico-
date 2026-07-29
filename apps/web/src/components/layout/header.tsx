"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  Coins,
  ChevronDown,
  LogOut,
  Settings,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { logoutAction } from "@/lib/actions/auth";
import { switchWorkspaceAction } from "@/lib/actions/workspace";
import type { WorkspaceContext } from "@/lib/workspace";

const CREATE_SHORTCUTS = [
  { label: "Post Twitter", href: "/posts/twitter" },
  { label: "Frase de Efeito", href: "/posts/frase-de-efeito" },
  { label: "Post GPT", href: "/posts/gpt" },
  { label: "Carrossel IA", href: "/carrosseis/ia" },
  { label: "Criador de Reels", href: "/reels/criador" },
];

export function Header({
  context,
  onMenuClick,
}: {
  context: WorkspaceContext;
  onMenuClick: () => void;
}) {
  const displayName = context.profile.fullName || context.user.email || "Usuário";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-[8px] p-2 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface)] lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      {context.memberships.length > 1 && context.workspace && (
        <WorkspaceSwitcher context={context} />
      )}

      <div className="ml-auto flex items-center gap-2">
        <Dropdown
          trigger={({ toggle }) => (
            <Button size="sm" onClick={toggle}>
              <Plus className="size-4" />
              Criar
            </Button>
          )}
        >
          {CREATE_SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)]"
            >
              <Sparkles className="size-3.5 text-[color:var(--color-accent-purple)]" />
              {shortcut.label}
            </Link>
          ))}
        </Dropdown>

        <Link
          href="/configuracoes/creditos"
          className="flex items-center gap-1.5 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)]"
          title="Créditos disponíveis no workspace"
        >
          <Coins className="size-4 text-[color:var(--color-accent-orange)]" />
          {context.creditBalance}
        </Link>

        <Dropdown
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              className="flex items-center gap-2 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 hover:bg-[color:var(--color-surface-hover)]"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[color:var(--color-accent-purple)]/20 text-xs font-semibold text-[color:var(--color-accent-purple)]">
                {initials}
              </span>
              <ChevronDown className="size-3.5 text-[color:var(--color-text-muted)]" />
            </button>
          )}
        >
          <div className="border-b border-[color:var(--color-border)] px-3 py-2">
            <p className="truncate text-sm font-medium text-[color:var(--color-text)]">{displayName}</p>
            <p className="truncate text-xs text-[color:var(--color-text-muted)]">{context.user.email}</p>
          </div>
          <Link
            href="/configuracoes/perfil"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-hover)]"
          >
            <Settings className="size-4" />
            Configurações do perfil
          </Link>
          <form action={logoutAction}>
            <DropdownItem type="submit" className="text-[color:var(--color-danger)]">
              <LogOut className="size-4" />
              Sair
            </DropdownItem>
          </form>
        </Dropdown>
      </div>
    </header>
  );
}

function WorkspaceSwitcher({ context }: { context: WorkspaceContext }) {
  const router = useRouter();

  return (
    <Dropdown
      align="start"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-2 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm hover:bg-[color:var(--color-surface-hover)]"
        >
          <span className="max-w-[140px] truncate">{context.workspace?.name}</span>
          <ChevronDown className="size-3.5 text-[color:var(--color-text-muted)]" />
        </button>
      )}
    >
      {context.memberships.map((membership) => (
        <DropdownItem
          key={membership.workspaceId}
          onClick={async () => {
            await switchWorkspaceAction(membership.workspaceId);
            router.refresh();
          }}
        >
          <span className="flex-1 truncate">{membership.workspaceName}</span>
          {membership.workspaceId === context.workspace?.id && (
            <Check className="size-4 text-[color:var(--color-accent-purple)]" />
          )}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
