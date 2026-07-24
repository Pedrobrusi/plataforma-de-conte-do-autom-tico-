import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed_at, active_workspace_id")
    .eq("id", userData.user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  let defaultWorkspaceName = "Meu Workspace";
  if (profile?.active_workspace_id) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", profile.active_workspace_id)
      .single();
    if (workspace?.name) defaultWorkspaceName = workspace.name;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bem-vindo(a) ao {siteConfig.name}</CardTitle>
          <CardDescription>
            Vamos configurar o básico do seu workspace antes de começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm defaultWorkspaceName={defaultWorkspaceName} />
        </CardContent>
      </Card>
    </div>
  );
}
