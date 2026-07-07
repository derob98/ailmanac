/**
 * Swizzled @theme/DocItem/Layout — AILmanac wrapping override.
 *
 * This is a *wrapping* swizzle: it renders the upstream DocItem/Layout exactly
 * as-is and only ADDS a sibling — the docs reading-progress bar. Because it
 * defers 100% of the real layout to `@theme-original`, it stays compatible with
 * theme-classic updates and touches none of the doc render chain.
 *
 * Why here: DocItem/Layout renders for every individual docs page and NOTHING
 * else (not the homepage, not blog, not 404), so mounting <ReadingProgress/>
 * here scopes the affordance to docs by construction — no route guards.
 *
 * Safety: ReadingProgress is hydration-safe, GPU-only, reduced-motion aware,
 * RTL-aware, and adds no horizontal extent (see its header). Removing it would
 * fall back to stock behavior with zero breakage.
 */

import React, {type ReactNode} from 'react';
import Layout from '@theme-original/DocItem/Layout';
import type LayoutType from '@theme/DocItem/Layout';
import type {WrapperProps} from '@docusaurus/types';
import ReadingProgress from '@site/src/components/ReadingProgress';

type Props = WrapperProps<typeof LayoutType>;

export default function LayoutWrapper(props: Props): ReactNode {
  return (
    <>
      <ReadingProgress />
      <Layout {...props} />
    </>
  );
}
