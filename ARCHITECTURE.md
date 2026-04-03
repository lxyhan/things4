# Architecture: things4

> Status: APPROVED — implementation plan in Section 17.

---

## 1. Overview

A desktop GTD task manager that clones Things 3's design and UX as faithfully as possible,
built on a fully LLM-friendly local SQLite store, with a local MCP server as the primary
interaction layer for Claude Code.

**The model:** The Electron app is the *view*. Claude is the *input layer*.
You browse, review, and occasionally edit in the app. You capture, organize, and process
through Claude, who knows your profile, applies GTD judgment, and enforces system hygiene.

**App name:** things4

**Stack:** Electron · React 18 · TypeScript 5 (strict) · better-sqlite3 · Zustand · electron-vite · CSS Modules · MCP SDK

---

## 2. Design Philosophy (from Things 3)

These principles govern every UI decision:

- **Restraint over configurability.** The app makes choices so the user doesn't have to.
- **Progressive disclosure.** Tasks are plain text in the list; they expand in-place as a card when opened. No modals.
- **Keyboard-first.** Every action has a shortcut. Scheduling, completion, navigation — all without a mouse.
- **Visual noise suppression.** Empty containers are hidden. Someday items disappear from active views. Logbook is separate.
- **Two date types, never conflated.** `when` (start date) vs `deadline` (due date). Separate fields, separate pickers, separate visual treatments.
- **Inbox → Today → Logbook.** The daily rhythm is the core UX loop. Everything else supports it.

---

## 3. Information Architecture

```
Areas  (permanent life domains — no completion state)
  └── Projects  (bounded initiatives with a defined outcome)
        └── Headings  (section dividers, project-only)
              └── Tasks  (single actionable items)
                    └── Checklist Items  (flat sub-steps, stored inline)
```

### Areas
- Represent ongoing domains: Health, Work, Finance, Family
- **No completion state** — they exist permanently
- Can contain Projects and loose Tasks
- Tags applied to an area are inherited by children (tracked in DB, hidden from display)
- No `when` date, no deadline

### Projects
- Any outcome requiring more than one action (GTD definition)
- States: `active` | `completed` | `cancelled` | `someday`
- Have: title, notes (markdown), area, tags, `when_date` (deferred start), deadline, headings, tasks
- Sidebar shows a progress pie (completion %, derived from tasks)
- Future `when_date` → project is "upcoming" (hidden from sidebar until date arrives)
- `someday` status → hidden from all active views

### Headings
- Section dividers within a project only
- Moving a heading moves all tasks beneath it
- Can be promoted to an independent project

### Tasks
Full field list — see Section 5.

### Checklist Items
- Ordered sub-steps stored as JSON inside the task row (no separate table)
- Not full tasks: no dates, no tags, no nesting
- Paste multi-line text into a task's checklist area → each line becomes a checklist item

---

## 4. Views (Sidebar)

Five fixed views. No custom perspectives. Cmd+1 through Cmd+5.

| # | View | Contents |
|---|------|----------|
| 1 | **Inbox** | Tasks with no project AND no area, status=active |
| 2 | **Today** | Tasks where `when_date` IN ('today','evening') OR deadline ≤ today OR repeating task due today |
| 3 | **Upcoming** | Tasks/projects with a specific future ISO `when_date`, ordered chronologically |
| 4 | **Anytime** | All active tasks/projects with no future start date blocking them |
| 5 | **Logbook** | Completed and cancelled items, ordered by `completed_at` descending |

### No Someday View

Deliberate divergence from Things 3. `when_date='someday'` / `status='someday'` exist in the data model
but have no sidebar home. Someday items live in-place within their parent Area or Project.
Accessible via search (Cmd+F), tag filter, or direct area/project browsing.

### Today View Details
- Top: calendar events for today (read-only, if OS calendar integration enabled)
- Main section: tasks scheduled for today
- **This Evening** section: `when_date = 'evening'`; collapsed by default; moon icon indicator
- Overdue deadlines auto-appear (red `#FF3B30`)
- Deadlines today auto-appear (orange `#FF9500`)
- No automatic rollover — user must consciously reschedule

### Upcoming View Details
- First 7 days listed individually with large bold day headers (SF Pro Display Bold ~22pt)
- Beyond 7 days: grouped by week, then month (month headers ~34pt)
- Drag task to different day to reschedule
- Calendar events appear inline (read-only)

### Anytime View Details
- Active tasks/projects not blocked by future `when_date`, not in someday state
- Items already in Today appear with a yellow star marker (`#FFCC00`)
- Organized under parent project/area headers
- Empty containers hidden
- Filterable by tag

---

## 5. Data Model

