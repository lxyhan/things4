import { create } from 'zustand'
import type { Task } from '../../../types'
import type { ViewId } from './uiStore'

interface TasksByView {
  inbox: Task[]
  today: Task[]
  upcoming: Task[]
  anytime: Task[]
  logbook: Task[]
}

interface TaskState {
  tasksByView: TasksByView
  activeTaskId: string | null
  loading: boolean
  error: string | null

  loadTasks: (view: ViewId) => Promise<void>
  setActiveTaskId: (id: string | null) => void
  optimisticComplete: (id: string) => void
  optimisticCancel: (id: string) => void
}

const emptyByView: TasksByView = {
  inbox: [],
  today: [],
  upcoming: [],
  anytime: [],
  logbook: []
}

export const useTaskStore = create<TaskState>((set) => ({
  tasksByView: emptyByView,
  activeTaskId: null,
  loading: false,
  error: null,

  loadTasks: async (view) => {
    if (view === 'project') return

    set({ loading: true, error: null })
    try {
      const apiView = window.api?.views?.[view as keyof typeof window.api.views]
      const tasks = apiView ? await apiView() : []
      set((state) => ({
        tasksByView: { ...state.tasksByView, [view]: tasks },
        loading: false
      }))
    } catch (err) {
      set({ loading: false, error: String(err) })
    }
  },

  setActiveTaskId: (id) => set({ activeTaskId: id }),

  optimisticComplete: (id) => {
    set((state) => {
      const updated: TasksByView = {} as TasksByView
      for (const view of Object.keys(state.tasksByView) as (keyof TasksByView)[]) {
        updated[view] = state.tasksByView[view].map((t) =>
          t.id === id ? { ...t, status: 'completed' as const } : t
        )
      }
      return { tasksByView: updated }
    })
    window.api?.tasks?.complete(id)
  },

  optimisticCancel: (id) => {
    set((state) => {
      const updated: TasksByView = {} as TasksByView
      for (const view of Object.keys(state.tasksByView) as (keyof TasksByView)[]) {
        updated[view] = state.tasksByView[view].map((t) =>
          t.id === id ? { ...t, status: 'cancelled' as const } : t
        )
      }
      return { tasksByView: updated }
    })
    window.api?.tasks?.cancel(id)
  }
}))
