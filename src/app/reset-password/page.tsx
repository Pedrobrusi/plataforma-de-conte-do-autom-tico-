"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type Status = "checking" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const hash = window.location.hash;

    if (hash.includes("error=")) {
      const hashParams = new URLSearchParams(hash.slice(1));
      const message = hashParams.get("error_description") ?? "Link inválido ou expirado.";
      queueMicrotask(() => {
        setError(message);
        setStatus("invalid");
      });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "invalid");
    });
  }, []);

  async function handleSubmit(formData: FormData) {
    const parsed = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus("success");
    setTimeout(() => router.replace("/dashboard"), 1500);
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Definir nova senha</CardTitle>
          <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "checking" && (
            <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Validando link...
            </div>
          )}

          {status === "invalid" && (
            <Alert variant="error" title="Link inválido ou expirado">
              {error ?? "Solicite um novo link de recuperação de senha."}
            </Alert>
          )}

          {status === "success" && (
            <Alert variant="success">Senha atualizada. Redirecionando...</Alert>
          )}

          {status === "ready" && (
            <form
              action={(formData) => handleSubmit(formData)}
              className="flex flex-col gap-4"
              noValidate
            >
              {error && <Alert variant="error">{error}</Alert>}

              <div>
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.password}
                />
                <FieldError>{fieldErrors.password?.[0]}</FieldError>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!fieldErrors.confirmPassword}
                />
                <FieldError>{fieldErrors.confirmPassword?.[0]}</FieldError>
              </div>

              <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
                Atualizar senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
