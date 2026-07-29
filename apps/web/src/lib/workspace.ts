import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WorkspaceContext = {
  user: { id: string; email: string | null };
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
    onboardingCompletedAt: string | null;
  };
  workspace: { id: string; name: string; slug: string } | null;
  role: "owner" | "admin" | "editor" | "viewer" | null;
  creditBalance: number;
  memberships: { workspaceId: string; workspaceName: string; role: string }[];
};

export async function getWorkspaceContext(): Promise<WorkspaceContext | null> {
  const supabase = await createServerSupabaseClient();
  const { data: userData, error } = await supabase.auth.getUser();

  if (error || !userData.user) return null;

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("full_name, avatar_url, onboarding_completed_at, active_workspace_id")
      .eq("id", userData.user.id)
      .single(),
    supabase
      .from("workspace_members")
      .select("workspace_id, role, workspaces(id, name)")
      .eq("user_id", userData.user.id)
      .eq("status", "active"),
  ]);

  const activeWorkspaceId = profile?.active_workspace_id ?? memberships?.[0]?.workspace_id ?? null;

  let workspace: WorkspaceContext["workspace"] = null;
  let role: WorkspaceContext["role"] = null;
  let creditBalance = 0;

  if (activeWorkspaceId) {
    const [{ data: workspaceRow }, { data: wallet }] = await Promise.all([
      supabase.from("workspaces").select("id, name, slug").eq("id", activeWorkspaceId).single(),
      supabase.from("credit_wallets").select("balance").eq("workspace_id", activeWorkspaceId).single(),
    ]);

    if (workspaceRow) workspace = workspaceRow;
    creditBalance = wallet?.balance ?? 0;
    role = (memberships?.find((m) => m.workspace_id === activeWorkspaceId)?.role as WorkspaceContext["role"]) ?? null;
  }

  return {
    user: { id: userData.user.id, email: userData.user.email ?? null },
    profile: {
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
    },
    workspace,
    role,
    creditBalance,
    memberships: (memberships ?? []).map((m) => ({
      workspaceId: m.workspace_id,
      workspaceName: (m.workspaces as unknown as { name: string } | null)?.name ?? "Workspace",
      role: m.role,
    })),
  };
}
