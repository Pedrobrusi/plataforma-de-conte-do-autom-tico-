import type { DesignDocument } from "@/lib/design/document";

export const TWITTER_POST_CANVAS = { width: 1170, height: 1560 } as const;

export type TwitterPostInput = {
  name: string;
  handle: string;
  verified: boolean;
  content: string;
  theme: "light" | "dark";
  avatarUrl: string | null;
};

const THEME = {
  light: { background: "#FFFFFF", text: "#0F1419", muted: "#536471" },
  dark: { background: "#08090A", text: "#F5F5F5", muted: "#8B8D91" },
} as const;

function autoFitFontSize(content: string): number {
  const length = content.length;
  if (length <= 80) return 48;
  if (length <= 160) return 40;
  if (length <= 280) return 32;
  return 26;
}

/**
 * Selo de verificação como imagem SVG embutida (data URI), não como caractere
 * "✓" em texto — a fonte padrão do Satori (renderizador de PNG) não tem esse
 * glifo e desenha um quadrado vazio no lugar. Descoberto via inspeção visual
 * real do PNG exportado, não só checagem de dimensão/formato.
 */
function verifiedBadgeDataUri(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="${color}"/><path d="M11 18.5l4.5 4.5L25 13" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const NAME_BOX_WIDTH = 480;
const BADGE_GAP = 16;
const BADGE_SIZE = 36;

export function buildTwitterPostDocument(input: TwitterPostInput): DesignDocument {
  const palette = THEME[input.theme];

  return {
    version: 1,
    templateId: "twitter-classic",
    contentType: "twitter_post",
    canvas: TWITTER_POST_CANVAS,
    background: { type: "color", color: palette.background },
    safeArea: { top: 96, right: 96, bottom: 96, left: 96 },
    elements: [
      {
        id: "avatar",
        type: "image",
        x: 96,
        y: 96,
        width: 96,
        height: 96,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        src: input.avatarUrl,
        fit: "cover",
        borderRadius: 48,
        focalX: 0.5,
        focalY: 0.5,
        required: false,
      },
      {
        id: "name",
        type: "text",
        x: 212,
        y: 100,
        width: NAME_BOX_WIDTH,
        height: 44,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        content: input.name,
        fontFamily: "Inter",
        fontSize: 32,
        fontWeight: 700,
        color: palette.text,
        align: "left",
        verticalAlign: "top",
        lineHeight: 1,
        letterSpacing: 0,
      },
      ...(input.verified
        ? [
            {
              id: "verified-badge",
              type: "image" as const,
              x: 212 + NAME_BOX_WIDTH + BADGE_GAP,
              y: 104,
              width: BADGE_SIZE,
              height: BADGE_SIZE,
              rotation: 0,
              zIndex: 2,
              opacity: 1,
              src: verifiedBadgeDataUri("#1D9BF0"),
              fit: "contain" as const,
              borderRadius: 0,
              focalX: 0.5,
              focalY: 0.5,
              required: false,
            },
          ]
        : []),
      {
        id: "handle",
        type: "text",
        x: 212,
        y: 150,
        width: 862,
        height: 36,
        rotation: 0,
        zIndex: 2,
        opacity: 1,
        content: input.handle ? `@${input.handle.replace(/^@/, "")}` : "",
        fontFamily: "Inter",
        fontSize: 26,
        fontWeight: 400,
        color: palette.muted,
        align: "left",
        verticalAlign: "top",
        lineHeight: 1,
        letterSpacing: 0,
      },
      {
        id: "body",
        type: "text",
        x: 96,
        y: 280,
        width: 978,
        height: 1000,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        content: input.content || "Escreva seu post aqui...",
        fontFamily: "Inter",
        fontSize: autoFitFontSize(input.content),
        fontWeight: 500,
        color: palette.text,
        align: "left",
        verticalAlign: "top",
        lineHeight: 1.35,
        letterSpacing: 0,
      },
    ],
  };
}
