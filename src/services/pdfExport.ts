import type { CVDocument } from "../types/cv.types";
import { validateCVDocument } from "./jsonValidation";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const CANVAS_SCALE = 1.5;

/**
 * Exports the CV element as a paginated image-based PDF.
 * Uses getBoundingClientRect() relative to the clone container for
 * reliable section-boundary detection (fixes offsetTop chain bug).
 */
export async function exportAsImagePDF(cvElement: HTMLElement): Promise<void> {
  await document.fonts.ready;

  // Clone into an offscreen container so we don't mutate the live DOM
  const offscreen = document.createElement("div");
  offscreen.style.cssText =
    "position:fixed;top:-99999px;left:-99999px;z-index:-1;pointer-events:none;";
  document.body.appendChild(offscreen);

  const clone = cvElement.cloneNode(true) as HTMLElement;
  clone.classList.add("pdf-export");
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minHeight = "auto";
  offscreen.appendChild(clone);

  try {
    // Compute section boundaries relative to the clone container
    const cloneRect = clone.getBoundingClientRect();
    const contentEl = clone.querySelector(".relative.z-10") ?? clone;
    const sectionEls = Array.from(contentEl.children) as HTMLElement[];

    interface SectionBounds {
      top: number;
      bottom: number;
    }

    const bounds: SectionBounds[] = sectionEls.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top - cloneRect.top,
        bottom: rect.bottom - cloneRect.top,
      };
    });

    const totalHeight = clone.scrollHeight;

    // Smart pagination: find break points that prefer section boundaries
    const pageBreaks = computePageBreaks(bounds, totalHeight);

    // Render the entire clone to a single canvas
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(clone, {
      scale: CANVAS_SCALE,
      useCORS: true,
      logging: false,
      width: A4_WIDTH_PX,
      height: totalHeight,
      windowWidth: A4_WIDTH_PX,
      windowHeight: totalHeight,
    });

    // Convert to JPEG to reduce memory footprint before slicing
    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const jpegImg = new Image();
    await new Promise<void>((resolve, reject) => {
      jpegImg.onload = () => resolve();
      jpegImg.onerror = () => reject(new Error("Failed to load JPEG"));
      jpegImg.src = jpegDataUrl;
    });

    const jpegCanvas = document.createElement("canvas");
    jpegCanvas.width = canvas.width;
    jpegCanvas.height = canvas.height;
    const jCtx = jpegCanvas.getContext("2d");
    if (!jCtx) throw new Error("Failed to get 2D context for JPEG conversion");
    jCtx.drawImage(jpegImg, 0, 0);

    // Assemble pages into jsPDF
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const sliceHeightPx = Math.round(A4_HEIGHT_PX * CANVAS_SCALE);
    const canvasWidth = jpegCanvas.width;

    let currentY = 0;
    let pageIndex = 0;

    const maxSlicePx = A4_HEIGHT_PX * CANVAS_SCALE;

    while (currentY < totalHeight * CANVAS_SCALE) {
      const nextBreakPx =
        pageIndex < pageBreaks.length
          ? Math.round(pageBreaks[pageIndex] * CANVAS_SCALE)
          : totalHeight * CANVAS_SCALE;

      const sliceTop = currentY;
      let sliceBottom = Math.min(nextBreakPx, totalHeight * CANVAS_SCALE);

      // Clamp: never exceed one full A4 page height per slice
      if (sliceBottom - sliceTop > maxSlicePx) {
        sliceBottom = sliceTop + maxSlicePx;
      }

      const sliceH = sliceBottom - sliceTop;

      if (sliceH <= 0) break;

      // Extract slice from the full canvas
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvasWidth;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2D context for slicing");

      ctx.drawImage(jpegCanvas, 0, sliceTop, canvasWidth, sliceH, 0, 0, canvasWidth, sliceH);

      const imgData = sliceCanvas.toDataURL("image/jpeg", 0.82);
      const sliceHeightMm = (sliceH / CANVAS_SCALE / A4_WIDTH_PX) * A4_WIDTH_MM;

      if (pageIndex > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, sliceHeightMm);

      currentY = sliceBottom;
      pageIndex++;
    }

    pdf.save("cv-export.pdf");
  } finally {
    document.body.removeChild(offscreen);
  }
}

/**
 * Computes optimal page-break Y positions (in px relative to clone top).
 * Prefers breaking between sections rather than mid-section.
 */
export function computePageBreaks(bounds: { top: number; bottom: number }[], totalHeight: number): number[] {
  const breaks: number[] = [];
  let pageBottom = A4_HEIGHT_PX;

  while (pageBottom < totalHeight) {
    // Find the best break point at or before pageBottom
    let bestBreak = pageBottom;

    for (let i = bounds.length - 1; i >= 0; i--) {
      const sectionBottom = bounds[i].bottom;
      if (sectionBottom <= pageBottom && sectionBottom > pageBottom - A4_HEIGHT_PX * 0.4) {
        bestBreak = sectionBottom;
        break;
      }
    }

    breaks.push(bestBreak);
    pageBottom = bestBreak + A4_HEIGHT_PX;
  }

  // Guard: remove the last break if it would produce a near-empty trailing page
  if (breaks.length > 0 && totalHeight - breaks[breaks.length - 1] < 40) {
    breaks.pop();
  }

  return breaks;
}

/**
 * Downloads the CVDocument as a formatted JSON file.
 */
export function exportAsJSON(doc: CVDocument): void {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cv-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a JSON file, validates its structure, and returns a typed CVDocument.
 * Throws ValidationError if the structure is invalid.
 */
export async function importFromJSON(file: File): Promise<CVDocument> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("File does not contain valid JSON");
  }

  return validateCVDocument(parsed);
}