"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/lib/actions/auth";

export async function completeOnboardingAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse({
    workspaceName: formData.get("workspaceName"),
    niche: formData.get("niche"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("active_workspace_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.active_workspace_id) {
    return { error: "Não foi possível localizar seu workspace. Tente novamente." };
  }

  const { workspaceName, niche } = parsed.data;

  const { error: workspaceError } = await supabase
    .from("workspaces")
    .update({ name: workspaceName })
    .eq("id", profile.active_workspace_id);

  if (workspaceError) {
    return { error: workspaceError.message };
  }

  if (niche) {
    const { error: nicheError } = await supabase.from("niche_profiles").insert({
      workspace_id: profile.active_workspace_id,
      niche,
      created_by: userData.user.id,
    });
    if (nicheError) {
      return { error: nicheError.message };
    }
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", userData.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  redirect("/dashboard");
}
