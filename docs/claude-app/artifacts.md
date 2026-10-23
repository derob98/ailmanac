# Artifacts: Live, Runnable Outputs

> Source: https://derob98.github.io/ailmanac/docs/claude-app/artifacts · AILmanac (CC BY 4.0) · last verified 2026-10-20

The side panel where Claude builds documents, decks, designs, charts and working apps you can use, iterate on, and export.

<LevelBadge level="beginner" />

<VerifyNote lastVerified="2026-10-20" source="https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them">
Artifacts are available on **Free, Pro, Max, Team and Enterprise**. There are now **five templates**. **Claude Docs**, **Claude Slides** and **Claude Design** **left beta on October 8, 2026** and are on every plan including Free, on by default (on Enterprise they turned on by default on **October 15, 2026**). **Claude Dashboards** is in beta on **Pro, Max, Team and Enterprise**, and **Claude Motion** is in beta on **Team and Enterprise** only — both off by default on Enterprise until an owner enables them. Capabilities here move fast — confirm current behavior in the Help Center.
</VerifyNote>

**Artifacts** are outputs Claude renders in a **side panel** next to the chat — a document, a deck, a chart, a working app — that you can see, use, and iterate on, separate from the conversation text.

Since the [September 2026 merge](/docs/claude-app/one-claude-docs-and-slides), the panel is also where the **templates** live. That makes "artifact" the container and "template" the starting shape. The October 8, 2026 release took Docs, Slides and Design out of beta and added two more: see [Dashboards & Motion](/docs/claude-app/dashboards-and-motion).

<Callout type="objectives" items={[
  "Know what the artifact panel can produce, and which outputs are generally available versus still in beta",
  "Pick between a Doc, a deck, a design, a dashboard, an animation, a runnable app, and a downloadable file — without trial and error",
  "Iterate on an artifact in plain language instead of re-asking from scratch",
  "Know which artifacts you can export, in which formats, and on which plans"
]} />

## What you can make

| Output | What it is | Plan |
| --- | --- | --- |
| **Mini web apps & tools** | A calculator, a quiz, a form, a small interactive demo | All plans |
| **Charts & diagrams** | Visuals and simple one-off charts from data in the chat | All plans |
| **Code** | Something you can read and run | All plans |
| **Claude Docs** | A living, multi-tab document you co-edit with Claude and your team | All plans |
| **Claude Slides** | A deck built from your notes or the conversation, presentable in place | All plans |
| **Claude Design** | Visuals, mockups, prototypes and landing pages against your design system | All plans |
| **Claude Dashboards** | Charts backed by a live SQL query against your warehouse or a connected app | Pro, Max, Team, Enterprise — beta |
| **Claude Motion** | A short animation written as editable code, exported as MP4 | Team, Enterprise — beta |

Exports differ by type: Docs go to **Word, PDF, Markdown and Google Docs**; Slides to **PowerPoint and PDF**; Designs as a **.zip, PDF, PowerPoint or standalone HTML**; Motion as **MP4**.

## Why it's powerful for non-developers

You can build something *usable* — "make me a tip calculator for a group dinner," "a dashboard from this CSV" — by describing it, then refine it conversationally ("add a service-charge field," "make the buttons bigger"). It's the clearest example of **building with AI without writing code yourself**.

## How to work with artifacts

<Steps items={[
  {title: "Ask for the thing, with specifics", body: "State the purpose, the inputs, the audience and the look. Vagueness is the main reason a first artifact misses — the same rule as ordinary prompting."},
  {title: "Or choose the shape yourself", body: "Select Output in the message box and pick a template, or start one from the Artifacts tab. Do this when Claude keeps producing a different shape than you had in mind."},
  {title: "Iterate in plain language", body: "Claude updates the same artifact rather than making a new one. One change at a time is far easier to get right than a list of five."},
  {title: "Use it, then export or share", body: "Try it in the panel. Docs, Slides and Designs each have their own export formats; sharing rules depend on your plan."}
]} />

