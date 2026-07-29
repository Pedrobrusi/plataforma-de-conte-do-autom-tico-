import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildAiContextSummary } from "@/lib/ai/local-text-generator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NicheProfileForm } from "./niche-profile-form";
import { ContextPreview } from "./context-preview";
import { VersionHistory } from "./version-history";

export default async function PlanejadorPage() {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  if (!context.workspace) redirect("/onboarding");

  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("niche_profiles")
    .select("*")
    .eq("workspace_id", context.workspace.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: versions } = profile
    ? await supabase
        .from("niche_profile_versions")
        .select("id, created_at")
        .eq("niche_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const defaults = {
    niche: profile?.niche ?? "",
    whatIDo: profile?.what_i_do ?? "",
    targetAudience: profile?.target_audience ?? "",
    audiencePains: profile?.audience_pains ?? "",
    audienceDesires: profile?.audience_desires ?? "",
    objections: profile?.objections ?? "",
    differentiators: profile?.differentiators ?? "",
    proofAndAuthority: profile?.proof_and_authority ?? "",
    productsOrServices: profile?.products_or_services ?? "",
    toneOfVoice: profile?.tone_of_voice ?? "",
    topicsToCover: profile?.topics_to_cover ?? "",
    topicsToAvoid: profile?.topics_to_avoid ?? "",
    creatorReferences: profile?.creator_references ?? "",
    publishFrequency: profile?.publish_frequency ?? "",
    mainGoal: profile?.main_goal ?? "",
    websiteUrl: profile?.website_url ?? "",
  };

  const contextSummary = buildAiContextSummary({
    niche: profile?.niche,
    targetAudience: profile?.target_audience,
    toneOfVoice: profile?.tone_of_voice,
    mainGoal: profile?.main_goal,
    differentiators: profile?.differentiators,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Planejador</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Contexto estratégico usado por todos os geradores de IA (Fases 3+).
          {profile && ` Versão ${profile.version}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
            <CardDescription>Salvamento cria uma nova versão — nada é perdido.</CardDescription>
          </CardHeader>
          <CardContent>
            <NicheProfileForm defaults={defaults} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview do contexto</CardTitle>
            </CardHeader>
            <CardContent>
              <ContextPreview contextSummary={contextSummary} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de versões</CardTitle>
            </CardHeader>
            <CardContent>
              <VersionHistory
                versions={(versions ?? []).map((v) => ({ id: v.id, createdAt: v.created_at }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
