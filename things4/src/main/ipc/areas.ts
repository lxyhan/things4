import { ipcMain } from "electron";
import * as areas from "../db/queries/areas";

export function registerAreaHandlers(): void {
  ipcMain.handle("areas:list", () => areas.list());

  ipcMain.handle("areas:create", (_event, input: areas.CreateAreaInput) =>
    areas.create(input),
  );

  ipcMain.handle(
    "areas:update",
    (_event, id: string, input: areas.UpdateAreaInput) =>
      areas.update(id, input),
  );

  ipcMain.handle("areas:delete", (_event, id: string) => areas.deleteArea(id));
}
