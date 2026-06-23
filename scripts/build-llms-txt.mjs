#!/usr/bin/env node
// Generate static/llms.txt — a machine-readable index of the whole site,
// following the emerging llms.txt convention (https://llmstxt.org/).
// One concise entry per English docs page, grouped by section, so that
// AI agents and crawlers can discover and cite AILmanac's content.
//
// Run: node scripts/build-llms-txt.mjs
// Output: static/llms.txt (served at https://derob98.github.io/ailmanac/llms.txt)

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SITE = 'https://derob98.github.io/ailmanac';

// Minimal frontmatter reader (title/description/sidebar_position only).
function frontmatter(file) {
  const raw = readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, '');
    fm[kv[1]] = v;
  }
  return fm;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else if (name.name.endsWith('.mdx') || name.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// URL for a docs file (Docusaurus default routing; index.* -> the folder).
function urlFor(file) {
  let rel = file.slice(DOCS.length + 1).replace(/\.(mdx|md)$/, '');
  rel = rel.replace(/\/index$/, '').replace(/^index$/, '');
  return `${SITE}/docs/${rel}`.replace(/\/+$/, (m, i, s) => (s.endsWith('/docs/') ? '' : ''));
}

// Section order + labels from each _category_.json.
const sections = {};
for (const name of readdirSync(DOCS, { withFileTypes: true })) {
  if (!name.isDirectory()) continue;
  const cat = join(DOCS, name.name, '_category_.json');
  let label = name.name, position = 999;
  if (existsSync(cat)) {
    const j = JSON.parse(readFileSync(cat, 'utf8'));
    label = j.label ?? label;
    position = j.position ?? position;
  }
  sections[name.name] = { label, position, pages: [] };
}

for (const file of walk(DOCS)) {
  const seg = file.slice(DOCS.length + 1).split('/')[0];
  if (!sections[seg]) continue;
  const fm = frontmatter(file);
  if (!fm.title) continue;
  sections[seg].pages.push({
    title: fm.title,
    description: fm.description ?? '',
    position: Number(fm.sidebar_position ?? 999),
    url: urlFor(file),
  });
}

const ordered = Object.values(sections)
  .filter((s) => s.pages.length)
  .sort((a, b) => a.position - b.position);

const lines = [];
lines.push('# AILmanac');
lines.push('');
lines.push(
  '> The always-current, community-built almanac for getting the most out of Claude — and every AI. ' +
    'From your first prompt to production agents, level-tagged and kept honest about freshness. ' +
    'Independent project, not affiliated with Anthropic; when AILmanac and the official docs disagree, the official docs win.'
);
lines.push('');
lines.push(`Site: ${SITE}/  ·  Source: https://github.com/derob98/ailmanac`);
lines.push('');

for (const s of ordered) {
  lines.push(`## ${s.label}`);
  lines.push('');
  for (const p of s.pages.sort((a, b) => a.position - b.position)) {
    const desc = p.description ? `: ${p.description}` : '';
    lines.push(`- [${p.title}](${p.url})${desc}`);
  }
  lines.push('');
}

const total = ordered.reduce((n, s) => n + s.pages.length, 0);
writeFileSync(join(ROOT, 'static', 'llms.txt'), lines.join('\n').trimEnd() + '\n');
console.log(`Wrote static/llms.txt — ${total} pages across ${ordered.length} sections.`);
