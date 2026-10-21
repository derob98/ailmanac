import React, {useState, type ReactNode} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import data from '@site/data/models.json';
import {CheckIcon} from '@site/src/components/icons';
import styles from './styles.module.css';

type Model = {
  name: string;
  id: string;
  tier: string;
  bestFor: string;
};

/**
 * Above this many characters a "Best for" cell is clamped to a few lines and
 * grows a Show more / Show less toggle. A CHARACTER threshold — rather than
 * measuring scrollHeight after paint — is deliberate: it makes the first paint
 * byte-identical on server and client (no hydration mismatch, React #418), and
 * costs no layout read and no ResizeObserver. Every row currently in
 * data/models.json is far above it; a genuinely short note still renders
 * unclamped, with no stray affordance pointing at nothing.
 */
const CLAMP_CHARS = 200;

/**
 * Renders the single source of truth for current Claude models from
 * data/models.json, with a visible "last verified" stamp. No model fact should
 * ever be hard-coded in prose — link here instead. Pricing and context limits
 * are intentionally NOT shown: they change often, so we point to the official
 * pages rather than risk stale numbers.
 *
 * The "Best for" column carries multi-hundred-word guidance, so the table is
 * built to stay scannable at that density: tier strings split into a family
 * chip plus a muted qualifier, long guidance clamped behind a disclosure
 * toggle, and only the <table> — not the stamp or the footnote — inside the
 * horizontal scroll region.
 */
export default function ModelTable(): ReactNode {
  const models = (data.models ?? []) as Model[];
  // Keyed by model id, so expanding one row never disturbs another.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) =>
    setExpanded((prev) => ({...prev, [id]: !prev[id]}));

  return (
    <div className={styles.wrap}>
      <p className={styles.stamp}>
        {/* Decorative: "Last verified" right after it carries the meaning. */}
        <CheckIcon className={styles.stampIcon} /> <strong>Last verified:</strong>{' '}
        <span className={styles.stampDate}>{data.lastVerified}</span> ·{' '}
        <a href={data.source} target="_blank" rel="noreferrer">
          Official models &amp; pricing
        </a>
      </p>
      {/*
        Only the table scrolls. Previously the whole wrapper was the scroll
        container, so swiping a wide table dragged the freshness stamp and the
        footnote off-screen with it — the two bits of context you most want to
        keep in view while reading the rows.
      */}
      <div
        className={styles.scroller}
        role="region"
        tabIndex={0}
        aria-label={translate({
          id: 'modelTable.scrollableLabel',
          message: 'Claude models — scrollable table',
          description:
            'aria-label for the horizontal scroll region around the Claude models table',
        })}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Model</th>
              <th>API model ID</th>
              <th>Tier</th>
              <th>Best for</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => {
              // Tier strings are written "Family — qualifier" (em dash). The
              // family is the scannable part, so it becomes a chip; the
              // qualifier drops to a muted second line. A tier with no em dash
              // simply renders as a chip on its own.
              const [familyPart, ...qualifierParts] = m.tier.split('—');
              const family = familyPart.trim();
              const qualifier = qualifierParts.join('—').trim();

              const clampable = m.bestFor.length > CLAMP_CHARS;
              const isOpen = Boolean(expanded[m.id]);
              // Deterministic id (model ids are unique and slug-safe) so
              // aria-controls resolves identically on server and client.
              const cellId = `modeltable-best-${m.id}`;

              return (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                  </td>
                  <td>
                    <code>{m.id}</code>
                  </td>
                  <td>
                    <span className={styles.family}>{family}</span>
                    {qualifier ? (
                      <span className={styles.qualifier}>{qualifier}</span>
                    ) : null}
                  </td>
                  <td>
                    <div
                      id={cellId}
                      className={clsx(
                        styles.best,
                        clampable && !isOpen && styles.bestClamped,
                      )}>
                      {m.bestFor}
                    </div>
                    {clampable ? (
                      <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={isOpen}
                        aria-controls={cellId}
                        /* The visible label is generic across ten rows, so the
                           accessible name names the model too. It still CONTAINS
                           the visible text, keeping WCAG 2.5.3 (Label in Name)
                           satisfied. */
                        aria-label={
                          isOpen
                            ? translate(
                                {
                                  id: 'modelTable.showLessAbout',
                                  message: 'Show less about {model}',
                                  description:
                                    'Models table: accessible name for the collapse button of one row',
                                },
                                {model: m.name},
                              )
                            : translate(
                                {
                                  id: 'modelTable.showMoreAbout',
                                  message: 'Show more about {model}',
                                  description:
                                    'Models table: accessible name for the expand button of one row',
                                },
                                {model: m.name},
                              )
                        }
                        onClick={() => toggleRow(m.id)}>
                        <span
                          className={clsx(
                            styles.chevron,
                            isOpen && styles.chevronOpen,
                          )}
                          aria-hidden="true"
                        />
                        {isOpen
                          ? translate({
                              id: 'modelTable.showLess',
                              message: 'Show less',
                              description:
                                'Models table: visible label that collapses a long "Best for" cell',
                            })
                          : translate({
                              id: 'modelTable.showMore',
                              message: 'Show more',
                              description:
                                'Models table: visible label that expands a long "Best for" cell',
                            })}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>{data.note}</p>
    </div>
  );
}
