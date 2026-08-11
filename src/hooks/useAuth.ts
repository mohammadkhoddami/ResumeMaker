import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { initFirebase, authenticateUser } from "../services/firebase";

interface UseAuthReturn {
  user: User | null;
  authError: string | null;
  isLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        const { auth } = initFirebase();

        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setIsLoading(false);
        });

        await authenticateUser();
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    }

    init();

    return () => {
      unsubscribe?.();
    };
  }, []);

  return { user, authError, isLoading };
}