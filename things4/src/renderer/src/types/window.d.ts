import type { Tag, Task, Project, Area } from "../../../types";

declare global {
  interface Window {
    electron?: {
      ipcRenderer?: {
        on: (channel: string, listener: (...args: unknown[]) => void) => void;
        removeListener: (
          channel: string,
          listener: (...args: unknown[]) => void,
        ) => void;
      };
    };
    api?: {
      views?: {
        inbox: () => Promise<Task[]>;
        today: () => Promise<Task[]>;
        upcoming: () => Promise<Task[]>;
        anytime: () => Promise<Task[]>;
        logbook: () => Promise<Task[]>;
      };
      tasks?: {
        list: (view: string) => Promise<Task[]>;
        get: (id: string) => Promise<Task>;
        create: (input: {
          title: string;
          notes?: string | null;
          status?: "active" | "completed" | "cancelled";
          when_date?: string | null;
          deadline?: string | null;
          tag_ids?: string[];
          project_id?: string | null;
          area_id?: string | null;
          heading_id?: string | null;
        }) => Promise<Task>;
        update: (id: string, input: Partial<Task>) => Promise<Task>;
        complete: (id: string) => Promise<void>;
        cancel: (id: string) => Promise<void>;
        delete: (id: string) => Promise<void>;
        move: (
          id: string,
          beforeId: string | null,
          afterId: string | null,
        ) => Promise<void>;
      };
      tags?: {
        list: () => Promise<Tag[]>;
        create: (input: {
          name: string;
          color?: string | null;
          shortcut?: string | null;
        }) => Promise<Tag>;
        update: (id: string, input: Partial<Tag>) => Promise<Tag>;
        delete: (id: string) => Promise<void>;
        forTask: (taskId: string) => Promise<Tag[]>;
        attachToTask: (tagId: string, taskId: string) => Promise<void>;
        detachFromTask: (tagId: string, taskId: string) => Promise<void>;
      };
      projects?: {
        list: () => Promise<Project[]>;
        get: (id: string) => Promise<Project>;
        create: (input: Partial<Project>) => Promise<Project>;
        update: (id: string, input: Partial<Project>) => Promise<Project>;
        complete: (id: string) => Promise<void>;
        cancel: (id: string) => Promise<void>;
        delete: (id: string) => Promise<void>;
      };
      areas?: {
        list: () => Promise<Area[]>;
        create: (input: Partial<Area>) => Promise<Area>;
        update: (id: string, input: Partial<Area>) => Promise<Area>;
        delete: (id: string) => Promise<void>;
      };
      search?: {
        query: (q: string) => Promise<Task[]>;
      };
    };
  }
}
