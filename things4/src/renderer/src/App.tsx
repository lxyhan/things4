import React from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useUIStore } from './stores/uiStore'
import { Inbox } from './views/Inbox'
import { Today } from './views/Today'
import { Upcoming } from './views/Upcoming'
import { Anytime } from './views/Anytime'
import { Logbook } from './views/Logbook'
import { ProjectDetail } from './views/ProjectDetail'
import styles from './App.module.css'

function MainContent(): React.JSX.Element {
  const { activeView, activeProjectId } = useUIStore()

  return (
    <div className={styles.main}>
      {activeView === 'inbox' && <Inbox />}
      {activeView === 'today' && <Today />}
      {activeView === 'upcoming' && <Upcoming />}
      {activeView === 'anytime' && <Anytime />}
      {activeView === 'logbook' && <Logbook />}
      {activeView === 'project' && activeProjectId && (
        <ProjectDetail projectId={activeProjectId} />
      )}
      {activeView === 'project' && !activeProjectId && (
        <p className={styles.placeholder}>Select a project</p>
      )}
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
