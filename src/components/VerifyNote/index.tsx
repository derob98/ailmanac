import React, {type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import {CheckIcon} from '@site/src/components/icons';
import styles from './styles.module.css';

/**
 * Stamps a page (or a section) with a "last verified" date and a link to the
 * upstream source. Use it on VOLATILE content (anything quoting model names,
 * prices, limits, UI labels or features that change release-to-release).
 */

/**
 * `source` becomes an href, so only a single absolute URL can be linked. Many
 * notes cite several works, or a paper plus a "these numbers move" caveat, and
 * carry prose there instead — which the browser would resolve as a *relative*
 * path, producing a link that looks fine and 404s on click. Render those as
 * plain text rather than a dead link.
 */
const isLinkable = (source: string): boolean => /^https?:\/\/\S+$/.test(source.trim());
export default function VerifyNote({
  lastVerified,
  source,
  children,
}: {
  lastVerified: string;
  source?: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <aside className={styles.verify} role="note" aria-label="Freshness note">
      {/* Decorative: the copy right next to it already says "Last verified". */}
      <span className={styles.icon} aria-hidden="true">
        <CheckIcon className={styles.iconGlyph} />
      </span>
      <div className={styles.body}>
        <strong>
          {translate(
            {id: 'verify.lastVerified', message: 'Last verified: {date}.'},
            {date: lastVerified},
          )}
        </strong>{' '}
        {children ?? (
          <Translate id="verify.default">
            This page quotes facts that change over time — treat the date above as its
            freshness.
          </Translate>
        )}{' '}
        {source &&
          (isLinkable(source) ? (
            <>
              <Translate id="verify.confirm">Confirm against the</Translate>{' '}
              <a href={source} target="_blank" rel="noreferrer">
                <Translate id="verify.source">official source</Translate>
              </a>
              .
            </>
          ) : (
            <Translate id="verify.sources" values={{sources: source}}>
              {'Sources: {sources}'}
            </Translate>
          ))}
      </div>
    </aside>
  );
}
