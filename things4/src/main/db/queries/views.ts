import { getDatabase } from "../connection";
import type { Task } from "../../../types";

function parseTask(row: Record<string, unknown>): Task {
  return {
    ...row,
    checklist: row.checklist ? JSON.parse(row.checklist as string) : null,
    repeat_rule: row.repeat_rule ? JSON.parse(row.repeat_rule as string) : null,
  } as Task;
}

// Inbox: active tasks not assigned to any project or area
export function inbox(): Task[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE status = 'active'
         AND project_id IS NULL
         AND area_id IS NULL
       ORDER BY position ASC`,
    )
    .all();
  return (rows as Record<string, unknown>[]).map(parseTask);
}

// Today: active tasks scheduled for today or evening, or with an overdue deadline
export function today(): Task[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE status = 'active'
         AND (when_date IN ('today', 'evening') OR deadline <= date('now'))
       ORDER BY position ASC`,
    )
    .all();
  return (rows as Record<string, unknown>[]).map(parseTask);
}

// Upcoming: active tasks with a specific future date (not today/evening/someday)
export function upcoming(): Task[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE status = 'active'
         AND when_date IS NOT NULL
         AND when_date NOT IN ('today', 'evening', 'someday')
         AND when_date > date('now')
       ORDER BY when_date ASC`,
    )
    .all();
  return (rows as Record<string, unknown>[]).map(parseTask);
}

// Anytime: active tasks without someday scheduling, excludes tasks in someday projects
export function anytime(): Task[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT t.* FROM tasks t
       WHERE t.status = 'active'
         AND (t.when_date IS NULL OR (t.when_date NOT IN ('someday') AND t.when_date <= date('now')))
         AND (
           t.project_id IS NULL
           OR t.project_id NOT IN (SELECT id FROM projects WHERE status = 'someday')
         )
       ORDER BY t.position ASC`,
    )
    .all();
  return (rows as Record<string, unknown>[]).map(parseTask);
}

// Logbook: completed and cancelled tasks, most recent first
export function logbook(): Task[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE status IN ('completed', 'cancelled')
       ORDER BY completed_at DESC`,
    )
    .all();
  return (rows as Record<string, unknown>[]).map(parseTask);
}
