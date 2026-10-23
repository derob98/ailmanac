# Plans, Limits & Billing

> Source: https://derob98.github.io/ailmanac/docs/claude-app/plans-and-billing · AILmanac (CC BY 4.0) · last verified 2026-10-20

Free vs Pro vs Max vs Team vs Enterprise — what each tier is actually for, which capabilities are gated behind which plan, how usage limits feel in practice, and why app subscriptions and API billing are different things.

<LevelBadge level="beginner" />

<VerifyNote lastVerified="2026-10-20" source="https://claude.com/pricing">
Plan names, prices and limits change regularly — always check the official pricing page for current numbers. **We deliberately don't quote dollar amounts here**, so this page stays true when the rate card moves. The capability gating below is sourced to the [Help Center article on artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them) and reflects the **October 8–15, 2026** changes; gating moves too, so confirm before you buy a tier for one feature.
</VerifyNote>

Which Claude plan do you need? Here's how to think about it — without quoting prices that would be stale next month (check the [official pricing](https://claude.com/pricing) for those).

<Callout type="objectives" items={[
  "Match a tier to a purpose instead of to a price",
  "See which capabilities are actually gated by plan — and which are not",
  "Know what hitting a usage limit feels like, and the cheapest ways to stop hitting it",
  "Stop confusing an app subscription with API billing"
]} />

## The tiers, by purpose

| Tier | Roughly for |
|---|---|
| **Free** | Trying Claude, light personal use |
| **Pro** | Regular individual use — more usage, more capability |
| **Max** | Heavy individual users who hit Pro limits |
| **Team** | Small teams — shared workspace and management |
| **Enterprise** | Orgs needing admin, security, scale, and controls |

(Exact names and structure can change — confirm on the pricing page.)

## What's actually gated by plan

Most of the time the answer is *usage*, not *features* — which is why upgrading for one capability is usually the wrong reason. These are the exceptions worth knowing, as of October 2026:

| Capability | Free | Pro | Max | Team | Enterprise |
|---|---|---|---|---|---|
| Artifacts, code, charts | ✅ | ✅ | ✅ | ✅ | ✅ |
| [File creation](/docs/claude-app/generating-files) (docx/pptx/xlsx/pdf) | ✅ | ✅ | ✅ | ✅ | ✅ |
| [Docs, Slides, Design](/docs/claude-app/one-claude-docs-and-slides) | ✅ | ✅ | ✅ | ✅ | ✅ |
| [Dashboards](/docs/claude-app/dashboards-and-motion) (beta) | ❌ | ✅ | ✅ | ✅ | ✅ |
| [Motion](/docs/claude-app/dashboards-and-motion) (beta) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Org-wide admin controls over the above | — | — | — | ✅ | ✅ |

Two patterns fall out of that table, and they generalize:

<Steps items={[
  {title: "New surfaces arrive paid and move down", body: "Docs, Slides and Design launched in beta on paid plans and reached Free on October 8, 2026, once they left beta. Dashboards and Motion are at the earlier stage of the same journey. If a beta you want is above your tier, waiting is often the right call."},
  {title: "Enterprise starts restrictive on purpose", body: "A capability that is on by default on Pro, Max and Team is frequently off on Enterprise until an owner enables it in organization settings — and owners can narrow it to specific groups with custom roles. On Enterprise, \"my plan includes it\" and \"I can use it\" are different questions."},
  {title: "Toggles are not only an admin thing", body: "Some capabilities need switching on even on individual plans — file creation lives behind Settings → Capabilities on Free, Pro and Max. Before concluding your plan lacks something, check the toggle."}
]} />

## What "limits" feel like

Consumer plans cap **how much you can use in a window** (messages and usage that reset over time), and higher tiers raise those caps. When you hit a limit you're typically asked to wait until it resets or upgrade — **your work isn't lost, you just pause**.

Heavier models and longer conversations consume your allowance faster. And since the [September 2026 merge](/docs/claude-app/one-claude-docs-and-slides), one more thing is true: **a casually-phrased request in the ordinary chat box can start a long agentic run** that searches the web, executes code and writes files. The cost signal moved from the door to the prompt, so it pays to be explicit in both directions.

<PromptCard title="Keep a request cheap when you only want an answer">{`Answer from this conversation only. Do not search the web, do not
run code, and do not create any files or artifacts. Two paragraphs.`}</PromptCard>

