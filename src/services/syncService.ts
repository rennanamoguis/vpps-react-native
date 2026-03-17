import { API_BASE_URL } from "@/src/config/api";
import axios from "axios";

export type SyncMetaResponse = {
  municipalityId: number;
  syncedAt: string;
  totalVoters: number;
  pageSize: number;
  barangays: { barangay_name: string | null }[];
};

export type VoterPageResponse = {
  page: number;
  limit: number;
  count: number;
  voters: {
    id: number;
    fullname: string;
    municipality_name: string;
    barangay_name: string;
    precinct: string | null;
    seq: string | null;
    sitio: string | null;
    priority_meaning: string | null;
    verification: string | null;
    searched: number | boolean | null;
  }[];
};

export async function downloadSyncMeta(
  token: string,
): Promise<SyncMetaResponse> {
  const response = await axios.get(`${API_BASE_URL}/sync/meta`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 120000,
  });

  return response.data;
}

export async function downloadVoterPage(
  token: string,
  page: number,
  limit: number,
): Promise<VoterPageResponse> {
  const response = await axios.get(`${API_BASE_URL}/sync/voters`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { page, limit },
    timeout: 120000,
  });

  return response.data;
}
