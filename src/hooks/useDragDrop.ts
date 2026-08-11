import { useCallback } from "react";
import type { DragEvent } from "react";
import { useUIStore } from "../store/uiStore";
import { useCVStore } from "../store/cvStore";

export function useDragDrop() {
  const dragIndex = useUIStore((s) => s.dragIndex);
  const dragOverIndex = useUIStore((s) => s.dragOverIndex);
  const setDragIndex = useUIStore((s) => s.setDragIndex);
  const setDragOverIndex = useUIStore((s) => s.setDragOverIndex);
  const resetDrag = useUIStore((s) => s.resetDrag);
  const moveSection = useCVStore((s) => s.moveSection);

  const handleDragStart = useCallback(
    (index: number) => {
      setDragIndex(index);
    },
    [setDragIndex]
  );

  const handleDragOver = useCallback(
    (e: DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    [setDragOverIndex]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, [setDragOverIndex]);

  const handleDrop = useCallback(
    (e: DragEvent, toIndex: number) => {
      e.preventDefault();
      const fromIndex = useUIStore.getState().dragIndex;
      if (fromIndex !== null && fromIndex !== toIndex) {
        moveSection(fromIndex, toIndex);
      }
      resetDrag();
    },
    [moveSection, resetDrag]
  );

  const handleDragEnd = useCallback(() => {
    resetDrag();
  }, [resetDrag]);

  return {
    dragIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}