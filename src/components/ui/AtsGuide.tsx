import { useState } from "react";

const ATS_TIPS = [
  {
    title: "Use Standard Section Titles",
    tip: "Stick to headings like \"Experience\", \"Education\", \"Skills\". Avoid creative or unusual titles.",
  },
  {
    title: "Avoid Images & Charts",
    tip: "ATS parsers cannot read images, tables, or graphics. Keep all content as plain text.",
  },
  {
    title: "Mirror Job Description Keywords",
    tip: "Incorporate exact keywords and phrases from the job posting naturally throughout your CV.",
  },
  {
    title: "Use Clear Job Titles",
    tip: "Use recognizable, industry-standard titles rather than internal company jargon.",
  },
  {
    title: "Quantify Achievements",
    tip: "Include measurable results: percentages, dollar amounts, team sizes, time saved.",
  },
  {
    title: "Use Consistent Date Formats",
    tip: "Pick one format (e.g., \"Jan 2022 – Present\") and use it throughout.",
  },
  {
    title: "Avoid Decorative Elements",
    tip: "Skip headers/footers, text boxes, columns, icons, and special characters.",
  },
  {
    title: "Keep Contact Info Readable",
    tip: "Place name, phone, and email at the top in plain text — not inside a header or footer.",
  },
  {
    title: "Keep It Concise",
    tip: "Aim for 1–2 pages. Remove irrelevant or outdated entries.",
  },
];

export function AtsGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="print:hidden">
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="ats-guide-panel fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-lg shadow-lg transition-colors hover:bg-gray-50"
        title={isOpen ? "Hide ATS Guide" : "Show ATS Guide"}
        aria-label={isOpen ? "Hide ATS Guide" : "Show ATS Guide"}
      >
        {isOpen ? "✕" : "📋"}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="ats-guide-panel fixed left-4 top-16 z-50 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl md:w-80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">ATS Optimization Guide</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 hidden text-xs text-gray-400 hover:text-gray-600 md:inline"
            >
              Collapse
            </button>
          </div>
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 md:max-h-[70vh]">
            {ATS_TIPS.map((item, i) => (
              <li key={i} className="text-xs leading-relaxed text-gray-600">
                <span className="mb-0.5 block font-semibold text-gray-800">
                  {item.title}
                </span>
                {item.tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}