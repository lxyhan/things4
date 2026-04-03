import React, { useEffect, useState } from "react";
import { useTaskStore } from "../stores/taskStore";
import { TaskList } from "../components/TaskList/TaskList";
import styles from "./Today.module.css";

export function Today(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore();
  const allTasks = tasksByView.today;
  const [eveningCollapsed, setEveningCollapsed] = useState(false);

  useEffect(() => {
    loadTasks("today");
  }, [loadTasks]);

  const mainTasks = allTasks.filter((t) => t.when_date !== "evening");
  const eveningTasks = allTasks.filter((t) => t.when_date === "evening");

  if (loading && allTasks.length === 0) {
    return <div className={styles.container} />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.viewTitle}>Today</h1>
      {mainTasks.length > 0 && <TaskList tasks={mainTasks} view="today" />}

      {mainTasks.length === 0 && eveningTasks.length === 0 && (
        <div className={styles.empty}>Nothing for today</div>
      )}

      {eveningTasks.length > 0 && (
        <section className={styles.eveningSection}>
          <button
            className={styles.eveningHeader}
            onClick={() => setEveningCollapsed((c) => !c)}
          >
            <span className={styles.moonIcon}>🌙</span>
            <span className={styles.eveningLabel}>This Evening</span>
            <span className={styles.collapseChevron}>
              {eveningCollapsed ? "▶" : "▼"}
            </span>
          </button>
          {!eveningCollapsed && <TaskList tasks={eveningTasks} view="today" />}
        </section>
      )}
    </div>
  );
}
