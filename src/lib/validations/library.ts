import { z } from "zod";

export const folderNameSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à pasta").max(80),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à tag").max(40),
  color: z.string().trim().max(20).optional(),
});

export const renameContentItemSchema = z.object({
  title: z.string().trim().min(1, "O título não pode ficar vazio").max(200),
});
