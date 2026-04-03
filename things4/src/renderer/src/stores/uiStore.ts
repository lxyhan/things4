import { create } from "zustand";

export type ViewId =
  | "inbox"
  | "today"
  | "upcoming"
  | "anytime"
  | "logbook"
  | "project";

interface UIState {
  activeView: ViewId;
  selectedTaskId: string | null;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  activeProjectId: string | null;
  openPicker: "when" | "deadline" | null;
  newTaskRequested: boolean;
  searchFocused: boolean;
  quickEntryOpen: boolean;

  setActiveView: (view: ViewId) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setActiveProjectId: (id: string | null) => void;
  setOpenPicker: (picker: "when" | "deadline" | null) => void;
  requestNewTask: () => void;
  clearNewTaskRequest: () => void;
  setSearchFocused: (focused: boolean) => void;
  setQuickEntryOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "inbox",
  selectedTaskId: null,
  sidebarCollapsed: false,
  theme: "light",
  activeProjectId: null,
  openPicker: null,
  newTaskRequested: false,
  searchFocused: false,
  quickEntryOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setActiveProjectId: (id) =>
    set({ activeProjectId: id, activeView: "project" }),
  setOpenPicker: (picker) => set({ openPicker: picker }),
  requestNewTask: () => set({ newTaskRequested: true }),
  clearNewTaskRequest: () => set({ newTaskRequested: false }),
  setSearchFocused: (focused) => set({ searchFocused: focused }),
  setQuickEntryOpen: (open) => set({ quickEntryOpen: open }),
}));
