#!/usr/bin/env node
// Per-page social preview (Open Graph) cards: one 1200x630 PNG per English
// docs page, so a shared link shows that page's own title instead of the
// generic site card.
//
// Run: node scripts/build-og.mjs [--out <dir>] [--only <route>] [--limit <n>]
//   --out    output directory, relative to the repo root (default: build)
//   --only   a single route, e.g. claude-code/plan-mode
//   --limit  only the first <n> pages (by route), for quick checks
// Output: <out>/og/docs/<route>.png, with the same routing rule as
//   build-llms-txt.mjs (docs/models/index.mdx -> og/docs/models.png).
//
// Each card is a headless Chrome screenshot of scripts/og-template.html. Set
// CHROME_PATH when Chrome is not at the default macOS location. Rendered cards
// are cached in node_modules/.cache/ailmanac-og, keyed by the template plus the
// card's data, so only new or changed pages are rendered again.
//
// This step never fails the build: when Chrome is missing or a render fails,
// the page gets a copy of static/img/og-default.png and a warning is printed.
// The exit code is non-zero only for invalid arguments.

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  realpathSync, renameSync, rmSync,
} from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs, promisify } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const TEMPLATE = join(ROOT, 'scripts', 'og-template.html');
const FALLBACK = join(ROOT, 'static', 'img', 'og-default.png');
const CHROME =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [WIDTH, HEIGHT] = [1200, 630];
const RENDER_TIMEOUT_MS = 20_000;
const WORKERS = Math.min(6, availableParallelism());
const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', all: 'All levels' };
const USAGE = 'Usage: node scripts/build-og.mjs [--out <dir>] [--only <route>] [--limit <n>]';

function usageError(message) {
  console.error(`build-og: ${message}\n${USAGE}`);
  process.exit(2);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    // "_" files are partials, not pages (Docusaurus does not route them).
    else if (/\.mdx?$/.test(entry.name) && !entry.name.startsWith('_')) out.push(p);
  }
  return out;
}

// Route for a docs file (Docusaurus default routing; index.* -> the folder).
function routeFor(file) {
  return relative(DOCS, file).split(sep).join('/').replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
}

