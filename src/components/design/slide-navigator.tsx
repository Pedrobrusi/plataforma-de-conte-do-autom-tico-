"use client";

import { Plus, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SlideNavigator({
  count,
  activeIndex,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
  onSelect,
}: {
  count: number;
  activeIndex: number;
  onAdd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          <Plus className="size-4" /> Adicionar slide
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDuplicate}>
          <Copy className="size-4" /> Duplicar
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={count <= 1}>
          <Trash2 className="size-4" /> Excluir
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Mover slide para a esquerda"
          onClick={() => onMove(-1)}
          disabled={activeIndex === 0}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Mover slide para a direita"
          onClick={() => onMove(1)}
          disabled={activeIndex === count - 1}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex size-14 shrink-0 items-center justify-center rounded-[8px] border text-xs ${
              i === activeIndex
                ? "border-[color:var(--color-accent-purple)] text-[color:var(--color-accent-purple)]"
                : "border-[color:var(--color-border)] text-[color:var(--color-text-muted)]"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
