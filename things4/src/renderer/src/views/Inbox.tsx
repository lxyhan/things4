import React, { useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import { useUIStore } from "../stores/uiStore";
import { TaskList } from "../components/TaskList/TaskList";
import styles from "./Inbox.module.css";

export function Inbox(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore();
  const { newTaskRequested, clearNewTaskRequest, setPendingExpandId } = useUIStore();
  const tasks = tasksByView.inbox;

  useEffect(() => {
    loadTasks("inbox");
  }, [loadTasks]);

  useEffect(() => {
    if (newTaskRequested) {
      clearNewTaskRequest();
      window.api?.tasks
        ?.create({ title: "", status: "active" })
        .then((task) => {
          if (task?.id) setPendingExpandId(task.id);
          return loadTasks("inbox");
        })
        .catch(() => undefined);
    }
  }, [newTaskRequested, clearNewTaskRequest, loadTasks, setPendingExpandId]);

  if (loading && tasks.length === 0) {
    return <div className={styles.container} />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.viewTitle}>Inbox</h1>
      <TaskList tasks={tasks} view="inbox" />
    </div>
  );
}
