import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

function ok(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
  }
}

export function registerProjectTools(server: McpServer, db: Database.Database): void {
  // create_project
  server.tool(
    'create_project',
    'Create a new project',
    {
      title: z.string(),
      area_id: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ title, area_id, notes }) => {
      const now = new Date().toISOString()
      const projectId = uuidv4()

      db.prepare(`
        INSERT INTO projects (id, title, notes, status, area_id, position, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, 0, ?, ?)
      `).run(projectId, title, notes ?? null, area_id ?? null, now, now)

      return ok({
        project_id: projectId,
        title,
      })
    }
  )

  // list_projects
  server.tool(
    'list_projects',
    'List projects, optionally filtered by status',
    {
      status: z
        .enum(['active', 'completed', 'cancelled', 'someday'])
        .optional()
        .describe('Filter by project status (default: active)'),
    },
    async ({ status }) => {
      const filterStatus = status ?? 'active'
      const projects = db.prepare(`
        SELECT * FROM projects WHERE status = ? ORDER BY position ASC, created_at ASC
      `).all(filterStatus)

      return ok(projects)
    }
  )
}
