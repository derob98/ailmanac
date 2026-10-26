# The Third-Party Memory Layer: How claude-mem Actually Works

> Source: https://derob98.github.io/ailmanac/docs/models/agent-memory-layer-claude-mem · AILmanac (CC BY 4.0) · last verified 2026-10-26

claude-mem has 103,000 GitHub stars and solves the complaint every coding-agent user has: the agent forgets everything when the session ends. Underneath, it is a second model running in a background daemon that reads every tool call you make — and on the hosted path its own cost dataset maps that observer to a DeepSeek model, not Claude. The six hooks, the exit-code contract that can block your session, the three-layer recall that makes the token math work, where the data lands, who pays for the compression, and a checklist for evaluating any memory layer before you install it.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Understand what 'memory' means in this class of tool: not a saved transcript, but observations extracted by a second model that watches your tool calls", "Learn the six-hook lifecycle and the exit-code contract that decides whether a broken memory layer degrades quietly or blocks your coding session", "See the detail almost nobody checks: the observer is a separate model on a provider you choose, and claude-mem's own cost dataset maps its hosted observer to a DeepSeek model — your session content does not necessarily go to Claude", "Follow the three-layer recall that makes the token arithmetic work — a ~50-100-token index hit before a ~500-1,000-token detail fetch — and why that ordering is the whole design", "Know where the data lands: SQLite with FTS5, a Chroma vector store that indexes every extracted fact separately, and a worker on port 37700 + (uid % 100)", "Work out who pays for the compression, and why a $30/month hosted tier exists at all", "Avoid five documented failure modes, starting with the one where the observer's reasoning tokens ate the session's output budget", "Apply an eight-point evaluation checklist to any agent memory layer before you let it read every file your agent touches"]} />

Every coding-agent user hits the same wall. You spend an hour establishing context — which module owns what, why the previous approach failed, the one gotcha in the build — and then the session ends and all of it is gone. Tomorrow you explain it again.

**claude-mem** is the most popular answer to that problem by a very wide margin: **103,252 stars** on GitHub as of 26 October 2026, Apache-2.0, and shipping fast enough that it went from v13.38 to v15.2.1 in the twelve days before this page was written. It works with Claude Code, Cursor, Codex, OpenCode, Antigravity, Claude Desktop and several others.

This page is not an install guide — the README does that well. It is the thing the README does not do: explain what the tool actually *is* architecturally, what it costs, what reads your code, and what breaks. Most of what follows comes from the repository's own `docs/` folder, which is detailed, honest, and almost certainly unread by the large majority of those 103,000 stargazers.

<VerifyNote lastVerified="2026-10-26" source="Primary: the thedotmack/claude-mem repository — README.md, docs/architecture-overview.md (hook table and timeouts, data flow, worker port formula, SQLite schema, Chroma document naming, dedup hash, generator restart backoff, the exit-0/exit-2 degradation contract, the two session-id types), docs/security.md (cmem_ key prefix, SHA-256 storage, the local-dev bypass requiring two env vars, BullMQ/Redis notes), docs/ip-boundary.md (the open-core split), docs/expense-pricing/README.md (the cmem-observer to deepseek/deepseek-v4-flash mapping on/after 2026-08-08, and the ~98%-input working shape), and the GitHub release notes for v15.0.0, v15.0.2, v15.1.0, v15.2.0 and v15.2.1. Star count (103,252), licence (Apache-2.0), creation date (2025-08-31) and last push (2026-10-26) verified via the GitHub API on 2026-10-26. Pricing ($30/month after a 30-day trial) and the 'moves memory generation off your primary agent's subscription' framing are from cmem.ai. This project ships multiple releases per week and renames features between majors — treat every specific port, flag, command, default and price here as a snapshot, and check the current release notes before relying on one. The architecture-overview hook table lists Setup plus five lifecycle events; the README describes six hooks including UserPromptSubmit and Stop separately. Where the two disagree, this page follows architecture-overview.md and says so." />

## What it stores is not your transcript

