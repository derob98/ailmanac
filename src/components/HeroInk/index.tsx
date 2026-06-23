import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * v3 hero accent — "ink word + constellation".
 *
 * A deliberately *light* WebGL layer that replaces the heavier shipped
 * distorted-icosahedron hero: a particle flow-field "ink" whose points are
 * SEEDED into the shape of the "AI" glyph (no CSS mask cross-reference — the
 * clipping lives in the geometry, so it renders identically in every engine),
 * plus a self-drawing constellation-line layer behind the headline. Both layers
 * share ONE WebGL context / one frameloop.
 *
 * The heavy three.js / R3F code lives in ./InkCanvas and is `require()`d lazily
 * inside BrowserOnly so the Docusaurus server build never touches
 * `window`/WebGL (SSR-safety). A transparent fallback keeps the CSS `.mesh`
 * gradient visible during load and for no-JS visitors. Mirrors the existing
 * Hero3D pattern exactly.
 *
 * SSR GUARDRAIL: never import ./InkCanvas outside this BrowserOnly children
 * function, and never hoist its matchMedia/navigator/CSS/three probes to module
 * scope — either would evaluate window/WebGL during the Node prerender.
 */
export default function HeroInk(): React.ReactNode {
  return (
    <BrowserOnly fallback={<span aria-hidden="true" />}>
      {() => {
        const InkCanvas = require('./InkCanvas').default;
        return <InkCanvas />;
      }}
    </BrowserOnly>
  );
}
