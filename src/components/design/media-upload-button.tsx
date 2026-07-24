"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Upload genérico para o bucket `media`, reaproveitado por qualquer editor
 * de design que precise de uma imagem enviada pelo usuário. */
export function MediaUploadButton({
  workspaceId,
  pathPrefix,
  label = "Enviar imagem",
  onUploaded,
}: {
  workspaceId: string;
  pathPrefix: string;
  label?: string;
  onUploaded: (publicUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato inválido. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Arquivo muito grande. Máximo de 8MB.");
      return;
    }

    setIsUploading(true);
    const supabase = createBrowserSupabaseClient();
    const ext = file.name.split(".").pop();
    const path = `${workspaceId}/${pathPrefix}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setIsUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    onUploaded(data.publicUrl);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm hover:bg-[color:var(--color-surface-hover)] disabled:opacity-50"
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {isUploading ? "Enviando..." : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {error && (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}
