import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type Database from "better-sqlite3";

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

export function registerViewTools(
  server: McpServer,
  db: Database.Database,
): void {
  // list_tasks — by GTD view
  server.tool(
    "list_tasks",
    "List tasks for a GTD view: inbox, today, upcoming, anytime, or logbook",
    {
      view: z.enum(["inbox", "today", "upcoming", "anytime", "logbook"]),
      tag: z.string().optional().describe("Filter by tag name"),
    },
    async ({ view, tag }) => {
      const today = new Date().toISOString().split("T")[0];

      let sql: string;
      const params: unknown[] = [];

      switch (view) {
        case "inbox":
          // Active tasks with no project and no area
          sql = `
            SELECT t.* FROM tasks t
            WHERE t.status = 'active'
              AND t.project_id IS NULL
              AND t.area_id IS NULL
              AND (t.when_date IS NULL OR t.when_date NOT IN ('someday'))
            ORDER BY t.position ASC, t.created_at ASC
          `;
          break;

        case "today":
          // Tasks scheduled for today/evening OR with overdue/today deadline
          sql = `
            SELECT t.* FROM tasks t
            WHERE t.status = 'active'
              AND (
                t.when_date IN ('today', 'evening')
                OR (t.deadline IS NOT NULL AND t.deadline <= ?)
              )
            ORDER BY
              CASE t.when_date WHEN 'evening' THEN 1 ELSE 0 END ASC,
              t.deadline ASC NULLS LAST,
              t.position ASC
          `;
          params.push(today);
          break;

        case "upcoming":
          // Tasks with a specific future ISO date
          sql = `
            SELECT t.* FROM tasks t
            WHERE t.status = 'active'
              AND t.when_date > ?
              AND t.when_date NOT IN ('today', 'evening', 'someday')
              AND t.when_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
            ORDER BY t.when_date ASC, t.position ASC
          `;
          params.push(today);
          break;

        case "anytime":
          // Active tasks with no blocking future start date, excluding someday
          sql = `
            SELECT t.* FROM tasks t
            WHERE t.status = 'active'
              AND t.when_date IS NOT 'someday'
              AND (
                t.when_date IS NULL
                OR t.when_date IN ('today', 'evening')
                OR (
                  t.when_date NOT IN ('someday')
                  AND t.when_date <= ?
                )
              )
            ORDER BY t.position ASC, t.updated_at DESC
          `;
          params.push(today);
          break;

        case "logbook":
          // Completed and cancelled tasks
          sql = `
            SELECT t.* FROM tasks t
            WHERE t.status IN ('completed', 'cancelled')
            ORDER BY t.completed_at DESC NULLS LAST, t.updated_at DESC
            LIMIT 200
          `;
          break;
      }

      // Optionally filter by tag
      let tasks: unknown[];
      if (tag) {
        const tagRow = db
          .prepare("SELECT id FROM tags WHERE name = ?")
          .get(tag) as { id: string } | undefined;
        if (!tagRow) {
          return ok([]);
        }
        // Wrap the view query to join with tags
        const taggedSql = `
          SELECT t.* FROM (${sql}) t
          WHERE t.id IN (
            SELECT task_id FROM task_tags WHERE tag_id = ?
          )
        `;
        tasks = db.prepare(taggedSql).all(...params, tagRow.id);
      } else {
        tasks = db.prepare(sql).all(...params);
      }

      return ok(tasks);
    },
  );

  // review_inbox
  server.tool(
    "review_inbox",
    "Get inbox state: count, oldest item, and GTD processing suggestions",
    {},
    async () => {
      const rows = db
        .prepare(
          `
        SELECT * FROM tasks
        WHERE status = 'active'
          AND project_id IS NULL
          AND area_id IS NULL
          AND (when_date IS NULL OR when_date NOT IN ('someday'))
        ORDER BY created_at ASC
      `,
        )
        .all() as Array<{ id: string; title: string; created_at: string }>;

      const count = rows.length;
      const oldest = rows[0] ?? null;

      const suggestions: string[] = [];

      if (count === 0) {
        suggestions.push("Inbox is empty. Well done.");
      } else if (count >= 10) {
        suggestions.push(
          `You have ${count} items in your inbox. Time for an inbox processing session.`,
        );
        suggestions.push(
          "For each item: assign to a project/area, set a when_date, or move to someday.",
        );
      } else {
        suggestions.push(
          `${count} item${count === 1 ? "" : "s"} waiting to be processed.`,
        );
      }

      if (oldest) {
        const ageDays = Math.floor(
          (Date.now() - new Date(oldest.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (ageDays >= 7) {
          suggestions.push(
            `Oldest item is ${ageDays} days old: "${oldest.title}". Consider processing it now.`,
          );
        }
      }

      return ok({ count, oldest, suggestions });
    },
  );

  // weekly_review
  server.tool(
    "weekly_review",
    "Full GTD weekly review surface: inbox, someday, projects without next action, overdue, waiting for",
    {},
    async () => {
      const today = new Date().toISOString().split("T")[0];

      const inboxCount = (
        db
          .prepare(
            `
          SELECT COUNT(*) as n FROM tasks
          WHERE status = 'active' AND project_id IS NULL AND area_id IS NULL
            AND (when_date IS NULL OR when_date NOT IN ('someday'))
        `,
          )
          .get() as { n: number }
      ).n;

      const somedayCount = (
        db
          .prepare(
            `
          SELECT COUNT(*) as n FROM tasks
          WHERE status = 'active' AND when_date = 'someday'
        `,
          )
          .get() as { n: number }
      ).n;

      // Projects without any active next action
      const allActiveProjects = db
        .prepare(
          `
        SELECT * FROM projects WHERE status = 'active'
      `,
        )
        .all() as Array<{ id: string; title: string }>;

      const projectsWithoutNextAction = allActiveProjects.filter((project) => {
        const hasNext = db
          .prepare(
            `
          SELECT 1 FROM tasks
          WHERE project_id = ? AND status = 'active'
          LIMIT 1
        `,
          )
          .get(project.id);
        return !hasNext;
      });

      const overdue = db
        .prepare(
          `
        SELECT * FROM tasks
        WHERE status = 'active'
          AND deadline IS NOT NULL
          AND deadline < ?
        ORDER BY deadline ASC
      `,
        )
        .all(today);

      const waitingFor = db
        .prepare(
          `
        SELECT * FROM tasks
        WHERE status = 'active'
          AND waiting_for IS NOT NULL
        ORDER BY waiting_since ASC NULLS LAST, created_at ASC
      `,
        )
        .all();

      return ok({
        inbox_count: inboxCount,
        someday_count: somedayCount,
        projects_without_next_action: projectsWithoutNextAction,
        overdue,
        waiting_for: waitingFor,
      });
    },
  );
}