Four habits that buy back more allowance than an upgrade does — all of them variations on [context management](/docs/foundations/tokens-and-context):

<Steps items={[
  {title: "Start a fresh chat per topic", body: "Every turn re-sends the whole conversation. A long thread you've drifted away from is pure overhead — see Tokens & Context."},
  {title: "Say when you don't need the machinery", body: "The prompt above is worth saving as a snippet. Most questions do not need a web search and a code run."},
  {title: "Match the model to the task", body: "Reaching for the most capable model for a quick rewrite burns allowance for nothing. See Models & Pricing for the current line-up."},
  {title: "Batch your edits", body: "Three small corrections in one message cost roughly one turn's context; three separate messages re-send the thread three times. The exception is artifacts, where one change at a time lands more reliably."}
]} />

## How to choose

<Steps items={[
  {title: "Start Free", body: "Learn what you actually use Claude for before paying for a shape of usage you're guessing at."},
  {title: "Upgrade to Pro when limits interrupt real work", body: "Not when you hit a limit once — when the interruption is costing you more than the subscription."},
  {title: "Go Max if you're a power user still hitting caps", body: "This is a usage decision, not a capability one."},
  {title: "Team or Enterprise when other people are involved", body: "Shared workspace, admin controls, compliance posture — and the two org-gated betas. The trigger is colleagues and governance, not raw volume."}
]} />

## Apps vs API billing — different things

- **App plans** = a flat subscription with usage limits (this page).
- **API billing** = pay per [token](/docs/api/tokens-and-pricing) for what you build. Different model, different page.

They do not share a balance, a limit, or a bill. Paying for Max does not give you API credit, and API spend does not raise your chat limits. Claude Code can draw on either, depending on how you authenticate it.

## Quiz

<Quiz questions={[
  {q: "You're on Pro and want to build an animated explainer with Claude Motion. What's the situation?", options: ["Enable it in Settings → Capabilities", "Motion is in beta on Team and Enterprise only — Pro can't use it yet", "It's available on every plan since October 8, 2026", "It requires API billing in addition to Pro"], answer: 1, explain: "Motion is in beta on Team and Enterprise plans only (on by default on Team, off on Enterprise until an owner enables it). Dashboards is the beta that reaches Pro and Max. Docs, Slides and Design left beta on October 8, 2026 and are on every plan including Free."},
  {q: "You hit your usage limit halfway through a long piece of work. What happens to the work?", options: ["It's discarded and you start over after the reset", "Nothing — you pause until the limit resets or you upgrade", "It finishes at reduced quality on a smaller model", "It's queued and completes automatically later"], answer: 1, explain: "Hitting a limit pauses you; it does not destroy your work. You wait for the window to reset or upgrade. The cheaper fix is usually upstream: fresh chats per topic, an explicit \"don't search or run code\" when you only want an answer, and a model matched to the task."},
  {q: "You pay for Claude Max. How much API credit does that give you?", options: ["A monthly token allowance proportional to the plan", "None — app subscriptions and API billing are separate and don't share a balance", "Unlimited API access for personal projects", "API access at a discounted per-token rate"], answer: 1, explain: "An app plan is a flat subscription with usage limits; API billing is pay-per-token for what you build. They share no balance, no limit and no bill. Claude Code can authenticate against either, which is where the confusion usually starts."}
]} />

<Callout type="takeaways" items={[
  "Plans mostly gate usage, not features. Upgrading for a single capability is usually the wrong reason — check the toggle first.",
  "The current exceptions: Dashboards is beta on Pro and up, Motion is beta on Team and Enterprise only. Docs, Slides, Design and file creation are on every plan including Free.",
  "On Enterprise, \"included in my plan\" and \"available to me\" are different questions — owners enable capabilities per organization, and can narrow them to groups.",
  "Hitting a limit pauses you, it doesn't lose your work. Fresh chats, an explicit no-search instruction, and a right-sized model buy back more allowance than an upgrade.",
  "App subscriptions and API billing are separate systems with separate balances. Max gives you no API credit."
]} />

## Next

- [Getting Started with Claude.ai](/docs/claude-app/getting-started) — if you're still deciding what you'd use it for
- [Tokens, Context & Pricing (API)](/docs/api/tokens-and-pricing) — the other billing model, explained
- [Models & Pricing](/docs/whats-new/models-and-pricing) — the current line-up, so you can right-size the model
- [Privacy & Data Handling](/docs/foundations/privacy) — what differs between consumer and business tiers
