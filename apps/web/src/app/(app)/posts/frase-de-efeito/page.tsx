import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DesignDocument } from "@/lib/design/document";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { QuoteCardEditor, type QuoteCardDefaults } from "./quote-card-editor";

export default async function FraseDeEfeitoPage({
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
    .select("id, title, updated_at")
    .eq("workspace_id", context.workspace.id)
    .eq("type", "quote_card")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  let defaults: QuoteCardDefaults = {
    itemId: "",
    title: "Nova frase de efeito",
    content: "",
    align: "left",
    highlightSubstring: "",
    backgroundColor: "#08090A",
    textColor: "#F5F5F5",
    highlightColor: "#EC4899",
    handle: "",
  };

  if (params.id) {
    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", params.id)
      .eq("workspace_id", context.workspace.id)
      .eq("type", "quote_card")
      .maybeSingle();

    if (item) {
      const doc = item.data as unknown as DesignDocument;
      const headline = doc.elements.find((el) => el.id === "headline" && el.type === "text");
      const handle = doc.elements.find((el) => el.id === "handle" && el.type === "text");
      defaults = {
        itemId: item.id,
        title: item.title,
        content: headline?.type === "text" ? headline.content : "",
        align: (headline?.type === "text" ? headline.align : "left") as QuoteCardDefaults["align"],
        highlightSubstring: (headline?.type === "text" && headline.highlightSubstring) || "",
        backgroundColor: doc.background.color ?? "#08090A",
        textColor: headline?.type === "text" ? headline.color : "#F5F5F5",
        highlightColor: (headline?.type === "text" && headline.highlightColor) || "#EC4899",
        handle: handle?.type === "text" ? handle.content.replace(/^@/, "") : "",
      };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Frase de Efeito</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Composição editorial real — o preview e o PNG exportado usam o mesmo documento de design.
        </p>
      </div>

      {params.saved === "1" && (
        <Alert variant="success">
          <CheckCircle2 className="size-4" /> Salvo.
        </Alert>
      )}

      {projects && projects.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-3">
            <span className="text-xs text-[color:var(--color-text-muted)]">Meus projetos:</span>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/posts/frase-de-efeito?id=${project.id}`}
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
              href="/posts/frase-de-efeito"
              className="rounded-full bg-[color:var(--color-surface-hover)] px-2.5 py-1 text-xs text-[color:var(--color-text-muted)]"
            >
              + Novo
            </Link>
          </CardContent>
        </Card>
      )}

      <QuoteCardEditor defaults={defaults} key={defaults.itemId} />
    </div>
  );
}
