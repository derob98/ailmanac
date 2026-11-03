# Your Stack Choice Is an Agent Cost Lever

> Source: https://derob98.github.io/ailmanac/docs/playbooks/framework-choice-agent-cost · AILmanac (CC BY 4.0) · last verified 2026-11-02

A 12-framework benchmark had Claude Opus 5.5 build the same app five times each. Angular cost 86% more than Hono+htmx. But the token spread is 2.5x while the code spread is only 1.47x, the effective rate per token runs BACKWARDS, and the within-framework ranges overlap enough that most adjacent pairs prove nothing. Here is how to read it — and how to run it on your own stack.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-02" source="https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/">
All framework numbers below come from one experimental benchmark published 28 October 2026, run on a single app with Claude Opus 5.5. The author is explicit that it is not definitive. Model prices change, agents change, and a re-run next quarter will move the ordering. The *mechanisms* in this page are the durable part; treat the specific dollar figures as a dated snapshot and re-measure before you spend a stack decision on them.
</VerifyNote>

<Callout type="objectives" items={[
  "Read the one benchmark that put real numbers on 'which framework is cheaper for an agent to work in'",
  "Spot the three things the headline gets wrong — including a per-token rate that runs backwards",
  "Understand why the token bill tracks the agent's LOOP, not the size of the code it writes",
  "Know which single number actually compounds across your project's life (it is not cost-per-build)",
  "See the uncontrolled confound that may explain several rows, and why it is a lever you own",
  "Run the same measurement on your own stack, with a protocol that survives LLM variance",
]} />

For twenty years, picking a frontend framework meant trading developer experience against bundle size. Agents added a third axis that nobody had numbers for: **how expensive is it for a model to work in this codebase?**

On 28 October 2026, Nolan Lawson published the first serious attempt to measure it. The result went to the front page of Hacker News and spawned a week of "Angular costs 86% more" posts. The headline is real. It is also the least interesting thing in the dataset.

This page is the careful read. Three findings in the data contradict the way it is being quoted, and the most actionable lever in the whole experiment is one the benchmark did not even intend to test.

## The experiment

Twelve stacks, one app, five runs each.

<Steps items={[
  {title: "The task", body: "Build a Pokémon app on PokéAPI — search, filtering, type display, and move data across multiple game versions. The author characterises it as content-heavy with minimal interactivity. Hold onto that; it decides what the results generalise to."},
  {title: "The agent", body: "Claude Opus 5.5 at high effort, given the framework spec, the official MCP server or skill where one existed, and a conformance test suite to code against."},
  {title: "The runs", body: "Five independent runs per framework — three for Angular, which failed outright in 2 of 5 attempts. Medians and full ranges reported, which is the detail that makes the honest read possible."},
  {title: "The measurements", body: "API cost in USD, wall-clock minutes, tokens consumed, non-blank lines of code, Lighthouse scores, and JavaScript kilobytes transferred to the browser."},
]} />

Here is the core result — cost, tokens and code size, sorted by median cost:

| Stack | Cost (median) | Cost range | Tokens | Lines of code | JS shipped |
|---|---|---|---|---|---|
| Hono+htmx | **$2.67** | $2.23–$3.19 | 4.26 M | **1,370** | 18 KiB |
| Astro | $2.76 | $2.16–$3.63 | 4.13 M | 1,461 | **0 KiB** |
| Nuxt | $2.82 | $2.39–$4.25 | **3.85 M** | 1,415 | 84 KiB |
| Vanilla (Vite) | $2.98 | $2.24–$3.37 | 5.00 M | 1,492 | 7 KiB |
| Next.js | $3.14 | $2.58–$4.13 | 4.99 M | 1,539 | 142 KiB |
| Qwik | $3.27 | $2.35–$3.80 | 5.64 M | 1,744 | 40 KiB |
| TanStack Start | $3.54 | $3.11–$3.96 | 7.07 M | 1,697 | 118 KiB |
| SolidStart | $3.79 | $2.84–$4.81 | 7.13 M | 1,630 | 40 KiB |
| React Router | $3.81 | $2.82–$3.97 | 7.58 M | 1,564 | 115 KiB |
| SvelteKit | $4.28 | $3.59–$4.65 | 8.53 M | 1,611 | 36 KiB |
| Gracile+Lit | $4.65 | $3.92–$5.07 | 9.04 M | 1,717 | 8 KiB |
| Angular | **$4.97** | $3.19–$6.82 | **9.76 M** | **2,009** | 93 KiB |

