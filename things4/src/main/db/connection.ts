import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import { mkdirSync } from "fs";
import { runInitialMigration } from "./migrations/001_initial";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return db;
}

export function initializeDatabase(): void {
  const userDataPath = app.getPath("userData");
  mkdirSync(userDataPath, { recursive: true });

  const dbPath = join(userDataPath, "app.db");
  db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runInitialMigration(db);
}
