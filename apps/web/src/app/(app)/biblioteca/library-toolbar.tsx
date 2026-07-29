"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Search, LayoutGrid, List, FolderPlus, Tag, Trash2 } from "lucide-react";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Alert } from "@/components/ui/alert";
import { createFolderAction, createTagAction } from "@/lib/actions/library";

type Option = { id: string; name: string };

export function LibraryToolbar({
  folders,
  tags,
  contentTypes,
}: {
  folders: Option[];
  tags: Option[];
  contentTypes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = searchParams.get("view") ?? "grid";
  const showTrash = searchParams.get("trash") === "1";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          updateParam("q", (form.get("q") as string) || null);
        }}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
          <Input name="q" defaultValue={searchParams.get("q") ?? ""} placeholder="Buscar por título..." className="pl-9" />
        </div>

        <select
          value={searchParams.get("type") ?? ""}
          onChange={(e) => updateParam("type", e.target.value || null)}
          className="h-10 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
        >
          <option value="">Todos os tipos</option>
          {contentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => updateParam("status", e.target.value || null)}
          className="h-10 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
        >
          <option value="">Todos os status</option>
          {["draft", "ready", "scheduled", "published", "failed", "archived"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("folder") ?? ""}
          onChange={(e) => updateParam("folder", e.target.value || null)}
          className="h-10 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
        >
          <option value="">Todas as pastas</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get("tag") ?? ""}
          onChange={(e) => updateParam("tag", e.target.value || null)}
          className="h-10 rounded-[10px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
        >
          <option value="">Todas as tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => updateParam("favorite", searchParams.get("favorite") === "1" ? null : "1")}
          className={`rounded-[10px] border px-3 py-2 text-sm ${
            searchParams.get("favorite") === "1"
              ? "border-[color:var(--color-accent-purple)] text-[color:var(--color-accent-purple)]"
              : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)]"
          }`}
        >
          ★ Favoritos
        </button>

        <Button type="submit" size="sm" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NewFolderDropdown />
          <NewTagDropdown />
          <button
            type="button"
            onClick={() => updateParam("trash", showTrash ? null : "1")}
            className={`flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-sm ${
              showTrash
                ? "border-[color:var(--color-danger)] text-[color:var(--color-danger)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)]"
            }`}
          >
            <Trash2 className="size-4" />
            {showTrash ? "Ver ativos" : "Itens excluídos"}
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-[10px] border border-[color:var(--color-border)] p-1">
          <button
            type="button"
            onClick={() => updateParam("view", "grid")}
            className={`rounded-[8px] p-1.5 ${view === "grid" ? "bg-[color:var(--color-surface)]" : ""}`}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => updateParam("view", "list")}
            className={`rounded-[8px] p-1.5 ${view === "list" ? "bg-[color:var(--color-surface)]" : ""}`}
            aria-label="Visualização em lista"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NewFolderDropdown() {
  const [state, formAction, isPending] = useActionState(createFolderAction, {});
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      align="start"
      trigger={({ toggle }) => (
        <Button type="button" variant="secondary" size="sm" onClick={() => { toggle(); setOpen((v) => !v); }}>
          <FolderPlus className="size-4" />
          Nova pasta
        </Button>
      )}
    >
      <form action={formAction} className="flex flex-col gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <Label htmlFor="folder-name">Nome da pasta</Label>
        <Input id="folder-name" name="name" autoFocus={open} />
        <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
        {state.error && <Alert variant="error">{state.error}</Alert>}
        <Button type="submit" size="sm" loading={isPending}>
          Criar
        </Button>
      </form>
    </Dropdown>
  );
}

function NewTagDropdown() {
  const [state, formAction, isPending] = useActionState(createTagAction, {});

  return (
    <Dropdown
      align="start"
      trigger={({ toggle }) => (
        <Button type="button" variant="secondary" size="sm" onClick={toggle}>
          <Tag className="size-4" />
          Nova tag
        </Button>
      )}
    >
      <form action={formAction} className="flex flex-col gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <Label htmlFor="tag-name">Nome da tag</Label>
        <Input id="tag-name" name="name" />
        <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
        {state.error && <Alert variant="error">{state.error}</Alert>}
        <Button type="submit" size="sm" loading={isPending}>
          Criar
        </Button>
      </form>
    </Dropdown>
  );
}
