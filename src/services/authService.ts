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
