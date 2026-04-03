export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS areas (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  position    REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
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

CREATE TABLE IF NOT EXISTS headings (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  position    REAL NOT NULL DEFAULT 0,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  notes          TEXT,
  checklist      TEXT,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','completed','cancelled')),
  project_id     TEXT REFERENCES projects(id) ON DELETE SET NULL,
  area_id        TEXT REFERENCES areas(id) ON DELETE SET NULL,
  heading_id     TEXT REFERENCES headings(id) ON DELETE SET NULL,
  when_date      TEXT,
  reminder_time  TEXT,
  deadline       TEXT,
  waiting_for    TEXT,
  waiting_since  TEXT,
  repeat_rule    TEXT,
  position       REAL NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  completed_at   TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  shortcut  TEXT,
  color     TEXT,
  position  REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id  TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id   TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE IF NOT EXISTS project_tags (
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_area       ON tasks(area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_when       ON tasks(when_date);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline   ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_projects_area    ON projects(area_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON projects(status);
CREATE INDEX IF NOT EXISTS idx_headings_project ON headings(project_id);
`
