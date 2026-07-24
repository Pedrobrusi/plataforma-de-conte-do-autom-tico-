"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { restoreNicheProfileVersionAction } from "@/lib/actions/niche-profile";

type VersionEntry = { id: string; createdAt: string };

export function VersionHistory({ versions }: { versions: VersionEntry[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (versions.length === 0) {
    return (
      <p className="text-sm text-[color:var(--color-text-muted)]">
        Nenhuma versão anterior ainda. Toda vez que você salvar, a versão anterior fica aqui.
      </p>
    );
  }

  async function handleRestore(id: string) {
    setPendingId(id);
    setError(null);
    const result = await restoreNicheProfileVersionAction(id);
    setPendingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert variant="error">{error}</Alert>}
      <ul className="flex flex-col gap-1.5">
        {versions.map((version) => (
          <li
            key={version.id}
            className="flex items-center justify-between rounded-[8px] border border-[color:var(--color-border)] px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2 text-[color:var(--color-text-muted)]">
              <History className="size-3.5" />
              {new Date(version.createdAt).toLocaleString("pt-BR")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRestore(version.id)}
              disabled={pendingId === version.id}
            >
              {pendingId === version.id && <Loader2 className="size-3.5 animate-spin" />}
              Restaurar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
