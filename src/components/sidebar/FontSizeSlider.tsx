import { useCVStore } from "../../store/cvStore";

export function FontSizeSlider() {
  const fontSize = useCVStore((s) => s.document.fontSize);
  const setFontSize = useCVStore((s) => s.setFontSize);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="font-size-slider" className="text-xs font-medium text-gray-400">
        اندازه فونت: {fontSize}px
      </label>
      <input
        id="font-size-slider"
        type="range"
        min={10}
        max={16}
        step={1}
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>10px</span>
        <span>16px</span>
      </div>
    </div>
  );
}