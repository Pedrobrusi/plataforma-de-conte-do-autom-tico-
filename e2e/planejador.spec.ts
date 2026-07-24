import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test("Planejador: salvar cria versão, persiste, testa geração e restaura versão anterior", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-planejador-${stamp}@hotmail.com`;
  const password = "SenhaForte123";
  const admin = adminClient();

  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Teste Planejador" },
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
    await page.getByLabel("Nome do workspace").fill(`Workspace Planejador ${stamp}`);
    await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/planejador");

    const nicheValue = `emagrecimento feminino ${stamp}`;
    await page.getByLabel("Meu nicho").fill(nicheValue);
    await page.getByLabel("Para quem eu faço").fill("mulheres 30+ iniciantes");
    await page.getByLabel("Tom de comunicação").fill("direto, sem rodeio, motivador");
    await page.getByRole("button", { name: "Salvar configurações" }).click();
    await expect(page.getByText("Perfil de nicho salvo")).toBeVisible({ timeout: 10_000 });

    // Persistência real: recarrega a página e os dados continuam lá.
    await page.reload();
    await expect(page.getByLabel("Meu nicho")).toHaveValue(nicheValue);
    await expect(page.getByText("Versão 1.")).toBeVisible();

    // Testar geração usa o gerador local (sem custo) com o contexto salvo.
    await page.getByRole("button", { name: "Testar geração" }).click();
    await expect(page.getByText("Amostra (gerador local, sem custo externo)")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(nicheValue).first()).toBeVisible();

    // Segunda alteração cria uma nova versão e deixa a v1 no histórico.
    await page.getByLabel("Meu nicho").fill(`outro nicho ${stamp}`);
    await page.getByRole("button", { name: "Salvar configurações" }).click();
    await expect(page.getByText("Perfil de nicho salvo")).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(page.getByText("Versão 2.")).toBeVisible();

    // Restaurar a versão anterior traz o nicho original de volta.
    await page.getByRole("button", { name: "Restaurar" }).first().click();
    await expect(page.getByLabel("Meu nicho")).toHaveValue(nicheValue, { timeout: 10_000 });
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});