### Task Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (TEXT) | Stable identifier, never recycled |
| `title` | TEXT | The action-oriented task name |
| `notes` | TEXT | Markdown-formatted notes |
| `checklist` | TEXT (JSON) | `[{id, title, completed}]` — flat sub-steps |
| `status` | TEXT | `active` \| `completed` \| `cancelled` |
| `project_id` | TEXT \| NULL | FK → projects.id |
| `area_id` | TEXT \| NULL | FK → areas.id (loose task under area) |
| `heading_id` | TEXT \| NULL | FK → headings.id |
| `when_date` | TEXT \| NULL | `null` \| `'today'` \| `'evening'` \| ISO date \| `'someday'` |
| `reminder_time` | TEXT \| NULL | `HH:MM` — notification time on `when_date` |
| `deadline` | TEXT \| NULL | ISO date — hard due date |
| `waiting_for` | TEXT \| NULL | Who you're waiting on (e.g. "Alice — budget approval") |
| `waiting_since` | TEXT \| NULL | ISO date — when it was delegated |
| `repeat_rule` | TEXT \| NULL | JSON: `{freq, interval, on_completion, until}` |
| `position` | REAL | Fractional index for ordering |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |
| `completed_at` | TEXT \| NULL | ISO 8601 timestamp |

**What tasks do NOT have:** file attachments, priority levels, time estimates, subtasks, collaborators.

### Project Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (TEXT) | |
| `title` | TEXT | |
| `notes` | TEXT | Markdown — shown at top of project |
| `status` | TEXT | `active` \| `completed` \| `cancelled` \| `someday` |
| `area_id` | TEXT \| NULL | FK → areas.id |
| `when_date` | TEXT \| NULL | ISO date (deferred start) \| `'someday'` |
| `deadline` | TEXT \| NULL | ISO date |
| `position` | REAL | |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |
| `completed_at` | TEXT \| NULL | |

### Heading Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (TEXT) | |
| `title` | TEXT | |
| `project_id` | TEXT | FK → projects.id (NOT NULL) |
| `position` | REAL | |
| `archived_at` | TEXT \| NULL | |

### Area Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (TEXT) | |
| `title` | TEXT | |
| `position` | REAL | |
| `created_at` | TEXT | |
| `updated_at` | TEXT | |

### Tag Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID (TEXT) | |
| `name` | TEXT UNIQUE | e.g. `@home`, `@computer`, `deep-work` |
| `shortcut` | TEXT \| NULL | Single char for keyboard filter |
| `color` | TEXT \| NULL | Hex color string |
| `position` | REAL | |

---

## 6. SQLite Schema

```sql
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE areas (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  position    REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE projects (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','completed','cancelled','someday')),
  area_id      TEXT REFERENCES areas(id) ON DELETE SET NULL,
  when_date    TEXT,
  deadline     TEXT,
  position     REAL NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE headings (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position    REAL NOT NULL DEFAULT 0,
  archived_at TEXT
);

CREATE TABLE tasks (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  notes          TEXT,
  checklist      TEXT,              -- JSON array
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','completed','cancelled')),
  project_id     TEXT REFERENCES projects(id) ON DELETE SET NULL,
  area_id        TEXT REFERENCES areas(id) ON DELETE SET NULL,
  heading_id     TEXT REFERENCES headings(id) ON DELETE SET NULL,
  when_date      TEXT,              -- null|'today'|'evening'|ISO date|'someday'
  reminder_time  TEXT,              -- HH:MM
  deadline       TEXT,              -- ISO date
  waiting_for    TEXT,              -- who you're waiting on
  waiting_since  TEXT,              -- ISO date
  repeat_rule    TEXT,              -- JSON
  position       REAL NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  completed_at   TEXT
);

CREATE TABLE tags (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  shortcut  TEXT,
  color     TEXT,
  position  REAL NOT NULL DEFAULT 0
);

CREATE TABLE task_tags (
  task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE project_tags (
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX idx_tasks_project    ON tasks(project_id);
CREATE INDEX idx_tasks_area       ON tasks(area_id);
CREATE INDEX idx_tasks_when       ON tasks(when_date);
CREATE INDEX idx_tasks_deadline   ON tasks(deadline);
CREATE INDEX idx_tasks_status     ON tasks(status);
CREATE INDEX idx_projects_area    ON projects(area_id);
CREATE INDEX idx_projects_status  ON projects(status);
CREATE INDEX idx_headings_project ON headings(project_id);
```

---

## 7. LLM-Friendly Design

- **Stable UUIDs everywhere.** IDs are set once and never recycled.
- **Plain text notes.** Markdown stored as raw text.
- **Flat, predictable schema.** No polymorphic tables, no EAV.
- **ISO 8601 timestamps.** Human-readable, sortable as strings.
- **Fractional position indexes.** Gap-based (1000/2000/3000). Insertion without rewriting rows.
- **All enums are string literals.** `status = 'active'` reads better than `status = 2`.
- **Single SQLite file.** One file at a known path. The SQLite file is the truth.
- **Human-readable repeat rules:**
  ```json
  { "freq": "weekly", "interval": 1, "on_completion": false, "weekdays": [1,3,5] }
  ```

---

## 8. MCP Server (Agent Layer)

The primary way to interact with things4 is through Claude Code. The MCP server is a
local HTTP server that starts with the Electron app (or as a sidecar) and exposes a tool
interface to Claude. Claude knows the user's profile, goals, and GTD principles — it acts
as a secretary: flexible and conversational with the user, but non-negotiable about GTD.

