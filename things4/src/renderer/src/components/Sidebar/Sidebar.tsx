import React, { useEffect, useState } from "react";
import { AreaGroup } from "./AreaGroup";
import { ProjectRow } from "./ProjectRow";
import { useUIStore } from "../../stores/uiStore";
import type { ViewId } from "../../stores/uiStore";
import type { Area, Project } from "../../../../types";
import styles from "./Sidebar.module.css";

interface ProjectWithCounts extends Project {
  completedCount: number;
  totalCount: number;
}

const SYSTEM_VIEWS: { id: ViewId; label: string; icon: string }[] = [
  { id: "inbox", label: "Inbox", icon: "●" },
  { id: "today", label: "Today", icon: "★" },
  { id: "upcoming", label: "Upcoming", icon: "▦" },
  { id: "anytime", label: "Anytime", icon: "◻" },
  { id: "logbook", label: "Logbook", icon: "↗" },
];

export function Sidebar(): React.JSX.Element {
  const { activeView, setActiveView } = useUIStore();
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<ProjectWithCounts[]>([]);

  useEffect(() => {
    window.api?.areas
      ?.list()
      .then(setAreas)
      .catch(() => undefined);

    window.api?.projects
      ?.list()
      .then((ps) => {
        setProjects(
          ps
            .filter((p) => p.status === "active")
            .map((p) => ({
              ...p,
              completedCount: p.completed_tasks ?? 0,
              totalCount: p.total_tasks ?? 0,
            })),
        );
      })
      .catch(() => undefined);
  }, []);

  const projectsByArea: Record<string, ProjectWithCounts[]> = {};
  const ungroupedProjects: ProjectWithCounts[] = [];

  for (const p of projects) {
    if (p.area_id) {
      (projectsByArea[p.area_id] ??= []).push(p);
    } else {
      ungroupedProjects.push(p);
    }
  }

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
                <ProjectRow
                  key={p.id}
                  project={p}
                  completedCount={p.completedCount}
                  totalCount={p.totalCount}
                />
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
