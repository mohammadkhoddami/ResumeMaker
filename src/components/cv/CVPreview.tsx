import React, { useEffect, useRef, useState } from "react";
import { useCVStore } from "../../store/cvStore";
import { useUIStore } from "../../store/uiStore";
import { useDragDrop } from "../../hooks/useDragDrop";
import { SectionRenderer } from "./SectionRenderer";
import { IconButton } from "../ui/IconButton";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export function CVPreview() {
  const document = useCVStore((s) => s.document);
  const removeSection = useCVStore((s) => s.removeSection);
  const moveSection = useCVStore((s) => s.moveSection);
  const exporting = useUIStore((s) => s.exporting);

  const { sections, fontSize, accentColor } = document;

  const {
    dragIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragDrop();

  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setContentHeight(el.scrollHeight);
    });
    observer.observe(el);
    setContentHeight(el.scrollHeight);

    return () => observer.disconnect();
  }, []);

  const pageBreaks: number[] = [];
  if (contentHeight > A4_HEIGHT_PX) {
    for (let y = A4_HEIGHT_PX; y < contentHeight; y += A4_HEIGHT_PX) {
      pageBreaks.push(y);
    }
  }

  return (
    <div className="flex justify-center bg-gray-200 py-10 px-4 min-h-screen" dir="rtl">
      <div
        ref={containerRef}
        className={`relative bg-white shadow-xl ${exporting ? "pdf-export" : ""}`}
        style={
          {
            width: `${A4_WIDTH_PX}px`,
            minHeight: `${A4_HEIGHT_PX}px`,
            fontSize: `${fontSize}px`,
            fontFamily: "'Vazirmatn', sans-serif",
            "--accent-color": accentColor,
          } as React.CSSProperties
        }
      >
        {!exporting &&
          pageBreaks.map((y, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none z-20 flex items-center"
              style={{ top: `${y - 3}px`, height: "6px" }}
            >
              <div className="w-full border-t-2 border-dashed border-red-400 opacity-60" />
            </div>
          ))}

        <div className="relative z-10 p-10 space-y-5">
          {sections.map((section, index) => {
            const isDragOver =
              dragOverIndex === index && dragIndex !== null && dragIndex !== index;
            const isDragging = dragIndex === index;

            return (
              <div
                key={index}
                draggable={!exporting}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group transition-opacity duration-150 ${
                  isDragging ? "opacity-40" : ""
                }`}
              >
                {isDragOver && (
                  <div
                    className="absolute -top-1 left-0 right-0 h-0.5 rounded-full z-30"
                    style={{ backgroundColor: accentColor }}
                  />
                )}

                {!exporting && (
                  <div className="absolute -left-10 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col items-center gap-0.5 z-30">
                    <IconButton
                      label="Move up"
                      onClick={() => moveSection(index, index - 1)}
                      disabled={index === 0}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label="Move down"
                      onClick={() => moveSection(index, index + 1)}
                      disabled={index === sections.length - 1}
                    >
                      ↓
                    </IconButton>
                    <IconButton
                      label="Delete section"
                      onClick={() => removeSection(String(index))}
                    >
                      ×
                    </IconButton>
                    <div
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 text-xs leading-none py-0.5 select-none"
                      title="Drag to reorder"
                    >
                      ⠿
                    </div>
                  </div>
                )}

                <SectionRenderer section={section} index={index} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}