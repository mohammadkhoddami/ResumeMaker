import { initializeApp, type App } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { CVFirestoreDoc } from "../types/firebase.types";
import type { FirebaseInstances } from "./firebase.types";

let instances: FirebaseInstances | null = null;

function getInstances(): FirebaseInstances {
  if (!instances) {
    throw new Error(
      "Firebase is not initialized. Call initFirebase() before using any Firebase service."
    );
  }
  return instances;
}

function resolveConfig(): Record<string, unknown> {
  const envConfig = import.meta.env.VITE_FIREBASE_CONFIG;
  if (typeof envConfig === "string" && envConfig.trim().length > 0) {
    try {
      return JSON.parse(envConfig);
    } catch {
      throw new Error(
        "VITE_FIREBASE_CONFIG is set but is not valid JSON. Ensure it is a properly escaped JSON string."
      );
    }
  }

  const globalConfig = (globalThis as Record<string, unknown>).__firebase_config;
  if (globalConfig && typeof globalConfig === "object") {
    return globalConfig as Record<string, unknown>;
  }

  throw new Error(
    "No Firebase configuration found. Provide it via VITE_FIREBASE_CONFIG env variable (JSON string) or the __firebase_config global."
  );
}

export function initFirebase(): FirebaseInstances {
  if (instances) {
    return instances;
  }

  const config = resolveConfig();
  const app: App = initializeApp(config);
  const auth: Auth = getAuth(app);
  const db: Firestore = getFirestore(app);

  instances = { app, auth, db };
  return instances;
}

export async function authenticateUser(): Promise<User> {
  const { auth } = getInstances();

  const token = (globalThis as Record<string, unknown>).__initial_auth_token;
  if (typeof token === "string" && token.length > 0) {
    const credential = await signInWithCustomToken(auth, token);
    return credential.user;
  }

  const anonCredential = await signInAnonymously(auth);
  return anonCredential.user;
}

function buildDocPath(userId: string, appId: string) {
  return `users/${userId}/apps/${appId}`;
}

export function subscribeToCVDoc(
  userId: string,
  appId: string,
  callback: (data: CVFirestoreDoc) => void,
  onError: (err: Error) => void
): () => void {
  const { db } = getInstances();

  const docRef = doc(db, buildDocPath(userId, appId));

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as CVFirestoreDoc);
      }
    },
    (error) => {
      onError(
        error instanceof Error
          ? error
          : new Error(`Firestore snapshot error: ${String(error)}`)
      );
    }
  );

  return unsubscribe;
}

export async function saveCVDoc(
  userId: string,
  appId: string,
  data: CVFirestoreDoc
): Promise<void> {
  const { db } = getInstances();

  const docRef = doc(db, buildDocPath(userId, appId));

  try {
    await setDoc(docRef, data);
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(`Failed to save CV document: ${String(error)}`);
  }
}