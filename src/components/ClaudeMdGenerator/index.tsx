import React, {useState, type ReactNode} from 'react';
import styles from './styles.module.css';

type Guardrail = {id: string; label: string; line: string};

const GUARDRAILS: Guardrail[] = [
  {id: 'tests', label: 'Run tests before declaring a task done', line: 'Run the tests before saying a task is complete.'},
  {id: 'secrets', label: 'Never commit secrets / .env files', line: 'Never commit secrets, API keys, or .env files.'},
  {id: 'generated', label: "Don't edit generated/vendor code", line: "Don't edit files under /generated, /vendor, or /dist."},
  {id: 'size', label: 'Keep files small (split > ~300 lines)', line: 'Keep files focused; split when they grow past ~300 lines.'},
  {id: 'lint', label: 'Lint/format must pass before commit', line: 'Run lint and formatter before committing; both must pass.'},
  {id: 'plan', label: 'Plan before large/risky changes', line: 'For large or risky changes, propose a plan before editing.'},
];

export default function ClaudeMdGenerator(): ReactNode {
  const [name, setName] = useState('');
  const [what, setWhat] = useState('');
  const [stack, setStack] = useState('');
  const [framework, setFramework] = useState('');
  const [run, setRun] = useState('');
  const [test, setTest] = useState('');
  const [lint, setLint] = useState('');
  const [conventions, setConventions] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({tests: true, secrets: true});
  const [copied, setCopied] = useState(false);

  const lines: string[] = [];
  lines.push(`# Project: ${name.trim() || '<name>'}`);
  lines.push('');
  lines.push('## What this is');
  lines.push(what.trim() || '<One or two sentences: what the project does and who uses it.>');
  lines.push('');
  lines.push('## Tech stack');
  lines.push(`- Language / runtime: ${stack.trim() || '<e.g. TypeScript, Node 20>'}`);
  if (framework.trim()) lines.push(`- Framework: ${framework.trim()}`);
  lines.push('');
  lines.push('## How to run');
  lines.push(`- Install: ${'`'}${'<cmd>'}${'`'}`);
  if (run.trim()) lines.push(`- Dev: ${'`'}${run.trim()}${'`'}`);
  if (test.trim()) lines.push(`- Test: ${'`'}${test.trim()}${'`'}`);
  if (lint.trim()) lines.push(`- Lint / format: ${'`'}${lint.trim()}${'`'}`);
  lines.push('');
  if (conventions.trim()) {
    lines.push('## Conventions');
    conventions
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(`- ${l}`));
    lines.push('');
  }
  const activeGuards = GUARDRAILS.filter((g) => checked[g.id]);
  if (activeGuards.length) {
    lines.push('## Guardrails');
    activeGuards.forEach((g) => lines.push(`- ${g.line}`));
    lines.push('');
  }
  const output = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

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
    const blob = new Blob([output], {type: 'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CLAUDE.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const field = (label: string, value: string, set: (v: string) => void, ph: string) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} value={value} placeholder={ph} onChange={(e) => set(e.target.value)} />
    </label>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {field('Project name', name, setName, 'acme-web')}
        {field('Tech stack', stack, setStack, 'TypeScript, Node 20')}
        {field('Framework (optional)', framework, setFramework, 'Next.js 14 App Router')}
        {field('Dev command', run, setRun, 'npm run dev')}
        {field('Test command', test, setTest, 'npm test')}
        {field('Lint / format', lint, setLint, 'npm run lint')}
      </div>
      <label className={styles.field}>
        <span className={styles.label}>What this is</span>
        <textarea className={styles.area} rows={2} value={what} placeholder="A scheduling app for clinics; used by front-desk staff." onChange={(e) => setWhat(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Conventions (one per line)</span>
        <textarea className={styles.area} rows={3} value={conventions} placeholder={'Functional components only\nCo-locate tests as *.test.ts\nConventional Commits'} onChange={(e) => setConventions(e.target.value)} />
      </label>
      <fieldset className={styles.guards}>
        <legend className={styles.label}>Guardrails</legend>
        {GUARDRAILS.map((g) => (
          <label key={g.id} className={styles.check}>
            <input
              type="checkbox"
              checked={!!checked[g.id]}
              onChange={(e) => setChecked((c) => ({...c, [g.id]: e.target.checked}))}
            />
            {g.label}
          </label>
        ))}
      </fieldset>
      <div className={styles.outHead}>
        <span>CLAUDE.md</span>
        <div className={styles.actions}>
          <button className={styles.btn} type="button" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
          <button className={styles.btn} type="button" onClick={download}>Download</button>
        </div>
      </div>
      <pre className={styles.out}>{output}</pre>
    </div>
  );
}
