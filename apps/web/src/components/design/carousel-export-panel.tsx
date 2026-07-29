"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { DesignCanvasPreview } from "@/components/design/design-canvas-preview";
import { renderCarouselExportAction } from "@/lib/actions/carousel";
import type { DesignDocument } from "@/lib/design/document";

export function CarouselExportPanel({
  itemId,
  document,
  slideLabel,
}: {
  itemId: string;
  document: DesignDocument;
  slideLabel: string;
}) {
  const [isExporting, setIsExporting] = useState<"zip" | "pdf" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleExport(format: "zip" | "pdf") {
    if (!itemId) {
      setFeedback({ type: "error", message: "Salve o projeto antes de exportar." });
      return;
    }
    setIsExporting(format);
    setDownloadUrl(null);
    const result = await renderCarouselExportAction(itemId, format);
    setIsExporting(null);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
      return;
    }
    setFeedback({ type: "success", message: result.success ?? "Exportado." });
    setDownloadUrl(result.downloadUrl ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
          {slideLabel} (1170 × 1560)
        </p>
        <DesignCanvasPreview document={document} displayWidth={320} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => handleExport("zip")} disabled={isExporting !== null}>
          {isExporting === "zip" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Exportar ZIP
        </Button>
        <Button type="button" variant="secondary" onClick={() => handleExport("pdf")} disabled={isExporting !== null}>
          {isExporting === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          Exportar PDF
        </Button>
      </div>
      {!itemId && <p className="text-xs text-[color:var(--color-text-muted)]">Salve o projeto antes de exportar.</p>}

      {feedback && <Alert variant={feedback.type}>{feedback.message}</Alert>}
      {downloadUrl && (
        <a href={downloadUrl} download target="_blank" rel="noreferrer">
          <Button type="button" variant="secondary" className="w-full">
            <Download className="size-4" />
            Baixar arquivo gerado
          </Button>
        </a>
      )}
    </div>
  );
}
