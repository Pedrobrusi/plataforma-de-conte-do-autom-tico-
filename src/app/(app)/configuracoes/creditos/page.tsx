import { redirect } from "next/navigation";
import { Coins, Inbox } from "lucide-react";
import { getWorkspaceContext } from "@/lib/workspace";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const TYPE_LABEL: Record<string, string> = {
  credit: "Crédito",
  debit: "Débito",
  refund: "Reembolso",
};

export default async function CreditosPage() {
  const context = await getWorkspaceContext();
  if (!context) redirect("/login");
  if (!context.workspace) redirect("/onboarding");

  const supabase = await createServerSupabaseClient();
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("id, amount, type, reason, created_at")
    .eq("workspace_id", context.workspace.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Créditos</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Créditos são consumidos por gerações de IA e jobs de renderização.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="flex size-12 items-center justify-center rounded-[10px] bg-[color:var(--color-accent-orange)]/10 text-[color:var(--color-accent-orange)]">
            <Coins className="size-6" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{context.creditBalance}</p>
            <p className="text-xs text-[color:var(--color-text-muted)]">créditos disponíveis</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Últimas 50 movimentações do workspace.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {!transactions || transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-6 text-[color:var(--color-text-muted)]" />
              <p className="text-sm text-[color:var(--color-text-muted)]">Nenhuma movimentação ainda.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between rounded-[8px] border border-[color:var(--color-border)] px-3 py-2 text-sm"
                >
                  <div>
                    <p>{tx.reason}</p>
                    <p className="text-xs text-[color:var(--color-text-muted)]">
                      {TYPE_LABEL[tx.type] ?? tx.type} ·{" "}
                      {new Date(tx.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={
                      tx.amount >= 0
                        ? "font-medium text-[color:var(--color-success)]"
                        : "font-medium text-[color:var(--color-danger)]"
                    }
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
