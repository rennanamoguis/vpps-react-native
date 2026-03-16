import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseSync("vpps.db");
  }
  return dbPromise;
}
