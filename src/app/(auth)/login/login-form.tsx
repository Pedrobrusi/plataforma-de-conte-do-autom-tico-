"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {});
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error && <Alert variant="error">{state.error}</Alert>}
        <input type="hidden" name="next" value={next} />

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!state.fieldErrors?.email}
          />
          <FieldError>{state.fieldErrors?.email?.[0]}</FieldError>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-xs text-[color:var(--color-text-muted)] underline underline-offset-2"
            >
              Esqueci a senha
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!state.fieldErrors?.password}
          />
          <FieldError>{state.fieldErrors?.password?.[0]}</FieldError>
        </div>

        <Button type="submit" size="lg" loading={isPending} className="mt-2">
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[color:var(--color-text-muted)]">
        Não tem uma conta?{" "}
        <Link href="/signup" className="text-[color:var(--color-text)] underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </>
  );
}
