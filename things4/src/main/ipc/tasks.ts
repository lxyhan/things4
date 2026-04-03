import { ipcMain } from "electron";
import * as tasks from "../db/queries/tasks";

export function registerTaskHandlers(): void {
  ipcMain.handle("tasks:list", (_event, view: tasks.ViewName) =>
    tasks.listByView(view),
  );

  ipcMain.handle("tasks:get", (_event, id: string) => tasks.get(id));

  ipcMain.handle("tasks:create", (_event, input: tasks.CreateTaskInput) =>
    tasks.create(input),
  );

  ipcMain.handle(
    "tasks:update",
    (_event, id: string, input: tasks.UpdateTaskInput) =>
      tasks.update(id, input),
  );

  ipcMain.handle("tasks:complete", (_event, id: string) => tasks.complete(id));

  ipcMain.handle("tasks:cancel", (_event, id: string) => tasks.cancel(id));

  ipcMain.handle("tasks:delete", (_event, id: string) => tasks.deleteTask(id));

  ipcMain.handle(
    "tasks:move",
    (_event, id: string, beforeId: string | null, afterId: string | null) =>
      tasks.move(id, beforeId, afterId),
  );
}
