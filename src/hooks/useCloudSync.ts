import { useEffect, useRef, useCallback } from "react";
import type { User } from "firebase/auth";
import { subscribeToCVDoc, saveCVDoc } from "../services/firebase";
import { useCVStore } from "../store/cvStore";
import { useUIStore } from "../store/uiStore";
import type { CVFirestoreDoc } from "../types/firebase.types";
import type { CVDocument } from "../types/cv.types";

const APP_ID = "cv-builder";
const DEBOUNCE_MS = 2000;

function isDefaultDocument(doc: CVDocument): boolean {
  if (doc.sections.length !== 2) return false;
  if (doc.theme !== "modern") return false;
  if (doc.accentColor !== "#2563eb") return false;
  if (doc.fontSize !== 14) return false;

  const [first, second] = doc.sections;
  if (first.type !== "header") return false;
  if (second.type !== "summary") return false;

  const headerData = (first as { data: Record<string, string> }).data;
  if (!Object.values(headerData).every((v) => v === "")) return false;

  if ((second as { content: string }).content !== "") return false;

  return true;
}

export function useCloudSync(user: User | null) {
  const hydratedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docMetaRef = useRef<{ createdAt: number; version: number }>({
    createdAt: Date.now(),
    version: 0,
  });

  useEffect(() => {
    hydratedRef.current = false;
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCVDoc(
      user.uid,
      APP_ID,
      (data: CVFirestoreDoc) => {
        if (!hydratedRef.current) {
          hydratedRef.current = true;
          docMetaRef.current = {
            createdAt: data.createdAt,
            version: data.version,
          };

          const currentDoc = useCVStore.getState().document;
          if (isDefaultDocument(currentDoc)) {
            useCVStore.getState().loadDocument(data.document);
          }
        }
      },
      (err) => {
        console.error("Cloud sync subscription error:", err);
      }
    );

    return unsubscribe;
  }, [user]);

  const saveToCloud = useCallback(async () => {
    if (!user) return;

    const { setSaving, setLastSavedAt } = useUIStore.getState();
    setSaving(true);

    try {
      const document = useCVStore.getState().document;
      docMetaRef.current.version += 1;

      const firestoreDoc: CVFirestoreDoc = {
        ownerUid: user.uid,
        title: "My CV",
        document,
        createdAt: docMetaRef.current.createdAt,
        updatedAt: Date.now(),
        version: docMetaRef.current.version,
      };

      await saveCVDoc(user.uid, APP_ID, firestoreDoc);
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Failed to save to cloud:", err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = useCVStore.subscribe(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        saveToCloud();
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [user, saveToCloud]);

  return { saveToCloud };
}