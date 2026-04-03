import { useState, useEffect } from "react";
import type { Project } from "../../../types";

export function useProjects(): { projects: Project[]; loading: boolean } {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    window.api?.projects
      ?.list()
      .then((data) => {
        setProjects(data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { projects, loading };
}
