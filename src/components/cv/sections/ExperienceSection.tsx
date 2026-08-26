import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import { THEMES, getItemCardClasses } from "../../../utils/defaults";
import type { ExperienceSection as ExperienceSectionData, ExperienceItem } from "../../../types/cv.types";

interface Props {
  section: ExperienceSectionData;
}

export function ExperienceSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  const updateItems = (items: ExperienceItem[]) => {
    updateSection(section.id, { items });
  };

  const updateItem = (itemId: string, patch: Partial<ExperienceItem>) => {
    const items = section.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    updateItems(items);
  };

  const addItem = () => {
    const newItem: ExperienceItem = {
      id: generateId(),
      company: "",
      role: "",
      period: "",
      location: "",
      bullets: [""],
    };
    updateItems([...section.items, newItem]);
  };

  const removeItem = (itemId: string) => {
    updateItems(section.items.filter((item) => item.id !== itemId));
  };

  const addBullet = (itemId: string) => {
    const item = section.items.find((i) => i.id === itemId);
    if (!item) return;
    updateItem(itemId, { bullets: [...item.bullets, ""] });
  };

  const removeBullet = (itemId: string, bulletIndex: number) => {
    const item = section.items.find((i) => i.id === itemId);
    if (!item) return;
    const bullets = item.bullets.filter((_, i) => i !== bulletIndex);
    updateItem(itemId, { bullets });
  };

  const updateBullet = (itemId: string, bulletIndex: number, value: string) => {
    const item = section.items.find((i) => i.id === itemId);
    if (!item) return;
    const bullets = [...item.bullets];
    bullets[bulletIndex] = value;
    updateItem(itemId, { bullets });
  };

  return (
    <div className="cv-item" style={{ display: "flex", flexDirection: "column", gap: themeConfig.spacing.itemGap, color: themeConfig.colors.text }}>
      {section.items.map((item) => (
        <div key={item.id} className={`relative group space-y-2 ${getItemCardClasses(themeConfig.itemCardStyle)}`}>
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              label="حذف سابقه کاری"
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
              value={item.role}
              onChange={(v) => updateItem(item.id, { role: v })}
              placeholder="عنوان شغلی"
              className="font-semibold text-sm text-gray-900 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
            <span className="text-gray-400 text-xs">—</span>
            <EditableText
              value={item.company}
              onChange={(v) => updateItem(item.id, { company: v })}
              placeholder="نام شرکت"
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
              value={item.location}
              onChange={(v) => updateItem(item.id, { location: v })}
              placeholder="موقعیت مکانی"
              className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
              direction="rtl"
            />
          </div>

          <div className="space-y-1 mt-2">
            {item.bullets.map((bullet, bIdx) => (
              <div key={bIdx} className="cv-subbreak flex items-start gap-1.5 group/bullet">
                <span className="text-gray-400 text-xs mt-1 shrink-0">•</span>
                <EditableText
                  value={bullet}
                  onChange={(v) => updateBullet(item.id, bIdx, v)}
                  placeholder="توضیحات دستاورد یا وظیفه..."
                  className="text-sm text-gray-700 flex-1 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                  direction="rtl"
                />
                {item.bullets.length > 1 && (
                  <IconButton
                    label="حذف مورد"
                    onClick={() => removeBullet(item.id, bIdx)}
                    size="sm"
                    className="opacity-0 group-hover/bullet:opacity-100 transition-opacity shrink-0"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </IconButton>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addBullet(item.id)}
              className="cv-action-btn text-xs text-blue-500 hover:text-blue-700 transition-colors mt-1"
            >
              + افزودن مورد
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="cv-action-btn text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        + افزودن سابقه کاری
      </button>
    </div>
  );
}