Wall-clock tracked cost closely: Astro 8.2 min and Hono+htmx 8.6 min at the fast end, Angular 17.2 min at the slow end.

## Finding 1: the token bill tracks the loop, not the artifact

Compare the spreads:

- **Tokens:** 3.85 M (Nuxt) → 9.76 M (Angular) = **2.54x**
- **Lines of code:** 1,370 (Hono+htmx) → 2,009 (Angular) = **1.47x**

If tokens were mostly the agent *writing code*, those two ratios would be close. They are not — the token spread is more than 70% wider than the code spread. The extra 5.9 million tokens Angular consumed did not go into the 639 extra lines it produced.

They went into the loop: reading files, re-reading them after each edit, running the conformance suite, interpreting failures, and trying again. **An agent's token bill is dominated by how many times it has to go around, and how much context it drags along each time.** The final artifact is a rounding error.

That reframes the whole question. "Which framework produces less code" is a weak proxy. The real question is which framework lets an agent converge in fewer turns — a function of how predictable the file layout is, how legible the error messages are, how much ceremony a change requires, and how well-represented the framework's current idioms are in training data.

<Callout type="note" items={["Angular's two outright failures are a loop failure, not a code-quality failure. In both runs the agent built an SSR app that rejected non-localhost connections, despite instructions specifying reverse-proxy deployment. That is the agent misreading a deployment constraint — the kind of thing a sharper CLAUDE.md fixes, and a reason to classify failures rather than just count them."]} />

## Finding 2: the effective rate per token runs backwards

This is the finding that is absent from every summary I have read, and it falls out of dividing two columns that nobody divided.

Take median cost ÷ median tokens for each row:

| Stack | Tokens | Cost | Effective $/Mtok |
|---|---|---|---|
| Nuxt | 3.85 M | $2.82 | **$0.73** |
| Astro | 4.13 M | $2.76 | $0.67 |
| Hono+htmx | 4.26 M | $2.67 | $0.63 |
| Next.js | 4.99 M | $3.14 | $0.63 |
| Vanilla | 5.00 M | $2.98 | $0.60 |
| Qwik | 5.64 M | $3.27 | $0.58 |
| SolidStart | 7.13 M | $3.79 | $0.53 |
| Gracile+Lit | 9.04 M | $4.65 | $0.51 |
| Angular | 9.76 M | $4.97 | **$0.51** |

The rate falls as the token count rises, almost monotonically. The frameworks that burn the most tokens pay the *least* per token.

Why? Opus 5.5 lists at **$4 per MTok fresh input, $20 output, and $0.20 for cache reads** — a 5% cache-read multiplier where the platform standard is 10%. A blended rate between $0.51 and $0.73 sits just above the $0.20 cache-read floor and roughly six times *below* the fresh-input rate. There is only one mix that produces those numbers: **the overwhelming majority of counted tokens are cache reads.** Pair pure cache reads with about 11% fresh-and-output traffic and you land at $0.62; shift that to 8% and you land at $0.50 — Angular's number.

So the mechanism is this. Every extra step in a long agentic session replays the same growing context. That replay is cache reads at $0.20. The marginal token in a heavy framework costs a twentieth of the first token, which is why **Angular's 2.54x token count turns into only a 1.86x bill.**

Two consequences that matter more than the ranking:

1. **Prompt caching is doing the heavy lifting in every row.** This benchmark is substantially a measurement of cache-read volume. Any agent setup *without* effective caching would see these same token spreads hit a bill at up to 20x the rate — and the gap between frameworks would widen rather than compress. If you want to know your real exposure to a verbose stack, check your cache hit rate first. See [prompt caching across providers](/docs/models/prompt-caching-across-providers) and [prompt caching economics](/docs/frontiers/prompt-caching-economics).
2. **Cost-per-build systematically understates the penalty of a heavy stack**, because caching absorbs exactly the thing heavy stacks generate. Which leads to the number that actually compounds.

