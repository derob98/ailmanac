import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Renders the WebGL hero scene on the client only. The heavy three.js/drei
 * code lives in ./HeroCanvas and is required lazily inside BrowserOnly so the
 * server build never touches `window`/WebGL. A transparent fallback keeps the
 * CSS mesh gradient visible during load and for no-JS visitors.
 */
export default function Hero3D(): React.ReactNode {
  return (
    <BrowserOnly fallback={<span aria-hidden="true" />}>
      {() => {
        const HeroCanvas = require('./HeroCanvas').default;
        return <HeroCanvas />;
      }}
    </BrowserOnly>
  );
}
