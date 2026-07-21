import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// ─────────────────────────────────────────────────────────────────────────────
// Deployment placeholders — replace ORG (and optionally DOMAIN) at scaffold time.
// For a GitHub Pages project site the live URL is https://<ORG>.github.io/<REPO>/
// If you set up a custom domain, change URL to it and BASE_URL to '/'.
// ─────────────────────────────────────────────────────────────────────────────
const ORG = 'derob98'; // TODO: replace with your GitHub username/org
const REPO = 'ailmanac';
const GITHUB_URL = `https://github.com/${ORG}/${REPO}`;
const SITE_URL = `https://${ORG}.github.io`;
const BASE_URL = `/${REPO}/`;

const config: Config = {
  title: 'AILmanac',
  tagline:
    'The always-current almanac for getting the most out of Claude — and every AI.',
  favicon: 'img/logo.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: SITE_URL,
  baseUrl: BASE_URL,

  organizationName: ORG,
  projectName: REPO,

  // Quality gates: dead internal links / anchors fail the build before merge.
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  // Mermaid diagrams (themeable, translatable, more accessible than image diagrams).
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  // Structured data (JSON-LD) so search engines understand the site — helps
  // rich results and discoverability.
  headTags: [
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'AILmanac',
        alternateName: 'AI Almanac',
        url: 'https://derob98.github.io/ailmanac/',
        description:
          'The always-current, community-built almanac for getting the most out of Claude and any AI — for all levels.',
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target:
            'https://derob98.github.io/ailmanac/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
  ],

  i18n: {
    // English is the canonical source; every other locale falls back to English
    // for any page not yet translated. Translations are community-driven — see
    // docs/contribute/translation-playbook. Adding a language is one line here.
    defaultLocale: 'en',
    // Top 12 world languages by reach (+ Italian). Adding/removing a language is
    // a one-line change. Untranslated pages fall back to English.
    locales: [
      'en', 'es', 'zh-Hans', 'hi', 'ar', 'pt-BR', 'ru', 'ja', 'de', 'fr', 'it', 'ko',
    ],
    localeConfigs: {
      en: {label: 'English'},
      es: {label: 'Español'},
      'zh-Hans': {label: '简体中文'},
      hi: {label: 'हिन्दी'},
      ar: {label: 'العربية', direction: 'rtl'},
      'pt-BR': {label: 'Português (Brasil)'},
      ru: {label: 'Русский'},
      ja: {label: '日本語'},
      de: {label: 'Deutsch'},
      fr: {label: 'Français'},
      it: {label: 'Italiano'},
      ko: {label: '한국어'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: `${GITHUB_URL}/tree/main/`,
          // Freshness is tracked explicitly via <VerifyNote> stamps and page
          // front-matter, not git timestamps — this keeps builds independent of
          // git history (simpler CI, no shallow-clone gotchas).
        },
        // Blog is disabled for the MVP. It will return in "changelog mode" in
        // Phase 3 to power the What's New / RSS feed.
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    // Offline, zero-dependency local search. Swap for Algolia DocSearch in Phase 2.
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/og-default.png',
    announcementBar: {
      id: 'star-us',
      content:
        '⭐ If AILmanac helps you, <a target="_blank" rel="noopener" href="https://github.com/derob98/ailmanac">star it on GitHub</a> and share it — help it become the go-to AI field guide.',
      backgroundColor: '#4f46e5',
      textColor: '#ffffff',
      isCloseable: true,
    },
    metadata: [
      {
        name: 'keywords',
        content:
          'Claude, Anthropic, Claude Code, AI, LLM, prompt engineering, MCP, AI guide, AI tutorial',
      },
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'AILmanac',
      logo: {
        alt: 'AILmanac logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          // A dropdown (NOT a docSidebar link): on mobile the drawer EXPANDS this
          // in place on first tap to show the doc index, instead of navigating
          // away and closing. On desktop it's a hover menu of the sections.
          type: 'dropdown',
          label: 'Guide',
          position: 'left',
          items: [
            {label: 'Start Here', to: '/docs/start-here'},
            {label: 'AI Foundations', to: '/docs/foundations'},
            {label: 'Prompting', to: '/docs/prompting'},
            {label: 'Claude.ai & Apps', to: '/docs/claude-app'},
            {label: 'Claude Code', to: '/docs/claude-code'},
            {label: 'Claude API & Building', to: '/docs/api'},
            {label: 'AI Models & Assistants', to: '/docs/models'},
            {label: 'Playbooks', to: '/docs/playbooks'},
            {label: 'Walkthroughs', to: '/docs/walkthroughs'},
            {label: 'Templates & Recipes', to: '/docs/templates'},
            {label: 'Security & Responsible Use', to: '/docs/security'},
            {label: 'Power User', to: '/docs/power-user'},
            {label: 'Frontiers', to: '/docs/frontiers'},
            {label: 'Contribute', to: '/docs/contribute'},
          ],
        },
        {
          // Kept right-positioned for the desktop top bar, but placed EARLY in
          // this array so the mobile drawer (which renders items in array
          // order) shows the language switcher right under "Guide" — users
          // were not finding it buried mid-list.
          type: 'localeDropdown',
          position: 'right',
          className: 'navbar-locale-dropdown',
        },
        {
          to: '/docs/start-here/welcome',
          label: 'Start Here',
          position: 'left',
        },
        {
          to: '/docs/tools',
          label: '🧰 Tools',
          position: 'left',
        },
        {
          to: '/docs/whats-new/models-and-pricing',
          label: "What's New",
          position: 'left',
        },
        {
          href: GITHUB_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Start Here', to: '/docs/start-here/welcome'},
            {label: 'Learning Paths', to: '/docs/start-here/learning-paths'},
            {label: 'Glossary', to: '/docs/start-here/glossary'},
            {label: 'Prompting', to: '/docs/prompting/basics'},
          ],
        },
        {
          title: 'Build',
          items: [
            {label: 'Claude Code', to: '/docs/claude-code/what-is-claude-code'},
            {label: 'Claude API', to: '/docs/api/first-call'},
            {label: 'Templates & Recipes', to: '/docs/templates/claude-md'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'Contribute', to: '/docs/contribute/contribute-in-10-minutes'},
            {label: 'GitHub', href: GITHUB_URL},
            {label: 'Discussions', href: `${GITHUB_URL}/discussions`},
          ],
        },
      ],
      copyright: `AILmanac is an independent community resource — not affiliated with or endorsed by Anthropic. "Claude" and "Anthropic" are trademarks of Anthropic. Content is CC BY 4.0, code is MIT. © 2026 AILmanac contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      // nightOwl over dracula: dracula's background is #282a36, noticeably
      // lighter and greyer than this site's dark surface (#14161f), so every
      // code block showed a visible seam against the page. nightOwl sits at
      // #011627 — near-black, and its soft-violet keywords / warm-tan strings
      // already lean toward the brand's violet+amber without looking foreign.
      darkTheme: prismThemes.nightOwl,
      additionalLanguages: ['bash', 'python', 'json', 'toml', 'diff', 'yaml'],
    },

    /**
     * Mermaid theming.
     *
     * Two channels, and they are not interchangeable:
     * - `themeVariables` feeds mermaid's internal colour maths (it derives
     *   lighter/darker variants), so those MUST be literal hex — a CSS var()
     *   would break the computation.
     * - `themeCSS` is injected into the light DOM, so var(--ifm-*) resolves
     *   live per [data-theme] there. Since `options` is one shared object
     *   across light and dark, the real per-mode adaptation has to happen
     *   here, with themeVariables as a light-leaning fallback.
     * The container frame itself lives in custom.css.
     */
    mermaid: {
      theme: {light: 'base', dark: 'base'},
      options: {
        fontFamily: "'Inter Variable', 'Inter', system-ui, sans-serif",
        themeVariables: {
          primaryColor: '#eef2ff',
          primaryTextColor: '#312e81',
          primaryBorderColor: '#4f46e5',
          lineColor: '#7c3aed',
          secondaryColor: '#fef3c7',
          tertiaryColor: '#ffffff',
        },
        themeCSS: `
          .node rect, .node polygon, .node circle, .node ellipse {
            fill: var(--ifm-background-surface-color) !important;
            stroke: var(--ifm-color-primary) !important;
            stroke-width: 1.4px !important;
          }
          .nodeLabel, .label { color: var(--ifm-font-color-base) !important; }
          .edgeLabel {
            background-color: var(--ifm-background-color) !important;
            color: var(--ifm-font-color-base) !important;
          }
          .edgePath .path, .flowchart-link {
            stroke: var(--ail-violet) !important;
            stroke-width: 1.6px !important;
          }
          marker { fill: var(--ail-violet) !important; stroke: var(--ail-violet) !important; }
          .cluster rect {
            fill: color-mix(in srgb, var(--ifm-color-primary) 6%, transparent) !important;
            stroke: var(--ifm-color-emphasis-300) !important;
          }
        `,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