<Callout type="warning" items={["This arithmetic is mine, not the author's. Median cost ÷ median tokens is not the median of the per-run ratios, and medians of two columns can come from different runs — so treat these as approximate, directional figures rather than per-run truth. The direction is consistent across all twelve rows, which is what makes it worth reporting."]} />

## Finding 3: the ranges overlap, so most adjacent pairs prove nothing

Angular's cheapest run cost **$3.19**. Hono+htmx's most expensive run cost **$3.19**. Identical.

Nuxt ranged $2.39–$4.25; Astro $2.16–$3.63; SolidStart $2.84–$4.81. Across five stochastic runs, within-framework variance is comparable to — and often larger than — between-framework differences. The defensible claims from this dataset are coarse:

- **Defensible:** the lean MPA cluster (Hono+htmx, Astro, Nuxt) is cheaper than the heavy cluster (SvelteKit, Gracile+Lit, Angular), by roughly 1.5–1.9x.
- **Not defensible:** "Astro beats Nuxt," "SolidStart beats React Router," or any other neighbouring pair. Those gaps are inside the noise.

The author says as much — the goal was "not to write the end-all-be-all benchmark" but to show evidence-based selection is possible at all. The blog posts converting his medians into league tables dropped the ranges, and the ranges are where the honesty lives. This is the same discipline our [reading AI benchmarks](/docs/models/reading-ai-benchmarks) page applies to model leaderboards: a median without a spread is a vibe wearing a number.

## The uncontrolled confound — and the lever you actually own

Buried in the methodology is the most actionable thing in the experiment. Each agent was offered the framework's official MCP server or skill. **Whether it used them varied wildly:**

| Stack | Runs that used the official MCP / skill |
|---|---|
| SvelteKit | 5 of 5 |
| Next.js | 1–2 of 5 (read guidance files) |
| TanStack Start | 2 of 5 (discovered skills) |
| Nuxt | 0 of 5 (MCP never used) |

Sit with that. Across 60 runs, a significant fraction of the variance may not be "how expensive is this framework" but **"did the agent notice the documentation that was sitting right there."** SvelteKit used its MCP every time and still landed near the expensive end; Nuxt never touched its MCP and came third cheapest. Those two facts alone should stop anyone from reading this table as a clean framework ranking.

The practical inversion: documentation *discovery* is a variable you control completely, and framework choice is one you mostly cannot. Before you migrate a codebase to save $2 a build, make the docs un-missable:

- Put the framework's conventions directly in `CLAUDE.md` rather than hoping a skill gets discovered — see our [CLAUDE.md template](/docs/templates/claude-md) and [generator](/docs/tools/claude-md-generator).
- State deployment constraints explicitly. Angular's two failures were exactly this gap.
- If you ship an MCP server or skill for your own framework or internal library, measure whether agents actually invoke it. A tool that is used in 0 of 5 runs is, economically, a tool that does not exist.

## The number that compounds: cost to edit, not cost to build

A build happens once. Every subsequent task pays a tax proportional to how much code the agent must pull into context to understand the thing it is changing.

That makes **lines of code the durable quantity**, and the spread is narrower than the token spread but permanent: 1,370 for Hono+htmx against 2,009 for Angular — roughly a **32% smaller standing context tax on every future task, forever.**

Combine that with Finding 2 and you get the right mental model. At build time, caching compresses the difference between stacks. Over a maintenance lifetime you pay the LOC difference again on every task, and much of the baseline repo read is *fresh* input on the first turn of each new session rather than a cache hit. The one-off $2.30 gap is noise; a third more code to carry for three years is not.

<Callout type="warning" items={["Do not read this as 'always pick the leanest stack.' Lines of code is one term in the cost function. A framework that prevents a class of state-synchronisation bug may save far more agent loops than it costs in context — and a top HN comment made exactly this case, arguing htmx needs extensive testing to catch state bugs under AI codegen while React's heavy training-data representation helps agents on genuinely interactive apps. That is a real effect this benchmark's content-heavy app cannot see."]} />

## What this does not prove

The limits are load-bearing. The author lists most of them; I have added the ones the coverage dropped.

