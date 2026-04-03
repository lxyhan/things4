import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../connection";
import type { Area } from "../../../types";

export function list(): Area[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM areas ORDER BY position ASC").all();
  return rows as Area[];
}

export function get(id: string): Area | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM areas WHERE id = ?").get(id);
  return (row as Area) ?? null;
}

export interface CreateAreaInput {
  title: string;
  position?: number;
}

export function create(input: CreateAreaInput): Area {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const maxRow = db
    .prepare("SELECT MAX(position) as maxPos FROM areas")
    .get() as { maxPos: number | null };
  const position = input.position ?? (maxRow.maxPos ?? 0) + 1;

  db.prepare(
    `
    INSERT INTO areas (id, title, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(id, input.title, position, now, now);

  return get(id)!;
}

export interface UpdateAreaInput {
  title?: string;
  position?: number;
}

export function update(id: string, input: UpdateAreaInput): Area | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    fields.push("title = ?");
    values.push(input.title);
  }
  if (input.position !== undefined) {
    fields.push("position = ?");
    values.push(input.position);
  }

  if (fields.length === 0) return get(id);

  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE areas SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return get(id);
}

export function deleteArea(id: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM areas WHERE id = ?").run(id);
}
