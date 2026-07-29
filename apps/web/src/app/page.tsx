import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="cta-gradient flex size-8 items-center justify-center rounded-[10px] text-sm font-bold text-white">
          {siteConfig.shortName.slice(0, 1)}
        </span>
        {siteConfig.name}
      </div>
      <div className="max-w-xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Crie, organize e publique conteúdo com IA
        </h1>
        <p className="mt-3 text-[color:var(--color-text-muted)]">{siteConfig.description}</p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button size="lg">Começar agora</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary">
            Entrar
          </Button>
        </Link>
      </div>
    </main>
  );
}