### Philosophy

**Flexible with the person, rigid with the system.**

Claude does not bark at the user. If someone says "remind me to think about the website",
Claude doesn't refuse — it asks a clarifying question in natural language, figures out what
they actually mean, and captures something actionable. But it will not let a vague blob land
in the system unprocessed. Every task that enters things4 through the agent layer is clean,
actionable, and correctly classified.

**GTD rules Claude enforces (non-negotiable):**

1. **Every task must be a next physical action.** "Think about X" → "Open notes app and write down 3 options for X". "Deal with taxes" → broken into its actual first step.
2. **Multi-step outcomes become projects.** If the user gives Claude something that requires more than one action to complete, Claude creates a project and asks for or infers the first next action.
3. **Inbox items get processed, not parked.** If a task has no `project_id`, no `area_id`, and no `when_date`, Claude will prompt for at least one of these before confirming capture (unless the user explicitly wants to triage later via Inbox).
4. **Waiting For is first-class.** If the user says "waiting on X from Y", Claude sets `waiting_for` and `waiting_since`, not just a note.
5. **Deadlines vs when dates are never conflated.** Claude explicitly asks which one the user means when they say "by Friday" or "on Friday".
6. **Someday is a real status, not a dumping ground.** Claude flags if Someday items accumulate without review and prompts a triage.

**What Claude does NOT do:**
- Reject or lecture. It redirects with a question.
- Require perfect input. It infers context from the user's profile and recent history.
- Create tasks without a title that reads as a physical action (it rewrites or asks).

### MCP Tool Surface

```typescript
// Capture — flexible intake, GTD enforcement happens here
capture({
  raw: string,              // free-form text from user ("remind me to...")
  context?: string,         // optional: "I'm in a meeting with Alice"
}) → { task_id, title, clarifications_needed?: string[] }
// Claude parses raw, rewrites title as next action, infers project/area,
// prompts for any missing critical fields before confirming.

// Direct task creation — used when Claude has already clarified
create_task({
  title: string,            // must be a physical next action
  notes?: string,
  project_id?: string,
  area_id?: string,
  when_date?: string,
  deadline?: string,
  waiting_for?: string,
  waiting_since?: string,
  tags?: string[],
}) → { task_id }

// Read
list_tasks({ view: 'inbox'|'today'|'anytime'|'upcoming'|'logbook', tag?: string }) → Task[]
get_task({ id: string }) → Task
search({ query: string }) → Task[]

// Mutate
update_task({ id: string, fields: Partial<Task> }) → Task
complete_task({ id: string }) → Task
cancel_task({ id: string }) → Task
move_task({ id: string, project_id?: string, area_id?: string }) → Task
schedule_task({ id: string, when_date: string, deadline?: string }) → Task

// Projects
create_project({ title: string, area_id?: string, notes?: string }) → Project
list_projects({ status?: string }) → Project[]

// Areas
list_areas() → Area[]

// GTD health
review_inbox() → { count: number, oldest: Task, suggestions: string[] }
// Returns inbox state + Claude's suggestions for processing it.
// Claude uses this proactively — if inbox > 10 items it mentions it unprompted.

weekly_review() → {
  inbox_count: number,
  someday_count: number,
  projects_without_next_action: Project[],
  overdue: Task[],
  waiting_for: Task[],
}
// Full GTD weekly review surface. Claude walks through each category.
```

### MCP Server Architecture

```
things4 Electron app
  └── main process
        ├── better-sqlite3 (DB)
        ├── IPC handlers (renderer ↔ main)
        └── MCP HTTP server (port 57373, localhost only)
              └── @modelcontextprotocol/sdk
                    └── tools: capture, create_task, list_tasks, ...
```

The MCP server starts on `localhost:57373` when the app launches. Claude Code connects
to it via `~/.claude/settings.json` MCP config:

```json
{
  "mcpServers": {
    "things4": {
      "type": "http",
      "url": "http://localhost:57373/mcp"
    }
  }
}
```

The server uses the same `better-sqlite3` instance as the main process (shared singleton).
No network, no auth required — localhost only.

---

## 9. Keyboard Shortcuts

Mirroring Things 3 Mac shortcuts exactly.

### Create
| Action | Shortcut |
|--------|----------|
| New task | `Cmd+N` |
| New task at position | `Space` (with selection) |
| New tasks from clipboard | `Cmd+V` (multi-line paste) |
| New project | `Cmd+Option+N` |
| New heading | `Cmd+Shift+N` |
| Quick Entry (global) | `Ctrl+Space` |

### Edit
| Action | Shortcut |
|--------|----------|
| Open/expand selected task | `Return` |
| Save and close | `Cmd+Return` |
| Complete task | `Cmd+K` |
| Cancel task | `Cmd+Option+K` |
| Duplicate | `Cmd+D` |

