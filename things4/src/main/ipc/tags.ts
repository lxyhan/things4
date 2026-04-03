import { ipcMain } from "electron";
import * as tags from "../db/queries/tags";

export function registerTagHandlers(): void {
  ipcMain.handle("tags:list", () => tags.list());

  ipcMain.handle("tags:create", (_event, input: tags.CreateTagInput) =>
    tags.create(input),
  );

  ipcMain.handle(
    "tags:update",
    (_event, id: string, input: tags.UpdateTagInput) => tags.update(id, input),
  );

  ipcMain.handle("tags:delete", (_event, id: string) => tags.deleteTag(id));

  ipcMain.handle("tags:attachToTask", (_event, tagId: string, taskId: string) =>
    tags.attachToTask(tagId, taskId),
  );

  ipcMain.handle(
    "tags:detachFromTask",
    (_event, tagId: string, taskId: string) =>
      tags.detachFromTask(tagId, taskId),
  );

  ipcMain.handle(
    "tags:attachToProject",
    (_event, tagId: string, projectId: string) =>
      tags.attachToProject(tagId, projectId),
  );

  ipcMain.handle(
    "tags:detachFromProject",
    (_event, tagId: string, projectId: string) =>
      tags.detachFromProject(tagId, projectId),
  );

  ipcMain.handle("tags:forTask", (_event, taskId: string) =>
    tags.forTask(taskId),
  );
}
