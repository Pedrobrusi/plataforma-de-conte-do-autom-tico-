import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor precisa estar em formato hexadecimal (#RRGGBB)");

export const quoteCardSchema = z.object({
  itemId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Dê um título ao projeto").max(200),
  content: z.string().trim().min(1, "Escreva a frase").max(500),
  align: z.enum(["left", "center", "right"]).default("left"),
  highlightSubstring: z.string().trim().max(100).optional().or(z.literal("")),
  backgroundColor: hexColor.default("#08090A"),
  textColor: hexColor.default("#F5F5F5"),
  highlightColor: hexColor.default("#EC4899"),
  handle: z.string().trim().max(60).optional().or(z.literal("")),
});

export type QuoteCardFormInput = z.infer<typeof quoteCardSchema>;
