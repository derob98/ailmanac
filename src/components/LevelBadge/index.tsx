import React, {type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'all';

// Icons are decorative only — the text label carries the meaning, so the badge
// never relies on colour alone (WCAG 1.4.1).
const ICONS: Record<Level, string> = {
  beginner: '🟢',
  intermediate: '🟡',
  advanced: '🔴',
  all: '⚪',
};

export default function LevelBadge({level}: {level: Level}): ReactNode {
  // Computed at render so each locale build resolves the translation.
  const LABELS: Record<Level, string> = {
    beginner: translate({id: 'level.beginner', message: 'Beginner'}),
    intermediate: translate({id: 'level.intermediate', message: 'Intermediate'}),
    advanced: translate({id: 'level.advanced', message: 'Advanced'}),
    all: translate({id: 'level.all', message: 'All levels'}),
  };
  const key: Level = LABELS[level] ? level : 'all';
  return (
    <span
      className={`${styles.badge} ${styles[key]}`}
      title={translate({id: 'level.tooltip', message: 'Difficulty level: {label}'}, {label: LABELS[key]})}>
      <span aria-hidden="true">{ICONS[key]}</span>
      <span className={styles.label}>{LABELS[key]}</span>
    </span>
  );
}
