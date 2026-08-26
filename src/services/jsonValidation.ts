import type { CVDocument, CVSection, SectionType, ThemeId } from "../types/cv.types";
import { THEMES } from "../utils/defaults";
import { generateId } from "../utils/id";

const VALID_THEMES: readonly string[] = Object.keys(THEMES);

const DEFAULT_THEME: ThemeId = "modern";
const DEFAULT_ACCENT_COLOR = "#2563eb";
const DEFAULT_FONT_SIZE = 14;

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
  if (!isObject(data)) {
    throw new ValidationError(
      `Expected "${field}" to be an object, got ${data === null ? "null" : typeof data}`,
      field
    );
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function withId(item: Record<string, unknown>): { id: string } & Record<string, unknown> {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : generateId(),
    ...item,
  };
}

function normalizeSection(sectionObj: Record<string, unknown>): CVSection {
  const id = typeof sectionObj.id === "string" && sectionObj.id.length > 0 ? sectionObj.id : generateId();
  const type = sectionObj.type as SectionType;

  switch (type) {
    case "header": {
      const data = isObject(sectionObj.data) ? sectionObj.data : {};
      return {
        id,
        type: "header",
        data: {
          name: asString(data.name),
          title: asString(data.title),
          email: asString(data.email),
          phone: asString(data.phone),
          location: asString(data.location),
          linkedin: asString(data.linkedin),
          website: asString(data.website),
        },
      };
    }
    case "summary":
    case "custom":
      return { id, type, content: asString(sectionObj.content) } as CVSection;
    case "experience":
      return {
        id,
        type,
        items: asRecordArray(sectionObj.items).map((item) => {
          const normalized = withId(item);
          return {
            id: normalized.id,
            company: asString(normalized.company),
            role: asString(normalized.role),
            period: asString(normalized.period),
            location: asString(normalized.location),
            bullets: asStringArray(normalized.bullets),
          };
        }),
      };
    case "education":
      return {
        id,
        type,
        items: asRecordArray(sectionObj.items).map((item) => {
          const normalized = withId(item);
          return {
            id: normalized.id,
            institution: asString(normalized.institution),
            degree: asString(normalized.degree),
            period: asString(normalized.period),
            gpa: asString(normalized.gpa),
          };
        }),
      };
    case "skills":
      return {
        id,
        type,
        groups: asRecordArray(sectionObj.groups).map((group) => {
          const normalized = withId(group);
          return {
            id: normalized.id,
            label: asString(normalized.label),
            items: asString(normalized.items),
          };
        }),
      };
    case "projects":
      return {
        id,
        type,
        items: asRecordArray(sectionObj.items).map((item) => {
          const normalized = withId(item);
          return {
            id: normalized.id,
            name: asString(normalized.name),
            link: asString(normalized.link),
            description: asString(normalized.description),
            tech: asStringArray(normalized.tech),
          };
        }),
      };
    case "certifications":
      return {
        id,
        type,
        items: asRecordArray(sectionObj.items).map((item) => {
          const normalized = withId(item);
          return {
            id: normalized.id,
            name: asString(normalized.name),
            issuer: asString(normalized.issuer),
            date: asString(normalized.date),
          };
        }),
      };
    case "languages":
      return {
        id,
        type,
        items: asRecordArray(sectionObj.items).map((item) => {
          const normalized = withId(item);
          return {
            id: normalized.id,
            name: asString(normalized.name),
            level: asString(normalized.level),
          };
        }),
      };
    case "articles":
      return {
        id,
        type,
        items: asRecordArray(sectionObj.items).map((item) => {
          const normalized = withId(item);
          return {
            id: normalized.id,
            title: asString(normalized.title),
            description: asString(normalized.description),
            link: asString(normalized.link),
          };
        }),
      };
    default:
      // Unknown/legacy section types are preserved as-is; the renderer skips them safely.
      return { ...sectionObj, id } as unknown as CVSection;
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
    if (!isObject(section)) {
      throw new ValidationError(
        `sections[${i}] must be an object`,
        `sections[${i}]`
      );
    }
    if (!("id" in section)) {
      throw new ValidationError(
        `sections[${i}] is missing required field "id"`,
        `sections[${i}].id`
      );
    }
    if (typeof section.id !== "string" || section.id.length === 0) {
      throw new ValidationError(
        `sections[${i}].id must be a non-empty string, got ${typeof section.id}`,
        `sections[${i}].id`
      );
    }
    if (!("type" in section)) {
      throw new ValidationError(
        `sections[${i}] is missing required field "type"`,
        `sections[${i}].type`
      );
    }
  }

  // --- theme (optional, falls back to default for legacy/unknown values) ---
  let theme: ThemeId = DEFAULT_THEME;
  if ("theme" in obj && obj.theme !== null && obj.theme !== undefined) {
    if (typeof obj.theme !== "string") {
      throw new ValidationError(
        `"theme" must be a string, got ${typeof obj.theme}`,
        "theme"
      );
    }
    theme = VALID_THEMES.includes(obj.theme) ? (obj.theme as ThemeId) : DEFAULT_THEME;
  }

  // --- accentColor (optional) ---
  const accentColor =
    typeof obj.accentColor === "string" ? obj.accentColor : DEFAULT_ACCENT_COLOR;

  // --- fontSize (optional) ---
  const fontSize =
    typeof obj.fontSize === "number" && Number.isFinite(obj.fontSize)
      ? obj.fontSize
      : DEFAULT_FONT_SIZE;

  return {
    sections: obj.sections.map((section) =>
      normalizeSection(section as Record<string, unknown>)
    ),
    theme,
    accentColor,
    fontSize,
  };
}
