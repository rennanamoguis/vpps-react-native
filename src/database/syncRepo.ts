import { migrateDbIfNeeded } from "@/src/database/migration";

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
    `SELECT COUNT(*) AS count FROM voters`,
  );

  const barangayRow = await db?.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM barangay`,
  );

  return {
    voters: Number(voterRow?.count ?? 0),
    barangays: Number(barangayRow?.count ?? 0),
  };
}

export async function beginPagedSync(
  barangays: { barangay_name: string | null }[],
) {
  const db = await migrateDbIfNeeded();

  const previouslySearched = await db?.getAllAsync<{ id: number }>(
    `SELECT id FROM voters WHERE searched = 1`,
  );

  const searchedIdSet = new Set(previouslySearched.map((row) => row.id));

  const cleanBarangays = Array.from(
    new Set(
      barangays
        .map((item) => String(item?.barangay_name ?? "").trim())
        .filter((name) => name !== ""),
    ),
  ).sort((a, b) => a.localeCompare(b));

  await db?.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM voters_staging`);
    await txn.runAsync(`DELETE FROM barangay_staging`);

    const barangayStmt = await txn.prepareAsync(`
      INSERT OR REPLACE INTO barangay_staging (barangay_name)
      VALUES (?)
    `);

    try {
      for (const barangayName of cleanBarangays) {
        await barangayStmt.executeAsync([barangayName]);
      }
    } finally {
      await barangayStmt.finalizeAsync();
    }
  });

  return searchedIdSet;
}

export async function insertVoterPageToStaging(
  voters: RemoteVoter[],
  searchedIdSet: Set<number>,
) {
  const db = await migrateDbIfNeeded();

  const safeVoters = voters
    .map((voter) => {
      const fullname = String(voter.fullname ?? "").trim();
      const municipalityName = String(voter.municipality_name ?? "").trim();
      const barangayName = String(voter.barangay_name ?? "").trim();

      return {
        ...voter,
        fullname,
        municipality_name: municipalityName,
        barangay_name: barangayName,
      };
    })
    .filter(
      (voter) =>
        voter.id != null &&
        voter.fullname !== "" &&
        voter.municipality_name !== "" &&
        voter.barangay_name !== "",
    );

  await db?.withExclusiveTransactionAsync(async (txn) => {
    const voterStmt = await txn.prepareAsync(`
      INSERT INTO voters_staging (
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
    `);

    try {
      for (const voter of safeVoters) {
        const localSearched =
          searchedIdSet.has(voter.id) || Number(voter.searched ?? 0) === 1
            ? 1
            : 0;

        await voterStmt.executeAsync([
          voter.id,
          voter.fullname,
          voter.municipality_name,
          voter.barangay_name,
          voter.precinct ?? "",
          voter.seq ?? "",
          voter.sitio ?? "",
          voter.priority_meaning ?? "",
          voter.verification ?? "",
          localSearched,
        ]);
      }
    } finally {
      await voterStmt.finalizeAsync();
    }
  });

  return safeVoters.length;
}

export async function finalizePagedSync(
  syncedAt: string,
  municipalityId: number,
) {
  const db = await migrateDbIfNeeded();

  await db?.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM voters`);
    await txn.runAsync(`DELETE FROM barangay`);

    await txn.runAsync(`
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
      SELECT
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
      FROM voters_staging
    `);

    await txn.runAsync(`
      INSERT INTO barangay (barangay_name)
      SELECT barangay_name
      FROM barangay_staging
    `);

    await txn.runAsync(
      `INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`,
      ["offlineMunicipalityId", String(municipalityId)],
    );

    await txn.runAsync(`DELETE FROM voters_staging`);
    await txn.runAsync(`DELETE FROM barangay_staging`);
  });

  return getLocalCounts();
}

export async function getOfflineMunicipalityId() {
  const db = await migrateDbIfNeeded();

  const row = await db?.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_meta WHERE key = ?`,
    ["offlineMunicipalityId"],
  );

  return row?.value ? Number(row.value) : null;
}

export async function clearOfflineData() {
  const db = await migrateDbIfNeeded();

  await db?.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(`DELETE FROM voters`);
    await txn.runAsync(`DELETE FROM barangay`);
    await txn.runAsync(`DELETE FROM voters_staging`);
    await txn.runAsync(`DELETE FROM barangay_staging`);
    await txn.runAsync(`DELETE FROM sync_meta`);
  });
}
