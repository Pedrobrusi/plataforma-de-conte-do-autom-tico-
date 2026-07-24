import { test, expect } from "@playwright/test";
import { createTestUser } from "./helpers/supabase-admin";

test.describe("Autenticação", () => {
  test("cadastro exibe erro de validação real quando as senhas não coincidem", async ({ page }) => {
    // Não dispara nenhuma chamada ao Supabase: o Zod valida no servidor antes
    // de chegar em auth.signUp, então este teste não consome a cota de e-mail
    // (rate limit do tier gratuito do Supabase).
    await page.goto("/signup");
    await page.getByLabel("Nome completo").fill("Usuária de Teste");
    await page.getByLabel("E-mail").fill(`e2e-validation-${Date.now()}@hotmail.com`);
    await page.getByLabel("Senha", { exact: true }).fill("SenhaForte123");
    await page.getByLabel("Confirmar senha").fill("SenhaDiferente456");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page.getByText("As senhas não coincidem")).toBeVisible({ timeout: 10_000 });
  });

  test("login (usuário pré-confirmado) → onboarding → dashboard", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-login-${stamp}@hotmail.com`;
    const password = "SenhaForte123";
    const workspaceName = `Workspace E2E ${stamp}`;
    const { admin, userId } = await createTestUser(email, password, "Usuária de Teste");

    try {
      await page.goto("/login");
      await page.getByLabel("E-mail").fill(email);
      await page.getByLabel("Senha").fill(password);
      await page.getByRole("button", { name: "Entrar" }).click();

      await expect(page).toHaveURL(/\/onboarding$/, { timeout: 10_000 });

      await page.getByLabel("Nome do workspace").fill(workspaceName);
      await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();

      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
      await expect(page.getByText(workspaceName)).toBeVisible();
      await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();

      // Confirma que o onboarding realmente persistiu no banco (não é só estado local).
      const { data: profile } = await admin
        .from("user_profiles")
        .select("onboarding_completed_at")
        .eq("id", userId)
        .single();
      expect(profile?.onboarding_completed_at).toBeTruthy();
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
