import React, {type ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Stamps a page (or a section) with a "last verified" date and a link to the
 * upstream source. Use it on VOLATILE content (anything quoting model names,
 * prices, limits, UI labels or features that change release-to-release).
 * Evergreen conceptual pages should NOT carry a date — see the freshness policy.
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
        <strong>Last verified: {lastVerified}.</strong>{' '}
        {children ??
          'This page quotes facts that change over time — treat the date above as its freshness.'}{' '}
        {source && (
          <>
            Confirm against the{' '}
            <a href={source} target="_blank" rel="noreferrer">
              official source
            </a>
            .
          </>
        )}
      </div>
    </aside>
  );
}
