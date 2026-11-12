# The Landscape Map

> Source: https://derob98.github.io/ailmanac/docs/start-here/landscape-map · AILmanac (CC BY 4.0) · last verified 2026-11-11

Annotated index of official and community AI resources — with an honest one-line review of each, and when to use it instead of us.

<LevelBadge level="all" />

AILmanac doesn't exist in a vacuum, and we won't pretend to replace everything. This lesson is your honest map of the best resources in the ecosystem — and, just as importantly, when to use them **instead of** us.

Every link below carries a one-sentence review. Not a description — a **review**, including what each resource is bad at. A map that only tells you what things are good for will send you to the wrong place about half the time.

<Callout type="objectives" items={[
  "Identify the single source of truth and why the docs always win when they disagree with us",
  "Sort every resource in the ecosystem into one of four kinds — reference, runnable code, catalog, or guide — because each fails in its own predictable way",
  "Recognize the official Anthropic resources, including the two whose URLs and repo names recently changed",
  "Know which community resources are genuinely worth your time and what each one is weak at",
  "Match any need to the right destination using a simple decision table",
]} />

<VerifyNote lastVerified="2026-11-11" source="https://platform.claude.com/docs">
Ecosystem links move. Two on this page changed recently: the Anthropic Cookbook repository is now `anthropics/claude-cookbooks`, and the old Prompt Library URL returns a 307 redirect to the prompting best-practices page — the library of ready-made example prompts it used to host no longer exists as a separate resource. Both were re-checked on the date above.
</VerifyNote>

## The source of truth

Start here, because everything else orbits this one rule.

<Callout type="warning" items={["When AILmanac and the official docs disagree, the docs win. Use them for exact, current specifics; use us for opinionated, layered, learn-by-doing guidance."]} />

