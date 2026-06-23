import React, {useMemo, useState, type ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Prompt Doctor — a 100% client-side prompt linter with a "diagnostic console" UI.
 *
 * It scores a pasted prompt against a transparent set of Claude best-practice
 * heuristics (no LLM call, nothing leaves the browser), explains each weakness,
 * links the finding to the doc that fixes it, and emits an improved scaffold.
 *
 * The rules are deliberately simple and inspectable — this is a teaching tool,
 * not an oracle. Every rule maps to a page elsewhere on the site.
 */

type Status = 'pass' | 'warn' | 'fail' | 'na';

type Finding = {
  id: string;
  title: string;
  status: Status;
  detail: string;
  fix: string;
  doc: {text: string; href: string};
};

const SAMPLE_WEAK = `write something good about our new app and make it engaging`;

const SAMPLE_STRONG = `You are a senior product copywriter.

<context>
[Paste the product one-pager here.]
</context>

Task: write the App Store description for our new app, based only on <context>.

Requirements:
- Audience: busy parents, 6th-grade reading level.
- Output format: a 1-sentence hook, then exactly 3 benefit bullets (max 12 words each).
- Tone: warm, concrete, no buzzwords.

Ground rules: use only facts in <context>. If a detail isn't there, leave a [TODO] marker rather than inventing it.`;

// --- tiny text helpers -------------------------------------------------------
const has = (t: string, re: RegExp) => re.test(t);
const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

const VAGUE = [
  'good', 'nice', 'better', 'best', 'appropriate', 'some', 'etc', 'stuff',
  'things', 'high quality', 'high-quality', 'professional', 'engaging',
  'compelling', 'relevant', 'optimal', 'as needed', 'and so on',
];

function analyze(raw: string): Finding[] {
  const t = raw.trim();
  const lc = t.toLowerCase();
  const words = countWords(t);
  const hasContextRef = has(
    lc,
    /\b(context|document|the following|below|provided|the text|transcript|article|paste|source material)\b|```|<[a-z_]+>/,
  );

  const findings: Finding[] = [];

  // 1. Substance
  findings.push({
    id: 'substance',
    title: 'Enough to act on',
    status: words >= 25 ? 'pass' : words >= 12 ? 'warn' : 'fail',
    detail:
      words >= 25
        ? `${words} words — there's room for real instruction.`
        : `Only ${words} words. Short prompts force Claude to guess your intent.`,
    fix: 'Spell out the task, the audience, and what a great answer looks like. Specificity beats brevity.',
    doc: {text: 'Prompting Basics', href: '/docs/prompting/basics'},
  });

  // 2. Role / persona
  findings.push({
    id: 'role',
    title: 'Sets a role',
    status: has(lc, /\byou are\b|\bact as\b|\byour role\b|\bas an? [a-z]+ (expert|engineer|editor|analyst|writer|assistant|specialist|lawyer|teacher)\b/)
      ? 'pass'
      : 'warn',
    detail: has(lc, /\byou are\b|\bact as\b|\byour role\b/)
      ? 'A role is defined — Claude knows whose voice to adopt.'
      : 'No role set. "You are a senior X" sharply focuses tone and judgment.',
    fix: 'Open with a role in the system prompt, e.g. "You are a senior technical editor."',
    doc: {text: 'Roles & System Prompts', href: '/docs/foundations/roles'},
  });

  // 3. Explicit task verb
  const taskVerb = /\b(write|summari[sz]e|extract|classif|translate|generate|list|explain|analy[sz]e|review|refactor|fix|create|rewrite|compare|draft|plan|design|outline|critique|rank|score|convert|debug)\w*\b/;
  findings.push({
    id: 'task',
    title: 'States one clear task',
    status: has(lc, taskVerb) ? 'pass' : 'warn',
    detail: has(lc, taskVerb)
      ? 'There is a clear action verb driving the request.'
      : 'No explicit action verb. Lead with the verb: "Summarize…", "Extract…", "Rewrite…".',
    fix: 'Start the instruction with a single imperative verb so the goal is unmistakable.',
    doc: {text: 'Prompting Basics', href: '/docs/prompting/basics'},
  });

  // 4. Output format
  const fmt = /\b(json|markdown|table|bullet|list|format|respond with|return (a|the|only)|schema|csv|xml|paragraph|sentence|word|heading|step-by-step list|as a)\b|\b\d+ (word|sentence|paragraph|bullet|item)/;
  findings.push({
    id: 'format',
    title: 'Specifies output shape',
    status: has(lc, fmt) ? 'pass' : 'warn',
    detail: has(lc, fmt)
      ? 'The desired output shape is described.'
      : 'No output format. Without it you get whatever length and shape Claude picks.',
    fix: 'Name the exact shape: "a 3-bullet list", "JSON matching this schema", "2 short paragraphs".',
    doc: {text: 'Structured Output', href: '/docs/api/structured-output'},
  });

  // 5. Examples / few-shot
  const exampley = /\b(example|for instance|e\.g\.|input:|output:|like this)\b/;
  const looksPatterned = /\b(classif|extract|label|tag|categor|format|parse|convert)\w*/.test(lc);
  findings.push({
    id: 'fewshot',
    title: 'Shows an example (when it helps)',
    status: has(lc, exampley) ? 'pass' : looksPatterned ? 'warn' : 'na',
    detail: has(lc, exampley)
      ? 'At least one example is present — the fastest way to pin down a pattern.'
      : looksPatterned
        ? 'This looks like a pattern task (classify/extract/format) but shows no example.'
        : 'No example — fine for open-ended tasks; add one if the format is strict.',
    fix: 'Add one or two input→output examples. For pattern tasks they outperform paragraphs of description.',
    doc: {text: 'Few-Shot Prompting', href: '/docs/prompting/few-shot'},
  });

  // 6. Structure for long prompts
  const structured = /<[a-z_]+>[\s\S]*<\/[a-z_]+>|^#{1,6}\s|```|^\s*[-*]\s|\n\s*\d+\.\s/m;
  findings.push({
    id: 'structure',
    title: 'Structured when long',
    status: words < 120 ? 'na' : structured.test(t) ? 'pass' : 'warn',
    detail:
      words < 120
        ? 'Short enough that delimiters are optional.'
        : structured.test(t)
          ? 'Long prompt uses tags/sections — Claude can tell the parts apart.'
          : 'Long prompt with no delimiters. Claude can confuse instructions with content.',
    fix: 'Wrap each part in XML tags: <context>…</context>, <task>…</task>, <example>…</example>.',
    doc: {text: 'XML Tags', href: '/docs/prompting/xml-tags'},
  });

  // 7. Grounding (only when context is referenced)
  const grounded = /\bonly\b|\bdo not (make|invent|guess)\b|\bdon't (make|invent|guess)\b|i don'?t know|not (in|present)|based (only|solely)|from the (provided|context|text|document)/;
  findings.push({
    id: 'grounding',
    title: 'Guards against made-up answers',
    status: !hasContextRef ? 'na' : has(lc, grounded) ? 'pass' : 'warn',
    detail: !hasContextRef
      ? 'No external source referenced — grounding rule not needed.'
      : has(lc, grounded)
        ? 'You tell Claude to stick to the source and admit gaps. Good defense against hallucination.'
        : 'You provide source material but never say "use only this / say I don\'t know".',
    fix: 'Add: "Answer only from the provided text. If it isn\'t there, say you don\'t know."',
    doc: {text: 'Hallucinations', href: '/docs/foundations/hallucinations'},
  });

  // 8. Vague qualifiers
  const hits = VAGUE.filter((w) => new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(lc));
  findings.push({
    id: 'vague',
    title: 'Avoids vague qualifiers',
    status: hits.length === 0 ? 'pass' : hits.length <= 1 ? 'warn' : 'fail',
    detail:
      hits.length === 0
        ? 'No empty adjectives — the criteria are concrete.'
        : `Vague words Claude can't measure: ${hits.slice(0, 5).map((w) => `"${w}"`).join(', ')}.`,
    fix: 'Replace each with a testable criterion. "engaging" → "opens with a question, max 12 words per line".',
    doc: {text: 'Prompting Claude', href: '/docs/prompting/prompting-claude'},
  });

  return findings;
}