### Scheduling
| Action | Shortcut |
|--------|----------|
| Open When picker | `Cmd+S` |
| Set When = Today | `Cmd+T` |
| Set When = This Evening | `Cmd+E` |
| Clear When (Anytime) | `Cmd+R` |
| Set When = Someday | `Cmd+O` |
| When date +1 day | `Ctrl+]` |
| When date -1 day | `Ctrl+[` |
| When date +1 week | `Ctrl+Shift+]` |
| When date -1 week | `Ctrl+Shift+[` |
| Set Deadline | `Cmd+Shift+D` |
| Deadline +1 day | `Ctrl+.` |
| Deadline -1 day | `Ctrl+,` |

### Navigate
| Action | Shortcut |
|--------|----------|
| Go to Inbox | `Cmd+1` |
| Go to Today | `Cmd+2` |
| Go to Upcoming | `Cmd+3` |
| Go to Anytime | `Cmd+4` |
| Go to Logbook | `Cmd+5` |
| Search | `Cmd+F` |
| Move to list | `Cmd+Shift+M` |
| Move item up | `Cmd+Up` |
| Move item down | `Cmd+Down` |
| Show/hide sidebar | `Cmd+/` |

### Tags
| Action | Shortcut |
|--------|----------|
| Edit tags for selection | `Cmd+Shift+T` |
| Filter by tag (in view) | `Ctrl+[shortcut key]` |

---

## 10. Project Structure

```
things4/
  src/
    main/
      index.ts                  # Electron entry, window creation, MCP server start
      ipc/
        tasks.ts
        projects.ts
        areas.ts
        tags.ts
        search.ts
      db/
        connection.ts           # better-sqlite3 singleton (shared with MCP server)
        schema.ts
        migrations/
          001_initial.ts
        queries/
          tasks.ts
          projects.ts
          areas.ts
          tags.ts
          views.ts              # Inbox/Today/Upcoming/Anytime/Logbook queries
      mcp/
        server.ts               # MCP HTTP server setup (@modelcontextprotocol/sdk)
        tools/
          capture.ts            # GTD-enforcing intake tool
          tasks.ts              # CRUD tools
          projects.ts
          views.ts              # list_tasks, review_inbox, weekly_review
    preload/
      index.ts                  # contextBridge — typed window.api
    renderer/
      index.tsx
      App.tsx                   # Layout: Sidebar + Main panel
      components/
        Sidebar/
          Sidebar.tsx
          Sidebar.module.css
          AreaGroup.tsx
          AreaGroup.module.css
          ProjectRow.tsx
          ProjectRow.module.css
        TaskList/
          TaskList.tsx
          TaskList.module.css
          TaskRow.tsx           # Collapsed task in list
          TaskRow.module.css
          TaskCard.tsx          # Expanded task (in-place)
          TaskCard.module.css
          HeadingRow.tsx
          HeadingRow.module.css
          Checkbox.tsx          # Sprite-sheet animated checkbox
          Checkbox.module.css
        QuickEntry/
          QuickEntry.tsx
          QuickEntry.module.css
        DatePicker/
          WhenPicker.tsx        # Today / Evening / Date / Someday popover
          WhenPicker.module.css
          DeadlinePicker.tsx
          DeadlinePicker.module.css
        TagPicker/
          TagPicker.tsx
          TagPicker.module.css
        ProgressPie/
          ProgressPie.tsx       # SVG pie, stroke-dasharray technique
          ProgressPie.module.css
      views/
        Inbox.tsx
        Today.tsx
        Upcoming.tsx
        Anytime.tsx
        Logbook.tsx
        ProjectDetail.tsx
      stores/
        taskStore.ts            # Zustand
        uiStore.ts
      hooks/
        useKeyboard.ts
        useTasks.ts
        useProjects.ts
      types/
        index.ts
      styles/
        globals.css
        variables.css           # All design tokens
      assets/
        checkbox-completing-atlas.png   # 6×5 sprite sheet, 20×20px frames
  electron.vite.config.ts
  package.json
  tsconfig.json
```

---

## 11. IPC Architecture

```
Renderer (React)
    |
    | window.api.tasks.create(data)   ← preload contextBridge
    |
Main Process
    ├── ipcMain.handle('tasks:create', ...)
    │     └── db.prepare('INSERT ...').run(data)
    │
    └── MCP HTTP Server (localhost:57373)
          └── same db singleton
```

**Preload API surface:**
```typescript
window.api = {
  tasks:    { list, get, create, update, complete, cancel, delete, move },
  projects: { list, get, create, update, complete, cancel, delete },
  areas:    { list, create, update, delete },
  tags:     { list, create, update, delete },
  views:    { inbox, today, upcoming, anytime, logbook },
  search:   { query },
}
```

---

## 12. GTD Compliance Map

