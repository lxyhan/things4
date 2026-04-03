import React from 'react'
import { ProgressPie } from '../ProgressPie/ProgressPie'
import { useUIStore } from '../../stores/uiStore'
import type { Project } from '../../../../types'
import styles from './ProjectRow.module.css'

interface ProjectRowProps {
  project: Project
  completedCount: number
  totalCount: number
}

export function ProjectRow({ project, completedCount, totalCount }: ProjectRowProps): React.JSX.Element {
  const { activeProjectId, setActiveProjectId } = useUIStore()
  const isActive = activeProjectId === project.id

  return (
    <button
      className={`${styles.row} ${isActive ? styles.active : ''}`}
      onClick={() => setActiveProjectId(project.id)}
      title={project.title}
    >
      <ProgressPie completed={completedCount} total={totalCount} />
      <span className={styles.title}>{project.title}</span>
    </button>
  )
}
