import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../connection";
import type { Project } from "../../../types";

function parseProject(row: Record<string, unknown>): Project {
  return row as unknown as Project;
}

export interface ProjectWithProgress extends Project {
  total_tasks: number;
  completed_tasks: number;
  progress: number;
}

export function list(): ProjectWithProgress[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT p.*,
              COUNT(t.id) as total_tasks,
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id
       ORDER BY p.position ASC`,
    )
    .all() as (Record<string, unknown> & {
    total_tasks: number;
    completed_tasks: number;
  })[];

  return rows.map((row) => ({
    ...parseProject(row),
    total_tasks: row.total_tasks ?? 0,
    completed_tasks: row.completed_tasks ?? 0,
    progress:
      row.total_tasks > 0 ? (row.completed_tasks ?? 0) / row.total_tasks : 0,
  }));
}

export function get(id: string): Project | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return row ? parseProject(row as Record<string, unknown>) : null;
}

export interface CreateProjectInput {
  title: string;
  notes?: string | null;
  area_id?: string | null;
  when_date?: string | null;
  deadline?: string | null;
  position?: number;
}

export function create(input: CreateProjectInput): Project {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const maxRow = db
    .prepare("SELECT MAX(position) as maxPos FROM projects")
    .get() as { maxPos: number | null };
  const position = input.position ?? (maxRow.maxPos ?? 0) + 1;

  db.prepare(
    `
    INSERT INTO projects (id, title, notes, status, area_id, when_date, deadline, position, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    input.title,
    input.notes ?? null,
    input.area_id ?? null,
    input.when_date ?? null,
    input.deadline ?? null,
    position,
    now,
    now,
  );

  return get(id)!;
}

export interface UpdateProjectInput {
  title?: string;
  notes?: string | null;
  area_id?: string | null;
  when_date?: string | null;
  deadline?: string | null;
  status?: Project["status"];
}

export function update(id: string, input: UpdateProjectInput): Project | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    fields.push("title = ?");
    values.push(input.title);
  }
  if ("notes" in input) {
    fields.push("notes = ?");
    values.push(input.notes ?? null);
  }
  if ("area_id" in input) {
    fields.push("area_id = ?");
    values.push(input.area_id ?? null);
  }
  if ("when_date" in input) {
    fields.push("when_date = ?");
    values.push(input.when_date ?? null);
  }
  if ("deadline" in input) {
    fields.push("deadline = ?");
    values.push(input.deadline ?? null);
  }
  if (input.status !== undefined) {
    fields.push("status = ?");
    values.push(input.status);
  }

  if (fields.length === 0) return get(id);

  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return get(id);
}

export function complete(id: string): Project | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?",
  ).run(now, now, id);
  return get(id);
}

export function cancel(id: string): Project | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE projects SET status = 'cancelled', completed_at = ?, updated_at = ? WHERE id = ?",
  ).run(now, now, id);
  return get(id);
}

export function deleteProject(id: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}