The first mental model to discard is "it saves my chats". It does not. The unit of storage is an **observation**: a structured note with a type, a title and a narrative, extracted *by a model* from what your agent did.

The flow, from the repo's own data-flow diagram:

1. You submit a prompt. The `session-init` handler registers the session and asks the worker for semantically relevant context.
2. Your agent uses a tool. The `PostToolUse` hook posts that tool usage to the worker, which enqueues it.
3. The worker's **SDKAgent** — a model session, running in a background daemon — reads the queue and produces observations and summaries.
4. Those land in SQLite, get synced into a Chroma vector store, and get broadcast to a local UI over server-sent events.

So the thing watching your work is a **second model**, and the thing it reads is **every tool call**: file reads, file writes, command output, search results. That is the price of admission for this entire category of tool, and it is worth saying plainly before any of the rest.

<Callout type="key" items={["A memory layer is not a storage feature. It is a second model with a standing subscription to everything your first model touches. Evaluate it the way you would evaluate adding any model to your pipeline — what it reads, where it sends it, who pays for its tokens, and what happens when it fails."]} />

## The six hooks, and the one contract that matters operationally

claude-mem installs as a set of lifecycle hooks, each invoked as a single shell-free command of the form `claude-mem hook claude-code <event>`. Per `docs/architecture-overview.md`:

| Event | Handler | What it does | Timeout |
|---|---|---|---|
| Setup | `version-check.js` | Sub-100 ms version-marker check; prints a hint to run `npx claude-mem repair` on mismatch | 60s |
| SessionStart | worker start + context | Starts the worker service and injects prior context | 60s |
| UserPromptSubmit | `session-init` | Registers the session, starts the SDK agent, semantic injection | 60s |
| PostToolUse | `observation` | Captures tool usage and enqueues it in the worker | 120s |
| Summary | `summarize` | Requests a session summary from the SDK agent | 120s |
| SessionEnd | `session-complete` | Ends the session and drains pending messages | 30s |

Now the part that will matter to you at 2 a.m. The hook orchestrator implements an explicit **degradation contract**:

- **Transport errors** — `ECONNREFUSED`, timeouts, 5xx from the worker — **exit 0**. Non-blocking. The worker being down never blocks your coding session.
- **Client bugs** — 4xx, `TypeError`, `ReferenceError` — **exit 2**. Blocking, on the stated reasoning that these indicate a bug needing a fix.

That is a defensible design, and it has a consequence worth internalising: **"the memory daemon is dead" is harmless, but "the memory daemon is answering 400" is not.** A malformed request, a schema drift after a partial upgrade, or an expired key that surfaces as a 4xx is in the category the tool deliberately chose to make loud. This is also why the Setup hook nags about `npx claude-mem repair` after an external plugin upgrade — a version-skewed install is exactly how you reach the blocking branch.

<Callout type="warning" items={["If a coding session starts failing immediately after you updated a plugin, check your memory layer before you debug your agent. The published contract here is that transport failures degrade silently and client-side failures block — so the symptom of a half-upgraded install is a session that will not start, not a session without memory."]} />

## The three-layer recall is the actual idea

Any memory system can store things. The hard part is retrieval that does not cost more context than it saves — dump twenty remembered notes into every session start and you have made the problem worse.

claude-mem's answer, shipped as the default in **v15.0.0** on 20 October 2026 under the name *Smart memory search*, is a three-step search the agent reasons through rather than a single retrieval:

<Steps items={[
  {title: "Search the compact index", body: "A full-text query (SQLite FTS5, optionally hybridised with Chroma vectors) returns a compact list of hits with observation IDs. The README puts these at roughly 50-100 tokens per result — enough to judge relevance, not enough to be useful on its own."},
  {title: "Inspect the timeline around what looks relevant", body: "Given a promising observation ID, fetch the chronological context around it. This is the step that distinguishes 'a note that matches your keywords' from 'the note that matches, plus what happened immediately before and after it'."},
  {title: "Fetch full details for the selected IDs only", body: "Only now does the full observation text enter context, at roughly 500-1,000 tokens each. The README's claim for this ordering is about ~10x token savings versus fetching details up front."}
]} />

