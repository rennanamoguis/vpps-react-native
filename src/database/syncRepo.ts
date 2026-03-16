import { migrateDbIfNeeded } from "./migration";

export type RemoteVoter = {
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
};

export type RemoteBarangay = {
  barangay_name: string;
};

export type SyncPayload = {
  municipalityId: number;
  syncedAt: string;
  voters: RemoteVoter[];
  barangays: RemoteBarangay[];
};

export async function getLastSyncAt() {
  const db = await migrateDbIfNeeded();

  const row = await db?.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_meta WHERE key = ?`,
    ["lastSyncAt"],
  );
  return row?.value ?? null;
}

export async function getLocalCounts() {
  const db = await migrateDbIfNeeded();
  const voterRow = await db?.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM barangay`,
  );

  const barangayRow = await db?.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM barangay`,
  );

  return {
    voters: voterRow?.count ?? 0,
    barangays: barangayRow?.count ?? 0,
  };
}

export async function replaceBootstrapData(
  payload: SyncPayload,
  onProgress?: (done: number, total: number) => void,
) {
  const db = await migrateDbIfNeeded();
  const previouslySearched = await db?.getAllAsync<{ id: number }>(
    `SELECT id FROM voters WHERE searched = 1`,
  );

  const searchedIdSet = new Set(previouslySearched?.map((row) => row.id));

  await db?.execAsync("BEGIN TRANSACTION");
  try {
    await db?.runAsync(`DELETE FROM voters`);
    await db?.runAsync(`DELETE FROM barangay`);

    for (let i = 0; i < payload.voters.length; i++) {
      const voter = payload.voters[i];

      const localSearched =
        searchedIdSet.has(voter.id) || Number(voter.searched ?? 0) === 1
          ? 1
          : 0;

      await db?.runAsync(
        `
                INSERT INTO voters (
                    id,
                    fullname,
                    municipality_name,
                    barangay_name,
                    precinct,
                    seq,
                    sitio,
                    priority_meaning,
                    verification,
                    searched
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
        [
          voter.id,
          voter.fullname,
          voter.municipality_name,
          voter.barangay_name,
          voter.precinct ?? "",
          voter.seq ?? "",
          voter.sitio ?? "",
          voter.priority_meaning ?? "",
          voter.verification ?? "",
          voter.verification ?? "",
          localSearched,
        ],
      );
      onProgress?.(i + 1, payload.voters.length);
    }
    for (const item of payload.barangays) {
      await db?.runAsync(
        `INSERT OR REPLACE INTO barangay (barangay_name) VALUES (?)`,
        [item.barangay_name],
      );
    }

    await db?.runAsync(
      `INSERT OR REPLACE INTO sync_met (key, value) VALUES (?, ?)`,
      ["lastSyncAt", payload.syncedAt],
    );

    await db?.execAsync("COMMIT");
  } catch (error) {
    await db?.execAsync("ROLLBACK");
    throw error;
  }
}
