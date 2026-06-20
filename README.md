# AILmanac

> **AI**·lmanac — the always-current, community-built almanac for getting the most out of **Claude** — and every AI. From your first prompt to production agents, for every level.

<p>
  <a href="https://derob98.github.io/ailmanac/"><img alt="Live site" src="https://img.shields.io/badge/live-derob98.github.io%2Failmanac-4f46e5"></a>
  <a href="./CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen"></a>
  <img alt="License: CC BY 4.0 & MIT" src="https://img.shields.io/badge/license-CC%20BY%204.0%20%26%20MIT-blue">
  <img alt="Built with Docusaurus" src="https://img.shields.io/badge/built%20with-Docusaurus-3ECC5F">
  <a href="https://github.com/derob98/ailmanac/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/derob98/ailmanac?style=social"></a>
</p>

👉 **Live:** https://derob98.github.io/ailmanac/

AILmanac is a free documentation site (built with [Docusaurus](https://docusaurus.io/)) that teaches anyone — absolute beginner to power user — how to get great results from Claude (the chat apps, Claude Code, and the API) and from AI tools in general. Every page is tagged by level, written plainly, and kept honest about freshness.

> ⚠️ **Independent project.** AILmanac is **not affiliated with, sponsored by, or endorsed by Anthropic.** "Claude" and "Anthropic" are trademarks of Anthropic. When AILmanac and the [official docs](https://docs.anthropic.com) disagree, the official docs win.

## What's inside

- **Start Here** — pick a track by level/role and get a guaranteed first win.
- **AI Foundations** — provider-agnostic mental models that transfer to any AI.
- **Prompting** — universal patterns + Claude-specific techniques.
- **Claude.ai & Apps**, **Claude Code**, **Claude API** — the deep Claude core.
- **Playbooks**, **Walkthroughs**, **Templates & Recipes** — outcome-first, copy-paste-ready.
- **Security & Responsible Use**, **What's New**, **Contribute**.

## Run it locally

Requires Node.js (see `.nvmrc`).

```bash
npm install
npm run start     # dev server with live reload at http://localhost:3000
npm run build     # production build — FAILS on broken links (a feature)
npm run serve     # preview the production build locally
```

## Deploy (GitHub Pages)

The site is configured for **https://derob98.github.io/ailmanac/** (`ORG` is set in `docusaurus.config.ts`).

Two deploy paths:

1. **GitHub Actions (recommended):** `.github/workflows/deploy.yml` builds and publishes on every push to `main`. Enable it once by setting **Settings → Pages → Source = GitHub Actions**. (Pushing the workflow file needs a token with the `workflow` scope.)
2. **`gh-pages` branch (no special scope):** run `npm run build`, then publish the `build/` folder to a `gh-pages` branch and set **Settings → Pages → Source = Deploy from a branch → `gh-pages`**.

Using a custom domain? Set `url` to it, `baseUrl` to `/`, and add `static/CNAME`.

## Contributing

AILmanac stays complete and fresh because people add to it — fixing a typo, adding a glossary term, or sharing a template all count. See **[Contribute in 10 Minutes](https://docs.anthropic.com)** (and `CONTRIBUTING.md`). Be kind: we follow the `CODE_OF_CONDUCT.md`.

## Author & maintainer

Created and maintained by **Gianluca De Robertis** ([@derob98](https://github.com/derob98)).
Contributions from the community are very welcome — see `CONTRIBUTING.md`.

## License

Dual-licensed, so you can reuse both the words and the code:

- **Prose / documentation:** [CC BY 4.0](./LICENSE-CONTENT) — reuse with attribution.
- **Code, examples & config:** [MIT](./LICENSE-CODE).

See `NOTICE` for details.