The three steps are exposed to the agent as MCP tools — `search(query, type, date, project, limit)`, `timeline(observation_id, query)` and `get_observations(ids[])` — which is why the agent can reason between them instead of the retrieval being a fixed pipeline.

The transferable lesson here has nothing to do with claude-mem. **Filter on cheap representations, then pay for detail on the survivors.** It is the same pattern as reading a search-results page before opening a tab, the same pattern as a database index before a row fetch, and it is the correct shape for any retrieval you bolt onto an agent. If you are designing your own, see [context engineering](/docs/frontiers/context-engineering) for the general framing and [how agent memory actually works](/docs/frontiers/agent-memory-architectures) for the taxonomy this tool sits inside.

## Where your data actually lives

Everything local lands under `~/.claude-mem/`. Two stores, with distinct jobs:

**SQLite** (`claude-mem.db`), with FTS5 for full-text search:

| Table | Purpose |
|---|---|
| `sdk_sessions` | Session lifecycle, and the mapping between the two session IDs |
| `observations` | The extracted notes: type, title, narrative, content hash |
| `session_summaries` | Per-session request / learned / completed |
| `user_prompts` | Your prompt history |
| `pending_messages` | The per-session work queue |
| `observation_feedback` | Usage signals per observation |

**ChromaDB** (`chroma.sqlite3`) for vector embeddings, accessed through `chroma-mcp` over stdio. The detail worth noticing: **each observation produces several documents, not one** — `obs_{id}_narrative` for the main text plus `obs_{id}_fact_0`, `obs_{id}_fact_1` and so on for each extracted fact. Facts are embedded individually, which is why a query about one specific detail can retrieve an observation whose overall summary is about something else.

The worker is an Express daemon on a **per-user port: `37700 + (uid % 100)`**. If you have seen `localhost:37777` in the project's own release notes and docs, that is one uid's port, not a constant — which is a small thing that will cost you ten minutes exactly once.

<Callout type="note" items={["The worker binds a local HTTP API and serves a UI from it. docs/security.md is explicit that the server beta defaults to API-key auth, that keys use a cmem_ prefix and are shown once with only a SHA-256 hash stored, and that the loopback development bypass requires two environment variables set together (CLAUDE_MEM_AUTH_MODE=local-dev and CLAUDE_MEM_ALLOW_LOCAL_DEV_BYPASS=1) and must not be used behind a reverse proxy or on a publicly reachable bind address. Treat that as a hard rule: this daemon holds a searchable index of everything your agents read."]} />

## Who pays for the compression — and which model reads your code

Here is the fact that most surprised me, and the reason this page exists.

The observer is a **separate model call**, and you choose its provider at install time: `npx claude-mem install --provider [host|openrouter|gemini|anthropic]`. Four options, four different answers to "where does my session content go".

The repository's own cost-accounting dataset, in `docs/expense-pricing/README.md`, documents how to price observer traffic — and in doing so documents what the hosted observer is. Its join recipe says to resolve the model id `cmem-observer` to **`deepseek/deepseek-v4-flash`** on or after 2026-08-08, and to `deepseek/deepseek-chat` before that.

There is an apparent contradiction here worth resolving, because you will hit it if you read the repo yourself: `docs/architecture-overview.md` labels the observer component `SDKAgent (Claude Agent SDK)`, which sounds like it must be Claude. Both things are true at once. The Agent SDK is the *harness* — the loop that manages the session and parses responses — and it can be pointed at a non-Anthropic endpoint, which is exactly what the v15.0.2 release notes imply when they describe observer requests going to "OpenRouter, the cmem.ai gateway, and OpenAI-compatible endpoints". The SDK is the client; the provider flag decides who answers.

