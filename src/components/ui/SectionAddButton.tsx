import React from "react";

export interface SectionAddButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function SectionAddButton({
  label,
  onClick,
  className = "",
}: SectionAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-lg border-2 border-dashed border-gray-300
        px-4 py-2.5 text-sm font-medium text-gray-500
        transition-colors duration-150
        hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
        ${className}
      `.trim()}
    >
      <span className="inline-flex items-center gap-1.5">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {label}
      </span>
    </button>
  );
}