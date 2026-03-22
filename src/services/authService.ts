import axios from "axios";
import { API_BASE_URL } from "../config/api";
import type { SessionData } from "../lib/session";

export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<SessionData> {
  // const url = `${API_BASE_URL}/auth/login`;
  // console.log("LOGIN URL: ", url);
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
}

export async function getMe(token: string) {
  const response = await axios.get(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function loginWithGoogleIdToken(idToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  const rawText = await response.text();

  // console.log("GOOGLE LOGIN STATUS:", response.status);
  // console.log("GOOGLE LOGIN URL:", response.url);
  // console.log("GOOGLE LOGIN RAW RESPONSE:", rawText);

  let data: any = null;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (error) {
    throw new Error(
      `Expected JSON but got non-JSON response. Status: ${response.status}. Body starts with: ${rawText.slice(0, 120)}`,
    );
  }

  if (!response.ok) {
    throw new Error(data?.message || "Google login failed.");
  }

  return data;
}
