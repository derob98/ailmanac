import React, {useEffect, useId, useRef, useState, type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import data from '@site/data/research/claude-code-docs-decay.json';
import styles from './styles.module.css';

/**
 * Charts for /docs/whats-new/unread-manual.
 *
 * Every number comes from data/research/claude-code-docs-decay.json, written by
 * scripts/research/docs-decay.mjs. Nothing here reads the clock, so the server
 * render and the first client render always agree.
 */

type Model = (typeof data.models)[number];
const MODELS = data.models;
const CURRENT = MODELS[MODELS.length - 1];
const WEEKS = data.timeline;
const NOW = WEEKS[WEEKS.length - 1];

const useLocale = () => useDocusaurusContext().i18n.currentLocale;
const pct = (n: number, locale: string) =>
  `${new Intl.NumberFormat(locale, {maximumFractionDigits: 1}).format(n)}%`;
const num = (n: number, locale: string) => new Intl.NumberFormat(locale).format(n);
const date = (iso: string, locale: string, month: 'short' | 'long' = 'long') =>
  new Intl.DateTimeFormat(locale, {
    day: month === 'long' ? 'numeric' : undefined,
    month,
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
const cutoff = (m: Model, locale: string) => date(`${m.cutoff}-01`, locale, 'short');
const names = (m: Model) => m.names.map((n) => n.replace(/^Claude /, '')).join(', ');

/** Draw SVG charts at their real pixel width, so labels stay legible at 375 px. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, Math.max(width, 280)] as const;
}

export function UnreadHeadline(): ReactNode {
  const locale = useLocale();
  return (
    <figure className={styles.headline}>
      <p className={styles.bigNumber}>{pct(Math.round(CURRENT.factsUnseenToday), locale)}</p>
      <figcaption className={styles.headlineText}>
        <Translate
          id="docsDecay.headline"
          values={{
            date: date(data.window.to, locale),
            cutoff: cutoff(CURRENT, locale),
            models: names(CURRENT),
          }}>
          {'of what the official Claude Code docs said on {date} was not in them at the end of {cutoff}: the training cutoff of {models}.'}
        </Translate>
      </figcaption>
    </figure>
  );
}

export function ModelBars(): ReactNode {
  const locale = useLocale();
  return (
    <div className={styles.block}>
      <ul
        className={styles.bars}
        aria-label={translate({
          id: 'docsDecay.bars.label',
          message: "Share of today's Claude Code docs that is newer than each model's training cutoff",
        })}>
        {MODELS.map((m) => (
          <li key={m.cutoff} className={`${styles.barRow} ${m === CURRENT ? styles.barCurrent : ''}`}>
            <span className={styles.barLabel}>
              <span className={styles.barCutoff}>{cutoff(m, locale)}</span>
              <span className={styles.barModels}>{names(m)}</span>
            </span>
            <span className={styles.barTrack} aria-hidden="true">
              <span className={styles.barFill} style={{width: `${m.factsUnseenToday}%`}} />
            </span>
            <span className={styles.barValue}>
              {m.beforeMirror ? '≥ ' : ''}
              {pct(m.factsUnseenToday, locale)}
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        <Translate id="docsDecay.bars.note">
          {'≥ marks cutoffs before July 2025, where the history starts: those models saw even less, so the true share is higher.'}
        </Translate>
      </p>
    </div>
  );
}

export function LearnedSlider(): ReactNode {
  const locale = useLocale();
  const id = useId();
  const start = WEEKS.findIndex((w) => w.date === CURRENT.date);
  const [index, setIndex] = useState(start >= 0 ? start : 0);
  const week = WEEKS[index];
  const max = WEEKS.length - 2; // the latest week is "today": nothing to compare
  return (
    <div className={styles.block}>
      <label htmlFor={id} className={styles.sliderLabel}>
        <Translate id="docsDecay.slider.label">You learned Claude Code from the docs of</Translate>{' '}
        <strong>{date(week.date, locale)}</strong>
      </label>
      <input
        id={id}
        className={styles.slider}
        type="range"
        min={0}
        max={max}
        step={1}
        value={index}
        aria-valuetext={date(week.date, locale)}
        onChange={(event) => setIndex(Number(event.target.value))}
      />
      <div className={styles.sliderScale} aria-hidden="true">
        <span>{date(WEEKS[0].date, locale, 'short')}</span>
        <span>{date(WEEKS[max].date, locale, 'short')}</span>
      </div>
      <output htmlFor={id} className={styles.stats} aria-live="polite">
        <span className={styles.stat}>
          <span className={styles.statNum}>{pct(week.factsUnseenToday, locale)}</span>
          <span className={styles.statText}>
            <Translate id="docsDecay.slider.unseen">of what the docs say today was not there yet</Translate>
          </span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statNum}>{pct(Math.round((100 - week.factsStillTrue) * 10) / 10, locale)}</span>
          <span className={styles.statText}>
            <Translate id="docsDecay.slider.gone">
              of what you read has since been deleted, or changed in a number, flag or name
            </Translate>
          </span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statNum}>
            {week.pages} → {NOW.pages}
          </span>
          <span className={styles.statText}>
            <Translate id="docsDecay.slider.pages">pages then and now</Translate>
          </span>
        </span>
      </output>
    </div>
  );
}

// The first band (text already there in July 2025) is neutral, the rest the accent.
const COHORT_OPACITY = [0.55, 0.32, 0.44, 0.56, 0.7, 0.85, 1];

export function CohortChart(): ReactNode {
  const locale = useLocale();
  const [ref, width] = useWidth();
  const height = width < 520 ? 240 : 300;
  const pad = {top: 12, right: 12, bottom: 28, left: 52};
  const top = Math.ceil(Math.max(...WEEKS.map((w) => w.facts)) / 10000) * 10000;
  const x = (k: number) => pad.left + (k / (WEEKS.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - v / top) * (height - pad.top - pad.bottom);
  const layers = data.cohorts.map((_, c) => {
    const lower = WEEKS.map((w) => w.cohorts.slice(0, c).reduce((a, b) => a + b, 0));
    const upper = WEEKS.map((w, k) => lower[k] + w.cohorts[c]);
    const forward = WEEKS.map((_, k) => `${x(k).toFixed(1)},${y(upper[k]).toFixed(1)}`);
    const back = WEEKS.map((_, k) => `${x(WEEKS.length - 1 - k).toFixed(1)},${y(lower[WEEKS.length - 1 - k]).toFixed(1)}`);
    return `M${forward.join('L')}L${back.join('L')}Z`;
  });
  const ticks = [0, top / 2, top];
  const xTicks = [0, Math.floor((WEEKS.length - 1) / 2), WEEKS.length - 1];
  const sample = WEEKS.filter((_, k) => k % 8 === 0 || k === WEEKS.length - 1);
  return (
    <div className={styles.block}>
      <div ref={ref} className={styles.chart}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={translate(
            {
              id: 'docsDecay.cohorts.label',
              message:
                'Stacked area chart: the Claude Code docs grew from {from} to {to} sentences and code lines, and most of what is there today was written in the last two quarters.',
            },
            {from: num(WEEKS[0].facts, locale), to: num(NOW.facts, locale)},
          )}>
          {ticks.map((t) => (
            <g key={t}>
              <line className={styles.grid} x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
              <text className={styles.axis} x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {num(t, locale)}
              </text>
            </g>
          ))}
          {layers.map((d, c) => (
            <path key={data.cohorts[c]} d={d} className={c === 0 ? styles.layerOld : styles.layer} fillOpacity={COHORT_OPACITY[c]} />
          ))}
          {xTicks.map((k) => (
            <text key={k} className={styles.axis} x={x(k)} y={height - 8} textAnchor={k === 0 ? 'start' : k === WEEKS.length - 1 ? 'end' : 'middle'}>
              {date(WEEKS[k].date, locale, 'short')}
            </text>
          ))}
        </svg>
      </div>
      <ul className={styles.legend}>
        {data.cohorts.map((c, i) => (
          <li key={c}>
            <span className={`${styles.swatch} ${i === 0 ? styles.swatchOld : ''}`} style={{opacity: COHORT_OPACITY[i]}} aria-hidden="true" />
            {i === 0 ? translate({id: 'docsDecay.cohorts.before', message: 'Already there in July 2025'}) : c}
          </li>
        ))}
      </ul>
      <details className={styles.data}>
        <summary>
          <Translate id="docsDecay.data.show">Show the data</Translate>
        </summary>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <Translate id="docsDecay.data.week">Week</Translate>
                </th>
                {data.cohorts.map((c, i) => (
                  <th key={c} scope="col">
                    {i === 0 ? translate({id: 'docsDecay.cohorts.beforeShort', message: 'Before Jul 2025'}) : c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((w) => (
                <tr key={w.date}>
                  <th scope="row">{date(w.date, locale, 'short')}</th>
                  {w.cohorts.map((v, i) => (
                    <td key={data.cohorts[i]}>{num(v, locale)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function SurvivalChart(): ReactNode {
  const locale = useLocale();
  const [ref, width] = useWidth();
  const height = width < 520 ? 240 : 280;
  const pad = {top: 16, right: 16, bottom: 28, left: 44};
  const {text, facts} = data.survival;
  const span = Math.max(text.curve[text.curve.length - 1][0], facts.curve[facts.curve.length - 1][0]);
  const x = (t: number) => pad.left + (t / span) * (width - pad.left - pad.right);
  const y = (s: number) => pad.top + (1 - s) * (height - pad.top - pad.bottom);
  const line = (curve: number[][]) =>
    curve.map(([t, s], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(s).toFixed(1)}`).join('');
  const series = [
    {key: 'facts', curve: facts.curve, median: facts.medianDays, className: styles.lineFacts,
      label: translate({id: 'docsDecay.survival.facts', message: 'Same facts, any wording'})},
    {key: 'text', curve: text.curve, median: text.medianDays, className: styles.lineText,
      label: translate({id: 'docsDecay.survival.text', message: 'Exact wording'})},
  ];
  const days = (n: number) =>
    translate({id: 'docsDecay.survival.days', message: '{n} days'}, {n: num(n, locale)});
  return (
    <div className={styles.block}>
      <div ref={ref} className={styles.chart}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={translate(
            {
              id: 'docsDecay.survival.label',
              message:
                'Survival curves: half of the sentences in the Claude Code docs are gone or reworded within {text}; counting only changes to facts, within {facts}.',
            },
            {text: days(text.medianDays ?? 0), facts: days(facts.medianDays ?? 0)},
          )}>
          {[0, 0.5, 1].map((s) => (
            <g key={s}>
              <line className={s === 0.5 ? styles.half : styles.grid} x1={pad.left} x2={width - pad.right} y1={y(s)} y2={y(s)} />
              <text className={styles.axis} x={pad.left - 8} y={y(s)} textAnchor="end" dominantBaseline="middle">
                {pct(s * 100, locale)}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <path key={s.key} d={line(s.curve)} className={s.className} />
          ))}
          {series.map((s, i) =>
            s.median === null ? null : (
              <g key={`m-${s.key}`}>
                <line className={styles.medianTick} x1={x(s.median)} x2={x(s.median)} y1={y(0.5)} y2={height - pad.bottom} />
                <text
                  className={styles.medianLabel}
                  x={x(s.median) + (i === 0 ? 6 : -6)}
                  y={height - pad.bottom - 8}
                  textAnchor={i === 0 ? 'start' : 'end'}>
                  {days(s.median)}
                </text>
              </g>
            ),
          )}
          {[0, 180, 360].filter((t) => t <= span).map((t) => (
            <text key={t} className={styles.axis} x={x(t)} y={height - 8} textAnchor={t === 0 ? 'start' : 'middle'}>
              {days(t)}
            </text>
          ))}
        </svg>
      </div>
      <ul className={styles.legend}>
        {series.map((s) => (
          <li key={s.key}>
            <span className={`${styles.swatchLine} ${s.key === 'facts' ? styles.swatchFacts : styles.swatchText}`} aria-hidden="true" />
            {s.label}: {translate({id: 'docsDecay.survival.half', message: 'half gone after {d}'}, {d: days(s.median ?? 0)})}
          </li>
        ))}
      </ul>
    </div>
  );
}

const KINDS = [
  {type: 'flag', label: () => translate({id: 'docsDecay.ids.flags', message: 'CLI flags'}), href: 'https://code.claude.com/docs/en/cli-reference'},
  {type: 'command', label: () => translate({id: 'docsDecay.ids.commands', message: 'Slash commands'}), href: 'https://code.claude.com/docs/en/commands'},
  {type: 'hook', label: () => translate({id: 'docsDecay.ids.hooks', message: 'Hook events'}), href: 'https://code.claude.com/docs/en/hooks'},
  {type: 'env', label: () => translate({id: 'docsDecay.ids.env', message: 'Environment variables'}), href: 'https://code.claude.com/docs/en/env-vars'},
] as const;

export function NewIdentifiers(): ReactNode {
  const locale = useLocale();
  const id = useId();
  const [selected, setSelected] = useState(MODELS.length - 1);
  const m = MODELS[selected];
  const added = m.added.map((i) => data.identifiers.today[i]);
  const of = (type: string) =>
    added.filter((e) => e.startsWith(`${type} `)).map((e) => e.slice(type.length + 1));
  return (
    <div className={styles.block}>
      <label htmlFor={id} className={styles.selectLabel}>
        <Translate id="docsDecay.ids.model">Training cutoff</Translate>
      </label>
      <select id={id} className={styles.select} value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
        {MODELS.map((model, i) => (
          <option key={model.cutoff} value={i}>
            {cutoff(model, locale)}: {names(model)}
          </option>
        ))}
      </select>
      <p className={styles.note}>
        <Translate id="docsDecay.ids.count" values={{n: num(added.length, locale), date: date(m.date, locale)}}>
          {'{n} identifiers are in the reference tables today that were not there on {date}.'}
        </Translate>{' '}
        {m.beforeMirror && (
          <Translate id="docsDecay.ids.beforeMirror">
            {'That is the first week of the history, later than this cutoff: the model saw even less.'}
          </Translate>
        )}
      </p>
      {KINDS.map(({type, label, href}) => {
        const items = of(type);
        if (!items.length) return null;
        const list = (
          <ul className={styles.chips}>
            {items.map((item) => (
              <li key={item}>
                <code>{item}</code>
              </li>
            ))}
          </ul>
        );
        return (
          <section key={type} className={styles.kind}>
            <h4 className={styles.kindTitle}>
              <a href={href}>{label()}</a> <span className={styles.kindCount}>{num(items.length, locale)}</span>
            </h4>
            {items.length > 60 ? (
              <details className={styles.data}>
                <summary>
                  <Translate id="docsDecay.ids.showAll" values={{n: num(items.length, locale)}}>
                    {'Show all {n}'}
                  </Translate>
                </summary>
                {list}
              </details>
            ) : (
              list
            )}
          </section>
        );
      })}
      {m.removed.length > 0 && (
        <section className={styles.kind}>
          <h4 className={styles.kindTitle}>
            <Translate id="docsDecay.ids.removed">No longer documented</Translate>{' '}
            <span className={styles.kindCount}>{num(m.removed.length, locale)}</span>
          </h4>
          <ul className={styles.chips}>
            {m.removed.map((item) => (
              <li key={item}>
                <code>{item.slice(item.indexOf(' ') + 1)}</code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
