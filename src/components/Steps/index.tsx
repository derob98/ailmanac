import React, {
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

/**
 * Steps — a guided, vertical, numbered walkthrough for tutorials.
 *
 * API (pick the clean approach — `items` is primary):
 *
 *   <Steps items={[
 *     {title: 'Install', body: 'Run npm i …'},
 *     {title: 'Configure', body: <>Add your key to <code>.env</code></>},
 *   ]} />
 *
 * `body` may be a string or any ReactNode (JSX, MDX-rendered children, links…).
 *
 * Children fallback (handy when authoring directly in MDX) — each direct child
 * becomes one step; an optional `data-title` attribute sets that step's title:
 *
 *   <Steps>
 *     <div data-title="Install">Run `npm i`…</div>
 *     <div data-title="Configure">Add your key…</div>
 *   </Steps>
 *
 * State is local + deterministic (no Math.random / Date / window during render),
 * so SSR output === first client render — hydration-safe.
 */

export interface StepItem {
  /** Short title shown next to the number badge. */
  title: string;
  /** Step content — string or any ReactNode. */
  body?: ReactNode;
}

export interface StepsProps {
  /** Primary API: an ordered list of steps. */
  items?: StepItem[];
  /** Which step is open/active on first render (1-based). Defaults to 1. */
  defaultStep?: number;
  /** Optional label for the whole walkthrough (used for aria + heading). */
  label?: string;
  /** Fallback API: one step per direct child (use data-title for titles). */
  children?: ReactNode;
}

/** Build a normalized step list from `items` or from MDX children. */
function useSteps(items?: StepItem[], children?: ReactNode): StepItem[] {
  return useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }
    const fromChildren: StepItem[] = [];
    React.Children.forEach(children, (child, i) => {
      if (child === null || child === undefined || child === false) {
        return;
      }
      let title = translate(
        {id: 'steps.defaultTitle', message: 'Step {n}'},
        {n: String(fromChildren.length + 1)},
      );
      let body: ReactNode = child;
      if (React.isValidElement(child)) {
        const props = child.props as {
          ['data-title']?: string;
          children?: ReactNode;
        };
        if (typeof props['data-title'] === 'string') {
          title = props['data-title'];
          body = props.children;
        }
      }
      fromChildren.push({title, body});
    });
    return fromChildren;
  }, [items, children]);
}

export default function Steps({
  items,
  children,
  defaultStep = 1,
  label,
}: StepsProps): ReactNode {
  const steps = useSteps(items, children);
  const total = steps.length;

  // Clamp the initial active index deterministically (1-based -> 0-based).
  const initialActive = Math.min(Math.max(defaultStep - 1, 0), Math.max(total - 1, 0));
  const [active, setActive] = useState<number>(initialActive);

  const baseId = useId();
  const groupLabel =
    label ?? translate({id: 'steps.label', message: 'Guided walkthrough'});

  if (total === 0) {
    return null;
  }

  const atEnd = active >= total - 1;
  const atStart = active <= 0;
  // Progress fills to the *center* of the active badge, plus a full segment
  // once the last step is reached (deterministic, no animation dependency).
  const progressPct =
    total <= 1 ? 100 : Math.round((active / (total - 1)) * 100);

  const go = (next: number) => {
    setActive(Math.min(Math.max(next, 0), total - 1));
  };

  const onKeyNav = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      go(idx + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(idx - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(total - 1);
    }
  };

  return (
    <section
      className={styles.wrap}
      aria-label={groupLabel}
      role="group">
      <div className={styles.header}>
        <span className={styles.kicker}>{groupLabel}</span>
        <span className={styles.counter} aria-live="polite">
          {translate(
            {id: 'steps.counter', message: '{cur} of {total}'},
            {cur: String(active + 1), total: String(total)},
          )}
        </span>
      </div>

      {/* Slim progress bar — completion as the reader advances. */}
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={active + 1}
        aria-label={translate({
          id: 'steps.progressLabel',
          message: 'Walkthrough progress',
        })}>
        <div
          className={styles.progressFill}
          style={{width: `${progressPct}%`}}
        />
      </div>

      <ol className={styles.list}>
        {steps.map((step, idx) => {
          const isActive = idx === active;
          const isDone = idx < active;
          const panelId = `${baseId}-panel-${idx}`;
          const tabId = `${baseId}-tab-${idx}`;
          const state = isActive ? 'active' : isDone ? 'done' : 'todo';
          return (
            <li
              key={idx}
              className={styles.step}
              data-state={state}>
              <button
                type="button"
                id={tabId}
                className={styles.stepHead}
                aria-expanded={isActive}
                aria-controls={panelId}
                onClick={() => go(idx)}
                onKeyDown={(e) => onKeyNav(e, idx)}>
                <span className={styles.badge} aria-hidden="true">
                  {isDone ? (
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      className={styles.check}>
                      <path
                        d="M3 8.5l3.2 3.2L13 4.9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.chevron} aria-hidden="true">
                  ⌄
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={tabId}
                className={styles.panel}
                hidden={!isActive}>
                {step.body !== undefined && step.body !== null && (
                  <div className={styles.body}>{step.body}</div>
                )}

                <div className={styles.nav}>
                  <button
                    type="button"
                    className={styles.navBtn}
                    onClick={() => go(idx - 1)}
                    disabled={atStart}>
                    ← {translate({id: 'steps.prev', message: 'Previous'})}
                  </button>
                  {atEnd ? (
                    <span className={styles.doneBadge}>
                      🎉 {translate({id: 'steps.allDone', message: 'All done!'})}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                      onClick={() => go(idx + 1)}>
                      {translate({id: 'steps.next', message: 'Next'})} →
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