| Limit | Why it matters |
|---|---|
| **One app type** | Content-heavy, minimal interactivity. Dashboards, editors, games and real-time apps invert the trade-offs that favour MPAs here. |
| **Lighthouse favours MPAs** | LCP in particular punishes client-side routing. The lean stacks winning both cost *and* Lighthouse is partly a measurement artifact, not two independent wins. |
| **Five runs, high variance** | Not enough to separate adjacent rows. Lighthouse itself was inconsistent across runs, picking different LCP elements. |
| **One model, one effort level** | Opus 5.5 at high effort. A cheaper model, or a lower effort setting, changes both the absolute bill and plausibly the ordering. |
| **Chromium + mobile throttling only** | 4x CPU, Slow 4G, one browser, one laptop. |
| **No maintenance tasks measured** | The compounding cost argued above is an inference from the LOC column, not a measured result. Nobody has run the maintenance benchmark yet. |
| **Human time unpriced** | Angular's 17.2-minute median against Astro's 8.2 is a ~9-minute gap. If an engineer supervises the run, those nine minutes of attention plausibly cost more than the entire $2.30 token delta. Optimising the API bill while ignoring wall-clock is the wrong objective function. |

## Run it on your own stack

The strongest thing about this benchmark is that it is reproducible — the harness and the raw results are both public. Your codebase is not a Pokémon app, so the numbers that should drive your decisions are yours.

<Steps items={[
  {title: "Pick a task that represents your real work", body: "Not a greenfield build — that is the one case you will do least often. Pick three recent closed tickets of typical size and use them as the task set. Greenfield benchmarks measure the thing you do once."},
  {title: "Fix everything except the variable", body: "Same model, same effort level, same harness, same prompt, same acceptance tests. If you are comparing two stacks, the conformance suite must be behaviour-level so it can run against both."},
  {title: "Run at least five iterations per arm", body: "Five is the floor, not the target — the published ranges show why. Record every run, not just the median, and report the spread. If the ranges overlap, your result is 'no detectable difference' and that is a real answer."},
  {title: "Log the right four numbers", body: "Cost, tokens split by type (fresh input / output / cache read — the split is the whole story from Finding 2), wall-clock, and resulting diff size. Cost alone hides the mechanism."},
  {title: "Check whether the agent used your tooling", body: "Grep the transcripts for your MCP calls and skill loads. If discovery is inconsistent, fix that first and re-run — it is cheaper than a migration and may erase the gap you were trying to close."},
  {title: "Decide on the compounding term", body: "Weight resulting diff size and standing context tax above one-off build cost. You pay the former on every future task."},
]} />

<PromptCard title="Measure the agent cost of a task on your own stack">
{`I want to measure how expensive a task is for you to complete in this codebase,
so I can compare stacks and tooling with evidence instead of vibes.

Task: <paste a real, closed ticket of typical size>

Rules:
1. Work only inside this repo. Do not install new dependencies.
2. Stop when the existing test suite passes for the changed behaviour.
3. Do not optimise for token use — work the way you normally would. I am
   measuring the honest cost, not a best case.

When you are done, report exactly:
- Files read, and how many times each was re-read
- Number of test/build invocations
- Lines added and removed
- Anything in the repo that made you go around an extra time: missing docs,
  surprising file layout, an unclear error message, a convention you had to
  infer. Be specific and name the file.

That last list is what I am really after. Rank it by how many turns each item cost you.`}
</PromptCard>

The last question is the one that pays. The agent is the only entity that knows which of your conventions cost it three extra loops, and it will tell you if you ask. Those answers convert into `CLAUDE.md` lines, and a good `CLAUDE.md` line is worth more than a framework migration.

