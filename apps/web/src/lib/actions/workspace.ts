"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function switchWorkspaceAction(workspaceId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Sessão expirada." };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) {
    return { error: "Você não tem acesso a este workspace." };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ active_workspace_id: workspaceId })
    .eq("id", userData.user.id);

  if (error) return { error: error.message };
  return {};
}
