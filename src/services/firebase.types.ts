import type { App } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

export interface FirebaseInstances {
  app: App;
  auth: Auth;
  db: Firestore;
}