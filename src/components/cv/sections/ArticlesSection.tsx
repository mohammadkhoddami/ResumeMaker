import { useCVStore } from "../../../store/cvStore";
import { EditableText } from "../../ui/EditableText";
import { IconButton } from "../../ui/IconButton";
import { generateId } from "../../../utils/id";
import { THEMES, getItemCardClasses } from "../../../utils/defaults";
import type { ArticlesSection as ArticlesSectionData, ArticleItem } from "../../../types/cv.types";

interface Props {
  section: ArticlesSectionData;
}

export function ArticlesSection({ section }: Props) {
  const updateSection = useCVStore((s) => s.updateSection);
  const theme = useCVStore((s) => s.document.theme);
  const themeConfig = THEMES[theme];

  const updateItems = (items: ArticleItem[]) => {
    updateSection(section.id, { items });
  };

  const updateItem = (itemId: string, patch: Partial<ArticleItem>) => {
    const items = section.items.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    updateItems(items);
  };

  const addItem = () => {
    const newItem: ArticleItem = {
      id: generateId(),
      title: "",
      description: "",
      link: "",
    };
    updateItems([...section.items, newItem]);
  };

  const removeItem = (itemId: string) => {
    updateItems(section.items.filter((item) => item.id !== itemId));
  };

  return (
    <div className="cv-item" style={{ display: "flex", flexDirection: "column", gap: themeConfig.spacing.itemGap, color: themeConfig.colors.text }}>
      {section.items.map((item) => (
        <div key={item.id} className={`relative group space-y-2 ${getItemCardClasses(themeConfig.itemCardStyle)}`}>
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              label="حذف مقاله"
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
              value={item.title}
              onChange={(v) => updateItem(item.id, { title: v })}
              placeholder="عنوان مقاله"
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
            placeholder="توضیح مقاله..."
            multiline
            className="cv-subbreak text-sm text-gray-700 block outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 min-h-[2rem]"
            direction="rtl"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="cv-action-btn text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        + افزودن مقاله
      </button>
    </div>
  );
}
