"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function OnboardingForm({ defaultWorkspaceName }: { defaultWorkspaceName: string }) {
  const [state, formAction, isPending] = useActionState(completeOnboardingAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div>
        <Label htmlFor="workspaceName">Nome do workspace</Label>
        <Input
          id="workspaceName"
          name="workspaceName"
          defaultValue={defaultWorkspaceName}
          aria-invalid={!!state.fieldErrors?.workspaceName}
        />
        <FieldError>{state.fieldErrors?.workspaceName?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="niche">Qual é o seu nicho? (opcional)</Label>
        <Input
          id="niche"
          name="niche"
          placeholder="Ex: marketing digital para dentistas"
          aria-invalid={!!state.fieldErrors?.niche}
        />
        <FieldError>{state.fieldErrors?.niche?.[0]}</FieldError>
        <p className="mt-1.5 text-xs text-[color:var(--color-text-muted)]">
          Você pode detalhar todo o contexto estratégico depois, no Planejador.
        </p>
      </div>

      <Button type="submit" size="lg" loading={isPending} className="mt-2">
        Concluir e ir para o Dashboard
      </Button>
    </form>
  );
}
