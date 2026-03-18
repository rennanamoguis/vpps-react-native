import { migrateDbIfNeeded } from "@/src/database/migration";
import { getDb } from "@/src/database/sqlite";

export type BarangayRow = {
  barangay_name: string;
};

export type VoterRow = {
  id: number;
  fullname: string;
  municipality_name: string;
  barangay_name: string;
  precinct: string;
  seq: string;
  sitio: string;
  priority_meaning: string;
  verification: string;
  searched: number;
};

export async function getBarangays(): Promise<BarangayRow[]> {
  const db = await getDb();
  await migrateDbIfNeeded();

  return db.getAllAsync<BarangayRow>(
    `
    SELECT barangay_name
    FROM barangay
    ORDER BY barangay_name ASC
    `,
  );
}

export async function getLocalSearchSummary() {
  const db = await getDb();
  await migrateDbIfNeeded();

  const voterCountRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM voters`,
  );

  const barangayCountRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM barangay`,
  );

  return {
    voters: Number(voterCountRow?.count ?? 0),
    barangays: Number(barangayCountRow?.count ?? 0),
  };
}

export async function getVoterCountForBarangay(barangayName: string) {
  const db = await getDb();
  await migrateDbIfNeeded();

  const row = await db.getFirstAsync<{ count: number }>(
    `
    SELECT COUNT(*) AS count
    FROM voters
    WHERE LOWER(TRIM(barangay_name)) = LOWER(TRIM(?))
    `,
    [barangayName.trim()],
  );

  return Number(row?.count ?? 0);
}

export async function searchVotersByBarangayAndFullname(
  barangayName: string,
  keyword: string,
): Promise<VoterRow[]> {
  const db = await getDb();
  await migrateDbIfNeeded();

  const cleanBarangay = barangayName.trim();
  const cleanKeyword = keyword.trim().toLowerCase();

  const rows = await db.getAllAsync<VoterRow>(
    `
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
    FROM voters
    WHERE LOWER(TRIM(barangay_name)) = LOWER(TRIM(?))
      AND LOWER(COALESCE(fullname, '')) LIKE ?
    ORDER BY fullname ASC
    LIMIT 100
    `,
    [cleanBarangay, `%${cleanKeyword}%`],
  );

  console.log("LOCAL SEARCH DEBUG:", {
    barangay: cleanBarangay,
    keyword: cleanKeyword,
    resultCount: rows.length,
  });

  return rows;
}

export async function markVoterSearched(voterId: number) {
  const db = await getDb();
  await migrateDbIfNeeded();

  await db.runAsync(
    `
    UPDATE voters
    SET searched = 1
    WHERE id = ?
      AND searched = 0
    `,
    [voterId],
  );
}
