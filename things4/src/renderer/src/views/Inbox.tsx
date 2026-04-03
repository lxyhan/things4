import React, { useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import styles from "./Inbox.module.css";

export function Inbox(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore();
  const tasks = tasksByView.inbox;

  useEffect(() => {
    loadTasks("inbox");
  }, [loadTasks]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        window.api?.tasks
          ?.create({ title: "", status: "active" })
          .then(() => loadTasks("inbox"))
          .catch(() => undefined);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadTasks]);

  if (loading && tasks.length === 0) {
    return <div className={styles.container} />;
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Your inbox is clear</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ul className={styles.taskList}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.taskRow}>
            <span className={styles.taskTitle}>{task.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
