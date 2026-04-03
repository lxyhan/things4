import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export function insertSeedData(db: Database.Database): void {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  db.transaction(() => {
  // Areas
  const areaWorkId = uuidv4();
  const areaPersonalId = uuidv4();

  db.prepare(
    `INSERT INTO areas (id, title, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  ).run(areaWorkId, "Work", 1, now, now);

  db.prepare(
    `INSERT INTO areas (id, title, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  ).run(areaPersonalId, "Personal", 2, now, now);

  // Tags
  const tagFocusId = uuidv4();
  const tagQuickId = uuidv4();
  const tagWaitingId = uuidv4();

  db.prepare(
    `INSERT INTO tags (id, name, shortcut, color, position) VALUES (?, ?, ?, ?, ?)`
  ).run(tagFocusId, "focus", "f", "#007AFF", 1);

  db.prepare(
    `INSERT INTO tags (id, name, shortcut, color, position) VALUES (?, ?, ?, ?, ?)`
  ).run(tagQuickId, "quick", "q", "#34C759", 2);

  db.prepare(
    `INSERT INTO tags (id, name, shortcut, color, position) VALUES (?, ?, ?, ?, ?)`
  ).run(tagWaitingId, "waiting", "w", "#FF9500", 3);

  // Projects
  const projectLaunchId = uuidv4();
  const projectHomeId = uuidv4();

  db.prepare(
    `INSERT INTO projects (id, title, notes, status, area_id, position, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`
  ).run(
    projectLaunchId,
    "Launch things4",
    "Ship the first version of things4 to the App Store.",
    areaWorkId,
    1,
    now,
    now
  );

  db.prepare(
    `INSERT INTO projects (id, title, notes, status, area_id, position, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`
  ).run(
    projectHomeId,
    "Home Renovation",
    "Kitchen and bathroom updates for the new year.",
    areaPersonalId,
    2,
    now,
    now
  );

  // Headings for Launch project
  const headingDesignId = uuidv4();
  const headingShipId = uuidv4();

  db.prepare(
    `INSERT INTO headings (id, title, project_id, position) VALUES (?, ?, ?, ?)`
  ).run(headingDesignId, "Design", projectLaunchId, 1);

  db.prepare(
    `INSERT INTO headings (id, title, project_id, position) VALUES (?, ?, ?, ?)`
  ).run(headingShipId, "Ship", projectLaunchId, 2);

  // Tasks in "Launch things4" project
  const task1 = uuidv4();
  const task2 = uuidv4();
  const task3 = uuidv4();
  const task4 = uuidv4();

  db.prepare(
    `INSERT INTO tasks (id, title, notes, status, project_id, heading_id, when_date, position, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`
  ).run(
    task1,
    "Finalize app icon and splash screen",
    "Work with designer to produce final .icns and retina assets.",
    projectLaunchId,
    headingDesignId,
    "today",
    1,
    now,
    now
  );

  db.prepare(
    `INSERT INTO tasks (id, title, status, project_id, heading_id, position, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?)`
  ).run(
    task2,
    "Write App Store listing copy",
    projectLaunchId,
    headingShipId,
    1,
    now,
    now
  );

  db.prepare(
    `INSERT INTO tasks (id, title, status, project_id, heading_id, when_date, deadline, position, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    task3,
    "Submit build for App Store review",
    projectLaunchId,
    headingShipId,
    nextWeek,
    nextWeek,
    2,
    now,
    now
  );

  const task4CompletedAt = new Date(Date.now() - 2 * 86400000).toISOString();
  db.prepare(
    `INSERT INTO tasks (id, title, status, project_id, heading_id, position, created_at, updated_at, completed_at)
     VALUES (?, ?, 'completed', ?, ?, ?, ?, ?, ?)`
  ).run(
    task4,
    "Set up electron-builder Mac packaging",
    projectLaunchId,
    headingShipId,
    3,
    now,
    now,
    task4CompletedAt
  );

  // Tasks in "Home Renovation" project
  const task5 = uuidv4();
  const task6 = uuidv4();

  db.prepare(
    `INSERT INTO tasks (id, title, status, project_id, when_date, position, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?)`
  ).run(task5, "Get quotes from three contractors", projectHomeId, tomorrow, 1, now, now);

  db.prepare(
    `INSERT INTO tasks (id, title, status, project_id, waiting_for, waiting_since, position, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)`
  ).run(
    task6,
    "Review floor sample selections",
    projectHomeId,
    "Alice — interior designer",
    today,
    2,
    now,
    now
  );

  // Inbox tasks (no project, no area)
  const task7 = uuidv4();
  const task8 = uuidv4();
  const task9 = uuidv4();

  db.prepare(
    `INSERT INTO tasks (id, title, notes, status, position, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?)`
  ).run(
    task7,
    "Process today's email backlog",
    "Clear inbox to zero: archive, delegate, or schedule each item.",
    1,
    now,
    now
  );

  db.prepare(
    `INSERT INTO tasks (id, title, status, when_date, position, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?)`
  ).run(task8, "Call dentist to schedule cleaning", "today", 2, now, now);

  db.prepare(
    `INSERT INTO tasks (id, title, status, when_date, position, created_at, updated_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?)`
  ).run(task9, "Pick up dry cleaning", "evening", 3, now, now);

  // Tag associations
  db.prepare(`INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)`).run(task1, tagFocusId);
  db.prepare(`INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)`).run(task3, tagFocusId);
  db.prepare(`INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)`).run(task6, tagWaitingId);
  db.prepare(`INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)`).run(task8, tagQuickId);
  })();
}
