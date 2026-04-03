import { useTaskStore } from "../stores/taskStore";
import type { ViewId } from "../stores/uiStore";
import type { Task } from "../../../types";

export function useTasks(view: ViewId): Task[] {
  return useTaskStore((state) => {
    if (view === "project") return [];
    return state.tasksByView[view as keyof typeof state.tasksByView] ?? [];
  });
}

export function useTaskLoading(): boolean {
  return useTaskStore((state) => state.loading);
}

export function useActiveTaskId(): string | null {
  return useTaskStore((state) => state.activeTaskId);
}
