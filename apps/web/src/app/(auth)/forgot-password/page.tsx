"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>Enviaremos um link para redefinir sua senha.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <Alert variant="success">{state.success}</Alert>
        ) : (
          <form action={formAction} className="flex flex-col gap-4" noValidate>
            {state.error && <Alert variant="error">{state.error}</Alert>}

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

            <Button type="submit" size="lg" loading={isPending} className="mt-2">
              Enviar link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[color:var(--color-text-muted)]">
          <Link href="/login" className="text-[color:var(--color-text)] underline underline-offset-2">
            Voltar para o login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
