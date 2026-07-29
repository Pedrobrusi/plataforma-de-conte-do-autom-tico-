"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { testGenerationAction } from "@/lib/actions/niche-profile";

export function ContextPreview({ contextSummary }: { contextSummary: string }) {
  const [sample, setSample] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleTest() {
    setIsPending(true);
    setError(null);
    const result = await testGenerationAction();
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSample(result.sample ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Contexto usado pela IA
        </p>
        <pre className="whitespace-pre-wrap rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] p-3 text-sm text-[color:var(--color-text)]">
          {contextSummary}
        </pre>
      </div>

      <Button type="button" variant="secondary" onClick={handleTest} disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Testar geração
      </Button>

      {error && <Alert variant="error">{error}</Alert>}

      {sample && (
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
            Amostra (gerador local, sem custo externo)
          </p>
          <div className="rounded-[10px] border border-[color:var(--color-accent-purple)]/30 bg-[color:var(--color-accent-purple)]/5 p-3 text-sm">
            {sample}
          </div>
        </div>
      )}
    </div>
  );
}