function buildScaffold(raw: string, findings: Finding[]): string {
  const byId = Object.fromEntries(findings.map((f) => [f.id, f.status]));
  const task = raw.trim() || '[describe the single task here]';
  const lines: string[] = [];

  if (byId.role !== 'pass') lines.push('You are a [senior role — sets tone and judgment].', '');
  if (byId.grounding === 'warn' || byId.structure !== 'pass')
    lines.push('<context>', '[Paste the source material here, or delete this block if none.]', '</context>', '');

  lines.push(`<task>`, task, `</task>`, '');

  const reqs: string[] = [];
  if (byId.vague !== 'pass') reqs.push('- Replace vague goals with testable criteria (audience, length, tone).');
  if (byId.format !== 'pass') reqs.push('- Output format: [e.g. JSON to the schema below / a 3-bullet list / 2 paragraphs].');
  if (reqs.length) lines.push('<requirements>', ...reqs, '</requirements>', '');

  if (byId.fewshot === 'warn')
    lines.push('<example>', 'Input: [...]', 'Output: [...]', '</example>', '');

  if (byId.grounding === 'warn')
    lines.push('Ground rules: use only the information in <context>. If it isn\'t there, say "I don\'t know" — never invent it.');

  return lines.join('\n').trim();
}

const ICON: Record<Status, string> = {pass: '✓', warn: '!', fail: '✕', na: '–'};
const LABEL: Record<Status, string> = {pass: 'Optimal', warn: 'Tune', fail: 'Critical', na: 'N/A'};

