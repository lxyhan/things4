import React, { useEffect, useRef, useState } from "react";
import type { Project, Task } from "../../../types";
import { ProgressPie } from "../components/ProgressPie/ProgressPie";
import styles from "./ProjectDetail.module.css";

// Stub TaskList — replaced during Phase 5 integration
function TaskList({ tasks }: { tasks: Task[] }): React.JSX.Element {
  return (
    <ul className={styles.taskList}>
      {tasks.map((task) => (
        <li key={task.id} className={styles.taskRow}>
          <span className={styles.taskTitle}>{task.title}</span>
        </li>
      ))}
    </ul>
  );
}

interface HeadingGroup {
  headingId: string | null;
  tasks: Task[];
}

function buildHeadingGroups(tasks: Task[]): HeadingGroup[] {
  const grouped = new Map<string | null, HeadingGroup>();
  grouped.set(null, { headingId: null, tasks: [] });

  for (const task of tasks) {
    const key = task.heading_id ?? null;
    if (!grouped.has(key)) {
      grouped.set(key, { headingId: key, tasks: [] });
    }
    grouped.get(key)!.tasks.push(task);
  }

  // Put null (ungrouped) first, then headings in insertion order
  const nullGroup = grouped.get(null)!;
  const headingGroups = Array.from(grouped.entries())
    .filter(([k]) => k !== null)
    .map(([, g]) => g);

  return [nullGroup, ...headingGroups].filter((g) => g.tasks.length > 0);
}

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({
  projectId,
}: ProjectDetailProps): React.JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.api?.projects
      ?.get(projectId)
      .then((p) => {
        if (!p) return;
        setProject(p);
        setTitleDraft(p.title);
        setNotesDraft(p.notes ?? "");
      })
      .catch(() => undefined);

    // Load project tasks by fetching anytime + filtering by project_id
    window.api?.tasks
      ?.list("anytime")
      .then((all) => {
        const projectTasks = all.filter((t) => t.project_id === projectId);
        setTasks(projectTasks);
      })
      .catch(() => undefined);

    // Load counts from project list (includes progress)
    window.api?.projects
      ?.list()
      .then((all) => {
        const p = all.find((x) => x.id === projectId);
        if (p) {
          setTotalTasks(p.total_tasks);
          setCompletedTasks(p.completed_tasks);
        }
      })
      .catch(() => undefined);
  }, [projectId]);

  function handleTitleCommit(): void {
    setEditingTitle(false);
    if (!project || titleDraft === project.title) return;
    window.api?.projects
      ?.update(projectId, { title: titleDraft })
      .then((updated) => {
        if (updated) setProject(updated);
      })
      .catch(() => undefined);
  }

  function handleNotesBlur(): void {
    if (!project || notesDraft === (project.notes ?? "")) return;
    window.api?.projects
      ?.update(projectId, { notes: notesDraft || null })
      .then((updated) => {
        if (updated) setProject(updated);
      })
      .catch(() => undefined);
  }

  if (!project) {
    return <div className={styles.container} />;
  }

  const headingGroups = buildHeadingGroups(tasks);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {editingTitle ? (
            <input
              ref={titleRef}
              className={styles.titleInput}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleCommit();
                if (e.key === "Escape") {
                  setTitleDraft(project.title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h1 className={styles.title} onClick={() => setEditingTitle(true)}>
              {project.title}
            </h1>
          )}
        </div>
        {totalTasks > 0 && (
          <div
            className={styles.progressArea}
            title={`${completedTasks} of ${totalTasks} done`}
          >
            <ProgressPie completed={completedTasks} total={totalTasks} />
            <span className={styles.progressLabel}>
              {completedTasks}/{totalTasks}
            </span>
          </div>
        )}
      </header>

      <textarea
        className={styles.notes}
        placeholder="Add notes…"
        value={notesDraft}
        onChange={(e) => setNotesDraft(e.target.value)}
        onBlur={handleNotesBlur}
      />

      <div className={styles.taskArea}>
        {headingGroups.map((group) => (
          <section key={group.headingId ?? "__ungrouped__"}>
            {group.headingId !== null && (
              <h2 className={styles.headingTitle}>{group.headingId}</h2>
            )}
            <TaskList tasks={group.tasks} />
          </section>
        ))}
        {tasks.length === 0 && (
          <div className={styles.empty}>No tasks in this project</div>
        )}
      </div>
    </div>
  );
}
