import React, {useId, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

type Difficulty = 'simple' | 'medium' | 'hard';
type Priority = 'quality' | 'balanced' | 'cost';
type Volume = 'low' | 'high';

/* The three Claude tiers, cheapest → most capable. Brand names, so they stay
   in Latin script in every locale (the models table does the same). The index
   doubles as the rung the recommendation lights up on the ladder below. */
const TIERS = ['Haiku', 'Sonnet', 'Opus'] as const;

function recommend(d: Difficulty, p: Priority, v: Volume) {
  if (p === 'cost' || v === 'high' || d === 'simple') {
    return {
      model: 'Claude Haiku',
      tier: 0,
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
      tier: 2,
      why: translate({
        id: 'mp.why.opus',
        message:
          'Most capable — worth it when a hard problem needs top quality more than it needs to be cheap (deep reasoning, tricky agents, gnarly code).',
      }),
    };
  }
  return {
    model: 'Claude Sonnet',
    tier: 1,
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
  // useId is stable across server render and hydration → no React #418.
  const baseId = useId();
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
    key: string,
    title: string,
    value: string,
    opts: readonly (readonly [string, string])[],
    set: (x: any) => void,
  ) => {
    const labelId = `${baseId}-${key}`;
    return (
      <div className={styles.row}>
        <span className={styles.rowLabel} id={labelId}>
          {title}
        </span>
        {/* role=group + aria-labelledby: without it a screen reader hears three
            undifferentiated sets of buttons. aria-pressed (not radio) keeps the
            plain Tab-between-pills keyboard model intact. */}
        <div className={styles.choices} role="group" aria-labelledby={labelId}>
          {opts.map(([val, label]) => (
            <button
              key={val}
              type="button"
              aria-pressed={value === val}
              className={`${styles.choice} ${value === val ? styles.active : ''}`}
              onClick={() => set(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.kicker}>
          <Translate id="mp.kicker">Model picker</Translate>
        </span>
      </div>
      {row('d', translate({id: 'mp.row.difficulty', message: 'Task difficulty'}), d, OPTIONS.d, setD)}
      {row('p', translate({id: 'mp.row.priority', message: 'What matters most'}), p, OPTIONS.p, setP)}
      {row('v', translate({id: 'mp.row.volume', message: 'Request volume'}), v, OPTIONS.v, setV)}
      <div className={styles.resultLive} aria-live="polite">
        <div className={styles.result} key={rec.model}>
          <span className={styles.eyebrow}>
            <Translate id="mp.result.eyebrow">Recommended</Translate>
          </span>
          <div className={styles.model}>{rec.model}</div>
          {/* Capability ladder: places the answer on the cheap→capable scale, so
              the reader sees not just WHICH model but how far up they landed.
              aria-hidden — the model name above already carries the fact. */}
          <div className={styles.tiers} aria-hidden="true">
            {TIERS.map((name, i) => (
              <div
                key={name}
                className={`${styles.tier} ${i === rec.tier ? styles.tierOn : ''}`}>
                <span className={styles.tierBar} />
                <span className={styles.tierName}>{name}</span>
              </div>
            ))}
          </div>
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
    </div>
  );
}
