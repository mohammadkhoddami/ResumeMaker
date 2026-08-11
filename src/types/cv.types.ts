export type SectionType =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "custom";

export interface HeaderData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

export interface HeaderSection {
  type: "header";
  data: HeaderData;
}

export interface SummarySection {
  type: "summary";
  content: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface ExperienceSection {
  type: "experience";
  items: ExperienceItem[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  period: string;
  gpa: string;
}

export interface EducationSection {
  type: "education";
  items: EducationItem[];
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string;
}

export interface SkillsSection {
  type: "skills";
  groups: SkillGroup[];
}

export interface ProjectItem {
  id: string;
  name: string;
  link: string;
  description: string;
  tech: string[];
}

export interface ProjectsSection {
  type: "projects";
  items: ProjectItem[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CertificationsSection {
  type: "certifications";
  items: CertificationItem[];
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface LanguagesSection {
  type: "languages";
  items: LanguageItem[];
}

export interface CustomSection {
  type: "custom";
  content: string;
}

export type CVSection =
  | HeaderSection
  | SummarySection
  | ExperienceSection
  | EducationSection
  | SkillsSection
  | ProjectsSection
  | CertificationsSection
  | LanguagesSection
  | CustomSection;

export type ThemeId = "modern" | "classic" | "minimal" | "executive";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  fontFamily: string;
  headingFont: string;
  spacing: {
    sectionGap: number;
    itemGap: number;
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface CVDocument {
  sections: CVSection[];
  theme: ThemeId;
  accentColor: string;
  fontSize: number;
}