import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { THEMES } from "../../../utils/defaults";
import type { HeaderSection as HeaderSectionData } from "../../../types/cv.types";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const contactIcons: Record<string, React.ReactNode> = {
  email: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 6 10-6" />
    </svg>
  ),
  phone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  location: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  linkedin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),
  website: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
};

interface Props {
  section: HeaderSectionData;
}

export function HeaderSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const accentColor = useCVStore((s) => s.document.accentColor);

  const themeConfig = THEMES[theme];
  const headerBg = themeConfig.headerBackground ?? hexToRgba(accentColor, 0.1);
  const layout = themeConfig.headerLayout;

  const updateField = (field: keyof HeaderSectionData["data"], value: string) => {
    updateSection(section.id, {
      data: { ...section.data, [field]: value },
    });
  };

  const contactFields = (stacked: boolean) => (
    <div
      className={
        stacked
          ? "flex flex-col items-center gap-0.5 pt-1.5 text-sm"
          : "flex flex-wrap gap-x-3 gap-y-0.5 pt-1.5 text-sm"
      }
      style={{ color: themeConfig.colors.secondary }}
    >
      <span className="inline-flex items-center gap-1">
        {contactIcons.email}
        <EditableText
          value={section.data.email}
          onChange={(v) => updateField("email", v)}
          placeholder="ایمیل"
          className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
          direction="ltr"
        />
      </span>
      <span className="inline-flex items-center gap-1">
        {contactIcons.phone}
        <EditableText
          value={section.data.phone}
          onChange={(v) => updateField("phone", v)}
          placeholder="شماره تماس"
          className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
          direction="ltr"
        />
      </span>
      <span className="inline-flex items-center gap-1">
        {contactIcons.location}
        <EditableText
          value={section.data.location}
          onChange={(v) => updateField("location", v)}
          placeholder="موقعیت مکانی"
          className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
          direction="rtl"
        />
      </span>
      <span className="inline-flex items-center gap-1">
        {contactIcons.linkedin}
        <EditableText
          value={section.data.linkedin}
          onChange={(v) => updateField("linkedin", v)}
          placeholder="لینکدین"
          className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
          direction="ltr"
        />
      </span>
      <span className="inline-flex items-center gap-1">
        {contactIcons.website}
        <EditableText
          value={section.data.website}
          onChange={(v) => updateField("website", v)}
          placeholder="وبسایت"
          className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
          direction="ltr"
        />
      </span>
    </div>
  );

  if (layout === "centered") {
    return (
      <div
        className="cv-item rounded-lg p-4 text-center"
        style={{ backgroundColor: headerBg }}
      >
        <div className="space-y-1">
          <EditableText
            tag="h1"
            value={section.data.name}
            onChange={(v) => updateField("name", v)}
            placeholder="نام و نام خانوادگی"
            className="font-bold block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
            style={{ color: accentColor, fontFamily: themeConfig.headingFont, fontSize: "2rem", lineHeight: 1.2 }}
            direction="rtl"
          />
          <EditableText
            tag="h2"
            value={section.data.title}
            onChange={(v) => updateField("title", v)}
            placeholder="عنوان شغلی"
            className="font-medium block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
            style={{ color: themeConfig.colors.primary, fontFamily: themeConfig.headingFont, fontSize: "1.25rem", lineHeight: 1.3 }}
            direction="rtl"
          />
          {contactFields(true)}
        </div>
      </div>
    );
  }

  if (layout === "sidebar-accent") {
    return (
      <div
        className="cv-item rounded-lg p-4"
        style={{
          backgroundColor: headerBg,
          borderRight: `6px solid ${accentColor}`,
        }}
      >
        <div className="space-y-1">
          <EditableText
            tag="h1"
            value={section.data.name}
            onChange={(v) => updateField("name", v)}
            placeholder="نام و نام خانوادگی"
            className="font-bold block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
            style={{ color: accentColor, fontFamily: themeConfig.headingFont, fontSize: "2rem", lineHeight: 1.2 }}
            direction="rtl"
          />
          <EditableText
            tag="h2"
            value={section.data.title}
            onChange={(v) => updateField("title", v)}
            placeholder="عنوان شغلی"
            className="font-medium block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
            style={{ color: themeConfig.colors.primary, fontFamily: themeConfig.headingFont, fontSize: "1.25rem", lineHeight: 1.3 }}
            direction="rtl"
          />
          {contactFields(false)}
        </div>
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div
        className="cv-item rounded-lg p-2"
        style={{
          backgroundColor: headerBg,
          borderTop: `4px solid ${accentColor}`,
        }}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <EditableText
            tag="h1"
            value={section.data.name}
            onChange={(v) => updateField("name", v)}
            placeholder="نام و نام خانوادگی"
            className="font-bold outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
            style={{ color: accentColor, fontFamily: themeConfig.headingFont, fontSize: "1.5rem", lineHeight: 1.2 }}
            direction="rtl"
          />
          <EditableText
            tag="h2"
            value={section.data.title}
            onChange={(v) => updateField("title", v)}
            placeholder="عنوان شغلی"
            className="font-medium outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
            style={{ color: themeConfig.colors.primary, fontFamily: themeConfig.headingFont, fontSize: "1rem", lineHeight: 1.3 }}
            direction="rtl"
          />
        </div>
        {contactFields(false)}
      </div>
    );
  }

  return (
    <div
      className="cv-item rounded-lg p-4"
      style={{
        backgroundColor: headerBg,
        borderTop: `6px solid ${accentColor}`,
      }}
    >
      <div className="space-y-1">
        <EditableText
          tag="h1"
          value={section.data.name}
          onChange={(v) => updateField("name", v)}
          placeholder="نام و نام خانوادگی"
          className="font-bold block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
          style={{ color: accentColor, fontFamily: themeConfig.headingFont, fontSize: "2rem", lineHeight: 1.2 }}
          direction="rtl"
        />
        <EditableText
          tag="h2"
          value={section.data.title}
          onChange={(v) => updateField("title", v)}
          placeholder="عنوان شغلی"
          className="font-medium block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1"
          style={{ color: themeConfig.colors.primary, fontFamily: themeConfig.headingFont, fontSize: "1.25rem", lineHeight: 1.3 }}
          direction="rtl"
        />
        {contactFields(false)}
      </div>
    </div>
  );
}