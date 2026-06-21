import React, {useState, type ReactNode} from 'react';
import Translate, {translate} from '@docusaurus/Translate';
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
        {field(
          translate({id: 'pb.role', message: 'Role (optional)'}),
          role, setRole,
          translate({id: 'pb.role.ph', message: 'a meticulous copy editor'}),
        )}
        {field(
          translate({id: 'pb.goal', message: 'Goal'}),
          task, setTask,
          translate({id: 'pb.goal.ph', message: 'rewrite this paragraph to be clearer'}),
        )}
        {field(
          translate({id: 'pb.context', message: 'Context'}),
          context, setContext,
          translate({id: 'pb.context.ph', message: 'audience: busy execs; product: …'}),
        )}
        {field(
          translate({id: 'pb.format', message: 'Format'}),
          format, setFormat,
          translate({id: 'pb.format.ph', message: '3 bullets, under 80 words'}),
        )}
        {field(
          translate({id: 'pb.tone', message: 'Tone'}),
          tone, setTone,
          translate({id: 'pb.tone.ph', message: 'professional, warm, concise'}),
        )}
      </div>
      <label className={styles.toggle}>
        <input type="checkbox" checked={idk} onChange={(e) => setIdk(e.target.checked)} />
        <Translate id="pb.idk">Allow “I don't know” (reduces made-up answers)</Translate>
      </label>
      <div className={styles.outHead}>
        <span><Translate id="pb.output">Your prompt</Translate></span>
        <button className={styles.copy} onClick={copy} type="button">
          {copied
            ? translate({id: 'pb.copied', message: '✓ Copied'})
            : translate({id: 'pb.copy', message: 'Copy'})}
        </button>
      </div>
      <pre className={styles.out}>{prompt}</pre>
    </div>
  );
}
