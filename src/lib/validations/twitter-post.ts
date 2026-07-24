import { z } from "zod";

export const twitterPostSchema = z.object({
  itemId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "Dê um título ao projeto").max(200),
  name: z.string().trim().min(1, "Informe o nome").max(80),
  handle: z.string().trim().max(60).optional().or(z.literal("")),
  verified: z.union([z.literal("true"), z.literal("false")]).default("false"),
  content: z.string().trim().min(1, "Escreva o texto do post").max(400),
  theme: z.enum(["light", "dark"]).default("dark"),
  avatarUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type TwitterPostFormInput = z.infer<typeof twitterPostSchema>;
