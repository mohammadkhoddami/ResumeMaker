import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import { THEMES } from "../../../utils/defaults";
import type { LanguagesSection as LanguagesSectionData, LanguageItem } from "../../../types/cv.types";

interface Props {
  section: LanguagesSectionData;
}

export function LanguagesSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  const isAts = theme === "ats";

  const updateItems = (items: LanguageItem[]) => {
    updateSection(section.id, { items });
  };

  const updateItem = (itemId: string, patch: Partial<LanguageItem>) => {
    const items = section.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    updateItems(items);
  };

  const addItem = () => {
    const newItem: LanguageItem = {
      id: generateId(),
      name: "",
      level: "",
    };
    updateItems([...section.items, newItem]);
  };

  const removeItem = (itemId: string) => {
    updateItems(section.items.filter((item) => item.id !== itemId));
  };

  return (
    <div className="cv-item" style={{ display: "flex", flexDirection: "column", gap: themeConfig.spacing.itemGap, color: themeConfig.colors.text }}>
      {section.items.map((item) => (
        <div key={item.id} className={`relative group flex gap-3 ${isAts ? "flex-col gap-1" : "items-center"}`}>
          <EditableText
            value={item.name}
            onChange={(v) => updateItem(item.id, { name: v })}
            placeholder="زبان"
            className={`text-sm font-medium text-gray-900 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 ${isAts ? "w-full" : "w-24"}`}
            direction="rtl"
          />
          <EditableText
            value={item.level}
            onChange={(v) => updateItem(item.id, { level: v })}
            placeholder="سطح تسلط"
            className={`text-sm text-gray-600 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 ${isAts ? "w-full" : "flex-1"}`}
            direction="rtl"
          />
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <IconButton
              label="حذف زبان"
              onClick={() => removeItem(item.id)}
              size="sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="cv-action-btn text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        + افزودن زبان
      </button>
    </div>
  );
}