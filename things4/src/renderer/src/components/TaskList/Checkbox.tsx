import React, { useEffect, useRef, useState } from "react";
import atlasUrl from "../../assets/checkbox-completing-atlas.png";
import styles from "./Checkbox.module.css";

const COLS = 6;
const ROWS = 5;
const TOTAL_FRAMES = COLS * ROWS; // 30
const ANIM_INTERVAL_MS = 15; // --checkbox-anim-interval

interface CheckboxProps {
  completed: boolean;
  onComplete: () => void;
  onUncomplete: () => void;
}

export function Checkbox({
  completed,
  onComplete,
  onUncomplete,
}: CheckboxProps): React.JSX.Element {
  // Frame 0 = empty circle, frame 29 = full checkmark
  const [frame, setFrame] = useState(completed ? TOTAL_FRAMES - 1 : 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animatingRef = useRef(false);

  // When completed flips to false externally (uncomplete), snap to frame 0
  useEffect(() => {
    if (!completed && !animatingRef.current) {
      setFrame(0);
    }
    if (completed && !animatingRef.current) {
      setFrame(TOTAL_FRAMES - 1);
    }
  }, [completed]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  function startAnimation(): void {
    if (animatingRef.current) return;
    animatingRef.current = true;
    let current = 0;
    setFrame(0);

    intervalRef.current = setInterval(() => {
      current++;
      setFrame(current);
      if (current >= TOTAL_FRAMES - 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        animatingRef.current = false;
        onComplete();
      }
    }, ANIM_INTERVAL_MS);
  }

  function handleClick(e: React.MouseEvent): void {
    e.stopPropagation();
    if (completed) {
      // Snap to uncomplete immediately
      setFrame(0);
      onUncomplete();
    } else {
      // Animate through all frames, then notify parent
      startAnimation();
    }
  }

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);
  const bgX = -(col * 20);
  const bgY = -(row * 20);

  return (
    <button
      className={styles.checkbox}
      onClick={handleClick}
      aria-label={completed ? "Mark incomplete" : "Mark complete"}
      aria-checked={completed}
      role="checkbox"
      style={{
        backgroundImage: `url(${atlasUrl})`,
        backgroundPosition: `${bgX}px ${bgY}px`,
      }}
    />
  );
}
