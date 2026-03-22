import {
  cacheRemoteProfileImage,
  toAbsoluteImageUrl,
} from "@/src/lib/imgCache";
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
  type SessionUser,
} from "../lib/session";
import {
  loginWithEmailPassword,
  loginWithGoogleIdToken,
} from "../services/authService";

type SessionContextValue = {
  session: SessionData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadSession: () => Promise<void>;
  updateSessionUser: (partialUser: Partial<SessionUser>) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

async function attachCachedProfileImage(sessionData: SessionData) {
  const remoteUrl = toAbsoluteImageUrl(sessionData.user.img);

  if (!remoteUrl) {
    return sessionData;
  }

  const localUri = await cacheRemoteProfileImage(
    remoteUrl,
    sessionData.user.id,
  );

  return {
    ...sessionData,
    user: {
      ...sessionData.user,
      img_local_uri: localUri,
    },
  };
}

function getAssignedMunicipalityId(sessionData: SessionData): number | null {
  return sessionData.user.assigned_municipality ?? null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const ensureOfflineDataMatchesUser = async (
    assignedMunicipality: number | null,
  ) => {
    if (assignedMunicipality == null) return;

    const offlineMunicipalityId = await getOfflineMunicipalityId();

    if (
      offlineMunicipalityId != null &&
      offlineMunicipalityId !== assignedMunicipality
    ) {
      await clearOfflineData();
    }
  };

  const finalizeSession = async (result: SessionData) => {
    const assignedMunicipality = getAssignedMunicipalityId(result);

    await ensureOfflineDataMatchesUser(assignedMunicipality);

    const hydrated = await attachCachedProfileImage(result);

    await saveSession(hydrated);
    setSession(hydrated);
  };

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

  const signIn = async (email: string, password: string) => {
    const result = await loginWithEmailPassword(email, password);
    await finalizeSession(result);
  };

  const signInWithGoogle = async (idToken: string) => {
    const result = await loginWithGoogleIdToken(idToken);
    await finalizeSession(result);
  };

  const updateSessionUser = async (partialUser: Partial<SessionUser>) => {
    if (!session) return;

    const nextSession: SessionData = {
      ...session,
      user: {
        ...session.user,
        ...partialUser,
      },
    };

    await saveSession(nextSession);
    setSession(nextSession);
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
      signInWithGoogle,
      signOut,
      reloadSession,
      updateSessionUser,
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
