import React, {useId, useState, type ReactNode} from 'react';
import {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

export interface Flashcard {
  /** The prompt / term shown first (e.g. "MCP"). */
  front: ReactNode;
  /** The answer / definition revealed on flip. */
  back: ReactNode;
}

export interface FlashcardsProps {
  /** Ordered deck of cards. Order is preserved (deterministic, SSR-safe). */
  cards: Flashcard[];
  /** Optional deck heading shown above the card. */
  title?: ReactNode;
}

const clamp = (n: number, max: number): number =>
  Math.max(0, Math.min(n, Math.max(0, max)));

/**
 * Flashcards — a small, deterministic study deck for glossary terms & concepts.
 *
 * - One card at a time, click / Enter / Space to flip (front = term, back = def).
 * - Prev / Next controls + "x / N" counter + a progress bar.
 * - Flip + index live in plain React state → first server render === first
 *   client render (no Math.random / Date / window during render → no React #418).
 * - prefers-reduced-motion: handled purely in CSS (instant swap, no 3D spin).
 */
export default function Flashcards({cards, title}: FlashcardsProps): ReactNode {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const baseId = useId();

  const total = Array.isArray(cards) ? cards.length : 0;

  if (total === 0) {
    return (
      <div className={styles.empty} role="note">
        {translate({
          id: 'flashcards.empty',
          message: 'No cards yet — add some to start studying. 🃏',
        })}
      </div>
    );
  }

  // Defensive clamp keeps state valid even if `cards` shrinks between renders.
  const current = clamp(index, total - 1);
  const card = cards[current];
  const isLast = current === total - 1;
  const progress = ((current + 1) / total) * 100;
  const cardId = `${baseId}-card`;

  const go = (next: number) => {
    setFlipped(false); // always land on the term side after navigating
    setIndex(clamp(next, total - 1));
  };
  const flip = () => setFlipped((f) => !f);

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      flip();
    }
  };

  const flipLabel = flipped
    ? translate({id: 'flashcards.showTerm', message: 'Show term'})
    : translate({id: 'flashcards.showDefinition', message: 'Show definition'});

  const counterText = translate(
    {id: 'flashcards.counter', message: '{current} / {total}'},
    {current: current + 1, total},
  );

  return (
    <section
      className={styles.deck}
      aria-roledescription={translate({
        id: 'flashcards.roledescription',
        message: 'Flashcard deck',
      })}
      aria-label={
        typeof title === 'string'
          ? title
          : translate({id: 'flashcards.deckLabel', message: 'Flashcards'})
      }>
      {title ? <div className={styles.title}>{title}</div> : null}

      {/* The card itself is the flip control: a real button, keyboard-operable. */}
      <button
        type="button"
        className={styles.card}
        data-flipped={flipped ? 'true' : 'false'}
        onClick={flip}
        onKeyDown={onCardKeyDown}
        aria-pressed={flipped}
        aria-label={flipLabel}
        aria-describedby={cardId}>
        <span className={styles.flipHint} aria-hidden="true">
          {flipped ? '↩ term' : 'tap to flip ✨'}
        </span>
        <span className={styles.inner} id={cardId}>
          {/* Both faces are always in the DOM so screen-reader users and the
              :live region get the full content; aria-hidden mirrors what's
              visually facing the reader. */}
          <span
            className={`${styles.face} ${styles.front}`}
            aria-hidden={flipped}>
            <span className={styles.faceTag}>
              {translate({id: 'flashcards.term', message: 'Term'})}
            </span>
            <span className={styles.faceBody}>{card.front}</span>
          </span>
          <span className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
            <span className={styles.faceTag}>
              {translate({id: 'flashcards.definition', message: 'Definition'})}
            </span>
            <span className={styles.faceBody}>{card.back}</span>
          </span>
        </span>
      </button>

      {/* Polite live region announces which face is shown after a flip. */}
      <span className={styles.srOnly} aria-live="polite">
        {flipped
          ? translate({id: 'flashcards.liveBack', message: 'Definition shown.'})
          : translate({id: 'flashcards.liveFront', message: 'Term shown.'})}
      </span>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(current - 1)}
          disabled={current === 0}
          aria-label={translate({
            id: 'flashcards.prev',
            message: 'Previous card',
          })}>
          <span aria-hidden="true">←</span>
          <span className={styles.btnLabel}>
            {translate({id: 'flashcards.prevShort', message: 'Prev'})}
          </span>
        </button>

        <div
          className={styles.counter}
          role="status"
          aria-label={translate(
            {
              id: 'flashcards.counterLabel',
              message: 'Card {current} of {total}',
            },
            {current: current + 1, total},
          )}>
          <span className={styles.counterText}>{counterText}</span>
          <span className={styles.progressTrack} aria-hidden="true">
            <span
              className={styles.progressFill}
              style={{width: `${progress}%`}}
            />
          </span>
        </div>

        <button
          type="button"
          className={styles.navBtn}
          onClick={() => go(current + 1)}
          disabled={isLast}
          aria-label={translate({id: 'flashcards.next', message: 'Next card'})}>
          <span className={styles.btnLabel}>
            {isLast
              ? translate({id: 'flashcards.doneShort', message: 'Done 🎉'})
              : translate({id: 'flashcards.nextShort', message: 'Next'})}
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
