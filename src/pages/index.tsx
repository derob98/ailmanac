import {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';

import HeroField from '@site/src/components/HeroField';
import {Reveal, CountUp} from '@site/src/components/Reveal';
import {Scramble} from '@site/src/components/Scramble';
import {StackingCards} from '@site/src/components/StackingCards';
import FreshnessPulse from '@site/src/components/FreshnessPulse';

import styles from './index.module.css';

// Exported so StackingCards (and any future deck) can share the card shape.
export type Card = {emoji: string; title: string; blurb: string; to: string; cta?: string};

// Feature-flag the live freshness section so a launch is never blocked on it.
const FEATURE_FRESHNESS = true;

// Animation primitives for the kinetic mask line-reveals (awwwards clip-reveal).
const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

// Docusaurus already localizes absolute "/docs/..." links in each locale build,
// so no manual locale prefix is needed (adding one double-prefixes and breaks).
function useLocalePrefix(): string {
  return '';
}

function useTracks(lp: string): Card[] {
  return [
    {
      emoji: '🌱',
      title: translate({id: 'home.track.newcomer.title', message: 'Curious Newcomer'}),
      blurb: translate({id: 'home.track.newcomer.blurb', message: 'Never used AI seriously? Get a guaranteed first win in 5 minutes.'}),
      to: `${lp}/docs/start-here/your-first-5-minutes`,
      cta: translate({id: 'home.track.newcomer.cta', message: 'Your first 5 minutes'}),
    },
    {
      emoji: '💼',
      title: translate({id: 'home.track.worker.title', message: 'Knowledge Worker'}),
      blurb: translate({id: 'home.track.worker.blurb', message: 'Write, research, analyse and plan faster — without fabricated facts.'}),
      to: `${lp}/docs/playbooks/productivity`,
      cta: translate({id: 'home.track.worker.cta', message: 'Everyday productivity'}),
    },
    {
      emoji: '🛠️',
      title: translate({id: 'home.track.builder.title', message: 'Builder / Developer'}),
      blurb: translate({id: 'home.track.builder.blurb', message: 'Customise Claude Code and build on the API, from CLAUDE.md to agents.'}),
      to: `${lp}/docs/claude-code/what-is-claude-code`,
      cta: translate({id: 'home.track.builder.cta', message: 'Dive into Claude Code'}),
    },
    {
      emoji: '👥',
      title: translate({id: 'home.track.lead.title', message: 'Team Lead'}),
      blurb: translate({id: 'home.track.lead.blurb', message: 'Roll AI out to a team safely: conventions, security, a shared toolkit.'}),
      to: `${lp}/docs/start-here/learning-paths`,
      cta: translate({id: 'home.track.lead.cta', message: 'Choose a learning path'}),
    },
  ];
}

function useOutcomes(lp: string): Card[] {
  return [
    {
      emoji: '✍️',
      title: translate({id: 'home.outcome.write.title', message: 'Write & create'}),
      blurb: translate({id: 'home.outcome.write.blurb', message: 'Draft in your voice, edit in passes, repurpose one idea into many.'}),
      to: `${lp}/docs/playbooks/writing`,
    },
    {
      emoji: '🛠️',
      title: translate({id: 'home.outcome.build.title', message: 'Build with Claude Code'}),
      blurb: translate({id: 'home.outcome.build.blurb', message: 'CLAUDE.md, skills, MCP, subagents — make the agent yours.'}),
      to: `${lp}/docs/claude-code/what-is-claude-code`,
    },
    {
      emoji: '🔌',
      title: translate({id: 'home.outcome.ship.title', message: 'Ship on the API'}),
      blurb: translate({id: 'home.outcome.ship.blurb', message: 'From your first call to streamed, tool-using production agents.'}),
      to: `${lp}/docs/api/first-call`,
    },
    {
      emoji: '🧠',
      title: translate({id: 'home.outcome.understand.title', message: 'Understand AI'}),
      blurb: translate({id: 'home.outcome.understand.blurb', message: 'Mental models that make every tool click — and transfer anywhere.'}),
      to: `${lp}/docs/foundations/what-is-an-llm`,
    },
  ];
}

function useWhy() {
  return [
    {
      emoji: '🎯',
      title: translate({id: 'home.why.opinionated.title', message: 'Opinionated'}),
      blurb: translate({id: 'home.why.opinionated.blurb', message: 'The one recommended way first — then the alternatives.'}),
    },
    {
      emoji: '🏷️',
      title: translate({id: 'home.why.leveled.title', message: 'Level-tagged'}),
      blurb: translate({id: 'home.why.leveled.blurb', message: 'Every page badged, so you read what fits you.'}),
    },
    {
      emoji: '📋',
      title: translate({id: 'home.why.copy.title', message: 'Copy-paste ready'}),
      blurb: translate({id: 'home.why.copy.blurb', message: 'Templates, prompts & 7 skill packs you can use in 30s.'}),
    },
    {
      emoji: '✅',
      title: translate({id: 'home.why.fresh.title', message: 'Always verified'}),
      blurb: translate({id: 'home.why.fresh.blurb', message: 'Volatile facts carry a date and a source. No stale guesses.'}),
    },
  ];
}

function useChips(): string[] {
  return [
    translate({id: 'home.chip.levels', message: 'All levels'}),
    translate({id: 'home.chip.consumer', message: 'Claude.ai · voice · mobile'}),
    translate({id: 'home.chip.code', message: 'Claude Code'}),
    translate({id: 'home.chip.api', message: 'Claude API'}),
    translate({id: 'home.chip.skills', message: '7 skill packs'}),
    translate({id: 'home.chip.verified', message: 'Always verified'}),
  ];
}

// Kinetic verbs layered over each outcome panel — derived in order from the
// outcome cards (Write / Build / Ship / Understand), no new strings.
function useOutcomeVerbs(): string[] {
  return [
    translate({id: 'home.outcome.write.title', message: 'Write & create'}).split(' ')[0],
    translate({id: 'home.outcome.build.title', message: 'Build with Claude Code'}).split(' ')[0],
    translate({id: 'home.outcome.ship.title', message: 'Ship on the API'}).split(' ')[0],
    translate({id: 'home.outcome.understand.title', message: 'Understand AI'}).split(' ')[0],
  ];
}

// Technical topic labels for the infinite marquee — mostly proper nouns that
// read the same across locales, so they stay meaningful untranslated.
const MARQUEE = [
  'Prompting', 'Claude Code', 'MCP', 'Subagents', 'Skills', 'Tool use',
  'Extended thinking', 'Prompt caching', 'Vision', 'Agents', 'CLAUDE.md',
  'RAG', 'Evals', 'Streaming', 'Hooks', 'Output styles',
];

/**
 * One line of a kinetic mask reveal: an overflow-hidden wrapper whose inner
 * translates up from 110% → 0 on enter. SSR-safe (final markup renders on the
 * server) and never opacity-from-0 on the LCP line. Under reduced motion the
 * inner renders fully shown (y:0). framer-motion adds/removes `will-change`
 * itself during the one-shot animation, so we never pin it in CSS.
 */
function MaskLine({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={clsx(styles.lineMask, className)}>
      <motion.span
        className={styles.lineInner}
        initial={reduce ? false : {y: '110%'}}
        animate={reduce ? undefined : {y: 0}}
        transition={{duration: 0.9, delay, ease: REVEAL_EASE}}>
        {children}
      </motion.span>
    </span>
  );
}

/** Thin gradient bar tracking page scroll progress — doubles as a reading rule. */
function ScrollProgress() {
  const {scrollYProgress} = useScroll();
  const scaleX = useSpring(scrollYProgress, {stiffness: 120, damping: 30, restDelta: 0.001});
  return <motion.div className={styles.progress} style={{scaleX}} aria-hidden="true" />;
}

function Hero({lp}: {lp: string}) {
  return (
    <header className={styles.hero}>
      <div className={styles.mesh} aria-hidden="true" />
      {/* Slow conic "aurora" depth layer behind the WebGL scene (CSS-only,
          reduced-motion gated). Purely decorative. */}
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.canvasWrap} aria-hidden="true">
        {/* "The Almanac Field" — one depth-fogged particle field + constellation,
            identical on every engine. Idle-deferred and BrowserOnly. */}
        <HeroField />
      </div>
      <div className={clsx('container', styles.heroInner)}>
        <p className={styles.eyebrow}>
          <Translate id="home.hero.eyebrow">Open-source · for every level</Translate>
        </p>
        <Heading as="h1" className={styles.title}>
          <MaskLine>
            <span className="ailmanac-mark">
              <b>AI</b>·lmanac
            </span>
          </MaskLine>
        </Heading>
        {/* Oversized 3-line promise, set in Space Grotesk via .promise. */}
        <p className={styles.promise}>
          <MaskLine delay={0.09}>
            <Translate id="home.hero.subtitle">
              Get genuinely great results from Claude — and any AI.
            </Translate>
          </MaskLine>
        </p>
        <p className={styles.lede}>
          <MaskLine delay={0.18}>
            <Translate id="home.hero.lede">
              Stop fighting the blank prompt. Learn the patterns, customise your setup, and
              build with confidence. Clear, complete, and always current.
            </Translate>
          </MaskLine>
        </p>
        <div className={styles.ctas}>
          <Link className="button button--primary button--lg" to={`${lp}/docs/start-here/your-first-5-minutes`}>
            <Translate id="home.hero.cta.start">Start in 5 minutes →</Translate>
          </Link>
          <Link className="button button--secondary button--lg" to={`${lp}/docs/start-here/welcome`}>
            <Translate id="home.hero.cta.browse">Browse the guide</Translate>
          </Link>
        </div>
        <ul className={styles.chips} aria-label="What's covered">
          {useChips().map((c) => (
            <li key={c} className={styles.chip}>{c}</li>
          ))}
        </ul>
      </div>
      <div className={styles.scrollCue} aria-hidden="true">
        <span className={styles.scrollDot} />
      </div>
    </header>
  );
}

