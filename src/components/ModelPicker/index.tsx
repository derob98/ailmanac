import React, {useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type Difficulty = 'simple' | 'medium' | 'hard';
type Priority = 'quality' | 'balanced' | 'cost';
type Volume = 'low' | 'high';

function recommend(d: Difficulty, p: Priority, v: Volume) {
  // Cost/speed-sensitive, high volume, or simple work → Haiku
  if (p === 'cost' || v === 'high' || d === 'simple') {
    return {
      model: 'Claude Haiku',
      why: 'Fastest and cheapest — ideal for high-volume, latency-sensitive, or simple tasks (classification, extraction, routing). Send only the hard parts elsewhere.',
    };
  }
  // Hard problem where quality matters most → Opus
  if (d === 'hard' && p === 'quality') {
    return {
      model: 'Claude Opus',
      why: 'Most capable — worth it when a hard problem needs top quality more than it needs to be cheap (deep reasoning, tricky agents, gnarly code).',
    };
  }
  // Everything else → Sonnet (the default workhorse)
  return {
    model: 'Claude Sonnet',
    why: 'The balanced default — strong reasoning and coding at a fraction of Opus cost. Start here, and only move up if you hit a real quality ceiling.',
  };
}

const OPTIONS = {
  d: [
    ['simple', 'Simple'],
    ['medium', 'Medium'],
    ['hard', 'Hard'],
  ],
  p: [
    ['quality', 'Quality'],
    ['balanced', 'Balanced'],
    ['cost', 'Cost / speed'],
  ],
  v: [
    ['low', 'Low'],
    ['high', 'High'],
  ],
} as const;

export default function ModelPicker(): ReactNode {
  const [d, setD] = useState<Difficulty>('medium');
  const [p, setP] = useState<Priority>('balanced');
  const [v, setV] = useState<Volume>('low');
  const rec = recommend(d, p, v);

  const row = (
    title: string,
    value: string,
    opts: readonly (readonly [string, string])[],
    set: (x: any) => void,
  ) => (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{title}</span>
      <div className={styles.choices}>
        {opts.map(([val, label]) => (
          <button
            key={val}
            type="button"
            className={`${styles.choice} ${value === val ? styles.active : ''}`}
            onClick={() => set(val)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      {row('Task difficulty', d, OPTIONS.d, setD)}
      {row('What matters most', p, OPTIONS.p, setP)}
      {row('Request volume', v, OPTIONS.v, setV)}
      <div className={styles.result}>
        <div className={styles.model}>{rec.model}</div>
        <p className={styles.why}>{rec.why}</p>
        <p className={styles.note}>
          Look up the exact model ID on the{' '}
          <Link to="/docs/whats-new/models-and-pricing">models table</Link>. Rule of
          thumb only — run a quick eval on your own inputs to be sure.
        </p>
      </div>
    </div>
  );
}
