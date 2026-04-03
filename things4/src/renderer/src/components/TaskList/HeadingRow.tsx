import React from "react";
import type { Heading } from "../../../../types";
import styles from "./HeadingRow.module.css";

interface HeadingRowProps {
  heading: Heading;
}

export function HeadingRow({ heading }: HeadingRowProps): React.JSX.Element {
  return (
    <div className={styles.heading} role="separator" aria-label={heading.title}>
      <span className={styles.title}>{heading.title}</span>
    </div>
  );
}
