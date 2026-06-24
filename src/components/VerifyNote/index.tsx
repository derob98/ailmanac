import React, {type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

/**
 * Stamps a page (or a section) with a "last verified" date and a link to the
 * upstream source. Use it on VOLATILE content (anything quoting model names,
 * prices, limits, UI labels or features that change release-to-release).
 */
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
      <span className={styles.icon} aria-hidden="true">
        ✅
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
        {source && (
          <>
            <Translate id="verify.confirm">Confirm against the</Translate>{' '}
            <a href={source} target="_blank" rel="noreferrer">
              <Translate id="verify.source">official source</Translate>
            </a>
            .
          </>
        )}
      </div>
    </aside>
  );
}
