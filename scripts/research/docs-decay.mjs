#!/usr/bin/env node
// How fast do Claude Code's docs change, and how much of them has each Claude
// model never seen?
//
// Reads the git history of a community mirror of the official docs (one commit
// per sync since July 2025), takes one snapshot a week, splits every page into
// sentences and code lines, and follows each one over time. Two levels:
//   - text: a sentence is the same only if its words are the same;
//   - fact: a rewording still counts as the same sentence, as long as no number,
//     flag, path or identifier in it changed.
// Writes aggregates only (counts, curves, identifier names), never the docs text.
//
// Run:  node scripts/research/docs-decay.mjs <path-to-mirror-clone>
// Mirror used for the 2026-10 edition: github.com/web3dev1337/claude-code-docs
// (a fork of ericbuess/claude-code-docs that kept its full sync history).

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = process.argv[2];
if (!REPO) {
  console.error('usage: docs-decay.mjs <path-to-mirror-clone>');
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'research', 'claude-code-docs-decay.json');
// Ready-made SessionStart outputs for the since-cutoff plugin, one per cutoff.
const BRIEFINGS = join(ROOT, 'plugins', 'since-cutoff', 'briefings');
const PAGE = 'https://derob98.github.io/ailmanac/docs/whats-new/unread-manual';
const DAY = 86_400_000;
const git = (args, input) =>
  execFileSync('git', ['-C', REPO, ...args], { input, encoding: 'utf8', maxBuffer: 1 << 30 });

// Reliable knowledge cutoffs as published on each model's page in the Claude
// Platform docs (checked 2026-10-15). A month counts through its last day, the
// most generous reading for the model.
const MODELS = [
  { cutoff: '2025-02', names: ['Claude Haiku 4.5'] },
  { cutoff: '2025-05', names: ['Claude Opus 4.5', 'Claude Opus 4.6'] },
  { cutoff: '2025-08', names: ['Claude Sonnet 4.6'] },
  { cutoff: '2026-01', names: ['Claude Fable 5', 'Claude Mythos 5', 'Claude Sonnet 5', 'Claude Opus 4.7', 'Claude Opus 4.8'] },
  { cutoff: '2026-05', names: ['Claude Opus 5'] },
  { cutoff: '2026-06', names: ['Claude Fable 5.1', 'Claude Mythos 5.1', 'Claude Opus 5.5', 'Claude Sonnet 5.5', 'Claude Haiku 5.5'] },
];

// Pages that describe history rather than the product, and the Agent SDK pages,
// which moved in from another docs site in 2026 (their arrival is not new text).
const SKIP = /(^|\/)(changelog\.md|whats-new__.*|sdk__.*|agent-sdk__.*)$/;

// ── snapshots: the last sync of every 7-day period, plus the latest sync ────
const commits = git(['log', '--first-parent', '--reverse', '--format=%H %cI'])
  .trim().split('\n').map((l) => { const [sha, iso] = l.split(' '); return { sha, t: Date.parse(iso) }; });
const snaps = [];
for (let edge = commits[0].t + 7 * DAY, i = 0; ; edge += 7 * DAY) {
  while (i + 1 < commits.length && commits[i + 1].t <= edge) i += 1;
  if (!snaps.length || snaps.at(-1).sha !== commits[i].sha) snaps.push(commits[i]);
  if (i === commits.length - 1) break;
}
const day = (t) => new Date(t).toISOString().slice(0, 10);

