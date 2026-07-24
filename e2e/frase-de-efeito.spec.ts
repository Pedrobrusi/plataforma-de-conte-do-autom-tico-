import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { createTestUser } from "./helpers/supabase-admin";

test("Frase de Efeito: cria, salva, renderiza PNG real, reabre e edita (nova versão)", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-frase-${stamp}@hotmail.com`;
  const password = "SenhaForte123";
  const { admin, userId } = await createTestUser(email, password, "Teste Frase");

  try {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Nome do workspace").fill(`Workspace Frase ${stamp}`);
    await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/posts/frase-de-efeito");

    const phraseContent = `O sucesso de ${stamp} é constância`;
    await page.getByLabel("Título do projeto").fill(`Frase E2E ${stamp}`);
    await page.getByLabel("Frase").fill(phraseContent);
    await page.getByLabel("Palavra em destaque (opcional)").fill("sucesso");
    await page.getByLabel("@usuário (rodapé)").fill("averro");

    // Preview em tempo real reflete o mesmo documento sem precisar salvar.
    await expect(page.getByText("sucesso", { exact: false }).first()).toBeVisible();

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/posts\/frase-de-efeito\?id=.+saved=1/, { timeout: 10_000 });
    await expect(page.getByText("Salvo.")).toBeVisible();

    const url = new URL(page.url());
    const itemId = url.searchParams.get("id")!;
    expect(itemId).toBeTruthy();

    // Renderização real: gera PNG, sobe pro storage, cria render_job.
    await page.getByRole("button", { name: "Renderizar PNG" }).click();
    const downloadLink = page.getByRole("link", { name: /Baixar PNG/ });
    await expect(downloadLink).toBeVisible({ timeout: 20_000 });
    const downloadUrl = await downloadLink.getAttribute("href");
    expect(downloadUrl).toBeTruthy();

    const imageResponse = await page.request.get(downloadUrl!);
    expect(imageResponse.ok()).toBe(true);
    const imageBuffer = await imageResponse.body();
    const metadata = await sharp(imageBuffer).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(1170);
    expect(metadata.height).toBe(1560);

    const { data: job } = await admin
      .from("render_jobs")
      .select("status, render_kind, result")
      .eq("content_item_id", itemId)
      .single();
    expect(job?.status).toBe("completed");
    expect(job?.render_kind).toBe("design_png");
    expect((job?.result as Record<string, string>)?.png).toBeTruthy();

    // Reabrir carrega os dados salvos de volta no editor.
    await page.goto(`/posts/frase-de-efeito?id=${itemId}`);
    await expect(page.getByLabel("Frase")).toHaveValue(phraseContent);

    // Editar e salvar de novo cria uma nova versão (histórico real).
    await page.getByLabel("Frase").fill(`${phraseContent} — editado`);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Salvo.")).toBeVisible({ timeout: 10_000 });

    const { count: versionCount } = await admin
      .from("content_versions")
      .select("id", { count: "exact", head: true })
      .eq("content_item_id", itemId);
    expect(versionCount).toBe(1);
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
