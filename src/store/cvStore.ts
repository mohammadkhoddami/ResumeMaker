import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CVDocument, CVSection, SectionType, ThemeId } from "../types/cv.types";
import {
  createDefaultDocument,
  createHeaderSection,
  createSummarySection,
  createExperienceSection,
  createEducationSection,
  createSkillsSection,
  createProjectsSection,
  createCertificationsSection,
  createLanguagesSection,
  createArticlesSection,
  createCustomSection,
} from "../utils/defaults";

const SECTION_FACTORIES: Record<SectionType, () => CVSection> = {
  header: createHeaderSection,
  summary: createSummarySection,
  experience: createExperienceSection,
  education: createEducationSection,
  skills: createSkillsSection,
  projects: createProjectsSection,
  certifications: createCertificationsSection,
  languages: createLanguagesSection,
  articles: createArticlesSection,
  custom: createCustomSection,
};

export interface CVStore {
  document: CVDocument;
  hydrated: boolean;
  setHydrated: (h: boolean) => void;
  updateSection: (id: string, patch: Partial<CVSection>) => void;
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  setTheme: (theme: ThemeId) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: number) => void;
  loadDocument: (doc: CVDocument) => void;
  resetDocument: () => void;
}

export const useCVStore = create<CVStore>()(
  persist(
    (set) => ({
      document: createDefaultDocument(),
      hydrated: false,

      setHydrated: (h) => set({ hydrated: h }),

      updateSection: (id, patch) =>
        set((state) => {
          const sections = state.document.sections.map((section) =>
            section.id === id ? { ...section, ...patch } : section
          );
          return { document: { ...state.document, sections } };
        }),

      addSection: (type) =>
        set((state) => {
          const newSection = SECTION_FACTORIES[type]();
          return {
            document: {
              ...state.document,
              sections: [...state.document.sections, newSection],
            },
          };
        }),

      removeSection: (id) =>
        set((state) => {
          const sections = state.document.sections.filter((section) => section.id !== id);
          return { document: { ...state.document, sections } };
        }),

      moveSection: (fromIndex, toIndex) =>
        set((state) => {
          const { sections } = state.document;
          if (
            fromIndex < 0 ||
            fromIndex >= sections.length ||
            toIndex < 0 ||
            toIndex >= sections.length
          ) {
            return state;
          }
          const reordered = [...sections];
          const [moved] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, moved);
          return { document: { ...state.document, sections: reordered } };
        }),

      setTheme: (theme) =>
        set((state) => ({
          document: { ...state.document, theme },
        })),

      setAccentColor: (color) =>
        set((state) => ({
          document: { ...state.document, accentColor: color },
        })),

      setFontSize: (size) =>
        set((state) => ({
          document: { ...state.document, fontSize: size },
        })),

      loadDocument: (doc) => set({ document: doc }),

      resetDocument: () => set({ document: createDefaultDocument() }),
    }),
    {
      name: "cv-builder-doc",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ document: state.document }),
    }
  )
);