"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Alert variant="error" title="Algo deu errado nesta página" className="max-w-md text-left">
        {error.message || "Um erro inesperado aconteceu. Tente novamente."}
      </Alert>
      <Button onClick={reset} variant="secondary">
        Tentar novamente
      </Button>
    </div>
  );
}
