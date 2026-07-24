"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, MoreVertical, Pencil, Copy, Archive, Trash2, RotateCcw, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import {
  toggleFavoriteAction,
  renameContentItemAction,
  duplicateContentItemAction,
  archiveContentItemAction,
  softDeleteContentItemAction,
  restoreContentItemAction,
  moveToFolderAction,
  toggleTagOnItemAction,
} from "@/lib/actions/library";

export type ContentItemView = {
  id: string;
  title: string;
  type: string;
  status: string;
  isFavorite: boolean;
  folderId: string | null;
  isDeleted: boolean;
  tagIds: string[];
  createdAt: string;
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-[color:var(--color-text-muted)]/15 text-[color:var(--color-text-muted)]",
  ready: "bg-[color:var(--color-accent-purple)]/15 text-[color:var(--color-accent-purple)]",
  scheduled: "bg-[color:var(--color-accent-orange)]/15 text-[color:var(--color-accent-orange)]",
  published: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  failed: "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]",
  archived: "bg-[color:var(--color-text-muted)]/15 text-[color:var(--color-text-muted)]",
};

export function ContentItemCard({
  item,
  folders,
  tags,
  view,
}: {
  item: ContentItemView;
  folders: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  view: "grid" | "list";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(item.title);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleRename() {
    const formData = new FormData();
    formData.set("title", title);
    await renameContentItemAction(item.id, formData);
    setIsRenaming(false);
    refresh();
  }

  return (
    <Card
      data-testid={`content-item-${item.id}`}
      className={view === "list" ? "flex items-center gap-3 px-4 py-3" : ""}
    >
      <CardContent className={view === "list" ? "flex flex-1 items-center gap-3 p-0" : "flex flex-col gap-3 p-4"}>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={async () => {
              await toggleFavoriteAction(item.id);
              refresh();
            }}
            aria-label={item.isFavorite ? "Remover dos favoritos" : "Favoritar"}
            className="shrink-0"
            disabled={isPending}
          >
            <Star
              className={`size-4 ${item.isFavorite ? "fill-[color:var(--color-accent-orange)] text-[color:var(--color-accent-orange)]" : "text-[color:var(--color-text-muted)]"}`}
            />
          </button>

          {isRenaming ? (
            <div className="flex flex-1 items-center gap-1">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8" autoFocus />
              <button type="button" onClick={handleRename} aria-label="Salvar título">
                <Check className="size-4 text-[color:var(--color-success)]" />
              </button>
              <button type="button" onClick={() => { setIsRenaming(false); setTitle(item.title); }} aria-label="Cancelar">
                <X className="size-4 text-[color:var(--color-text-muted)]" />
              </button>
            </div>
          ) : (
            <p className="flex-1 truncate text-sm font-medium">{item.title}</p>
          )}

          <Dropdown
            trigger={({ toggle }) => (
              <button type="button" onClick={toggle} aria-label="Mais ações">
                <MoreVertical className="size-4 text-[color:var(--color-text-muted)]" />
              </button>
            )}
          >
            {!item.isDeleted && (
              <>
                <DropdownItem onClick={() => setIsRenaming(true)}>
                  <Pencil className="size-4" /> Renomear
                </DropdownItem>
                <DropdownItem
                  onClick={async () => {
                    await duplicateContentItemAction(item.id);
                    refresh();
                  }}
                >
                  <Copy className="size-4" /> Duplicar
                </DropdownItem>
                <DropdownItem
                  onClick={async () => {
                    await archiveContentItemAction(item.id);
                    refresh();
                  }}
                >
                  <Archive className="size-4" /> Arquivar
                </DropdownItem>
                <DropdownItem
                  className="text-[color:var(--color-danger)]"
                  onClick={async () => {
                    await softDeleteContentItemAction(item.id);
                    refresh();
                  }}
                >
                  <Trash2 className="size-4" /> Excluir
                </DropdownItem>
              </>
            )}
            {item.isDeleted && (
              <DropdownItem
                onClick={async () => {
                  await restoreContentItemAction(item.id);
                  refresh();
                }}
              >
                <RotateCcw className="size-4" /> Restaurar
              </DropdownItem>
            )}
          </Dropdown>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="rounded-full bg-[color:var(--color-surface-hover)] px-2 py-0.5 text-[color:var(--color-text-muted)]">
            {item.type}
          </span>
          <span className={`rounded-full px-2 py-0.5 ${STATUS_CLASS[item.status] ?? STATUS_CLASS.draft}`}>
            {item.status}
          </span>
        </div>

        {!item.isDeleted && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={item.folderId ?? ""}
              onChange={async (e) => {
                await moveToFolderAction(item.id, e.target.value || null);
                refresh();
              }}
              className="h-8 rounded-[8px] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2 text-xs"
            >
              <option value="">Sem pasta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            <Dropdown
              trigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="rounded-full border border-dashed border-[color:var(--color-border)] px-2 py-0.5 text-xs text-[color:var(--color-text-muted)]"
                >
                  + tag
                </button>
              )}
            >
              {tags.length === 0 && <p className="px-3 py-2 text-xs text-[color:var(--color-text-muted)]">Crie uma tag na barra de ferramentas.</p>}
              {tags.map((tag) => (
                <DropdownItem
                  key={tag.id}
                  onClick={async () => {
                    await toggleTagOnItemAction(item.id, tag.id, !item.tagIds.includes(tag.id));
                    refresh();
                  }}
                >
                  {item.tagIds.includes(tag.id) ? <Check className="size-3.5" /> : <span className="size-3.5" />}
                  {tag.name}
                </DropdownItem>
              ))}
            </Dropdown>

            {tags
              .filter((tag) => item.tagIds.includes(tag.id))
              .map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-[color:var(--color-accent-purple)]/10 px-2 py-0.5 text-xs text-[color:var(--color-accent-purple)]"
                >
                  {tag.name}
                </span>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
