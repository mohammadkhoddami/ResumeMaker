import React, { useRef, useEffect, useCallback } from "react";

export interface EditableTextProps {
  value: string;
  onChange: (text: string) => void;
  tag?: keyof React.JSX.IntrinsicElements;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  direction?: "ltr" | "rtl" | "auto";
  /** "input" (default) fires onChange on every keystroke; "blur" only on blur/Enter. */
  commitOn?: "input" | "blur";
}

export function EditableText({
  value,
  onChange,
  tag = "span",
  placeholder = "",
  multiline = false,
  className,
  style,
  direction,
  commitOn = "input",
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isFocusedRef.current && el.innerText !== value) {
      el.innerText = value;
    }
  }, [value]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    const el = ref.current;
    if (!el) return;
    const trimmed = el.innerText.trim();
    if (trimmed !== value) {
      onChange(trimmed);
    }
    if (el.innerText !== trimmed) {
      el.innerText = trimmed;
    }
  }, [onChange, value]);

  const handleInput = useCallback(() => {
    if (commitOn === "blur") return;
    const el = ref.current;
    if (!el) return;
    onChange(el.innerText);
  }, [onChange, commitOn]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    [multiline]
  );

  const computedClassName = [
    className,
    !className?.includes("min-h") && "min-h-[1.5em]",
  ]
    .filter(Boolean)
    .join(" ");

  return React.createElement(tag, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    className: computedClassName,
    style,
    dir: direction,
    "data-ph": placeholder || undefined,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    role: "textbox",
    "aria-multiline": multiline,
    "aria-placeholder": placeholder || undefined,
  });
}