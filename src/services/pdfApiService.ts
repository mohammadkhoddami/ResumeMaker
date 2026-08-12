import type { CVDocument } from "../types/cv.types";

/**
 * Exports the CV document as a PDF via the backend API.
 *
 * Error scenarios handled by callers (toast notifications):
 * - Network failure / server down: `fetch` rejects with a TypeError
 *   (e.g. "Failed to fetch"). Caller should show: "Unable to reach the
 *   export server. Please try again."
 * - 422 Validation error: throws Error with `detail` from the response
 *   body (e.g. "Validation failed"). Caller should show the message as-is.
 * - 500 Server error: throws Error with `detail` from the response body
 *   (e.g. "An internal server error occurred." or a PDF generation error).
 *   Caller should show: "PDF generation failed. Please try again."
 */

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

export async function exportPdfViaApi(document: CVDocument): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/api/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    let message = `PDF export failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.detail) {
        message = errorBody.detail;
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Could not parse JSON error body; use generic message
    }
    throw new Error(message);
  }

  return response.blob();
}