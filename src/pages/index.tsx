import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

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

function Hero({lp}: {lp: string}) {
  return (
    <header className={styles.hero}>
      <div className={styles.mesh} aria-hidden="true" />
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
        <Heading as="h2" className={styles.sectionTitle}>
          <Translate id="home.why.title">Why AILmanac</Translate>
        </Heading>
        <div className={styles.whyGrid}>
          {useWhy().map((w) => (
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
  return (
    <Layout
      title={`${siteConfig.title} — get the most out of Claude and any AI`}
      description="The always-current, community-built almanac for getting the most out of Claude — and every AI. For all levels, from your first prompt to production agents.">
      <Hero lp={lp} />
      <main>
        <CardGrid
          title={translate({id: 'home.start.title', message: 'Where should you start?'})}
          lead={translate({id: 'home.start.lead', message: "Pick who you are — we'll send you to the right place."})}
          cards={useTracks(lp)}
        />
        <CardGrid
          title={translate({id: 'home.outcomes.title', message: "What you'll be able to do"})}
          cards={useOutcomes(lp)}
          big
        />
        <Why />
        <FinalCta lp={lp} />
      </main>
    </Layout>
  );
}
