"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function CallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const next = searchParams.get("next") ?? "/dashboard";

    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const hashParams = new URLSearchParams(hash.slice(1));
      const message = hashParams.get("error_description") ?? "Não foi possível confirmar o link.";
      queueMicrotask(() => setError(message));
      return;
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        setError(sessionError?.message ?? "Link inválido ou expirado. Solicite um novo.");
        return;
      }
      router.replace(next);
    });
  }, [router, searchParams]);

  if (error) {
    return (
      <>
        <Alert variant="error">{error}</Alert>
        <p className="mt-4 text-center text-sm text-[color:var(--color-text-muted)]">
          <Link href="/login" className="text-[color:var(--color-text)] underline underline-offset-2">
            Voltar para o login
          </Link>
        </p>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Confirmando...
    </div>
  );
}
