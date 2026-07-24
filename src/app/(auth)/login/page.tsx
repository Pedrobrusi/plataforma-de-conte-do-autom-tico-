import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse seu workspace de conteúdo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
