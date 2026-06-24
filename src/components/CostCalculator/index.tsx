import React, {useState, type ReactNode} from 'react';
import styles from './styles.module.css';

const n = (v: string) => {
  const x = parseFloat(v);
  return isFinite(x) && x >= 0 ? x : 0;
};
const money = (x: number) =>
  x.toLocaleString('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: x < 10 ? 4 : 2});

export default function CostCalculator(): ReactNode {
  const [inTok, setInTok] = useState('1500');
  const [outTok, setOutTok] = useState('400');
  const [reqs, setReqs] = useState('10000');
  const [inPrice, setInPrice] = useState('3');
  const [outPrice, setOutPrice] = useState('15');
  const [cachePct, setCachePct] = useState('0');

  const inputTokens = n(inTok);
  const outputTokens = n(outTok);
  const requests = n(reqs);
  const pIn = n(inPrice);
  const pOut = n(outPrice);
  const cached = Math.min(100, n(cachePct)) / 100;

  const mInput = inputTokens * requests;
  const mOutput = outputTokens * requests;

  // Cached input read assumed ~10% of input price (model-dependent — illustrative).
  const cachedInputCost = (mInput * cached) / 1e6 * pIn * 0.1;
  const freshInputCost = (mInput * (1 - cached)) / 1e6 * pIn;
  const outputCost = mOutput / 1e6 * pOut;

  const baseInputCost = mInput / 1e6 * pIn;
  const total = freshInputCost + cachedInputCost + outputCost;
  const baseline = baseInputCost + outputCost;
  const savings = baseline - total;

  const field = (label: string, value: string, set: (v: string) => void, suffix?: string) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.inputRow}>
        <input className={styles.input} inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
    </label>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {field('Input tokens / request', inTok, setInTok)}
        {field('Output tokens / request', outTok, setOutTok)}
        {field('Requests / month', reqs, setReqs)}
        {field('Input price', inPrice, setInPrice, '$ / 1M tok')}
        {field('Output price', outPrice, setOutPrice, '$ / 1M tok')}
        {field('Cached input', cachePct, setCachePct, '% of prefix')}
      </div>

      <div className={styles.result}>
        <div className={styles.big}>
          <span className={styles.num}>{money(total)}</span>
          <span className={styles.cap}>estimated / month</span>
        </div>
        <table className={styles.table}>
          <tbody>
            <tr><td>Input (fresh)</td><td>{money(freshInputCost)}</td></tr>
            {cached > 0 && <tr><td>Input (cached read ≈ 0.1×)</td><td>{money(cachedInputCost)}</td></tr>}
            <tr><td>Output</td><td>{money(outputCost)}</td></tr>
            {cached > 0 && (
              <tr className={styles.save}><td>Saved vs no caching</td><td>{money(savings)}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={styles.note}>
        Enter the <strong>current</strong> per-million-token prices from the official
        pricing page (we don't hard-code them — they change). The cached-read rate is
        model-dependent (~0.1× input here is illustrative). Estimate only — verify with{' '}
        Anthropic's token counting and pricing.
      </p>
    </div>
  );
}
