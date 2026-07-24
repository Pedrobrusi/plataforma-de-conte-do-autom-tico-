import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("Conexões / Instagram (single-owner)", () => {
  test("rota é protegida — visitante não autenticado é redirecionado ao login", async ({ page }) => {
    await page.goto("/configuracoes/instagram-setup");
    await expect(page).toHaveURL(/\/login/);
  });

  test("usuário autenticado vê o wizard real (checklist, redirect URI, botão Conectar)", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-ig-${stamp}@hotmail.com`;
    const password = "SenhaForte123";
    const admin = adminClient();

    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Teste Instagram" },
    });
    if (createError || !createData.user) {
      throw new Error(`Falha ao criar usuário de teste: ${createError?.message}`);
    }
    const userId = createData.user.id;

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
