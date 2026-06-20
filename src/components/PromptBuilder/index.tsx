import React, {useState, type ReactNode} from 'react';
import styles from './styles.module.css';

/**
 * Interactive prompt builder — teaches the "be clear and direct" structure by
 * letting the reader assemble a real prompt live. 100% client-side, no API.
 */
export default function PromptBuilder(): ReactNode {
  const [role, setRole] = useState('');
  const [task, setTask] = useState('');
  const [context, setContext] = useState('');
  const [format, setFormat] = useState('');
  const [tone, setTone] = useState('');
  const [idk, setIdk] = useState(true);
  const [copied, setCopied] = useState(false);

  const lines: string[] = [];
  if (role.trim()) lines.push(`You are ${role.trim()}.`);
  lines.push(`Task: ${task.trim() || '<what you want done>'}`);
  if (context.trim()) lines.push(`Context: ${context.trim()}`);
  if (format.trim()) lines.push(`Format: ${format.trim()}`);
  if (tone.trim()) lines.push(`Tone: ${tone.trim()}`);
  if (idk) lines.push(`If you're unsure or lack the information, say so instead of guessing.`);
  const prompt = lines.join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    placeholder: string,
  ) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
      />
    </label>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {field('Role (optional)', role, setRole, 'a meticulous copy editor')}
        {field('Goal', task, setTask, 'rewrite this paragraph to be clearer')}
        {field('Context', context, setContext, 'audience: busy execs; product: …')}
        {field('Format', format, setFormat, '3 bullets, under 80 words')}
        {field('Tone', tone, setTone, 'professional, warm, concise')}
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" checked={idk} onChange={(e) => setIdk(e.target.checked)} />
        Allow “I don't know” (reduces made-up answers)
      </label>
      <div className={styles.outHead}>
        <span>Your prompt</span>
        <button className={styles.copy} onClick={copy} type="button">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className={styles.out}>{prompt}</pre>
    </div>
  );
}