Read the DeepSeek mapping carefully too, because it is easy to over- or under-state. It does not mean the project is hiding anything — the provider is a documented install flag and the dataset is published in the open repo. It does mean that **a tool named `claude-mem`, on its hosted path, has been pricing its observer as a DeepSeek model**, and that if your assumption was "this runs on Claude because of the name", the assumption was wrong. If your code cannot go to a third-party inference provider, `--provider anthropic` or a self-hosted OpenAI-compatible endpoint is the choice you have to make deliberately.

The same dataset also tells you the *shape* of that traffic: the project's own notes treat observer usage as roughly **98% input tokens**, which is exactly what you would expect from a process whose job is reading tool output and emitting short notes. Prompt-heavy, output-light.

And that is the whole economics of the hosted tier. The paid product, **CMEM Pro**, is described on cmem.ai as hosted observation and cloud sync at **$30/month after a 30-day free trial**, with the pitch that hosted observation *moves memory generation off your primary agent's subscription*. In other words: by default, something has to pay for a second model to read everything your first model does. Either that is your own provider account and plan limits, or it is $30/month to someone else. The site is also careful to say the effect on token use depends on your workload and provider, and that Pro does not change the price or limits of another subscription.

<Callout type="key" items={["Any memory layer has a hidden second bill: the cost of the model that writes the memories. Before you install one, answer three questions. Which model does the extraction? Whose account pays for it? And is the content it reads allowed to go there? For claude-mem the answers are configurable, documented, and not what the name implies by default."]} />

The licensing split is also published, in `docs/ip-boundary.md`, and it is a clean open-core boundary worth knowing if you are planning to build on it: Apache-2.0 covers the memory engine, server, CLI, SDKs, REST schemas, MCP tools, the Claude Code and generic agent adapters and the storage adapters. Reserved commercial areas include hosted Magic Recall, team/org memory sync, the admin dashboard, SSO/SAML/SCIM, enterprise RBAC and audit UI, the DLP/policy engine, managed evals and private connectors. So the engine is genuinely yours to embed; the team and enterprise surface is not.

## Five documented failure modes

These are all from the project's own release notes and architecture docs, which is the best possible source for a gotcha list.

**1. The observer's reasoning tokens ate the session's output budget.** Fixed in **v15.0.2** (23 October 2026): observer requests to OpenRouter, the cmem.ai gateway and OpenAI-compatible endpoints now disable reasoning by default, because reasoning tokens were filling the output budget and leaving a session with nothing left to emit. This is the single most instructive bug in the list — it is a pure consequence of putting a reasoning model in a budget-constrained extraction role, and it will recur in anything you build that does the same.

**2. Two session IDs that are not interchangeable.** `contentSessionId` comes from the host and is invariant for the session; `memorySessionId` comes from the SDK agent and **changes on every worker restart**. The architecture doc calls the conversion between them critical for foreign-key constraints. If you query the SQLite store directly, this is the first thing that will confuse you.

**3. Deduplication has a 30-second window.** The content hash is `SHA256(memory_session_id + title + narrative)` truncated to 16 hex characters, and a repeat within 30 seconds returns the existing ID instead of inserting. Useful, and also a reason identical-looking observations can legitimately coexist if they arrived 31 seconds apart.

**4. Generator crashes retry three times, then stop.** Backoff is 1s, 2s, 4s; after more than three consecutive restarts the worker stops retrying and lets the iterator end. The counter resets when the generator completes work naturally. Pending messages survive restarts and are cleared by the parser path on the next valid response — so a persistently crashing observer means a silently growing queue, not lost input.

**5. The install footprint is larger than `npm install`.** `npx claude-mem install` sets up **Bun and uv globally**, runs `bun install` in the plugin cache, and writes a version marker. The README is explicit that `npm install -g` installs the SDK only and that you must use `npx claude-mem install`. Two package-manager runtimes installed globally by a memory tool is a reasonable engineering choice and also a supply-chain surface you should know you accepted — [vetting agent skills](/docs/security/vetting-agent-skills) is the general discipline.

