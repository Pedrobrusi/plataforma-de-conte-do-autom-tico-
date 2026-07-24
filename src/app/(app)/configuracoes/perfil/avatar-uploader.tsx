"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUploader({
  userId,
  initialAvatarUrl,
  initials,
}: {
  userId: string;
  initialAvatarUrl: string | null;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato inválido. Use PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Arquivo muito grande. Máximo de 2MB.");
      return;
    }

    setIsUploading(true);
    const supabase = createBrowserSupabaseClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq("id", userId);

    setIsUploading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setAvatarUrl(publicUrlData.publicUrl);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-accent-purple)]/20 text-lg font-semibold text-[color:var(--color-accent-purple)]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-sm hover:bg-[color:var(--color-surface-hover)] disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {isUploading ? "Enviando..." : "Alterar foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && (
          <Alert variant="error" className="mt-2">
            {error}
          </Alert>
        )}
      </div>
    </div>
  );
}
