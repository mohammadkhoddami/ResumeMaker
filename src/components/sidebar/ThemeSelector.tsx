import { useCVStore } from "../../store/cvStore";
import { THEMES } from "../../utils/defaults";
import type { ThemeId } from "../../types/cv.types";

const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function ThemeSelector() {
  const theme = useCVStore((s) => s.document.theme);
  const setTheme = useCVStore((s) => s.setTheme);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="theme-select" className="text-xs font-medium text-gray-400">
        قالب
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
      >
        {THEME_IDS.map((id) => (
          <option key={id} value={id}>
            {THEMES[id].name}
          </option>
        ))}
      </select>
    </div>
  );
}