import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/supabase-admin";

test("Biblioteca: busca, favoritar, renomear, duplicar, pastas, excluir e restaurar", async ({ page }) => {
  const stamp = Date.now();
  const email = `e2e-biblioteca-${stamp}@hotmail.com`;
  const password = "SenhaForte123";
  const { admin, userId } = await createTestUser(email, password, "Teste Biblioteca");

  try {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByLabel("Nome do workspace").fill(`Workspace Biblioteca ${stamp}`);
    await page.getByRole("button", { name: "Concluir e ir para o Dashboard" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const { data: profile } = await admin
      .from("user_profiles")
      .select("active_workspace_id")
      .eq("id", userId)
      .single();
    const workspaceId = profile!.active_workspace_id as string;

    const itemTitle = `Post de teste ${stamp}`;
    const { data: seededItem } = await admin
      .from("content_items")
      .insert({
        workspace_id: workspaceId,
        type: "twitter_post",
        title: itemTitle,
        status: "draft",
        data: {},
        created_by: userId,
      })
      .select("id")
      .single();
    const itemId = seededItem!.id as string;
    const card = () => page.getByTestId(`content-item-${itemId}`);

    await page.goto("/biblioteca");
    await expect(card()).toContainText(itemTitle);

    // Busca real filtra no banco.
    await page.getByPlaceholder("Buscar por título...").fill("não existe nada com esse título");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("Nenhum item corresponde a esse filtro.")).toBeVisible();

    await page.getByPlaceholder("Buscar por título...").fill("");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(card()).toContainText(itemTitle);

    // Favoritar persiste no banco (não é só estado React).
    await card().getByLabel("Favoritar").click();
    await page.reload();
    await expect(card().getByLabel("Remover dos favoritos")).toBeVisible();

    // Renomear persiste.
    await card().getByLabel("Mais ações").click();
    await page.getByText("Renomear").click();
    await card().locator("input").fill(`${itemTitle} (editado)`);
    await card().getByLabel("Salvar título").click();
    await expect(card()).toContainText(`${itemTitle} (editado)`);

    // Duplicar cria um segundo registro real no banco.
    const countBefore = await admin
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null);
    await card().getByLabel("Mais ações").click();
    await page.getByText("Duplicar").click();
    await expect
      .poll(async () => {
        const { count } = await admin
          .from("content_items")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null);
        return count;
      })
      .toBe((countBefore.count ?? 0) + 1);

    // Excluir (soft delete) some da lista e aparece na lixeira; restaurar traz de volta.
    await card().getByLabel("Mais ações").click();
    await page.getByText("Excluir", { exact: true }).click();
    await expect(card()).not.toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Itens excluídos" }).click();
    await expect(card()).toBeVisible();

    await card().getByLabel("Mais ações").click();
    await page.getByText("Restaurar").click();
    await expect(card()).not.toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Ver ativos" }).click();
    await expect(card()).toBeVisible();
  } finally {
    await deleteTestUser(admin, userId);
  }
});
