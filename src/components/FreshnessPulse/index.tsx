import React, {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {useInView, useReducedMotion} from 'framer-motion';
import data from '@site/data/freshness.json';
import styles from '@site/src/pages/index.module.css';

/**
 * FreshnessPulse — "Always current", live.
 *
 * The brand's real differentiator (freshness) becomes the emotional payoff of
 * the page. We read data/freshness.json and compute the verified % using the
 * SAME thresholds as FreshnessDashboard (FRESH_DAYS=90 / AGING_DAYS=180), so
 * this section can never itself go stale.
 *
 * ── SSR / hydration safety ───────────────────────────────────────────────
 * This section is NOT wrapped in BrowserOnly (the % MUST exist as SSR text for
 * screen readers), so it is statically pre-rendered in Node. daysSince() reads
 * Date.now(), which differs between the build machine's clock and the visitor's
 * "today" — any page crossing the 90/180-day boundary in between would make the
 * server HTML and the first client render disagree (hydration mismatch). To
 * avoid that we SEED state from a deterministic value baked into the JSON
 * (data.verifiedPages / data.totalPages), which is identical on server and
 * client, then recompute against the live Date.now() in a post-mount effect.
 * SSR text matches first paint; the figure then upgrades to "live against
 * today" after hydration.
 *
 * The visual is a pure CSS/SVG pulsing ring of signal dots — NO WebGL. A single
 * CSS @keyframes drives every lit dot (with per-dot animation-delay) instead of
 * 24 independent framer loops, so it runs off the main thread and auto-throttles
 * when scrolled out of view; we additionally gate it behind useInView. Under
 * prefers-reduced-motion the ring is static.
 *
 * Accessibility: the ring is decorative (aria-hidden); the verified % and last
 * rebuild are ALSO exposed as plain text for screen readers.
 */

type FreshPage = {
  title: string;
  section: string;
  url: string;
  editUrl: string;
  lastVerified: string | null;
  source: string | null;
};

const FRESH_DAYS = 90;
const AGING_DAYS = 180;

function daysSince(date: string): number {
  const then = new Date(date + 'T00:00:00Z').getTime();
  return Math.floor((Date.now() - then) / 86_400_000);
}

/** Share of pages that carry a freshness stamp within the AGING window. */
function computeFreshPct(pages: FreshPage[]): number {
  if (!pages.length) return 0;
  let current = 0;
  for (const p of pages) {
    if (!p.lastVerified) continue;
    if (daysSince(p.lastVerified) <= AGING_DAYS) current++;
  }
  return Math.round((current / pages.length) * 100);
}

function countVerifiedWithin90(pages: FreshPage[]): number {
  return pages.filter(
    (p) => p.lastVerified && daysSince(p.lastVerified) <= FRESH_DAYS,
  ).length;
}

const RING_DOTS = 24;

export default function FreshnessPulse(): ReactNode {
  const reduce = useReducedMotion();
  const pages = data.pages as FreshPage[];

  const ringRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ringRef, {margin: '-10%'});

  // Deterministic SSR seed — identical on server and first client render.
  const seedPct = useMemo(
    () =>
      data.totalPages > 0
        ? Math.round((data.verifiedPages / data.totalPages) * 100)
        : 0,
    [],
  );

  const [freshPct, setFreshPct] = useState<number>(seedPct);
  const [verifiedWithin90, setVerifiedWithin90] = useState<number>(
    data.verifiedPages,
  );

  // After mount, recompute against the visitor's real "today" (live, never stale).
  useEffect(() => {
    setFreshPct(computeFreshPct(pages));
    setVerifiedWithin90(countVerifiedWithin90(pages));
  }, [pages]);

  const dots = Array.from({length: RING_DOTS});
  // Pulse only when reduced-motion is off AND the ring is on screen.
  const pulsing = !reduce && inView;

  return (
    <section className={styles.freshPulse}>
      <div className="container">
        <div className={styles.freshRing} aria-hidden="true" ref={ringRef}>
          <svg viewBox="0 0 200 200" width="200" height="200" role="presentation">
            <circle
              cx="100"
              cy="100"
              r="78"
              fill="none"
              stroke="color-mix(in srgb, var(--ifm-color-primary) 22%, transparent)"
              strokeWidth="1"
            />
            {dots.map((_, i) => {
              const angle = (i / RING_DOTS) * Math.PI * 2 - Math.PI / 2;
              const cx = 100 + Math.cos(angle) * 78;
              const cy = 100 + Math.sin(angle) * 78;
              const lit = i / RING_DOTS < freshPct / 100;
              return (
                <circle
                  key={i}
                  className={lit && pulsing ? styles.freshDotLit : styles.freshDot}
                  cx={cx}
                  cy={cy}
                  r={lit ? 3.4 : 2.2}
                  fill={
                    lit
                      ? 'var(--ail-accent)'
                      : 'color-mix(in srgb, var(--ifm-color-primary) 30%, transparent)'
                  }
                  style={
                    lit && pulsing
                      ? {animationDelay: `${(i / RING_DOTS) * 2.4}s`}
                      : undefined
                  }
                />
              );
            })}
            <text
              x="100"
              y="96"
              textAnchor="middle"
              style={{
                fontFamily: 'var(--ifm-heading-font-family)',
                fontWeight: 700,
                fontSize: '38px',
                fill: 'var(--ail-accent)',
              }}>
              {freshPct}%
            </text>
            <text
              x="100"
              y="120"
              textAnchor="middle"
              style={{
                fontFamily: 'var(--ifm-font-family-base)',
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fill: 'var(--ifm-color-emphasis-700)',
              }}>
              verified
            </text>
          </svg>
        </div>

        <div className={styles.freshMeta}>
          {/* The visible <h2> names the region; no redundant section aria-label. */}
          <h2 className={styles.sectionTitle} style={{textAlign: 'inherit'}}>
            <Translate id="home.fresh.title">Always current</Translate>
          </h2>
          <p className={styles.sectionLead} style={{textAlign: 'inherit', margin: '0 0 1rem'}}>
            <Translate id="home.fresh.subtitle">
              Volatile facts carry a date and a source — and this page proves it,
              live, every time you load it.
            </Translate>
          </p>
          {/* Plain-text, screen-reader-friendly live readout — the single
              authoritative AT source for the percentage. */}
          <p>
            <Translate
              id="home.fresh.live"
              values={{
                percent: <strong>{freshPct}%</strong>,
                count: verifiedWithin90,
                date: <code>{data.generatedAt}</code>,
              }}>
              {'{percent} of pages verified · {count} checked in the last 90 days · last rebuild {date}'}
            </Translate>
          </p>
        </div>
      </div>
    </section>
  );
}
