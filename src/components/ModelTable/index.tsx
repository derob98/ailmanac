import React, {type ReactNode} from 'react';
import data from '@site/data/models.json';
import styles from './styles.module.css';

type Model = {
  name: string;
  id: string;
  tier: string;
  bestFor: string;
};

/**
 * Renders the single source of truth for current Claude models from
 * data/models.json, with a visible "last verified" stamp. No model fact should
 * ever be hard-coded in prose — link here instead. Pricing and context limits
 * are intentionally NOT shown: they change often, so we point to the official
 * pages rather than risk stale numbers.
 */
export default function ModelTable(): ReactNode {
  const models = (data.models ?? []) as Model[];
  return (
    <div className={styles.wrap}>
      <p className={styles.stamp}>
        <span aria-hidden="true">✅</span> <strong>Last verified:</strong>{' '}
        {data.lastVerified} ·{' '}
        <a href={data.source} target="_blank" rel="noreferrer">
          Official models &amp; pricing
        </a>
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Model</th>
            <th>API model ID</th>
            <th>Tier</th>
            <th>Best for</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.id}>
              <td>
                <strong>{m.name}</strong>
              </td>
              <td>
                <code>{m.id}</code>
              </td>
              <td>{m.tier}</td>
              <td>{m.bestFor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>{data.note}</p>
    </div>
  );
}
