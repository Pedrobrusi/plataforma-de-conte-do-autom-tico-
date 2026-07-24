import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, bio, avatar_url")
    .eq("id", userData.user.id)
    .single();

  const displayName = profile?.full_name || userData.user.email || "Usuário";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações do perfil</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Essas informações identificam você dentro dos seus workspaces.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto</CardTitle>
          <CardDescription>PNG, JPG ou WEBP, até 2MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader
            userId={userData.user.id}
            initialAvatarUrl={profile?.avatar_url ?? null}
            initials={initials}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultFullName={profile?.full_name ?? ""} defaultBio={profile?.bio ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
