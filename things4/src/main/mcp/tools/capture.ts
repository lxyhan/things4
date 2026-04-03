import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

// Common action verbs that indicate a well-formed next action
const ACTION_VERBS = new Set([
  "add",
  "analyze",
  "approve",
  "ask",
  "attend",
  "book",
  "build",
  "buy",
  "call",
  "cancel",
  "check",
  "clean",
  "close",
  "collect",
  "compile",
  "complete",
  "confirm",
  "connect",
  "contact",
  "copy",
  "create",
  "debug",
  "define",
  "delete",
  "deploy",
  "design",
  "discuss",
  "do",
  "document",
  "download",
  "draft",
  "edit",
  "email",
  "explore",
  "file",
  "fill",
  "find",
  "finish",
  "follow",
  "forward",
  "get",
  "implement",
  "install",
  "investigate",
  "look",
  "make",
  "meet",
  "move",
  "notify",
  "open",
  "order",
  "organize",
  "pay",
  "pick",
  "plan",
  "prepare",
  "print",
  "process",
  "publish",
  "read",
  "record",
  "refactor",
  "remind",
  "remove",
  "reply",
  "report",
  "request",
  "research",
  "respond",
  "review",
  "run",
  "schedule",
  "search",
  "send",
  "set",
  "share",
  "sign",
  "start",
  "submit",
  "sync",
  "test",
  "transfer",
  "update",
  "upload",
  "verify",
  "write",
]);

// Vague verb patterns that indicate unclear next action
const VAGUE_VERB_PATTERN =
  /^(think\s+about|deal\s+with|handle|look\s+into|figure\s+out|sort\s+out|take\s+care\s+of|work\s+on)\b/i;

// Waiting-for pattern to auto-extract
const WAITING_FOR_PATTERN = /\bwaiting\s+(?:on|for)\s+(.+?)(?:[,.]|$)/i;

// Multiple-step indicators
const MULTI_STEP_PATTERN = /\b(and\s+then|first.*then|step\s+\d|part\s+\d)\b/i;

interface GtdAnalysis {
  title: string;
  waiting_for?: string;
  clarifications_needed?: string[];
}

function analyzeGtd(raw: string): GtdAnalysis {
  const trimmed = raw.trim();
  const clarifications: string[] = [];
  let title = trimmed;
  let waiting_for: string | undefined;

  // Rule: detect and extract "waiting on/for X"
  const waitingMatch = trimmed.match(WAITING_FOR_PATTERN);
  if (waitingMatch) {
    waiting_for = waitingMatch[1].trim();
    title = `Follow up with ${waiting_for}`;
  }

  // Rule: vague verb patterns → ask for concrete action
  if (VAGUE_VERB_PATTERN.test(title)) {
    clarifications.push(
      'What is the first specific physical action? (e.g., instead of "think about X", write "Open notes and list 3 options for X")',
    );
  }

  // Rule: title doesn't start with an action verb
  const firstWord = title
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!ACTION_VERBS.has(firstWord) && !VAGUE_VERB_PATTERN.test(title)) {
    clarifications.push(
      `"${title}" doesn't start with an action verb. What is the first physical action? (e.g., "File ${title}", "Buy ${title}", "Review ${title}")`,
    );
  }

  // Rule: multiple steps implied → suggest project
  const isLong = title.length > 80;
  if (MULTI_STEP_PATTERN.test(title) || isLong) {
    clarifications.push(
      "This sounds like a project. What is the first physical next action?",
    );
  }

  // Rule: deadline vs when_date ambiguity
  const hasDeadlinePhrase =
    /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[\/\-]\d)/i.test(
      raw,
    );
  const hasStartPhrase =
    /\b(on|starting|from)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/\-]\d)/i.test(
      raw,
    );
  if (hasDeadlinePhrase && hasStartPhrase) {
    clarifications.push(
      "Did you mean a deadline (must be done by this date) or a start date (when to begin working on it)?",
    );
  }

  return {
    title,
    waiting_for,
    clarifications_needed:
      clarifications.length > 0 ? clarifications : undefined,
  };
}

export function registerCaptureTools(
  server: McpServer,
  db: Database.Database,
): void {
  server.tool(
    "capture",
    "GTD-enforcing intake: parses raw text, enforces next-action rules, and captures to inbox",
    {
      raw: z.string().describe("Free-form text from the user"),
      context: z
        .string()
        .optional()
        .describe('Optional context (e.g., "in a meeting with Alice")'),
    },
    async ({ raw, context: _context }) => {
      const analysis = analyzeGtd(raw);

      // If there are blocking ambiguities, return clarifications without creating
      if (
        analysis.clarifications_needed &&
        analysis.clarifications_needed.length > 0
      ) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                title: analysis.title,
                clarifications_needed: analysis.clarifications_needed,
              }),
            },
          ],
        };
      }

      // Clean input — create the task
      const now = new Date().toISOString();
      const taskId = uuidv4();

      const stmt = db.prepare(`
        INSERT INTO tasks (id, title, status, waiting_for, waiting_since, position, created_at, updated_at)
        VALUES (?, ?, 'active', ?, ?, 0, ?, ?)
      `);

      stmt.run(
        taskId,
        analysis.title,
        analysis.waiting_for ?? null,
        analysis.waiting_for ? now : null,
        now,
        now,
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              task_id: taskId,
              title: analysis.title,
            }),
          },
        ],
      };
    },
  );
}
