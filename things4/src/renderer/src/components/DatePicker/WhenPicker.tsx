import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styles from "./WhenPicker.module.css";

export interface WhenPickerProps {
  value: string | null;
  onChange: (val: string) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseNaturalDate(input: string): Date | null {
  const lower = input.toLowerCase().trim();
  const today = getToday();

  if (lower === "today") return today;

  if (lower === "tomorrow") {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const abbrevs = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const m = lower.match(/^(?:next\s+)?(\w+)$/);
  if (m) {
    let idx = weekdays.indexOf(m[1]);
    if (idx === -1) idx = abbrevs.indexOf(m[1]);
    if (idx !== -1) {
      const d = new Date(today);
      let diff = idx - d.getDay();
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  const inDays = lower.match(/^in\s+(\d+)\s+days?$/);
  if (inDays) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(inDays[1]));
    return d;
  }

  const inWeeks = lower.match(/^in\s+(\d+)\s+weeks?$/);
  if (inWeeks) {
    const d = new Date(today);
    d.setDate(d.getDate() + parseInt(inWeeks[1]) * 7);
    return d;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const d = new Date(input + "T00:00:00");
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function getValueAsISO(value: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (value === "today") return toISO(getToday());
  return null;
}

function getInitialViewDate(value: string | null): Date {
  const iso = getValueAsISO(value);
  if (iso) return new Date(iso + "T00:00:00");
  return getToday();
}

function computePosition(anchorEl?: HTMLElement | null): React.CSSProperties {
  if (!anchorEl) {
    return { top: "50%", left: "50%", transform: "translate(-50%, -20%)" };
  }
  const rect = anchorEl.getBoundingClientRect();
  const pickerWidth = 280;
  let left = rect.left;
  if (left + pickerWidth > window.innerWidth - 8) {
    left = window.innerWidth - pickerWidth - 8;
  }
  return { top: rect.bottom + 4, left: Math.max(8, left) };
}

export function WhenPicker({
  value,
  onChange,
  onClose,
  anchorEl,
}: WhenPickerProps): React.JSX.Element {
  const today = getToday();
  const initialDate = getInitialViewDate(value);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [focusedDate, setFocusedDate] = useState<Date>(initialDate);
  const [nlInput, setNlInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const nlRef = useRef<HTMLInputElement>(null);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  useEffect(() => {
    containerRef.current?.focus();
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

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDate = useCallback(
    (d: Date) => {
      onChange(toISO(d));
      onClose();
    },
    [onChange, onClose],
  );

  const handleContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (document.activeElement === nlRef.current) return;

      if (e.key === "Enter") {
        onChange(toISO(focusedDate));
        onClose();
        return;
      }

      let newDate = new Date(focusedDate);
      if (e.key === "ArrowLeft") {
        newDate.setDate(newDate.getDate() - 1);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        newDate.setDate(newDate.getDate() + 1);
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        newDate.setDate(newDate.getDate() - 7);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        newDate.setDate(newDate.getDate() + 7);
        e.preventDefault();
      } else return;

      setFocusedDate(newDate);
      setViewYear(newDate.getFullYear());
      setViewMonth(newDate.getMonth());
    },
    [focusedDate, onChange, onClose],
  );

  const handleNLKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter" && nlInput.trim()) {
      const parsed = parseNaturalDate(nlInput);
      if (parsed) {
        onChange(toISO(parsed));
        onClose();
      }
      e.stopPropagation();
    }
  };

  const selectedISO = getValueAsISO(value);
  const focusedISO = toISO(focusedDate);
  const todayISO = toISO(today);
  const position = computePosition(anchorEl);

  const picker = (
    <div
      className={styles.container}
      ref={containerRef}
      style={position}
      onKeyDown={handleContainerKeyDown}
      tabIndex={-1}
    >
      <div className={styles.quickRow}>
        <button
          className={styles.quickBtn}
          onMouseDown={() => {
            onChange("today");
            onClose();
          }}
        >
          <span className={styles.quickIcon}>★</span>
          <span>Today</span>
        </button>
        <button
          className={styles.quickBtn}
          onMouseDown={() => {
            onChange("evening");
            onClose();
          }}
        >
          <span className={styles.quickIcon}>☽</span>
          <span>This Evening</span>
        </button>
        <button
          className={styles.quickBtn}
          onMouseDown={() => {
            onChange("someday");
            onClose();
          }}
        >
          <span className={styles.quickIcon}>…</span>
          <span>Someday</span>
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.nlRow}>
        <input
          ref={nlRef}
          className={styles.nlInput}
          placeholder="Type a date..."
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          onKeyDown={handleNLKeyDown}
        />
      </div>

      <div className={styles.monthHeader}>
        <button
          className={styles.navBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            prevMonth();
          }}
        >
          ‹
        </button>
        <span className={styles.monthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          className={styles.navBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            nextMonth();
          }}
        >
          ›
        </button>
      </div>

      <div className={styles.calGrid}>
        {DAYS.map((d) => (
          <div key={d} className={styles.dayLabel}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} className={styles.dayEmpty} />;
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isSelected = iso === selectedISO;
          const isFocused = iso === focusedISO && !isSelected;
          return (
            <button
              key={iso}
              className={[
                styles.dayCell,
                isToday ? styles.dayCellToday : "",
                isSelected ? styles.dayCellSelected : "",
                isFocused ? styles.dayCellFocused : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseDown={(e) => {
                e.preventDefault();
                selectDate(d);
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(picker, document.body);
}
