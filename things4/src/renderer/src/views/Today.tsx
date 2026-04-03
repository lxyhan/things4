import React, { useEffect, useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import type { Task } from '../../../types'
import styles from './Today.module.css'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function isOverdue(task: Task): boolean {
  if (!task.deadline) return false
  return task.deadline < todayISO()
}

function isDeadlineToday(task: Task): boolean {
  if (!task.deadline) return false
  return task.deadline === todayISO()
}

function deadlineClass(task: Task): string {
  if (isOverdue(task)) return styles.deadlineOver
  if (isDeadlineToday(task)) return styles.deadlineSoon
  return ''
}

export function Today(): React.JSX.Element {
  const { tasksByView, loading, loadTasks } = useTaskStore()
  const allTasks = tasksByView.today
  const [eveningCollapsed, setEveningCollapsed] = useState(false)

  useEffect(() => {
    loadTasks('today')
  }, [loadTasks])

  const mainTasks = allTasks.filter((t) => t.when_date !== 'evening')
  const eveningTasks = allTasks.filter((t) => t.when_date === 'evening')

  if (loading && allTasks.length === 0) {
    return <div className={styles.container} />
  }

  return (
    <div className={styles.container}>
      {mainTasks.length > 0 && (
        <ul className={styles.taskList}>
          {mainTasks.map((task) => (
            <li key={task.id} className={`${styles.taskRow} ${deadlineClass(task)}`}>
              <span className={styles.taskTitle}>{task.title}</span>
              {task.deadline && (
                <span className={`${styles.deadlineBadge} ${deadlineClass(task)}`}>
                  {task.deadline}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {mainTasks.length === 0 && eveningTasks.length === 0 && (
        <div className={styles.empty}>Nothing for today</div>
      )}

      {eveningTasks.length > 0 && (
        <section className={styles.eveningSection}>
          <button
            className={styles.eveningHeader}
            onClick={() => setEveningCollapsed((c) => !c)}
          >
            <span className={styles.moonIcon}>🌙</span>
            <span className={styles.eveningLabel}>This Evening</span>
            <span className={styles.collapseChevron}>
              {eveningCollapsed ? '▶' : '▼'}
            </span>
          </button>
          {!eveningCollapsed && (
            <ul className={styles.taskList}>
              {eveningTasks.map((task) => (
                <li key={task.id} className={`${styles.taskRow} ${deadlineClass(task)}`}>
                  <span className={styles.taskTitle}>{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
