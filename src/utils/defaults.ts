import {
  HeaderSection,
  SummarySection,
  ExperienceSection,
  EducationSection,
  SkillsSection,
  ProjectsSection,
  CertificationsSection,
  LanguagesSection,
  CustomSection,
  SectionType,
  ThemeId,
  ThemeConfig,
  CVDocument,
  ItemCardStyle,
} from "../types/cv.types";
import { generateId } from "./id";

export function createHeaderSection(): HeaderSection {
  return {
    id: generateId(),
    type: "header",
    data: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
    },
  };
}

export function createSummarySection(): SummarySection {
  return {
    id: generateId(),
    type: "summary",
    content: "",
  };
}

export function createExperienceSection(): ExperienceSection {
  return {
    id: generateId(),
    type: "experience",
    items: [
      {
        id: generateId(),
        company: "",
        role: "",
        period: "",
        location: "",
        bullets: [""],
      },
    ],
  };
}

export function createEducationSection(): EducationSection {
  return {
    id: generateId(),
    type: "education",
    items: [
      {
        id: generateId(),
        institution: "",
        degree: "",
        period: "",
        gpa: "",
      },
    ],
  };
}

export function createSkillsSection(): SkillsSection {
  return {
    id: generateId(),
    type: "skills",
    groups: [
      {
        id: generateId(),
        label: "",
        items: "",
      },
    ],
  };
}

export function createProjectsSection(): ProjectsSection {
  return {
    id: generateId(),
    type: "projects",
    items: [
      {
        id: generateId(),
        name: "",
        link: "",
        description: "",
        tech: [],
      },
    ],
  };
}

export function createCertificationsSection(): CertificationsSection {
  return {
    id: generateId(),
    type: "certifications",
    items: [
      {
        id: generateId(),
        name: "",
        issuer: "",
        date: "",
      },
    ],
  };
}

export function createLanguagesSection(): LanguagesSection {
  return {
    id: generateId(),
    type: "languages",
    items: [
      {
        id: generateId(),
        name: "",
        level: "",
      },
    ],
  };
}

export function createCustomSection(): CustomSection {
  return {
    id: generateId(),
    type: "custom",
    content: "",
  };
}

export const SECTION_LABELS: Record<SectionType, string> = {
  header: "اطلاعات فردی",
  summary: "درباره من",
  experience: "سوابق کاری",
  education: "تحصیلات",
  skills: "مهارت‌ها",
  projects: "پروژه‌ها",
  certifications: "گواهینامه‌ها",
  languages: "زبان‌ها",
  custom: "بخش سفارشی",
};

export const THEMES: Record<ThemeId, ThemeConfig> = {
  modern: {
    id: "modern",
    name: "مدرن",
    fontFamily: "Inter, sans-serif",
    headingFont: "Inter, sans-serif",
    spacing: { sectionGap: 24, itemGap: 12 },
    colors: {
      primary: "#2563eb",
      secondary: "#64748b",
      background: "#ffffff",
      text: "#1e293b",
    },
    headerBackground: null,
    headerLayout: "banner",
    sectionTitleStyle: "underlined",
    itemCardStyle: "bordered",
  },
  classic: {
    id: "classic",
    name: "کلاسیک",
    fontFamily: "Georgia, serif",
    headingFont: "Georgia, serif",
    spacing: { sectionGap: 28, itemGap: 14 },
    colors: {
      primary: "#1f2937",
      secondary: "#6b7280",
      background: "#ffffff",
      text: "#111827",
    },
    headerBackground: null,
    headerLayout: "centered",
    sectionTitleStyle: "boxed",
    itemCardStyle: "flat",
  },
  minimal: {
    id: "minimal",
    name: "مینیمال",
    fontFamily: "Helvetica, Arial, sans-serif",
    headingFont: "Helvetica, Arial, sans-serif",
    spacing: { sectionGap: 20, itemGap: 10 },
    colors: {
      primary: "#18181b",
      secondary: "#71717a",
      background: "#ffffff",
      text: "#27272a",
    },
    headerBackground: null,
    headerLayout: "compact",
    sectionTitleStyle: "uppercase-plain",
    itemCardStyle: "dotted-separator",
  },
  executive: {
    id: "executive",
    name: "اجرایی",
    fontFamily: "Merriweather, serif",
    headingFont: "Merriweather, serif",
    spacing: { sectionGap: 32, itemGap: 16 },
    colors: {
      primary: "#1e3a5f",
      secondary: "#4a5568",
      background: "#fefefe",
      text: "#1a202c",
    },
    headerBackground: null,
    headerLayout: "sidebar-accent",
    sectionTitleStyle: "side-bar",
    itemCardStyle: "shadowed",
  },
};

export const ACCENT_COLORS: string[] = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0d9488",
  "#0284c7",
  "#4f46e5",
  "#1e3a5f",
  "#374151",
];

export function getItemCardClasses(style: ItemCardStyle, padding = "p-4"): string {
  switch (style) {
    case "bordered":
      return `border border-gray-100 rounded-lg ${padding}`;
    case "flat":
      return padding;
    case "dotted-separator":
      return "pb-3 border-b border-dotted border-gray-300 last:border-b-0";
    case "shadowed":
      return `rounded-lg ${padding} shadow-sm`;
    default:
      return `border border-gray-100 rounded-lg ${padding}`;
  }
}

export function getItemCardClasses(style: ItemCardStyle, padding = "p-4"): string {
  switch (style) {
    case "bordered":
      return `border border-gray-100 rounded-lg ${padding}`;
    case "flat":
      return padding;
    case "dotted-separator":
      return `pb-3 border-b border-dotted border-gray-300 last:border-b-0`;
    case "shadowed":
      return `rounded-lg ${padding} shadow-sm`;
    default:
      return `border border-gray-100 rounded-lg ${padding}`;
  }
}

export function createDefaultDocument(): CVDocument {
  return {
    sections: [createHeaderSection(), createSummarySection()],
    theme: "modern",
    accentColor: "#2563eb",
    fontSize: 14,
  };
}