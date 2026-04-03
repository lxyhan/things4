import React, { useEffect, useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import type { Task, Project, Area } from '../../../types'
import styles from './Anytime.module.css'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function isInToday(task: Task): boolean {
  if (!task.when_date) return false
  return task.when_date === todayISO() || task.when_date === 'evening'
}

interface GroupEntry {
  label: string
  tasks: Task[]
}

function buildGroups(
  tasks: Task[],
  projects: Project[],
  areas: Area[]
): GroupEntry[] {
  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const areaMap = new Map(areas.map((a) => [a.id, a]))

  // Group by project first, then area, then ungrouped
  const grouped = new Map<string, GroupEntry>()

  for (const task of tasks) {
    let key: string
    let label: string

    if (task.project_id) {
      key = `project:${task.project_id}`
      label = projectMap.get(task.project_id)?.title ?? 'Unknown Project'
    } else if (task.area_id) {
      key = `area:${task.area_id}`
      label = areaMap.get(task.area_id)?.title ?? 'Unknown Area'
    } else {
      key = 'ungrouped'
      label = 'No Project'
    }

    if (!grouped.has(key)) {
      grouped.set(key, { label, tasks: [] })
    }
    grouped.get(key)!.tasks.push(task)
  }

  // Filter out empty containers (though loadTasks should only return active tasks)
  return Array.from(grouped.values()).filter((g) => g.tasks.length > 0)
}

export function Anytime(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore()
  const tasks = tasksByView.anytime
  const [projects, setProjects] = useState<Project[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const today = todayISO()

  useEffect(() => {
    loadTasks('anytime')
    window.api?.projects?.list().then(setProjects).catch(() => undefined)
    window.api?.areas?.list().then(setAreas).catch(() => undefined)
  }, [loadTasks])

  if (loading && tasks.length === 0) {
    return <div className={styles.container} />
  }

  if (tasks.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No tasks</div>
      </div>
    )
  }

  const groups = buildGroups(tasks, projects, areas)

  return (
    <div className={styles.container}>
      {groups.map((group) => (
        <section key={group.label} className={styles.group}>
          <h2 className={styles.groupHeader}>{group.label}</h2>
          <ul className={styles.taskList}>
            {group.tasks.map((task) => (
              <li key={task.id} className={styles.taskRow}>
                <span className={styles.taskTitle}>{task.title}</span>
                {isInToday(task) && (
                  <span className={styles.todayStar} title={`Scheduled: ${task.when_date}`}>
                    ★
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
