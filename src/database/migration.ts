import { getDb } from "@/src/database/sqlite";

const DATABASE_VERSION = 3;

export async function migrateDbIfNeeded() {
  const db = await getDb();

  const row = await db?.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return db;
  }

  await db?.execAsync(`
        PRAGMA journale_mode = WAL;

            CREATE TABLE IF NOT EXISTS voters (
                id INTEGER PRIMARY KEY NOT NULL,
                fullname TEXT NOT NULL,
                municipality_name TEXT NOT NULL,
                barangay_name TEXT NOT NULL,
                precinct TEXT,
                seq TEXT,
                sitio TEXT,
                priority_meaning TEXT,
                verification TEXT,
                searched INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS barangay (
                barangay_name TEXT PRIMARY KEY NOT NULL
            );

            CREATE TABLE IF NOT EXISTS voters_staging (
              id INTEGER PRIMARY KEY NOT NULL,
              fullname TEXT NOT NULL,
              municipality_name TEXT NOT NULL,
              barangay_name TEXT NOT NULL,
              precinct TEXT,
              seq TEXT,
              sitio TEXT,
              priority_meaning TEXT,
              verification TEXT,
              searched INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS barangay_staging (
              barangay_name TEXT PRIMARY KEY NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sync_meta (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_voters_fullname ON voters(fullname);

            CREATE INDEX IF NOT EXISTS idx_voters_barangay ON voters(barangay_name);

            CREATE INDEX IF NOT EXISTS idx_voters_staging_fullname ON voters_staging(fullname);

            CREATE INDEX IF NOT EXISTS idx_voters_stating_barangay ON voters_staging(barangay_name);

        PRAGMA user_version = 3;
        `);

  return db;
}
