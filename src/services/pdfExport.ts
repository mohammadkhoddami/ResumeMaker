import type { CVDocument } from "../types/cv.types";
import { validateCVDocument } from "./jsonValidation";

const A4_WIDTH_MM = 210;
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

  // Clone into an offscreen container that participates in layout
  // visibility:hidden keeps it in flow but invisible; absolute positioning
  // avoids affecting page scroll. This is more reliable than fixed+negative.
  const offscreen = document.createElement("div");
  offscreen.style.cssText =
    "position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;";
  document.body.appendChild(offscreen);

  const clone = cvElement.cloneNode(true) as HTMLElement;
  clone.classList.add("pdf-export");
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minHeight = "auto";
  offscreen.appendChild(clone);

  // Force layout recalculation in the offscreen container
  clone.offsetHeight;

  try {
    // Collect section + item-card boundaries relative to the clone container
    const contentEl = clone.querySelector(".relative.z-10") ?? clone;

    const totalHeight = clone.scrollHeight;
    const bounds = collectBreakBounds(contentEl as HTMLElement, clone);

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

    const canvasWidth = jpegCanvas.width;

    let currentY = 0;
    let pageIndex = 0;

    const maxSlicePx = A4_HEIGHT_PX * CANVAS_SCALE;

    while (currentY < totalHeight * CANVAS_SCALE) {
      const nextBreakRaw = pageIndex < pageBreaks.length ? pageBreaks[pageIndex] : undefined;
      const nextBreakPx =
        nextBreakRaw !== undefined
          ? Math.round(nextBreakRaw * CANVAS_SCALE)
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
 * Collects break-point boundaries (relative to `reference.top`) for every
 * top-level section wrapper AND every atomic item card inside sections.
 * Item-level granularity keeps wasted page space below one card height.
 */
export function collectBreakBounds(
  contentEl: HTMLElement,
  reference: HTMLElement
): { top: number; bottom: number }[] {
  const refTop = reference.getBoundingClientRect().top;
  const bounds: { top: number; bottom: number }[] = [];

  const push = (el: Element) => {
    const rect = el.getBoundingClientRect();
    bounds.push({ top: rect.top - refTop, bottom: rect.bottom - refTop });
  };

  for (const section of Array.from(contentEl.children)) {
    push(section);

    // Atomic cards inside a section (children of the section body),
    // excluding the "+ add item" action buttons.
    const items = section.querySelectorAll<HTMLElement>(
      ".cv-section-spacing > *:last-child > *"
    );
    for (const item of Array.from(items)) {
      if (!item.classList.contains("cv-action-btn")) {
        push(item);
      }
    }
  }

  return bounds;
}

/**
 * Computes optimal page-break Y positions (in px relative to clone top).
 * Cuts at the deepest safe boundary that fits on each page; boundaries are
 * item-card bottoms, so wasted space never exceeds one card's height.
 */
export function computePageBreaks(bounds: { top: number; bottom: number }[], totalHeight: number): number[] {
  const candidates = Array.from(new Set(bounds.map((b) => Math.round(b.bottom))))
    .filter((y) => y > 0 && y < totalHeight)
    .sort((a, b) => a - b);

  const breaks: number[] = [];
  let lastBreak = 0;
  let pageBottom = A4_HEIGHT_PX;

  while (pageBottom < totalHeight) {
    let bestBreak = -1;

    for (let i = candidates.length - 1; i >= 0; i--) {
      const candidate = candidates[i];
      if (candidate !== undefined && candidate <= pageBottom) {
        bestBreak = candidate;
        break;
      }
    }

    // No boundary fits within this page (a single block is taller than the
    // remaining space): hard-cut at the page edge so pagination terminates.
    if (bestBreak === -1 || bestBreak <= lastBreak) {
      bestBreak = pageBottom;
    }

    breaks.push(bestBreak);
    lastBreak = bestBreak;
    pageBottom = bestBreak + A4_HEIGHT_PX;
  }

  // Guard: remove the last break if it would produce a near-empty trailing page
  const finalBreak = breaks[breaks.length - 1];
  if (finalBreak !== undefined && totalHeight - finalBreak < 40) {
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