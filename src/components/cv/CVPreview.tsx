import React, { useEffect, useRef, useState } from "react";
import { useCVStore } from "../../store/cvStore";
import { useUIStore } from "../../store/uiStore";
import { useDragDrop } from "../../hooks/useDragDrop";
import { SectionRenderer } from "./SectionRenderer";
import { IconButton } from "../ui/IconButton";
import { THEMES } from "../../utils/defaults";
import { computePageBreaks } from "../../services/pdfExport";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export function CVPreview() {
  const document = useCVStore((s) => s.document);
  const removeSection = useCVStore((s) => s.removeSection);
  const moveSection = useCVStore((s) => s.moveSection);
  const exporting = useUIStore((s) => s.exporting);

  const { sections, fontSize, accentColor, theme } = document;
  const themeConfig = THEMES[theme];

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [totalHeight, setTotalHeight] = useState(0);
  const [sectionBounds, setSectionBounds] = useState<{ top: number; bottom: number }[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    const contentEl = contentRef.current;
    if (!el || !contentEl) return;

    const measure = () => {
      const containerRect = el.getBoundingClientRect();
      const sectionEls = Array.from(contentEl.children) as HTMLElement[];

      const bounds = sectionEls.map((sec) => {
        const rect = sec.getBoundingClientRect();
        return {
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
        };
      });

      setSectionBounds(bounds);
      setTotalHeight(el.scrollHeight);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(contentEl);
    measure();

    return () => observer.disconnect();
  }, [sections.length]);

  const pageBreaks = computePageBreaks(sectionBounds, totalHeight);

  return (
    <div className="flex justify-center bg-gray-200 py-10 px-4 min-h-screen" dir="rtl">
      <div
        id="cv-preview"
        ref={containerRef}
        className={`relative shadow-xl ${exporting ? "pdf-export" : ""}`}
        style={
          {
            width: `${A4_WIDTH_PX}px`,
            minHeight: `${A4_HEIGHT_PX}px`,
            fontSize: `${fontSize}px`,
            fontFamily: themeConfig.fontFamily,
            backgroundColor: themeConfig.colors.background,
            color: themeConfig.colors.text,
            "--accent-color": accentColor,
            "--item-gap": `${themeConfig.spacing.itemGap}px`,
          } as React.CSSProperties
        }
      >
        {!exporting &&
          pageBreaks.map((y, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 pointer-events-none z-20 flex items-center print:hidden"
              style={{ top: `${y}px`, height: "0px" }}
            >
              <span className="absolute left-1 -top-4 text-[10px] font-medium text-red-500/80 select-none">
                Page {i + 2}
              </span>
              <div className="w-full border-t-[3px] border-dashed border-red-500/80" />
            </div>
          ))}

        <div
          ref={contentRef}
          className="relative z-10 p-10 flex flex-col"
          style={{ gap: `${themeConfig.spacing.sectionGap}px` }}
        >
          {sections.map((section, index) => {
            const isDragOver =
              dragOverIndex === index && dragIndex !== null && dragIndex !== index;
            const isDragging = dragIndex === index;

            return (
              <div
                key={section.id}
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

                <div className="flex items-start gap-1">
                  {!exporting && (
                    <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 print:hidden">
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
                        onClick={() => removeSection(section.id)}
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
                  <div className="flex-1 min-w-0">
                    <SectionRenderer section={section} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}