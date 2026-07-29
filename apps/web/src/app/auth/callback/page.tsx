import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CallbackView } from "./callback-view";

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirmando seu acesso</CardTitle>
          <CardDescription>Só um instante enquanto validamos o link.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <CallbackView />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
