import { ImageResponse } from "next/og";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { documentToJsx } from "./render-tree";
import type { DesignDocument } from "./document";
import type { ReactElement } from "react";

/**
 * Renderizadores reais server-side. Todos partem do mesmo `documentToJsx`
 * usado no preview do editor — não existe um caminho de exportação com
 * composição diferente do que o usuário vê na tela.
 */

export async function renderDesignPng(doc: DesignDocument): Promise<Buffer> {
  const response = new ImageResponse(documentToJsx(doc) as ReactElement, {
    width: doc.canvas.width,
    height: doc.canvas.height,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function renderDesignJpeg(doc: DesignDocument, quality = 90): Promise<Buffer> {
  const png = await renderDesignPng(doc);
  return sharp(png).jpeg({ quality }).toBuffer();
}

export async function generatePosterFrame(doc: DesignDocument): Promise<Buffer> {
  return renderDesignPng(doc);
}

export async function renderDesignPdf(docs: DesignDocument[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  for (const doc of docs) {
    const pngBuffer = await renderDesignPng(doc);
    const image = await pdfDoc.embedPng(pngBuffer);
    const page = pdfDoc.addPage([doc.canvas.width, doc.canvas.height]);
    page.drawImage(image, { x: 0, y: 0, width: doc.canvas.width, height: doc.canvas.height });
  }
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function renderCarouselZip(docs: DesignDocument[], filePrefix = "slide"): Promise<Buffer> {
  const zip = new JSZip();
  for (let i = 0; i < docs.length; i++) {
    const png = await renderDesignPng(docs[i]);
    zip.file(`${filePrefix}-${String(i + 1).padStart(2, "0")}.png`, png);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}
