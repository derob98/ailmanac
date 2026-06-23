import React, {useEffect, useRef, useState} from 'react';
import {animate, motion, useInView, useReducedMotion} from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fade-and-rise a block into view once, on scroll. SSR-safe: framer-motion
 * renders the final markup on the server, then animates from it on mount.
 * Honors prefers-reduced-motion (renders static).
 */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}): React.ReactNode {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : {opacity: 0, y}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-80px'}}
      transition={{duration: 0.6, delay, ease: EASE}}>
      {children}
    </motion.div>
  );
}

/** Count from 0 to `to` when scrolled into view. Static under reduced motion. */
export function CountUp({
  to,
  suffix = '',
  duration = 1.3,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}): React.ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, {once: true, margin: '-40px'});
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}
