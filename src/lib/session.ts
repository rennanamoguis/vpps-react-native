import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS } from "../constants/storageKeys";

export type SessionUser = {
  id: number;
  firstname: string;
  middlename: string | null;
  lastname: string;
  nick_name: string | null;
  email: string;
  img: string | null;
  img_local_uri?: string | null;
  assigned_municipality: number;
  municipality_name: string | null;
  status: boolean;
};

export type SessionData = {
  token: string;
  expiresAt: string;
  user: SessionUser;
};

export async function saveSession(session: SessionData) {
  await SecureStore.setItemAsync(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export async function getStoredSession(): Promise<SessionData | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch (error) {
    return null;
  }
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION);
}

export function isSessionExpired(expiresAt: string) {
  return Date.now() >= new Date(expiresAt).getTime();
}
