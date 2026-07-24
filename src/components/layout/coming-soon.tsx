import Link from "next/link";
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-[color:var(--color-text-muted)]">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Construction className="size-8 text-[color:var(--color-accent-orange)]" />
          <p className="font-medium">Esta funcionalidade ainda não foi implementada</p>
          <p className="max-w-md text-sm text-[color:var(--color-text-muted)]">
            A rota já existe e está protegida por autenticação, mas a lógica real de{" "}
            {title.toLowerCase()} chega na Fase {phase} do roadmap. Veja o progresso em{" "}
            <code className="rounded bg-[color:var(--color-input)] px-1 py-0.5 text-xs">
              IMPLEMENTATION_STATUS.md
            </code>
            .
          </p>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[color:var(--color-accent-purple)] underline underline-offset-2"
          >
            Voltar ao Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
