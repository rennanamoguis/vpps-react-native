import axios from "axios";
import { API_BASE_URL } from "../config/api";
import type { SyncPayload } from "../database/syncRepo";

export async function downloadBootstrap(token: string): Promise<SyncPayload> {
  const response = await axios.get(`${API_BASE_URL}/sync/bootstrap`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
