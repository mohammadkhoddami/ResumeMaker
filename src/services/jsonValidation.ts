import type { CVDocument, ThemeId } from "../types/cv.types";

const VALID_THEMES: readonly string[] = ["modern", "classic", "minimal", "executive"];

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

function assertObject(data: unknown, field: string): asserts data is Record<string, unknown> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError(
      `Expected "${field}" to be an object, got ${data === null ? "null" : typeof data}`,
      field
    );
  }
}

export function validateCVDocument(data: unknown): CVDocument {
  assertObject(data, "root");

  const obj = data as Record<string, unknown>;

  // --- sections ---
  if (!("sections" in obj)) {
    throw new ValidationError('Missing required field "sections"', "sections");
  }
  if (!Array.isArray(obj.sections)) {
    throw new ValidationError(
      `"sections" must be an array, got ${typeof obj.sections}`,
      "sections"
    );
  }
  for (let i = 0; i < obj.sections.length; i++) {
    const section = obj.sections[i];
    if (section === null || typeof section !== "object" || Array.isArray(section)) {
      throw new ValidationError(
        `sections[${i}] must be an object`,
        `sections[${i}]`
      );
    }
    const sectionObj = section as Record<string, unknown>;
    if (!("id" in sectionObj)) {
      throw new ValidationError(
        `sections[${i}] is missing required field "id"`,
        `sections[${i}].id`
      );
    }
    if (typeof sectionObj.id !== "string" || sectionObj.id.length === 0) {
      throw new ValidationError(
        `sections[${i}].id must be a non-empty string, got ${typeof sectionObj.id}`,
        `sections[${i}].id`
      );
    }
    if (!("type" in sectionObj)) {
      throw new ValidationError(
        `sections[${i}] is missing required field "type"`,
        `sections[${i}].type`
      );
    }
  }

  // --- theme ---
  if (!("theme" in obj)) {
    throw new ValidationError('Missing required field "theme"', "theme");
  }
  if (typeof obj.theme !== "string") {
    throw new ValidationError(
      `"theme" must be a string, got ${typeof obj.theme}`,
      "theme"
    );
  }
  if (!VALID_THEMES.includes(obj.theme)) {
    throw new ValidationError(
      `"theme" must be one of [${VALID_THEMES.join(", ")}], got "${obj.theme}"`,
      "theme"
    );
  }

  // --- accentColor ---
  if (!("accentColor" in obj)) {
    throw new ValidationError('Missing required field "accentColor"', "accentColor");
  }
  if (typeof obj.accentColor !== "string") {
    throw new ValidationError(
      `"accentColor" must be a string, got ${typeof obj.accentColor}`,
      "accentColor"
    );
  }

  // --- fontSize ---
  if (!("fontSize" in obj)) {
    throw new ValidationError('Missing required field "fontSize"', "fontSize");
  }
  if (typeof obj.fontSize !== "number" || Number.isNaN(obj.fontSize)) {
    throw new ValidationError(
      `"fontSize" must be a finite number, got ${String(obj.fontSize)}`,
      "fontSize"
    );
  }

  return {
    sections: obj.sections as CVDocument["sections"],
    theme: obj.theme as ThemeId,
    accentColor: obj.accentColor,
    fontSize: obj.fontSize,
  };
}