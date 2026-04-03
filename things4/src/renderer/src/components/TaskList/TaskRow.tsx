import React, { useCallback } from "react";
import type { Task } from "../../../../types";
import { useTaskStore } from "../../stores/taskStore";
import { Checkbox } from "./Checkbox";
import styles from "./TaskRow.module.css";

interface TaskRowProps {
  task: Task;
  isSelected: boolean;
  isExpanded: boolean;
  showTodayStar?: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string | null) => void;
}

function formatDeadline(deadline: string): {
  label: string;
  urgent: boolean;
  overdue: boolean;
} {
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Overdue", urgent: false, overdue: true };
  if (diffDays === 0) return { label: "Today", urgent: true, overdue: false };
  if (diffDays === 1)
    return { label: "Tomorrow", urgent: true, overdue: false };
  if (diffDays <= 7)
    return { label: `${diffDays}d`, urgent: true, overdue: false };
  return {
    label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    urgent: false,
    overdue: false,
  };
}

function formatWhenDate(when: string): string {
  const d = new Date(when);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskRow({
  task,
  isSelected,
  isExpanded,
  showTodayStar = false,
  onSelect,
  onExpand,
}: TaskRowProps): React.JSX.Element {
  const { optimisticComplete, optimisticCancel } = useTaskStore();

  const handleClick = useCallback(() => {
    onSelect(task.id);
    onExpand(isExpanded ? null : task.id);
  }, [task.id, isExpanded, onSelect, onExpand]);

  const handleComplete = useCallback(() => {
    optimisticComplete(task.id);
  }, [task.id, optimisticComplete]);

  const handleUncomplete = useCallback(() => {
    optimisticCancel(task.id);
  }, [task.id, optimisticCancel]);

  const deadline = task.deadline ? formatDeadline(task.deadline) : null;

  const rowClass = [
    styles.row,
    isSelected ? styles.selected : "",
    isExpanded ? styles.expanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rowClass}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Checkbox
        completed={task.status === "completed"}
        onComplete={handleComplete}
        onUncomplete={handleUncomplete}
      />

      <span className={styles.title}>{task.title}</span>

      <div className={styles.badges}>
        {showTodayStar && (
          <span className={styles.todayStar} title="In Today">
            ★
          </span>
        )}

        {task.when_date && (
          <span className={styles.whenBadge}>
            {formatWhenDate(task.when_date)}
          </span>
        )}

        {deadline && (
          <span
            className={[
              styles.deadlineBadge,
              deadline.overdue ? styles.deadlineOverdue : "",
              deadline.urgent ? styles.deadlineUrgent : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {deadline.label}
          </span>
        )}
      </div>
    </div>
  );
}