// ── text → units ───────────────────────────────────────────────────────────
const BLOCK_START = /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|\||>|<\/?[A-Za-z])/;
const clean = (s) => s
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\{#[^}]*\}/g, ' ')
  .replace(/^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|>\s?)+/, '')
  .replace(/\*+|`/g, '')
  .replace(/\s+/g, ' ')
  .trim();
// Tokens a rewording must not touch: anything with a digit, a flag, a path, a
// dotted or snake_case name, camelCase, or an ALL-CAPS word.
const FACT = /^(?=.*\d)|^[-/~]|[._]|[a-z][A-Z]|^[A-Z]{3,}$/;

const units = new Map(); // normalized text → id
const meta = []; // id → { words: Set, facts: string, code: boolean }
function unitId(raw, code) {
  const text = clean(raw);
  if (text.length < (code ? 12 : 20) || !/[a-z]/i.test(text)) return -1;
  const key = (code ? '§' : '') + text.normalize('NFKC').toLowerCase().replace(/[.:;,]+$/, '');
  let id = units.get(key);
  if (id === undefined) {
    id = meta.length;
    units.set(key, id);
    const tokens = text.split(/[\s|()"',;:!?]+/).filter(Boolean);
    meta.push({
      words: new Set(tokens.map((w) => w.toLowerCase().replace(/[.]+$/, '')).filter((w) => w.length > 1)),
      facts: tokens.filter((w) => FACT.test(w.replace(/[.]+$/, ''))).map((w) => w.replace(/[.]+$/, '')).sort().join(' '),
      code,
    });
  }
  return id;
}
function pageUnits(md) {
  const ids = [];
  let fence = false;
  let para = [];
  const flush = () => {
    if (!para.length) return;
    for (const s of para.join(' ').split(/(?<=[.!?])\s+(?=[A-Z0-9`"'(\[])/)) ids.push(unitId(s, false));
    para = [];
  };
  for (const line of md.replace(/[​﻿]/g, '').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { flush(); fence = !fence; continue; }
    if (fence) { ids.push(unitId(line, true)); continue; }
    const t = line.trim();
    if (!t || /^\|?\s*:?-{3,}/.test(t)) { flush(); continue; }
    if (BLOCK_START.test(t)) flush();
    para.push(t);
    if (t.startsWith('|')) flush(); // a table row is one unit
  }
  flush();
  return [...new Set(ids.filter((id) => id >= 0))];
}

