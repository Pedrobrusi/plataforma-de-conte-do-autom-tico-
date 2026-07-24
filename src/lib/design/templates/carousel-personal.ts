import type { DesignDocument } from "@/lib/design/document";

export const CAROUSEL_CANVAS = { width: 1170, height: 1560 } as const;

export type CarouselPersonalSlideInput = {
  photoUrl: string | null;
  focalX: number;
  focalY: number;
  overlayOpacity: number;
  phrase: string;
  textColor: string;
  fontSize: number;
  handle: string;
};

export function buildCarouselPersonalSlide(input: CarouselPersonalSlideInput): DesignDocument {
  return {
    version: 1,
    templateId: "carousel-personal",
    contentType: "carousel_personal",
    canvas: CAROUSEL_CANVAS,
    background: { type: "color", color: "#08090A" },
    safeArea: { top: 96, right: 96, bottom: 96, left: 96 },
    elements: [
      {
        id: "photo",
        type: "image",
        x: 0,
        y: 0,
        width: CAROUSEL_CANVAS.width,
        height: CAROUSEL_CANVAS.height,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        src: input.photoUrl,
        fit: "cover",
        borderRadius: 0,
        focalX: input.focalX,
        focalY: input.focalY,
        required: true,
      },
      {
        id: "overlay",
        type: "shape",
        x: 0,
        y: 0,
        width: CAROUSEL_CANVAS.width,
        height: CAROUSEL_CANVAS.height,
        rotation: 0,
        zIndex: 2,
        opacity: input.overlayOpacity,
        shape: "rect",
        fill: "#000000",
        strokeWidth: 0,
        borderRadius: 0,
      },
      {
        id: "phrase",
        type: "text",
        x: 96,
        y: 1080,
        width: CAROUSEL_CANVAS.width - 192,
        height: 320,
        rotation: 0,
        zIndex: 3,
        opacity: 1,
        content: input.phrase || "Sua frase aqui...",
        fontFamily: "Inter",
        fontSize: input.fontSize,
        fontWeight: 700,
        color: input.textColor,
        align: "left",
        verticalAlign: "bottom",
        lineHeight: 1.25,
        letterSpacing: 0,
      },
      {
        id: "handle",
        type: "text",
        x: 96,
        y: CAROUSEL_CANVAS.height - 140,
        width: CAROUSEL_CANVAS.width - 192,
        height: 50,
        rotation: 0,
        zIndex: 3,
        opacity: 0.9,
        content: input.handle ? `@${input.handle.replace(/^@/, "")}` : "",
        fontFamily: "Inter",
        fontSize: 26,
        fontWeight: 500,
        color: input.textColor,
        align: "left",
        verticalAlign: "top",
        lineHeight: 1,
        letterSpacing: 0,
      },
    ],
  };
}

export function defaultCarouselPersonalSlide(): CarouselPersonalSlideInput {
  return {
    photoUrl: null,
    focalX: 0.5,
    focalY: 0.5,
    overlayOpacity: 0.35,
    phrase: "",
    textColor: "#FFFFFF",
    fontSize: 48,
    handle: "",
  };
}
