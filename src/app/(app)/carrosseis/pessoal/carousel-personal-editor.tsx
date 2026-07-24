"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { MediaUploadButton } from "@/components/design/media-upload-button";
import { SlideNavigator } from "@/components/design/slide-navigator";
import { CarouselExportPanel } from "@/components/design/carousel-export-panel";
import { useSlideList } from "@/lib/design/use-slide-list";
import {
  buildCarouselPersonalSlide,
  defaultCarouselPersonalSlide,
  type CarouselPersonalSlideInput,
} from "@/lib/design/templates/carousel-personal";
import { saveCarouselAction } from "@/lib/actions/carousel";

export function CarouselPersonalEditor({
  initialItemId,
  initialTitle,
  initialSlides,
  workspaceId,
}: {
  initialItemId: string;
  initialTitle: string;
  initialSlides: CarouselPersonalSlideInput[];
  workspaceId: string;
}) {
  const router = useRouter();
  const itemId = initialItemId;
  const [title, setTitle] = useState(initialTitle);
  const { slides, activeIndex, setActiveIndex, active, updateActive, add, duplicate, remove, move } = useSlideList(
    initialSlides,
    defaultCarouselPersonalSlide,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const document = useMemo(() => buildCarouselPersonalSlide(active), [active]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const result = await saveCarouselAction({
      itemId: itemId || undefined,
      type: "carousel_personal",
      title,
      slides: slides.map(buildCarouselPersonalSlide),
    });
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.itemId) {
      router.replace(`/carrosseis/pessoal?id=${result.itemId}&saved=1`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-sm"
          placeholder="Título do projeto"
        />
        <Button type="button" onClick={handleSave} loading={isSaving}>
          Salvar
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <div>
            <Label>Foto (ocupa todo o slide)</Label>
            <div className="flex items-center gap-3">
              {active.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.photoUrl} alt="" className="size-16 rounded-[8px] object-cover" />
              )}
              <MediaUploadButton
                workspaceId={workspaceId}
                pathPrefix="carousel-personal"
                label={active.photoUrl ? "Trocar foto" : "Enviar foto"}
                onUploaded={(url) => updateActive({ photoUrl: url })}
              />
            </div>
            {!active.photoUrl && (
              <p className="mt-1 text-xs text-[color:var(--color-warning)]">
                Obrigatória — a exportação fica bloqueada sem foto neste slide.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="focal-x">Foco horizontal ({Math.round(active.focalX * 100)}%)</Label>
              <input
                id="focal-x"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={active.focalX}
                onChange={(e) => updateActive({ focalX: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="focal-y">Foco vertical ({Math.round(active.focalY * 100)}%)</Label>
              <input
                id="focal-y"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={active.focalY}
                onChange={(e) => updateActive({ focalY: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="overlay">Overlay escuro ({Math.round(active.overlayOpacity * 100)}%)</Label>
            <input
              id="overlay"
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={active.overlayOpacity}
              onChange={(e) => updateActive({ overlayOpacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="phrase">Frase</Label>
            <Textarea
              id="phrase"
              rows={3}
              value={active.phrase}
              onChange={(e) => updateActive({ phrase: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="handle">@usuário</Label>
              <Input id="handle" value={active.handle} onChange={(e) => updateActive({ handle: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="text-color">Cor do texto</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={active.textColor}
                  onChange={(e) => updateActive({ textColor: e.target.value })}
                  className="size-9 cursor-pointer rounded-[8px] border border-[color:var(--color-border)] bg-transparent"
                />
                <Input
                  value={active.textColor}
                  onChange={(e) => updateActive({ textColor: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="font-size">Tamanho da fonte ({active.fontSize}px)</Label>
            <input
              id="font-size"
              type="range"
              min={24}
              max={80}
              value={active.fontSize}
              onChange={(e) => updateActive({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <SlideNavigator
            count={slides.length}
            activeIndex={activeIndex}
            onAdd={add}
            onDuplicate={duplicate}
            onDelete={remove}
            onMove={move}
            onSelect={setActiveIndex}
          />
        </div>

        <CarouselExportPanel
          itemId={itemId}
          document={document}
          slideLabel={`Slide ${activeIndex + 1} de ${slides.length}`}
        />
      </div>
    </div>
  );
}
