"use client";

import { useState } from "react";

/**
 * Estado compartilhado de uma lista de slides editável (adicionar, duplicar,
 * excluir, mover, navegar). Usado por todos os editores de carrossel —
 * extraído depois do Carrossel Dark provar o padrão, não antes.
 */
export function useSlideList<T>(initial: T[], createBlank: () => T) {
  const [slides, setSlides] = useState<T[]>(initial.length ? initial : [createBlank()]);
  const [activeIndex, setActiveIndex] = useState(0);

  function updateActive(patch: Partial<T>) {
    setSlides((prev) => prev.map((slide, i) => (i === activeIndex ? { ...slide, ...patch } : slide)));
  }

  function add() {
    setSlides((prev) => [...prev, createBlank()]);
    setActiveIndex(slides.length);
  }

  function duplicate() {
    setSlides((prev) => {
      const copy = [...prev];
      copy.splice(activeIndex + 1, 0, { ...prev[activeIndex] });
      return copy;
    });
    setActiveIndex(activeIndex + 1);
  }

  function remove() {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== activeIndex));
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }

  function move(direction: -1 | 1) {
    const targetIndex = activeIndex + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    setSlides((prev) => {
      const copy = [...prev];
      [copy[activeIndex], copy[targetIndex]] = [copy[targetIndex], copy[activeIndex]];
      return copy;
    });
    setActiveIndex(targetIndex);
  }

  return {
    slides,
    activeIndex,
    setActiveIndex,
    active: slides[activeIndex],
    updateActive,
    add,
    duplicate,
    remove,
    move,
  };
}
