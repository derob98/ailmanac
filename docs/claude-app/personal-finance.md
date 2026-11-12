# Personal Finance in Claude: what it reads, and the three privacy edges

> Source: https://derob98.github.io/ailmanac/docs/claude-app/personal-finance · AILmanac (CC BY 4.0) · last verified 2026-11-09

The field guide to Personal Finance in Claude (beta, Nov 5 2026) — the exact data Plaid hands over, the hub-vs-outside training boundary, the artifact that can read the READER's accounts, where the numbers go wrong, and what unlinking does not undo.

<LevelBadge level="beginner" />

<Callout type="objectives" items={[
  "Exactly which fields Plaid hands Claude — and the three categories it does NOT, even on a linked investment account",
  "The training boundary nobody reads carefully: conversations inside the Personal Finance hub are excluded, conversations outside it are not",
  "The sharing edge that should change how you use this: a published artifact can read the linked accounts of whoever opens it",
  "Four specific reasons a Claude figure will disagree with your bank app — and which one can tell you you have more money than you do",
  "What unlinking actually removes, what it leaves behind forever, and the one action that is explicitly irreversible",
]} />

<VerifyNote lastVerified="2026-11-09" source="https://support.claude.com/en/articles/18185620-use-personal-finance-with-claude">
Personal Finance was announced **November 5, 2026** and is **in beta**, on the **Pro, Max, and Ultra** plans, **in the US only**, with **US banks only**. It is explicitly *not* on Free, Team, or Enterprise, and Anthropic says the rollout is gradual — you may not see it yet. Everything on this page comes from Anthropic's [announcement](https://claude.com/resources/articles/introducing-personal-finance-in-claude) and its [help-center article](https://support.claude.com/en/articles/18185620-use-personal-finance-with-claude); a beta's scope and limits move, so confirm both before you rely on any specific number.
</VerifyNote>

On **November 5, 2026** Anthropic shipped the first Claude feature that reads your actual money: **Personal Finance**, a dedicated hub at `claude.ai/personal-finance` where you link bank, credit card, loan, and investment accounts through Plaid and then ask Claude questions about your own spending.

The press coverage all landed on the same two facts — *it uses Plaid* and *it is read-only* — and both are true. They are also the two least interesting facts about it. The things that will actually change how you use this feature are buried in the help article: a training boundary that depends on **which part of the app you are in**, an artifact-sharing behavior that is genuinely surprising, and four distinct ways the number Claude shows you can be wrong in your favor.

This page is the parts the coverage skipped.

## The one-paragraph version

You open the Personal Finance hub, link a bank through Plaid (you sign in **at your bank**, so Claude never receives your password), and Claude gets read-only access to balances, credit limits, and up to 24 months of transactions across up to 16 banks. Conversations **inside the hub** are not used to train Anthropic's models and are kept out of memory and your monthly recap; conversations **outside** the hub fall back to your normal privacy settings. Claude cannot move, manage, or invest money, and Anthropic states plainly that the feature "isn't designed to give investment advice." It does not work in Claude Code, Cowork tasks, scheduled tasks, or Claude Duet. Unlinking stops future reads but does **not** retract anything Claude already said.

## Setting it up

<Steps items={[
  {title: "Open Personal Finance on a supported surface", body: "Claude on the web, Claude Desktop, Claude for iOS, or Claude for Android — entry point is claude.ai/personal-finance. Anthropic lists the absence of a Claude Code path under current limitations, so read it as today's scope rather than a permanent design decision."},
  {title: "Start the Plaid flow and sign in AT YOUR BANK", body: "Plaid opens in a new window on web, your default browser on Desktop, in-app on iOS, a browser tab on Android. You authenticate with your bank directly inside Plaid. Anthropic is explicit: Claude does not ask for and does not see your bank password."},
  {title: "Finish within 10 minutes", body: "The help article gives a hard window on the Plaid handoff. If you stall on a two-factor prompt and come back later, restart the flow rather than waiting."},
  {title: "Read Plaid's consent screen more carefully than you want to", body: "Plaid may ask you to consent to sharing investment, credit, and loan data. That is Plaid's scope, not Claude's. Claude reads a narrower set — see the next section. Consenting to more at the Plaid layer does not mean Claude uses more today, but it does mean you have authorized it at the aggregator."},
  {title: "Link up to 16 banks — and decide about second logins", body: "You can keep two logins at the same bank (a joint account and a business account, say). Do it deliberately: two logins at one institution is the single most common cause of double-counted balances."}
]} />

