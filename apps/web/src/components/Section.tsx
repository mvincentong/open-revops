import type { ReactNode } from 'react';

import styles from './Section.module.css';

interface SectionProps {
  /** Short monospace eyebrow label, e.g. "01 · RECOMMENDATION". */
  label: string;
  title: string;
  /** Optional badge / control rendered in the panel header. */
  aside?: ReactNode;
  children: ReactNode;
}

/** Operator-console panel chrome shared by every section. */
export function Section({ label, title, aside, children }: SectionProps) {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <p className={`eyebrow ${styles.label}`}>{label}</p>
          <h2 className={styles.title}>{title}</h2>
        </div>
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
