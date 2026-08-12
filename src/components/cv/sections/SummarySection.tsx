import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { THEMES } from "../../../utils/defaults";
import type { SummarySection as SummarySectionData } from "../../../types/cv.types";

interface Props {
  section: SummarySectionData;
}

export function SummarySection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  return (
    <div className="cv-item">
      <EditableText
        tag="p"
        value={section.content}
        onChange={(v) => updateSection(section.id, { content: v })}
        placeholder="خلاصه‌ای از سوابق و اهداف حرفه‌ای خود را بنویسید..."
        multiline
        className="leading-relaxed block outline-none focus:ring-2 focus:ring-blue-300 rounded px-1 min-h-[3rem] whitespace-pre-wrap"
        style={{ color: themeConfig.colors.text, fontSize: "inherit", lineHeight: 1.7 }}
        direction="rtl"
      />
    </div>
  );
}