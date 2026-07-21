/**
 * Callout icons — MOVED.
 *
 * The eight markers that used to be drawn here now live in the shared set at
 * `src/components/icons/index.tsx`, so every component on the site draws from
 * one source of truth and the glyphs can never drift apart. This file is kept
 * only as a compatibility shim for `./icons` imports inside Callout.
 *
 * New code should import from '@site/src/components/icons' directly.
 */

export * from '@site/src/components/icons';

/**
 * Legacy alias: Callout's own index.tsx types its variant table with
 * `CalloutIconProps`. It is the shared `IconProps`, nothing more.
 */
export type {IconProps as CalloutIconProps} from '@site/src/components/icons';
