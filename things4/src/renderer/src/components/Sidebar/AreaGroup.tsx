import React, { useState } from "react";
import { ProjectRow } from "./ProjectRow";
import type { Area, Project } from "../../../../types";
import styles from "./AreaGroup.module.css";

interface ProjectWithCounts extends Project {
  completedCount: number;
  totalCount: number;
}

interface AreaGroupProps {
  area: Area;
  projects: ProjectWithCounts[];
}

export function AreaGroup({
  area,
  projects,
}: AreaGroupProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.group}>
      <button
        className={styles.header}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span
          className={`${styles.chevron} ${collapsed ? styles.chevronCollapsed : ""}`}
        >
          ▸
        </span>
        <span className={styles.label}>{area.title}</span>
      </button>
      {!collapsed && (
        <div className={styles.projects}>
          {projects.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              completedCount={p.completedCount}
              totalCount={p.totalCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
