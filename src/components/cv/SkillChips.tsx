import { useEffect, useRef, useState } from "react";
import { EditableText } from "../ui/EditableText";

interface SkillChipsProps {
  /** Comma-separated skills string; rendered as individual boxed chips. */
  value: string;
  onChange: (raw: string) => void;
  accentColor: string;
  /** Flat gray styling (used by the ATS-friendly theme). */
  neutral?: boolean;
  placeholder?: string;
}

function parseEntries(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim());
}

export function SkillChips({
  value,
  onChange,
  accentColor,
  neutral = false,
  placeholder = "مهارت",
}: SkillChipsProps) {
  const [adding, setAdding] = useState(false);
  const chips = parseEntries(value).filter(Boolean);

  const write = (next: string[]) => onChange(next.filter(Boolean).join(", "));

  const updateChip = (index: number, v: string) => {
    const next = [...chips];
    if (v) next[index] = v;
    else next.splice(index, 1);
    write(next);
  };

  const removeChip = (index: number) => {
    write(chips.filter((_, i) => i !== index));
  };

  const chipStyle = neutral
    ? { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" }
    : { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}59` };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((skill, i) => (
        <span
          key={`${skill}-${i}`}
          className="group/chip relative inline-flex items-center rounded-md border px-2 py-0.5"
          style={chipStyle}
        >
          <EditableText
            value={skill}
            onChange={(v) => updateChip(i, v)}
            placeholder={placeholder}
            className="text-xs text-gray-800 outline-none rounded px-0.5"
            direction="rtl"
            commitOn="blur"
          />
          <button
            type="button"
            onClick={() => removeChip(i)}
            className="cv-action-btn absolute -top-1.5 -left-1.5 hidden group-hover/chip:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-300 text-[9px] leading-none text-white hover:bg-red-400"
            aria-label="حذف مهارت"
          >
            ×
          </button>
        </span>
      ))}

      {adding ? (
        <PendingChip
          onCommit={(v) => {
            if (v) write([...chips, v]);
            setAdding(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="cv-action-btn px-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          + افزودن
        </button>
      )}
    </div>
  );
}

function PendingChip({ onCommit }: { onCommit: (v: string) => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-gray-300 px-2 py-0.5">
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-ph="مهارت جدید"
        role="textbox"
        dir="rtl"
        className="min-h-[1.5em] rounded px-0.5 text-xs text-gray-800 outline-none"
        onBlur={(e) => onCommit(e.currentTarget.innerText.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            e.currentTarget.innerText = "";
            e.currentTarget.blur();
          }
        }}
      />
    </span>
  );
}
