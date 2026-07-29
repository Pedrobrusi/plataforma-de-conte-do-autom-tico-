import Link from "next/link";
import { Suspense } from "react";
import {
  FileText,
  CalendarClock,
  Send,
  MessageCircle,
  Quote,
  Sparkles,
  Building2,
  GalleryHorizontal,
  Clapperboard,
  FileEdit,
  Inbox,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";

const SHORTCUTS = [
  { label: "Post Twitter", href: "/posts/twitter", icon: MessageCircle },
  { label: "Post GPT", href: "/posts/gpt", icon: Sparkles },
  { label: "Post YouTube", href: "/posts/youtube", icon: FileText },
  { label: "Google Post", href: "/posts/google", icon: Building2 },
  { label: "Carrossel IA", href: "/carrosseis/ia", icon: GalleryHorizontal },
  { label: "Criador de Reels", href: "/reels/criador", icon: Clapperboard },
  { label: "Roteiro Reels", href: "/reels/roteiro", icon: FileEdit },
  { label: "Frase de Efeito", href: "/posts/frase-de-efeito", icon: Quote },
];

export default async function DashboardPage() {
  const context = await getWorkspaceContext();
  const firstName = (context?.profile.fullName ?? context?.user.email ?? "").split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {firstName || "por aqui"} 👋</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          {context?.workspace?.name ?? "Seu workspace"} · resumo de hoje
        </p>
      </div>

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <SummaryCards workspaceId={context?.workspace?.id ?? null} />
      </Suspense>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[color:var(--color-text-muted)]">Criar agora</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="group flex flex-col gap-2 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 transition-colors hover:border-[color:var(--color-accent-purple)]/50 hover:bg-[color:var(--color-surface-hover)]"
            >
              <shortcut.icon className="size-5 text-[color:var(--color-accent-purple)]" />
              <span className="text-sm font-medium">{shortcut.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<ListSkeleton title="Conteúdos recentes" />}>
          <RecentContent workspaceId={context?.workspace?.id ?? null} />
        </Suspense>
        <Suspense fallback={<ListSkeleton title="Próximas publicações" />}>
          <UpcomingPublications workspaceId={context?.workspace?.id ?? null} />
        </Suspense>
      </div>
    </div>
  );
}

async function SummaryCards({ workspaceId }: { workspaceId: string | null }) {
  if (!workspaceId) return null;
  const supabase = await createServerSupabaseClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [contentCount, scheduledCount, publishedThisMonth, connections] = await Promise.all([
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "scheduled"),
    supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "published")
      .gte("published_at", startOfMonth.toISOString()),
    supabase.from("social_connections").select("status").eq("workspace_id", workspaceId),
  ]);

  const expiredConnections = (connections.data ?? []).filter((c) => c.status === "expired" || c.status === "error");

  return (
    <div className="flex flex-col gap-4">
      {expiredConnections.length > 0 && (
        <Alert variant="warning" title="Conexão precisa de atenção">
          {expiredConnections.length} conexão(ões) social(is) com token expirado ou em erro.{" "}
          <Link href="/conexoes" className="underline underline-offset-2">
            Ver conexões
          </Link>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Conteúdos criados" value={contentCount.count ?? 0} />
        <StatCard icon={CalendarClock} label="Conteúdos agendados" value={scheduledCount.count ?? 0} />
        <StatCard icon={Send} label="Publicações no mês" value={publishedThisMonth.count ?? 0} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 items-center justify-center rounded-[10px] bg-[color:var(--color-accent-purple)]/10 text-[color:var(--color-accent-purple)]">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xl font-semibold leading-none">{value}</p>
          <p className="text-xs text-[color:var(--color-text-muted)]">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[68px]" />
      ))}
    </div>
  );
}

function ListSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </CardContent>
    </Card>
  );
}

async function RecentContent({ workspaceId }: { workspaceId: string | null }) {
  if (!workspaceId) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_items")
    .select("id, title, type, status, created_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conteúdos recentes</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!data || data.length === 0 ? (
          <EmptyState
            message="Nenhum conteúdo criado ainda."
            actionLabel="Criar Post Twitter"
            actionHref="/posts/twitter"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-[8px] border border-[color:var(--color-border)] px-3 py-2 text-sm"
              >
                <span className="truncate">{item.title}</span>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

async function UpcomingPublications({ workspaceId }: { workspaceId: string | null }) {
  if (!workspaceId) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("id, title, platform, starts_at, status")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas publicações</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!data || data.length === 0 ? (
          <EmptyState
            message="Nada agendado ainda."
            actionLabel="Abrir Calendário"
            actionHref="/calendario"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-[8px] border border-[color:var(--color-border)] px-3 py-2 text-sm"
              >
                <span className="truncate">{event.title}</span>
                <span className="text-xs text-[color:var(--color-text-muted)]">
                  {new Date(event.starts_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-[color:var(--color-text-muted)]/15 text-[color:var(--color-text-muted)]",
    ready: "bg-[color:var(--color-accent-purple)]/15 text-[color:var(--color-accent-purple)]",
    scheduled: "bg-[color:var(--color-accent-orange)]/15 text-[color:var(--color-accent-orange)]",
    published: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
    failed: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]",
    archived: "bg-[color:var(--color-text-muted)]/15 text-[color:var(--color-text-muted)]",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? map.draft}`}>
      {status}
    </span>
  );
}

function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <Inbox className="size-6 text-[color:var(--color-text-muted)]" />
      <p className="text-sm text-[color:var(--color-text-muted)]">{message}</p>
      <Link
        href={actionHref}
        className="text-sm font-medium text-[color:var(--color-accent-purple)] underline underline-offset-2"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

