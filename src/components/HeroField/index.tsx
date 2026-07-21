import React, {useEffect, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Hero WebGL entry point — "The Almanac Field".
 *
 * The heavy three.js / R3F code lives in ./FieldCanvas and is require()d lazily
 * inside BrowserOnly, so the Docusaurus server build never touches
 * window/WebGL. The CSS .mesh + .aurora layers sit behind this one and are a
 * complete backdrop on their own, which is what no-JS visitors and anyone on
 * save-data mode get.
 *
 * SSR GUARDRAIL: never import ./FieldCanvas outside the BrowserOnly children
 * function, and never hoist its matchMedia/navigator/WebGL probes to module
 * scope — either would evaluate during the Node prerender.
 *
 * The mount is deferred to idle so parsing ~180KB of three.js lands outside the
 * window that Lighthouse measures for TBT, and never competes with the hero
 * headline (the LCP element, which is plain server-rendered text).
 */

function DeferredField(): React.ReactNode {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ric: typeof window.requestIdleCallback | undefined =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback.bind(window)
        : undefined;
    let idleId = 0;
    let timeoutId = 0;
    if (ric) {
      idleId = ric(() => setReady(true), {timeout: 1200});
    } else {
      timeoutId = window.setTimeout(() => setReady(true), 260);
    }
    return () => {
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) return null;
  const FieldCanvas = require('./FieldCanvas').default;
  return <FieldCanvas />;
}

/**
 * If WebGL throws mid-scene (driver loss, blocked context, a shader an old GPU
 * refuses), swallow it and fall back to the CSS backdrop rather than taking the
 * whole homepage down with it.
 */
class FieldBoundary extends React.Component<
  {children: React.ReactNode},
  {failed: boolean}
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {failed: false};
  }
  static getDerivedStateFromError() {
    return {failed: true};
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export default function HeroField(): React.ReactNode {
  return (
    <BrowserOnly fallback={<span aria-hidden="true" />}>
      {() => (
        <FieldBoundary>
          <DeferredField />
        </FieldBoundary>
      )}
    </BrowserOnly>
  );
}
