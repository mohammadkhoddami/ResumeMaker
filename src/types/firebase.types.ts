import type { CVDocument } from "./cv.types";

export interface CVFirestoreDoc {
  ownerUid: string;
  title: string;
  document: CVDocument;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface AuthState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}