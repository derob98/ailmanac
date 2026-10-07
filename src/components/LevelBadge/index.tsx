import React, {type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

type Level = 'beginner' | 'intermediate' | 'advanced' | 'all';

/* How many of the three rungs the meter lights up. The ladder is ordinal —
   beginner < intermediate < advanced — so the meter reads pre-attentively
   ("1 of 3") before the label is even read. `all` lights all three but renders
   them flat and neutral (see styles): it is not a rung, it is "any rung". */
const RUNGS: Record<Level, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  all: 3,
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
      {/* The meter is decorative only — the text label carries the meaning, so
          the badge never relies on colour (or on the glyph) alone (WCAG 1.4.1).
          Static markup: no randomness, no dates — hydration-safe. */}
      <span className={styles.meter} aria-hidden="true">
        <span className={styles.rung} data-on={RUNGS[key] > 0 ? '' : undefined} />
        <span className={styles.rung} data-on={RUNGS[key] > 1 ? '' : undefined} />
        <span className={styles.rung} data-on={RUNGS[key] > 2 ? '' : undefined} />
      </span>
      <span className={styles.label}>{LABELS[key]}</span>
    </span>
  );
}
