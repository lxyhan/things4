import React from 'react'
import styles from './ProgressPie.module.css'

interface ProgressPieProps {
  completed: number
  total: number
}

export function ProgressPie({ completed, total }: ProgressPieProps): React.JSX.Element {
  const size = 14
  const radius = 5
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? Math.min(completed / total, 1) : 0
  const dashoffset = circumference * (1 - fraction)

  return (
    <svg
      className={styles.pie}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle
        className={styles.track}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        strokeWidth={2}
      />
      <circle
        className={styles.fill}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        strokeWidth={2}
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  )
}