function titleOf(raw, route) {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  let title = fm.match(/^title:\s*(.+?)\s*$/m)?.[1];
  if (title?.startsWith('"')) {
    // A double-quoted YAML scalar is JSON for every title we write (handles \" and \\).
    try { title = JSON.parse(title); } catch { title = title.replace(/^"|"$/g, ''); }
  } else if (title?.startsWith("'")) {
    title = title.replace(/^'|'$/g, '').replaceAll("''", "'");
  }
  return title || raw.match(/^#\s+(.+)$/m)?.[1] || route.split('/').pop();
}

// Section label: the "label" of the top-level folder's _category_.json.
const labels = new Map();
function sectionOf(route) {
  const folder = route.split('/')[0];
  if (!labels.has(folder)) {
    let label;
    try { label = JSON.parse(readFileSync(join(DOCS, folder, '_category_.json'), 'utf8')).label; } catch {}
    labels.set(folder, label);
  }
  return labels.get(folder);
}

// Everything the card shows, all taken from the source file. A field the page
// lacks stays undefined, drops out of the JSON, and the template omits it.
function cardFor(file) {
  const raw = readFileSync(file, 'utf8');
  const route = routeFor(file);
  const title = titleOf(raw, route);
  const section = sectionOf(route);
  return {
    route,
    data: {
      title,
      // A section's own index page would show the same words twice.
      section: section === title ? undefined : section,
      level: LEVELS[raw.match(/<LevelBadge\b[^>]*?\blevel=["'](\w+)["']/)?.[1]],
      // ISO dates sort as text, so the last one is the most recent.
      verified: [...raw.matchAll(/lastVerified=["'](\d{4}-\d{2}-\d{2})["']/g)].map((m) => m[1]).sort().pop(),
    },
  };
}

const run = promisify(execFile);
const templateUrl = pathToFileURL(TEMPLATE).href;

// One screenshot of the template, with the card's data in the URL hash.
// Known limit: one Chrome launch per card, one to two seconds of CPU each. Fine
// while the cache absorbs most runs; if full renders become routine, keep one
// Chrome per worker alive over --remote-debugging-pipe instead.
async function render(json, file, profile) {
  await run(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--disable-extensions', '--disable-background-networking',
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`, '--force-device-scale-factor=1',
    // Lets the embedded fonts load and the title fit before the capture.
    '--virtual-time-budget=2000',
    `--screenshot=${file}`,
    `${templateUrl}#${encodeURIComponent(json)}`,
  ], { timeout: RENDER_TIMEOUT_MS, killSignal: 'SIGKILL' });
  const png = readFileSync(file);
  if (png.readUInt32BE(16) !== WIDTH || png.readUInt32BE(20) !== HEIGHT) {
    throw new Error(`screenshot is not ${WIDTH}x${HEIGHT}`);
  }
}

async function main() {
  let args;
  try {
    args = parseArgs({
      options: { out: { type: 'string', default: 'build' }, only: { type: 'string' }, limit: { type: 'string' } },
    }).values;
  } catch (err) {
    usageError(err.message);
  }
  if (args.limit !== undefined && !/^[1-9]\d*$/.test(args.limit)) {
    usageError(`--limit expects a positive integer, got "${args.limit}"`);
  }

  const started = Date.now();
  const outDir = join(resolve(ROOT, args.out), 'og', 'docs');
  let cards = walk(DOCS).map(cardFor).sort((a, b) => (a.route < b.route ? -1 : 1));
  if (args.only !== undefined) {
    const only = args.only.replace(/^\/?(docs\/)?/, '').replace(/\/$/, '');
    cards = cards.filter((c) => c.route === only);
    if (!cards.length) usageError(`--only "${args.only}" matches no page under docs/`);
  }
  if (args.limit) cards = cards.slice(0, Number(args.limit));

  // node_modules may be a symlink: cache next to the real dependencies.
  // Known limit: the cache is never pruned. It lives under node_modules/.cache,
  // so a clean install clears it; prune by age here if it ever grows too large.
  let cacheDir = null;
  try {
    cacheDir = join(realpathSync(join(ROOT, 'node_modules')), '.cache', 'ailmanac-og');
    mkdirSync(cacheDir, { recursive: true });
  } catch (err) {
    cacheDir = null;
    console.warn(`build-og: warning: no cache (${err.message}); every card is rendered`);
  }

  const template = readFileSync(TEMPLATE);
  const count = { rendered: 0, cached: 0, fallback: 0 };
  const queue = [];
  for (const card of cards) {
    card.json = JSON.stringify(card.data);
    card.target = join(outDir, `${card.route}.png`);
    mkdirSync(dirname(card.target), { recursive: true });
    const hash = createHash('sha256').update(template).update('\0').update(card.json).digest('hex');
    card.cached = cacheDir && join(cacheDir, `${hash}.png`);
    if (card.cached && existsSync(card.cached)) {
      copyFileSync(card.cached, card.target);
      count.cached++;
    } else {
      queue.push(card);
    }
  }

  const fallback = (card, reason) => {
    count.fallback++;
    try {
      copyFileSync(FALLBACK, card.target);
      if (reason) console.warn(`build-og: warning: default image for ${card.route} (${reason})`);
    } catch (err) {
      console.warn(`build-og: warning: no image for ${card.route} (${err.message})`);
    }
  };

  let chromeOk = existsSync(CHROME);
  if (queue.length && !chromeOk) {
    console.warn(
      `build-og: warning: Chrome not found at ${CHROME} (set CHROME_PATH); ` +
        `${queue.length} page(s) get the default image`,
    );
  }

  let failures = 0;
  const worker = async (id) => {
    let profile;
    try {
      for (let card; (card = queue.shift()); ) {
        if (!chromeOk) {
          fallback(card);
          continue;
        }
        profile ??= mkdtempSync(join(tmpdir(), 'ailmanac-og-'));
        // Render to a private name, then rename: a cache entry is never half-written.
        const shot = card.cached ? `${card.cached}.${process.pid}-${id}.png` : card.target;
        try {
          await render(card.json, shot, profile);
          if (card.cached) {
            renameSync(shot, card.cached);
            copyFileSync(card.cached, card.target);
          }
          count.rendered++;
        } catch (err) {
          rmSync(shot, { force: true });
          fallback(
            card,
            err.killed ? `timed out after ${RENDER_TIMEOUT_MS / 1000}s`
              : typeof err.code === 'number' ? `Chrome exited with code ${err.code}`
              : String(err.message).split('\n')[0].slice(0, 120),
          );
          // A Chrome that never produces a card is not worth a timeout per page.
          if (++failures >= WORKERS && count.rendered === 0 && chromeOk) {
            chromeOk = false;
            console.warn('build-og: warning: Chrome is not rendering; the remaining pages get the default image');
          }
        }
      }
    } finally {
      if (profile) rmSync(profile, { recursive: true, force: true });
    }
  };
  await Promise.all(Array.from({ length: Math.min(WORKERS, queue.length) }, (_, id) => worker(id)));

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `build-og: ${cards.length} card(s) in ${join(args.out, 'og', 'docs')} — ` +
      `${count.rendered} rendered, ${count.cached} from cache, ${count.fallback} fallback, ${seconds}s`,
  );
}

// Social cards are a nicety: whatever goes wrong here, the site build goes on.
main().catch((err) => {
  console.warn(`build-og: warning: stopped early (${err.message}); the build continues`);
});
