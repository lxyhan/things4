import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ChecklistItem, Task } from "../../../../types";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import { Checkbox } from "./Checkbox";
import { WhenPicker } from "../DatePicker/WhenPicker";
import { DeadlinePicker } from "../DatePicker/DeadlinePicker";
import { TagPicker } from "../TagPicker/TagPicker";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  onCollapse: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  if (iso === "today") return "Today";
  if (iso === "evening") return "This Evening";
  if (iso === "someday") return "Someday";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TaskCard({
  task,
  onCollapse,
}: TaskCardProps): React.JSX.Element {
  const { optimisticComplete, loadTasks } = useTaskStore();
  const { activeView } = useUIStore();

  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [waitingFor, setWaitingFor] = useState(task.waiting_for ?? "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task.checklist ?? [],
  );
  const [whenDate, setWhenDate] = useState<string | null>(task.when_date);
  const [deadline, setDeadline] = useState<string | null>(task.deadline);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [openPicker, setOpenPicker] = useState<"when" | "deadline" | null>(
    null,
  );
  const [tagPickerOpen, setTagPickerOpen] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const whenBtnRef = useRef<HTMLButtonElement>(null);
  const deadlineBtnRef = useRef<HTMLButtonElement>(null);
  const tagBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    window.api?.tags
      ?.forTask?.(task.id)
      .then((tags) => setTagIds(tags.map((t) => t.id)))
      .catch(() => undefined);
  }, [task.id]);

  const save = useCallback(async () => {
    await window.api?.tasks?.update(task.id, {
      title,
      notes: notes || null,
      when_date: whenDate,
      deadline,
      waiting_for: waitingFor || null,
      checklist: checklist.length > 0 ? checklist : null,
    });
    loadTasks(activeView);
    onCollapse();
  }, [
    task.id,
    title,
    notes,
    whenDate,
    deadline,
    waitingFor,
    checklist,
    loadTasks,
    activeView,
    onCollapse,
  ]);

  const cancel = useCallback(() => {
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setWaitingFor(task.waiting_for ?? "");
    setChecklist(task.checklist ?? []);
    setWhenDate(task.when_date);
    setDeadline(task.deadline);
    onCollapse();
  }, [task, onCollapse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        cancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        save().catch(() => undefined);
      }
    },
    [save, cancel],
  );

  function handleChecklistToggle(id: string): void {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  }

  async function handleTagChange(newIds: string[]): Promise<void> {
    const added = newIds.filter((id) => !tagIds.includes(id));
    const removed = tagIds.filter((id) => !newIds.includes(id));
    await Promise.all([
      ...added.map((tagId) =>
        window.api?.tags?.attachToTask?.(tagId, task.id),
      ),
      ...removed.map((tagId) =>
        window.api?.tags?.detachFromTask?.(tagId, task.id),
      ),
    ]);
    setTagIds(newIds);
  }

  return (
    <div className={styles.card} onKeyDown={handleKeyDown}>
      <div className={styles.titleRow}>
        <Checkbox
          completed={task.status === "completed"}
          onComplete={() => {
            optimisticComplete(task.id);
            onCollapse();
          }}
          onUncomplete={onCollapse}
        />
        <input
          ref={titleRef}
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
      </div>

      <div className={styles.toolbar}>
        <button
          ref={whenBtnRef}
          className={[
            styles.toolbarBtn,
            whenDate ? styles.toolbarBtnActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() =>
            setOpenPicker(openPicker === "when" ? null : "when")
          }
          title="Set when date"
        >
          {whenDate ? formatDate(whenDate) : "When"}
        </button>
        <button
          ref={deadlineBtnRef}
          className={[
            styles.toolbarBtn,
            deadline ? styles.toolbarBtnActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() =>
            setOpenPicker(openPicker === "deadline" ? null : "deadline")
          }
          title="Set deadline"
        >
          {deadline ? `Deadline: ${formatDate(deadline)}` : "Deadline"}
        </button>
        <button
          ref={tagBtnRef}
          className={[
            styles.toolbarBtn,
            tagIds.length > 0 ? styles.toolbarBtnActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setTagPickerOpen((o) => !o)}
          title="Set tags"
        >
          {tagIds.length > 0 ? `Tags (${tagIds.length})` : "Tags"}
        </button>
      </div>

      {openPicker === "when" && (
        <WhenPicker
          value={whenDate}
          onChange={(val) => {
            setWhenDate(val);
            setOpenPicker(null);
          }}
          onClose={() => setOpenPicker(null)}
          anchorEl={whenBtnRef.current}
        />
      )}
      {openPicker === "deadline" && (
        <DeadlinePicker
          value={deadline}
          onChange={(val) => {
            setDeadline(val);
            setOpenPicker(null);
          }}
          onClose={() => setOpenPicker(null)}
          anchorEl={deadlineBtnRef.current}
        />
      )}
      {tagPickerOpen && (
        <TagPicker
          selectedIds={tagIds}
          onChange={(ids) => {
            handleTagChange(ids).catch(() => undefined);
          }}
          onClose={() => setTagPickerOpen(false)}
          anchorEl={tagBtnRef.current}
        />
      )}

      <textarea
        className={styles.notes}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={3}
      />

      {checklist.length > 0 && (
        <ul className={styles.checklist}>
          {checklist.map((item) => (
            <li key={item.id} className={styles.checklistItem}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleChecklistToggle(item.id)}
                className={styles.checklistCheckbox}
              />
              <span
                className={[
                  styles.checklistTitle,
                  item.completed ? styles.checklistDone : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(task.waiting_for || task.waiting_since) && (
        <div className={styles.waitingRow}>
          <span className={styles.waitingLabel}>Waiting for</span>
          <input
            className={styles.waitingInput}
            value={waitingFor}
            onChange={(e) => setWaitingFor(e.target.value)}
            placeholder="Person or thing"
          />
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.btnSave}
          onClick={() => {
            save().catch(() => undefined);
          }}
        >
          Save
        </button>
        <button className={styles.btnCancel} onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
