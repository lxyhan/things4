import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "../stores/uiStore";
import type { Task } from "../../../types";
import styles from "./Search.module.css";

function highlightMatch(text: string, query: string): React.JSX.Element {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function statusBadge(status: Task["status"]): string | null {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return null;
}

export function Search(): React.JSX.Element {
  const { setSearchFocused } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc closes search from the container level too
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setSearchFocused(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setSearchFocused]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      window.api?.search
        ?.query(query)
        .then((res) => {
          setResults(res ?? []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.searchBarWrapper}>
        <div className={styles.searchBar}>
          <svg
            className={styles.icon}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="6.5"
              cy="6.5"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <line
              x1="10.5"
              y1="10.5"
              x2="14.5"
              y2="14.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search tasks and notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {hasQuery && (
            <button
              className={styles.clearBtn}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <svg
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="1"
                  y1="1"
                  x2="11"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="11"
                  y1="1"
                  x2="1"
                  y2="11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.results}>
        {!hasQuery && (
          <p className={styles.hint}>
            Type to search across all tasks and notes.
          </p>
        )}

        {hasQuery && loading && <p className={styles.hint}>Searching…</p>}

        {hasQuery && !loading && results.length === 0 && (
          <p className={styles.hint}>No results for &ldquo;{query}&rdquo;</p>
        )}

        {hasQuery && !loading && results.length > 0 && (
          <ul className={styles.list}>
            {results.map((task) => {
              const badge = statusBadge(task.status);
              return (
                <li key={task.id} className={styles.resultItem}>
                  <span
                    className={
                      task.status === "active"
                        ? styles.bullet
                        : styles.bulletDone
                    }
                  />
                  <span className={styles.resultBody}>
                    <span
                      className={
                        task.status === "active"
                          ? styles.title
                          : styles.titleDone
                      }
                    >
                      {highlightMatch(task.title, query)}
                    </span>
                    {task.notes && (
                      <span className={styles.notes}>
                        {highlightMatch(
                          task.notes.length > 120
                            ? task.notes.slice(0, 120) + "…"
                            : task.notes,
                          query,
                        )}
                      </span>
                    )}
                  </span>
                  {badge && <span className={styles.statusBadge}>{badge}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