<Flashcards cards={[
  { front: "Token spread vs LOC spread in the benchmark", back: "Tokens 2.54x (3.85M Nuxt → 9.76M Angular); lines of code only 1.47x (1,370 → 2,009). The token bill is the agent's loop, not the artifact it produces." },
  { front: "Why heavy frameworks pay less per token", back: "Effective rate falls from ~$0.73/Mtok (Nuxt) to ~$0.51 (Angular). Opus 5.5 charges $4 fresh input, $20 output, $0.20 cache read. Extra agent steps are mostly context replay = cache reads, so the marginal token costs a twentieth of the first." },
  { front: "Angular's cheapest run vs Hono+htmx's dearest", back: "Both $3.19. Within-framework variance rivals between-framework difference, so adjacent pairs in the ranking are not separable on five runs." },
  { front: "The MCP discovery confound", back: "SvelteKit agents used the official MCP 5/5 runs; Nuxt's MCP was used 0/5; TanStack skills found 2/5; Next.js guidance read 1–2/5. Part of the measured spread is 'did the agent find the docs', not framework cost." },
  { front: "Which number compounds", back: "Lines of code. A build happens once; every future task pays a standing context tax proportional to code size. Hono+htmx carries ~32% less than Angular, permanently." },
  { front: "The Lighthouse caveat", back: "Lighthouse metrics — LCP especially — structurally favour multi-page apps over client-side routing. Lean stacks winning cost AND Lighthouse is partly one measurement artifact, not two independent findings." },
  { front: "Angular's 2 of 5 failures", back: "Agents built SSR apps rejecting non-localhost connections despite reverse-proxy instructions. A prompt/constraint failure, not a framework-quality failure — the kind a sharper CLAUDE.md fixes." },
  { front: "Cheapest and dearest to build", back: "Hono+htmx $2.67 median; Angular $4.97 median — a 1.86x bill on a 2.54x token count. Astro $2.76, Nuxt $2.82 complete the lean cluster." },
]} />

<Quiz questions={[
  {
    q: "The benchmark shows Angular consumed 2.54x the tokens of Nuxt, but its bill was only 1.86x. What explains the compression?",
    options: [
      "Angular runs were billed at a volume discount",
      "Most of the extra tokens were cache reads, priced at $0.20/Mtok against $4 for fresh input",
      "Angular's output tokens were shorter on average",
      "The two figures came from different models"
    ],
    answer: 1,
    explain: "Opus 5.5 prices cache reads at $0.20/Mtok — a 5% multiplier, where the platform standard is 10%. Extra agent steps replay the same growing context, which bills as cache reads. The effective blended rate across all twelve stacks lands between $0.51 and $0.73/Mtok, only possible if the large majority of counted tokens are cache reads. The practical warning: an agent setup without effective caching would not see this compression."
  },
  {
    q: "Which comparison from the dataset is actually defensible?",
    options: [
      "Astro is cheaper for agents than Nuxt",
      "SolidStart is cheaper for agents than React Router",
      "The lean MPA cluster is roughly 1.5–1.9x cheaper than the heavy cluster",
      "Qwik produces fewer lines of code than SvelteKit"
    ],
    answer: 2,
    explain: "Only the coarse cluster-level claim survives the variance. Angular's cheapest run and Hono+htmx's dearest run were both exactly $3.19, and ranges like Nuxt's $2.39–$4.25 overlap Astro's $2.16–$3.63 almost entirely. Five stochastic runs cannot separate adjacent rows. (Qwik's 1,744 median LOC is in fact higher than SvelteKit's 1,611, so that option is also factually backwards.)"
  },
  {
    q: "Your team wants to migrate off a framework that scored badly here. Before committing, what is the highest-leverage check?",
    options: [
      "Re-run the published benchmark on a faster laptop",
      "Switch to a cheaper model to reduce the absolute bill",
      "Verify whether your agents are actually discovering your framework docs, MCP server and skills",
      "Reduce the Lighthouse budget so builds finish sooner"
    ],
    answer: 2,
    explain: "Documentation discovery was uncontrolled and wildly inconsistent — 5/5 runs for SvelteKit's MCP, 0/5 for Nuxt's, 2/5 for TanStack's skills. A meaningful share of the measured spread may be discovery rather than framework cost. Fixing discovery is free, reversible and under your control; a migration is none of those. Measure your own stack on your own tickets afterwards."
  },
  {
    q: "Which quantity should weigh most heavily in an agent-era stack decision for a long-lived project?",
    options: [
      "Median cost of the initial build",
      "Resulting code size, because every future task pays a context tax proportional to it",
      "Wall-clock time of the initial build",
      "Kilobytes of JavaScript shipped to the browser"
    ],
    answer: 1,
    explain: "A build happens once; maintenance happens forever. Code size is the standing context tax on every future task — about 32% lower for Hono+htmx than Angular here. Shipped JavaScript matters a great deal for your users but is a separate axis from agent cost (Gracile+Lit shipped only 8 KiB while being the second most expensive to build). Note the honest caveat: the compounding argument is an inference from the LOC column, since no maintenance benchmark has been run."
  },
  {
    q: "Why is 'the lean stacks won on both cost and Lighthouse' a weaker result than it sounds?",
    options: [
      "Lighthouse scores were not actually recorded",
      "Lighthouse structurally favours multi-page apps, so the two results share one measurement bias",
      "Only desktop throttling was tested",
      "Lighthouse was run on a different app than the cost measurement"
    ],
    answer: 1,
    explain: "The author flags it himself: Lighthouse metrics, LCP most of all, punish client-side routing and favour MPA architectures. The lean stacks in this benchmark are mostly MPAs. So cost and Lighthouse are not two independent confirmations — they partly share a bias toward the architecture the test app happened to suit. A content-heavy Pokémon app is close to the best case for an MPA."
  }
]} />

