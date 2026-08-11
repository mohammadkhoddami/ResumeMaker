import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import type { EducationSection as EducationSectionData, EducationItem } from "../../../types/cv.types";

interface Props {
  section: EducationSectionData;
  index: number;
}

export function EducationSection({ section, index }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);

  const updateItems = (items: EducationItem[]) => {
    updateSection(String(index), { items });
  };

  const updateItem = (itemId: string, patch: Partial<EducationItem>) => {
    const items = section.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    updateItems(items);
  };

  const addItem = () => {
    const newItem: EducationItem = {
      id: generateId(),
      institution: "",
      degree: "",
      period: "",
      gpa: "",
    };
    updateItems([...section.items, newItem]);
  };

  const removeItem = (itemId: string) => {
    updateItems(section.items.filter((item) => item.id !== itemId));
  };

  return (
    <div className="cv-item space-y-4">
      {section.items.map((item) => (
        <div key={item.id} className="relative group border border-gray-100 rounded-lg p-4 space-y-2">
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              label="حذف تحصیلات"
              onClick={() => removeItem(item.id)}
              size="sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>

          <div className="flex flex-wrap gap-2 items-baseline">
            <EditableText
              value={item.degree}
              onChange={(v) => updateItem(item.id, { degree: v })}
              placeholder="مقطع و رشته تحصیلی"
              className="font-semibold text-sm text-gray-900 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
            <span className="text-gray-400 text-xs">—</span>
            <EditableText
              value={item.institution}
              onChange={(v) => updateItem(item.id, { institution: v })}
              placeholder="نام دانشگاه / مؤسسه"
              className="text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <EditableText
              value={item.period}
              onChange={(v) => updateItem(item.id, { period: v })}
              placeholder="دوره زمانی"
              className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
            <EditableText
              value={item.gpa}
              onChange={(v) => updateItem(item.id, { gpa: v })}
              placeholder="معدل"
              className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        + افزودن تحصیلات
      </button>
    </div>
  );
}