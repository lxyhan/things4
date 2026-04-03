import React, { useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import type { Task } from "../../../types";
import { TaskList } from "../components/TaskList/TaskList";
import styles from "./Logbook.module.css";

function completionDateKey(task: Task): string {
  if (task.completed_at) return task.completed_at.slice(0, 10);
  return task.updated_at.slice(0, 10);
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface DateGroup {
  dateKey: string;
  label: string;
  tasks: Task[];
}

function buildGroups(tasks: Task[]): DateGroup[] {
  const grouped = new Map<string, DateGroup>();

  for (const task of tasks) {
    const key = completionDateKey(task);
    if (!grouped.has(key)) {
      grouped.set(key, {
        dateKey: key,
        label: formatDateHeader(key),
        tasks: [],
      });
    }
    grouped.get(key)!.tasks.push(task);
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0,
  );
}

export function Logbook(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore();
  const tasks = tasksByView.logbook;

  useEffect(() => {
    loadTasks("logbook");
  }, [loadTasks]);

  if (loading && tasks.length === 0) {
    return <div className={styles.container} />;
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.viewTitle}>Logbook</h1>
        <div className={styles.empty}>No completed items</div>
      </div>
    );
  }

  const groups = buildGroups(tasks);

  return (
    <div className={styles.container}>
      <h1 className={styles.viewTitle}>Logbook</h1>
      {groups.map((group) => (
        <section key={group.dateKey} className={styles.group}>
          <h2 className={styles.groupHeader}>{group.label}</h2>
          <TaskList tasks={group.tasks} view="logbook" />
        </section>
      ))}
    </div>
  );
}
