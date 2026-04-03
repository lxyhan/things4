import type Database from "better-sqlite3";
import { SCHEMA_SQL } from "../schema";
import { insertSeedData } from "../seeds";

export function runInitialMigration(db: Database.Database): void {
  const tableExists = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'`,
    )
    .get();

  if (!tableExists) {
    db.exec(SCHEMA_SQL);
    insertSeedData(db);
  }
}
