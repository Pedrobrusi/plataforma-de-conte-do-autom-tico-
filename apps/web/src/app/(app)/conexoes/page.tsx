import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, ThumbsUp, PlayCircle, Building2 } from "lucide-react";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

const PLATFORMS: {
  id: "instagram" | "facebook" | "twitter" | "youtube" | "google_business" | "tiktok";
  name: string;
  icon: typeof Camera;
  href: string | null;
  note: string;
}[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Camera,
    href: "/configuracoes/instagram-setup",
    note: "Modo single-owner via Instagram API with Instagram Login.",
  },
  {
    id: "facebook",
    name: "Facebook Pages",
    icon: ThumbsUp,
    href: null,
    note: "Integração ainda não implementada.",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: PlayCircle,
    href: null,
    note: "Integração ainda não implementada.",
  },
  {
    id: "google_business",
    name: "Google Business Profile",
    icon: Building2,
    href: null,
    note: "Integração ainda não implementada.",
  },
];

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  connected: { text: "Conectado", className: "text-[color:var(--color-success)]" },
  expired: { text: "Expirado", className: "text-[color:var(--color-warning)]" },
  error: { text: "Erro", className: "text-[color:var(--color-danger)]" },
  disconnected: { text: "Não conectado", className: "text-[color:var(--color-text-muted)]" },
};

export default async function ConexoesPage() {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  if (!context.workspace) redirect("/onboarding");

  const supabase = await createServerSupabaseClient();
  const { data: connections } = await supabase
    .from("social_connections")
    .select("platform, status, display_name")
    .eq("workspace_id", context.workspace.id);

  const connectionByPlatform = new Map((connections ?? []).map((c) => [c.platform, c]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Conexões</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Esta instalação é de uso pessoal do proprietário (single-owner) — nenhuma conta de
          terceiro pode se conectar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const connection = connectionByPlatform.get(platform.id);
          const status = STATUS_LABEL[connection?.status ?? "disconnected"];
          const Icon = platform.icon;

          const cardContent = (
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-[10px] bg-[color:var(--color-accent-purple)]/10 text-[color:var(--color-accent-purple)]">
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{platform.name}</p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  {connection?.display_name ? `@${connection.display_name}` : platform.note}
                </p>
              </div>
              <span className={`text-xs font-medium ${status.className}`}>{status.text}</span>
            </CardContent>
          );

          return platform.href ? (
            <Link key={platform.id} href={platform.href}>
              <Card className="transition-colors hover:border-[color:var(--color-accent-purple)]/50">
                {cardContent}
              </Card>
            </Link>
          ) : (
            <Card key={platform.id} className="opacity-60">
              {cardContent}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
