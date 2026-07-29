import type { DesignDocument } from "@/lib/design/document";

export const CAROUSEL_CANVAS = { width: 1170, height: 1560 } as const;

export type CarouselDarkSlideInput = {
  content: string;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
};

export function buildCarouselDarkSlide(input: CarouselDarkSlideInput): DesignDocument {
  const fontSize = Math.min(96, Math.max(24, input.fontSize));

  return {
    version: 1,
    templateId: "carousel-dark",
    contentType: "carousel_dark",
    canvas: CAROUSEL_CANVAS,
    background: { type: "color", color: input.backgroundColor },
    safeArea: { top: 96, right: 96, bottom: 96, left: 96 },
    elements: [
      {
        id: "content",
        type: "text",
        x: 96,
        y: 0,
        width: CAROUSEL_CANVAS.width - 192,
        height: CAROUSEL_CANVAS.height,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        content: input.content || "Texto do slide...",
        fontFamily: "Inter",
        fontSize,
        fontWeight: 800,
        color: input.textColor,
        align: "center",
        verticalAlign: "middle",
        lineHeight: 1.2,
        letterSpacing: 0,
      },
    ],
  };
}

export function defaultCarouselDarkSlide(): CarouselDarkSlideInput {
  return { content: "", fontSize: 56, backgroundColor: "#000000", textColor: "#FFFFFF" };
}
