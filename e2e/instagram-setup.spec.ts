import { test, expect } from "@playwright/test";
import { createTestUser } from "./helpers/supabase-admin";

test.describe("Conexões / Instagram (single-owner)", () => {
  test("rota é protegida — visitante não autenticado é redirecionado ao login", async ({ page }) => {
    await page.goto("/configuracoes/instagram-setup");
    await expect(page).toHaveURL(/\/login/);
  });

  test("usuário autenticado vê o wizard real (checklist, redirect URI, botão Conectar)", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-ig-${stamp}@hotmail.com`;
    const password = "SenhaForte123";
    const { admin, userId } = await createTestUser(email, password, "Teste Instagram");

    try {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Senha").fill(password);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/onboarding$/);

      await page.getByLabel("Nome do workspace").fill(`Workspace IG ${stamp}`);
      await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
      await expect(page).toHaveURL(/\/dashboard$/);

      await page.goto("/configuracoes/instagram-setup");
      await expect(page.getByRole("heading", { name: "Configurar Instagram" })).toBeVisible();
      await expect(page.getByText("Checklist")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Redirect URI" })).toBeVisible();

      const connectLink = page.getByRole("link", { name: "Conectar meu Instagram" });
      await expect(connectLink).toBeVisible();
      await expect(connectLink).toHaveAttribute("href", "/api/integrations/instagram/connect");

      // Sem META_APP_ID configurado, o connect deve redirecionar de volta com o
      // status correto em vez de estourar erro 500 ou fingir sucesso.
      await connectLink.click();
      await expect(page).toHaveURL(/status=blocked_official_auth_unavailable/);
      await expect(page.getByText(/META_APP_ID/)).toBeVisible();

      await page.goto("/conexoes");
      await expect(page.getByRole("heading", { name: "Conexões" })).toBeVisible();
      await expect(page.getByText("Instagram", { exact: true })).toBeVisible();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
