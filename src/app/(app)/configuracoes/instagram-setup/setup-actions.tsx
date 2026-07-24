"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  testInstagramConnectionAction,
  publishTestPostAction,
  disconnectInstagramAction,
} from "@/lib/actions/instagram";

type Feedback = { type: "success" | "error"; message: string; permalink?: string } | null;

export function InstagramSetupActions({ isConnected }: { isConnected: boolean }) {
  const [pending, setPending] = useState<"test" | "publish" | "disconnect" | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function run(kind: "test" | "publish" | "disconnect") {
    setPending(kind);
    setFeedback(null);
    const action =
      kind === "test"
        ? testInstagramConnectionAction
        : kind === "publish"
          ? publishTestPostAction
          : disconnectInstagramAction;
    const result = await action();
    setPending(null);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else if (result.success) {
      setFeedback({
        type: "success",
        message: result.success,
        permalink: (result as { permalink?: string }).permalink,
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {!isConnected && (
          <a href="/api/integrations/instagram/connect">
            <Button type="button">Conectar meu Instagram</Button>
          </a>
        )}
        {isConnected && (
          <>
            <Button
              type="button"
              variant="secondary"
              loading={pending === "test"}
              onClick={() => run("test")}
            >
              Verificar conexão
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={pending === "publish"}
              onClick={() => run("publish")}
            >
              Publicar teste
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={pending === "disconnect"}
              onClick={() => run("disconnect")}
            >
              Desconectar
            </Button>
          </>
        )}
      </div>

      {feedback && (
        <Alert variant={feedback.type === "success" ? "success" : "error"}>
          {feedback.message}
          {feedback.permalink && (
            <>
              {" "}
              <a
                href={feedback.permalink}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Ver publicação
              </a>
            </>
          )}
        </Alert>
      )}
    </div>
  );
}
