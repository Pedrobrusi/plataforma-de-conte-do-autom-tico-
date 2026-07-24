import { test, expect } from "@playwright/test";
import sharp from "sharp";
import { createTestUser } from "./helpers/supabase-admin";

test("Post Twitter: salva, renderiza PNG real com avatar/selo, reabre e edita", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-twitter-${stamp}@hotmail.com`;
  const password = "SenhaForte123";
  const { admin, userId } = await createTestUser(email, password, "Teste Twitter");

  try {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Nome do workspace").fill(`Workspace Twitter ${stamp}`);
    await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/posts/twitter");

    const postContent = `Testando o post ${stamp} de verdade`;
    await page.getByLabel("Título do projeto").fill(`Post E2E ${stamp}`);
    await page.getByLabel("Nome").fill("Averro Test");
    await page.getByLabel("@usuário").fill("averrotest");
    await page.getByLabel("Selo de verificação").check();
    await page.getByLabel("Texto do post").fill(postContent);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page).toHaveURL(/\/posts\/twitter\?id=.+saved=1/, { timeout: 10_000 });
    await expect(page.getByText("Salvo.")).toBeVisible();

    const url = new URL(page.url());
    const itemId = url.searchParams.get("id")!;

    await page.getByRole("button", { name: "Renderizar PNG" }).click();
    const downloadLink = page.getByRole("link", { name: /Baixar PNG/ });
    await expect(downloadLink).toBeVisible({ timeout: 20_000 });
    const downloadUrl = await downloadLink.getAttribute("href");

    const imageResponse = await page.request.get(downloadUrl!);
    expect(imageResponse.ok()).toBe(true);
    const metadata = await sharp(await imageResponse.body()).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(1170);
    expect(metadata.height).toBe(1560);

    const { data: item } = await admin.from("content_items").select("data").eq("id", itemId).single();
    const doc = item!.data as { elements: { id: string; content?: string }[] };
    expect(doc.elements.some((el) => el.id === "verified-badge")).toBe(true);

    // Reabrir carrega os dados de volta, incluindo o selo marcado.
    await page.goto(`/posts/twitter?id=${itemId}`);
    await expect(page.getByLabel("Texto do post")).toHaveValue(postContent);
    await expect(page.getByLabel("Selo de verificação")).toBeChecked();
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
