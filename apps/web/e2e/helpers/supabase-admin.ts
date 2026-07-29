import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * A API de Admin do Supabase falha esporadicamente sob chamadas rápidas em
 * sequência com "invalid JWT: unrecognized JWT kid" — um problema transitório
 * de infraestrutura do lado do Supabase (confirmado: sempre passa isolado ou
 * ao repetir). Retry com backoff evita que a suíte fique flaky por causa
 * disso, sem mascarar um erro real (esgota as tentativas e falha normalmente
 * se o problema persistir).
 */
export async function createTestUser(email: string, password: string, fullName: string) {
  const admin = adminClient();
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= 4; attempt++) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (!error && data.user) {
      return { admin, userId: data.user.id };
    }
    lastError = error?.message;
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  throw new Error(`Falha ao criar usuário de teste após retries: ${lastError}`);
}

/**
 * `workspaces.owner_id` usa ON DELETE RESTRICT (de propósito — apagar o dono
 * não deve levar o workspace/conteúdo junto sem intenção explícita). Isso
 * significa que apagar o auth.user de um teste sem apagar o workspace dele
 * primeiro falha com 500 (foreign key violation) — e o SDK do Supabase
 * engole esse erro como `{}` em vez de propagá-lo, deixando usuários e
 * workspaces órfãos no banco a cada teste. Sempre limpar nesta ordem.
 */
export async function deleteTestUser(admin: ReturnType<typeof adminClient>, userId: string) {
  await admin.from("workspaces").delete().eq("owner_id", userId);

  let lastError: string | undefined;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error) return;
    lastError = error.message;
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  throw new Error(`Falha ao apagar usuário de teste ${userId} após retries: ${lastError}`);
}
