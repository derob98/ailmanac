import React, {useState, useRef, useCallback, type ReactNode} from 'react';
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

  const copy = useCallback(async () => {
    // Read + encode the prompt ONLY in the handler, never during render.
    const text = toText(children).replace(/^\n+|\s+$/g, '');
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
  }, [children]);

  const openInClaude = useCallback(() => {
    const text = toText(children).replace(/^\n+|\s+$/g, '');
    const url = `https://claude.ai/new?q=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [children]);

  return (
    <section className={styles.card} aria-label={title ? `Prompt: ${title}` : 'Prompt'}>
      <div className={styles.head}>
        <div className={styles.heading}>
          <span className={styles.spark} aria-hidden="true">✦</span>
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
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            onClick={openInClaude}
            aria-label="Open this prompt in Claude in a new tab"
          >
            Open in Claude ↗
          </button>
        </div>
      </div>
      <pre className={styles.prompt}>{toText(children).replace(/^\n+|\s+$/g, '')}</pre>
    </section>
  );
}
