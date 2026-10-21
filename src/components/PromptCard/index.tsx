import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {translate} from '@docusaurus/Translate';
import {CheckIcon, SparkleIcon} from '@site/src/components/icons';
import styles from './styles.module.css';

type PromptCardProps = {
  /** Optional heading shown above the prompt. */
  title?: string;
  /** The prompt text. Pass as children, e.g. {`...`}. */
  children: ReactNode;
};

/** Flatten children to a plain string so we can copy / URL-encode it. */
function toText(node: ReactNode): string {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(toText).join('');
  // Single React element with children (e.g. nested fragments) — recurse.
  if (typeof node === 'object' && 'props' in (node as any)) {
    return toText((node as any).props?.children);
  }
  return '';
}

export default function PromptCard({title, children}: PromptCardProps): ReactNode {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLPreElement>(null);
  /**
   * Whether the prompt body is taller than its capped viewport. Starts false
   * on BOTH the server render and the first client render, then is measured in
   * an effect — so there is no hydration mismatch (React #418), only a
   * post-mount upgrade.
   */
  const [scrollable, setScrollable] = useState(false);

  /**
   * The prompt as plain text, flattened once. Pure and deterministic, so the
   * Node render and the first browser render produce the same string — the
   * clipboard write, the claude.ai URL and the rendered body all read from it.
   */
  const text = useMemo(
    () => toText(children).replace(/^\n+|\s+$/g, ''),
    [children],
  );

  /**
   * A clipped prompt must (a) say so and (b) be reachable without a mouse.
   * The CSS paints an edge shadow on its own once the box overflows; this adds
   * the keyboard tab stop (WCAG 2.1.1) only when there is actually something
   * to scroll, so the 460-odd short prompt cards add no tab-order noise.
   * Re-measured on resize because every narrower viewport re-wraps the lines.
   */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setScrollable(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older / insecure contexts.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      } catch {
        return; // give up silently — never throw from a click handler
      }
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [text]);

  // Never leave a pending timer behind when the page navigates away.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const openInClaude = useCallback(() => {
    const url = `https://claude.ai/new?q=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [text]);

  return (
    <section
      className={styles.card}
      data-copied={copied ? 'true' : undefined}
      aria-label={title ? `Prompt: ${title}` : 'Prompt'}
    >
      <div className={styles.head}>
        <div className={styles.heading}>
          <span className={styles.spark} aria-hidden="true">
            <SparkleIcon className={styles.sparkIcon} />
          </span>
          {title ? (
            <h4 className={styles.title}>{title}</h4>
          ) : (
            <span className={styles.kicker}>Prompt</span>
          )}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${copied ? styles.copied : ''}`}
            onClick={copy}
            aria-label={copied ? 'Prompt copied to clipboard' : 'Copy prompt to clipboard'}
          >
            {/* Both labels stay mounted and stacked in one grid cell, so the
                button's width is the WIDER of the two from the start: the
                "Copy" → "Copied!" swap cross-fades in place instead of
                reflowing the whole actions row. Both are decorative here —
                the button's aria-label carries the state for screen readers,
                and it overrides this subtree's text entirely. */}
            <span className={styles.swap} aria-hidden="true">
              <span className={styles.swapIdle}>Copy</span>
              <span className={styles.swapDone}>
                <CheckIcon className={styles.btnIcon} />
                Copied!
              </span>
            </span>
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={openInClaude}
            aria-label="Open this prompt in Claude in a new tab"
          >
            Open in Claude<span className={styles.openArrow} aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
      {/* The body is capped in height, so a long prompt scrolls. When it does,
          it becomes a labelled, focusable scroll region; when it doesn't, it
          stays an inert <pre> with no role and no tab stop. */}
      <pre
        ref={bodyRef}
        className={styles.prompt}
        tabIndex={scrollable ? 0 : undefined}
        role={scrollable ? 'group' : undefined}
        aria-label={
          scrollable
            ? translate({
                id: 'promptCard.scrollableLabel',
                message: 'Scrollable prompt text',
                description:
                  'aria-label for a long prompt body that scrolls inside its own box',
              })
            : undefined
        }
      >
        {text}
      </pre>
    </section>
  );
}
