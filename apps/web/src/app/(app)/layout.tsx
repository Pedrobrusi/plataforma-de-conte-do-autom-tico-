import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getWorkspaceContext();

  if (!context) {
    redirect("/login");
  }

  if (!context.profile.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return <AppShell context={context}>{children}</AppShell>;
}
