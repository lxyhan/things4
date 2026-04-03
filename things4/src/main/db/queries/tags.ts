import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../connection";
import type { Tag } from "../../../types";

export function list(): Tag[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM tags ORDER BY position ASC").all();
  return rows as Tag[];
}

export function get(id: string): Tag | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM tags WHERE id = ?").get(id);
  return (row as Tag) ?? null;
}

export interface CreateTagInput {
  name: string;
  shortcut?: string | null;
  color?: string | null;
  position?: number;
}

export function create(input: CreateTagInput): Tag {
  const db = getDatabase();
  const id = uuidv4();

  const maxRow = db
    .prepare("SELECT MAX(position) as maxPos FROM tags")
    .get() as { maxPos: number | null };
  const position = input.position ?? (maxRow.maxPos ?? 0) + 1;

  db.prepare(
    `
    INSERT INTO tags (id, name, shortcut, color, position)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(id, input.name, input.shortcut ?? null, input.color ?? null, position);

  return get(id)!;
}

export interface UpdateTagInput {
  name?: string;
  shortcut?: string | null;
  color?: string | null;
  position?: number;
}

export function update(id: string, input: UpdateTagInput): Tag | null {
  const db = getDatabase();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    values.push(input.name);
  }
  if ("shortcut" in input) {
    fields.push("shortcut = ?");
    values.push(input.shortcut ?? null);
  }
  if ("color" in input) {
    fields.push("color = ?");
    values.push(input.color ?? null);
  }
  if (input.position !== undefined) {
    fields.push("position = ?");
    values.push(input.position);
  }

  if (fields.length === 0) return get(id);

  values.push(id);
  db.prepare(`UPDATE tags SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return get(id);
}

export function deleteTag(id: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
}

export function attachToTask(tagId: string, taskId: string): void {
  const db = getDatabase();
  db.prepare(
    "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)",
  ).run(taskId, tagId);
}

export function detachFromTask(tagId: string, taskId: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?").run(
    taskId,
    tagId,
  );
}

export function attachToProject(tagId: string, projectId: string): void {
  const db = getDatabase();
  db.prepare(
    "INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)",
  ).run(projectId, tagId);
}

export function detachFromProject(tagId: string, projectId: string): void {
  const db = getDatabase();
  db.prepare(
    "DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?",
  ).run(projectId, tagId);
}

export function forTask(taskId: string): Tag[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT t.* FROM tags t
       INNER JOIN task_tags tt ON tt.tag_id = t.id
       WHERE tt.task_id = ?
       ORDER BY t.position ASC`,
    )
    .all(taskId);
  return rows as Tag[];
}
