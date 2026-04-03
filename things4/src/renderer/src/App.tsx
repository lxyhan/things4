import React from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useUIStore } from './stores/uiStore'
import styles from './App.module.css'

function MainContent(): React.JSX.Element {
  const { activeView, activeProjectId } = useUIStore()

  const label =
    activeView === 'project' && activeProjectId
      ? `Project: ${activeProjectId}`
      : activeView.charAt(0).toUpperCase() + activeView.slice(1)

  return (
    <div className={styles.main}>
      <p className={styles.placeholder}>{label}</p>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <MainContent />
    </div>
  )
}

export default App