Plaid also appears as an ordinary [connector](/docs/claude-app/connectors) you can govern per chat: **+** → **Connectors** → **Plaid**, set to *Blocked*, *Always allow*, or *Needs approval*. If you want financial data available only when you deliberately ask for it, *Needs approval* is the setting you want.

## Exactly what Claude can see

This is the table to screenshot before you decide. Anthropic enumerates it field by field.

| Category | Claude reads | Claude does **not** read |
| --- | --- | --- |
| Institution | Bank name | — |
| Account identity | Account name, type, and **last four digits** | The full account number |
| Balances | Current balances and **credit limits** | — |
| Transactions | **Up to 24 months**, with amount, date, merchant, category, and your bank's own description | — |
| Investment accounts | Balances and credit limits only | **Holdings, trades, rates, or terms** |
| Credentials | Nothing | Your bank username or password |

Two edges on that table:

- **"Up to two years"** in the announcement and **"up to 24 months"** in the help article are the same thing. The help article is the one that enumerates the per-transaction fields, so cite that one.
- **The last-four guarantee is a Plaid guarantee, not a content guarantee.** Anthropic flags the leak path itself: if your bank writes a full account number into an *account name* or a *transaction description*, Claude may see it there. Plaid hands over four digits; your bank's own free-text fields are not bound by that.

<Callout type="warning" items={[
  "You can link an investment account, and Claude will read its balance — but it cannot see holdings, trades, rates, or terms. Any answer about portfolio composition, yield, or fees is therefore not grounded in your account at all. Treat it as a general-knowledge answer that happens to appear next to your real balance."
]} />

## What it structurally cannot do

- **No money movement.** "Personal Finance can only read your accounts. It can't move, manage, or invest your money." Access is read-only at the Plaid grant level, not merely discouraged by a prompt.
- **No advice posture.** Anthropic's own sentence, identical on both pages: *"Personal Finance helps you understand your money, and it isn't designed to give investment advice."* For larger decisions Anthropic points at licensed professionals working alongside Claude rather than at Claude alone.
- **No monetization surface.** No ads, no sponsored recommendations, and no Anthropic-branded credit cards, loans, or savings accounts.
- **Reduced tooling inside finance chats.** In a chat that uses linked accounts, Claude may not be able to run code or work with Word, Excel, PowerPoint, or PDF files. It can still produce text, tables, and plain-text files such as `.csv` — so plan your exports around CSV, not XLSX. (Contrast with [generating real files](/docs/claude-app/generating-files) in a normal chat.)

## The three privacy edges

### 1. The training boundary is a *location*, not a setting

This is the sentence to internalize, because it is easy to get backwards:

> Conversations **in the Personal Finance hub** are not used to train Anthropic's models. For anything you share with Claude **outside** the hub, your [privacy settings](/docs/foundations/privacy) apply.

So pasting a bank statement into an ordinary chat is governed by your normal account settings — the exclusion travels with the hub, not with the subject matter. If you have model improvement enabled on your account, "I was talking about money" is not an exemption.

The hub also gets two quieter exclusions: once a chat uses your linked accounts, it is designed **not to save anything to [memory](/docs/claude-app/memory)**, not to be searched later, and to be **left out of your monthly recap — including the title**.

### 2. Artifacts outlive the chat, and can read the reader's accounts

Here is the genuinely surprising one, straight from the help article:

> **Artifacts can read the linked accounts of the person who opens them, if that person has Personal Finance and allows Plaid.**

Read that twice. A budget dashboard you build in your Personal Finance hub and then publish is not a static picture of *your* numbers — opened by someone else who also has Personal Finance and allows Plaid, it can pull *their* accounts. That is reasonable behavior for a reusable tool and a bad surprise if you were thinking of it as a screenshot.

Two more artifact facts in the same family:

- Claude **asks before publishing** an artifact from a finance chat — that prompt is the control point, not an interruption to click through.
- An artifact **stays until you delete it, even if you delete the chat.** Deleting the conversation is not a cleanup.
- A **shared chat link** exposes the figures from your accounts to anyone with the link, like any other [shared Claude conversation](/docs/claude-app/artifacts).

### 3. Retention is the ordinary consumer policy, not a special one

The data "appears in your conversation and stays in your chat history until you delete the chat," subject to Anthropic's general retention practices. There is no Personal-Finance-specific retention article — Anthropic's [Privacy Center](https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data) consumer page is what governs, and it says deleted conversations leave your history immediately and back-end storage within 30 days. Plaid handles the bank data under **its own** terms and privacy policy, and Anthropic's hosting providers see it too.