<Callout type="warning" items={["Release velocity cuts both ways. Between 13 and 25 October 2026 this project shipped v13.38 through v15.2.1 — two major version bumps in twelve days, with features renamed across them (the viewer, the recall mode, the work views). A tool this active fixes bugs fast and also breaks your notes fast. Pin a version if you are documenting it for a team, and read the release notes before upgrading rather than after."]} />

## What leaves your machine, and the one control to know

`docs/security.md` and the README together give a usable picture:

- The local engine stores memory on your machine, under `~/.claude-mem/`.
- Cloud sync is opt-in; if you enable it, synced data is also stored by CMEM. The site's own guidance is to read the privacy policy before connecting.
- `CLAUDE_MEM_ONLINE_OPTIN=false` skips the sign-in flow.
- Content wrapped in **`<private>` tags is excluded from storage entirely** — not written to the observation store, and not written to profile or project memory.

That last one is the control most worth remembering, because it is the only in-band one. Everything else is a configuration decision you make once at install; `<private>` is the thing you can reach for mid-session when a secret, a customer name or a production hostname is about to pass through a tool call.

It is also, by construction, a control you have to remember to use. For the broader question of what an agent ships off your machine in the normal course of doing its job, see [what your agent uploads](/docs/security/what-your-agent-uploads).

<PromptCard title="Inspect what a memory layer has actually recorded about you">
{`# Where the local stores live, and how big they have got
du -sh ~/.claude-mem/ 2>/dev/null
ls -la ~/.claude-mem/

# Which worker port is yours (the formula, not the number in the docs)
python3 -c "import os; print(37700 + (os.getuid() % 100))"

# Read the observation store directly — it is plain SQLite
sqlite3 ~/.claude-mem/claude-mem.db ".tables"
sqlite3 ~/.claude-mem/claude-mem.db \\
  "SELECT type, title, substr(narrative,1,90) FROM observations
   ORDER BY rowid DESC LIMIT 15;"

# Which model actually wrote your memories (the field the cost docs join on)
sqlite3 ~/.claude-mem/claude-mem.db \\
  "SELECT generated_by_model, COUNT(*) FROM observations
   GROUP BY 1 ORDER BY 2 DESC;"

# And your own prompt history, which is stored separately
sqlite3 ~/.claude-mem/claude-mem.db \\
  "SELECT COUNT(*) FROM user_prompts;"`}
</PromptCard>

<Callout type="note" items={["Column names come from the schema table in docs/architecture-overview.md and the join recipe in docs/expense-pricing/README.md, which names generated_by_model and created_at on observation rows. A project shipping two majors in twelve days may rename them — if a query errors, run .schema observations and adjust. The point of the exercise is not the exact SQL; it is that you can and should read what a memory layer wrote about you, because it is a local SQLite file and nothing stops you."]} />

## Evaluating any memory layer, not just this one

This category is going to keep growing, and the questions generalise. Run these before you install the next one.

<Steps items={[
  {title: "What is the unit of storage?", body: "A raw transcript, a model-extracted note, or a compiled knowledge artefact? Extraction means a second model's judgement sits between what happened and what you remember — which is usually what you want, and is also a place for errors to become permanent."},
  {title: "Which model does the extraction, and whose bill is it?", body: "Ask explicitly. claude-mem makes it a flag with four values and documents its hosted observer as a DeepSeek model in its own cost dataset. If a tool will not tell you, that is your answer."},
  {title: "Is retrieval filtered before it is fetched?", body: "A memory layer that injects everything it has at session start is a context tax, not a context saving. Look for a cheap index step before a detail step, and check what the index entry costs in tokens."},
  {title: "What happens when it fails?", body: "Find the degradation contract. claude-mem publishes one: transport errors exit 0 and never block, client errors exit 2 and do. A tool without a stated contract will eventually block your session for a reason you cannot see."},
  {title: "Can you read and delete the store yourself?", body: "A local SQLite file you can query and rm is a very different privacy posture from an opaque cloud index. Check both the local format and whether sync is opt-in or opt-out."},
  {title: "Is there an in-band exclusion control?", body: "You will need to stop one specific thing from being recorded, mid-session, without reconfiguring anything. <private> tags are claude-mem's answer; a tool with no equivalent means your only control is 'do not use it for this work'."},
  {title: "What does installing it actually install?", body: "Global runtimes, a background daemon, an MCP server, hooks on every tool call. All reasonable individually; worth counting before you accept them."},
  {title: "How fast does it move, and do you need it to?", body: "Fast releases mean fast fixes and fast breakage. If you are rolling this out to a team, pin a version and own the upgrade, rather than letting every developer sit on a different major."}
]} />

