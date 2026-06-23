import {useEffect} from 'react';
import {useReducedMotion} from 'framer-motion';

/**
 * Buttery inertial scrolling via Lenis. Lazily imported inside the effect so
 * the Docusaurus SSR build never evaluates Lenis (which touches `window`).
 * Disabled entirely under prefers-reduced-motion.
 */
export function useSmoothScroll(): void {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    let lenis: {raf: (t: number) => void; destroy: () => void} | undefined;
    let raf = 0;
    let cancelled = false;

    import('lenis').then(({default: Lenis}) => {
      if (cancelled) return;
      lenis = new Lenis({lerp: 0.1, smoothWheel: true, wheelMultiplier: 1});
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [reduce]);
}