<VerifyNote lastVerified="2026-11-09" source="https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data">
The 30-day deletion window, the up-to-5-years de-identified model-training pipeline figure, and the up-to-2-years Usage Policy retention figure come from Anthropic's **general** consumer retention page (dated July 1, 2026), which does not mention Personal Finance or financial data specifically. Do not quote them as finance-specific commitments.
</VerifyNote>

## Where the numbers will be wrong

Anthropic documents this rather than hiding it, which is to its credit — and the fourth one fails in the dangerous direction.

<Steps items={[
  {title: "Balances can be a day or two old", body: "Plaid syncs; it does not stream. A balance that looks current may predate yesterday's transactions. Any same-day decision needs the bank app, not Claude."},
  {title: "A bank linked through two logins can be counted twice", body: "This is why the 'keep both logins' choice during setup matters. The same account reached by two paths inflates every total built on it."},
  {title: "An unreadable bank is silently omitted", body: "If one institution cannot be read, its spending simply is not in the figure — and a budget widget then shows MORE money left than you actually have. This is the one error mode that flatters you, which makes it the one to check."},
  {title: "Claude is still a language model", body: "Anthropic's own instruction is the right habit: ask which transactions are behind a number, and check important figures against your bank's app or statements."}
]} />

<PromptCard title="The verification prompt to make a habit">
{`Before I act on this: list the individual transactions that make up that number,
with date, merchant and amount, and give me the subtotal per linked account.
Flag any account you could not read for this period, and tell me the date of
the most recent transaction you can see per account.`}
</PromptCard>

That prompt turns every answer into something you can reconcile, and it surfaces the stale-sync and omitted-bank failures above without you having to suspect them first.

## Prompts that play to its strengths

The feature is good at *description* over 24 months of real transactions, and weak at anything requiring data it does not have. Aim accordingly.

<PromptCard title="Categorization audit — find the misfiled recurring charges">
{`Group every recurring charge over the last 12 months by merchant. For each,
show the typical amount, the cadence, whether the amount changed and when, and
the category my bank assigned. List separately any subscription that charged me
in the last 12 months but not in the last 2 months.`}
</PromptCard>

<PromptCard title="Year-over-year, with the comparison made explicit">
{`Compare the last 6 months to the same 6 months a year earlier, by category.
Show absolute change and percent change, sort by absolute change, and exclude
transfers between my own linked accounts so they do not double-count.
Name any category where the earlier period has incomplete data.`}
</PromptCard>

<PromptCard title="A CSV you can take elsewhere (code execution is limited here)">
{`Produce a plain-text CSV of every transaction over $200 in the last 90 days
with columns: date, account_name, merchant, bank_description, category, amount.
Do not summarize — I want the rows.`}
</PromptCard>

## Unlinking: what goes away, and what never does

<Steps items={[
  {title: "Unlink a bank", body: "Personal Finance → three-dot menu → 'Manage linked accounts' on web and Desktop, or the gear icon on iOS and Android → Unlink → confirm. You can also disconnect Claude at my.plaid.com."},
  {title: "Accept that it is per LOGIN, not per account", body: "Every account you linked with that bank login is unlinked together. Anthropic states it outright: you cannot unlink a single account."},
  {title: "Know what survives", body: "Claude stops reading that bank going forward. What Claude already SAID stays in your chats, and in any artifacts or shared links, until you remove them yourself. Unlinking is not a retraction."},
  {title: "Think twice before removing the LAST bank", body: "Removing your last linked bank resets the dashboard: your widgets, their settings including budgets, and your setup answers are deleted, and Anthropic says this cannot be undone."}
]} />

Three adjacent lifecycle rules worth knowing before they surprise you:

- **Your paid plan ends.** You can no longer open Personal Finance and Claude can no longer read your accounts in chats — but **your banks stay linked** until you unlink them. Clean up via Customize/Plugins → Connectors → Plaid → Unlink, or at `my.plaid.com`.
- **You move to a Team or Enterprise plan.** Claude unlinks your banks when the move *starts*. Plan for the gap.
- **You delete your Claude account.** Banks are unlinked automatically, after the deletion is processed.
- **Data exports do not yet include your saved Personal Finance dashboard.** If the widget configuration matters to you, write it down.

## Where it does and does not run

| Surface | Personal Finance? |
| --- | --- |
| Claude on the web (`claude.ai/personal-finance`) | ✅ Yes |
| Claude Desktop | ✅ Yes |
| Claude for iOS / Android | ✅ Yes |
| Claude Code | ❌ No |
| [Cowork tasks and scheduled tasks](/docs/claude-app/cowork-scheduled-tasks) | ❌ No |
| Claude Duet | ❌ No |
| Projects | ⚠️ "May not" work — treat as unsupported |
| Free, Team, Enterprise plans | ❌ No |
| Outside the US, or on a VPN exiting another country | ❌ Hub disappears until you are back; banks stay linked |

