import React, {useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

type Difficulty = 'simple' | 'medium' | 'hard';
type Priority = 'quality' | 'balanced' | 'cost';
type Volume = 'low' | 'high';

function recommend(d: Difficulty, p: Priority, v: Volume) {
  if (p === 'cost' || v === 'high' || d === 'simple') {
    return {
      model: 'Claude Haiku',
      why: translate({
        id: 'mp.why.haiku',
        message:
          'Fastest and cheapest — ideal for high-volume, latency-sensitive, or simple tasks (classification, extraction, routing). Send only the hard parts elsewhere.',
      }),
    };
  }
  if (d === 'hard' && p === 'quality') {
    return {
      model: 'Claude Opus',
      why: translate({
        id: 'mp.why.opus',
        message:
          'Most capable — worth it when a hard problem needs top quality more than it needs to be cheap (deep reasoning, tricky agents, gnarly code).',
      }),
    };
  }
  return {
    model: 'Claude Sonnet',
    why: translate({
      id: 'mp.why.sonnet',
      message:
        'The balanced default — strong reasoning and coding at a fraction of Opus cost. Start here, and only move up if you hit a real quality ceiling.',
    }),
  };
}

export default function ModelPicker(): ReactNode {
  const [d, setD] = useState<Difficulty>('medium');
  const [p, setP] = useState<Priority>('balanced');
  const [v, setV] = useState<Volume>('low');
  const rec = recommend(d, p, v);
  // Docusaurus localizes "/docs/..." links per locale build automatically.
  const lp = '';

  const OPTIONS = {
    d: [
      ['simple', translate({id: 'mp.d.simple', message: 'Simple'})],
      ['medium', translate({id: 'mp.d.medium', message: 'Medium'})],
      ['hard', translate({id: 'mp.d.hard', message: 'Hard'})],
    ],
    p: [
      ['quality', translate({id: 'mp.p.quality', message: 'Quality'})],
      ['balanced', translate({id: 'mp.p.balanced', message: 'Balanced'})],
      ['cost', translate({id: 'mp.p.cost', message: 'Cost / speed'})],
    ],
    v: [
      ['low', translate({id: 'mp.v.low', message: 'Low'})],
      ['high', translate({id: 'mp.v.high', message: 'High'})],
    ],
  } as const;

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
      {row(translate({id: 'mp.row.difficulty', message: 'Task difficulty'}), d, OPTIONS.d, setD)}
      {row(translate({id: 'mp.row.priority', message: 'What matters most'}), p, OPTIONS.p, setP)}
      {row(translate({id: 'mp.row.volume', message: 'Request volume'}), v, OPTIONS.v, setV)}
      <div className={styles.result}>
        <div className={styles.model}>{rec.model}</div>
        <p className={styles.why}>{rec.why}</p>
        <p className={styles.note}>
          <Translate id="mp.note.pre">Look up the exact model ID on the</Translate>{' '}
          <Link to={`${lp}/docs/whats-new/models-and-pricing`}>
            <Translate id="mp.note.link">models table</Translate>
          </Link>
          .{' '}
          <Translate id="mp.note.post">
            Rule of thumb only — run a quick eval on your own inputs to be sure.
          </Translate>
        </p>
      </div>
    </div>
  );
}
