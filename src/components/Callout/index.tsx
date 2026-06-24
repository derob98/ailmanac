import React, {type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

/**
 * Callout — static, presentational study-material boxes for MDX docs pages.
 *
 * Single-component API: <Callout type="objectives" | "takeaways" | "tip" | "warning" />.
 * Convenience wrappers (<Objectives>, <Takeaways>) are also exported.
 *
 * Purely presentational: no JS state, no browser APIs, no time/random calls —
 * the first server render is byte-for-byte identical to the first client render,
 * so there is zero hydration-mismatch risk (React #418/#425).
 */

export type CalloutType = 'objectives' | 'takeaways' | 'tip' | 'warning';

export interface CalloutProps {
  /** Visual + semantic variant. Defaults to "objectives". */
  type?: CalloutType;
  /** Override the default heading for the variant. */
  title?: ReactNode;
  /**
   * List items rendered as a styled checklist. If omitted, `children`
   * is rendered instead (so writers can drop in any MDX).
   */
  items?: ReactNode[];
  /** Free-form content shown when `items` is not provided. */
  children?: ReactNode;
}

interface Variant {
  /** Decorative emoji — meaning is carried by the visible heading text. */
  icon: string;
  /** Default heading; resolved per-locale at render time. */
  heading: () => string;
  /** Bullet glyph used for each checklist row. */
  bullet: string;
}

// One config object per variant keeps the JSX tiny and the CSS data-driven.
const VARIANTS: Record<CalloutType, Variant> = {
  objectives: {
    icon: '🎯',
    heading: () =>
      translate({
        id: 'callout.objectives.title',
        message: "What you'll learn",
      }),
    bullet: '✅',
  },
  takeaways: {
    icon: '💡',
    heading: () =>
      translate({id: 'callout.takeaways.title', message: 'Key takeaways'}),
    bullet: '⭐',
  },
  tip: {
    icon: '✨',
    heading: () => translate({id: 'callout.tip.title', message: 'Pro tip'}),
    bullet: '→',
  },
  warning: {
    icon: '⚠️',
    heading: () =>
      translate({id: 'callout.warning.title', message: 'Watch out'}),
    bullet: '•',
  },
};

export default function Callout({
  type = 'objectives',
  title,
  items,
  children,
}: CalloutProps): ReactNode {
  // Fall back to "objectives" for an unknown type so a typo never blanks the box.
  const key: CalloutType = VARIANTS[type] ? type : 'objectives';
  const variant = VARIANTS[key];
  const heading = title ?? variant.heading();

  return (
    <section
      className={`${styles.callout} ${styles[key]}`}
      // Region role + label exposes the box to assistive tech as a named landmark.
      role="note"
      aria-label={typeof heading === 'string' ? heading : undefined}>
      <div className={styles.accent} aria-hidden="true" />
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          {variant.icon}
        </span>
        <span className={styles.title}>{heading}</span>
      </header>

      {items && items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.check} aria-hidden="true">
                {variant.bullet}
              </span>
              <span className={styles.itemText}>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.body}>{children}</div>
      )}
    </section>
  );
}

/** Convenience wrapper: <Objectives items={[...]} /> === <Callout type="objectives" />. */
export function Objectives(props: Omit<CalloutProps, 'type'>): ReactNode {
  return <Callout type="objectives" {...props} />;
}

/** Convenience wrapper: <Takeaways items={[...]} /> === <Callout type="takeaways" />. */
export function Takeaways(props: Omit<CalloutProps, 'type'>): ReactNode {
  return <Callout type="takeaways" {...props} />;
}
