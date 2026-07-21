import React, {type ReactNode} from 'react';

/**
 * Shared icon set — hand-authored, dependency-free inline SVG markers.
 *
 * This is the ONE source of truth for every glyph on the site. Import from
 * '@site/src/components/icons'; never re-draw a mark locally, or the set drifts.
 *
 * Design contract (must hold for every icon in this file):
 *  - 24x24 viewBox, geometry drawn on a 24px grid, ~1.8 stroke weight so the
 *    marks match the house sparkle in src/theme/DocCard/index.tsx.
 *  - Colour is inherited: `stroke="currentColor"` / `fill="currentColor"`.
 *    Callers tint by setting `color` on the wrapper (or via `className`).
 *  - NO `id`, NO `<defs>`, NO gradients, NO `<use>` — the same icon renders many
 *    times per page and duplicate ids would collide in the document.
 *  - `aria-hidden="true"` + `focusable="false"`: every mark here is decorative.
 *    When a glyph carries meaning the surrounding copy does NOT (correct vs
 *    wrong, status colour), the CALLER must supply the accessible text — e.g. a
 *    visually-hidden <span> next to the icon. Never drop the aria-hidden here:
 *    an icon cannot know its own context.
 *  - Pure, stateless, prop-less function components (only `className`):
 *    identical output on the server and on the client, so they can never cause
 *    a hydration mismatch (React #418/#425). No Date/Math.random/window.
 *  - Geometry only — no `left`/`right` assumptions in CSS. The one directional
 *    mark (ArrowRightIcon) is mirrored by the caller's stylesheet under
 *    [dir='rtl'].
 */

/** Shared props for every marker: only a class hook, nothing stateful. */
export interface IconProps {
  className?: string;
}

/** Attributes every icon shares — keeps the components honest and identical. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: 'false' as const,
};

/** Stroke defaults: round joins give the set its soft, drawn-by-hand weight. */
const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ── Header glyphs ───────────────────────────────────────────────────────── */

/** Target / bullseye — "objectives" header. Concentric rings + centre pip. */
export function TargetIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.2" {...stroke} />
      <circle cx="12" cy="12" r="4.4" {...stroke} />
      <circle cx="12" cy="12" r="1.35" fill="currentColor" />
    </svg>
  );
}

/** Lightbulb — "takeaways" header. Dome, neck, and two filament lines. */
export function LightbulbIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path
        d="M12 3a6 6 0 0 0-3.6 10.8c.6.45.95 1.1 1 1.85l.05.85h5.1l.05-.85c.05-.75.4-1.4 1-1.85A6 6 0 0 0 12 3z"
        {...stroke}
      />
      <path d="M10 19h4" {...stroke} />
      <path d="M10.8 21.2h2.4" {...stroke} />
    </svg>
  );
}

/** Four-point sparkle — "tip" header. Same silhouette as the DocCard spark. */
export function SparkleIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path
        d="M12 3.7l1.55 4.55a3.6 3.6 0 0 0 2.2 2.2L20.3 12l-4.55 1.55a3.6 3.6 0 0 0-2.2 2.2L12 20.3l-1.55-4.55a3.6 3.6 0 0 0-2.2-2.2L3.7 12l4.55-1.55a3.6 3.6 0 0 0 2.2-2.2L12 3.7z"
        {...stroke}
      />
    </svg>
  );
}

/** Warning triangle — "warning" header. Rounded triangle, bar and dot. */
export function WarningIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path
        d="M12 4.1c.62 0 1.19.33 1.5.87l7.02 12.2a1.73 1.73 0 0 1-1.5 2.6H4.98a1.73 1.73 0 0 1-1.5-2.6L10.5 4.97c.31-.54.88-.87 1.5-.87z"
        {...stroke}
      />
      <path d="M12 9.7v4.2" {...stroke} />
      <circle cx="12" cy="16.9" r="1.05" fill="currentColor" />
    </svg>
  );
}

/* ── Bullet glyphs ───────────────────────────────────────────────────────── */

/** Check inside a circle — "objectives" checklist bullet. */
export function CheckCircleIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.6" {...stroke} />
      <path d="M8.3 12.2l2.6 2.6 4.8-5.4" {...stroke} />
    </svg>
  );
}

/** Five-point star — "takeaways" bullet. Solid so it holds at small sizes. */
export function StarIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      {/* Exact 10-point polygon: outer r 8.5, inner r 3.75, centred on (12,12.15). */}
      <path
        d="M12 3.65L14.2 9.12L20.08 9.52L15.57 13.31L17 19.03L12 15.9L7 19.03L8.43 13.31L3.92 9.52L9.8 9.12z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Arrow pointing to the inline-end — "tip" bullet.
 * DIRECTIONAL: the consuming stylesheet mirrors it under [dir='rtl'].
 */
export function ArrowRightIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h13.4" {...stroke} />
      <path d="M13.6 7.2l4.8 4.8-4.8 4.8" {...stroke} />
    </svg>
  );
}

/** Ringed dot — "warning" bullet. Symmetric, so no RTL rule is needed. */
export function DotIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3.1" fill="currentColor" />
      <circle cx="12" cy="12" r="6.6" {...stroke} strokeOpacity="0.42" />
    </svg>
  );
}

