import { useCVStore } from "../../store/cvStore";
import { ACCENT_COLORS } from "../../utils/defaults";

export function AccentColorPicker() {
  const accentColor = useCVStore((s) => s.document.accentColor);
  const setAccentColor = useCVStore((s) => s.setAccentColor);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-400">رنگ تأکیدی</span>

      <div className="flex flex-wrap gap-2">
        {ACCENT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setAccentColor(color)}
            className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
              accentColor === color ? "border-white" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
            aria-label={`رنگ ${color}`}
          />
        ))}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={accentColor}
          onChange={(e) => setAccentColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-gray-700 bg-transparent"
          aria-label="انتخاب رنگ دلخواه"
        />
        <span className="text-xs text-gray-500">{accentColor}</span>
      </div>
    </div>
  );
}