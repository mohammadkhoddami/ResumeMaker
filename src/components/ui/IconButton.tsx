import React from "react";

export interface IconButtonProps {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function IconButton({
  children,
  onClick,
  label,
  disabled = false,
  className = "",
  size = "sm",
}: IconButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "h-6 w-6 text-xs"
      : "h-8 w-8 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`
        inline-flex items-center justify-center rounded
        text-gray-400 transition-colors duration-150
        hover:text-gray-700 hover:bg-gray-100
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
        disabled:opacity-30 disabled:pointer-events-none
        ${sizeClasses}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
}