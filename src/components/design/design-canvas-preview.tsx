"use client";

import { documentToJsx } from "@/lib/design/render-tree";
import type { DesignDocument } from "@/lib/design/document";

/**
 * Preview do editor. Usa a mesma `documentToJsx` do renderizador PNG do
 * servidor — o que aparece aqui é estruturalmente o mesmo documento que sai
 * no arquivo exportado, só desenhado em escala menor via `transform: scale`.
 */
export function DesignCanvasPreview({
  document,
  displayWidth,
}: {
  document: DesignDocument;
  displayWidth: number;
}) {
  const scale = displayWidth / document.canvas.width;
  const displayHeight = document.canvas.height * scale;

  return (
    <div
      style={{ width: displayWidth, height: displayHeight, position: "relative", overflow: "hidden" }}
      className="rounded-[10px] border border-[color:var(--color-border)]"
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {documentToJsx(document)}
      </div>
    </div>
  );
}
