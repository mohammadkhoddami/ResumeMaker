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
} from "../types/cv.types";
import { generateId } from "./id";

export function createHeaderSection(): HeaderSection {
  return {
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
    type: "summary",
    content: "",
  };
}

export function createExperienceSection(): ExperienceSection {
  return {
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

export function createDefaultDocument(): CVDocument {
  return {
    sections: [createHeaderSection(), createSummarySection()],
    theme: "modern",
    accentColor: "#2563eb",
    fontSize: 14,
  };
}