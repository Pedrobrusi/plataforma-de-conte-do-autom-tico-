import { z } from "zod";

/**
 * DesignDocument — o único modelo de composição visual do produto.
 * Preview (React, no editor) e exportação (PNG/JPEG/PDF/ZIP no servidor)
 * SEMPRE renderizam a partir deste mesmo documento, através da mesma função
 * `documentToJsx` (ver render-tree.tsx). Não existe um "design de preview"
 * em CSS separado de um "design de export" — é estruturalmente impossível
 * divergirem, porque é a mesma árvore de elementos sendo desenhada nos dois
 * casos.
 */

const baseElementSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  zIndex: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().default(32),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800)]).default(600),
  color: z.string().default("#F5F5F5"),
  align: z.enum(["left", "center", "right"]).default("left"),
  verticalAlign: z.enum(["top", "middle", "bottom"]).default("top"),
  lineHeight: z.number().default(1.25),
  letterSpacing: z.number().default(0),
  highlightColor: z.string().optional(),
  highlightSubstring: z.string().optional(),
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  src: z.string().nullable(),
  fit: z.enum(["cover", "contain"]).default("cover"),
  borderRadius: z.number().default(0),
  focalX: z.number().min(0).max(1).default(0.5),
  focalY: z.number().min(0).max(1).default(0.5),
  /** Quando true e `src` for nulo, a exportação deve ser bloqueada (não gerar placeholder). */
  required: z.boolean().default(false),
});

export const shapeElementSchema = baseElementSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle"]).default("rect"),
  fill: z.string().default("transparent"),
  stroke: z.string().optional(),
  strokeWidth: z.number().default(0),
  borderRadius: z.number().default(0),
});

export const designElementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  shapeElementSchema,
]);

export const backgroundSchema = z.object({
  type: z.enum(["color", "gradient", "image"]).default("color"),
  color: z.string().default("#08090A"),
  gradientFrom: z.string().optional(),
  gradientTo: z.string().optional(),
  gradientAngle: z.number().optional(),
  imageSrc: z.string().nullable().optional(),
});

export const designDocumentSchema = z.object({
  version: z.number().default(1),
  templateId: z.string(),
  contentType: z.string(),
  canvas: z.object({
    width: z.number(),
    height: z.number(),
  }),
  background: backgroundSchema,
  safeArea: z
    .object({ top: z.number(), right: z.number(), bottom: z.number(), left: z.number() })
    .default({ top: 64, right: 64, bottom: 64, left: 64 }),
  elements: z.array(designElementSchema),
});

export type TextElement = z.infer<typeof textElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type ShapeElement = z.infer<typeof shapeElementSchema>;
export type DesignElement = z.infer<typeof designElementSchema>;
export type DesignBackground = z.infer<typeof backgroundSchema>;
export type DesignDocument = z.infer<typeof designDocumentSchema>;

export function isExportBlocked(doc: DesignDocument): { blocked: boolean; reason?: string } {
  const missingRequiredImage = doc.elements.find(
    (el): el is ImageElement => el.type === "image" && el.required && !el.src,
  );
  if (missingRequiredImage) {
    return { blocked: true, reason: "Envie a imagem obrigatória antes de exportar." };
  }
  return { blocked: false };
}
