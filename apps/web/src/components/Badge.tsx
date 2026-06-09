import type { ReactNode } from 'react';

import styles from './Badge.module.css';

export type BadgeTone = 'good' | 'warn' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

/** A small monospace status pill used across the operator console. */
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
