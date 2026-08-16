import React from "react";
import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import { THEMES } from "../../../utils/defaults";
import type { SkillsSection as SkillsSectionData, SkillGroup } from "../../../types/cv.types";

interface Props {
  section: SkillsSectionData;
}

export function SkillsSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  const isAts = theme === "ats";

  const updateGroups = (groups: SkillGroup[]) => {
    updateSection(section.id, { groups });
  };

  const updateGroup = (groupId: string, patch: Partial<SkillGroup>) => {
    const groups = section.groups.map((g) =>
      g.id === groupId ? { ...g, ...patch } : g
    );
    updateGroups(groups);
  };

  const addGroup = () => {
    const newGroup: SkillGroup = {
      id: generateId(),
      label: "",
      items: "",
    };
    updateGroups([...section.groups, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    updateGroups(section.groups.filter((g) => g.id !== groupId));
  };

  return (
    <div className="cv-item" style={{ display: "flex", flexDirection: "column", gap: themeConfig.spacing.itemGap, color: themeConfig.colors.text }}>
      {section.groups.map((group) => (
        <div key={group.id} className={`relative group flex gap-3 ${isAts ? "flex-col gap-1" : "items-start"}`}>
          <div className={isAts ? "w-full" : "shrink-0 w-28"}>
            <EditableText
              value={group.label}
              onChange={(v) => updateGroup(group.id, { label: v })}
              placeholder="دسته‌بندی"
              className="text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 block"
              direction="rtl"
            />
          </div>
          <div className={isAts ? "w-full" : "flex-1"}>
            <EditableText
              value={group.items}
              onChange={(v) => updateGroup(group.id, { items: v })}
              placeholder="مهارت‌ها (با کاما جدا کنید)"
              className="text-sm text-gray-700 outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 block"
              direction="rtl"
            />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <IconButton
              label="حذف گروه"
              onClick={() => removeGroup(group.id)}
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
        onClick={addGroup}
        className="cv-action-btn text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        + افزودن گروه مهارت
      </button>
    </div>
  );
}