import React, { useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import { useUIStore } from "../stores/uiStore";
import { TaskList } from "../components/TaskList/TaskList";
import styles from "./Inbox.module.css";

export function Inbox(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore();
  const { newTaskRequested, clearNewTaskRequest } = useUIStore();
  const tasks = tasksByView.inbox;

  useEffect(() => {
    loadTasks("inbox");
  }, [loadTasks]);

  useEffect(() => {
    if (newTaskRequested) {
      clearNewTaskRequest();
      window.api?.tasks
        ?.create({ title: "", status: "active" })
        .then(() => loadTasks("inbox"))
        .catch(() => undefined);
    }
  }, [newTaskRequested, clearNewTaskRequest, loadTasks]);

  if (loading && tasks.length === 0) {
    return <div className={styles.container} />;
  }

  return (
    <div className={styles.container}>
      <TaskList tasks={tasks} view="inbox" />
    </div>
  );
}
