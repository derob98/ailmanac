# Business, Marketing & Strategy

> Source: https://derob98.github.io/ailmanac/docs/playbooks/business · AILmanac (CC BY 4.0)

Research, copy, support drafts and planning for non-technical owners — with caveats.

<LevelBadge level="all" />

For founders and small teams, AI is leverage: it does the work of a junior marketer, analyst, and assistant at once. Direct it well and keep judgment on the things that matter.

<Callout type="objectives" items={[
  "Pick the six business jobs where AI gives the most leverage per minute spent",
  "Write the positioning one-liner first, and derive every piece of copy from it",
  "Spot the four claims you must never let a model generate for you",
  "Turn your best prompts into reusable assets instead of retyping them"
]} />

## High-leverage uses

- **Positioning & messaging** — nail the value prop, then derive copy from it.
- **Marketing content** — landing pages, emails, ads, social, FAQs (see [Writing](/docs/playbooks/writing)).
- **Customer comms** — draft replies, handle complaints, write announcements.
- **Research** — market/competitor scans (verify!), customer-interview question sets.
- **Planning** — turn goals into prioritized, time-boxed plans.
- **Docs & ops** — SOPs, job posts, meeting summaries.

## Start with positioning

Before any copy, get the one-liner right.

<PromptCard title="Three value propositions, each critiqued in one line">
{`Write 3 versions of a value proposition using: for [audience] who [need],
[product] is a [category] that [key benefit], unlike [alternative].
Then critique each in one line.`}
</PromptCard>

Everything downstream (ads, emails, landing pages) gets easier once this is sharp. The reason is mechanical, not stylistic: a landing page written from a vague one-liner has nothing to be consistent with, so each section drifts. Fix the sentence and the headline, the subhead, and the three feature blurbs all have the same thing to say.

## Caveats for business use

<Steps items={[
  {
    "title": "Never invent proof",
    "body": "Testimonials, metrics, case studies, and awards are the four things a model will happily generate and you can never publish. Ask for placeholders instead — write [insert real number] and fill it from your own data. A fabricated metric in a deck survives for years."
  },
  {
    "title": "Watch regulated or unsubstantiated claims",
    "body": "Health, finance, \"#1,\" and guarantees are the categories where the copy is not just wrong but actionable. A model has no idea which claims your jurisdiction requires you to substantiate."
  },
  {
    "title": "Verify market facts and figures before acting",
    "body": "A competitor scan reads like research and is partly recall. Market sizes, funding amounts, pricing, and headcounts are exactly the numbers that come back confident and stale."
  },
  {
    "title": "Protect your data",
    "body": "Don't paste customer PII or confidential numbers into unvetted tools. The question to ask of any tool is not whether it is trustworthy in general, but what it retains and who at that company can read it."
  }
]} />

:::warning[The short version]
**Never invent** testimonials, metrics, case studies, or awards — use `[insert real number]` placeholders and fill them with real data. **Watch** regulated or unsubstantiated claims (health, finance, "#1", guarantees). **Verify** market facts and figures before acting ([Hallucinations](/docs/foundations/hallucinations)). **Protect data** — don't paste customer PII or confidential numbers into unvetted tools ([Privacy](/docs/foundations/privacy)).
:::

## Make it repeatable

Turn your best prompts into reusable assets — a [Project](/docs/claude-app/projects) with your brand voice and docs, or the [Business & Marketing skill pack](/docs/templates/skills) so the standards apply automatically.

The difference matters once more than one person is writing. A good prompt in your notes is a thing you remember to use; the same prompt as a Project instruction or a skill is a thing that applies whether anyone remembers or not — including the "never invent a metric" rule above.

<Quiz questions={[
  {
    "q": "You need a case study for a landing page and have no published customer results yet. What does this page tell you to do?",
    "options": [
      "Ask for a realistic, clearly illustrative example",
      "Ask for placeholders such as [insert real number] and fill them from your own data",
      "Use an industry average instead",
      "Describe a composite of several customers"
    ],
    "answer": 1,
    "explain": "Testimonials, metrics, case studies, and awards are the four things never to let a model generate. Placeholders keep the structure of the page while making the missing proof visible — a plausible invented figure is the one that quietly ships."
  },
  {
    "q": "Why does this page insist on getting the value proposition right before writing any copy?",
    "options": [
      "Because value propositions are harder to write than copy",
      "Because search engines rank the one-liner most heavily",
      "Because every downstream asset derives from it, so a vague one-liner lets each section drift",
      "Because it is the only part a model cannot draft for you"
    ],
    "answer": 2,
    "explain": "Ads, emails, and landing pages are all derivations of the same claim. With a sharp one-liner they are consistent by construction; with a vague one, each section invents its own angle."
  },
  {
    "q": "What is the advantage of a Project or skill pack over a prompt saved in your notes?",
    "options": [
      "It produces longer outputs",
      "It applies your standards automatically, whether or not anyone remembers to paste it",
      "It removes the need to verify facts",
      "It works without a subscription"
    ],
    "answer": 1,
    "explain": "A saved prompt depends on a person remembering it. Instructions attached to a Project or a skill pack apply by default — which is what you want for standing rules like \"never invent a metric.\""
  }
]} />

<Callout type="takeaways" items={[
  "Positioning first. Every other asset is a derivation of that one sentence.",
  "Four things a model must never produce for you: testimonials, metrics, case studies, awards.",
  "Health, finance, \"#1\" and guarantees are claim categories where wrong copy is actionable, not just bad.",
  "Competitor research reads like research and is partly recall — verify the numbers before you act.",
  "Encode your standards in a Project or skill pack so they apply without anyone remembering to."
]} />

## Next

- [Writing & Content Creation](/docs/playbooks/writing)
- [Business & Marketing skill pack](/docs/templates/skills)
- [Everyday Productivity](/docs/playbooks/productivity)
