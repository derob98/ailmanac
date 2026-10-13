#!/usr/bin/env node
// Publish a plain-Markdown copy of every docs page next to its HTML, so that
// appending `.md` to a page URL returns the source text:
//   https://derob98.github.io/ailmanac/docs/claude-code/plan-mode.md
//
// It is what the "Copy as Markdown" button on each page fetches, and what an
// agent or a person pasting a page into a chat actually wants. Each copy
// opens with the title, the page URL and the verified date, so the source
// travels with the text.
//
// Runs after `docusaurus build` (npm `postbuild`). English pages are always
// mirrored; a locale gets a copy only where a translation exists, and the
// button falls back to English otherwise — mirroring every untranslated page
// eleven times would add tens of megabytes of duplicates to the site.
//
// Run: node scripts/build-md-mirror.mjs [--out build]

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SITE = 'https://derob98.github.io/ailmanac';
const outArg = process.argv.indexOf('--out');
const OUT = resolve(ROOT, outArg > -1 ? process.argv[outArg + 1] : 'build');

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out;
}

// Same routing rule as build-llms-txt.mjs: index.* maps to its folder.
const routeFor = (rel) => rel.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '').replace(/\/$/, '');

function toMarkdown(raw, url) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const field = (key) => {
    const m = fm && fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  };
  const body = (fm ? raw.slice(fm[0].length) : raw).trim();
  const verified = [...raw.matchAll(/lastVerified="(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort().pop();
  const head = [`# ${field('title') || url}`, ''];
  head.push(`> Source: ${url} · AILmanac (CC BY 4.0)${verified ? ` · last verified ${verified}` : ''}`, '');
  if (field('description')) head.push(field('description'), '');
  return `${head.join('\n')}\n${body}\n`;
}

if (!existsSync(OUT)) {
  console.error(`build-md-mirror: ${OUT} does not exist; run the site build first.`);
  process.exit(1);
}

const pages = walk(DOCS).map((file) => file.slice(DOCS.length + 1));
const locales = existsSync(join(ROOT, 'i18n'))
  ? readdirSync(join(ROOT, 'i18n'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
  : [];

let written = 0;
function mirror(source, target, url) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, toMarkdown(readFileSync(source, 'utf8'), url));
  written += 1;
}

for (const rel of pages) {
  const route = routeFor(rel);
  const tail = route ? `docs/${route}` : 'docs';
  mirror(join(DOCS, rel), join(OUT, `${tail}.md`), `${SITE}/${tail}`);
  for (const locale of locales) {
    const translated = join(ROOT, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current', rel);
    // Only where that locale was actually built and the page is translated.
    if (existsSync(join(OUT, locale)) && existsSync(translated)) {
      mirror(translated, join(OUT, locale, `${tail}.md`), `${SITE}/${locale}/${tail}`);
    }
  }
}

console.log(`build-md-mirror: wrote ${written} Markdown copies for ${pages.length} pages.`);
