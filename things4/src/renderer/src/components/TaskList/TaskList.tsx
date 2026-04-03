import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Heading, Task } from "../../../../types";
import type { ViewId } from "../../stores/uiStore";
import { useUIStore } from "../../stores/uiStore";
import { HeadingRow } from "./HeadingRow";
import { TaskCard } from "./TaskCard";
import { TaskRow } from "./TaskRow";
import styles from "./TaskList.module.css";

type ListItem =
  | { kind: "task"; task: Task }
  | { kind: "heading"; heading: Heading };

const EMPTY_STATE_MESSAGES: Record<ViewId, string> = {
  inbox: "Your inbox is clear.",
  today: "Nothing planned for today.",
  upcoming: "Nothing coming up.",
  anytime: "No tasks anytime.",
  logbook: "Your Logbook is empty.",
  project: "No tasks in this project.",
};

interface TaskListProps {
  tasks: Task[];
  headings?: Heading[];
  view: ViewId;
  todayTaskIds?: Set<string>;
}

export function TaskList({
  tasks,
  headings = [],
  view,
  todayTaskIds = new Set(),
}: TaskListProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const { pendingExpandId, setPendingExpandId } = useUIStore();
  const prevTasksRef = useRef<Task[]>([]);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingExpandId) {
      setExpandedId(pendingExpandId);
      setPendingExpandId(null);
    }
  }, [pendingExpandId, setPendingExpandId]);

  // Detect newly completed/cancelled tasks and trigger exit animation
  useEffect(() => {
    const prevTasks = prevTasksRef.current;
    const newlyExiting: string[] = [];

    if (view !== "logbook") {
      for (const prev of prevTasks) {
        const current = tasks.find((t) => t.id === prev.id);
        if (
          current &&
          current.status !== "active" &&
          prev.status === "active"
        ) {
          newlyExiting.push(prev.id);
        }
      }
    }

    prevTasksRef.current = tasks;

    if (newlyExiting.length === 0) return;

    setExitingIds((prev) => {
      const next = new Set(prev);
      newlyExiting.forEach((id) => next.add(id));
      return next;
    });

    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      setExitingIds((prev) => {
        const next = new Set(prev);
        newlyExiting.forEach((id) => next.delete(id));
        return next;
      });
    }, 280);
  }, [tasks, view]);

  // Filter tasks: for non-logbook views, only show active tasks or those exiting
  const visibleTasks =
    view === "logbook"
      ? tasks
      : tasks.filter((t) => t.status === "active" || exitingIds.has(t.id));

  // Build interleaved list
  const items: ListItem[] = [];
  if (headings.length > 0) {
    // Group tasks under headings
    const tasksByHeading: Record<string, Task[]> = {};
    const ungrouped: Task[] = [];
    for (const t of visibleTasks) {
      if (t.heading_id) {
        (tasksByHeading[t.heading_id] ??= []).push(t);
      } else {
        ungrouped.push(t);
      }
    }
    for (const t of ungrouped) {
      items.push({ kind: "task", task: t });
    }
    for (const h of headings) {
      items.push({ kind: "heading", heading: h });
      for (const t of tasksByHeading[h.id] ?? []) {
        items.push({ kind: "task", task: t });
      }
    }
  } else {
    for (const t of visibleTasks) {
      items.push({ kind: "task", task: t });
    }
  }

  const taskItems = items.filter(
    (i): i is { kind: "task"; task: Task } => i.kind === "task",
  );
  const taskIds = taskItems.map((i) => i.task.id);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (taskIds.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, taskIds.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const id = taskIds[selectedIndex];
        if (id) setExpandedId((prev) => (prev === id ? null : id));
      }
    },
    [taskIds, selectedIndex],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (visibleTasks.length === 0 && exitingIds.size === 0) {
    return (
      <div className={styles.empty} role="status">
        {EMPTY_STATE_MESSAGES[view]}
      </div>
    );
  }

  return (
    <div
      className={styles.list}
      ref={containerRef}
      tabIndex={0}
      aria-label="Task list"
    >
      {items.map((item) => {
        if (item.kind === "heading") {
          return <HeadingRow key={item.heading.id} heading={item.heading} />;
        }

        const { task } = item;
        const taskIdx = taskIds.indexOf(task.id);
        const isExpanded = expandedId === task.id;
        const isSelected = taskIdx === selectedIndex;
        const isExiting = exitingIds.has(task.id);
        const showTodayStar = view === "anytime" && todayTaskIds.has(task.id);

        return (
          <React.Fragment key={task.id}>
            <div className={isExiting ? styles.exiting : undefined}>
              <TaskRow
                task={task}
                isSelected={isSelected}
                isExpanded={isExpanded}
                showTodayStar={showTodayStar}
                onSelect={() => setSelectedIndex(taskIdx)}
                onExpand={(id) => setExpandedId(id)}
              />
              {isExpanded && (
                <TaskCard task={task} onCollapse={() => setExpandedId(null)} />
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