- **[Anthropic Documentation](https://platform.claude.com/docs)** — the only authoritative item on this page; terse by design, which means it reliably tells you *what* a parameter does and almost never *whether you should use it*.

## Four kinds of resource, four failure modes

Before the lists: the most useful thing you can know about an AI resource is which **kind** it is. Each kind is excellent at one job and quietly useless at the others, and most people's frustration with a resource is really a mismatch of kind to need.

| Kind | What it's for | How it fails you |
|---|---|---|
| **Reference** (official docs, specs) | Exact, current, authoritative specifics | Won't tell you what's a good idea, or which of five options to pick |
| **Runnable code** (cookbooks, app collections) | Seeing a pattern work end to end | Ages fastest — model IDs, SDK versions, and parameters drift under you |
| **Catalog** (awesome-lists, prompt collections) | Discovering that a thing exists at all | No quality bar; breadth is the product, so dead links and weak entries are normal |
| **Guide** (AILmanac, promptingguide.ai, courses) | Understanding *why*, and what to do first | Opinionated and slower-moving; always lose to the reference on an exact detail |

The practical rule: **never ask a catalog for a recommendation, and never ask a reference what to do.** A catalog with a thousand entries has not evaluated any of them for you.

## Official Anthropic resources

These are first-party. Reach for them when you want canonical examples, runnable code, or guided learning straight from the source.

- **[Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)** — now the single official prompting reference and the best short read on the docs site; the per-model guidance near the end is the part almost everyone skips and the part that actually changes results. (This replaced the old Prompt Library of ready-made example prompts, whose URL now redirects here.)
- **[Claude Cookbooks](https://github.com/anthropics/claude-cookbooks)** — runnable notebooks, strongest on tool use, RAG, and the Agent SDK; reach for it when you want working code instead of an explanation, and expect to update model IDs yourself.
- **[Claude Code docs](https://code.claude.com/docs/en/overview)** — unusually complete for a CLI, and the changelog is the real release notes; most "can Claude Code do X" questions are answered in the settings reference rather than the prose pages.
- **[Anthropic Academy / Learn](https://www.anthropic.com/learn)** — a solid structured on-ramp if courses suit you; markedly slower than reading the docs if you already write code.
- **[Model Context Protocol](https://modelcontextprotocol.io)** — the spec is genuinely readable and worth an hour; the adjacent server directory is a catalog, so treat its quality as unverified until you've read a server's source.

<Flashcards title="Official resources at a glance" cards={[
  {front: "Prompting best practices", back: "Anthropic's one official prompting reference, with per-model guidance. Absorbed the old Prompt Library, whose URL now redirects here — there is no separate library of example prompts anymore."},
  {front: "Claude Cookbooks", back: "Runnable notebook recipes — tool use, RAG, vision, Agent SDK. Note the repository was renamed from anthropic-cookbook to claude-cookbooks. Being runnable code, it ages faster than prose: assume model IDs need updating."},
  {front: "Claude Code docs", back: "The CLI and IDE reference. The changelog doubles as release notes, and the settings reference answers more questions than the guides do."},
  {front: "Anthropic Academy / Learn", back: "Free guided courses. Best for a structured start; slower than the docs once you can already code."},
  {front: "Model Context Protocol", back: "The open MCP standard plus a server directory. The spec is authoritative; the directory is a catalog with no quality bar."},
]} />

## Community & general

When you want vendor-neutral depth, sheer breadth, or community-tested workflows, these are the standouts. Three of the five are catalogs — read the failure-mode table above before you trust one.

- **[Prompt Engineering Guide](https://www.promptingguide.ai)** — the most rigorous vendor-neutral reference in the space, with real paper citations behind its claims; academic in register and deliberately model-agnostic, so it will not tell you what to do on Claude specifically.
- **[awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)** — the best single inventory of community Claude Code commands, hooks, and workflows; it's a link list, so there's no quality bar and some entries are stale.
- **[awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills)** — far and away the largest catalog of Claude Skills; use it as a search index rather than a recommendation, and read a skill's source before you install it, because a skill is instructions your agent will follow.
- **[prompts.chat](https://github.com/f/prompts.chat)** — the largest prompt collection in existence and now multi-model rather than ChatGPT-only (the repository was renamed from `awesome-chatgpt-prompts`); enormous breadth, very little depth, and crowd-sourced quality that ranges from excellent to useless.
- **[awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps)** — a large collection of runnable multi-provider agent and RAG apps, and the fastest way to watch a pattern work end to end; much weaker as a reference you return to, since the apps are demos rather than maintained libraries.
- **[Learn Prompting](https://learnprompting.org)** — the gentlest structured on-ramp for a complete beginner; it stops roughly where production concerns begin.

:::tip[Reading a catalog safely]
Anything you install from a catalog — a skill, a hook, an MCP server, a slash command — is **code or instructions that run with your agent's permissions**. Popularity is not a security review. See [Prompt Injection](/docs/security/prompt-injection) and [Securing MCP Servers](/docs/security/securing-mcp-servers) before you wire a stranger's server into your tooling.
:::

## When to use what

The fastest way to use this map: start from what you need, then jump to the matching destination.

<Steps items={[
  {title: "Name your need", body: "Decide what you actually want right now — exact specs, copy-paste prompts, runnable code, a learning path, theory, or a course. Being vague here is what sends people to the wrong kind of resource."},
  {title: "Identify the kind, not just the name", body: "Check your need against the four kinds above. If you want a recommendation, rule out every catalog immediately; if you want an exact current parameter, rule out every guide, including this one."},
  {title: "Match it in the table", body: "Find your need in the left column below and read off the recommended destination on the right."},
  {title: "Go deep there, then come back", body: "Use that resource for the deep dive, and return to AILmanac for the opinionated, level-tagged path that ties it together."}
]} />

| You want… | Go to |
|---|---|
| Exact current API/feature details | Official docs |
| Copy-paste example prompts | Our [prompt templates](/docs/templates/prompts) and [pattern library](/docs/prompting/pattern-library) — the official Prompt Library no longer exists |
| Runnable API code | Claude Cookbooks |
| A working end-to-end app to crib from | awesome-llm-apps |
| To discover whether a skill or server exists | awesome-claude-skills, awesome-claude-code |
| An opinionated, level-tagged path | **AILmanac** |
| A deep theory reference on prompting | promptingguide.ai |
| A guided course | Anthropic Academy |

## Where AILmanac fits

We're the **opinionated field guide**: one recommended way first, tagged by level, template-rich, honest about freshness, and spanning Claude **and** general AI concepts. Think of us as the map that points you to the right deep resource at the right time — and teaches the fundamentals so they all make sense.

Which also tells you our failure mode, in keeping with the rest of this page: we are a guide, so on any exact, current, volatile specific, the official reference beats us. That's why volatile claims here carry a dated verification note pointing at the source.

<Quiz title="Check yourself" questions={[
  {
    q: "AILmanac and the official Anthropic docs disagree on a feature detail. Which do you trust?",
    options: ["AILmanac, because it is opinionated", "The official docs, because they are the source of truth", "Whichever was updated first"],
    answer: 1,
    explain: "When AILmanac and the docs disagree, the docs win. They are the authoritative, current reference for exact specifics — and a guide's failure mode is precisely the volatile detail."
  },
  {
    q: "You need runnable API code for tool use, RAG, or vision. Where do you go?",
    options: ["Claude Cookbooks", "Learn Prompting", "awesome-claude-skills"],
    answer: 0,
    explain: "Claude Cookbooks (formerly the anthropic-cookbook repository) provides runnable notebook recipes covering tool use, RAG, and vision. Being runnable code, expect to update model IDs yourself."
  },
  {
    q: "You want a recommendation on which MCP server to use. Why is a thousand-entry awesome-list the wrong place to ask?",
    options: [
      "Awesome-lists are usually out of date",
      "A catalog's product is breadth, so nothing in it has been evaluated for you",
      "Catalogs only cover paid tools",
      "You should only trust first-party directories"
    ],
    answer: 1,
    explain: "Breadth is the whole point of a catalog, which means inclusion signals existence, not quality. Never ask a catalog for a recommendation — and since an installed server runs with your agent's permissions, popularity is not a security review either."
  }
]} />

<Callout type="takeaways" items={[
  "The official Anthropic docs are the source of truth — when in doubt, they win.",
  "Sort a resource into reference, runnable code, catalog, or guide before you trust it; each one fails in its own predictable way.",
  "Never ask a catalog for a recommendation, and never ask a reference what to do.",
  "Two links changed recently: the cookbook repo is now claude-cookbooks, and the official Prompt Library is gone — its URL redirects to the prompting best-practices page.",
  "Anything you install from a catalog runs with your agent's permissions; popularity is not a security review.",
]} />

## Next

- [Welcome & Why This Exists](/docs/start-here/welcome)
- [Learning Paths](/docs/start-here/learning-paths)
- [Contribute a resource](/docs/contribute/contribute-in-10-minutes)
