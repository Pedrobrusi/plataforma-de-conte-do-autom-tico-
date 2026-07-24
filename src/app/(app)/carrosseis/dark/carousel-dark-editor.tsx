"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Plus, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { DesignCanvasPreview } from "@/components/design/design-canvas-preview";
import {
  buildCarouselDarkSlide,
  defaultCarouselDarkSlide,
  type CarouselDarkSlideInput,
} from "@/lib/design/templates/carousel-dark";
import { saveCarouselAction, renderCarouselExportAction } from "@/lib/actions/carousel";

export function CarouselDarkEditor({
  initialItemId,
  initialTitle,
  initialSlides,
}: {
  initialItemId: string;
  initialTitle: string;
  initialSlides: CarouselDarkSlideInput[];
}) {
  const router = useRouter();
  // Some após salvar (a navegação para ?id=...&saved=1 remonta este
  // componente com o initialItemId atualizado — ver handleSave).
  const itemId = initialItemId;
  const [title, setTitle] = useState(initialTitle);
  const [slides, setSlides] = useState<CarouselDarkSlideInput[]>(
    initialSlides.length ? initialSlides : [defaultCarouselDarkSlide()],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState<"zip" | "pdf" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const activeSlide = slides[activeIndex];
  const document = useMemo(() => buildCarouselDarkSlide(activeSlide), [activeSlide]);

  function updateActiveSlide(patch: Partial<CarouselDarkSlideInput>) {
    setSlides((prev) => prev.map((slide, i) => (i === activeIndex ? { ...slide, ...patch } : slide)));
  }

  function addSlide() {
    setSlides((prev) => [...prev, defaultCarouselDarkSlide()]);
    setActiveIndex(slides.length);
  }

  function duplicateSlide() {
    setSlides((prev) => {
      const copy = [...prev];
      copy.splice(activeIndex + 1, 0, { ...prev[activeIndex] });
      return copy;
    });
    setActiveIndex(activeIndex + 1);
  }

  function deleteSlide() {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== activeIndex));
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }

  function moveSlide(direction: -1 | 1) {
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    setSlides((prev) => {
      const copy = [...prev];
      [copy[activeIndex], copy[targetIndex]] = [copy[targetIndex], copy[activeIndex]];
      return copy;
    });
    setActiveIndex(targetIndex);
  }

  async function handleSave() {
    setIsSaving(true);
    setFeedback(null);
    const result = await saveCarouselAction({
      itemId: itemId || undefined,
      type: "carousel_dark",
      title,
      slides: slides.map(buildCarouselDarkSlide),
    });
    setIsSaving(false);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    // A navegação abaixo remonta o editor com os dados recém-persistidos
    // (mesmo padrão do Post Twitter/Frase de Efeito) — por isso o feedback de
    // sucesso é o banner "saved=1" renderizado pela página, não este estado
    // local, que seria apagado pelo remount antes de aparecer na tela.
    if (result.itemId) {
      router.replace(`/carrosseis/dark?id=${result.itemId}&saved=1`);
    }
  }

  async function handleExport(format: "zip" | "pdf") {
    if (!itemId) {
      setFeedback({ type: "error", message: "Salve o projeto antes de exportar." });
      return;
    }
    setIsExporting(format);
    setDownloadUrl(null);
    const result = await renderCarouselExportAction(itemId, format);
    setIsExporting(null);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setFeedback({ type: "success", message: result.success ?? "Exportado." });
    setDownloadUrl(result.downloadUrl ?? null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Label htmlFor="carousel-title" className="sr-only">
          Título
        </Label>
        <Input
          id="carousel-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-sm"
          placeholder="Título do projeto"
        />
        <Button type="button" onClick={handleSave} loading={isSaving}>
          Salvar
        </Button>
      </div>

      {feedback && <Alert variant={feedback.type}>{feedback.message}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="slide-content">Texto do slide</Label>
            <Textarea
              id="slide-content"
              rows={4}
              value={activeSlide.content}
              onChange={(e) => updateActiveSlide({ content: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="font-size">Tamanho da fonte ({activeSlide.fontSize}px)</Label>
            <input
              id="font-size"
              type="range"
              min={24}
              max={96}
              value={activeSlide.fontSize}
              onChange={(e) => updateActiveSlide({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bg-color">Fundo</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeSlide.backgroundColor}
                  onChange={(e) => updateActiveSlide({ backgroundColor: e.target.value })}
                  className="size-9 cursor-pointer rounded-[8px] border border-[color:var(--color-border)] bg-transparent"
                />
                <Input
                  value={activeSlide.backgroundColor}
                  onChange={(e) => updateActiveSlide({ backgroundColor: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="text-color">Texto</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={activeSlide.textColor}
                  onChange={(e) => updateActiveSlide({ textColor: e.target.value })}
                  className="size-9 cursor-pointer rounded-[8px] border border-[color:var(--color-border)] bg-transparent"
                />
                <Input
                  value={activeSlide.textColor}
                  onChange={(e) => updateActiveSlide({ textColor: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={addSlide}>
              <Plus className="size-4" /> Adicionar slide
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={duplicateSlide}>
              <Copy className="size-4" /> Duplicar
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={deleteSlide} disabled={slides.length <= 1}>
              <Trash2 className="size-4" /> Excluir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Mover slide para a esquerda"
              onClick={() => moveSlide(-1)}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Mover slide para a direita"
              onClick={() => moveSlide(1)}
              disabled={activeIndex === slides.length - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`flex size-14 shrink-0 items-center justify-center rounded-[8px] border text-xs ${
                  i === activeIndex
                    ? "border-[color:var(--color-accent-purple)] text-[color:var(--color-accent-purple)]"
                    : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)]"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
              Slide {activeIndex + 1} de {slides.length} (1170 × 1560)
            </p>
            <DesignCanvasPreview document={document} displayWidth={320} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleExport("zip")}
              disabled={isExporting !== null}
            >
              {isExporting === "zip" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Exportar ZIP
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleExport("pdf")}
              disabled={isExporting !== null}
            >
              {isExporting === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Exportar PDF
            </Button>
          </div>
          {!itemId && (
            <p className="text-xs text-[color:var(--color-text-muted)]">Salve o projeto antes de exportar.</p>
          )}
          {downloadUrl && (
            <a href={downloadUrl} download target="_blank" rel="noreferrer">
              <Button type="button" variant="secondary" className="w-full">
                <Download className="size-4" />
                Baixar arquivo gerado
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