| GTD Requirement | Implementation | Status |
|-----------------|----------------|--------|
| Universal capture | Inbox + Quick Entry + MCP `capture` tool | ✅ |
| Clarify workflow | MCP enforces next-action rewriting before save | ✅ |
| Areas of Responsibility | Areas (permanent, no completion) | ✅ |
| Projects list | Projects with progress tracking | ✅ |
| Next Actions by context | Tags as contexts; Anytime filterable by tag | ✅ |
| Waiting For | Dedicated `waiting_for` + `waiting_since` fields | ✅ |
| Someday/Maybe | `when_date='someday'` / `status='someday'` (no dedicated view) | ✅ |
| Hard landscape | Deadline field; calendar events in Today/Upcoming (read-only) | ✅ |
| Tickler file | Deferred start dates → Upcoming; invisible until date | ✅ |
| Two-minute rule | Quick Entry + MCP capture removes friction | ✅ |
| When ≠ Deadline | Two separate fields, separate pickers, separate visual treatment | ✅ |
| Inbox hygiene | MCP `review_inbox` proactively surfaces stale inbox | ✅ |
| Projects have next action | MCP `weekly_review` surfaces projects without next action | ✅ |
| Natural planning model | Project notes + headings; MCP can scaffold project structure | ✅ |
| Weekly Review | MCP `weekly_review` tool; no guided UI mode in v1 | ⚠️ v2 UI |
| Horizons of Focus | Areas (20k) + Projects (10k) + tasks (runway) | ✅ |

---

## 13. Data File Location

```
macOS:  ~/Library/Application Support/things4/
          app.db
          app.db-wal
          app.db-shm
          settings.json
```

---

## 14. Repeat Rules

```typescript
interface RepeatRule {
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  on_completion: boolean;   // false = fixed schedule, true = N after completion
  weekdays?: number[];      // 0=Sun..6=Sat
  day_of_month?: number;
  until?: string;           // ISO date
  count?: number;
}
```

---

## 15. Design Tokens (pixel-faithful to Things 3)

Derived from reverse engineering the Yanis-Gerst/things-3-clone and official Things 3
release notes. Light mode approximates `NSVisualEffectView` behavior.

```css
/* ================================================================
   LIGHT MODE (default)
   Sidebar uses backdrop-filter blur to approximate NSVisualEffectView
   ================================================================ */
:root {
  /* Backgrounds */
  --color-bg-main:              #FFFFFF;
  --color-bg-sidebar:           #EFEDE8;    /* NSVisualEffect .sidebar approx */
  --color-bg-sidebar-blur:      rgba(239, 237, 232, 0.85);  /* with backdrop-filter */
  --color-bg-task-expanded:     #F5F5F5;
  --color-bg-task-hover:        rgba(0, 122, 255, 0.08);
  --color-bg-tag:               #E5E5EA;

  /* Text — Apple system label colors */
  --color-text-primary:         #1C1C1E;
  --color-text-secondary:       #3C3C43;
  --color-text-tertiary:        #8E8E93;
  --color-text-placeholder:     #C7C7CC;

  /* Borders */
  --color-border:               rgba(0, 0, 0, 0.1);
  --color-border-strong:        rgba(0, 0, 0, 0.18);

  /* Semantic */
  --color-accent:               #007AFF;    /* Apple system blue */
  --color-deadline-soon:        #FF9500;    /* Orange — deadline within 7 days */
  --color-deadline-over:        #FF3B30;    /* Red — overdue */
  --color-evening:              #5856D6;    /* Indigo/purple — This Evening */
  --color-today-star:           #FFCC00;    /* Yellow star in Anytime */
  --color-progress-fill:        #007AFF;

  /* Shadows */
  --shadow-task-card:           0 2px 12px rgba(0, 0, 0, 0.08);
  --shadow-popover:             0 8px 32px rgba(0, 0, 0, 0.12);
}

/* ================================================================
   DARK MODE
   Values from reverse-engineered things-3-clone (Yanis-Gerst)
   ================================================================ */
:root[data-theme="dark"] {
  --color-bg-main:              #23262A;
  --color-bg-sidebar:           #1F2225;
  --color-bg-sidebar-blur:      rgba(31, 34, 37, 0.9);
  --color-bg-task-expanded:     #2D3033;
  --color-bg-task-hover:        #244271;
  --color-bg-accent-header:     #393C3F;
  --color-bg-tag:               #44474A;

  --color-text-primary:         #FBFBFB;
  --color-text-secondary:       #D2D3D3;
  --color-text-tertiary:        #696B6D;
  --color-text-placeholder:     #4A4A4F;

  --color-border:               #44464A;
  --color-border-strong:        #191B1E;

  --color-accent:               #2473E7;    /* Blue adjusted for dark surfaces */
  --color-deadline-soon:        #FF9F0A;
  --color-deadline-over:        #F34D61;
  --color-evening:              #6E6CE8;
  --color-today-star:           #FFD60A;
  --color-progress-fill:        #2473E7;

  --shadow-task-card:           0px 0px 8px 2px rgba(0, 0, 0, 0.2);
  --shadow-popover:             0px 8px 32px rgba(0, 0, 0, 0.4);
}

/* ================================================================
   TYPOGRAPHY
   Things 3 uses SF Pro exclusively (native -apple-system)
   ================================================================ */
:root {
  --font-family:                -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;

  /* Sizes */
  --font-size-task-title:       15px;       /* Task title in list */
  --font-size-task-expanded:    16px;       /* Task title when expanded */
  --font-size-notes:            14px;
  --font-size-checklist:        14px;
  --font-size-meta:             12px;       /* Dates, tag labels */
  --font-size-sidebar-item:     13px;
  --font-size-area-label:       13px;
  --font-size-section-header:   22px;       /* Day headers in Upcoming */
  --font-size-month-header:     34px;       /* Month headers in Upcoming */

  /* Weights */
  --font-weight-regular:        400;
  --font-weight-medium:         500;
  --font-weight-semibold:       600;
  --font-weight-bold:           700;

  /* Line heights */
  --line-height-body:           1.4;
  --line-height-ui:             1.2;

  -webkit-font-smoothing:       antialiased;
}

/* ================================================================
   SPACING & LAYOUT
   ================================================================ */
:root {
  --sidebar-width:              220px;

  /* Task rows */
  --task-row-height:            44px;       /* Apple HIG touch target */
  --task-row-padding-x:         16px;
  --task-row-padding-y:         4px;

  /* Expanded task card */
  --task-card-padding:          8px 16px 16px;
  --task-card-margin-y:         24px;       /* my-6 from clone */
  --task-card-border-radius:    8px;

  /* Checklist */
  --checklist-indent:           28px;       /* ml-7 from clone, aligns under title */

  /* Sidebar */
  --sidebar-item-padding:       6px 12px;

  /* Section gaps */
  --section-gap:                24px;

  /* Radii */
  --radius-sm:                  4px;        /* Task row subtle rounding */
  --radius-md:                  8px;        /* Cards, expanded tasks */
  --radius-lg:                  12px;       /* Dialogs, popovers */
  --radius-pill:                9999px;     /* Tags */

  /* Checkbox */
  --checkbox-size:              20px;
  --checkbox-anim-interval:     15ms;       /* ~67fps sprite animation */
}

/* ================================================================
   CHECKBOX SPRITE ANIMATION
   Atlas: 6 columns × 5 rows = 30 frames, each 20×20px
   File: assets/checkbox-completing-atlas.png (120×100px @1x, 240×200px @2x)
   ================================================================ */
```

