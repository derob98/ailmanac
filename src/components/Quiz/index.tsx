import React, {useId, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

export interface QuizQuestion {
  /** The question prompt shown above the options. */
  q: string;
  /** The answer choices, in display order. */
  options: string[];
  /** Zero-based index into `options` of the correct answer. */
  answer: number;
  /** Optional explanation revealed after the question is answered. */
  explain?: string;
}

export interface QuizProps {
  /** The questions to ask. Rendered in the order given (no shuffle on render). */
  questions: QuizQuestion[];
  /** Optional card title. Defaults to a localized "Check yourself". */
  title?: string;
}

// One per question: -1 means "not yet answered", otherwise the chosen index.
type Picks = number[];

function band(score: number, total: number): {emoji: string; line: string} {
  // Deterministic — never random. Pure function of score/total.
  const pct = total === 0 ? 0 : score / total;
  if (pct === 1) {
    return {
      emoji: '🏆',
      line: translate({id: 'quiz.band.perfect', message: 'Flawless. You really know this.'}),
    };
  }
  if (pct >= 0.6) {
    return {
      emoji: '✨',
      line: translate({id: 'quiz.band.good', message: 'almost there!'}),
    };
  }
  return {
    emoji: '🌱',
    line: translate({id: 'quiz.band.keepGoing', message: 'keep going — a quick re-read will nail it.'}),
  };
}

export default function Quiz({questions, title}: QuizProps): ReactNode {
  const baseId = useId();
  const list = Array.isArray(questions) ? questions : [];
  const total = list.length;

  // Initialised to "all unanswered". State only changes on user click — the
  // first server render and first client render produce identical markup.
  const [picks, setPicks] = useState<Picks>(() => Array(total).fill(-1));

  const heading =
    title ?? translate({id: 'quiz.title', message: 'Check yourself'});

  if (total === 0) {
    return (
      <div className={styles.wrap} role="group" aria-label={heading}>
        <div className={styles.head}>
          <span className={styles.kicker} aria-hidden="true">
            🧠
          </span>
          <h3 className={styles.title}>{heading}</h3>
        </div>
        <p className={styles.empty}>
          {translate({id: 'quiz.empty', message: 'No questions provided.'})}
        </p>
      </div>
    );
  }

  const answeredCount = picks.filter((p) => p >= 0).length;
  const score = picks.reduce(
    (acc, pick, i) => acc + (pick >= 0 && pick === list[i].answer ? 1 : 0),
    0,
  );
  const allDone = answeredCount === total;

  function choose(qi: number, oi: number) {
    setPicks((prev) => {
      if (prev[qi] >= 0) return prev; // locked once answered
      const next = prev.slice();
      next[qi] = oi;
      return next;
    });
  }

  function reset() {
    setPicks(Array(total).fill(-1));
  }

  const progressLabel = translate(
    {
      id: 'quiz.progress',
      message: 'Answered {done} of {total}',
    },
    {done: String(answeredCount), total: String(total)},
  );

  const result = band(score, total);

  return (
    <div className={styles.wrap} role="group" aria-label={heading}>
      <div className={styles.head}>
        <span className={styles.kicker} aria-hidden="true">
          🧠
        </span>
        <h3 className={styles.title}>{heading}</h3>
        <span className={styles.count} aria-label={progressLabel}>
          {answeredCount}/{total}
        </span>
      </div>

      <ol className={styles.questions}>
        {list.map((question, qi) => {
          const pick = picks[qi];
          const locked = pick >= 0;
          const groupId = `${baseId}-q${qi}`;
          const promptId = `${groupId}-prompt`;
          return (
            <li key={qi} className={styles.question}>
              <fieldset className={styles.fieldset}>
                <legend id={promptId} className={styles.prompt}>
                  <span className={styles.qnum} aria-hidden="true">
                    {qi + 1}
                  </span>
                  <span>{question.q}</span>
                </legend>
                <div className={styles.options} role="group" aria-labelledby={promptId}>
                  {question.options.map((opt, oi) => {
                    const isCorrect = oi === question.answer;
                    const isChosen = pick === oi;
                    // After locking: highlight the correct answer + the wrong pick.
                    const state = !locked
                      ? ''
                      : isCorrect
                        ? styles.correct
                        : isChosen
                          ? styles.wrong
                          : styles.muted;
                    const mark = !locked
                      ? null
                      : isCorrect
                        ? '✓'
                        : isChosen
                          ? '✗'
                          : null;
                    return (
                      <button
                        key={oi}
                        type="button"
                        className={`${styles.option} ${state}`}
                        onClick={() => choose(qi, oi)}
                        disabled={locked}
                        aria-pressed={isChosen}
                        aria-disabled={locked}>
                        <span className={styles.optText}>{opt}</span>
                        {mark && (
                          <span className={styles.mark} aria-hidden="true">
                            {mark}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {locked && (
                  <div
                    className={`${styles.feedback} ${pick === question.answer ? styles.feedbackOk : styles.feedbackNo}`}
                    role="status">
                    <strong className={styles.verdict}>
                      {pick === question.answer
                        ? translate({id: 'quiz.correct', message: 'Correct'})
                        : translate({id: 'quiz.incorrect', message: 'Not quite'})}
                    </strong>
                    {question.explain && (
                      <span className={styles.explain}>{question.explain}</span>
                    )}
                  </div>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <div className={styles.result} role="status">
          <p className={styles.resultLine}>
            <span className={styles.resultEmoji} aria-hidden="true">
              {result.emoji}
            </span>
            <span className={styles.resultScore}>
              {score}/{total}
            </span>
            <span className={styles.resultText}>
              {score === total ? result.line : `— ${result.line}`}
            </span>
          </p>
          <button type="button" className={styles.reset} onClick={reset}>
            {translate({id: 'quiz.tryAgain', message: 'Try again'})}
          </button>
        </div>
      )}
    </div>
  );
}
