import type { CVDocument } from "../types/cv.types";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

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