<Callout type="takeaways" items={[
  "Agent token cost tracks the number of loops, not the lines produced: a 2.54x token spread over a 1.47x code spread.",
  "The effective rate per token runs backwards ($0.73 → $0.51/Mtok) because extra agent steps bill as $0.20 cache reads. Caching is absorbing most of the penalty — check your hit rate before trusting any cost-per-build figure.",
  "Report ranges or report nothing. Angular's best run equalled Hono+htmx's worst, so only the coarse lean-vs-heavy cluster claim survives.",
  "Documentation discovery was uncontrolled and may explain several rows. It is also free to fix and entirely yours to control — do that before a migration.",
  "Optimise the quantity that compounds: resulting code size, paid on every future task, not the one-off build bill.",
  "A ~9-minute wall-clock gap under human supervision plausibly costs more than the entire $2.30 token delta. Do not optimise the API bill in isolation.",
]} />

## Sources & further reading

- [Nolan Lawson — The AI cost of JavaScript frameworks (28 October 2026)](https://nolanlawson.com/2026/10/28/the-ai-cost-of-javascript-frameworks/) — the primary source: methodology, all result tables, the Angular failures, the MCP/skills adoption counts, and the author's own caveats
- [nolanlawson/agent-framework-benchmark](https://github.com/nolanlawson/agent-framework-benchmark) — the benchmark harness itself, so you can re-run it against your own stack and model
- [nolanlawson/agent-framework-benchmark-results](https://github.com/nolanlawson/agent-framework-benchmark-results) — the lightly redacted raw per-run results behind the medians
- [Hacker News discussion (item 50323088)](https://news.ycombinator.com/item?id=50323088) — the counterarguments worth reading: the "not Figma" objection on app complexity, the case that htmx is harder for agents than its leanness suggests, and the hidden maintenance cost of avoiding frameworks
- [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — cache-read pricing and TTL behaviour, the mechanism behind Finding 2
- Related on AILmanac: [Prompt caching across providers](/docs/models/prompt-caching-across-providers) — the eligibility thresholds and the break-even rule that decides whether caching helps you at all
- Related on AILmanac: [Prompt caching economics](/docs/frontiers/prompt-caching-economics) — why cache reads become the dominant line item in any long agentic session
- Related on AILmanac: [How to read an AI benchmark without getting fooled](/docs/models/reading-ai-benchmarks) — the same statistical discipline applied to model leaderboards
- Related on AILmanac: [Why agents burn tokens](/docs/models/why-agents-burn-tokens) — the loop-level mechanics behind Finding 1

## Next

- [Why agents burn tokens](/docs/models/why-agents-burn-tokens) — the mechanism underneath Finding 1, at the level of individual turns
- [Prompt caching across providers](/docs/models/prompt-caching-across-providers) — the lever that is quietly paying most of the bill in this benchmark
- [Coding & Software Development](/docs/playbooks/coding) — the broader playbook this decision sits inside
- [CI/CD for Agent-Written Code](/docs/playbooks/ci-for-agent-written-code) — once the agents are cheap and fast, the pipeline is the next thing to break
