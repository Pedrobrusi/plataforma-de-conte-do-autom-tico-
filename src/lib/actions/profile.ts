"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/auth";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome").max(120),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
});

export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ full_name: parsed.data.fullName, bio: parsed.data.bio || null })
    .eq("id", userData.user.id);

  if (error) return { error: error.message };

  revalidatePath("/configuracoes/perfil");
  return { success: "Perfil atualizado." };
}