<Callout type="takeaways" items={["claude-mem is not a transcript store. It is a second model in a background daemon that reads every tool call and writes structured observations — which is the real cost and the real capability of this entire tool class.", "The observer is a separate model on a provider you select at install time (host, OpenRouter, Gemini, or Anthropic). The project's own cost dataset maps its hosted cmem-observer id to deepseek/deepseek-v4-flash from 2026-08-08, so the name does not tell you where your code goes.", "Someone has to pay for the extraction. By default that is your own provider account; CMEM Pro's $30/month pitch is explicitly that hosted observation moves memory generation off your primary agent's subscription.", "Recall is three steps, not one: a ~50-100-token index hit, then timeline context, then a ~500-1,000-token detail fetch for selected IDs only. 'Filter cheap, fetch expensive' is the transferable pattern and the reason the token math works at all.", "The degradation contract is published and asymmetric: transport failures exit 0 and never block your session, client-side failures exit 2 and do. A half-upgraded install is therefore a session that will not start.", "Observer traffic is roughly 98% input tokens by the project's own accounting — a reading process, not a writing one. Price it that way.", "Each observation becomes multiple Chroma documents, one per extracted fact plus the narrative, which is why a query about a small detail can surface a note that is nominally about something else.", "The v15.0.2 fix is the most instructive bug in the project: a reasoning model in an extraction role spent the output budget on reasoning and left sessions with nothing to emit. Disable reasoning on any model you use as a summariser.", "Two package-manager runtimes (Bun and uv) get installed globally, a daemon binds 37700 + (uid % 100), and an MCP server joins your agent. All defensible, all worth counting as surface area before you accept them.", "The one in-band control is the <private> tag, which excludes content from storage entirely. Everything else is decided at install time."]} />

<Flashcards title="Twelve terms from the memory-layer stack" cards={[
  {front: "Observation", back: "claude-mem's unit of storage: a structured note with a type, title and narrative, extracted by the observer model from your agent's tool usage. Not a transcript excerpt."},
  {front: "Observer / SDKAgent", back: "The second model session, running inside the worker daemon, that reads the queued tool usage and writes observations and summaries. Its provider is an install-time flag."},
  {front: "Worker daemon", back: "A local Express service managed by the Bun runtime, on per-user port 37700 + (uid % 100). Holds the session manager, search orchestration, Chroma sync and the UI."},
  {front: "Progressive disclosure / Smart recall", back: "Three-step retrieval — compact index, then timeline context, then full details for selected IDs — with the agent reasoning between the steps. Default since v15.0.0."},
  {front: "FTS5", back: "SQLite's full-text search extension, the keyword half of claude-mem's hybrid search. Chroma embeddings provide the semantic half."},
  {front: "Per-fact embedding", back: "Chroma stores one document for an observation's narrative plus one per extracted fact — obs_ID_narrative, obs_ID_fact_0, obs_ID_fact_1 and so on. One observation becomes several vectors, so a narrow query can retrieve a broadly-titled note."},
  {front: "Degradation contract", back: "The rule mapping failure class to exit code: transport errors exit 0 (never block the host session), client errors exit 2 (block, because they signal a bug)."},
  {front: "contentSessionId vs memorySessionId", back: "The host's session id, invariant for the session, versus the SDK agent's, which changes on every worker restart. Conversion between them is load-bearing for foreign keys."},
  {front: "Content hash", back: "SHA256(memory_session_id + title + narrative) truncated to 16 hex chars, used to dedupe repeats arriving within a 30-second window."},
  {front: "<private> tag", back: "The one in-band exclusion control: content inside it is excluded from storage entirely and never written to profile or project memory."},
  {front: "CMEM Pro", back: "The paid hosted observation and cloud-sync tier: $30/month after a 30-day trial, pitched as moving memory generation off your primary agent's subscription."},
  {front: "Open core (ip-boundary)", back: "The engine, server, CLI, SDKs, MCP tools and adapters are Apache-2.0; hosted recall, team sync, SSO, RBAC, audit UI, the DLP engine and managed evals are reserved commercial areas."},
]} />