**Checkbox completion animation:** Uses a sprite sheet atlas (6×5 grid, 30 frames at 20×20px
each). On complete, animate through all 30 frames at 15ms intervals (~67fps) via
`setInterval`. The animation draws a circle that fills into a checkmark. On uncomplete,
snap to frame 0 immediately.

**Sidebar blur:** `backdrop-filter: blur(20px) saturate(180%)` on the sidebar panel,
matching `NSVisualEffectView` behavior on macOS. Falls back gracefully without blur support.

---

## 16. Decisions (Locked)

1. **App name:** `things4`
2. **Styling:** CSS Modules with design tokens (no Tailwind)
3. **Tag inheritance display:** Hide inherited tags entirely
4. **Waiting For:** Dedicated `waiting_for` + `waiting_since` fields — first-class GTD
5. **Someday shortcut:** Keep `Cmd+O`
6. **MCP server port:** `localhost:57373`
7. **Checkbox animation:** Sprite sheet atlas, 30 frames at ~67fps
8. **Dark mode:** Supported via `data-theme="dark"` attribute; tokens cover both modes

---

## 17. Implementation Plan

### Parallelization Strategy

The build is divided into 5 phases. Phases 1 and 2 are sequential (foundation must exist
before components). Within phases 2–4, tracks are fully independent and can run as
simultaneous polecats. Phase 5 integrates and polishes.

Token credit is maximized by keeping each polecat scope tight (one concern, full depth)
rather than broad (many concerns, shallow). Each polecat gets a complete vertical slice
with no dependency on work another polecat is doing in the same phase.

---

### Phase 1 — Foundation (sequential, 1 polecat)

**Polecat: foundation**

Single polecat does this in order — everything else depends on it.

1. `npm create electron-vite@latest things4 -- --template react-ts`
2. Install deps: `better-sqlite3 @types/better-sqlite3 zustand uuid @modelcontextprotocol/sdk`
3. Configure `tsconfig.json` (strict: true, path aliases)
4. `src/main/db/connection.ts` — better-sqlite3 singleton
5. `src/main/db/schema.ts` — full schema from Section 6
6. `src/main/db/migrations/001_initial.ts` — runs schema on first launch
7. `src/types/index.ts` — TypeScript interfaces for Task, Project, Area, Tag, Heading
8. `src/renderer/styles/variables.css` — all design tokens from Section 15
9. `src/renderer/styles/globals.css` — resets, body, font-smoothing, box-sizing
10. Verify: `npm run dev` opens a blank Electron window

Deliverable: repo with working dev environment, DB initialized, types defined, tokens in CSS.

---

### Phase 2 — Three parallel tracks (run simultaneously)

---

**Polecat A: db-queries**

All SQLite queries and IPC handlers. No UI. Pure data layer.

