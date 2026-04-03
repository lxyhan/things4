import React from "react";
import { AreaGroup } from "./AreaGroup";
import { useUIStore } from "../../stores/uiStore";
import type { ViewId } from "../../stores/uiStore";
import type { Area, Project } from "../../../../types";
import styles from "./Sidebar.module.css";

interface ProjectWithCounts extends Project {
  completedCount: number;
  totalCount: number;
}

interface SidebarProps {
  areas?: Area[];
  projectsByArea?: Record<string, ProjectWithCounts[]>;
  ungroupedProjects?: ProjectWithCounts[];
}

const SYSTEM_VIEWS: { id: ViewId; label: string; icon: string }[] = [
  { id: "inbox", label: "Inbox", icon: "●" },
  { id: "today", label: "Today", icon: "★" },
  { id: "upcoming", label: "Upcoming", icon: "▦" },
  { id: "anytime", label: "Anytime", icon: "◻" },
  { id: "logbook", label: "Logbook", icon: "↗" },
];

export function Sidebar({
  areas = [],
  projectsByArea = {},
  ungroupedProjects = [],
}: SidebarProps): React.JSX.Element {
  const { activeView, setActiveView } = useUIStore();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.panel}>
        <ul className={styles.systemViews}>
          {SYSTEM_VIEWS.map(({ id, label, icon }) => (
            <li key={id}>
              <button
                className={`${styles.viewItem} ${activeView === id ? styles.viewItemActive : ""}`}
                onClick={() => setActiveView(id)}
              >
                <span className={styles.icon}>{icon}</span>
                <span className={styles.viewLabel}>{label}</span>
              </button>
            </li>
          ))}
        </ul>

        {(areas.length > 0 || ungroupedProjects.length > 0) && (
          <div className={styles.divider} />
        )}

        <div className={styles.areaList}>
          {ungroupedProjects.length > 0 && (
            <div className={styles.ungrouped}>
              {ungroupedProjects.map((p) => (
                <button
                  key={p.id}
                  className={`${styles.viewItem} ${activeView === "project" ? styles.viewItemActive : ""}`}
                  onClick={() => useUIStore.getState().setActiveProjectId(p.id)}
                >
                  <span className={styles.viewLabel}>{p.title}</span>
                </button>
              ))}
            </div>
          )}

          {areas.map((area) => (
            <AreaGroup
              key={area.id}
              area={area}
              projects={projectsByArea[area.id] ?? []}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
