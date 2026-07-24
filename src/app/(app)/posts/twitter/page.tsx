import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DesignDocument } from "@/lib/design/document";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { TwitterPostEditor, type TwitterPostDefaults } from "./twitter-post-editor";

export default async function PostTwitterPage({
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
    .eq("type", "twitter_post")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(10);

  let defaults: TwitterPostDefaults = {
    itemId: "",
    title: "Novo post Twitter",
    name: context.profile.fullName || "",
    handle: "",
    verified: false,
    content: "",
    theme: "dark",
    avatarUrl: context.profile.avatarUrl || "",
  };

  if (params.id) {
    const { data: item } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", params.id)
      .eq("workspace_id", context.workspace.id)
      .eq("type", "twitter_post")
      .maybeSingle();

    if (item) {
      const doc = item.data as unknown as DesignDocument;
      const name = doc.elements.find((el) => el.id === "name" && el.type === "text");
      const handle = doc.elements.find((el) => el.id === "handle" && el.type === "text");
      const body = doc.elements.find((el) => el.id === "body" && el.type === "text");
      const avatar = doc.elements.find((el) => el.id === "avatar" && el.type === "image");
      const hasVerifiedBadge = doc.elements.some((el) => el.id === "verified-badge");
      defaults = {
        itemId: item.id,
        title: item.title,
        name: name?.type === "text" ? name.content : "",
        handle: handle?.type === "text" ? handle.content.replace(/^@/, "") : "",
        verified: hasVerifiedBadge,
        content: body?.type === "text" ? body.content : "",
        theme: doc.background.color === "#FFFFFF" ? "light" : "dark",
        avatarUrl: (avatar?.type === "image" && avatar.src) || "",
      };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Post Twitter</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Composição original inspirada em posts de texto — não é uma cópia da interface do X.
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
                href={`/posts/twitter?id=${project.id}`}
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
              href="/posts/twitter"
              className="rounded-full bg-[color:var(--color-surface-hover)] px-2.5 py-1 text-xs text-[color:var(--color-text-muted)]"
            >
              + Novo
            </Link>
          </CardContent>
        </Card>
      )}

      <TwitterPostEditor defaults={defaults} workspaceId={context.workspace.id} key={defaults.itemId} />
    </div>
  );
}
