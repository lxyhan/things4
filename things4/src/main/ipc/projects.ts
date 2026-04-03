import { ipcMain } from "electron";
import * as projects from "../db/queries/projects";

export function registerProjectHandlers(): void {
  ipcMain.handle("projects:list", () => projects.list());

  ipcMain.handle("projects:get", (_event, id: string) => projects.get(id));

  ipcMain.handle(
    "projects:create",
    (_event, input: projects.CreateProjectInput) => projects.create(input),
  );

  ipcMain.handle(
    "projects:update",
    (_event, id: string, input: projects.UpdateProjectInput) =>
      projects.update(id, input),
  );

  ipcMain.handle("projects:complete", (_event, id: string) =>
    projects.complete(id),
  );

  ipcMain.handle("projects:cancel", (_event, id: string) =>
    projects.cancel(id),
  );

  ipcMain.handle("projects:delete", (_event, id: string) =>
    projects.deleteProject(id),
  );
}
