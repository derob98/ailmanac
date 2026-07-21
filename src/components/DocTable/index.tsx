import React from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

/**
 * Global override for Markdown tables.
 *
 * Docusaurus renders `|…|` tables as a bare <table>. With the site-wide
 * `html { overflow-x: clip }` guard, a wide reference table (many columns,
 * long model/pricing rows) would get its columns crushed — or clipped — on a
 * narrow phone, with no way to reach the hidden cells.
 *
 * This wraps every table in a horizontally-scrollable region so wide tables
 * scroll gracefully on mobile instead of collapsing, while narrow tables keep
 * their existing full-width look on desktop (see styles.module.css). The
 * wrapper is keyboard-focusable so it can be scrolled without a mouse, and it
 * carries a subtle brand-tinted edge shadow that hints there's more to see.
 *
 * Purely presentational + hydration-safe (no state, no Date/random). The inner
 * <table> is untouched, so all the global `.markdown table` styling still
 * applies.
 */
export default function DocTable(
  props: React.ComponentProps<'table'>,
): React.JSX.Element {
  return (
    <div
      className={styles.tableScroll}
      tabIndex={0}
      aria-label={translate({
        id: 'theme.docTable.scrollableLabel',
        message: 'Scrollable table',
        description: 'aria-label for the horizontal scroll wrapper around wide docs tables',
      })}
    >
      <table {...props} />
    </div>
  );
}
