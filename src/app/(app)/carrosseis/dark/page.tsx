import Link from "next/link";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DesignDocument } from "@/lib/design/document";
import type { CarouselDarkSlideInput } from "@/lib/design/templates/carousel-dark";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CarouselDarkEditor } from "./carousel-dark-editor";

export default async function CarrosselDarkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  if (!context.workspace) redirect("/onboarding");

  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: projects } = await supabase
    .from("content_items")
    .select("id, title")
    .eq("workspace_id", context.workspace.id)
    .eq("type", "carousel_dark")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  let initialItemId = "";
  let initialTitle = "Novo carrossel dark";
  let initialSlides: CarouselDarkSlideInput[] = [];

  if (params.id) {
    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", params.id)
      .eq("workspace_id", context.workspace.id)
      .eq("type", "carousel_dark")
      .maybeSingle();

    if (item) {
      const slides = (item.data as unknown as { slides: DesignDocument[] }).slides ?? [];
      initialItemId = item.id;
      initialTitle = item.title;
      initialSlides = slides.map((slide) => {
        const content = slide.elements.find((el) => el.id === "content" && el.type === "text");
        return {
          content: content?.type === "text" ? content.content : "",
          fontSize: content?.type === "text" ? content.fontSize : 56,
          backgroundColor: slide.background.color ?? "#000000",
          textColor: content?.type === "text" ? content.color : "#FFFFFF",
        };
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Carrossel Dark</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Fundo escuro, tipografia forte — adicione, reordene e exporte slides reais.
        </p>
      </div>

      {params.saved === "1" && <Alert variant="success">Salvo.</Alert>}

      {projects && projects.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-3">
            <span className="text-xs text-[color:var(--color-text-muted)]">Meus projetos:</span>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/carrosseis/dark?id=${project.id}`}
                className={`rounded-full px-2.5 py-1 text-xs ${
                  project.id === params.id
                    ? "bg-[color:var(--color-accent-purple)]/20 text-[color:var(--color-accent-purple)]"
                    : "bg-[color:var(--color-surface-hover)] text-[color:var(--color-text-muted)]"
                }`}
              >
                {project.title}
              </Link>
            ))}
            <Link
              href="/carrosseis/dark"
              className="rounded-full bg-[color:var(--color-surface-hover)] px-2.5 py-1 text-xs text-[color:var(--color-text-muted)]"
            >
              + Novo
            </Link>
          </CardContent>
        </Card>
      )}

      <CarouselDarkEditor
        key={initialItemId}
        initialItemId={initialItemId}
        initialTitle={initialTitle}
        initialSlides={initialSlides}
      />
    </div>
  );
}
