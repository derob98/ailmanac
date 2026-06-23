import React, {useEffect, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {translate} from '@docusaurus/Translate';
import {motion, useReducedMotion, useScroll, useTransform} from 'framer-motion';
import type {Card} from '@site/src/pages/index';
import styles from '@site/src/pages/index.module.css';

/**
 * Sticky-stacking persona deck. Each card pins (position: sticky) and, as the
 * next card scrolls up to cover it, scales down + dims via a per-card
 * scroll-linked transform. This does NOT hijack scroll — it is pure sticky
 * layout, so the user is never trapped.
 *
 * Gated to desktop (≥997px) and non-reduced-motion, mirroring HorizontalGallery.
 * When disabled it returns the provided `fallback` (the normal CardGrid), so
 * mobile and reduced-motion readers get the exact same content, statically.
 *
 * ── Accessibility ────────────────────────────────────────────────────────
 * Each card stays a real <Link> in the tab order even while dimmed/scaled and
 * partially covered by the next card. To keep keyboard focus visible and on top
 * (WCAG 2.4.7 / 2.4.11) we:
 *   • raise the focused card's z-index above the covering card, and
 *   • reset its scroll-linked scale/opacity to 1 on :focus-within (via a
 *     `focused` state that disables the motion transform for that card).
 * The `.stackCard:focus-within` CSS rule pairs with this to lift z-index.
 *
 * The enabled deck also renders the section title + lead (home.start.title /
 * home.start.lead) so the document keeps an <h2> and is content-equivalent to
 * the CardGrid fallback.
 */

function StackCard({card, index, total}: {card: Card; index: number; total: number}) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start center', 'end start'],
    layoutEffect: false,
  });
  // The card shrinks and dims only once the next one starts covering it.
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0.55]);
  const isLast = index === total - 1;
  // Keyboard focus always brings the card fully visible (and CSS lifts z-index).
  const animate = isLast || focused ? undefined : {scale, opacity};

  return (
    <div ref={ref} className={styles.stackCard} style={{zIndex: index + 1}}>
      <motion.div
        style={animate}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}>
        <Link to={card.to} className={styles.card}>
          <span className={styles.cardGlow} aria-hidden="true" />
          <span className={styles.cardEmoji} aria-hidden="true">{card.emoji}</span>
          <Heading as="h3" className={styles.cardTitle}>{card.title}</Heading>
          <p className={styles.cardBlurb}>{card.blurb}</p>
          <span className={styles.cardCta}>{card.cta ?? 'Open'} →</span>
        </Link>
      </motion.div>
    </div>
  );
}

export function StackingCards({
  cards,
  fallback,
}: {
  cards: Card[];
  fallback: React.ReactNode;
}): React.ReactNode {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const decide = () =>
      setEnabled(!reduce && window.matchMedia('(min-width: 997px)').matches);
    decide();
    window.addEventListener('resize', decide);
    return () => window.removeEventListener('resize', decide);
  }, [reduce]);

  if (!enabled) {
    return <>{fallback}</>;
  }

  return (
    <section className={styles.stackWrap}>
      <div className="container">
        {/* Match the CardGrid fallback: keep the section heading + lead so the
            document outline and content are equivalent on both paths. */}
        <Heading as="h2" className={styles.sectionTitle}>
          {translate({id: 'home.start.title', message: 'Where should you start?'})}
        </Heading>
        <p className={styles.sectionLead}>
          {translate({
            id: 'home.start.lead',
            message: "Pick who you are — we'll send you to the right place.",
          })}
        </p>
        {cards.map((c, i) => (
          <StackCard key={c.title} card={c} index={i} total={cards.length} />
        ))}
      </div>
    </section>
  );
}

export default StackingCards;
