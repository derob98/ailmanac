#!/usr/bin/env node
// Re-renders the Claude Code cheat sheet from its HTML source with headless Chrome:
//   static/cheatsheets/claude-code-cheat-sheet.html  ->  .pdf (A4 landscape, light), .png (light), -dark.png
// Usage: node scripts/build-cheatsheet.mjs
// Set CHROME_PATH when Chrome is not at the default macOS location.
// Fails if any column overflows the page or the PDF is not exactly one page.
import {execFileSync} from 'node:child_process';
import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../static/cheatsheets');
const out = (suffix) => path.join(dir, `claude-code-cheat-sheet${suffix}`);
const src = pathToFileURL(out('.html')).href;
const chrome =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// A4 landscape at 96 dpi, and the scale that makes the PNG 2400 px wide.
const [width, height] = [1123, 794];
const viewport = [`--window-size=${width},${height}`, '--hide-scrollbars'];
const scale = `--force-device-scale-factor=${2400 / width}`;

const run = (...args) =>
  execFileSync(chrome, ['--headless=new', '--disable-gpu', ...args], {
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString();

for (const theme of ['', '?theme=dark']) {
  const dom = run(...viewport, '--virtual-time-budget=3000', '--dump-dom', src + theme);
  const slack = dom.match(/data-slack="([^"]*)"/)?.[1];
  if (!slack) throw new Error('Layout check did not run (data-slack missing).');
  if (slack.split(' ').some((px) => Number(px) < 0)) {
    throw new Error(`A column overflows the page. Free px per column: ${slack}`);
  }
  console.log(`layout ok ${theme || '(light)'}: free px per column ${slack}`);
}

run(`--print-to-pdf=${out('.pdf')}`, '--no-pdf-header-footer', src);
const pages = readFileSync(out('.pdf'), 'latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0;
if (pages !== 1) throw new Error(`Expected a one-page PDF, got ${pages} pages.`);

run(`--screenshot=${out('.png')}`, ...viewport, scale, src);
run(`--screenshot=${out('-dark.png')}`, ...viewport, scale, `${src}?theme=dark`);

for (const suffix of ['.pdf', '.png', '-dark.png']) {
  console.log(`${path.basename(out(suffix))}  ${(statSync(out(suffix)).size / 1024).toFixed(0)} KB`);
}
