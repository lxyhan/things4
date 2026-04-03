import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ChecklistItem, Task } from '../../../../types'
import { useTaskStore } from '../../stores/taskStore'
import { Checkbox } from './Checkbox'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  task: Task
  onCollapse: () => void
}

export function TaskCard({ task, onCollapse }: TaskCardProps): React.JSX.Element {
  const { optimisticComplete } = useTaskStore()

  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [waitingFor, setWaitingFor] = useState(task.waiting_for ?? '')
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist ?? [])

  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const save = useCallback(() => {
    // Optimistic save — IPC not yet wired in Phase 3D
    // When IPC is available this would call window.api.tasks.update(...)
    onCollapse()
  }, [onCollapse])

  const cancel = useCallback(() => {
    // Restore original values
    setTitle(task.title)
    setNotes(task.notes ?? '')
    setWaitingFor(task.waiting_for ?? '')
    setChecklist(task.checklist ?? [])
    onCollapse()
  }, [task, onCollapse])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancel()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        save()
      }
    },
    [save, cancel]
  )

  function handleChecklistToggle(id: string): void {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    )
  }

  function formatDate(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={styles.card} onKeyDown={handleKeyDown}>
      <div className={styles.titleRow}>
        <Checkbox
          completed={task.status === 'completed'}
          onComplete={() => optimisticComplete(task.id)}
          onUncomplete={onCollapse}
        />
        <input
          ref={titleRef}
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
      </div>

      {(task.when_date || task.deadline) && (
        <div className={styles.pills}>
          {task.when_date && (
            <span className={styles.pill}>
              <span className={styles.pillLabel}>When</span>
              {formatDate(task.when_date)}
            </span>
          )}
          {task.deadline && (
            <span className={[styles.pill, styles.pillDeadline].join(' ')}>
              <span className={styles.pillLabel}>Deadline</span>
              {formatDate(task.deadline)}
            </span>
          )}
        </div>
      )}

      <textarea
        className={styles.notes}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={3}
      />

      {checklist.length > 0 && (
        <ul className={styles.checklist}>
          {checklist.map((item) => (
            <li key={item.id} className={styles.checklistItem}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleChecklistToggle(item.id)}
                className={styles.checklistCheckbox}
              />
              <span
                className={[styles.checklistTitle, item.completed ? styles.checklistDone : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {item.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(task.waiting_for || task.waiting_since) && (
        <div className={styles.waitingRow}>
          <span className={styles.waitingLabel}>Waiting for</span>
          <input
            className={styles.waitingInput}
            value={waitingFor}
            onChange={(e) => setWaitingFor(e.target.value)}
            placeholder="Person or thing"
          />
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.btnSave} onClick={save}>
          Save
        </button>
        <button className={styles.btnCancel} onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
