#!/usr/bin/env node
/**
 * build-freshness.mjs — generates data/freshness.json, the data source for the
 * public Freshness Dashboard (docs/whats-new/freshness.mdx).
 *
 * It walks the canonical English docs/ tree, and for every page records:
 *   - title        (front-matter `title`, else derived from the filename)
 *   - section      (the top-level folder, e.g. "claude-code")
 *   - url          (the Docusaurus route, honoring a custom `slug` if present)
 *   - editUrl      (GitHub edit link, so a stale page is one click from a fix)
 *   - lastVerified (the most recent <VerifyNote lastVerified="…"> on the page, or null)
 *   - source       (the upstream source URL from that VerifyNote, if any)
 *
 * Staleness is computed in the browser against the *reader's* "today", so the
 * dashboard never goes stale itself — we only persist the raw verified date.
 *
 * Run automatically via the `prebuild`/`prestart` npm hooks; safe to run by hand.
 */
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DOCS_DIR = join(ROOT, 'docs');
const OUT_FILE = join(ROOT, 'data', 'freshness.json');
const GITHUB_TREE = 'https://github.com/derob98/ailmanac/tree/main';

/** Recursively collect every .md/.mdx file under a directory. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      out.push(full);
    }
  }
  return out;
}

/** Minimal YAML front-matter reader — only the scalar keys we need. */
function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fm;
}

/** Title-case a kebab/path segment for a fallback display name. */
function humanize(segment) {
  return segment
    .replace(/\.mdx?$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Most recent lastVerified date across all <VerifyNote> on the page, + its source. */
function extractVerify(text) {
  const notes = [...text.matchAll(/<VerifyNote\b([^>]*?)>/g)];
  let best = null;
  let source = null;
  for (const n of notes) {
    const attrs = n[1];
    const date = attrs.match(/lastVerified=["']([\d-]+)["']/)?.[1];
    if (!date) continue;
    if (!best || date > best) {
      best = date;
      source = attrs.match(/source=["']([^"']+)["']/)?.[1] ?? null;
    }
  }
  return {lastVerified: best, source};
}

/** File path -> Docusaurus route under /docs (honors custom slug, drops index). */
function toUrl(file, fm) {
  const rel = relative(DOCS_DIR, file).split(sep).join('/');
  if (fm.slug) {
    const slug = fm.slug.startsWith('/') ? fm.slug : `/${fm.slug}`;
    return `/docs${slug}`;
  }
  let route = rel.replace(/\.mdx?$/, '');
  route = route.replace(/\/index$/, '').replace(/^index$/, '');
  return route ? `/docs/${route}` : '/docs';
}

// The dashboard page itself isn't volatile content — keep it out of its own ledger.
const SELF = join('whats-new', 'freshness.mdx');
const files = walk(DOCS_DIR)
  .filter((f) => relative(DOCS_DIR, f) !== SELF)
  .sort();
const pages = files.map((file) => {
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontMatter(text);
  const rel = relative(DOCS_DIR, file).split(sep).join('/');
  const {lastVerified, source} = extractVerify(text);
  return {
    title: fm.title || fm.sidebar_label || humanize(rel.split('/').pop()),
    section: rel.includes('/') ? rel.split('/')[0] : 'root',
    url: toUrl(file, fm),
    editUrl: `${GITHUB_TREE}/docs/${rel}`,
    lastVerified: lastVerified || null,
    source: source || null,
  };
});

const verified = pages.filter((p) => p.lastVerified).length;
const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  totalPages: pages.length,
  verifiedPages: verified,
  pages,
};

writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n');
console.log(
  `[freshness] wrote ${pages.length} pages (${verified} with a verified date) -> data/freshness.json`,
);
