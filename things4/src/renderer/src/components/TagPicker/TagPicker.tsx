import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { Tag } from "../../../../types";
import styles from "./TagPicker.module.css";

export interface TagPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

function computePosition(anchorEl?: HTMLElement | null): React.CSSProperties {
  if (!anchorEl) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -20%)" };
  }
  const rect = anchorEl.getBoundingClientRect();
  const pickerWidth = 220;
  let left = rect.left;
  if (left + pickerWidth > window.innerWidth - 8) {
    left = window.innerWidth - pickerWidth - 8;
  }
  return { top: rect.bottom + 4, left: Math.max(8, left) };
}

export function TagPicker({
  selectedIds,
  onChange,
  onClose,
  anchorEl,
}: TagPickerProps): React.JSX.Element {
  const [tags, setTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.api?.tags
      ?.list()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  const filtered = query.trim()
    ? tags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : tags;

  const showCreate =
    query.trim() &&
    !tags.some((t) => t.name.toLowerCase() === query.trim().toLowerCase());

  const totalOptions = filtered.length + (showCreate ? 1 : 0);

  const toggleTag = useCallback(
    (id: string) => {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id];
      onChange(next);
    },
    [selectedIds, onChange],
  );

  const createTag = useCallback(async () => {
    if (!query.trim()) return;
    try {
      const newTag = await window.api?.tags?.create({
        name: query.trim(),
        color: null,
        shortcut: null,
      });
      if (newTag) {
        setTags((prev) => [...prev, newTag]);
        onChange([...selectedIds, newTag.id]);
        setQuery("");
      }
    } catch {
      // no-op if API unavailable
    }
  }, [query, selectedIds, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(i + 1, totalOptions - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIdx < filtered.length) {
        toggleTag(filtered[focusedIdx].id);
      } else if (showCreate) {
        createTag();
      }
      return;
    }
  };

  // Reset focus when filtered list changes
  useEffect(() => {
    setFocusedIdx(0);
  }, [query]);

  const position = computePosition(anchorEl);

  const picker = (
    <div
      className={styles.container}
      ref={containerRef}
      style={position}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={styles.searchRow}>
        <input
          ref={inputRef}
          className={styles.searchInput}
          placeholder="Search tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && !showCreate && (
          <div className={styles.empty}>No tags yet</div>
        )}

        {filtered.map((tag, idx) => {
          const isSelected = selectedIds.includes(tag.id);
          const isFocused = idx === focusedIdx;
          return (
            <button
              key={tag.id}
              className={[
                styles.tagRow,
                isSelected ? styles.tagRowSelected : "",
                isFocused ? styles.tagRowFocused : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(e) => {
                e.preventDefault();
                toggleTag(tag.id);
              }}
            >
              <span
                className={styles.colorDot}
                style={{
                  background: tag.color ?? "var(--color-text-tertiary)",
                }}
              />
              <span className={styles.tagName}>{tag.name}</span>
              {tag.shortcut && (
                <span className={styles.shortcut}>{tag.shortcut}</span>
              )}
              {isSelected && <span className={styles.checkmark}>✓</span>}
            </button>
          );
        })}

        {showCreate && (
          <button
            className={[
              styles.tagRow,
              styles.createRow,
              focusedIdx === filtered.length ? styles.tagRowFocused : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onMouseDown={(e) => {
              e.preventDefault();
              createTag();
            }}
          >
            <span className={styles.createIcon}>+</span>
            <span className={styles.tagName}>Create "{query.trim()}"</span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(picker, document.body);
}
