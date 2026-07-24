import { test, expect } from "@playwright/test";
import path from "node:path";
import { createTestUser, deleteTestUser } from "./helpers/supabase-admin";

test("Carrossel Pessoal: bloqueia export sem foto obrigatória, depois exporta real após upload", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `e2e-personal-${stamp}@hotmail.com`;
  const password = "SenhaForte123";
  const { admin, userId } = await createTestUser(email, password, "Teste Pessoal");

  try {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Nome do workspace").fill(`Workspace Pessoal ${stamp}`);
    await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/carrosseis/pessoal");
    await page.getByPlaceholder("Título do projeto").fill(`Carrossel Pessoal E2E ${stamp}`);
    await page.getByLabel("Frase").fill(`Minha história ${stamp}`);
    await expect(page.getByText("Obrigatória — a exportação fica bloqueada")).toBeVisible();

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Salvo.")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\?id=.+/);

    // Sem foto, a exportação é recusada de verdade (não gera arquivo fictício).
    await page.getByRole("button", { name: "Exportar ZIP" }).click();
    await expect(page.getByText("Envie a imagem obrigatória antes de exportar.")).toBeVisible({
      timeout: 10_000,
    });

    // Envia a foto real e confirma que passa a exportar.
    const fixturePath = path.join(__dirname, "fixtures", "sample-photo.png");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Enviar foto" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(fixturePath);
    await expect(page.getByRole("button", { name: "Trocar foto" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Salvo.")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Exportar ZIP" }).click();
    await expect(page.getByText("ZIP renderizado.")).toBeVisible({ timeout: 20_000 });
    const downloadLink = page.getByRole("link", { name: /Baixar arquivo gerado/ });
    await expect(downloadLink).toBeVisible();

    const url = new URL(page.url());
    const itemId = url.searchParams.get("id")!;
    const { data: item } = await admin.from("content_items").select("data").eq("id", itemId).single();
    const slide = (item!.data as { slides: { elements: { id: string; src?: string }[] }[] }).slides[0];
    const photoEl = slide.elements.find((el) => el.id === "photo");
    expect(photoEl?.src).toContain("supabase.co/storage");
  } finally {
    await deleteTestUser(admin, userId);
  }
});