- `src/main/db/queries/tasks.ts` — listByView, get, create, update, complete, cancel, delete, move
- `src/main/db/queries/projects.ts` — CRUD + complete/cancel
- `src/main/db/queries/areas.ts` — CRUD
- `src/main/db/queries/tags.ts` — CRUD + attach/detach from task/project
- `src/main/db/queries/views.ts` — inbox(), today(), upcoming(), anytime(), logbook() SQL queries
- `src/main/ipc/tasks.ts` — registers all task IPC handlers
- `src/main/ipc/projects.ts`
- `src/main/ipc/areas.ts`
- `src/main/ipc/tags.ts`
- `src/main/ipc/search.ts` — full-text search (LIKE on title + notes)
- `src/preload/index.ts` — contextBridge exposing full `window.api` surface

Each view query must handle: status filters, `when_date` logic, someday exclusion,
fractional position ordering.

---

**Polecat B: mcp-server**

The MCP server. Uses the same `connection.ts` db singleton. No UI involvement.

- `src/main/mcp/server.ts` — HTTP server on port 57373, MCP SDK setup
- `src/main/mcp/tools/capture.ts` — GTD-enforcing intake: parses raw input, rewrites
  title as next physical action, infers project/area from context, flags multi-step
  outcomes as needing a project, returns `clarifications_needed` array if ambiguous
- `src/main/mcp/tools/tasks.ts` — create_task, update_task, complete_task, cancel_task,
  move_task, schedule_task, get_task, search
- `src/main/mcp/tools/views.ts` — list_tasks (by view), review_inbox, weekly_review
- `src/main/mcp/tools/projects.ts` — create_project, list_projects

GTD enforcement logic lives in `capture.ts`. Rules to implement:
  - Title must start with a verb (rewrite if not)
  - Title length > 60 chars → likely a project or multi-step → flag
  - "Think about", "deal with", "handle", "look into" → rewrite or ask
  - If `waiting_for` is mentioned in raw text → set field automatically
  - If deadline and when_date both implied → ask which one user means

Wire the MCP server startup into `src/main/index.ts`.

---

**Polecat C: sidebar + stores**

