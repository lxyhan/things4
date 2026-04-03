import { useEffect } from "react";
import { useUIStore } from "../stores/uiStore";
import { useTaskStore } from "../stores/taskStore";
import type { ViewId } from "../stores/uiStore";
import type { Task } from "../../../types";

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function adjustWhenDate(task: Task, days: number): void {
  let base: Date;
  if (task.when_date && /^\d{4}-\d{2}-\d{2}$/.test(task.when_date)) {
    base = new Date(task.when_date + "T00:00:00");
  } else {
    base = new Date();
    base.setHours(0, 0, 0, 0);
  }
  base.setDate(base.getDate() + days);
  window.api?.tasks?.update(task.id, { when_date: toISO(base) });
}

const VIEW_MAP: Record<string, ViewId> = {
  "1": "inbox",
  "2": "today",
  "3": "upcoming",
  "4": "anytime",
  "5": "logbook",
};

export function useKeyboard(): void {
  useEffect(() => {
    let ui = useUIStore.getState();
    let tasks = useTaskStore.getState();

    const unsubUI = useUIStore.subscribe((s) => {
      ui = s;
    });
    const unsubTask = useTaskStore.subscribe((s) => {
      tasks = s;
    });

    function findTask(id: string): Task | null {
      for (const list of Object.values(tasks.tasksByView)) {
        const found = list.find((t: Task) => t.id === id);
        if (found) return found;
      }
      return null;
    }

    const handler = (e: KeyboardEvent): void => {
      // Esc always closes search, even when input is focused
      if (e.key === "Escape" && ui.searchFocused) {
        e.preventDefault();
        e.stopPropagation();
        ui.setSearchFocused(false);
        return;
      }

      if (isTypingTarget(document.activeElement)) return;

      const meta = e.metaKey;
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const lKey = e.key.toLowerCase();

      // Cmd+1..5: navigate to view
      if (meta && !ctrl && !shift && !alt && VIEW_MAP[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        ui.setActiveView(VIEW_MAP[e.key]);
        return;
      }

      // Cmd+/: toggle sidebar
      if (meta && !ctrl && !shift && !alt && e.key === "/") {
        e.preventDefault();
        e.stopPropagation();
        ui.toggleSidebar();
        return;
      }

      // Cmd+N: request new task in current view
      if (meta && !ctrl && !shift && !alt && lKey === "n") {
        e.preventDefault();
        e.stopPropagation();
        ui.requestNewTask();
        return;
      }

      // Cmd+F: focus search
      if (meta && !ctrl && !shift && !alt && lKey === "f") {
        e.preventDefault();
        e.stopPropagation();
        ui.setSearchFocused(true);
        return;
      }

      // Shortcuts below require a selected task
      const taskId = ui.selectedTaskId;
      if (!taskId) return;

      // Cmd+K: complete selected task
      if (meta && !ctrl && !shift && !alt && lKey === "k") {
        e.preventDefault();
        e.stopPropagation();
        tasks.optimisticComplete(taskId);
        return;
      }

      // Cmd+Option+K: cancel selected task
      if (meta && !ctrl && !shift && alt && lKey === "k") {
        e.preventDefault();
        e.stopPropagation();
        tasks.optimisticCancel(taskId);
        return;
      }

      // Cmd+T: set when = today
      if (meta && !ctrl && !shift && !alt && lKey === "t") {
        e.preventDefault();
        e.stopPropagation();
        window.api?.tasks?.update(taskId, { when_date: "today" });
        return;
      }

      // Cmd+E: set when = evening
      if (meta && !ctrl && !shift && !alt && lKey === "e") {
        e.preventDefault();
        e.stopPropagation();
        window.api?.tasks?.update(taskId, { when_date: "evening" });
        return;
      }

      // Cmd+R: clear when
      if (meta && !ctrl && !shift && !alt && lKey === "r") {
        e.preventDefault();
        e.stopPropagation();
        window.api?.tasks?.update(taskId, { when_date: null });
        return;
      }

      // Cmd+O: set when = someday
      if (meta && !ctrl && !shift && !alt && lKey === "o") {
        e.preventDefault();
        e.stopPropagation();
        window.api?.tasks?.update(taskId, { when_date: "someday" });
        return;
      }

      // Cmd+S: open WhenPicker
      if (meta && !ctrl && !shift && !alt && lKey === "s") {
        e.preventDefault();
        e.stopPropagation();
        ui.setOpenPicker("when");
        return;
      }

      // Cmd+Shift+D: open DeadlinePicker
      if (meta && !ctrl && shift && !alt && lKey === "d") {
        e.preventDefault();
        e.stopPropagation();
        ui.setOpenPicker("deadline");
        return;
      }

      // Ctrl+]: when_date +1 day
      if (!meta && ctrl && !shift && !alt && e.key === "]") {
        e.preventDefault();
        e.stopPropagation();
        const task = findTask(taskId);
        if (task) adjustWhenDate(task, 1);
        return;
      }

      // Ctrl+[: when_date -1 day
      if (!meta && ctrl && !shift && !alt && e.key === "[") {
        e.preventDefault();
        e.stopPropagation();
        const task = findTask(taskId);
        if (task) adjustWhenDate(task, -1);
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      unsubUI();
      unsubTask();
    };
  }, []);
}
