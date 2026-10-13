/**
 * Page actions for every docs page:
 *
 *  - <CopyMarkdown/>  under the title: copies the page as Markdown, ready to
 *    paste into a chat or a file. The text comes from the `.md` copy that
 *    scripts/build-md-mirror.mjs publishes next to each page.
 *  - <ShareRow/>      at the end of the article: plain links to share the page,
 *    a "copy link" button, and the system share sheet on touch devices.
 *  - <SocialImage/>   no UI: points og:image at this page's own preview card,
 *    which scripts/build-og.mjs renders at build time.
 *
 * All three are mounted by src/theme/DocItem/Layout, so they exist on docs
 * pages only. They add no third-party script: sharing is ordinary links.
 *
 * Hydration: the server and the first client render are identical. Anything
 * that depends on the browser (clipboard support, the share sheet) is decided
 * in an effect or inside an event handler.
 */

import React, {createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode} from 'react';
import Head from '@docusaurus/Head';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {CheckIcon, ClipboardIcon, LinkIcon, ShareIcon} from '@site/src/components/icons';
import styles from './styles.module.css';

/**
 * True inside a docs page. The MDX `h1` mapping runs for every Markdown file on
 * the site, including standalone pages that have no doc behind them, so
 * <TitleActions/> checks this before touching anything doc-specific.
 */
export const PageActionsContext = createContext(false);

/** How long a "Copied" confirmation stays before the button resets. */
const CONFIRM_MS = 2400;
/** A copy faster than this never shows "Copying…", so it cannot flicker. */
const BUSY_DELAY_MS = 200;

/** Addresses derived from the current doc. `route` is the same in every locale. */
function usePage() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const {metadata} = useDoc();
  const permalink = metadata.permalink.replace(/\/$/, '');
  // The default locale is served from the root; the others add "<code>/".
  const rootBase =
    i18n.currentLocale === i18n.defaultLocale
      ? siteConfig.baseUrl
      : siteConfig.baseUrl.slice(0, -(i18n.currentLocale.length + 1));
  const route = permalink.slice(siteConfig.baseUrl.length);
  // A page not yet translated is rendered from the English source, and only
  // translated pages get a Markdown copy in their locale (build-md-mirror.mjs).
  const hasOwnCopy = i18n.currentLocale === i18n.defaultLocale || metadata.source.startsWith('@site/i18n/');
  return {
    title: metadata.title,
    pageUrl: `${siteConfig.url}${permalink}`,
    markdownUrl: hasOwnCopy ? `${permalink}.md` : `${rootBase}${route}.md`,
    imageUrl: `${siteConfig.url}${rootBase}og/${route}.png`,
  };
}

