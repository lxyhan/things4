import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

function err(message: string) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ error: message }) },
    ],
  };
}

export function registerTaskTools(
  server: McpServer,
  db: Database.Database,
): void {
  // create_task
  server.tool(
    "create_task",
    "Create a task directly (title must be a physical next action)",
    {
      title: z.string(),
      notes: z.string().optional(),
      project_id: z.string().optional(),
      area_id: z.string().optional(),
      when_date: z.string().optional(),
      deadline: z.string().optional(),
      waiting_for: z.string().optional(),
      waiting_since: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({
      title,
      notes,
      project_id,
      area_id,
      when_date,
      deadline,
      waiting_for,
      waiting_since,
      tags,
    }) => {
      const now = new Date().toISOString();
      const taskId = uuidv4();

      db.prepare(
        `
        INSERT INTO tasks (id, title, notes, status, project_id, area_id, when_date, deadline,
          waiting_for, waiting_since, position, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `,
      ).run(
        taskId,
        title,
        notes ?? null,
        project_id ?? null,
        area_id ?? null,
        when_date ?? null,
        deadline ?? null,
        waiting_for ?? null,
        waiting_since ?? null,
        now,
        now,
      );

      if (tags && tags.length > 0) {
        const getOrCreateTag = db.prepare(`
          INSERT OR IGNORE INTO tags (id, name, position, created_at, updated_at)
          VALUES (?, ?, 0, ?, ?)
        `);
        const linkTag = db.prepare(`
          INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)
        `);
        const findTag = db.prepare("SELECT id FROM tags WHERE name = ?");

        for (const tagName of tags) {
          const existing = findTag.get(tagName) as { id: string } | undefined;
          let tagId: string;
          if (existing) {
            tagId = existing.id;
          } else {
            tagId = uuidv4();
            getOrCreateTag.run(tagId, tagName, now, now);
          }
          linkTag.run(taskId, tagId);
        }
      }

      return ok({ task_id: taskId });
    },
  );

  // get_task
  server.tool(
    "get_task",
    "Get a single task by ID",
    { id: z.string() },
    async ({ id }) => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) return err(`Task not found: ${id}`);
      return ok(task);
    },
  );

  // update_task
  server.tool(
    "update_task",
    "Update task fields",
    {
      id: z.string(),
      title: z.string().optional(),
      notes: z.string().nullable().optional(),
      project_id: z.string().nullable().optional(),
      area_id: z.string().nullable().optional(),
      when_date: z.string().nullable().optional(),
      deadline: z.string().nullable().optional(),
      waiting_for: z.string().nullable().optional(),
      waiting_since: z.string().nullable().optional(),
    },
    async ({ id, ...fields }) => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) return err(`Task not found: ${id}`);

      const updates: string[] = [];
      const values: unknown[] = [];

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) return ok(task);

      updates.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(
        ...values,
      );

      return ok(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
    },
  );

  // complete_task
  server.tool(
    "complete_task",
    "Mark a task as completed",
    { id: z.string() },
    async ({ id }) => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) return err(`Task not found: ${id}`);

      const now = new Date().toISOString();
      db.prepare(
        `
        UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?
      `,
      ).run(now, now, id);

      return ok(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
    },
  );

  // cancel_task
  server.tool(
    "cancel_task",
    "Mark a task as cancelled",
    { id: z.string() },
    async ({ id }) => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) return err(`Task not found: ${id}`);

      const now = new Date().toISOString();
      db.prepare(
        `
        UPDATE tasks SET status = 'cancelled', completed_at = ?, updated_at = ? WHERE id = ?
      `,
      ).run(now, now, id);

      return ok(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
    },
  );

  // move_task
  server.tool(
    "move_task",
    "Move a task to a different project or area",
    {
      id: z.string(),
      project_id: z.string().nullable().optional(),
      area_id: z.string().nullable().optional(),
    },
    async ({ id, project_id, area_id }) => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) return err(`Task not found: ${id}`);

      const now = new Date().toISOString();
      db.prepare(
        `
        UPDATE tasks SET project_id = ?, area_id = ?, updated_at = ? WHERE id = ?
      `,
      ).run(
        project_id !== undefined
          ? project_id
          : (task as { project_id: string | null }).project_id,
        area_id !== undefined
          ? area_id
          : (task as { area_id: string | null }).area_id,
        now,
        id,
      );

      return ok(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
    },
  );

  // schedule_task
  server.tool(
    "schedule_task",
    "Set when date and/or deadline for a task",
    {
      id: z.string(),
      when_date: z.string().nullable(),
      deadline: z.string().nullable().optional(),
    },
    async ({ id, when_date, deadline }) => {
      const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
      if (!task) return err(`Task not found: ${id}`);

      const now = new Date().toISOString();
      const updates: string[] = ["when_date = ?", "updated_at = ?"];
      const values: unknown[] = [when_date, now];

      if (deadline !== undefined) {
        updates.splice(1, 0, "deadline = ?");
        values.splice(1, 0, deadline);
      }

      values.push(id);
      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(
        ...values,
      );

      return ok(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id));
    },
  );

  // search
  server.tool(
    "search",
    "Search tasks by text in title and notes",
    { query: z.string() },
    async ({ query }) => {
      const pattern = `%${query}%`;
      const tasks = db
        .prepare(
          `
        SELECT * FROM tasks
        WHERE (title LIKE ? OR notes LIKE ?) AND status != 'cancelled'
        ORDER BY status ASC, updated_at DESC
        LIMIT 50
      `,
        )
        .all(pattern, pattern);

      return ok(tasks);
    },
  );
}
