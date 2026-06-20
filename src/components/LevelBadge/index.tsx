import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'all';

const LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  all: 'All levels',
};

// Icons are decorative only — the text label carries the meaning, so the badge
// never relies on colour alone (WCAG 1.4.1).
const ICONS: Record<Level, string> = {
  beginner: '🟢',
  intermediate: '🟡',
  advanced: '🔴',
  all: '⚪',
};

export default function LevelBadge({level}: {level: Level}): ReactNode {
  const key: Level = LABELS[level] ? level : 'all';
  return (
    <span
      className={`${styles.badge} ${styles[key]}`}
      title={`Difficulty level: ${LABELS[key]}`}>
      <span aria-hidden="true">{ICONS[key]}</span>
      <span className={styles.label}>{LABELS[key]}</span>
    </span>
  );
}