The Claude Code and scheduled-task exclusions are the ones developers trip over: there is no way to build an unattended agent on top of this, which is also why the [prompt-injection](/docs/security/prompt-injection) surface here is much smaller than it would otherwise be — a human is in every loop.

## The one control that spans every assistant

Claude is not the first assistant to read a bank account. OpenAI shipped a comparable ChatGPT personal-finance experience earlier in 2026, also built on Plaid, and that shared plumbing has a practical consequence worth knowing:

**Plaid, not the assistant, is where your permissions actually live.** Whichever AI product you connected, the grant is a Plaid connection, and you can see and revoke it at **`my.plaid.com`** — independently of whether you still have the subscription, still have the app installed, or can still reach the feature. For Claude specifically that matters because a lapsed plan leaves your banks linked; the Plaid portal is the backstop.

<VerifyNote lastVerified="2026-11-09" source="https://plaid.com/blog/chatgpt-personal-finance-plaid/">
Plaid confirms that **ChatGPT Pro users in the US can connect financial accounts through Plaid**, and describes the launch as a preview; trade coverage dates it to **May 15, 2026** and cites OpenAI's release for **12,000+ supported institutions** (which is Plaid's network size, not an integration-specific count). We did **not** independently verify OpenAI's own documentation here: `openai.com` and `help.openai.com` block automated fetching, so the comparable field-by-field data list, read-only status, history depth, and model-training policy for ChatGPT are **not** established by the sources cited on this page. Read OpenAI's own announcement and help center before drawing any side-by-side conclusion. Google has made no equivalent direct bank-connection announcement that we were able to source.
</VerifyNote>

The transferable habit, regardless of assistant: grant at the aggregator, verify at the aggregator, revoke at the aggregator — and treat the assistant's own toggle as a convenience, not the boundary. See [what AI costs across providers](/docs/models/what-ai-costs-across-providers) for the same "check it yourself per provider" discipline applied to billing.

## Common mistakes

<Callout type="warning" items={[
  "Treating a published artifact as a screenshot of your numbers. It is a live tool: opened by someone who also has Personal Finance and allows Plaid, it can read THEIR accounts. Decide that on purpose.",
  "Deleting the chat to clean up. Artifacts survive chat deletion. Delete the artifact.",
  "Assuming the no-training promise follows the topic. It follows the HUB. Pasting a statement into an ordinary chat is governed by your normal privacy settings.",
  "Trusting a budget that says you have money left. An unreadable bank is omitted silently, which inflates 'remaining' rather than deflating it. Check which accounts were readable for the period.",
  "Keeping two logins at one bank without noticing. Totals double-count. If you need both, tell Claude so in the prompt and exclude internal transfers.",
  "Expecting portfolio answers from a linked investment account. Balances only — no holdings, trades, rates or terms. The confident answer about your asset allocation is not reading your account.",
  "Asking for an .xlsx. Code execution and Office-file handling are limited inside finance chats. Ask for CSV or a table.",
  "Consenting to Plaid's widest scope by reflex. Plaid may request investment, credit and loan permissions broader than what Claude reads today."
]} />

## Flashcards

<Flashcards cards={[
  {front: "How far back can Claude read transactions?", back: "Up to 24 months (\"up to two years\"), with amount, date, merchant, category, and the bank's own description."},
  {front: "How many banks can you link?", back: "Up to 16. You may also keep two separate logins at the same bank — at the cost of possible double-counting."},
  {front: "Which conversations are excluded from model training?", back: "Those in the Personal Finance hub. Outside the hub, your normal privacy settings apply."},
  {front: "What can Claude see on a linked investment account?", back: "Balances and credit limits only — not holdings, trades, rates, or terms."},
  {front: "What happens when you unlink a bank?", back: "Claude stops reading it, and every account under that login goes at once. Anything Claude already said stays in your chats, artifacts, and shared links."},
  {front: "Which action is explicitly irreversible?", back: "Removing your last linked bank — the dashboard resets and widgets, budget settings, and setup answers are deleted."},
  {front: "Does Claude ever see your bank password?", back: "No. You authenticate at your bank inside Plaid; Anthropic states Claude does not ask for or see it."},
  {front: "Which error mode flatters you?", back: "A bank that cannot be read is silently omitted, so a budget can show more money left than you actually have."}
]} />

## Quiz

