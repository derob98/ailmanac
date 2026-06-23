import {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';

import Hero3D from '@site/src/components/Hero3D';
import {Reveal, CountUp} from '@site/src/components/Reveal';
import {useSmoothScroll} from '@site/src/components/SmoothScroll';

import styles from './index.module.css';

type Card = {emoji: string; title: string; blurb: string; to: string; cta?: string};

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

// Technical topic labels for the infinite marquee — mostly proper nouns that
// read the same across locales, so they stay meaningful untranslated.
const MARQUEE = [
  'Prompting', 'Claude Code', 'MCP', 'Subagents', 'Skills', 'Tool use',
  'Extended thinking', 'Prompt caching', 'Vision', 'Agents', 'CLAUDE.md',
  'RAG', 'Evals', 'Streaming', 'Hooks', 'Output styles',
];

/** Thin gradient bar tracking page scroll progress. */
function ScrollProgress() {
  const {scrollYProgress} = useScroll();
  const scaleX = useSpring(scrollYProgress, {stiffness: 120, damping: 30, restDelta: 0.001});
  return <motion.div className={styles.progress} style={{scaleX}} aria-hidden="true" />;
}

function Hero({lp}: {lp: string}) {
  return (
    <header className={styles.hero}>
      <div className={styles.mesh} aria-hidden="true" />
      <div className={styles.canvasWrap} aria-hidden="true">
        <Hero3D />
      </div>
      <div className={clsx('container', styles.heroInner)}>
        <p className={styles.eyebrow}>
          <Translate id="home.hero.eyebrow">Open-source · for every level</Translate>
        </p>
        <Heading as="h1" className={styles.title}>
          <span className="ailmanac-mark">
            <b>AI</b>·lmanac
          </span>
        </Heading>
        <p className={styles.subtitle}>
          <Translate id="home.hero.subtitle">
            Get genuinely great results from Claude — and any AI.
          </Translate>
        </p>
        <p className={styles.lede}>
          <Translate id="home.hero.lede">
            Stop fighting the blank prompt. Learn the patterns, customise your setup, and
            build with confidence. Clear, complete, and always current.
          </Translate>
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

/** Infinite marquee that skews with scroll velocity — an awwwards staple. */
function Marquee() {
  const reduce = useReducedMotion();
  const {scrollY} = useScroll();
  const velocity = useVelocity(scrollY);
  const skew = useSpring(
    useTransform(velocity, [-2600, 2600], [-7, 7], {clamp: true}),
    {stiffness: 220, damping: 40},
  );
  const row = [...MARQUEE, ...MARQUEE];
  return (
    <motion.div
      className={styles.marquee}
      style={reduce ? undefined : {skewX: skew}}
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

function Stats() {
  return (
    <section className={styles.stats}>
      <div className="container">
        <div className={styles.statsGrid}>
          <Reveal className={styles.stat} delay={0}>
            <span className={styles.statNum}><CountUp to={12} /></span>
            <span className={styles.statLabel}>
              <Translate id="home.stats.languages">languages, fully translated</Translate>
            </span>
          </Reveal>
          <Reveal className={styles.stat} delay={0.08}>
            <span className={styles.statNum}><CountUp to={100} suffix="+" /></span>
            <span className={styles.statLabel}>
              <Translate id="home.stats.guides">guides & playbooks</Translate>
            </span>
          </Reveal>
          <Reveal className={styles.stat} delay={0.16}>
            <span className={styles.statNum}><CountUp to={7} /></span>
            <span className={styles.statLabel}>
              <Translate id="home.stats.skills">ready-to-use skill packs</Translate>
            </span>
          </Reveal>
          <Reveal className={styles.stat} delay={0.24}>
            <span className={styles.statNum}>∞</span>
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
 * Pinned horizontal-scroll gallery: as you scroll down the tall section, the
 * sticky inner row slides sideways. Falls back to a normal grid on small
 * screens and under prefers-reduced-motion (where scroll-jacking hurts UX).
 */
function HorizontalGallery({title, lead, cards}: {title: string; lead?: string; cards: Card[]}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const decide = () =>
      setEnabled(!reduce && window.matchMedia('(min-width: 997px)').matches);
    decide();
    window.addEventListener('resize', decide);
    return () => window.removeEventListener('resize', decide);
  }, [reduce]);

  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
    layoutEffect: false,
  });
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-64%']);

  if (!enabled) {
    return <CardGrid title={title} lead={lead} cards={cards} big />;
  }

  return (
    <section ref={ref} className={styles.hScroll} aria-label={title}>
      <div className={styles.hSticky}>
        <div className="container">
          <Heading as="h2" className={clsx(styles.sectionTitle, styles.hTitle)}>{title}</Heading>
        </div>
        <motion.div className={styles.hTrack} style={{x}}>
          {cards.map((c) => (
            <Link key={c.title} to={c.to} className={clsx(styles.card, styles.hCard)}>
              <span className={styles.cardGlow} aria-hidden="true" />
              <span className={styles.cardEmoji} aria-hidden="true">{c.emoji}</span>
              <Heading as="h3" className={styles.cardTitle}>{c.title}</Heading>
              <p className={styles.cardBlurb}>{c.blurb}</p>
              <span className={styles.cardCta}>{c.cta ?? 'Open'} →</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

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
          <Translate id="home.final.title">Ready to get more out of Claude?</Translate>
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
  useSmoothScroll();
  return (
    <Layout
      title={`${siteConfig.title} — get the most out of Claude and any AI`}
      description="The always-current, community-built almanac for getting the most out of Claude — and every AI. For all levels, from your first prompt to production agents.">
      <ScrollProgress />
      <Hero lp={lp} />
      <main>
        <Marquee />
        <Stats />
        <CardGrid
          title={translate({id: 'home.start.title', message: 'Where should you start?'})}
          lead={translate({id: 'home.start.lead', message: "Pick who you are — we'll send you to the right place."})}
          cards={useTracks(lp)}
        />
        <HorizontalGallery
          title={translate({id: 'home.outcomes.title', message: "What you'll be able to do"})}
          cards={useOutcomes(lp)}
        />
        <Why />
        <FinalCta lp={lp} />
      </main>
    </Layout>
  );
}
