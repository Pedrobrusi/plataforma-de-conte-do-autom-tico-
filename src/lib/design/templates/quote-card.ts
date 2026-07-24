import type { DesignDocument } from "@/lib/design/document";

export const QUOTE_CARD_CANVAS = { width: 1170, height: 1560 } as const;

export type QuoteCardInput = {
  content: string;
  align: "left" | "center" | "right";
  highlightSubstring?: string;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  handle: string;
};

/** Heurística simples de ajuste automático: texto mais longo usa fonte menor,
 * para reduzir o risco de corte sem depender de medir texto no cliente. */
function autoFitFontSize(content: string): number {
  const length = content.length;
  if (length <= 60) return 64;
  if (length <= 120) return 52;
  if (length <= 220) return 40;
  return 32;
}

export function buildQuoteCardDocument(input: QuoteCardInput): DesignDocument {
  const fontSize = autoFitFontSize(input.content);

  return {
    version: 1,
    templateId: "quote-classic",
    contentType: "quote_card",
    canvas: QUOTE_CARD_CANVAS,
    background: { type: "color", color: input.backgroundColor },
    safeArea: { top: 96, right: 96, bottom: 96, left: 96 },
    elements: [
      {
        id: "headline",
        type: "text",
        x: 96,
        y: 520,
        width: QUOTE_CARD_CANVAS.width - 192,
        height: 520,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        content: input.content || "Sua frase de efeito aqui...",
        fontFamily: "Inter",
        fontSize,
        fontWeight: 700,
        color: input.textColor,
        align: input.align,
        verticalAlign: "top",
        lineHeight: 1.25,
        letterSpacing: 0,
        highlightSubstring: input.highlightSubstring,
        highlightColor: input.highlightColor,
      },
      {
        id: "handle",
        type: "text",
        x: 96,
        y: QUOTE_CARD_CANVAS.height - 160,
        width: QUOTE_CARD_CANVAS.width - 192,
        height: 60,
        rotation: 0,
        zIndex: 2,
        opacity: 0.8,
        content: input.handle ? `@${input.handle.replace(/^@/, "")}` : "",
        fontFamily: "Inter",
        fontSize: 28,
        fontWeight: 500,
        color: input.textColor,
        align: input.align,
        verticalAlign: "top",
        lineHeight: 1,
        letterSpacing: 0,
      },
    ],
  };
}
