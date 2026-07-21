import React, {type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import clsx from 'clsx';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  DotIcon,
  LightbulbIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  WarningIcon,
  type CalloutIconProps,
} from './icons';
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

/** Every marker is a prop-less-by-default, stateless SVG component. */
type IconComponent = (props: CalloutIconProps) => ReactNode;

interface Variant {
  /** Decorative header marker — meaning is carried by the visible heading text. */
  Icon: IconComponent;
  /** Default heading; resolved per-locale at render time. */
  heading: () => string;
  /** Marker drawn at the start of each checklist row. */
  Bullet: IconComponent;
  /** True when the bullet points somewhere — it gets mirrored in RTL. */
  bulletIsDirectional?: boolean;
}

// One config object per variant keeps the JSX tiny and the CSS data-driven.
const VARIANTS: Record<CalloutType, Variant> = {
  objectives: {
    Icon: TargetIcon,
    heading: () =>
      translate({
        id: 'callout.objectives.title',
        message: "What you'll learn",
      }),
    Bullet: CheckCircleIcon,
  },
  takeaways: {
    Icon: LightbulbIcon,
    heading: () =>
      translate({id: 'callout.takeaways.title', message: 'Key takeaways'}),
    Bullet: StarIcon,
  },
  tip: {
    Icon: SparkleIcon,
    heading: () => translate({id: 'callout.tip.title', message: 'Pro tip'}),
    Bullet: ArrowRightIcon,
    bulletIsDirectional: true,
  },
  warning: {
    Icon: WarningIcon,
    heading: () =>
      translate({id: 'callout.warning.title', message: 'Watch out'}),
    Bullet: DotIcon,
  },
};

/**
 * Matches ONE leading emoji (incl. flags, variation selectors and ZWJ
 * sequences) plus the whitespace after it.
 *
 * Why a plain regex and not Intl.Segmenter: a feature-detect branch could
 * resolve differently in the Node SSR pass and in the browser, which is exactly
 * how hydration mismatches (React #418/#425) happen. This is a pure,
 * deterministic transform that runs identically in both.
 */
const LEADING_EMOJI_RE =
  /^(?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)\s*/u;

/**
 * Defensive strip: legacy MDX authors sometimes typed a bullet emoji into the
 * item text itself, which would now render right next to the SVG marker.
 * Only strings are touched — JSX items pass through byte-identical.
 */
function stripLeadingEmoji(item: ReactNode): ReactNode {
  if (typeof item !== 'string') {
    return item;
  }
  const stripped = item.replace(LEADING_EMOJI_RE, '');
  // An emoji-only item would otherwise be erased entirely — keep it as authored.
  return stripped.length > 0 ? stripped : item;
}

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
  const {Icon, Bullet} = variant;
  const bulletClass = clsx(
    styles.bulletIcon,
    variant.bulletIsDirectional && styles.bulletDirectional,
  );

  return (
    <section
      className={`${styles.callout} ${styles[key]}`}
      // Region role + label exposes the box to assistive tech as a named landmark.
      role="note"
      aria-label={typeof heading === 'string' ? heading : undefined}>
      <div className={styles.accent} aria-hidden="true" />
      <header className={styles.header}>
        <span className={styles.icon} aria-hidden="true">
          <Icon className={styles.headerIcon} />
        </span>
        <span className={styles.title}>{heading}</span>
      </header>

      {items && items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.check} aria-hidden="true">
                <Bullet className={bulletClass} />
              </span>
              <span className={styles.itemText}>{stripLeadingEmoji(item)}</span>
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
