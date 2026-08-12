import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import type { HeaderSection as HeaderSectionData } from "../../../types/cv.types";

interface Props {
  section: HeaderSectionData;
}

const DARK_THEMES = new Set(["classic", "minimal", "executive"]);

export function HeaderSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const accentColor = useCVStore((s) => s.document.accentColor);

  const isDark = DARK_THEMES.has(theme);

  const updateField = (field: keyof HeaderSectionData["data"], value: string) => {
    updateSection(section.id, {
      data: { ...section.data, [field]: value },
    });
  };

  const textClass = isDark ? "text-white" : "text-gray-900";
  const subtextClass = isDark ? "text-gray-200" : "text-gray-600";
  const bgClass = isDark ? "bg-gray-900" : "bg-white";

  return (
    <div className={`cv-item rounded-lg p-6 ${bgClass}`} style={{ borderTop: `4px solid ${accentColor}` }}>
      <div className="space-y-2">
        <EditableText
          tag="h1"
          value={section.data.name}
          onChange={(v) => updateField("name", v)}
          placeholder="نام و نام خانوادگی"
          className={`text-3xl font-bold ${textClass} block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1`}
          direction="rtl"
        />
        <EditableText
          tag="h2"
          value={section.data.title}
          onChange={(v) => updateField("title", v)}
          placeholder="عنوان شغلی"
          className={`text-lg font-medium ${subtextClass} block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1`}
          direction="rtl"
        />

        <div className={`flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm ${subtextClass}`}>
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
      </div>
    </div>
  );
}