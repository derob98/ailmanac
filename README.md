<div align="center">

# 📘 AILmanac

### The always-current, community-built almanac for getting the most out of **Claude** — and every AI.

From your first prompt to production agents. Level-tagged, plain-spoken, and kept honest about freshness.

<p>
  <a href="https://derob98.github.io/ailmanac/"><img alt="Live site" src="https://img.shields.io/badge/read%20it%20live-derob98.github.io%2Failmanac-4f46e5?style=for-the-badge"></a>
</p>

<p>
  <a href="https://github.com/derob98/ailmanac/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/derob98/ailmanac?style=social"></a>
  <a href="./CONTRIBUTING.md"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen"></a>
  <img alt="License: CC BY 4.0 & MIT" src="https://img.shields.io/badge/license-CC%20BY%204.0%20%26%20MIT-blue">
  <img alt="12 languages" src="https://img.shields.io/badge/i18n-12%20languages-orange">
  <img alt="Built with Docusaurus" src="https://img.shields.io/badge/built%20with-Docusaurus-3ECC5F">
</p>

**[Read the site →](https://derob98.github.io/ailmanac/)** &nbsp;·&nbsp; **[Start Here in 5 min →](https://derob98.github.io/ailmanac/docs/start-here/your-first-5-minutes)** &nbsp;·&nbsp; **[Contribute in 10 min →](https://derob98.github.io/ailmanac/docs/contribute/contribute-in-10-minutes)**

</div>

---

AILmanac is a free, open documentation site that teaches anyone — absolute beginner to power user — how to get great results from **Claude** (the chat apps, **Claude Code**, and the **API**) and from AI tools in general. Every page is **tagged by level**, written in plain language, and stamped with a **"last verified" date** so you always know how fresh it is.

> ⚠️ **Independent project.** AILmanac is **not affiliated with, sponsored by, or endorsed by Anthropic.** "Claude" and "Anthropic" are trademarks of Anthropic. When AILmanac and the [official docs](https://docs.anthropic.com) disagree, **the official docs win** — and we link to them throughout.

> ⭐ **If a page here saves you time, please [star the repo](https://github.com/derob98/ailmanac).** Stars are how more people find it — and they fund nothing but motivation.

## Why AILmanac (and not just the official docs)?

The official docs, cookbooks, and "awesome" lists are excellent — AILmanac doesn't replace them, it **connects and opinionates** them. It's built to be the one place you can send a colleague regardless of their level:

| You want… | The usual options | What AILmanac adds |
|---|---|---|
| **To learn, in order** | Scattered tutorials | A **level-tagged path**: `beginner → intermediate → advanced`, with a guaranteed first win. |
| **Up-to-date facts** | Docs that quietly go stale | **`lastVerified` stamps + a single source of truth** for volatile model/pricing facts. |
| **To actually do something** | Prose you still have to translate into action | **Interactive tools** (cost calculator, CLAUDE.md & MCP config generators, prompt linter) and copy-paste **templates**. |
| **One reference, any language** | English-only | **12 languages**, real translations (not machine stubs). |
| **The "why", not just the "how"** | Cheat sheets | **Foundations & Frontiers** essays that explain the mental models. |

## What's inside

A full funnel from "what's a token?" to "harden an autonomous agent." Browse on the **[live site](https://derob98.github.io/ailmanac/)**:

- **[Start Here](https://derob98.github.io/ailmanac/docs/start-here/welcome)** — pick a track by level/role and get a guaranteed first win.
- **[AI Foundations](https://derob98.github.io/ailmanac/docs/foundations/what-is-an-llm)** — provider-agnostic mental models: tokens, roles, sampling, RAG, embeddings, evals, hallucinations.
- **[Prompting](https://derob98.github.io/ailmanac/docs/prompting/basics)** — universal patterns + Claude-specific techniques (XML tags, few-shot, a pattern library).
- **[Claude.ai & Apps](https://derob98.github.io/ailmanac/docs/claude-app/getting-started)** · **[Claude Code](https://derob98.github.io/ailmanac/docs/claude-code/what-is-claude-code)** · **[Claude API](https://derob98.github.io/ailmanac/docs/api/first-call)** — the deep Claude core.
- **[Playbooks](https://derob98.github.io/ailmanac/docs/playbooks/coding)** · **[Walkthroughs](https://derob98.github.io/ailmanac/docs/walkthroughs/first-production-call)** · **[Templates & Recipes](https://derob98.github.io/ailmanac/docs/templates/claude-md)** — outcome-first, copy-paste-ready.
- **[Tools](https://derob98.github.io/ailmanac/docs/tools/cost-calculator)** — in-browser cost calculator, CLAUDE.md generator, MCP config builder, Prompt Doctor.
- **[Security & Responsible Use](https://derob98.github.io/ailmanac/docs/security/prompt-injection)** · **[Frontiers](https://derob98.github.io/ailmanac/docs/frontiers/)** · **[What's New](https://derob98.github.io/ailmanac/docs/whats-new/models-and-pricing)** · **[Contribute](https://derob98.github.io/ailmanac/docs/contribute/contribute-in-10-minutes)**.

> 🤖 **For AI agents & crawlers:** a machine-readable index of every page lives at **[`/llms.txt`](https://derob98.github.io/ailmanac/llms.txt)** (the [llms.txt](https://llmstxt.org/) convention).

## Contributing

AILmanac stays complete and fresh because people add to it — fixing a typo, adding a glossary term, sharing a template, or [translating a page](https://derob98.github.io/ailmanac/docs/contribute/translation-playbook) all count. Start with **[Contribute in 10 Minutes](https://derob98.github.io/ailmanac/docs/contribute/contribute-in-10-minutes)** (and [`CONTRIBUTING.md`](./CONTRIBUTING.md)). Be kind — we follow the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

Good first contributions: spot a stale `lastVerified` stamp, add a worked example to a thin page, or fill a coverage gap. Look for [`good first issue`](https://github.com/derob98/ailmanac/labels/good%20first%20issue).

## Run it locally

Requires Node.js (see [`.nvmrc`](./.nvmrc)).

```bash
npm install
npm run start     # dev server with live reload at http://localhost:3000
npm run build     # production build — FAILS on broken links (a feature)
npm run serve     # preview the production build locally
```

Regenerate the machine-readable index after adding pages:

```bash
node scripts/build-llms-txt.mjs   # rebuilds static/llms.txt
```

## Deploy (GitHub Pages)

The site targets **https://derob98.github.io/ailmanac/** (`ORG` is set in `docusaurus.config.ts`).

1. **GitHub Actions:** `.github/workflows/deploy.yml` builds and publishes on every push to `main`. Enable it once via **Settings → Pages → Source = GitHub Actions**. (Pushing the workflow file needs a token with the `workflow` scope.)
2. **`gh-pages` branch (no special scope):** run `npm run build`, then publish the `build/` folder to a `gh-pages` branch and set **Settings → Pages → Source = Deploy from a branch → `gh-pages`**.

Using a custom domain? Set `url` to it, `baseUrl` to `/`, and add `static/CNAME`.

## Cite AILmanac

Referencing AILmanac in a post, course, or paper? A citation file is included — see [`CITATION.cff`](./CITATION.cff). GitHub's **"Cite this repository"** button (top-right of the repo) generates APA/BibTeX for you.

## Author & maintainer

Created and maintained by **Gianluca De Robertis** ([@derob98](https://github.com/derob98)). Contributions from the community are very welcome — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

Dual-licensed, so you can reuse both the words and the code:

- **Prose / documentation:** [CC BY 4.0](./LICENSE-CONTENT) — reuse with attribution.
- **Code, examples & config:** [MIT](./LICENSE-CODE).

See [`NOTICE`](./NOTICE) for details.
