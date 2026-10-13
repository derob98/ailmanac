# AILmanac for Claude Code

The [AILmanac](https://derob98.github.io/ailmanac/) field guide, packaged as
Agent Skills. A skill is a small folder with a `SKILL.md` that Claude loads on
demand when it is relevant, so you get focused expertise without explaining
your needs again every session.

## Install

As a plugin, from a terminal:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

`--sparse` limits the checkout to the two folders the plugin needs; the rest of
this repository is a documentation site in twelve languages that Claude Code
has no use for.

To update later: `claude plugin marketplace update ailmanac`. To remove:
`claude plugin uninstall ailmanac@ailmanac`.

### Without the plugin system

Each skill is one self-contained file. Copy the folders you want into a skills
directory and Claude Code discovers them:

```bash
# for all your projects
mkdir -p ~/.claude/skills/ailmanac
curl -fsSL https://raw.githubusercontent.com/derob98/ailmanac/main/plugins/ailmanac/skills/ailmanac/SKILL.md \
  -o ~/.claude/skills/ailmanac/SKILL.md
```

Use `.claude/skills/` inside a repository instead to share a skill with your
team. On Claude.ai, create a skill and paste the contents of a `SKILL.md`
(availability depends on your plan; see the official docs).

## What you get

| Skill | Use it for | What it does |
|---|---|---|
| [`ailmanac`](./skills/ailmanac/) | Any question about Claude, Claude Code, the API, MCP, agents, prompting or other models | Looks the answer up in the guide, reads the page source, and cites it with the date it was last verified. Says so when no page covers the question. |
| [`claude-md-check`](./skills/claude-md-check/) | Reviewing a `CLAUDE.md`, `AGENTS.md` or `.claude/rules` file | Checks the file against the repository it describes and against how memory files load, then proposes exact fixes. Reports first, edits only when asked. |
| [`developer-workflow`](./skills/developer-workflow/) | Software development | Context-first coding, reviews, tests, debugging, clear commits |
| [`research-analyst`](./skills/research-analyst/) | Research and analysis | Source-grounded synthesis, comparisons, citation discipline |
| [`data-analyst`](./skills/data-analyst/) | Data and spreadsheets | SQL and formulas, plain-language interpretation, statistical sanity checks |
| [`writing-content-pro`](./skills/writing-content-pro/) | Writing, marketing, content | Briefs, drafting in passes, matching your voice, repurposing, with no invented facts |
| [`business-marketing`](./skills/business-marketing/) | Founders and small businesses | Positioning, copy, customer communication, lightweight planning |
| [`student-learning`](./skills/student-learning/) | Students and self-learners | Socratic tutoring, teach-back, quizzes: learning with AI rather than around it |
| [`everyday-productivity`](./skills/everyday-productivity/) | Everyone | Inbox, summaries, planning, decisions |

In a session, a skill activates when your request matches its description. You
can also call one by name, for example `/ailmanac:claude-md-check`.

## What the skills access

`ailmanac` and `claude-md-check` fetch public pages from
`derob98.github.io/ailmanac`. They make no other network requests and send nothing about your project to
AILmanac, which has no server to send it to. The other seven skills make no
network requests at all.

## House rules

Every skill follows the same three: give context, iterate, and verify what
matters. AI can be confidently wrong; the site's
[Hallucinations](https://derob98.github.io/ailmanac/docs/foundations/hallucinations)
page explains why.

## Make your own

Each `SKILL.md` has YAML frontmatter (`name` and `description`) followed by
instructions. The description decides when the skill triggers, so say plainly
what it does and when to use it. Keep the body focused. To go deeper, read
[Skills & Plugins](https://derob98.github.io/ailmanac/docs/power-user/skills-and-plugins)
on the site.

Licensed under MIT (see [`LICENSE-CODE`](../../LICENSE-CODE)). Copy, adapt and share.