<Quiz questions={[
  {
    q: "You build a spending dashboard as an artifact in your Personal Finance hub and send the published link to a friend who is also on Claude Pro with Personal Finance set up. What can that artifact do?",
    options: [
      "Render a static snapshot of your balances only",
      "Nothing — artifacts are blocked in finance chats",
      "Read your friend's linked accounts, if they have Personal Finance and allow Plaid",
      "Prompt your friend to link accounts, then email the data to you"
    ],
    answer: 2,
    explain: "Anthropic documents this directly: artifacts can read the linked accounts of the person who opens them, if that person has Personal Finance and allows Plaid. A published artifact is a reusable tool, not a picture. It also survives deletion of the chat it came from — you have to delete the artifact itself."
  },
  {
    q: "Your budget widget says you have $600 left this month, but you feel broke. Which documented failure mode should you check FIRST?",
    options: [
      "Claude double-counted a bank you linked with two logins",
      "One of your banks could not be read, so its spending was omitted entirely",
      "Balances are a day or two stale",
      "Claude cannot read credit limits, so the card is missing"
    ],
    answer: 1,
    explain: "All three of the first options are real, but only the omitted-bank case pushes the number UP. Anthropic's wording: if a bank cannot be read its spending is left out, so a budget 'can show more money left than you have.' Double-counting and staleness distort in either direction; credit limits ARE read."
  },
  {
    q: "You paste a bank statement PDF into a normal Claude chat — not the Personal Finance hub — on a Pro account with model improvement turned on. What governs that content?",
    options: [
      "The Personal Finance exclusion — financial data is never trained on",
      "Nothing; PDFs are excluded from training by default",
      "Your ordinary account privacy settings, so model improvement applies",
      "Plaid's privacy policy, because it is bank data"
    ],
    answer: 2,
    explain: "The no-training commitment attaches to the hub, not to the subject matter. Anthropic's sentence is explicit: for anything you share outside the hub, your privacy settings apply. The hub also keeps chats out of memory and your monthly recap — another protection you lose by working outside it."
  },
  {
    q: "Your Claude Pro subscription lapses. What is the state of your linked banks?",
    options: [
      "Automatically unlinked when billing fails",
      "Still linked — Claude just cannot open Personal Finance or read them in chats",
      "Unlinked after 30 days",
      "Converted to read-only access at Plaid"
    ],
    answer: 1,
    explain: "Access stops, the link does not. Anthropic is explicit that your banks stay linked until you unlink them — via Customize/Plugins → Connectors → Plaid, at my.plaid.com, or through Support. Deleting your Claude account does unlink them automatically, but merely lapsing does not."
  }
]} />

<Callout type="takeaways" items={[
  "Read-only through Plaid, beta, Pro/Max/Ultra, US only, US banks only, up to 16 banks, up to 24 months of transactions.",
  "The no-training guarantee is scoped to the Personal Finance HUB — not to financial topics anywhere in Claude.",
  "A published artifact can read the opener's accounts and survives deletion of its chat. That is the fact to tell other people.",
  "Four documented accuracy gaps; the omitted-unreadable-bank one inflates what you have left. Always ask which transactions are behind a number.",
  "Unlinking is per bank login, not per account, is not retroactive, and removing the last bank wipes your dashboard irreversibly.",
  "No Claude Code, no Cowork, no scheduled tasks, no Duet — Anthropic lists these as current limitations, so there is no unattended path here today."
]} />

## Sources & further reading

- Anthropic — [Introducing Personal Finance in Claude](https://claude.com/resources/articles/introducing-personal-finance-in-claude) (announcement, November 5, 2026)
- Anthropic Help Center — [Use Personal Finance in Claude](https://support.claude.com/en/articles/18185620-use-personal-finance-with-claude) (the authoritative field-by-field reference for everything on this page)
- Anthropic — [Claude release notes](https://support.claude.com/en/articles/12138966-release-notes) (the November 5, 2026 entry: Pro, Max, Ultra, US only)
- Anthropic Privacy Center — [How long do you store my data](https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data) (general consumer retention, July 1, 2026 — not finance-specific)
- Related on AILmanac: [Privacy & Data Handling](/docs/foundations/privacy) · [Connectors (MCP) in the Apps](/docs/claude-app/connectors) · [Artifacts](/docs/claude-app/artifacts) · [Memory Across Chats](/docs/claude-app/memory) · [Plans, Limits & Billing](/docs/claude-app/plans-and-billing)

## Next

- [Privacy & Data Handling](/docs/foundations/privacy) — the general version of the boundary this page makes concrete
- [Connectors (MCP) in the Apps](/docs/claude-app/connectors) — Plaid is one connector among many; the same per-chat governance applies to all of them
- [Who Reads Your AI Chats](/docs/security/who-reads-your-ai-chats-safety-review-escalation) — what happens to a conversation after you are done with it
