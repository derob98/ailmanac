import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useInView, useReducedMotion} from 'framer-motion';

/**
 * Scramble — an awwwards "noise → signal" reveal.
 *
 * The REAL `text` is always rendered as visible, in-flow SSR content: it is the
 * LCP / screen-reader source and never depends on JS. On enter we lay an
 * `aria-hidden` overlay on top of it and cycle its graphemes from random glyphs
 * to the final string, left-to-right (or right-to-left when document.dir is
 * "rtl", so Arabic settles in reading order).
 *
 * ── Accessibility (critical) ─────────────────────────────────────────────
 * The real text node MUST stay in the accessibility tree for the WHOLE
 * animation so a screen reader landing mid-cycle still reads the heading. We
 * therefore NEVER apply `visibility:hidden` (which removes the node from the
 * a11y tree). Instead, during animation the real text is painted with
 * `color: transparent` — it remains laid out, selectable and exposed to AT,
 * while the aria-hidden overlay (absolutely positioned over the exact same box)
 * shows the cycling glyphs. Both spans carry the same explicit white-space so
 * the overlay can never wrap differently from the reserved-width source (no
 * headline jitter on the large thesis line).
 *
 * i18n-safe: graphemes are split with Intl.Segmenter so CJK / combined glyphs
 * never shatter mid-character. Under prefers-reduced-motion we render the plain
 * final text with no overlay and no cycling.
 *
 * CLS-safe: the final string reserves the full width (it is the real, in-flow
 * node); the animated overlay is absolutely positioned over it.
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*<>/{}[]=+';

// Constrain `as` to intrinsic tags so the ref is correctly typed without an
// `any` cast and the component can never be handed a value component (which
// would silently break ref forwarding).
type IntrinsicTag = keyof React.JSX.IntrinsicElements;

function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const seg = new Intl.Segmenter(undefined, {granularity: 'grapheme'});
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function randomGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

export function Scramble({
  text,
  as = 'span',
  className,
  trigger = 'inView',
  duration = 0.9,
}: {
  text: string;
  as?: IntrinsicTag;
  className?: string;
  trigger?: 'inView' | 'mount';
  duration?: number;
}): React.ReactNode {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, {once: true, margin: '-60px'});
  const units = useMemo(() => graphemes(text), [text]);
  const [overlay, setOverlay] = useState<string | null>(null);
  const rafRef = useRef(0);

  const active = trigger === 'mount' ? true : inView;

  useEffect(() => {
    if (reduce || !active) return;
    if (typeof window === 'undefined') return;

    const rtl =
      typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const total = units.length;
    const start = performance.now();
    const durationMs = Math.max(200, duration * 1000);
    // Each grapheme finishes resolving in reading order.
    const lockSpan = durationMs * 0.55;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const out = units
        .map((g, i) => {
          // Index in reading order (RTL resolves from the visual end).
          const order = rtl ? total - 1 - i : i;
          const lockAt = (order / Math.max(1, total)) * (durationMs - lockSpan);
          if (elapsed >= lockAt + lockSpan) return g;
          if (g.trim() === '') return g; // keep whitespace stable
          return randomGlyph();
        })
        .join('');
      setOverlay(out);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOverlay(null); // hand back to the real SSR text
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduce, active, units, duration]);

  // `as` is constrained to intrinsic tags (public API) for ref-typing safety.
  // The render cast is unavoidable: a *union* of intrinsic tags has its JSX prop
  // signatures intersected to `never`, so we widen to a single concrete element
  // component type for the render.
  const Tag = as as unknown as React.FC<
    React.HTMLAttributes<HTMLElement> & {ref?: React.Ref<HTMLElement>}
  >;
  const animating = overlay !== null;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{position: 'relative', display: 'inline-block', whiteSpace: 'pre-wrap'}}>
      {/* Real, accessible, LCP-safe text — ALWAYS present and in the a11y tree.
          During animation it is painted transparent (NOT visibility:hidden, which
          would remove it from the accessibility tree). */}
      <span style={animating ? {color: 'transparent'} : undefined}>{text}</span>
      {animating && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            whiteSpace: 'pre-wrap',
            // The amber "settling" flash; tokenized so callers can theme it.
            color: 'var(--ail-scramble-flash, inherit)',
          }}>
          {overlay}
        </span>
      )}
    </Tag>
  );
}

export default Scramble;
