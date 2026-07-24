import { redirect } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRedirectUri } from "@/lib/integrations/instagram/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CopyRedirectUri } from "./copy-redirect-uri";
import { InstagramSetupActions } from "./setup-actions";

const STATUS_MESSAGES: Record<string, { variant: "success" | "error" | "warning"; message: string }> = {
  connected: { variant: "success", message: "Conta do Instagram conectada com sucesso." },
  rejected: {
    variant: "error",
    message: "Esta instalação aceita somente a conta do proprietário. A tentativa foi registrada.",
  },
  blocked_official_auth_unavailable: {
    variant: "warning",
    message:
      "META_APP_ID / META_APP_SECRET ainda não configurados. Crie o Meta App e adicione as credenciais em .env.local antes de conectar.",
  },
  error: { variant: "error", message: "Não foi possível concluir a conexão." },
};

export default async function InstagramSetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  if (!context.workspace) redirect("/onboarding");

  const params = await searchParams;
  const statusBanner = params.status ? STATUS_MESSAGES[params.status] : null;

  const supabase = await createServerSupabaseClient();
  const { data: connection } = await supabase
    .from("social_connections")
    .select("*")
    .eq("workspace_id", context.workspace.id)
    .eq("platform", "instagram")
    .maybeSingle();

  const { data: testPublishLog } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("workspace_id", context.workspace.id)
    .eq("action", "instagram.test_post_published")
    .limit(1)
    .maybeSingle();

  const isConnected = connection?.status === "connected";
  const redirectUri = getRedirectUri();
  const metaConfigured = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);

  const checklist = [
    { label: "Meta App criado (developers.facebook.com)", done: metaConfigured },
    { label: "App mantido em Development Mode (sem App Review)", done: metaConfigured },
    { label: "Produto Instagram (API with Instagram Login) configurado", done: metaConfigured },
    { label: "Proprietário adicionado como Instagram Tester e convite aceito no Instagram", done: isConnected },
    { label: "Redirect URI cadastrada exatamente como abaixo", done: metaConfigured },
    { label: "Conta profissional (Business/Creator) detectada", done: Boolean(connection?.external_account_id) },
    { label: "Permissões de publicação concedidas", done: Boolean(connection?.scopes?.length) },
    { label: "Autenticação concluída", done: isConnected },
    { label: "Publicação de teste concluída", done: Boolean(testPublishLog) },
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurar Instagram</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Modo single-owner: esta instalação publica apenas na conta do proprietário, via Meta App
          privado em Development Mode. Nenhuma chave de API é solicitada — a conexão é sempre por
          login oficial da Meta.
        </p>
      </div>

      {statusBanner && <Alert variant={statusBanner.variant}>{statusBanner.message}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
          <CardDescription>Itens 1-3 são configurados no painel da Meta, fora deste app.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-0">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-[color:var(--color-success)]" />
              ) : (
                <Circle className="size-4 shrink-0 text-[color:var(--color-text-muted)]" />
              )}
              <span className={item.done ? "" : "text-[color:var(--color-text-muted)]"}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redirect URI</CardTitle>
          <CardDescription>
            Cadastre exatamente esta URL em App Dashboard → Instagram → API setup with Instagram Login.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <CopyRedirectUri redirectUri={redirectUri} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status da conexão</CardTitle>
          {connection?.display_name && (
            <CardDescription>Conta: @{connection.display_name}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <InstagramSetupActions isConnected={isConnected} />
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-[color:var(--color-accent-purple)] underline underline-offset-2"
          >
            Abrir Meta for Developers
            <ExternalLink className="size-3.5" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-sm text-[color:var(--color-text-muted)]">
          Não solicitamos App Review nem Live Mode. Se a Meta mudar as regras oficiais de publicação,
          o conteúdo é preservado como rascunho e você recebe a legenda + arquivo para publicar
          manualmente — nunca migramos automaticamente para uma API paga ou não oficial.
        </CardContent>
      </Card>
    </div>
  );
}
