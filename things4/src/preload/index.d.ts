import { ElectronAPI } from "@electron-toolkit/preload";
import type { Task, Project, Area, Tag } from "../types";

export interface ProjectWithProgress extends Project {
  total_tasks: number;
  completed_tasks: number;
  progress: number;
}

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  checklist?: Task["checklist"];
  project_id?: string | null;
  area_id?: string | null;
  heading_id?: string | null;
  when_date?: string | null;
  reminder_time?: string | null;
  deadline?: string | null;
  waiting_for?: string | null;
  waiting_since?: string | null;
  repeat_rule?: Task["repeat_rule"];
  position?: number;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  checklist?: Task["checklist"];
  project_id?: string | null;
  area_id?: string | null;
  heading_id?: string | null;
  when_date?: string | null;
  reminder_time?: string | null;
  deadline?: string | null;
  waiting_for?: string | null;
  waiting_since?: string | null;
  repeat_rule?: Task["repeat_rule"];
}

export interface CreateProjectInput {
  title: string;
  notes?: string | null;
  area_id?: string | null;
  when_date?: string | null;
  deadline?: string | null;
  position?: number;
}

export interface UpdateProjectInput {
  title?: string;
  notes?: string | null;
  area_id?: string | null;
  when_date?: string | null;
  deadline?: string | null;
  status?: Project["status"];
}

export interface CreateAreaInput {
  title: string;
  position?: number;
}

export interface UpdateAreaInput {
  title?: string;
  position?: number;
}

export interface CreateTagInput {
  name: string;
  shortcut?: string | null;
  color?: string | null;
  position?: number;
}

export interface UpdateTagInput {
  name?: string;
  shortcut?: string | null;
  color?: string | null;
  position?: number;
}

export type ViewName = "inbox" | "today" | "upcoming" | "anytime" | "logbook";

export interface WindowApi {
  tasks: {
    list: (view: ViewName) => Promise<Task[]>;
    get: (id: string) => Promise<Task | null>;
    create: (input: CreateTaskInput) => Promise<Task>;
    update: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
    complete: (id: string) => Promise<Task | null>;
    cancel: (id: string) => Promise<Task | null>;
    delete: (id: string) => Promise<void>;
    move: (
      id: string,
      beforeId: string | null,
      afterId: string | null,
    ) => Promise<Task | null>;
  };
  projects: {
    list: () => Promise<ProjectWithProgress[]>;
    get: (id: string) => Promise<Project | null>;
    create: (input: CreateProjectInput) => Promise<Project>;
    update: (id: string, input: UpdateProjectInput) => Promise<Project | null>;
    complete: (id: string) => Promise<Project | null>;
    cancel: (id: string) => Promise<Project | null>;
    delete: (id: string) => Promise<void>;
  };
  areas: {
    list: () => Promise<Area[]>;
    create: (input: CreateAreaInput) => Promise<Area>;
    update: (id: string, input: UpdateAreaInput) => Promise<Area | null>;
    delete: (id: string) => Promise<void>;
  };
  tags: {
    list: () => Promise<Tag[]>;
    create: (input: CreateTagInput) => Promise<Tag>;
    update: (id: string, input: UpdateTagInput) => Promise<Tag | null>;
    delete: (id: string) => Promise<void>;
  };
  views: {
    inbox: () => Promise<Task[]>;
    today: () => Promise<Task[]>;
    upcoming: () => Promise<Task[]>;
    anytime: () => Promise<Task[]>;
    logbook: () => Promise<Task[]>;
  };
  search: {
    query: (q: string) => Promise<Task[]>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: WindowApi;
  }
}
