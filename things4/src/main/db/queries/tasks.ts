import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../connection";
import type { Task } from "../../../types";
import { inbox, today, upcoming, anytime, logbook } from "./views";

function parseTask(row: Record<string, unknown>): Task {
  return {
    ...row,
    checklist: row.checklist ? JSON.parse(row.checklist as string) : null,
    repeat_rule: row.repeat_rule ? JSON.parse(row.repeat_rule as string) : null,
  } as Task;
}

export type ViewName = "inbox" | "today" | "upcoming" | "anytime" | "logbook";

export function listByView(view: ViewName): Task[] {
  switch (view) {
    case "inbox":
      return inbox();
    case "today":
      return today();
    case "upcoming":
      return upcoming();
    case "anytime":
      return anytime();
    case "logbook":
      return logbook();
  }
}

export function get(id: string): Task | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return row ? parseTask(row as Record<string, unknown>) : null;
}

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  checklist?: Task["checklist"];
  project_id?: string | null;
  area_id?: string | null;
  heading_id?: string | null;
  when_date?: string | null;
  reminder_time?: string | null;
  deadline?: string | null;
  waiting_for?: string | null;
  waiting_since?: string | null;
  repeat_rule?: Task["repeat_rule"];
  position?: number;
}

export function create(input: CreateTaskInput): Task {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  const maxRow = db
    .prepare("SELECT MAX(position) as maxPos FROM tasks")
    .get() as { maxPos: number | null };
  const position = input.position ?? (maxRow.maxPos ?? 0) + 1;

  db.prepare(
    `
    INSERT INTO tasks (
      id, title, notes, checklist, status,
      project_id, area_id, heading_id,
      when_date, reminder_time, deadline,
      waiting_for, waiting_since, repeat_rule,
      position, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, 'active',
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )
  `,
  ).run(
    id,
    input.title,
    input.notes ?? null,
    input.checklist ? JSON.stringify(input.checklist) : null,
    input.project_id ?? null,
    input.area_id ?? null,
    input.heading_id ?? null,
    input.when_date ?? null,
    input.reminder_time ?? null,
    input.deadline ?? null,
    input.waiting_for ?? null,
    input.waiting_since ?? null,
    input.repeat_rule ? JSON.stringify(input.repeat_rule) : null,
    position,
    now,
    now,
  );

  return get(id)!;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  checklist?: Task["checklist"];
  project_id?: string | null;
  area_id?: string | null;
  heading_id?: string | null;
  when_date?: string | null;
  reminder_time?: string | null;
  deadline?: string | null;
  waiting_for?: string | null;
  waiting_since?: string | null;
  repeat_rule?: Task["repeat_rule"];
}

export function update(id: string, input: UpdateTaskInput): Task | null {
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
  if ("checklist" in input) {
    fields.push("checklist = ?");
    values.push(input.checklist ? JSON.stringify(input.checklist) : null);
  }
  if ("project_id" in input) {
    fields.push("project_id = ?");
    values.push(input.project_id ?? null);
  }
  if ("area_id" in input) {
    fields.push("area_id = ?");
    values.push(input.area_id ?? null);
  }
  if ("heading_id" in input) {
    fields.push("heading_id = ?");
    values.push(input.heading_id ?? null);
  }
  if ("when_date" in input) {
    fields.push("when_date = ?");
    values.push(input.when_date ?? null);
  }
  if ("reminder_time" in input) {
    fields.push("reminder_time = ?");
    values.push(input.reminder_time ?? null);
  }
  if ("deadline" in input) {
    fields.push("deadline = ?");
    values.push(input.deadline ?? null);
  }
  if ("waiting_for" in input) {
    fields.push("waiting_for = ?");
    values.push(input.waiting_for ?? null);
  }
  if ("waiting_since" in input) {
    fields.push("waiting_since = ?");
    values.push(input.waiting_since ?? null);
  }
  if ("repeat_rule" in input) {
    fields.push("repeat_rule = ?");
    values.push(input.repeat_rule ? JSON.stringify(input.repeat_rule) : null);
  }

  if (fields.length === 0) return get(id);

  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values,
  );
  return get(id);
}

export function complete(id: string): Task | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?",
  ).run(now, now, id);
  return get(id);
}

export function cancel(id: string): Task | null {
  const db = getDatabase();
  const now = new Date().toISOString();
  db.prepare(
    "UPDATE tasks SET status = 'cancelled', completed_at = ?, updated_at = ? WHERE id = ?",
  ).run(now, now, id);
  return get(id);
}

export function deleteTask(id: string): void {
  const db = getDatabase();
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
}

export function move(
  id: string,
  beforeId: string | null,
  afterId: string | null,
): Task | null {
  const db = getDatabase();
  let newPosition: number;

  if (!beforeId && !afterId) {
    newPosition = 0;
  } else if (!beforeId) {
    const after = db
      .prepare("SELECT position FROM tasks WHERE id = ?")
      .get(afterId) as { position: number };
    newPosition = after.position - 1;
  } else if (!afterId) {
    const before = db
      .prepare("SELECT position FROM tasks WHERE id = ?")
      .get(beforeId) as { position: number };
    newPosition = before.position + 1;
  } else {
    const before = db
      .prepare("SELECT position FROM tasks WHERE id = ?")
      .get(beforeId) as { position: number };
    const after = db
      .prepare("SELECT position FROM tasks WHERE id = ?")
      .get(afterId) as { position: number };
    newPosition = (before.position + after.position) / 2;
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?").run(
    newPosition,
    now,
    id,
  );
  return get(id);
}
