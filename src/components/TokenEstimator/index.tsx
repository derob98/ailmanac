import React, {useState, type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

/**
 * Rough token estimator. Real tokenization is model-specific — use Anthropic's
 * count_tokens for exact numbers. This gives a feel: ~chars/4 and ~words×1.33.
 */
export default function TokenEstimator(): ReactNode {
  const [text, setText] = useState(
    translate({
      id: 'tokenest.sample',
      message: 'Paste some text here to see roughly how many tokens it is.',
    }),
  );
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const byChars = Math.round(chars / 4);
  const byWords = Math.round(words * 1.33);
  const low = Math.min(byChars, byWords);
  const high = Math.max(byChars, byWords);

  // Put the estimate in perspective: what fraction of a 200K-token context
  // window would this text occupy? Turns an abstract number into scale.
  const CTX = 200_000;
  const ratio = high / CTX;
  const fill = Math.min(1, ratio);
  const pct = ratio < 0.01 ? '<1' : Math.round(ratio * 100).toString();
  // Zone drives colour + optional overshoot pulse via CSS data-attr — the ratio
  // is derived from state, so first server render === first client render.
  const zone =
    ratio > 1 ? 'over' : ratio >= 0.8 ? 'hot' : ratio >= 0.5 ? 'warn' : 'ok';

  return (
    <div className={styles.wrap}>
      <textarea
        className={styles.area}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={translate({id: 'tokenest.aria', message: 'Text to estimate tokens for'})}
      />
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.num}>{words.toLocaleString('en-US')}</span>
          <span className={styles.cap}><Translate id="tokenest.words">words</Translate></span>
        </div>
        <div className={styles.stat}>
          <span className={styles.num}>{chars.toLocaleString('en-US')}</span>
          <span className={styles.cap}><Translate id="tokenest.chars">characters</Translate></span>
        </div>
        <div className={`${styles.stat} ${styles.primary}`}>
          <span className={styles.num}>
            ~{low.toLocaleString('en-US')}–{high.toLocaleString('en-US')}
          </span>
          <span className={styles.cap}><Translate id="tokenest.tokens">estimated tokens</Translate></span>
        </div>
      </div>
      <div
        className={styles.meter}
        data-zone={zone}
        style={{'--fill': fill} as React.CSSProperties}
        role="img"
        aria-label={translate(
          {
            id: 'tokenest.meterAria',
            message: 'Estimated {pct}% of a 200,000-token context window',
          },
          {pct},
        )}
      >
        <div className={styles.meterTrack} aria-hidden="true">
          <div className={styles.meterFill} />
          <span className={styles.meterTick} style={{'--at': 0.25} as React.CSSProperties} />
          <span className={styles.meterTick} style={{'--at': 0.5} as React.CSSProperties} />
          <span className={styles.meterTick} style={{'--at': 0.75} as React.CSSProperties} />
        </div>
        <span className={styles.meterCap}>
          <Translate id="tokenest.meterCap" values={{pct}}>
            {'≈ {pct}% of a 200K-token context window'}
          </Translate>
        </span>
      </div>
      <p className={styles.note}>
        <Translate id="tokenest.note">
          A rough feel only (~chars ÷ 4, or words × 1.33). Token counts are
          model-specific — never use another model's tokenizer. For exact numbers use
          Anthropic's token-counting endpoint.
        </Translate>
      </p>
    </div>
  );
}
