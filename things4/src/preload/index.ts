import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

contextBridge.exposeInMainWorld("electron", electronAPI);

contextBridge.exposeInMainWorld("api", {
  tasks: {
    list: (view: string) => ipcRenderer.invoke("tasks:list", view),
    get: (id: string) => ipcRenderer.invoke("tasks:get", id),
    create: (input: unknown) => ipcRenderer.invoke("tasks:create", input),
    update: (id: string, input: unknown) =>
      ipcRenderer.invoke("tasks:update", id, input),
    complete: (id: string) => ipcRenderer.invoke("tasks:complete", id),
    cancel: (id: string) => ipcRenderer.invoke("tasks:cancel", id),
    delete: (id: string) => ipcRenderer.invoke("tasks:delete", id),
    move: (id: string, beforeId: string | null, afterId: string | null) =>
      ipcRenderer.invoke("tasks:move", id, beforeId, afterId),
  },
  projects: {
    list: () => ipcRenderer.invoke("projects:list"),
    get: (id: string) => ipcRenderer.invoke("projects:get", id),
    create: (input: unknown) => ipcRenderer.invoke("projects:create", input),
    update: (id: string, input: unknown) =>
      ipcRenderer.invoke("projects:update", id, input),
    complete: (id: string) => ipcRenderer.invoke("projects:complete", id),
    cancel: (id: string) => ipcRenderer.invoke("projects:cancel", id),
    delete: (id: string) => ipcRenderer.invoke("projects:delete", id),
  },
  areas: {
    list: () => ipcRenderer.invoke("areas:list"),
    create: (input: unknown) => ipcRenderer.invoke("areas:create", input),
    update: (id: string, input: unknown) =>
      ipcRenderer.invoke("areas:update", id, input),
    delete: (id: string) => ipcRenderer.invoke("areas:delete", id),
  },
  tags: {
    list: () => ipcRenderer.invoke("tags:list"),
    create: (input: unknown) => ipcRenderer.invoke("tags:create", input),
    update: (id: string, input: unknown) =>
      ipcRenderer.invoke("tags:update", id, input),
    delete: (id: string) => ipcRenderer.invoke("tags:delete", id),
  },
  views: {
    inbox: () => ipcRenderer.invoke("tasks:list", "inbox"),
    today: () => ipcRenderer.invoke("tasks:list", "today"),
    upcoming: () => ipcRenderer.invoke("tasks:list", "upcoming"),
    anytime: () => ipcRenderer.invoke("tasks:list", "anytime"),
    logbook: () => ipcRenderer.invoke("tasks:list", "logbook"),
  },
  search: {
    query: (q: string) => ipcRenderer.invoke("search:query", q),
  },
});
