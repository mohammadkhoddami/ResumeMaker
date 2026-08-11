import { create } from "zustand";

export interface UIStore {
  sidebarOpen: boolean;
  exporting: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  dragIndex: number | null;
  dragOverIndex: number | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
  setDragIndex: (index: number | null) => void;
  setDragOverIndex: (index: number | null) => void;
  resetDrag: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  exporting: false,
  saving: false,
  lastSavedAt: null,
  dragIndex: null,
  dragOverIndex: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setExporting: (exporting) => set({ exporting }),

  setSaving: (saving) => set({ saving }),

  setLastSavedAt: (date) => set({ lastSavedAt: date }),

  setDragIndex: (index) => set({ dragIndex: index }),

  setDragOverIndex: (index) => set({ dragOverIndex: index }),

  resetDrag: () => set({ dragIndex: null, dragOverIndex: null }),
}));