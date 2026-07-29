"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ProfileForm({
  defaultFullName,
  defaultBio,
}: {
  defaultFullName: string;
  defaultBio: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && <Alert variant="success">{state.success}</Alert>}

      <div>
        <Label htmlFor="fullName">Nome</Label>
        <Input id="fullName" name="fullName" defaultValue={defaultFullName} aria-invalid={!!state.fieldErrors?.fullName} />
        <FieldError>{state.fieldErrors?.fullName?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={defaultBio} maxLength={280} aria-invalid={!!state.fieldErrors?.bio} />
        <FieldError>{state.fieldErrors?.bio?.[0]}</FieldError>
      </div>

      <Button type="submit" loading={isPending} className="self-start">
        Salvar alterações
      </Button>
    </form>
  );
}
