import { ipcMain } from "electron";
import { getDatabase } from "../db/connection";
import type { Task } from "../../types";

function parseTask(row: Record<string, unknown>): Task {
  return {
    ...row,
    checklist: row.checklist ? JSON.parse(row.checklist as string) : null,
    repeat_rule: row.repeat_rule ? JSON.parse(row.repeat_rule as string) : null,
  } as Task;
}

export function registerSearchHandlers(): void {
  ipcMain.handle("search:query", (_event, query: string) => {
    const db = getDatabase();
    const pattern = `%${query}%`;
    const rows = db
      .prepare(
        `SELECT * FROM tasks
         WHERE (title LIKE ? OR notes LIKE ?)
         ORDER BY updated_at DESC
         LIMIT 100`,
      )
      .all(pattern, pattern);
    return (rows as Record<string, unknown>[]).map(parseTask);
  });
}
