import React, {useState, type ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Rough token estimator. Real tokenization is model-specific — use Anthropic's
 * count_tokens for exact numbers. This gives a feel: ~chars/4 and ~words×1.33.
 */
export default function TokenEstimator(): ReactNode {
  const [text, setText] = useState(
    'Paste some text here to see roughly how many tokens it is.',
  );
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const byChars = Math.round(chars / 4);
  const byWords = Math.round(words * 1.33);
  const low = Math.min(byChars, byWords);
  const high = Math.max(byChars, byWords);

  return (
    <div className={styles.wrap}>
      <textarea
        className={styles.area}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Text to estimate tokens for"
      />
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.num}>{words.toLocaleString()}</span>
          <span className={styles.cap}>words</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.num}>{chars.toLocaleString()}</span>
          <span className={styles.cap}>characters</span>
        </div>
        <div className={`${styles.stat} ${styles.primary}`}>
          <span className={styles.num}>
            ~{low.toLocaleString()}–{high.toLocaleString()}
          </span>
          <span className={styles.cap}>estimated tokens</span>
        </div>
      </div>
      <p className={styles.note}>
        A rough feel only (~chars ÷ 4, or words × 1.33). Token counts are
        model-specific — never use another model's tokenizer. For exact numbers
        use Anthropic's token-counting endpoint.
      </p>
    </div>
  );
}