<Quiz title="Check yourself" questions={[
  {
    q: "Your coding session starts failing to launch immediately after a plugin update. Given claude-mem's published degradation contract, what is the most likely relationship?",
    options: [
      "Unrelated — the memory layer is designed never to block the host session",
      "The memory worker is probably down, which blocks session start",
      "A version-skewed install is producing client-side errors, which the contract deliberately makes blocking (exit 2)",
      "The Chroma vector store is corrupt, which halts the SessionStart hook"
    ],
    answer: 2,
    explain: "The contract is asymmetric on purpose: transport failures (connection refused, timeouts, 5xx) exit 0 and never block, while 4xx and client-side exceptions exit 2 and do. A half-upgraded install is exactly how you reach the blocking branch — which is why the Setup hook nags about npx claude-mem repair on a version mismatch."
  },
  {
    q: "Which statement about the model that writes claude-mem's observations is accurate?",
    options: [
      "It is always Claude, since the tool runs inside Claude Code",
      "It is a separate model whose provider is an install-time flag, and the project's own cost dataset maps its hosted observer id to a DeepSeek model",
      "It is a small local model bundled with the installer, so nothing leaves your machine",
      "There is no model — observations are produced by deterministic parsing of tool output"
    ],
    answer: 1,
    explain: "The install flag offers host, OpenRouter, Gemini or Anthropic. docs/expense-pricing/README.md resolves the cmem-observer id to deepseek/deepseek-v4-flash on or after 2026-08-08. The name does not determine where your session content goes; the flag does."
  },
  {
    q: "Why does the three-step recall save tokens rather than spend them?",
    options: [
      "Because the embeddings are quantised, so each retrieval is cheaper",
      "Because it caches retrieved observations across sessions",
      "Because the cheap step (a ~50-100-token index hit) decides relevance before the expensive step (a ~500-1,000-token detail fetch) runs on survivors only",
      "Because the summary model compresses the detail before it reaches the agent"
    ],
    answer: 2,
    explain: "Filter on cheap representations, then pay for detail on what survives. It is the same shape as reading a results page before opening tabs, or an index before a row fetch — and it is the correct pattern for any retrieval you attach to an agent."
  },
  {
    q: "The v15.0.2 release disabled reasoning by default for observer requests. What was the failure it fixed, and what is the general lesson?",
    options: [
      "Reasoning tokens made observations less accurate; prefer non-reasoning models for extraction quality",
      "Reasoning tokens filled the output budget, leaving a session with nothing left to emit — so disable reasoning on any model used as a budget-constrained summariser",
      "Reasoning traces were being stored as observations, leaking chain-of-thought into the memory store",
      "Reasoning requests were rejected by OpenAI-compatible endpoints, causing the worker to crash-loop"
    ],
    answer: 1,
    explain: "The release notes are explicit: reasoning tokens were filling the output budget and leaving sessions with zero output. It is a pure consequence of putting a reasoning model into an extraction role with a capped output, and it will recur in anything you build the same way."
  },
  {
    q: "You need to stop one specific thing — a production hostname — from being recorded, mid-session, without reconfiguring anything. What does claude-mem give you?",
    options: [
      "A /forget slash command that retroactively deletes matching observations",
      "Content wrapped in <private> tags is excluded from storage entirely, including profile and project memory",
      "An exclusion glob in ~/.claude-mem/settings.json, which applies from the next session",
      "Nothing — the only control is to disable the plugin for that session"
    ],
    answer: 1,
    explain: "<private> is the single in-band control, and the only one that works mid-session. Everything else — provider choice, cloud-sync opt-in, source scoping — is decided at install or in settings. It is also, by construction, something you have to remember to use."
  },
  {
    q: "The docs say the worker listens on port 37700 + (uid % 100), while release notes mention localhost:37777. What should you conclude?",
    options: [
      "The port changed between versions and 37777 is current",
      "37777 is one user's computed port, not a constant — compute yours from your own uid",
      "37777 is the UI and the API is on a different port",
      "The formula applies only to multi-user server deployments"
    ],
    answer: 1,
    explain: "37700 + (uid % 100) is per-user by design so that two accounts on one machine do not collide. A specific number in a changelog is whatever that author's uid produced. Compute it rather than copying it."
  }
]} />

