# AILmanac Skill Packs

Ready-to-use **Agent Skills** tailored to different kinds of user. A skill is a
small folder with a `SKILL.md` that Claude loads *on demand* when it's relevant —
giving Claude focused expertise without you re-explaining your needs every time.

These packs are MIT-licensed (see `../LICENSE-CODE`) — copy, adapt, and share.

## The packs

| Pack | For | What it does |
|---|---|---|
| [`writing-content-pro`](./writing-content-pro/) | Writers, marketers, creators | Briefs, drafting in passes, matching *your* voice, repurposing — no fabricated facts |
| [`developer-workflow`](./developer-workflow/) | Software developers | Context-first coding, reviews, tests, debugging, clear commits |
| [`research-analyst`](./research-analyst/) | Researchers, analysts | Source-grounded synthesis, comparisons, citation discipline |
| [`data-analyst`](./data-analyst/) | Data & spreadsheet users | SQL/formulas, plain-language interpretation, stat sanity checks |
| [`business-marketing`](./business-marketing/) | Founders, SMB owners | Positioning, copy, customer comms, lightweight planning |
| [`student-learning`](./student-learning/) | Students & lifelong learners | Socratic tutoring, teach-back, quizzes — learn *with* AI, not cheat |
| [`everyday-productivity`](./everyday-productivity/) | Everyone | Inbox, summaries, planning, decisions — the daily driver |

Every pack bakes in the AILmanac house rules: **give context, iterate, and verify
what matters** (AI can be confidently wrong — see the site's
[Hallucinations](https://derob98.github.io/ailmanac/docs/foundations/hallucinations) page).

## How to install

**Claude Code (CLI/IDE)** — copy a pack into your skills directory:

```bash
# personal (all your projects)
mkdir -p ~/.claude/skills && cp -r writing-content-pro ~/.claude/skills/
# or per-project (shareable with your team, committed to the repo)
mkdir -p .claude/skills && cp -r writing-content-pro .claude/skills/
```

Claude Code auto-discovers it; the skill activates when your request matches its
`description`. Confirm with the `/skills` view (or just ask Claude to use it).

**Claude.ai / Cowork** — create a skill and paste the contents of the pack's
`SKILL.md` (availability varies by plan; see the official docs).

**Any other agent that supports Agent Skills** — point it at the pack folder.

## Anatomy of a pack

```
writing-content-pro/
└── SKILL.md      # YAML frontmatter (name, description) + instructions
```

`description` is the **trigger** — Claude reads it to decide when the skill is
relevant, so it's written in "Use when…" form. Learn to author your own in the
site's [Skills](https://derob98.github.io/ailmanac/docs/claude-code/skills) guide.

## Contributing a pack

New pack ideas (legal, healthcare-admin, teaching, accessibility…) are welcome —
see `../CONTRIBUTING.md`. Keep them generic and privacy-safe: **never** put real
credentials, personal data, or client specifics in a shared skill.
