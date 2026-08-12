import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import { THEMES, getItemCardClasses } from "../../../utils/defaults";
import type { CertificationsSection as CertificationsSectionData, CertificationItem } from "../../../types/cv.types";

interface Props {
  section: CertificationsSectionData;
}

export function CertificationsSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  const updateItems = (items: CertificationItem[]) => {
    updateSection(section.id, { items });
  };

  const updateItem = (itemId: string, patch: Partial<CertificationItem>) => {
    const items = section.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    updateItems(items);
  };

  const addItem = () => {
    const newItem: CertificationItem = {
      id: generateId(),
      name: "",
      issuer: "",
      date: "",
    };
    updateItems([...section.items, newItem]);
  };

  const removeItem = (itemId: string) => {
    updateItems(section.items.filter((item) => item.id !== itemId));
  };

  return (
    <div className="cv-item" style={{ display: "flex", flexDirection: "column", gap: themeConfig.spacing.itemGap, color: themeConfig.colors.text }}>
      {section.items.map((item) => (
        <div key={item.id} className={`relative group flex items-start gap-3 ${getItemCardClasses(themeConfig.itemCardStyle, "p-3")}`}>
          <div className="flex-1 space-y-1">
            <EditableText
              value={item.name}
              onChange={(v) => updateItem(item.id, { name: v })}
              placeholder="نام گواهینامه"
              className="font-semibold text-sm text-gray-900 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 block"
              direction="rtl"
            />
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <EditableText
                value={item.issuer}
                onChange={(v) => updateItem(item.id, { issuer: v })}
                placeholder="صادرکننده"
                className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                direction="rtl"
              />
              <EditableText
                value={item.date}
                onChange={(v) => updateItem(item.id, { date: v })}
                placeholder="تاریخ"
                className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                direction="rtl"
              />
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <IconButton
              label="حذف گواهینامه"
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
        + افزودن گواهینامه
      </button>
    </div>
  );
}