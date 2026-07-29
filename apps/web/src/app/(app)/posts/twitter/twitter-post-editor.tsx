"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { DesignCanvasPreview } from "@/components/design/design-canvas-preview";
import { MediaUploadButton } from "@/components/design/media-upload-button";
import { buildTwitterPostDocument } from "@/lib/design/templates/twitter-post";
import { saveTwitterPostAction, renderTwitterPostAction } from "@/lib/actions/twitter-post";

export type TwitterPostDefaults = {
  itemId: string;
  title: string;
  name: string;
  handle: string;
  verified: boolean;
  content: string;
  theme: "light" | "dark";
  avatarUrl: string;
};

export function TwitterPostEditor({
  defaults,
  workspaceId,
}: {
  defaults: TwitterPostDefaults;
  workspaceId: string;
}) {
  const [state, formAction, isPending] = useActionState(saveTwitterPostAction, {});
  const [fields, setFields] = useState(defaults);
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<{ error?: string; downloadUrl?: string } | null>(null);

  const document = useMemo(
    () =>
      buildTwitterPostDocument({
        name: fields.name,
        handle: fields.handle,
        verified: fields.verified,
        content: fields.content,
        theme: fields.theme,
        avatarUrl: fields.avatarUrl || null,
      }),
    [fields],
  );

  function update<K extends keyof TwitterPostDefaults>(key: K, value: TwitterPostDefaults[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRender() {
    setIsRendering(true);
    setRenderResult(null);
    const result = await renderTwitterPostAction(fields.itemId);
    setIsRendering(false);
    setRenderResult(result);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="itemId" value={fields.itemId} />
        <input type="hidden" name="verified" value={fields.verified ? "true" : "false"} />
        <input type="hidden" name="avatarUrl" value={fields.avatarUrl} />
        {state.error && <Alert variant="error">{state.error}</Alert>}

        <div>
          <Label htmlFor="title">Título do projeto</Label>
          <Input id="title" name="title" value={fields.title} onChange={(e) => update("title", e.target.value)} />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </div>

        <div>
          <Label>Avatar</Label>
          <div className="flex items-center gap-3">
            {fields.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fields.avatarUrl} alt="" className="size-12 rounded-full object-cover" />
            )}
            <MediaUploadButton
              workspaceId={workspaceId}
              pathPrefix="twitter-avatars"
              label={fields.avatarUrl ? "Trocar avatar" : "Enviar avatar"}
              onUploaded={(url) => update("avatarUrl", url)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" value={fields.name} onChange={(e) => update("name", e.target.value)} />
            <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="handle">@usuário</Label>
            <Input id="handle" name="handle" value={fields.handle} onChange={(e) => update("handle", e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={fields.verified}
            onChange={(e) => update("verified", e.target.checked)}
          />
          Selo de verificação
        </label>

        <div>
          <Label htmlFor="content">Texto do post</Label>
          <Textarea
            id="content"
            name="content"
            rows={6}
            value={fields.content}
            onChange={(e) => update("content", e.target.value)}
          />
          <FieldError>{state.fieldErrors?.content?.[0]}</FieldError>
        </div>

        <div>
          <Label htmlFor="theme">Tema</Label>
          <select
            id="theme"
            name="theme"
            value={fields.theme}
            onChange={(e) => update("theme", e.target.value as TwitterPostDefaults["theme"])}
            className="h-10 w-full rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
          >
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
          </select>
        </div>

        <Button type="submit" loading={isPending} className="self-start">
          Salvar
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
            Pré-visualização (1170 × 1560)
          </p>
          <DesignCanvasPreview document={document} displayWidth={360} />
        </div>

        <Button type="button" variant="secondary" onClick={handleRender} disabled={!fields.itemId || isRendering}>
          {isRendering ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isRendering ? "Renderizando..." : "Renderizar PNG"}
        </Button>
        {!fields.itemId && (
          <p className="text-xs text-[color:var(--color-text-muted)]">Salve o projeto antes de renderizar.</p>
        )}

        {renderResult?.error && <Alert variant="error">{renderResult.error}</Alert>}
        {renderResult?.downloadUrl && (
          <a href={renderResult.downloadUrl} download target="_blank" rel="noreferrer">
            <Button type="button" variant="secondary" className="w-full">
              <Download className="size-4" />
              Baixar PNG
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
