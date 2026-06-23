import React, {useState, type ReactNode} from 'react';
import styles from './styles.module.css';

type Guardrail = {id: string; label: string; line: string};

const GUARDRAILS: Guardrail[] = [
  {id: 'tests', label: 'Run tests before declaring a task done', line: 'Run the tests before saying a task is complete.'},
  {id: 'secrets', label: 'Never commit secrets / .env files', line: 'Never commit secrets, API keys, or .env files.'},
  {id: 'scope', label: "Stay within the requested scope", line: 'Stay within the requested scope; flag related issues instead of fixing them unprompted.'},
  {id: 'existing', label: 'Prefer editing existing files over new ones', line: 'Prefer editing existing files; avoid creating new files unless necessary.'},
  {id: 'deps', label: 'Ask before adding new dependencies', line: 'Ask before adding a new dependency; prefer the standard library and what is already installed.'},
  {id: 'comments', label: "Don't add comments unless asked", line: "Don't add explanatory comments unless asked; prefer clear names and small functions."},
  {id: 'generated', label: "Don't edit generated/vendor code", line: "Don't edit files under /generated, /vendor, /dist, or other build output."},
  {id: 'size', label: 'Keep files small (split > ~300 lines)', line: 'Keep files focused; split when they grow past ~300 lines.'},
  {id: 'lint', label: 'Lint/format must pass before commit', line: 'Run lint and formatter before committing; both must pass.'},
  {id: 'commits', label: 'Use Conventional Commits', line: 'Use Conventional Commits (feat:, fix:, refactor:, docs:, chore:, test:).'},
  {id: 'plan', label: 'Plan before large/risky changes', line: 'For large or risky changes, propose a plan before editing.'},
];

type Preset = {
  id: string;
  label: string;
  stack: string;
  framework?: string;
  install: string;
  run: string;
  test: string;
  lint: string;
  conventions: string;
  guards: string[];
};

// Sensible, opinionated defaults per stack. Tweak after generating — Claude
// follows CLAUDE.md literally, so only keep what's actually true of your project.
const PRESETS: Preset[] = [
  {
    id: 'nextts',
    label: 'Next.js + TS',
    stack: 'TypeScript, Node 20',
    framework: 'Next.js 14 (App Router)',
    install: 'npm install',
    run: 'npm run dev',
    test: 'npm test',
    lint: 'npm run lint',
    conventions: 'Server Components by default; add "use client" only when needed\nTailwind for styling\nCo-locate tests as *.test.ts\nUse the app/ directory and route handlers, not pages/api',
    guards: ['tests', 'secrets', 'scope', 'existing', 'lint', 'commits'],
  },
  {
    id: 'fastapi',
    label: 'Python + FastAPI',
    stack: 'Python 3.12',
    framework: 'FastAPI',
    install: 'pip install -r requirements.txt',
    run: 'uvicorn app.main:app --reload',
    test: 'pytest',
    lint: 'ruff check . && ruff format .',
    conventions: 'Type hints on every function\nPydantic models for request/response\nUse pathlib over os.path\nf-strings, never % or .format()',
    guards: ['tests', 'secrets', 'scope', 'deps', 'lint', 'commits'],
  },
  {
    id: 'django',
    label: 'Django',
    stack: 'Python 3.12',
    framework: 'Django 5',
    install: 'pip install -r requirements.txt',
    run: 'python manage.py runserver',
    test: 'python manage.py test',
    lint: 'ruff check .',
    conventions: 'Fat models, thin views\nUse the ORM; avoid raw SQL\nNever edit applied migrations\nKeep settings split per environment',
    guards: ['tests', 'secrets', 'scope', 'existing', 'commits'],
  },
  {
    id: 'expo',
    label: 'Expo / RN',
    stack: 'TypeScript',
    framework: 'Expo (React Native)',
    install: 'npm install',
    run: 'npx expo start',
    test: 'jest',
    lint: 'eslint .',
    conventions: 'Functional components + hooks only\nUse Expo Router for navigation\nKeep platform-specific code in *.ios / *.android files',
    guards: ['tests', 'secrets', 'scope', 'existing', 'lint'],
  },
  {
    id: 'node',
    label: 'Node API',
    stack: 'TypeScript, Node 20',
    framework: 'Fastify',
    install: 'npm install',
    run: 'npm run dev',
    test: 'vitest',
    lint: 'npm run lint',
    conventions: 'Validate input at the edge (zod)\nNo console.log in committed code — use the logger\nAsync/await, never raw callbacks',
    guards: ['tests', 'secrets', 'scope', 'deps', 'lint', 'commits'],
  },
  {
    id: 'go',
    label: 'Go',
    stack: 'Go 1.22',
    framework: '',
    install: 'go mod download',
    run: 'go run ./...',
    test: 'go test ./...',
    lint: 'golangci-lint run',
    conventions: 'Return errors, never panic in library code\nTable-driven tests\nKeep packages small and cohesive\ngofmt is the law',
    guards: ['tests', 'secrets', 'scope', 'lint'],
  },
  {
    id: 'rust',
    label: 'Rust',
    stack: 'Rust (stable)',
    framework: '',
    install: 'cargo build',
    run: 'cargo run',
    test: 'cargo test',
    lint: 'cargo clippy -- -D warnings',
    conventions: 'Prefer Result over unwrap/expect in library code\nRun cargo fmt before committing\nDocument public items with ///',
    guards: ['tests', 'secrets', 'scope', 'lint'],
  },
  {
    id: 'static',
    label: 'Static site',
    stack: 'HTML / CSS / vanilla JS',
    framework: '',
    install: '(no build step)',
    run: 'open index.html',
    test: '',
    lint: '',
    conventions: 'Mobile-first, responsive\nNo frameworks, no build step\nKeep it a single self-contained file where possible',
    guards: ['secrets', 'scope', 'existing'],
  },
];