Sidebar UI and Zustand stores. Depends on types from Phase 1. No DB access (that's Polecat A).
Uses `window.api` stubs (can mock during development).

- `src/renderer/stores/taskStore.ts` — Zustand: tasks by view, activeTask, loading states,
  optimistic updates for complete/cancel
- `src/renderer/stores/uiStore.ts` — Zustand: activeView, selectedTaskId, sidebarCollapsed,
  theme
- `src/renderer/components/Sidebar/Sidebar.tsx` + `Sidebar.module.css` — fixed views list
  (Inbox/Today/Upcoming/Anytime/Logbook), area list, project rows, collapse behavior
- `src/renderer/components/Sidebar/AreaGroup.tsx` + CSS — collapsible area with nested projects
- `src/renderer/components/Sidebar/ProjectRow.tsx` + CSS — project row with ProgressPie
- `src/renderer/components/ProgressPie/ProgressPie.tsx` + CSS — SVG circle, stroke-dasharray,
  `--color-progress-fill`, 14px diameter
- `src/renderer/App.tsx` — two-panel layout: Sidebar (220px fixed) + main content area
- Sidebar backdrop-filter blur on the sidebar panel

Pixel targets: sidebar item 13px SF Pro, area label semibold, project label regular,
220px sidebar width, `--sidebar-item-padding` spacing.

---

### Phase 3 — Three parallel tracks

---

**Polecat D: task-list + task-card**

Core task display. Depends on stores (Phase 2C) and types (Phase 1).

- `src/renderer/components/TaskList/TaskList.tsx` + CSS — renders list of TaskRows,
  handles HeadingRows interleaved, keyboard navigation (Up/Down arrows, Return to expand)
- `src/renderer/components/TaskList/TaskRow.tsx` + CSS — collapsed task: checkbox,
  title, optional deadline badge, optional when badge, tags. 44px row height.
  Hover state: `--color-bg-task-hover`.
- `src/renderer/components/TaskList/TaskCard.tsx` + CSS — expanded task in-place:
  title (editable), notes (markdown textarea), checklist block, waiting_for field,
  deadline + when date pills, tag row. 300ms ease-out expand transition.
  Background: `--color-bg-task-expanded`. Shadow: `--shadow-task-card`. Margin: 24px.
- `src/renderer/components/TaskList/HeadingRow.tsx` + CSS — section divider within project
- `src/renderer/components/TaskList/Checkbox.tsx` + CSS — sprite sheet animation.
  Atlas: 6×5 grid, 30 frames at 20×20px. `setInterval` at 15ms through frames on complete.
  Snap to frame 0 on uncomplete. After animation: call `taskStore.complete(id)`.

All editing in TaskCard must use optimistic updates via taskStore.

---

**Polecat E: pickers + quick-entry**

Date pickers and Quick Entry popover. Independent UI components.

- `src/renderer/components/DatePicker/WhenPicker.tsx` + CSS — popover with three quick
  buttons (Today, This Evening, Someday), then a calendar grid for specific date selection.
  Natural language parsing for typed dates ("next wednesday" → ISO date via lightweight
  parser, no heavy library). Keyboard: arrow keys to navigate calendar, Enter to select,
  Esc to close.
- `src/renderer/components/DatePicker/DeadlinePicker.tsx` + CSS — similar to WhenPicker
  but no "This Evening" or "Someday" options. Shows urgency preview (days until).
- `src/renderer/components/TagPicker/TagPicker.tsx` + CSS — dropdown/popover for tag
  selection. Type to filter. Create new tag inline. Shows color dot + shortcut key.
- `src/renderer/components/QuickEntry/QuickEntry.tsx` + CSS — global floating panel.
  Registered as global Electron shortcut `Ctrl+Space`. Floating window (separate
  BrowserWindow, always on top). Title input + notes. Inline access to WhenPicker,
  DeadlinePicker, TagPicker. Cmd+Return saves, Esc cancels.

All pickers open as in-place popovers (not modals). Use CSS `position: absolute` with
portal rendering to avoid overflow clipping.

---

**Polecat F: views**

All five view components. Depends on taskStore (Phase 2C) and TaskList (Phase 3D — can
stub TaskList with a simple list temporarily, swap on integration).

- `src/renderer/views/Inbox.tsx` — renders taskStore.inbox(). Empty state: friendly
  prompt ("Your inbox is clear"). New task with `Cmd+N` lands here.
- `src/renderer/views/Today.tsx` — renders taskStore.today(). Sections: main tasks,
  "This Evening" (collapsible, moon icon, `--color-evening`). Overdue items in red.
  Deadline-today items in orange.
- `src/renderer/views/Upcoming.tsx` — day-grouped list. First 7 days individual.
  Beyond 7: week groups, then month groups. Day headers at `--font-size-section-header`,
  month headers at `--font-size-month-header`. Calendar events inline (placeholder for v1).
- `src/renderer/views/Anytime.tsx` — tasks grouped by project/area. Yellow star marker
  (`--color-today-star`) on items also in Today. Empty containers hidden.
- `src/renderer/views/Logbook.tsx` — completed/cancelled items, grouped by completion date.
  Muted visual treatment (tertiary text color).
- `src/renderer/views/ProjectDetail.tsx` — full project view: project title, notes, headings
  with TaskLists nested under each. Progress pie in header.
- Wire all views into `App.tsx` via `uiStore.activeView` switch.

---

### Phase 4 — Keyboard layer (1 polecat)

**Polecat G: keyboard**

Global keyboard shortcut registration. Depends on all stores and views being present.

- `src/renderer/hooks/useKeyboard.ts` — registers all shortcuts from Section 9 using
  a `keydown` event listener. Dispatches to uiStore and taskStore.
- All Cmd+1..5 navigation shortcuts
- All task action shortcuts (Cmd+K complete, Cmd+Option+K cancel, Cmd+N new, etc.)
- All scheduling shortcuts (Cmd+T today, Cmd+E evening, Cmd+S when picker, etc.)
- Shortcut map: record of `{ key, meta, shift, alt }` → action function
- Must not fire shortcuts when user is typing in an input/textarea
- Wire Ctrl+Space into Electron main process as global shortcut → open QuickEntry window

---

### Phase 5 — Integration & polish (sequential, mayor + 1 polecat)

Mayor reviews all branches, resolves any interface mismatches, and runs a final polish pass:

- Connect `window.api` calls in all stores to the real IPC handlers from Polecat A
- Connect MCP server startup in `main/index.ts`
- End-to-end test: create task via MCP `capture`, verify it appears in Inbox UI
- End-to-end test: complete task via Checkbox animation, verify Logbook entry
- End-to-end test: Quick Entry `Ctrl+Space` global shortcut
- Light/dark mode toggle wired to `uiStore.theme` → `document.documentElement.dataset.theme`
- `npm run build` → verify packaged `.app` launches and DB persists to
  `~/Library/Application Support/things4/app.db`
- Add `things4` MCP config to `~/.claude/settings.json`

---

### Polecat Assignment Summary

| Phase | Polecat | Scope | Parallel? |
|-------|---------|-------|-----------|
| 1 | foundation | Scaffold, DB, types, tokens | Sequential |
| 2 | db-queries | All DB queries + IPC | ✅ with B, C |
| 2 | mcp-server | MCP server + all tools | ✅ with A, C |
| 2 | sidebar+stores | Zustand stores + Sidebar UI | ✅ with A, B |
| 3 | task-list+card | TaskRow, TaskCard, Checkbox | ✅ with E, F |
| 3 | pickers+qe | WhenPicker, DeadlinePicker, TagPicker, QuickEntry | ✅ with D, F |
| 3 | views | All 5 views + ProjectDetail | ✅ with D, E |
| 4 | keyboard | Global keyboard layer | Sequential |
| 5 | integration | Wiring + polish + MCP config | Sequential |

Total: 9 polecat invocations. Phases 2 and 3 run as 3 simultaneous polecats each,
cutting wall-clock time roughly in half versus sequential execution.
