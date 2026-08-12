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
          ? "flex flex-col items-center gap-1 pt-2 text-sm"
          : "flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm"
      }
      style={{ color: themeConfig.colors.secondary }}
    >
      <EditableText
        value={section.data.email}
        onChange={(v) => updateField("email", v)}
        placeholder="ایمیل"
        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
        direction="ltr"
      />
      <EditableText
        value={section.data.phone}
        onChange={(v) => updateField("phone", v)}
        placeholder="شماره تماس"
        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
        direction="ltr"
      />
      <EditableText
        value={section.data.location}
        onChange={(v) => updateField("location", v)}
        placeholder="موقعیت مکانی"
        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
        direction="rtl"
      />
      <EditableText
        value={section.data.linkedin}
        onChange={(v) => updateField("linkedin", v)}
        placeholder="لینکدین"
        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
        direction="ltr"
      />
      <EditableText
        value={section.data.website}
        onChange={(v) => updateField("website", v)}
        placeholder="وبسایت"
        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
        direction="ltr"
      />
    </div>
  );

  if (layout === "centered") {
    return (
      <div
        className="cv-item rounded-lg p-6 text-center"
        style={{ backgroundColor: headerBg }}
      >
        <div className="space-y-2">
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
        className="cv-item rounded-lg p-6"
        style={{
          backgroundColor: headerBg,
          borderRight: `6px solid ${accentColor}`,
        }}
      >
        <div className="space-y-2">
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
        className="cv-item rounded-lg p-3"
        style={{
          backgroundColor: headerBg,
          borderTop: `4px solid ${accentColor}`,
        }}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
      className="cv-item rounded-lg p-6"
      style={{
        backgroundColor: headerBg,
        borderTop: `6px solid ${accentColor}`,
      }}
    >
      <div className="space-y-2">
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