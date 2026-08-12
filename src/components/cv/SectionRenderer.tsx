import React from "react";
import { SECTION_LABELS, THEMES } from "../../utils/defaults";
import { useCVStore } from "../../store/cvStore";

import type { CVSection, SectionType } from "../../types/cv.types";

import { HeaderSection } from "./sections/HeaderSection";
import { SummarySection } from "./sections/SummarySection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection } from "./sections/SkillsSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { CertificationsSection } from "./sections/CertificationsSection";
import { LanguagesSection } from "./sections/LanguagesSection";
import { CustomSection } from "./sections/CustomSection";

interface SectionRendererProps {
  section: CVSection;
}

const SECTION_COMPONENTS: Record<SectionType, React.ComponentType<{ section: any }>> = {
  header: HeaderSection,
  summary: SummarySection,
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  certifications: CertificationsSection,
  languages: LanguagesSection,
  custom: CustomSection,
};

export function SectionRenderer({ section }: SectionRendererProps) {
  const Component = SECTION_COMPONENTS[section.type];
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  if (!Component) return null;

  if (section.type === "header") {
    return <Component section={section} />;
  }

  return (
    <div className="cv-item" style={{ marginBottom: themeConfig.spacing.sectionGap }}>
      <div
        className="flex items-center gap-2 border-b border-gray-200 pb-2"
        style={{ marginBottom: themeConfig.spacing.itemGap }}
      >
        <h3
          className="font-bold"
          style={{
            fontFamily: themeConfig.headingFont,
            color: themeConfig.colors.primary,
            fontSize: "1rem",
            lineHeight: 1.4,
          }}
        >
          {SECTION_LABELS[section.type]}
        </h3>
      </div>
      <Component section={section} />
    </div>
  );
}