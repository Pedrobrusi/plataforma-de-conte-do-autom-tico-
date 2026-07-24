"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar sua conta</CardTitle>
        <CardDescription>Comece a criar e agendar conteúdo em minutos.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <Alert variant="success" title="Verifique seu e-mail">
            {state.success}
          </Alert>
        ) : (
          <form action={formAction} className="flex flex-col gap-4" noValidate>
            {state.error && <Alert variant="error">{state.error}</Alert>}

            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                aria-invalid={!!state.fieldErrors?.fullName}
              />
              <FieldError>{state.fieldErrors?.fullName?.[0]}</FieldError>
            </div>

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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!state.fieldErrors?.password}
              />
              <FieldError>{state.fieldErrors?.password?.[0]}</FieldError>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!state.fieldErrors?.confirmPassword}
              />
              <FieldError>{state.fieldErrors?.confirmPassword?.[0]}</FieldError>
            </div>

            <Button type="submit" size="lg" loading={isPending} className="mt-2">
              Criar conta
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[color:var(--color-text-muted)]">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-[color:var(--color-text)] underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
