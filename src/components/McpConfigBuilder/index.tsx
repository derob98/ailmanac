import React, {useState, type ReactNode} from 'react';
import {CheckIcon} from '@site/src/components/icons';
import styles from './styles.module.css';

type Server = {
  id: string;
  label: string;
  note?: string;
  entry: Record<string, unknown>;
};

// Illustrative starters. Package names and availability evolve — verify at
// modelcontextprotocol.io and the official Claude Code MCP docs.
const SERVERS: Server[] = [
  {id: 'github', label: 'GitHub', note: 'needs a token', entry: {command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], env: {GITHUB_TOKEN: '${GITHUB_TOKEN}'}}},
  {id: 'postgres', label: 'PostgreSQL', note: 'needs a DB URL', entry: {command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres', '${DATABASE_URL}']}},
  {id: 'filesystem', label: 'Filesystem', note: 'scope to a dir', entry: {command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/dir']}},
  {id: 'memory', label: 'Memory', entry: {command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory']}},
  {id: 'puppeteer', label: 'Browser (Puppeteer)', entry: {command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer']}},
  {id: 'slack', label: 'Slack', note: 'needs tokens', entry: {command: 'npx', args: ['-y', '@modelcontextprotocol/server-slack'], env: {SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}', SLACK_TEAM_ID: '${SLACK_TEAM_ID}'}}},
  {id: 'custom', label: 'Custom (stdio)', note: 'your own server', entry: {command: 'node', args: ['path/to/your/server.js']}},
];

export default function McpConfigBuilder(): ReactNode {
  const [on, setOn] = useState<Record<string, boolean>>({github: true});
  const [copied, setCopied] = useState(false);

  const selected = SERVERS.filter((s) => on[s.id]);
  const mcpServers: Record<string, unknown> = {};
  selected.forEach((s) => {
    mcpServers[s.id === 'custom' ? 'my-server' : s.id] = s.entry;
  });
  const output = JSON.stringify({mcpServers}, null, 2) + '\n';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  const download = () => {
    const blob = new Blob([output], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.mcp.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.options}>
        {SERVERS.map((s) => (
          <label key={s.id} className={`${styles.opt} ${on[s.id] ? styles.active : ''}`}>
            <input type="checkbox" checked={!!on[s.id]} onChange={(e) => setOn((o) => ({...o, [s.id]: e.target.checked}))} />
            <span>{s.label}{s.note && <em className={styles.note}> · {s.note}</em>}</span>
          </label>
        ))}
      </div>
      <div className={styles.outHead}>
        <span>.mcp.json</span>
        <div className={styles.actions}>
          <button className={styles.btn} type="button" onClick={copy} data-copied={copied ? 'true' : undefined}>
            {copied ? (
              <>
                <CheckIcon className={styles.btnIcon} />
                Copied
              </>
            ) : (
              'Copy'
            )}
          </button>
          <button className={styles.btn} type="button" onClick={download}>Download</button>
        </div>
      </div>
      <pre className={styles.out}>{output}</pre>
      <p className={styles.warn}>
        Replace <code>{'${...}'}</code> placeholders with env vars (never hard-code secrets), and confirm each
        package exists at modelcontextprotocol.io. Only connect servers you trust.
      </p>
    </div>
  );
}