```mermaid
flowchart LR
  A[Describe what you want] --> B[Claude builds an artifact]
  B --> C[You try it in the side panel]
  C --> D["Tweak this…"] --> B
  C --> E[Export or share]
```

<PromptCard title="A specific artifact brief beats a vague one">{`Build me an interactive artifact: a tip calculator for a group dinner.

Inputs: bill total, number of people, tip percentage (slider, 0-30%,
default 18), and a toggle for "service charge already included".
Output: tip amount, total, and per-person share, updating live.

Audience: my friends on their phones — big tap targets, works at
375px wide, no explanation text.`}</PromptCard>

## Tips

- **Be concrete** about inputs/outputs and audience — same as good [prompting](/docs/prompting/basics).
- **Iterate small.** One change at a time is easier to get right.
- **Verify any logic/numbers** an artifact computes for important uses ([Hallucinations](/docs/foundations/hallucinations)).
- **Charts inside a Doc don't refresh themselves.** Change the data and the chart keeps the old values until you ask Claude to rebuild it. If you want a chart that *does* stay current, that's what [Dashboards](/docs/claude-app/dashboards-and-motion) is for.

## Quiz

<Quiz questions={[
  {q: "You're on the Free plan and ask Claude to turn a conversation into a shareable multi-tab document. What do you get?", options: ["A Claude Doc — Docs left beta on October 8, 2026 and is on every plan including Free", "A Claude Doc, but view-only", "Not a Claude Doc — the templates are beta on paid plans only", "Nothing, artifacts require a paid plan"], answer: 0, explain: "On October 8, 2026 Docs, Slides and Design left beta and became available on every plan, including Free, on by default. The two templates still in beta are Dashboards (Pro, Max, Team, Enterprise) and Motion (Team, Enterprise only)."},
  {q: "Claude built an artifact that's close but the buttons are too small. What's the efficient move?", options: ["Start a new conversation with a fuller spec", "Ask for the change in plain language — Claude updates the same artifact", "Export it and edit it by hand", "Ask for five fixes at once to save turns"], answer: 1, explain: "Iterating conversationally updates the same artifact, which is the whole point of the panel. And one change at a time lands more reliably than a batch of five."},
  {q: "You want a chart that stays current as the underlying data changes. Which artifact do you reach for?", options: ["A chart inside a Claude Doc — it refreshes when the data changes", "A Claude Dashboard — each chart is backed by a live query against your data source", "A plain chart artifact, then re-export it daily", "Claude Design, which binds charts to a data source"], answer: 1, explain: "A chart inside a Doc or a plain artifact is a snapshot and keeps the old values until you ask Claude to rebuild it. Dashboards is the template whose charts are backed by a SQL query run against your warehouse or a connected app, with each chart showing when its data was last refreshed."}
]} />

<Callout type="takeaways" items={[
  "Artifact = the side panel container; template = the starting shape. There are five: Docs, Slides, Design, Dashboards and Motion.",
  "Docs, Slides and Design are generally available on every plan including Free since October 8, 2026. Dashboards is beta on paid plans; Motion is beta on Team and Enterprise only.",
  "Iterate in plain language on the same artifact — don't restart the conversation.",
  "Always verify computed numbers, and rebuild snapshot charts after the data changes — only Dashboards charts are query-backed."
]} />

## Next

- [One Claude: The Merge, Claude Docs & Claude Slides](/docs/claude-app/one-claude-docs-and-slides) — the three GA templates in depth, and their limits
- [Claude Dashboards & Claude Motion](/docs/claude-app/dashboards-and-motion) — the two beta templates, and the sharing rules that catch people out
- [Generating Real Files (docx/pptx/xlsx/pdf)](/docs/claude-app/generating-files) — when you want a download instead
- [Data Analysis playbook](/docs/playbooks/data-analysis)
