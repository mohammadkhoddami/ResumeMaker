import { useCVStore } from "../../store/cvStore";
import { SECTION_LABELS } from "../../utils/defaults";
import type { SectionType } from "../../types/cv.types";

const SECTION_TYPES = Object.keys(SECTION_LABELS) as SectionType[];

export function SectionAdder() {
  const addSection = useCVStore((s) => s.addSection);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-400">افزودن بخش</span>
      <div className="grid grid-cols-2 gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className="rounded-md border border-gray-700 bg-gray-800 px-2 py-2 text-xs text-gray-200 transition-colors hover:bg-gray-700 hover:text-white"
          >
            {SECTION_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}