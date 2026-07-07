/**
 * ReadingProgress — a quiet, brand-tinted bar pinned to the top edge of the
 * viewport that fills left→right as the reader scrolls through a docs page.
 *
 * It gives long lessons a legible sense of "how far in am I / how much is
 * left" on top of the native scrollbar, without any layout cost.
 *
 * Where it mounts:
 *  - Injected once via the DocItem/Layout swizzle, so it renders ONLY on docs
 *    pages — never on the design-frozen homepage. No route-guarding needed.
 *
 * Safety / constraints (matches the repo's hard rules):
 *  - GPU-friendly: progress is driven by `transform: scaleX()` (compositor
 *    only), never `width` — no layout/paint per scroll frame.
 *  - Hydration-safe: SSR renders a static scaleX(0) bar; the real value is set
 *    in a post-mount effect. No Date.now()/Math.random()/new Date() in render.
 *  - Reduced motion: honoured — under `reduce` we skip the smoothing tween in
 *    CSS; the bar still tracks scroll (that IS its function), just without ease.
 *  - RTL: the fill origin flips to the inline-start (right) edge in CSS.
 *  - Accessibility: decorative supplement to the scrollbar, so aria-hidden —
 *    updating aria-valuenow on every scroll frame would spam assistive tech.
 *  - 320px: a fixed, height-only bar adds no horizontal extent — no overflow.
 */

import React, {useEffect, useRef} from 'react';

export default function ReadingProgress(): React.JSX.Element {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      // Total scrollable distance; guard the divide-by-zero on short pages.
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const progress = scrollable > 0 ? doc.scrollTop / scrollable : 0;
      // Clamp defensively (elastic/overscroll can push slightly out of range).
      const clamped = progress < 0 ? 0 : progress > 1 ? 1 : progress;
      bar.style.transform = `scaleX(${clamped})`;
    };

    // Coalesce bursts of scroll/resize events into one paint via rAF.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update(); // set the real value immediately after mount
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule, {passive: true});

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div className="ailmanac-reading-progress" aria-hidden="true">
      <div className="ailmanac-reading-progress__bar" ref={barRef} />
    </div>
  );
}