/**
 * Thesis — one full-width "noise → signal" sentence that scramble-resolves on
 * enter. ONE dominant gesture, generous whitespace, nothing else in the section.
 */
function Thesis() {
  return (
    <section className={styles.thesis} aria-label="What AILmanac is for">
      <div className="container">
        <Reveal>
          <Scramble
            as="p"
            className={styles.thesisLine}
            text={translate({
              id: 'home.thesis.line',
              message: 'An almanac turns the noise of AI into signal you can actually use.',
            })}
            duration={1.1}
          />
        </Reveal>
      </div>
    </section>
  );
}

/** Infinite marquee that skews with scroll velocity — an awwwards staple. */
function Marquee() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Only subscribe the velocity spring while the marquee is near the viewport,
  // so it does not tick on every scroll delta over the whole document.
  const inView = useInView(ref, {margin: '20% 0px'});
  const {scrollY} = useScroll();
  const velocity = useVelocity(scrollY);
  const skew = useSpring(
    useTransform(velocity, [-2600, 2600], [-7, 7], {clamp: true}),
    {stiffness: 220, damping: 40, restDelta: 0.01},
  );
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <motion.div
      ref={ref}
      className={styles.marquee}
      style={reduce || !inView ? undefined : {skewX: skew}}
      aria-hidden="true">
      <div className={styles.marqueeFade} />
      <div className={styles.marqueeTrack}>
        {row.map((t, i) => (
          <span key={`a${i}`} className={styles.pill}>{t}</span>
        ))}
      </div>
      <div className={clsx(styles.marqueeTrack, styles.marqueeReverse)}>
        {row.map((t, i) => (
          <span key={`b${i}`} className={styles.pill}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * A stat figure: CountUp rolls the number into place; a brief scramble settles
 * the suffix (e.g. "+") into its final glyph. CountUp is the agreed numeric
 * "noise → signal" gesture for digits (a per-digit scramble over a live-rolling
 * counter would fight it); the Scramble layer carries the awwwards settle on the
 * suffix. Under reduced motion both render their final value instantly.
 */
function StatFigure({to, suffix}: {to: number; suffix?: string}) {
  return (
    <span className={styles.statNum}>
      <CountUp to={to} />
      {suffix ? <Scramble as="span" text={suffix} duration={0.7} /> : null}
    </span>
  );
}

function Stats() {
  return (
    <section className={styles.stats}>
      <div className="container">
        <div className={styles.statsGrid}>
          <Reveal className={styles.stat} delay={0}>
            <StatFigure to={12} />
            <span className={styles.statLabel}>
              <Translate id="home.stats.languages">languages, fully translated</Translate>
            </span>
          </Reveal>
          <Reveal className={styles.stat} delay={0.08}>
            <StatFigure to={100} suffix="+" />
            <span className={styles.statLabel}>
              <Translate id="home.stats.guides">guides & playbooks</Translate>
            </span>
          </Reveal>
          <Reveal className={styles.stat} delay={0.16}>
            <StatFigure to={7} />
            <span className={styles.statLabel}>
              <Translate id="home.stats.skills">ready-to-use skill packs</Translate>
            </span>
          </Reveal>
          <Reveal className={styles.stat} delay={0.24}>
            <span className={clsx(styles.statNum, styles.statInfinity)}>∞</span>
            <span className={styles.statLabel}>
              <Translate id="home.stats.fresh">always current, never stale</Translate>
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CardGrid({title, lead, cards, big}: {title: string; lead?: string; cards: Card[]; big?: boolean}) {
  return (
    <section className={styles.section}>
      <div className="container">
        <Reveal>
          <Heading as="h2" className={styles.sectionTitle}>{title}</Heading>
          {lead && <p className={styles.sectionLead}>{lead}</p>}
        </Reveal>
        <div className={clsx(styles.grid, big && styles.gridBig)}>
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.07}>
              <Link to={c.to} className={styles.card}>
                <span className={styles.cardGlow} aria-hidden="true" />
                <span className={styles.cardEmoji} aria-hidden="true">{c.emoji}</span>
                <Heading as="h3" className={styles.cardTitle}>{c.title}</Heading>
                <p className={styles.cardBlurb}>{c.blurb}</p>
                <span className={styles.cardCta}>{c.cta ?? 'Open'} →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * One outcome panel. The giant kinetic verb clip-wipes in when the panel scrolls
 * into the carousel's own viewport (`viewport.root` is the horizontal scroller,
 * so intersection is measured sideways). Hover/focus stay an enhancement;
 * reduced motion shows the verb statically.
 */
function OutcomePanel({
  card,
  verb,
  scroller,
  reduce,
}: {
  card: Card;
  verb: string;
  scroller: React.RefObject<HTMLDivElement | null>;
  reduce: boolean;
}) {
  return (
    <Link to={card.to} className={clsx(styles.card, styles.hCard)}>
      <span className={styles.cardGlow} aria-hidden="true" />
      <motion.span
        className={styles.kineticVerb}
        aria-hidden="true"
        initial={reduce ? false : {clipPath: 'inset(0 100% 0 0)', opacity: 0.2}}
        whileInView={{clipPath: 'inset(0 0% 0 0)', opacity: 0.85}}
        viewport={{root: scroller, once: true, amount: 0.4}}
        transition={{duration: 0.7, ease: [0.22, 1, 0.36, 1]}}>
        {verb}
      </motion.span>
      <span className={styles.cardEmoji} aria-hidden="true">{card.emoji}</span>
      <Heading as="h3" className={styles.cardTitle}>{card.title}</Heading>
      <p className={styles.cardBlurb}>{card.blurb}</p>
      <span className={styles.cardCta}>{card.cta ?? 'Open'} →</span>
    </Link>
  );
}

/**
 * Outcomes carousel — a NATIVE horizontal scroller with scroll-snap.
 *
 * This replaces a pinned scroll-jacking gallery: a 280vh section whose sticky
 * row translated sideways as you scrolled down. That approach hijacked the
 * page's vertical scroll, and on the live site it rendered as ~2000px of black
 * void when the pin and the transform disagreed. It also needed a separate
 * grid fallback for mobile and reduced-motion, i.e. three code paths to keep
 * honest.
 *
 * A native scroller is one code path for everyone: it snaps on touch, it
 * respects RTL for free (logical properties, no transform math), it is
 * keyboard-scrollable, and vertical page scroll is never touched. Desktop gets
 * grab-to-drag on top, since a trackpad user may not think to swipe sideways.
 */
function OutcomeCarousel({title, lead, cards}: {title: string; lead?: string; cards: Card[]}) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const verbs = useOutcomeVerbs();

  // Pointer-drag to pan. Only for fine pointers — on touch the native gesture
  // is already right, and intercepting it would break momentum scrolling.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    let down = false;
    let startX = 0;
    let startScroll = 0;

    const onDown = (e: PointerEvent) => {
      // Let clicks on the card links behave normally until a drag actually
      // starts; we only claim the pointer once it moves past the threshold.
      down = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) < 6) return;
      if (!el.hasPointerCapture(e.pointerId)) {
        el.setPointerCapture(e.pointerId);
        el.classList.add(styles.dragging);
      }
      el.scrollLeft = startScroll - dx;
    };
    const end = (e: PointerEvent) => {
      down = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove(styles.dragging);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
  }, []);

  return (
    <section className={styles.section} aria-label={title}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>{title}</Heading>
        {lead ? <p className={styles.sectionLead}>{lead}</p> : null}
      </div>
      <div className={styles.carouselWrap}>
        <div className={styles.carousel} ref={scroller} tabIndex={0}>
          {cards.map((c, i) => (
            <OutcomePanel
              key={c.title}
              card={c}
              verb={verbs[i]}
              scroller={scroller}
              reduce={!!reduce}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** "Why AILmanac" — the 4 value props as large mask-revealed editorial lines. */
function Why() {
  return (
    <section className={clsx(styles.section, styles.whyBand)}>
      <div className="container">
        <Reveal>
          <Heading as="h2" className={styles.sectionTitle}>
            <Translate id="home.why.title">Why AILmanac</Translate>
          </Heading>
        </Reveal>
        <div className={styles.whyGrid}>
          {useWhy().map((w, i) => (
            <Reveal key={w.title} delay={i * 0.07} className={styles.why}>
              <span className={styles.whyEmoji} aria-hidden="true">{w.emoji}</span>
              <div>
                <strong>{w.title}</strong>
                <p>{w.blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({lp}: {lp: string}) {
  return (
    <section className={styles.finalCta}>
      <div className={clsx('container', styles.finalInner)}>
        <Heading as="h2" className={styles.finalTitle}>
          {/* The hero motif resolves one last time: noise → signal. */}
          <Scramble
            as="span"
            text={translate({id: 'home.final.title', message: 'Ready to get more out of Claude?'})}
            duration={1.0}
          />
        </Heading>
        <p className={styles.finalLede}>
          <Translate id="home.final.lede">
            Free, open-source, and built by the community. Jump in — or help make it the
            world's best AI field guide.
          </Translate>
        </p>
        <div className={styles.ctas}>
          <Link className="button button--primary button--lg" to={`${lp}/docs/start-here/welcome`}>
            <Translate id="home.final.cta.start">Start learning</Translate>
          </Link>
          <Link className="button button--secondary button--lg" to={`${lp}/docs/contribute/contribute-in-10-minutes`}>
            <Translate id="home.final.cta.contribute">Contribute</Translate>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const lp = useLocalePrefix();
  // Compute the persona tracks once and share between the deck and its fallback.
  const tracks = useTracks(lp);
  return (
    <Layout
      title={`${siteConfig.title} — get the most out of Claude and any AI`}
      description="The always-current, community-built almanac for getting the most out of Claude — and every AI. For all levels, from your first prompt to production agents.">
      <ScrollProgress />
      <Hero lp={lp} />
      <main>
        <Thesis />
        <Marquee />
        <Stats />
        <StackingCards
          cards={tracks}
          fallback={
            <CardGrid
              title={translate({id: 'home.start.title', message: 'Where should you start?'})}
              lead={translate({id: 'home.start.lead', message: "Pick who you are — we'll send you to the right place."})}
              cards={tracks}
              big
            />
          }
        />
        <OutcomeCarousel
          title={translate({id: 'home.outcomes.title', message: "What you'll be able to do"})}
          cards={useOutcomes(lp)}
        />
        <Why />
        {FEATURE_FRESHNESS && <FreshnessPulse />}
        <FinalCta lp={lp} />
      </main>
    </Layout>
  );
}