export default function ClaudeMdGenerator(): ReactNode {
  const [name, setName] = useState('');
  const [what, setWhat] = useState('');
  const [stack, setStack] = useState('');
  const [framework, setFramework] = useState('');
  const [install, setInstall] = useState('');
  const [run, setRun] = useState('');
  const [test, setTest] = useState('');
  const [lint, setLint] = useState('');
  const [conventions, setConventions] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({tests: true, secrets: true, scope: true});
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('');

  const applyPreset = (p: Preset) => {
    setStack(p.stack);
    setFramework(p.framework ?? '');
    setInstall(p.install);
    setRun(p.run);
    setTest(p.test);
    setLint(p.lint);
    setConventions(p.conventions);
    setChecked(Object.fromEntries(p.guards.map((g) => [g, true])));
    setActivePreset(p.id);
  };

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
  lines.push(`- Install: ${'`'}${install.trim() || '<cmd>'}${'`'}`);
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
  const lineCount = output.split('\n').length;

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
      <div className={styles.presetRow} role="group" aria-label="Start from a stack preset">
        <span className={styles.presetHint}>Start from a stack:</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={activePreset === p.id ? styles.presetActive : styles.preset}
            onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {field('Project name', name, setName, 'acme-web')}
        {field('Tech stack', stack, setStack, 'TypeScript, Node 20')}
        {field('Framework (optional)', framework, setFramework, 'Next.js 14 App Router')}
        {field('Install command', install, setInstall, 'npm install')}
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
        <textarea className={styles.area} rows={4} value={conventions} placeholder={'Functional components only\nCo-locate tests as *.test.ts\nConventional Commits'} onChange={(e) => setConventions(e.target.value)} />
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
        <span>CLAUDE.md <span className={styles.count}>· {lineCount} lines</span></span>
        <div className={styles.actions}>
          <button className={styles.btn} type="button" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
          <button className={styles.btn} type="button" onClick={download}>Download</button>
        </div>
      </div>
      <pre className={styles.out}>{output}</pre>
    </div>
  );
}
