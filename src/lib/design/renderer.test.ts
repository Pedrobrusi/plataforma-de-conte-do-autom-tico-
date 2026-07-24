// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { renderDesignPng, renderDesignJpeg, renderDesignPdf, renderCarouselZip } from "./renderer";
import type { DesignDocument } from "./document";
import JSZip from "jszip";

function sampleDoc(overrides: Partial<DesignDocument> = {}): DesignDocument {
  return {
    version: 1,
    templateId: "quote-classic",
    contentType: "quote_card",
    canvas: { width: 1170, height: 1560 },
    background: { type: "color", color: "#08090A" },
    safeArea: { top: 64, right: 64, bottom: 64, left: 64 },
    elements: [
      {
        id: "headline",
        type: "text",
        x: 96,
        y: 600,
        width: 978,
        height: 400,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        content: "O sucesso é a soma de pequenos esforços repetidos todos os dias",
        fontFamily: "Inter",
        fontSize: 56,
        fontWeight: 700,
        color: "#F5F5F5",
        align: "left",
        lineHeight: 1.2,
        letterSpacing: 0,
        highlightSubstring: "sucesso",
        highlightColor: "#EC4899",
      },
    ],
    ...overrides,
  };
}

describe("renderDesignPng", () => {
  it("gera um PNG real com as dimensões exatas do canvas", async () => {
    const png = await renderDesignPng(sampleDoc());
    expect(png.length).toBeGreaterThan(1000);
    const metadata = await sharp(png).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(1170);
    expect(metadata.height).toBe(1560);
  });

  it("dimensões diferentes de canvas produzem PNGs diferentes (video vertical)", async () => {
    const png = await renderDesignPng(sampleDoc({ canvas: { width: 1080, height: 1920 } }));
    const metadata = await sharp(png).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1920);
  });
}, 30_000);

describe("renderDesignJpeg", () => {
  it("gera um JPEG válido", async () => {
    const jpeg = await renderDesignJpeg(sampleDoc());
    const metadata = await sharp(jpeg).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(1170);
  });
}, 30_000);

describe("renderDesignPdf", () => {
  it("gera um PDF com uma página por documento", async () => {
    const pdfBytes = await renderDesignPdf([sampleDoc(), sampleDoc(), sampleDoc()]);
    expect(pdfBytes.subarray(0, 4).toString()).toBe("%PDF");
    // %%EOF marca o fim de um PDF válido.
    expect(pdfBytes.toString("latin1")).toContain("%%EOF");
  });
}, 30_000);

describe("renderCarouselZip", () => {
  it("gera um ZIP com exatamente um PNG por slide, na ordem correta", async () => {
    const docs = [sampleDoc(), sampleDoc(), sampleDoc()];
    const zipBuffer = await renderCarouselZip(docs, "slide");
    const zip = await JSZip.loadAsync(zipBuffer);
    const filenames = Object.keys(zip.files).sort();
    expect(filenames).toEqual(["slide-01.png", "slide-02.png", "slide-03.png"]);

    for (const filename of filenames) {
      const content = await zip.files[filename].async("nodebuffer");
      const metadata = await sharp(content).metadata();
      expect(metadata.format).toBe("png");
      expect(metadata.width).toBe(1170);
    }
  });
}, 30_000);
