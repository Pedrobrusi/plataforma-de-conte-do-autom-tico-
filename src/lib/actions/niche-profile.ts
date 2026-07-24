"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { nicheProfileSchema } from "@/lib/validations/niche-profile";
import { generateSampleFromNicheProfile } from "@/lib/ai/local-text-generator";
import { costPreflight } from "@/lib/providers/registry";
import type { ActionResult } from "@/lib/actions/auth";
import type { Json } from "@/lib/supabase/types";

type NicheProfileRow = {
  id: string;
  niche: string | null;
  what_i_do: string | null;
  target_audience: string | null;
  audience_pains: string | null;
  audience_desires: string | null;
  objections: string | null;
  differentiators: string | null;
  proof_and_authority: string | null;
  products_or_services: string | null;
  tone_of_voice: string | null;
  topics_to_cover: string | null;
  topics_to_avoid: string | null;
  creator_references: string | null;
  publish_frequency: string | null;
  main_goal: string | null;
  website_url: string | null;
  version: number;
};

const EDITABLE_COLUMNS = [
  "niche",
  "what_i_do",
  "target_audience",
  "audience_pains",
  "audience_desires",
  "objections",
  "differentiators",
  "proof_and_authority",
  "products_or_services",
  "tone_of_voice",
  "topics_to_cover",
  "topics_to_avoid",
  "creator_references",
  "publish_frequency",
  "main_goal",
  "website_url",
] as const;

function snapshotOf(row: NicheProfileRow): Json {
  const snapshot: Record<string, Json> = {};
  for (const col of EDITABLE_COLUMNS) snapshot[col] = (row[col as keyof NicheProfileRow] ?? null) as Json;
  return snapshot;
}

export async function saveNicheProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = nicheProfileSchema.safeParse({
    niche: formData.get("niche"),
    whatIDo: formData.get("whatIDo"),
    targetAudience: formData.get("targetAudience"),
    audiencePains: formData.get("audiencePains"),
    audienceDesires: formData.get("audienceDesires"),
    objections: formData.get("objections"),
    differentiators: formData.get("differentiators"),
    proofAndAuthority: formData.get("proofAndAuthority"),
    productsOrServices: formData.get("productsOrServices"),
    toneOfVoice: formData.get("toneOfVoice"),
    topicsToCover: formData.get("topicsToCover"),
    topicsToAvoid: formData.get("topicsToAvoid"),
    creatorReferences: formData.get("creatorReferences"),
    publishFrequency: formData.get("publishFrequency"),
    mainGoal: formData.get("mainGoal"),
    websiteUrl: formData.get("websiteUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("niche_profiles")
    .select("*")
    .eq("workspace_id", context.workspace.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newValues = {
    niche: parsed.data.niche || null,
    what_i_do: parsed.data.whatIDo || null,
    target_audience: parsed.data.targetAudience || null,
    audience_pains: parsed.data.audiencePains || null,
    audience_desires: parsed.data.audienceDesires || null,
    objections: parsed.data.objections || null,
    differentiators: parsed.data.differentiators || null,
    proof_and_authority: parsed.data.proofAndAuthority || null,
    products_or_services: parsed.data.productsOrServices || null,
    tone_of_voice: parsed.data.toneOfVoice || null,
    topics_to_cover: parsed.data.topicsToCover || null,
    topics_to_avoid: parsed.data.topicsToAvoid || null,
    creator_references: parsed.data.creatorReferences || null,
    publish_frequency: parsed.data.publishFrequency || null,
    main_goal: parsed.data.mainGoal || null,
    website_url: parsed.data.websiteUrl || null,
  };

  if (existing) {
    const { error: versionError } = await supabase.from("niche_profile_versions").insert({
      niche_profile_id: existing.id,
      workspace_id: context.workspace.id,
      snapshot: snapshotOf(existing as NicheProfileRow),
      created_by: context.user.id,
    });
    if (versionError) return { error: versionError.message };

    const { error: updateError } = await supabase
      .from("niche_profiles")
      .update({ ...newValues, version: existing.version + 1 })
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase.from("niche_profiles").insert({
      workspace_id: context.workspace.id,
      ...newValues,
      version: 1,
      created_by: context.user.id,
    });
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/planejador");
  return { success: "Perfil de nicho salvo. Este contexto será usado pelos geradores de IA." };
}

export async function restoreNicheProfileVersionAction(versionId: string): Promise<ActionResult> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const supabase = await createServerSupabaseClient();
  const { data: version } = await supabase
    .from("niche_profile_versions")
    .select("*")
    .eq("id", versionId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();

  if (!version) return { error: "Versão não encontrada." };

  const { data: current } = await supabase
    .from("niche_profiles")
    .select("*")
    .eq("id", version.niche_profile_id)
    .maybeSingle();

  if (!current) return { error: "Perfil atual não encontrado." };

  const { error: snapshotError } = await supabase.from("niche_profile_versions").insert({
    niche_profile_id: current.id,
    workspace_id: context.workspace.id,
    snapshot: snapshotOf(current as NicheProfileRow),
    created_by: context.user.id,
  });
  if (snapshotError) return { error: snapshotError.message };

  const restoredValues = version.snapshot as Record<string, unknown>;
  const { error: updateError } = await supabase
    .from("niche_profiles")
    .update({ ...restoredValues, version: current.version + 1 })
    .eq("id", current.id);
  if (updateError) return { error: updateError.message };

  revalidatePath("/planejador");
  return { success: "Versão restaurada." };
}

export async function testGenerationAction(): Promise<ActionResult & { sample?: string }> {
  const context = await getWorkspaceContext();
  if (!context?.workspace) return { error: "Sessão expirada." };

  const preflight = costPreflight({ providerId: "local-template-text", operation: "niche_profile_test" });
  if (!preflight.allowed) {
    return { error: `Geração bloqueada: ${preflight.reason}` };
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("niche_profiles")
    .select("niche, target_audience, tone_of_voice, main_goal, differentiators")
    .eq("workspace_id", context.workspace.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sample = generateSampleFromNicheProfile({
    niche: profile?.niche,
    targetAudience: profile?.target_audience,
    toneOfVoice: profile?.tone_of_voice,
    mainGoal: profile?.main_goal,
    differentiators: profile?.differentiators,
  });

  const { data: run } = await supabase
    .from("ai_generation_runs")
    .insert({
      workspace_id: context.workspace.id,
      user_id: context.user.id,
      provider: "mock",
      model: "local-template-text",
      prompt_key: "niche_profile_test_generation",
      input: { niche: profile?.niche ?? null },
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (run) {
    await supabase.from("ai_generation_outputs").insert({
      generation_run_id: run.id,
      workspace_id: context.workspace.id,
      output: { text: sample },
      is_selected: true,
    });
  }

  return { success: "Amostra gerada com o gerador local (sem custo externo).", sample };
}
