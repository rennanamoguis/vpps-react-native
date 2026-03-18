import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearOfflineData,
  getOfflineMunicipalityId,
} from "../database/syncRepo";
import {
  clearSession,
  getStoredSession,
  isSessionExpired,
  saveSession,
  type SessionData,
} from "../lib/session";
import { loginWithEmailPassword } from "../services/authService";

type SessionContextValue = {
  session: SessionData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadSession = async () => {
    setIsLoading(true);

    const stored = await getStoredSession();

    if (!stored || isSessionExpired(stored.expiresAt)) {
      await clearSession();
      setSession(null);
      setIsLoading(false);
      return;
    }

    setSession(stored);
    setIsLoading(false);
  };

  useEffect(() => {
    reloadSession();
  }, []);

  const ensureOfflineDataMatchesUser = async (assignedMunicipality: number) => {
    const offlineMunicipalityId = await getOfflineMunicipalityId();
    if (
      offlineMunicipalityId != null &&
      offlineMunicipalityId !== assignedMunicipality
    ) {
      await clearOfflineData();
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await loginWithEmailPassword(email, password);

    await ensureOfflineDataMatchesUser(result.user.assigned_municipality);

    await saveSession(result);
    setSession(result);
  };

  const signOut = async () => {
    await clearSession();
    setSession(null);
  };

  const value = useMemo(
    () => ({
      session,
      isLoading,
      signIn,
      signOut,
      reloadSession,
    }),
    [session, isLoading],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