## Sources & further reading

- **thedotmack/claude-mem**: https://github.com/thedotmack/claude-mem — the project. Apache-2.0, created 31 August 2025, 103,252 stars and last pushed 26 October 2026 (verified via the GitHub API on that date).
- **`docs/architecture-overview.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/architecture-overview.md — the single best source on this page. Layer diagram, the hook table with timeouts, the data-flow diagram, the pending-queue and generator-restart patterns, the exit-0/exit-2 degradation contract, the dedup hash, the two session-id types, the SQLite schema and the Chroma document naming.
- **`docs/security.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/security.md — API-key auth defaults, the `cmem_` prefix and SHA-256-only storage, the two environment variables required together for the loopback bypass, and the BullMQ/Redis notes.
- **`docs/ip-boundary.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/ip-boundary.md — the open-core split between Apache-2.0 components and reserved commercial areas.
- **`docs/expense-pricing/README.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/expense-pricing/README.md — the observer cost-accounting dataset, the `cmem-observer` to `deepseek/deepseek-v4-flash` mapping from 2026-08-08, and the ~98%-input working shape. This is the file that answers "which model reads my code".
- **Release notes v15.0.0** (Smart memory search by default): https://github.com/thedotmack/claude-mem/releases/tag/v15.0.0 — the three-step recall becoming the default on 20 October 2026.
- **Release notes v15.0.2** (reasoning disabled for observer requests): https://github.com/thedotmack/claude-mem/releases/tag/v15.0.2 — the output-budget bug, and the most instructive item in the changelog.
- **Release notes v15.2.1**: https://github.com/thedotmack/claude-mem/releases/tag/v15.2.1 — npm publishing moved to trusted publishing with OIDC and provenance attestations, after `NPM_TOKEN` had been failing since v13.26.1. Worth noting for anyone auditing the package's supply chain.
- **cmem.ai**: https://cmem.ai/ — the hosted tier: $30/month after a 30-day trial, the "moves memory generation off your primary agent's subscription" framing, the local-storage and cloud-sync statements, and the honest caveat that token effects depend on your workload and provider.
- **Model Context Protocol** — tools specification: https://modelcontextprotocol.io/docs/concepts/tools — how the `search`, `timeline` and `get_observations` tools reach your agent.
- **SQLite FTS5**: https://www.sqlite.org/fts5.html — the full-text index behind the cheap first step of recall.
- **Chroma**: https://docs.trychroma.com/ — the vector store, and the per-fact document model that makes narrow queries hit broad notes.

## Next

- [How agent memory actually works](/docs/frontiers/agent-memory-architectures) — the taxonomy this tool sits inside: what counts as memory, which layer each approach operates on, and why most of them fail at retrieval rather than storage
- [Hindsight: agent memory that learns](/docs/models/hindsight-agent-memory-that-learns) — the other end of the design space, where memory is updated by outcome rather than extracted from transcripts
- [CLAUDE.md & memory files](/docs/claude-code/claude-md) — the first-party, hand-written baseline every one of these tools is implicitly competing with, and the one you should get right before adding a daemon
- [What your agent uploads](/docs/security/what-your-agent-uploads) — the broader version of the question this page asks about the observer: what leaves your machine while an agent does ordinary work
