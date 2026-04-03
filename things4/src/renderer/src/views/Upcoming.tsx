import React, { useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import type { Task } from "../../../types";
import { TaskList } from "../components/TaskList/TaskList";
import styles from "./Upcoming.module.css";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(iso: string): string {
  return iso.slice(0, 8) + "01";
}

function formatDayHeader(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatWeekHeader(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function formatMonthHeader(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface DayGroup {
  type: "day";
  key: string;
  label: string;
  tasks: Task[];
}

interface WeekGroup {
  type: "week";
  key: string;
  label: string;
  tasks: Task[];
}

interface MonthGroup {
  type: "month";
  key: string;
  label: string;
  tasks: Task[];
}

type Group = DayGroup | WeekGroup | MonthGroup;

function buildGroups(tasks: Task[]): Group[] {
  const today = todayISO();
  const day7 = addDays(today, 7);

  const groups = new Map<string, Group>();

  for (const task of tasks) {
    const date = task.when_date;
    if (!date || date === "evening") continue;

    if (date <= today) continue; // past dates skipped in upcoming

    if (date < day7) {
      // Individual day group
      const key = `day:${date}`;
      if (!groups.has(key)) {
        groups.set(key, {
          type: "day",
          key,
          label: formatDayHeader(date),
          tasks: [],
        });
      }
      (groups.get(key) as DayGroup).tasks.push(task);
    } else {
      // Beyond 7 days: try week first then month
      const weekKey = `week:${startOfWeek(date)}`;
      const monthKey = `month:${startOfMonth(date)}`;

      // Use week groups for near future (within 4 weeks), month for further
      const weeksOut =
        (new Date(date).getTime() - new Date(today).getTime()) /
        (7 * 24 * 3600 * 1000);
      if (weeksOut < 4) {
        if (!groups.has(weekKey)) {
          groups.set(weekKey, {
            type: "week",
            key: weekKey,
            label: formatWeekHeader(startOfWeek(date)),
            tasks: [],
          });
        }
        (groups.get(weekKey) as WeekGroup).tasks.push(task);
      } else {
        if (!groups.has(monthKey)) {
          groups.set(monthKey, {
            type: "month",
            key: monthKey,
            label: formatMonthHeader(date),
            tasks: [],
          });
        }
        (groups.get(monthKey) as MonthGroup).tasks.push(task);
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const aDate = a.key.split(":")[1];
    const bDate = b.key.split(":")[1];
    return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
  });
}

export function Upcoming(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore();
  const tasks = tasksByView.upcoming;

  useEffect(() => {
    loadTasks("upcoming");
  }, [loadTasks]);

  if (loading && tasks.length === 0) {
    return <div className={styles.container} />;
  }

  const groups = buildGroups(tasks);

  if (groups.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Nothing upcoming</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <h2
            className={
              group.type === "month"
                ? styles.monthHeader
                : group.type === "week"
                  ? styles.weekHeader
                  : styles.dayHeader
            }
          >
            {group.label}
          </h2>
          <TaskList tasks={group.tasks} view="upcoming" />
        </section>
      ))}
    </div>
  );
}
