"use client";

import { useActionState } from "react";
import { saveNicheProfileAction } from "@/lib/actions/niche-profile";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

type Defaults = Record<string, string>;

const FIELDS: { name: string; label: string; type?: "input" | "textarea" }[] = [
  { name: "niche", label: "Meu nicho", type: "input" },
  { name: "whatIDo", label: "O que eu faço" },
  { name: "targetAudience", label: "Para quem eu faço" },
  { name: "audiencePains", label: "Principais dores do público" },
  { name: "audienceDesires", label: "Principais desejos" },
  { name: "objections", label: "Objeções" },
  { name: "differentiators", label: "Diferenciais" },
  { name: "proofAndAuthority", label: "Provas e autoridade" },
  { name: "productsOrServices", label: "Produtos ou serviços" },
  { name: "toneOfVoice", label: "Tom de comunicação", type: "input" },
  { name: "topicsToCover", label: "Temas que devo abordar" },
  { name: "topicsToAvoid", label: "Temas que devo evitar" },
  { name: "creatorReferences", label: "Referências de criadores" },
  { name: "publishFrequency", label: "Frequência de publicação", type: "input" },
  { name: "mainGoal", label: "Objetivo principal", type: "input" },
  { name: "websiteUrl", label: "URL do site", type: "input" },
];

export function NicheProfileForm({ defaults }: { defaults: Defaults }) {
  const [state, formAction, isPending] = useActionState(saveNicheProfileAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}

      {FIELDS.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === "input" ? (
            <Input id={field.name} name={field.name} defaultValue={defaults[field.name] ?? ""} />
          ) : (
            <Textarea id={field.name} name={field.name} defaultValue={defaults[field.name] ?? ""} rows={3} />
          )}
        </div>
      ))}

      <Button type="submit" loading={isPending} className="self-start">
        Salvar configurações
      </Button>
    </form>
  );
}