// ── text → identifiers (the reference tables and the hooks input examples) ─
const firstCells = (md) => [...md.matchAll(/^\|\s*`([^`]+)`/gm)].map((m) => m[1].trim().split(/[\s,]/)[0]);
function pageEntities(path, md) {
  const out = [];
  const name = path.split('/').pop();
  if (name === 'cli-reference.md') for (const c of firstCells(md)) if (/^--?[a-zA-Z][\w-]*$/.test(c)) out.push(`flag ${c}`);
  if (/^(slash-)?commands\.md$/.test(name)) for (const c of firstCells(md)) if (/^\/[a-z][\w:-]*$/.test(c)) out.push(`command ${c}`);
  if (name === 'hooks.md') {
    for (const m of md.matchAll(/"hook_event_name"\s*:\s*"([A-Za-z]+)"/g)) out.push(`hook ${m[1]}`);
    for (const m of md.matchAll(/^###\s+([A-Z][a-z]+(?:[A-Z][a-z]+)+)\s*$/gm)) out.push(`hook ${m[1]}`);
  }
  for (const c of firstCells(md)) if (/^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/.test(c)) out.push(`env ${c}`);
  return out;
}

// ── read every snapshot (blobs are cached: most pages don't change in a week)
const blobCache = new Map();
const present = []; // snapshot → Set of unit ids
const entities = []; // snapshot → Set of identifiers
const pages = []; // snapshot → page count
const pageNames = []; // snapshot → Set of file names
const df = new Map(); // unit id → max number of pages it appeared in at once
for (const s of snaps) {
  const files = git(['ls-tree', '-r', s.sha, 'docs/']).trim().split('\n')
    .map((l) => { const [info, path] = l.split('\t'); return { blob: info.split(' ')[2], path }; })
    .filter((f) => f.path.endsWith('.md') && !SKIP.test(f.path));
  const missing = files.filter((f) => !blobCache.has(f.blob));
  if (missing.length) {
    const raw = execFileSync('git', ['-C', REPO, 'cat-file', '--batch'], { input: missing.map((f) => f.blob).join('\n') + '\n', maxBuffer: 1 << 30 });
    let at = 0;
    for (const f of missing) {
      const nl = raw.indexOf(10, at);
      const size = Number(raw.subarray(at, nl).toString().split(' ')[2]);
      const md = raw.subarray(nl + 1, nl + 1 + size).toString('utf8');
      at = nl + 1 + size + 1;
      blobCache.set(f.blob, { ids: pageUnits(md), ents: pageEntities(f.path, md) });
    }
  }
  const set = new Set();
  const ents = new Set();
  const seen = new Map();
  for (const f of files) {
    const { ids, ents: e } = blobCache.get(f.blob);
    for (const id of ids) { set.add(id); seen.set(id, (seen.get(id) || 0) + 1); }
    for (const x of e) ents.add(x);
  }
  for (const [id, n] of seen) if (n > (df.get(id) || 0)) df.set(id, n);
  present.push(set);
  entities.push(ents);
  pages.push(files.length);
  pageNames.push(new Set(files.map((f) => f.path.split('/').pop())));
}
// Boilerplate: a line that sits on five or more pages at once (banners, generic
// code like `"type": "command",`) says nothing about any one feature.
for (const set of present) for (const id of set) if (df.get(id) >= 5) set.delete(id);

// ── lives: a sentence is gone once it is missing from two weekly snapshots in
// a row (or from the latest one), which ignores a page that failed one sync.
const S = snaps.length;
const birth = new Map();
const death = new Map();
for (let k = 0; k < S; k += 1) for (const id of present[k]) if (!birth.has(id)) birth.set(id, k);
for (const [id, b] of birth) {
  for (let k = b + 1; k < S; k += 1) {
    if (!present[k].has(id) && (k === S - 1 || !present[k + 1].has(id))) { death.set(id, k); break; }
  }
}

// ── facts: link a new sentence to one that vanished the same week when the
// wording overlaps (Jaccard ≥ 0.6) and every number/flag/name is identical.
const parent = meta.map((_, i) => i);
const root = (i) => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
const jaccard = (a, b) => { let n = 0; for (const w of a) if (b.has(w)) n += 1; return n / (a.size + b.size - n); };
let linked = 0;
for (let k = 1; k < S; k += 1) {
  const gone = [...present[k - 1]].filter((id) => death.get(id) === k || !present[k].has(id));
  if (!gone.length) continue;
  const index = new Map();
  for (const id of gone) for (const w of meta[id].words) (index.get(w) || index.set(w, []).get(w)).push(id);
  for (const id of present[k]) {
    if (birth.get(id) !== k) continue;
    const m = meta[id];
    const counts = new Map();
    for (const w of m.words) for (const c of index.get(w) || []) counts.set(c, (counts.get(c) || 0) + 1);
    let best = -1;
    let bestScore = 0.6;
    for (const [c] of counts) {
      if (meta[c].code !== m.code || meta[c].facts !== m.facts) continue;
      const score = jaccard(m.words, meta[c].words);
      if (score >= bestScore) { best = c; bestScore = score; }
    }
    if (best >= 0) { parent[root(id)] = root(best); linked += 1; }
  }
}
const factsAt = present.map((set) => new Set([...set].map(root)));
const fBirth = new Map();
const fDeath = new Map();
for (let k = 0; k < S; k += 1) for (const f of factsAt[k]) if (!fBirth.has(f)) fBirth.set(f, k);
for (const [f, b] of fBirth) {
  for (let k = b + 1; k < S; k += 1) {
    if (!factsAt[k].has(f) && (k === S - 1 || !factsAt[k + 1].has(f))) { fDeath.set(f, k); break; }
  }
}

// ── Kaplan–Meier over everything born after the first snapshot ───────────
function survival(births, deaths) {
  const events = [];
  for (const [id, b] of births) {
    if (b === 0) continue; // already there in July 2025: true age unknown
    const d = deaths.get(id);
    events.push({ t: Math.round(((d ?? S - 1) === b ? 0 : (snaps[d ?? S - 1].t - snaps[b].t)) / DAY), dead: d !== undefined });
  }
  events.sort((a, b) => a.t - b.t);
  const curve = [];
  let atRisk = events.length;
  let s = 1;
  let median = null;
  for (let i = 0; i < events.length;) {
    const t = events[i].t;
    let dead = 0;
    let n = 0;
    while (i < events.length && events[i].t === t) { dead += events[i].dead ? 1 : 0; n += 1; i += 1; }
    if (dead) s *= 1 - dead / atRisk;
    atRisk -= n;
    curve.push([t, Number(s.toFixed(4))]);
    if (median === null && s <= 0.5) median = t;
  }
  // Keep one point per week for the chart.
  const weekly = [];
  for (const [t, v] of curve) if (!weekly.length || t - weekly.at(-1)[0] >= 7 || t === curve.at(-1)[0]) weekly.push([t, v]);
  return { lives: events.length, medianDays: median, curve: weekly };
}

// ── what each model has seen ───────────────────────────────────────────────
const last = S - 1;
const share = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n += 1; return n; };
const pct = (n, d) => Number(((100 * n) / d).toFixed(1));
function compare(k) {
  const known = factsAt[k];
  const now = factsAt[last];
  const kept = share(known, now);
  const added = [...entities[last]].filter((e) => !entities[k].has(e)).sort();
  const removed = [...entities[k]].filter((e) => !entities[last].has(e)).sort();
  return {
    date: day(snaps[k].t),
    pages: pages[k],
    sentences: present[k].size,
    textUnseenToday: pct(present[last].size - share(present[k], present[last]), present[last].size),
    factsUnseenToday: pct(now.size - kept, now.size),
    factsGoneSince: pct(known.size - kept, known.size),
    proseUnseenToday: (() => {
      const prose = [...now].filter((f) => !meta[f].code);
      return pct(prose.filter((f) => !known.has(f)).length, prose.length);
    })(),
    newPages: [...pageNames[last]].filter((n) => !pageNames[k].has(n)).length,
    added,
    removed,
  };
}
const models = MODELS.map(({ cutoff, names }) => {
  const end = Date.parse(`${cutoff}-01T00:00:00Z`) + 31 * DAY;
  const monthEnd = new Date(Date.UTC(new Date(end).getUTCFullYear(), new Date(end).getUTCMonth(), 1)) - 1;
  let k = snaps.findLastIndex((s) => s.t <= monthEnd);
  const beforeMirror = k < 0;
  if (beforeMirror) k = 0;
  return { cutoff, names, beforeMirror, ...compare(k) };
});

// ── cohorts by quarter (the "ship of Theseus" chart) and growth ───────────
const quarter = (t) => { const d = new Date(t); return `${d.getUTCFullYear()} Q${Math.floor(d.getUTCMonth() / 3) + 1}`; };
const cohortOf = (k) => (k === 0 ? 'before July 2025' : quarter(snaps[k].t));
const cohortNames = [...new Set(snaps.map((_, k) => cohortOf(k)))];
const timeline = snaps.map((s, k) => {
  const counts = Object.fromEntries(cohortNames.map((c) => [c, 0]));
  for (const f of factsAt[k]) counts[cohortOf(fBirth.get(f))] += 1;
  const now = factsAt[last];
  return {
    date: day(s.t),
    pages: pages[k],
    sentences: present[k].size,
    facts: factsAt[k].size,
    cohorts: cohortNames.map((c) => counts[c]),
    // "If you learned the docs this week": how much of today's docs is new to you.
    factsUnseenToday: pct(now.size - share(factsAt[k], now), now.size),
    factsStillTrue: pct(share(factsAt[k], now), factsAt[k].size),
  };
});
const firstSeen = {};
for (let k = 0; k < S; k += 1) for (const e of entities[k]) if (!(e in firstSeen)) firstSeen[e] = day(snaps[k].t);

const today = [...entities[last]].sort();
const indexOf = new Map(today.map((e, i) => [e, i]));
const result = {
  source: 'https://github.com/web3dev1337/claude-code-docs',
  generated: day(Date.now()),
  window: { from: day(snaps[0].t), to: day(snaps[last].t), snapshots: S, syncs: commits.length },
  method: { unitsTracked: meta.length, rewordingsLinked: linked, skipped: String(SKIP) },
  survival: { text: survival(birth, death), facts: survival(fBirth, fDeath) },
  cohorts: cohortNames,
  timeline,
  // `added` holds indexes into identifiers.today.
  models: models.map((m) => ({ ...m, added: m.added.map((e) => indexOf.get(e)) })),
  identifiers: { today, firstSeen: today.map((e) => firstSeen[e]) },
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result));
const byType = (list) => {
  const out = { flag: [], command: [], hook: [], env: [] };
  for (const e of list) { const [type, name] = e.split(' '); out[type].push(name); }
  return out;
};
const month = (c) => new Date(`${c}-01T00:00:00Z`).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const list = (l) => (l.length > 40 ? `${l.slice(0, 40).join(', ')} and ${l.length - 40} more` : l.join(', '));
mkdirSync(BRIEFINGS, { recursive: true });
const ids = [];
for (const m of models) {
  const { env, ...named } = byType(m.added);
  const gone = Object.values(byType(m.removed)).flat();
  const text = [
    `Claude Code has changed since your training cutoff (${month(m.cutoff)}). As of ${result.window.to}, ${m.beforeMirror ? 'at least ' : ''}${m.factsUnseenToday}% of what the official Claude Code docs say was not in them at your cutoff, and ${m.newPages} of their ${pages[last]} pages are new.`,
    'Documented since then (names only; read the docs before you use one):',
    named.flag.length && `- CLI flags (${named.flag.length}): ${list(named.flag)}`,
    named.command.length && `- Slash commands (${named.command.length}): ${list(named.command)}`,
    named.hook.length && `- Hook events (${named.hook.length}): ${list(named.hook)}`,
    env.length && `- Environment variables: ${env.length} new, listed at https://code.claude.com/docs/en/env-vars`,
    gone.length && `- No longer documented: ${list(gone)}`,
    'Treat your memory of Claude Code as incomplete: before you rely on a flag, command, setting or hook, or tell the user one does not exist, check the docs at https://code.claude.com/docs/en/ (page index: https://code.claude.com/docs/llms.txt).',
    `Measured by AILmanac from the history of the docs: ${PAGE}`,
  ].filter(Boolean).join('\n');
  const write = (file, body) => writeFileSync(join(BRIEFINGS, file), JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: body } }) + '\n');
  write(`${m.cutoff}.json`, text);
  // Claude Code does not always pass the model (headless runs, /clear). No
  // Claude model's cutoff is later than the newest one, so its list holds for
  // any of them.
  if (m === models.at(-1)) {
    write('default.json', text.replace(
      /^Claude Code has changed since your training cutoff \(([^)]+)\)\./,
      `No Claude model's reliable knowledge cutoff is later than $1 (Anthropic's model pages, checked ${result.window.to}), and Claude Code has changed a lot since.`,
    ).replace('at your cutoff', `at the end of $1`.replace('$1', month(m.cutoff))));
  }
  for (const n of m.names) ids.push([n.replace(/^Claude /, '').toLowerCase().replace(/[ .]/g, '-'), m.cutoff]);
}
// One "family-major[-minor] cutoff" pair per line, read by scripts/briefing.sh.
writeFileSync(join(BRIEFINGS, 'models.txt'), ids.map((p) => p.join(' ')).join('\n') + '\n');
const brief = { ...result, timeline: `${timeline.length} weeks`, identifiers: `${result.identifiers.today.length} today`,
  survival: Object.fromEntries(Object.entries(result.survival).map(([k, v]) => [k, { lives: v.lives, medianDays: v.medianDays, at90: v.curve.find(([t]) => t >= 90)?.[1], at180: v.curve.find(([t]) => t >= 180)?.[1], end: v.curve.at(-1) }])),
  models: models.map(({ added, removed, ...m }) => ({ ...m, added: added.length, removed: removed.length })) };
console.log(JSON.stringify(brief, null, 1));