/** Clears pending timers on unmount and on demand. */
function useTimers() {
  const ids = useRef<number[]>([]);
  const clear = useCallback(() => {
    ids.current.forEach((id) => window.clearTimeout(id));
    ids.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    ids.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => clear, [clear]);
  return {after, clear};
}

/**
 * Writes text that may still be loading. A promise-valued ClipboardItem keeps
 * the click's user activation alive while the text arrives; Safari rejects a
 * plain writeText() made after an await.
 */
async function writeWhenReady(pending: Promise<string>): Promise<void> {
  const clipboard = navigator.clipboard;
  if (!clipboard) {
    throw new Error('Clipboard unavailable');
  }
  if (typeof ClipboardItem !== 'undefined' && typeof clipboard.write === 'function') {
    try {
      const blob = pending.then((text) => new Blob([text], {type: 'text/plain'}));
      await clipboard.write([new ClipboardItem({'text/plain': blob})]);
      return;
    } catch {
      // Some browsers accept only resolved values here: fall through.
    }
  }
  await clipboard.writeText(await pending);
}

export function SocialImage(): ReactNode {
  const {imageUrl} = usePage();
  return (
    <Head>
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
}

type CopyState = 'idle' | 'busy' | 'done' | 'error';

export function CopyMarkdown(): ReactNode {
  const {markdownUrl} = usePage();
  const [state, setState] = useState<CopyState>('idle');
  const [loaded, setLoaded] = useState(false);
  const pending = useRef<Promise<string> | null>(null);
  const running = useRef(false);
  const {after, clear} = useTimers();

  // Start fetching on hover or focus, so the click itself is instant.
  const load = useCallback(() => {
    if (!pending.current) {
      const request = fetch(markdownUrl).then(async (response) => {
        if (!response.ok) {
          throw new Error(`${response.status} for ${markdownUrl}`);
        }
        const text = await response.text();
        setLoaded(true);
        return text;
      });
      // A failed request is forgotten, so the next attempt retries.
      request.catch(() => {
        pending.current = null;
      });
      pending.current = request;
    }
    return pending.current;
  }, [markdownUrl]);

  const copy = useCallback(async () => {
    if (running.current) {
      return;
    }
    running.current = true;
    clear();
    after(BUSY_DELAY_MS, () => setState('busy'));
    try {
      await writeWhenReady(load());
      clear();
      setState('done');
      after(CONFIRM_MS, () => setState('idle'));
    } catch {
      clear();
      setState('error');
    } finally {
      running.current = false;
    }
  }, [after, clear, load]);

  const label = {
    idle: translate({id: 'pageActions.copyMarkdown', message: 'Copy as Markdown', description: 'Page actions: button that copies the page as Markdown'}),
    busy: translate({id: 'pageActions.copying', message: 'Copying…', description: 'Page actions: button label while the Markdown is loading'}),
    done: translate({id: 'pageActions.copied', message: 'Copied', description: 'Page actions: button label after a successful copy'}),
    error: translate({id: 'pageActions.copyFailed', message: 'Couldn’t copy', description: 'Page actions: button label after a failed copy'}),
  }[state];

  const announcement = {
    idle: '',
    busy: '',
    done: translate({id: 'pageActions.copiedAnnouncement', message: 'Page copied to the clipboard as Markdown.', description: 'Page actions: screen-reader announcement after copying the page'}),
    error: translate({id: 'pageActions.copyFailedAnnouncement', message: 'The page could not be copied.', description: 'Page actions: screen-reader announcement after a failed copy'}),
  }[state];

  return (
    <div className={styles.top}>
      <button
        type="button"
        className={styles.action}
        data-state={state}
        aria-busy={state === 'busy'}
        onClick={copy}
        onPointerEnter={load}
        onFocus={load}>
        {state === 'done' ? <CheckIcon className={styles.icon} /> : <ClipboardIcon className={styles.icon} />}
        <span>{label}</span>
      </button>
      {/* Offered only when the text did load: then the clipboard is what failed. */}
      {state === 'error' && loaded && (
        <a className={styles.fallback} href={markdownUrl} target="_blank" rel="noopener noreferrer">
          {translate({id: 'pageActions.openMarkdown', message: 'Open the Markdown instead', description: 'Page actions: link shown when copying to the clipboard failed'})}
        </a>
      )}
      <span className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

/**
 * The copy button, for pages whose title is an `# H1` written in the Markdown.
 * There the title is part of the content, so the layout cannot place anything
 * right under it; the `h1` mapping in src/theme/MDXComponents renders this
 * instead. Pages titled from front matter get <CopyMarkdown/> from the layout.
 */
export function TitleActions(): ReactNode {
  return useContext(PageActionsContext) ? <CopyMarkdown /> : null;
}

type LinkState = 'idle' | 'done' | 'error';

export function ShareRow(): ReactNode {
  const {title, pageUrl} = usePage();
  const labelId = useId();
  const [linkState, setLinkState] = useState<LinkState>('idle');
  const [hasShareSheet, setHasShareSheet] = useState(false);
  const {after, clear} = useTimers();

  useEffect(() => {
    // On desktop the system dialog adds nothing to the links below.
    setHasShareSheet(typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const copyLink = useCallback(async () => {
    clear();
    try {
      await navigator.clipboard.writeText(pageUrl);
      setLinkState('done');
    } catch {
      setLinkState('error');
    }
    after(CONFIRM_MS, () => setLinkState('idle'));
  }, [after, clear, pageUrl]);

  const openShareSheet = useCallback(() => {
    // Dismissing the sheet rejects the promise; that is not an error to report.
    navigator.share({title, url: pageUrl}).catch(() => {});
  }, [title, pageUrl]);

  const url = encodeURIComponent(pageUrl);
  const text = encodeURIComponent(title);
  const networks = [
    {name: 'X', href: `https://x.com/intent/post?text=${text}&url=${url}`},
    {name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`},
    {name: 'Reddit', href: `https://www.reddit.com/submit?url=${url}&title=${text}`},
    {name: 'Hacker News', href: `https://news.ycombinator.com/submitlink?u=${url}&t=${text}`},
  ];

  const linkLabel = {
    idle: translate({id: 'pageActions.copyLink', message: 'Copy link', description: 'Page actions: button that copies the page address'}),
    done: translate({id: 'pageActions.linkCopied', message: 'Link copied', description: 'Page actions: button label after the address was copied'}),
    error: translate({id: 'pageActions.copyFailed', message: 'Couldn’t copy', description: 'Page actions: button label after a failed copy'}),
  }[linkState];

  return (
    <div className={styles.share} role="group" aria-labelledby={labelId}>
      <p id={labelId} className={styles.shareLabel}>
        {translate({id: 'pageActions.shareLabel', message: 'Share this page', description: 'Page actions: label of the share row at the end of a page'})}
      </p>
      <ul className={styles.list}>
        {networks.map((network) => (
          <li key={network.name}>
            <a
              className={styles.action}
              href={network.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={translate(
                {id: 'pageActions.shareOn', message: 'Share on {network} (opens in a new tab)', description: 'Page actions: accessible name of a share link'},
                {network: network.name},
              )}>
              {network.name}
            </a>
          </li>
        ))}
        <li>
          <button type="button" className={styles.action} data-state={linkState} onClick={copyLink}>
            {linkState === 'done' ? <CheckIcon className={styles.icon} /> : <LinkIcon className={styles.icon} />}
            <span>{linkLabel}</span>
          </button>
        </li>
        {hasShareSheet && (
          <li>
            <button type="button" className={styles.action} onClick={openShareSheet}>
              <ShareIcon className={styles.icon} />
              <span>{translate({id: 'pageActions.shareSheet', message: 'More…', description: 'Page actions: button that opens the system share sheet on touch devices'})}</span>
            </button>
          </li>
        )}
      </ul>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {linkState === 'done'
          ? translate({id: 'pageActions.linkCopiedAnnouncement', message: 'Page address copied to the clipboard.', description: 'Page actions: screen-reader announcement after copying the address'})
          : ''}
      </span>
    </div>
  );
}
