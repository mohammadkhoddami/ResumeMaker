import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import type { ProjectsSection as ProjectsSectionData, ProjectItem } from "../../../types/cv.types";

interface Props {
  section: ProjectsSectionData;
  index: number;
}

export function ProjectsSection({ section, index }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);

  const updateItems = (items: ProjectItem[]) => {
    updateSection(String(index), { items });
  };

  const updateItem = (itemId: string, patch: Partial<ProjectItem>) => {
    const items = section.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    updateItems(items);
  };

  const addItem = () => {
    const newItem: ProjectItem = {
      id: generateId(),
      name: "",
      link: "",
      description: "",
      tech: [],
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
              label="حذف پروژه"
              onClick={() => removeItem(item.id)}
              size="sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <EditableText
              value={item.name}
              onChange={(v) => updateItem(item.id, { name: v })}
              placeholder="نام پروژه"
              className="font-semibold text-sm text-gray-900 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
            <EditableText
              value={item.link}
              onChange={(v) => updateItem(item.id, { link: v })}
              placeholder="لینک"
              className="text-xs text-blue-500 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="ltr"
            />
          </div>

          <EditableText
            value={item.description}
            onChange={(v) => updateItem(item.id, { description: v })}
            placeholder="توضیح پروژه..."
            multiline
            className="text-sm text-gray-700 block outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 min-h-[2rem]"
            direction="rtl"
          />

          <EditableText
            value={item.tech.join(", ")}
            onChange={(v) => updateItem(item.id, { tech: v.split(",").map((t) => t.trim()).filter(Boolean) })}
            placeholder="تکنولوژی‌ها (با کاما جدا کنید)"
            className="text-xs text-gray-500 block outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
            direction="rtl"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        + افزودن پروژه
      </button>
    </div>
  );
}