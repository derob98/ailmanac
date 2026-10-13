#!/usr/bin/env node
// Keep README.md honest: recompute the numbers it quotes and the list of
// recently added pages from the repository itself, then rewrite the two
// marked blocks. Everything else in the README is hand-written and untouched.
//
// Run: node scripts/build-readme.mjs
// Blocks: <!-- stats:start --> … <!-- stats:end -->
//         <!-- fresh:start --> … <!-- fresh:end -->

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SITE = 'https://derob98.github.io/ailmanac';
const FRESH_MAX = 8; // newest pages to list
const INTERACTIVE = /<(Quiz|Steps|Callout|PromptCard|Flashcards)\b/;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const field = (raw, key) => {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  const m = fm && fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};

// Same routing rule as build-llms-txt.mjs: index.* maps to its folder.
const urlFor = (rel) =>
  `${SITE}/docs/${rel.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '')}`.replace(/\/$/, '');

const pages = walk(DOCS).map((file) => {
  const raw = readFileSync(file, 'utf8');
  return {
    rel: file.slice(DOCS.length + 1),
    title: field(raw, 'title'),
    interactive: INTERACTIVE.test(raw),
    verified: [...raw.matchAll(/lastVerified="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort().pop(),
  };
});

const today = new Date();
const daysAgo = (iso) => (today - new Date(`${iso}T00:00:00Z`)) / 86_400_000;
const locales = existsSync(join(ROOT, 'i18n'))
  ? readdirSync(join(ROOT, 'i18n'), { withFileTypes: true }).filter((e) => e.isDirectory()).length + 1
  : 1;
const stats = {
  pages: pages.length,
  interactive: pages.filter((p) => p.interactive).length,
  locales,
  verified30: pages.filter((p) => p.verified && daysAgo(p.verified) <= 30).length,
};

// When each page was first committed (newest first). `git log` prints the
// commit date, then the files that commit added.
const log = execFileSync(
  'git',
  ['log', '--diff-filter=A', '--format=@%ad', '--date=short', '--name-only', '--', 'docs'],
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
const added = new Map();
let date = '';
for (const line of log.split('\n')) {
  if (line.startsWith('@')) date = line.slice(1);
  else if (line.startsWith('docs/') && !added.has(line)) added.set(line, date);
}
const fresh = pages
  .filter((p) => p.title && added.has(`docs/${p.rel}`) && !/(^|\/)index\.mdx?$/.test(p.rel))
  .map((p) => ({ ...p, added: added.get(`docs/${p.rel}`) }))
  .sort((a, b) => b.added.localeCompare(a.added) || a.title.localeCompare(b.title))
  .slice(0, FRESH_MAX);

const statsBlock =
  `**${stats.pages} pages** · **${stats.interactive} interactive lessons** · ` +
  `**${stats.locales} languages** · **${stats.verified30} pages re-verified in the last 30 days**`;
const freshBlock = fresh
  .map((p) => `- ${p.added} — [${p.title}](${urlFor(p.rel)})`)
  .join('\n');

const replaceBlock = (text, name, body) => {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(text)) throw new Error(`README.md is missing the ${name} block markers`);
  return text.replace(re, `$1\n${body}\n$2`);
};

const readme = join(ROOT, 'README.md');
let text = readFileSync(readme, 'utf8');
text = replaceBlock(text, 'stats', statsBlock);
text = replaceBlock(text, 'fresh', freshBlock);
writeFileSync(readme, text);
console.log(`README.md: ${statsBlock.replace(/\*\*/g, '')}`);
console.log(`README.md: listed ${fresh.length} newest pages (latest ${fresh[0]?.added ?? 'n/a'}).`);
