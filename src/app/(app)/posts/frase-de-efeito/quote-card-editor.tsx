"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { DesignCanvasPreview } from "@/components/design/design-canvas-preview";
import { buildQuoteCardDocument } from "@/lib/design/templates/quote-card";
import { saveQuoteCardAction, renderQuoteCardAction } from "@/lib/actions/quote-card";

export type QuoteCardDefaults = {
  itemId: string;
  title: string;
  content: string;
  align: "left" | "center" | "right";
  highlightSubstring: string;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  handle: string;
};

export function QuoteCardEditor({ defaults }: { defaults: QuoteCardDefaults }) {
  const [state, formAction, isPending] = useActionState(saveQuoteCardAction, {});
  const [fields, setFields] = useState(defaults);
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<{ error?: string; downloadUrl?: string } | null>(null);

  const document = useMemo(
    () =>
      buildQuoteCardDocument({
        content: fields.content,
        align: fields.align,
        highlightSubstring: fields.highlightSubstring || undefined,
        backgroundColor: fields.backgroundColor,
        textColor: fields.textColor,
        highlightColor: fields.highlightColor,
        handle: fields.handle,
      }),
    [fields],
  );

  function update<K extends keyof QuoteCardDefaults>(key: K, value: QuoteCardDefaults[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRender() {
    setIsRendering(true);
    setRenderResult(null);
    const result = await renderQuoteCardAction(fields.itemId);
    setIsRendering(false);
    setRenderResult(result);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="itemId" value={fields.itemId} />
        {state.error && <Alert variant="error">{state.error}</Alert>}

        <div>
          <Label htmlFor="title">Título do projeto</Label>
          <Input
            id="title"
            name="title"
            value={fields.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </div>

        <div>
          <Label htmlFor="content">Frase</Label>
          <Textarea
            id="content"
            name="content"
            rows={4}
            value={fields.content}
            onChange={(e) => update("content", e.target.value)}
          />
          <FieldError>{state.fieldErrors?.content?.[0]}</FieldError>
        </div>

        <div>
          <Label htmlFor="highlightSubstring">Palavra em destaque (opcional)</Label>
          <Input
            id="highlightSubstring"
            name="highlightSubstring"
            value={fields.highlightSubstring}
            onChange={(e) => update("highlightSubstring", e.target.value)}
            placeholder="Ex: sucesso"
          />
        </div>

        <div>
          <Label htmlFor="align">Alinhamento</Label>
          <select
            id="align"
            name="align"
            value={fields.align}
            onChange={(e) => update("align", e.target.value as QuoteCardDefaults["align"])}
            className="h-10 w-full rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ColorField
            label="Fundo"
            name="backgroundColor"
            value={fields.backgroundColor}
            onChange={(v) => update("backgroundColor", v)}
          />
          <ColorField
            label="Texto"
            name="textColor"
            value={fields.textColor}
            onChange={(v) => update("textColor", v)}
          />
          <ColorField
            label="Destaque"
            name="highlightColor"
            value={fields.highlightColor}
            onChange={(v) => update("highlightColor", v)}
          />
        </div>

        <div>
          <Label htmlFor="handle">@usuário (rodapé)</Label>
          <Input id="handle" name="handle" value={fields.handle} onChange={(e) => update("handle", e.target.value)} />
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

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-[8px] border border-[color:var(--color-border)] bg-transparent"
        />
        <input type="hidden" name={name} value={value} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" />
      </div>
    </div>
  );
}
