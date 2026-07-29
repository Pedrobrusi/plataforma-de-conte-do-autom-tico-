import { test, expect } from "@playwright/test";
import sharp from "sharp";
import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { createTestUser, deleteTestUser } from "./helpers/supabase-admin";

test("Carrossel Dark: adiciona slides, reordena, salva, exporta ZIP e PDF reais", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-carousel-${stamp}@hotmail.com`;
  const password = "SenhaForte123";
  const { admin, userId } = await createTestUser(email, password, "Teste Carrossel");

  try {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Nome do workspace").fill(`Workspace Carrossel ${stamp}`);
    await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/carrosseis/dark");

    await page.getByPlaceholder("Título do projeto").fill(`Carrossel E2E ${stamp}`);
    await page.getByLabel("Texto do slide").fill(`Slide um ${stamp}`);

    await page.getByRole("button", { name: "Adicionar slide" }).click();
    await page.getByLabel("Texto do slide").fill(`Slide dois ${stamp}`);

    await page.getByRole("button", { name: "Adicionar slide" }).click();
    await page.getByLabel("Texto do slide").fill(`Slide três ${stamp}`);

    // Reordenar de verdade: move o slide 3 (ativo) uma posição para a
    // esquerda — deve virar o slide 2, e o texto do slide ativo confirma isso.
    await page.getByRole("button", { name: "Mover slide para a esquerda" }).click();
    await expect(page.getByLabel("Texto do slide")).toHaveValue(`Slide três ${stamp}`);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Salvo.")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\?id=.+/, { timeout: 10_000 });

    const url = new URL(page.url());
    const itemId = url.searchParams.get("id")!;
    expect(itemId).toBeTruthy();

    const { data: item } = await admin.from("content_items").select("data").eq("id", itemId).single();
    const slides = (item!.data as { slides: { elements: { content?: string }[] }[] }).slides;
    expect(slides.length).toBe(3);
    const slideTexts = slides.map((s) => s.elements.find((el) => el.content)?.content);
    expect(slideTexts).toEqual([`Slide um ${stamp}`, `Slide três ${stamp}`, `Slide dois ${stamp}`]);

    // Exportar ZIP real: 3 slides = 3 PNGs.
    await page.getByRole("button", { name: "Exportar ZIP" }).click();
    await expect(page.getByText("ZIP renderizado.")).toBeVisible({ timeout: 20_000 });
    const zipLink = page.getByRole("link", { name: /Baixar arquivo gerado/ });
    await expect(zipLink).toBeVisible();
    const zipUrl = await zipLink.getAttribute("href");
    const zipResponse = await page.request.get(zipUrl!);
    expect(zipResponse.ok()).toBe(true);
    const zip = await JSZip.loadAsync(await zipResponse.body());
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(["slide-01.png", "slide-02.png", "slide-03.png"]);
    const firstPng = await zip.files["slide-01.png"].async("nodebuffer");
    const pngMeta = await sharp(firstPng).metadata();
    expect(pngMeta.width).toBe(1170);
    expect(pngMeta.height).toBe(1560);

    // Exportar PDF real: 3 páginas.
    await page.getByRole("button", { name: "Exportar PDF" }).click();
    await expect(page.getByText("PDF renderizado.")).toBeVisible({ timeout: 20_000 });
    const pdfLink = page.getByRole("link", { name: /Baixar arquivo gerado/ });
    const pdfUrl = await pdfLink.getAttribute("href");
    const pdfResponse = await page.request.get(pdfUrl!);
    const pdfBuffer = await pdfResponse.body();
    expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
    const loadedPdf = await PDFDocument.load(pdfBuffer);
    expect(loadedPdf.getPageCount()).toBe(3);
    const firstPage = loadedPdf.getPage(0);
    expect(firstPage.getWidth()).toBe(1170);
    expect(firstPage.getHeight()).toBe(1560);

    const { count: jobCount } = await admin
      .from("render_jobs")
      .select("id", { count: "exact", head: true })
      .eq("content_item_id", itemId)
      .eq("status", "completed");
    expect(jobCount).toBe(2);
  } finally {
    await deleteTestUser(admin, userId);
  }
});