const RING = {r: 52, c: 2 * Math.PI * 52};

export default function PromptDoctor(): ReactNode {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const findings = useMemo(() => (text.trim() ? analyze(text) : []), [text]);

  const scored = findings.filter((f) => f.status !== 'na');
  const points = scored.reduce((s, f) => s + (f.status === 'pass' ? 1 : f.status === 'warn' ? 0.5 : 0), 0);
  const score = scored.length ? Math.round((points / scored.length) * 100) : 0;
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  const tier = score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low';

  const scaffold = useMemo(
    () => (text.trim() ? buildScaffold(text, findings) : ''),
    [text, findings],
  );

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(scaffold).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  const active = !!text.trim();
  const dash = RING.c * (1 - score / 100);

  return (
    <div className={`${styles.console} ${active ? styles.live : ''}`} data-tier={tier}>
      <div className={styles.scan} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.head}>
        <span className={styles.pulse} aria-hidden="true" />
        <span className={styles.brand}>PROMPT&nbsp;DOCTOR</span>
        <span className={styles.ver}>diagnostic console · v1 · local-only</span>
      </header>

      <div className={styles.toolbar}>
        <span className={styles.kicker}>Paste a prompt — analyzed in your browser, nothing transmitted.</span>
        <span className={styles.samples}>
          <button className={styles.ghost} onClick={() => setText(SAMPLE_WEAK)}>weak sample</button>
          <button className={styles.ghost} onClick={() => setText(SAMPLE_STRONG)}>strong sample</button>
          {text && <button className={styles.ghost} onClick={() => setText('')}>clear</button>}
        </span>
      </div>

      <textarea
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="> write something good about our new app and make it engaging"
        spellCheck={false}
      />

      {active && (
        <>
          <div className={styles.readout}>
            <div className={styles.gauge}>
              <svg viewBox="0 0 120 120" className={styles.ring}>
                <defs>
                  <linearGradient id="pd-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" className={styles.gradA} />
                    <stop offset="100%" className={styles.gradB} />
                  </linearGradient>
                  <filter id="pd-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3.2" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="60" cy="60" r={RING.r} className={styles.track} />
                <circle
                  cx="60"
                  cy="60"
                  r={RING.r}
                  className={styles.prog}
                  stroke="url(#pd-grad)"
                  filter="url(#pd-glow)"
                  strokeDasharray={RING.c}
                  strokeDashoffset={dash}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="58" className={styles.gradeTxt}>{grade}</text>
                <text x="60" y="78" className={styles.pctTxt}>{score} / 100</text>
              </svg>
            </div>
            <div className={styles.verdict}>
              <span className={styles.verdictTag}>
                {tier === 'good' ? 'SIGNAL STRONG' : tier === 'mid' ? 'SIGNAL PARTIAL' : 'SIGNAL DEGRADED'}
              </span>
              <p className={styles.summary}>
                {tier === 'good'
                  ? 'Solid prompt. Tighten the flagged items and ship it.'
                  : tier === 'mid'
                    ? 'Workable, but leaving quality on the table. Tune the amber items.'
                    : 'High-risk prompt — Claude has to guess. Resolve the critical items first.'}
              </p>
            </div>
          </div>

          <ul className={styles.findings}>
            {findings.map((f, i) => (
              <li
                key={f.id}
                className={`${styles.finding} ${styles[f.status]}`}
                style={{animationDelay: `${i * 55}ms`}}
              >
                <span className={styles.badge} aria-label={LABEL[f.status]}>{ICON[f.status]}</span>
                <div className={styles.fbody}>
                  <div className={styles.ftitle}>
                    {f.title} <span className={styles.fstatus}>{LABEL[f.status]}</span>
                  </div>
                  <div className={styles.fdetail}>{f.detail}</div>
                  {f.status !== 'pass' && f.status !== 'na' && (
                    <div className={styles.ffix}>
                      {f.fix} <a href={f.doc.href}>{f.doc.text} →</a>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.scaffoldBox}>
            <div className={styles.scaffoldHead}>
              <strong>⟢ reconstructed scaffold</strong>
              <button className={styles.copy} onClick={copy}>{copied ? 'copied ✓' : 'copy'}</button>
            </div>
            <pre className={styles.scaffold}>{scaffold}</pre>
          </div>
        </>
      )}

      <p className={styles.note}>
        Heuristics, not an oracle — they catch the common failure modes, not every nuance.
        Use the linked pages to go deeper, and always test with a real <a href="/docs/foundations/evals">eval</a>.
      </p>
    </div>
  );
}
