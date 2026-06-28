/**
 * Swizzled @theme/DocCard — AILmanac premium override.
 *
 * The stock theme-classic DocCard renders a generic emoji (📄 / 🗃 / 🔗) for
 * every generated-index card. This override keeps the *exact* same render chain
 * (Layout -> Heading -> Icon/Text -> Description) and all stable global classes
 * (.theme-doc-card-container.card, .theme-doc-card-icon, …) so the existing
 * src/css/custom.css card styling continues to apply — it only swaps the `icon`
 * ReactNode for a tasteful brand gradient orb.
 *
 * Behavior preserved from upstream:
 *  - If a label starts with an emoji, that emoji still wins (authors can opt out
 *    of the orb by prefixing a label emoji, exactly like before).
 *  - Link vs. category vs. external are still distinguished (here: via orb tint).
 *
 * Safety:
 *  - Hydration-safe: pure static markup, no Date.now()/Math.random()/new Date().
 *  - SSR == client output (no client-only branching in render).
 *  - Renders for BOTH doc-link cards and category cards.
 *  - Light/Dark/RTL safe (CSS uses brand tokens + logical properties).
 */

import React, {type ReactNode} from 'react';
import {
  useDocById,
  findFirstSidebarItemLink,
} from '@docusaurus/plugin-content-docs/client';
import {
  extractLeadingEmoji,
  useDocCardDescriptionCategoryItemsPlural,
} from '@docusaurus/theme-common/internal';
import isInternalUrl from '@docusaurus/isInternalUrl';
import clsx from 'clsx';
import Layout from '@theme/DocCard/Layout';

import type {Props} from '@theme/DocCard';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from '@docusaurus/plugin-content-docs';

import styles from './styles.module.css';

type CardItem = PropSidebarItemLink | PropSidebarItemCategory;

/** First letter (A–Z / 0–9) of the human title, for the orb glyph. */
function deriveGlyph(title: string): string | null {
  for (const ch of title.trim()) {
    if (/[\p{L}\p{N}]/u.test(ch)) {
      return ch.toUpperCase();
    }
  }
  return null;
}

/** A premium gradient orb used in place of the generic document emoji. */
function GradientOrb({
  item,
  title,
}: {
  item: CardItem;
  title: string;
}): ReactNode {
  const isCategory = item.type === 'category';
  const isExternal = item.type === 'link' && !isInternalUrl(item.href);
  const glyph = deriveGlyph(title);

  return (
    <span
      aria-hidden="true"
      className={clsx(
        styles.orb,
        isCategory && styles.orbCategory,
        isExternal && styles.orbExternal,
      )}>
      {glyph ? (
        <span className={styles.glyph}>{glyph}</span>
      ) : (
        // Default "sparkle" glyph — used when a title has no letter/number
        // (e.g. emoji-only or punctuation-only labels). Static SVG.
        <svg
          className={styles.spark}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2.5l1.9 5.6a4 4 0 0 0 2.5 2.5L22 12.5l-5.6 1.9a4 4 0 0 0-2.5 2.5L12 22.5l-1.9-5.6a4 4 0 0 0-2.5-2.5L2 12.5l5.6-1.9a4 4 0 0 0 2.5-2.5L12 2.5z"
            fill="currentColor"
          />
        </svg>
      )}
    </span>
  );
}

/**
 * Mirrors upstream getIconTitleProps but returns a JSX orb for `icon` instead
 * of an emoji string. If the label starts with an emoji we honor it (parity
 * with upstream) and skip the orb.
 */
function getIconTitleProps(item: CardItem): {icon: ReactNode; title: string} {
  const extracted = extractLeadingEmoji(item.label);
  const title = extracted.rest.trim();
  // Author opted into a custom leading emoji -> keep it (don't override).
  if (extracted.emoji) {
    return {icon: extracted.emoji, title};
  }
  return {icon: <GradientOrb item={item} title={title} />, title};
}

function CardCategory({item}: {item: PropSidebarItemCategory}): ReactNode {
  const href = findFirstSidebarItemLink(item);
  const categoryItemsPlural = useDocCardDescriptionCategoryItemsPlural();

  // Categories without a link are filtered upfront by Docusaurus.
  if (!href) {
    return null;
  }
  return (
    <Layout
      item={item}
      className={item.className}
      href={href}
      description={item.description ?? categoryItemsPlural(item.items.length)}
      {...getIconTitleProps(item)}
    />
  );
}

function CardLink({item}: {item: PropSidebarItemLink}): ReactNode {
  const doc = useDocById(item.docId ?? undefined);
  return (
    <Layout
      item={item}
      className={item.className}
      href={item.href}
      description={item.description ?? doc?.description}
      {...getIconTitleProps(item)}
    />
  );
}

export default function DocCard({item}: Props): ReactNode {
  switch (item.type) {
    case 'link':
      return <CardLink item={item} />;
    case 'category':
      return <CardCategory item={item} />;
    default:
      throw new Error(`unknown item type ${JSON.stringify(item)}`);
  }
}
