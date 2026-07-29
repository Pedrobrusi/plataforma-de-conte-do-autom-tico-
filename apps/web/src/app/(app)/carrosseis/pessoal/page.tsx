import Link from "next/link";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DesignDocument } from "@/lib/design/document";
import type { CarouselPersonalSlideInput } from "@/lib/design/templates/carousel-personal";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CarouselPersonalEditor } from "./carousel-personal-editor";

export default async function CarrosselPessoalPage({
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
    .eq("type", "carousel_personal")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  let initialItemId = "";
  let initialTitle = "Novo carrossel pessoal";
  let initialSlides: CarouselPersonalSlideInput[] = [];

  if (params.id) {
    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", params.id)
      .eq("workspace_id", context.workspace.id)
      .eq("type", "carousel_personal")
      .maybeSingle();

    if (item) {
      const slides = (item.data as unknown as { slides: DesignDocument[] }).slides ?? [];
      initialItemId = item.id;
      initialTitle = item.title;
      initialSlides = slides.map((slide) => {
        const photo = slide.elements.find((el) => el.id === "photo" && el.type === "image");
        const overlay = slide.elements.find((el) => el.id === "overlay" && el.type === "shape");
        const phrase = slide.elements.find((el) => el.id === "phrase" && el.type === "text");
        const handle = slide.elements.find((el) => el.id === "handle" && el.type === "text");
        return {
          photoUrl: photo?.type === "image" ? photo.src : null,
          focalX: photo?.type === "image" ? photo.focalX : 0.5,
          focalY: photo?.type === "image" ? photo.focalY : 0.5,
          overlayOpacity: overlay?.type === "shape" ? overlay.opacity : 0.35,
          phrase: phrase?.type === "text" ? phrase.content : "",
          textColor: phrase?.type === "text" ? phrase.color : "#FFFFFF",
          fontSize: phrase?.type === "text" ? phrase.fontSize : 48,
          handle: handle?.type === "text" ? handle.content.replace(/^@/, "") : "",
        };
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Carrossel Pessoal</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Storytelling com foto real — exportação bloqueada até você enviar a imagem de cada slide.
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
                href={`/carrosseis/pessoal?id=${project.id}`}
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
              href="/carrosseis/pessoal"
              className="rounded-full bg-[color:var(--color-surface-hover)] px-2.5 py-1 text-xs text-[color:var(--color-text-muted)]"
            >
              + Novo
            </Link>
          </CardContent>
        </Card>
      )}

      <CarouselPersonalEditor
        key={initialItemId}
        initialItemId={initialItemId}
        initialTitle={initialTitle}
        initialSlides={initialSlides}
        workspaceId={context.workspace.id}
      />
    </div>
  );
}
