import React, { useEffect } from "react";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { useUIStore } from "./stores/uiStore";
import { useKeyboard } from "./hooks/useKeyboard";
import { Inbox } from "./views/Inbox";
import { Today } from "./views/Today";
import { Upcoming } from "./views/Upcoming";
import { Anytime } from "./views/Anytime";
import { Logbook } from "./views/Logbook";
import { ProjectDetail } from "./views/ProjectDetail";
import { QuickEntry } from "./components/QuickEntry/QuickEntry";
import styles from "./App.module.css";

function MainContent(): React.JSX.Element {
  const { activeView, activeProjectId } = useUIStore();

  return (
    <div className={styles.main}>
      {activeView === "inbox" && <Inbox />}
      {activeView === "today" && <Today />}
      {activeView === "upcoming" && <Upcoming />}
      {activeView === "anytime" && <Anytime />}
      {activeView === "logbook" && <Logbook />}
      {activeView === "project" && activeProjectId && (
        <ProjectDetail projectId={activeProjectId} />
      )}
      {activeView === "project" && !activeProjectId && (
        <p className={styles.placeholder}>Select a project</p>
      )}
    </div>
  );
}

function App(): React.JSX.Element {
  const { quickEntryOpen, setQuickEntryOpen } = useUIStore();

  useKeyboard();

  useEffect(() => {
    const handler = (): void => setQuickEntryOpen(true);
    window.electron?.ipcRenderer?.on("quickentry:open", handler);
    return () => {
      window.electron?.ipcRenderer?.removeListener("quickentry:open", handler);
    };
  }, [setQuickEntryOpen]);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <MainContent />
      {quickEntryOpen && (
        <div className={styles.quickEntryOverlay}>
          <QuickEntry onClose={() => setQuickEntryOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default App;
