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

  i18n: {
    // English is the canonical source. Add locales only when an owner commits to
    // maintaining them (see docs/contribute/translation-playbook).
    defaultLocale: 'en',
    locales: ['en'],
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
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Guide',
        },
        {
          to: '/docs/start-here/welcome',
          label: 'Start Here',
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
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'python', 'json', 'toml', 'diff', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
