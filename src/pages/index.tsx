import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type Track = {
  emoji: string;
  title: string;
  blurb: string;
  to: string;
  cta: string;
};

// The homepage is a router, not a wall of text: pick who you are, get sent to
// the right starting point.
const TRACKS: Track[] = [
  {
    emoji: '🌱',
    title: 'Curious Newcomer',
    blurb: 'Never used Claude (or any AI) seriously? Start with a guaranteed first win.',
    to: '/docs/start-here/your-first-5-minutes',
    cta: 'Your first 5 minutes',
  },
  {
    emoji: '💼',
    title: 'Knowledge Worker',
    blurb: 'Write, research, analyse and plan faster — without fabricated facts.',
    to: '/docs/playbooks/productivity',
    cta: 'Everyday productivity',
  },
  {
    emoji: '🛠️',
    title: 'Builder / Developer',
    blurb: 'Customise Claude Code and build on the API, from CLAUDE.md to agents.',
    to: '/docs/claude-code/what-is-claude-code',
    cta: 'Dive into Claude Code',
  },
  {
    emoji: '👥',
    title: 'Team Lead',
    blurb: 'Roll out AI to a team safely: conventions, security and a shared toolkit.',
    to: '/docs/start-here/learning-paths',
    cta: 'Choose a learning path',
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          <span className="ailmanac-mark">
            <b>AI</b>·lmanac
          </span>
        </Heading>
        <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
          {siteConfig.tagline}
        </p>
        <p className={styles.heroNote}>
          From your first prompt to production agents — clear, complete, and for
          every level.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/start-here/your-first-5-minutes">
            Start in 5 minutes →
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/start-here/welcome">
            Browse the guide
          </Link>
        </div>
      </div>
    </header>
  );
}

function Tracks() {
  return (
    <section className={styles.tracks}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Where should you start?
        </Heading>
        <div className={styles.trackGrid}>
          {TRACKS.map((t) => (
            <Link key={t.title} to={t.to} className={styles.trackCard}>
              <div className={styles.trackEmoji} aria-hidden="true">
                {t.emoji}
              </div>
              <Heading as="h3" className={styles.trackTitle}>
                {t.title}
              </Heading>
              <p className={styles.trackBlurb}>{t.blurb}</p>
              <span className={styles.trackCta}>{t.cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className={styles.quick}>
      <div className="container">
        <div className={styles.quickGrid}>
          <Link to="/docs/prompting/basics" className={styles.quickItem}>
            <strong>✍️ Prompting</strong>
            <span>The patterns that work on any AI.</span>
          </Link>
          <Link to="/docs/templates/claude-md" className={styles.quickItem}>
            <strong>📋 Templates</strong>
            <span>Copy-paste CLAUDE.md, prompts &amp; recipes.</span>
          </Link>
          <Link to="/docs/whats-new/models-and-pricing" className={styles.quickItem}>
            <strong>🆕 What&apos;s New</strong>
            <span>Current models, kept verified.</span>
          </Link>
          <Link
            to="/docs/contribute/contribute-in-10-minutes"
            className={styles.quickItem}>
            <strong>🤝 Contribute</strong>
            <span>Help keep the almanac complete &amp; fresh.</span>
          </Link>
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
      <HomepageHeader />
      <main>
        <Tracks />
        <QuickLinks />
      </main>
    </Layout>
  );
}