/* ── Result marks ────────────────────────────────────────────────────────── */

/**
 * Bare checkmark — "done" / "verified".
 * Same tick geometry as CheckCircleIcon, scaled up to fill the box now that
 * there is no ring around it. Decorative: pair it with visually-hidden text
 * whenever it is the only thing saying "correct".
 */
export function CheckIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path d="M4.8 12.5l4.7 4.7 9.7-10.9" {...stroke} />
    </svg>
  );
}

/**
 * X — "wrong answer".
 * Two strokes crossing dead centre, same 5.4 reach as CheckIcon so a check and
 * a cross sitting in adjacent rows read at the same optical size. Decorative:
 * the caller owns the "incorrect" label.
 */
export function CrossIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path d="M6.6 6.6l10.8 10.8" {...stroke} />
      <path d="M17.4 6.6L6.6 17.4" {...stroke} />
    </svg>
  );
}

/**
 * Radial burst — completion / celebration states.
 * Deliberately NOT a party-popper pictogram: a popper is a lumpy silhouette
 * that turns to mush at 16px and points in a direction (bad in RTL). This is a
 * symmetric 8-ray burst around a solid pip — same family as SparkleIcon, but
 * unmistakably a different mark. Cardinal rays are long, diagonals short.
 */
export function PartyIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="2.3" fill="currentColor" />
      {/* Cardinal rays: r 4.9 → 9.1 */}
      <path d="M12 7.1V2.9" {...stroke} />
      <path d="M12 16.9v4.2" {...stroke} />
      <path d="M7.1 12H2.9" {...stroke} />
      <path d="M16.9 12h4.2" {...stroke} />
      {/* Diagonal rays: same r 4.9 start, shorter r 7.9 end (offset 3.5 → 5.6) */}
      <path d="M15.5 8.5l2.1-2.1" {...stroke} />
      <path d="M8.5 8.5L6.4 6.4" {...stroke} />
      <path d="M15.5 15.5l2.1 2.1" {...stroke} />
      <path d="M8.5 15.5L6.4 17.6" {...stroke} />
    </svg>
  );
}

/* ── Skill-level marks ───────────────────────────────────────────────────── */

/**
 * Seedling — the "beginner" level mark.
 * Ground line, straight stem, one leaf each side (the larger leaf is purely
 * ornamental asymmetry, it encodes no direction, so RTL needs no mirror).
 */
export function SeedlingIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path d="M8.6 20.5h6.8" {...stroke} />
      <path d="M12 20.5v-7.4" {...stroke} />
      <path d="M12 13.1c0-3 2.4-5.4 5.4-5.4 0 3-2.4 5.4-5.4 5.4z" {...stroke} />
      <path
        d="M12 15.4c0-2.4-1.9-4.3-4.3-4.3 0 2.4 1.9 4.3 4.3 4.3z"
        {...stroke}
      />
    </svg>
  );
}

/**
 * Brain — the "intermediate" level mark.
 * Two mirrored lobes hinged on a central stem, plus one fold arc per side.
 * Detail is kept to six strokes so the silhouette survives at 16px.
 */
export function BrainIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path d="M12 5.1v13.5" {...stroke} />
      <path
        d="M12 5.1a3.1 3.1 0 0 0-4.9 2 2.8 2.8 0 0 0-1.4 4.8 2.9 2.9 0 0 0 1.9 4.6 3 3 0 0 0 4.4 2.1"
        {...stroke}
      />
      <path
        d="M12 5.1a3.1 3.1 0 0 1 4.9 2 2.8 2.8 0 0 1 1.4 4.8 2.9 2.9 0 0 1-1.9 4.6 3 3 0 0 1-4.4 2.1"
        {...stroke}
      />
      <path d="M9.6 10.5a2.3 2.3 0 0 0 0 3.2" {...stroke} />
      <path d="M14.4 10.5a2.3 2.3 0 0 1 0 3.2" {...stroke} />
    </svg>
  );
}

/**
 * Trophy — the "advanced" level mark.
 * Cup with a flat rim, a handle each side, short stem and a trapezoid foot.
 * Fully symmetric about x=12, so it never needs an RTL flip.
 */
export function TrophyIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <path d="M7.4 4.5h9.2v4.9a4.6 4.6 0 0 1-9.2 0z" {...stroke} />
      <path d="M7.4 5.9H5.6a2.5 2.5 0 0 0 2.5 2.5" {...stroke} />
      <path d="M16.6 5.9h1.8a2.5 2.5 0 0 1-2.5 2.5" {...stroke} />
      <path d="M12 14v3.5" {...stroke} />
      <path d="M8.6 19.9l1.2-2.4h4.4l1.2 2.4z" {...stroke} />
    </svg>
  );
}

/* ── Status ──────────────────────────────────────────────────────────────── */

/**
 * Solid dot — status indicator.
 * No stroke and no ring, so the whole mark takes the inherited colour: callers
 * tint it by passing a `className` that sets `color`. Decorative by contract —
 * colour alone is never an accessible signal, so the caller must ship text.
 */
export function CircleIcon({className}: IconProps): ReactNode {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4.8" fill="currentColor" />
    </svg>
  );
}
