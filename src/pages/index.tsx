import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type Card = {emoji: string; title: string; blurb: string; to: string; cta?: string};

const TRACKS: Card[] = [
  {emoji: '🌱', title: 'Curious Newcomer', blurb: 'Never used AI seriously? Get a guaranteed first win in 5 minutes.', to: '/docs/start-here/your-first-5-minutes', cta: 'Your first 5 minutes'},
  {emoji: '💼', title: 'Knowledge Worker', blurb: 'Write, research, analyse and plan faster — without fabricated facts.', to: '/docs/playbooks/productivity', cta: 'Everyday productivity'},
  {emoji: '🛠️', title: 'Builder / Developer', blurb: 'Customise Claude Code and build on the API, from CLAUDE.md to agents.', to: '/docs/claude-code/what-is-claude-code', cta: 'Dive into Claude Code'},
  {emoji: '👥', title: 'Team Lead', blurb: 'Roll AI out to a team safely: conventions, security, a shared toolkit.', to: '/docs/start-here/learning-paths', cta: 'Choose a learning path'},
];

const OUTCOMES: Card[] = [
  {emoji: '✍️', title: 'Write & create', blurb: 'Draft in your voice, edit in passes, repurpose one idea into many.', to: '/docs/playbooks/writing'},
  {emoji: '🛠️', title: 'Build with Claude Code', blurb: 'CLAUDE.md, skills, MCP, subagents — make the agent yours.', to: '/docs/claude-code/what-is-claude-code'},
  {emoji: '🔌', title: 'Ship on the API', blurb: 'From your first call to streamed, tool-using production agents.', to: '/docs/api/first-call'},
  {emoji: '🧠', title: 'Understand AI', blurb: 'Mental models that make every tool click — and transfer anywhere.', to: '/docs/foundations/what-is-an-llm'},
];

const WHY: {emoji: string; title: string; blurb: string}[] = [
  {emoji: '🎯', title: 'Opinionated', blurb: 'The one recommended way first — then the alternatives.'},
  {emoji: '🏷️', title: 'Level-tagged', blurb: 'Every page badged, so you read what fits you.'},
  {emoji: '📋', title: 'Copy-paste ready', blurb: 'Templates, prompts & 7 skill packs you can use in 30s.'},
  {emoji: '✅', title: 'Always verified', blurb: 'Volatile facts carry a date and a source. No stale guesses.'},
];

const CHIPS = ['All levels', 'Claude.ai · voice · mobile', 'Claude Code', 'Claude API', '7 skill packs', 'Always verified'];

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={styles.mesh} aria-hidden="true" />
      <div className={clsx('container', styles.heroInner)}>
        <p className={styles.eyebrow}>Open-source · for every level</p>
        <Heading as="h1" className={styles.title}>
          <span className="ailmanac-mark"><b>AI</b>·lmanac</span>
        </Heading>
        <p className={styles.subtitle}>
          Get genuinely great results from <strong>Claude</strong> — and any AI.
        </p>
        <p className={styles.lede}>
          Stop fighting the blank prompt. Learn the patterns, customise your setup,
          and build with confidence. Clear, complete, and always current.
        </p>
        <div className={styles.ctas}>
          <Link className="button button--primary button--lg" to="/docs/start-here/your-first-5-minutes">
            Start in 5 minutes →
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/start-here/welcome">
            Browse the guide
          </Link>
        </div>
        <ul className={styles.chips} aria-label="What's covered">
          {CHIPS.map((c) => (
            <li key={c} className={styles.chip}>{c}</li>
          ))}
        </ul>
      </div>
    </header>
  );
}

function CardGrid({title, lead, cards, big}: {title: string; lead?: string; cards: Card[]; big?: boolean}) {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>{title}</Heading>
        {lead && <p className={styles.sectionLead}>{lead}</p>}
        <div className={clsx(styles.grid, big && styles.gridBig)}>
          {cards.map((c) => (
            <Link key={c.title} to={c.to} className={styles.card}>
              <span className={styles.cardEmoji} aria-hidden="true">{c.emoji}</span>
              <Heading as="h3" className={styles.cardTitle}>{c.title}</Heading>
              <p className={styles.cardBlurb}>{c.blurb}</p>
              <span className={styles.cardCta}>{c.cta ?? 'Open'} →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why() {
  return (
    <section className={clsx(styles.section, styles.whyBand)}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Why AILmanac</Heading>
        <div className={styles.whyGrid}>
          {WHY.map((w) => (
            <div key={w.title} className={styles.why}>
              <span className={styles.whyEmoji} aria-hidden="true">{w.emoji}</span>
              <div>
                <strong>{w.title}</strong>
                <p>{w.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className={styles.finalCta}>
      <div className={clsx('container', styles.finalInner)}>
        <Heading as="h2" className={styles.finalTitle}>Ready to get more out of Claude?</Heading>
        <p className={styles.finalLede}>Free, open-source, and built by the community. Jump in — or help make it the world's best AI field guide.</p>
        <div className={styles.ctas}>
          <Link className="button button--primary button--lg" to="/docs/start-here/welcome">Start learning</Link>
          <Link className="button button--secondary button--lg" to="/docs/contribute/contribute-in-10-minutes">Contribute</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — get the most out of Claude and any AI`}
      description="The always-current, community-built almanac for getting the most out of Claude — and every AI. For all levels, from your first prompt to production agents.">
      <Hero />
      <main>
        <CardGrid title="Where should you start?" lead="Pick who you are — we'll send you to the right place." cards={TRACKS} />
        <CardGrid title="What you'll be able to do" cards={OUTCOMES} big />
        <Why />
        <FinalCta />
      </main>
    </Layout>
  );
}
