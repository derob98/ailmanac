# Rolling Out a Coding Agent to Non-Engineers

> Source: https://derob98.github.io/ailmanac/docs/playbooks/rolling-out-coding-agents · AILmanac (CC BY 4.0) · last verified 2026-11-09

Goldman Sachs gave Claude Code to its bankers and traders, then took it back four months later. This is the practical guide the news coverage skipped: what traders were actually doing with a coding agent, why the cost of the rollout landed on the engineering review queue rather than the licence budget, the micro-model problem that makes regulated firms nervous, and the controls that actually enforce a policy versus the ones that only look like they do.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={[
  "Separate the three jobs non-engineers actually use a coding agent for — only one of them is coding, and that mismatch is the whole story",
  "Find the real cost centre of a broad rollout: not seats, not tokens, but the review queue of the engineers who inherit the output",
  "Understand the micro-model problem — why a trader's 40-line position script can be a regulated model, and what US supervisory guidance now says",
  "Stop conflating the two 2026 bank AI bans: internal coding tools versus third-party agents touching customer accounts are different problems with different fixes",
  "Match the surface to the job instead of the person, using the capability ladder",
  "Deploy controls that actually enforce — and know why server-managed settings and the default audit trail do not"
]} />

<VerifyNote lastVerified="2026-11-09" source="https://techstrong.ai/agentic-ai/goldman-sachs-cuts-bankers-traders-off-from-ai-coding-tools-over-risk-concerns/">
The Goldman Sachs specifics below (dates, headcounts, who kept access) come from the November 2, 2026 Bloomberg report and its follow-ups, and from a named company spokesperson. Access policies change quietly and without announcements — treat the Goldman case as a worked example whose details may have moved, not as a live description of that firm. The mechanisms and the control surface are the durable part of this page.
</VerifyNote>

## What happened, in one paragraph

In July 2026, Goldman Sachs CIO Marco Argenti publicly praised the "vibe coding" happening among the firm's non-technical staff: people who were not engineers built things with AI tools and handed their creations to one of the firm's roughly 12,000 engineers to finish. In October 2026 internal guidance reversed that. Claude Code and GitHub Copilot now sit with engineers and with "strats" — the hybrid trading/quant/engineering population — and were withdrawn from bankers and traders. A spokesperson framed it as the end of a trial: after assessing "a variety of factors including productivity and risk management," the firm put the tools in the hands of those best suited to use them long term. Bloomberg broke it on November 2; the Hacker News thread passed 780 points.

The coverage mostly ran as a verdict on AI. It is more useful as a case study in rollout design, because the failure mode it illustrates is one that almost every organisation rolling out a coding agent beyond engineering will hit, and almost none of them price in advance.

## The three jobs, only one of which is coding

Start with what the withdrawn users were reportedly doing. Three jobs come up consistently in the reporting:

| What traders used it for | Is this coding? | What it actually is |
|---|---|---|
| Following how clients were trading | No | Data analysis over sensitive flow data |
| Simulating shifts in markets and in their positions | No | Quantitative modelling |
| Drafting text and visuals | No | Document and asset generation |

None of the three is software engineering. A coding agent was the delivery vehicle, not the job. That is the single most important thing to take from the episode, and it is the thing the "banks fear AI" framing obscures.

This happens because a terminal coding agent is, accidentally, the most capable general-purpose analysis tool most firms have deployed. It can reach a database, write the Python, run it, and render the chart — in one loop, without a ticket. If the sanctioned analytics path requires a data request and a two-week queue, the coding agent wins on merit every time. People were not misusing it. They were routing around an internal bottleneck, which is what capable people do.

The consequence is that **you are not deciding whether non-engineers may code. You are deciding whether unversioned, unreviewed analysis may be built against production data by people whose output nobody downstream has agreed to maintain.** Phrased that way, a lot of rollout debates resolve themselves.

## The cost centre nobody budgets: the review queue

Look again at the July description — non-technical staff built things and passed them to one of 12,000 engineers "to enhance."

That handoff is the rollout's true unit economics, and it is invisible in the business case. The seat cost is visible. The token cost is visible, and there are [hard spend caps](/docs/models/hard-spend-caps) for it. The engineering hours required to review, harden, own and maintain a stream of prototypes built by people who cannot read the code are not visible to whoever approved the seats, because they land on a different team's quarter.

The arithmetic is unkind. Suppose 2,000 non-engineers each produce one artefact worth escalating per month — a conservative rate for an enthusiastic population. That is 2,000 items a month arriving at an engineering organisation that did not plan for them. At four hours each to review, harden and take ownership, that is 8,000 engineer-hours a month, or roughly 50 full-time engineers absorbed by intake. Against 12,000 engineers it is survivable; as a surprise it is not, and it buys nothing that appears on the engineering roadmap.

Three properties make this queue worse than an ordinary backlog:

<Steps items={[
  {title: "It is unrefusable in practice", body: "The artefact already works for its author, who is often senior to the reviewer and has already shown it to their desk. 'No' is now a political act rather than a triage decision. Backlogs you cannot refuse are not backlogs, they are obligations."},
  {title: "The author cannot fix review findings", body: "Normal review is a conversation between two people who can both read the diff. Here, every finding converts into engineering work rather than author rework. The reviewer does not reduce their own load by reviewing well — they increase it."},
  {title: "Ownership never transfers, it only accretes", body: "Once an engineer touches it, it is theirs. The original author keeps requesting changes and keeps depending on it, but the pager, the dependency upgrades and the incident belong to the team that 'helped'. Every escalated prototype is a permanent liability with no owner budget attached."}
]} />

If you take one action from this page, make it this one: **before widening access, ask the engineering organisation that will inherit the output to agree to an intake rate, in writing, with a path for refusal.** A rollout that cannot answer "who maintains what these people build, and what happens when they say no" is not a rollout, it is a deferred argument.

## The micro-model problem

For firms in regulated sectors there is a second, sharper issue, and it is the one most likely to end a rollout abruptly.

A trader who asks an agent to "simulate how my book moves if the curve steepens 50bp" has not written a script. They have built a model — in the specific, load-bearing sense that financial supervisors use the word. Longstanding US supervisory guidance defines a model as a quantitative method, system or approach that applies statistical, economic, financial or mathematical theories to turn input data into quantitative estimates. A position-simulation script written in an afternoon fits that definition comfortably. So does an approval-routing helper that applies weighted criteria to flag a counterparty transaction, or an eligibility check that scores whether a customer qualifies for an offer.

Models in that sense are supposed to live in a model inventory, with documentation, independent validation, and a change history. The practice of model risk management was built for a world where models were discrete, expensive and few — produced by identifiable quant teams on a release cycle slow enough for a validation function to keep up.

A coding agent in the hands of 2,000 non-engineers inverts every one of those assumptions. The artefacts are cheap, numerous, undocumented, unversioned, and produced by people who do not know that the word "model" now applies to them. This is the **micro-model problem**: decision logic that meets the regulatory definition of a model, created faster than any validation function can inventory it, by authors who never asked the question. The governance gap is not that the output is bad. It is that nobody can enumerate what exists.

The supervisory ground also moved in 2026, which matters for anyone citing chapter and verse. On **April 17, 2026** the Federal Reserve issued **SR 26-2, "Revised Guidance on Model Risk Management,"** superseding **SR 11-7** (April 4, 2011) and **SR 21-8** (April 9, 2021). If your internal policy, your vendor's compliance deck or a blog post you are relying on still cites SR 11-7 as current, it is out of date by more than six months.

<VerifyNote lastVerified="2026-11-09" source="https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm">
SR 26-2's existence, date and the letters it supersedes are confirmed against the Federal Reserve's own SR letter index. Several secondary write-ups make specific claims about how SR 26-2 treats generative and agentic AI in scope; we could not confirm those against the primary letter and have deliberately left them out. Read the letter and its attachment yourself before building a control on a scope claim, and have counsel do the same — nothing here is legal or compliance advice.
</VerifyNote>

## Two different bans, routinely conflated

Search coverage of 2026 bank AI restrictions and you will get two stories blended into one. They are not the same problem and they do not share a fix.

| | Internal coding agents | Third-party agents on customer accounts |
|---|---|---|
| Example | Goldman Sachs restricting Claude Code and Copilot to engineers | JPMorgan, Bank of America and Citi limiting outside AI agents' access to customer accounts |
| Who is acting | Your own employees, inside your perimeter | Software acting for a customer, outside your perimeter |
| The fear | Unreviewed logic, data barriers, auditability of machine-written code | Unauthorised transactions and credential-scoped access at scale — Jamie Dimon's "rogue agents," of which "there could be thousands" |
| Typical control | Access scoping, managed policy, review gates | Read-only scoping at the API boundary — Meta's Muse, for instance, can read a Chase balance but not move money |
| Where to read more | This page | [Securing agents](/docs/security/securing-agents) · [Agent payments and x402](/docs/models/agent-payments-x402-and-agentcore) |

Bank of America's CEO said the firm hired 1,000 contractors to patch software against agent-exposed vulnerabilities — that is the second column, not the first. If you cite it in an internal memo about giving your analysts Claude Code, you have cited the wrong thing, and the first person to notice will spend your credibility.

One more piece of context worth holding, because it cuts against the easy reading: Goldman Sachs is lead-left underwriter on Anthropic's IPO, with the S-1 filed October 26, 2026 and the roadshow expected the week of November 9, 2026. A firm narrowing internal access to a product while underwriting its public listing is not a contradiction. It is evidence that the decision was about **deployment scope** rather than a verdict on the tool — which is exactly how you should read any restriction like it, including your own.

## The capability ladder: match the surface to the job

The instinct after reading the above is to gate by job title. That is what Goldman did, and for a firm with 12,000 engineers and a supervisory examiner it is a defensible blunt instrument. It is usually the wrong first move for everyone else, because it removes the capability without removing the demand — and unmet demand for AI analysis does not evaporate, it moves to a personal account on a personal laptop where you have no telemetry at all.

Gate by job instead. Most of what non-engineers want from a coding agent is available on a surface that generates no review queue and no micro-models.

| The job | Right surface | Why it is the right one |
|---|---|---|
| Analyse a dataset, make a chart | Claude app with file upload and its analysis tool | Ephemeral, no repo, no artefact to maintain. See [Data Analysis](/docs/playbooks/data-analysis) |
| Draft documents, decks, visuals | Claude app, Projects | Never needed a coding agent. See [Business & Strategy](/docs/playbooks/business) |
| Query sanctioned systems | Read-only MCP server you operate | You control the schema, the scope and the log. See [Securing MCP servers](/docs/security/securing-mcp-servers) |
| Reuse a recurring analysis | A skill or saved prompt built by engineering once | Turns 200 ad-hoc micro-models into one reviewed artefact. See [Skills](/docs/claude-code/skills) |
| Prototype something that must become real software | Coding agent, with a declared intake path | The only rung that legitimately generates review work — so make the queue explicit |
| Operate on production data or money | Nothing self-serve | See [The trust ladder](/docs/frontiers/the-trust-ladder) |

The ladder has a property worth noticing: the top rung is the only one that produces a maintenance obligation, and the five rungs below it absorb most of the real demand. Firms that skip the ladder and deploy a coding agent as their general AI offering are paying engineering-review prices for work that a chat surface handles for free.

## Controls that enforce, and controls that only look like they do

If you do run a coding agent across a wide population, the distinction below is the one that gets missed in rollout plans — including by people who have read the docs.

<Steps items={[
  {title: "Managed settings enforce. Server-managed settings are a convenience.", body: "A managed-settings.json deployed by your device-management tooling sits at the top of the precedence stack and cannot be overridden locally. Settings served from your claude.ai organisation only reach sessions that have already authenticated into your organisation — so they never reach the machine that logged in with a personal account, which is precisely the machine you were worried about. Anthropic's own documentation says to treat a server-managed list as a convenience for machines you cannot reach with device management, not as enforcement. Plan accordingly: MDM is the control, the server-side copy is the fallback."},
  {title: "forceLoginOrgUUID is what closes the personal-account hole", body: "Without it, a developer can sign in with a personal claude.ai account and your organisation sees nothing: no telemetry, no policy, no audit trail, and your data leaving through a consumer account. Setting forceLoginMethod and forceLoginOrgUUID in managed settings makes Claude Code refuse a login belonging to any organisation you have not listed, and exit at startup if the credential in use belongs to one. This is the single highest-leverage key in the file."},
  {title: "allowedProviders decides which services the machine may reach Claude through", body: "Separate concern from which account is used. It lists the permitted routes — the Anthropic API, Amazon Bedrock, a gateway — and refuses a session configured for anything else at startup, or on its next request if it switches mid-session. Requires Claude Code v2.1.285 or later. This is the key that stops traffic quietly detouring through an unapproved proxy; see [gray-market AI proxies](/docs/security/gray-market-ai-proxies) for why that matters."},
  {title: "Environment credentials are refused, not merely discouraged", body: "Under these keys, Claude Code blocks sessions authenticating with ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN or apiKeyHelper — even when managed settings themselves supply them — because organisation membership cannot be verified for an environment credential. Useful to know before you discover it as a support ticket from every CI job you own."},
  {title: "Permissions are a per-repo gate, not a population gate", body: "Allow and deny rules are the right tool for what an agent may do in a given project. They are the wrong tool for who may run an agent at all. Do not let a well-written deny list substitute for an access decision. See Permissions and the precedence stack in Settings."}
]} />

<PromptCard title="managed-settings.json — the enforcement floor, deployed by MDM">{`{
  "forceLoginMethod": "claudeai",
  "forceLoginOrgUUID": ["00000000-0000-0000-0000-000000000000"],
  "allowedProviders": ["anthropic", "bedrock"],
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.internal.example.com:4317",
    "OTEL_LOG_TOOL_DETAILS": "1"
  }
}`}</PromptCard>

Replace the UUID with your own organisation ID from your admin settings, and the endpoint with your collector. Pinning the telemetry variables in the managed `env` block matters: a destination set there is locked, and Claude Code removes conflicting developer-set variables at startup. A destination a developer can change is not an audit trail.

## The audit-trail gotcha that will embarrass you in a review

This one is worth the price of admission, because it is the gap between what rollout plans claim and what the data contains.

Claude Code exports a genuinely useful set of OpenTelemetry metrics — `claude_code.session.count`, `claude_code.lines_of_code.count`, `claude_code.commit.count`, `claude_code.pull_request.count`, `claude_code.cost.usage`, `claude_code.code_edit_tool.decision`, `claude_code.active_time.total` — carrying attributes including `user.email`, `user.account_uuid` and `organization.id`. Per-user cost attribution and per-user active time are both available out of the box. For the full picture see [OpenTelemetry tracing](/docs/api/opentelemetry-tracing) and [usage and cost analytics](/docs/api/usage-cost-analytics).

But **metrics and events are redacted by default**, and the redaction is more aggressive than most people expect:

- MCP server and tool names appear as `"custom"` or `"mcp"` — with no tool name — unless `OTEL_LOG_TOOL_DETAILS=1` is set. An organisation that believes it has a record of which internal systems its agents touched has, by default, a record that says `mcp`.
- Prompt content, assistant responses and system prompts require `OTEL_LOG_USER_PROMPTS=1`.
- Tool output — file reads, command output — requires `OTEL_LOG_TOOL_CONTENT=1`.
- Bash commands and file paths also sit behind `OTEL_LOG_TOOL_DETAILS=1`.
- There is **no built-in admin dashboard**. You export to your own observability backend and build the view yourself. Budget for that; it is the step that quietly does not happen.

The default is the right default — it protects employees from casual surveillance, and `claude_code.safety_event` still records permission checks and blocks without exposing content. But it means the sentence "we have full auditability" is false on a default install, and the cheapest moment to discover that is now rather than during an examination. Turning the flags on is a decision with real privacy weight: tell people what you are logging, agree a retention period, and keep the content flags off unless a named obligation requires them. See [what your agent uploads](/docs/security/what-your-agent-uploads) for the employee-side view of the same question.

## Five questions to answer before you widen access

Not a maturity model. Five questions whose absence of an answer predicts a reversal four months later.

<Steps items={[
  {title: "Which of the three jobs are people actually asking for?", body: "Ask ten of them. If the answers are analysis, drafting and querying — and they usually are — a coding agent is the wrong rung of the ladder and you can skip most of this page."},
  {title: "Who has agreed to inherit the output, at what rate, with what right of refusal?", body: "In writing, from the engineering leader whose team it lands on. If nobody has agreed, you have budgeted the seats and not the cost."},
  {title: "Can you enumerate what gets built?", body: "If the artefacts live on laptops, the answer is no, and in a regulated setting no is a finding. A sanctioned repo or workspace per population is the minimum that makes enumeration possible at all."},
  {title: "Is the policy enforced by MDM, or only published?", body: "Deployed managed-settings.json with forceLoginOrgUUID, or a wiki page. Only one of those survives a motivated user with a personal account."},
  {title: "What does your telemetry actually contain?", body: "Not what the metric list offers — what your collector received last week. Query it before you claim it. If MCP tool names come back as 'mcp', you know which flag you have not set."}
]} />

<Flashcards title="Rollout vocabulary" cards={[
  {front: "Micro-model problem", back: "Decision logic that meets the regulatory definition of a model — statistical or financial method turning inputs into quantitative estimates — created faster than any validation function can inventory it, by authors who do not know the word applies to them."},
  {front: "SR 26-2", back: "Federal Reserve 'Revised Guidance on Model Risk Management', April 17, 2026. Supersedes SR 11-7 (2011) and SR 21-8 (2021). Policies still citing SR 11-7 as current are out of date."},
  {front: "forceLoginOrgUUID", back: "Managed-settings key that makes Claude Code refuse claude.ai logins outside your listed organisations and exit at startup if the active credential belongs to one. Closes the personal-account telemetry hole."},
  {front: "allowedProviders", back: "Managed-settings list of services a machine may reach Claude through (anthropic, bedrock, customEndpoint, …). Refuses other providers at startup. Claude Code v2.1.285+."},
  {front: "Server-managed settings", back: "Settings served from your claude.ai org. Only reach sessions already authenticated into it — a convenience for unreachable machines, explicitly not an enforcement mechanism."},
  {front: "OTEL_LOG_TOOL_DETAILS", back: "Flag that reveals Bash commands, file paths, and MCP server and tool names in telemetry. Without it they log as 'custom' or 'mcp' — tool names absent."},
  {front: "The review queue", back: "The real cost centre of a wide coding-agent rollout: engineer hours to review, harden and own prototypes built by people who cannot read the code. Unrefusable, non-delegable back, and permanently accreting."},
  {front: "Capability ladder", back: "Gate by job, not job title. Chat surface, read-only MCP, shared skills and sanctioned prompts absorb most demand; only the prototyping rung creates a maintenance obligation."}
]} />

<Quiz title="Check yourself" questions={[
  {
    q: "What were Goldman's traders and bankers reportedly using the coding agents for?",
    options: [
      "Shipping production trading systems without review",
      "Following client flows, simulating market and position shifts, and drafting text and visuals",
      "Writing internal compliance tooling for the model risk team",
      "Training proprietary models on client data"
    ],
    answer: 1,
    explain: "All three reported jobs — client-flow analysis, position simulation, and drafting content — are analysis and document work, not software engineering. The coding agent was the delivery vehicle, which is why 'should non-engineers code?' is the wrong framing of the decision."
  },
  {
    q: "In a wide rollout to non-engineers, which cost is most often left out of the business case?",
    options: [
      "Per-seat licence cost",
      "Token spend during long agent runs",
      "Engineer hours to review, harden and own the artefacts non-engineers escalate",
      "Device-management tooling to deploy managed settings"
    ],
    answer: 2,
    explain: "Seats and tokens are visible and cappable. The review queue lands on a different team's quarter, cannot easily be refused because the artefact already works for a senior author, and converts every review finding into engineering work rather than author rework."
  },
  {
    q: "You publish a Claude Code policy as server-managed settings from your claude.ai organisation. What is the gap?",
    options: [
      "Nothing — server-managed settings sit at the top of the precedence stack",
      "They only reach sessions already authenticated into your organisation, so they miss the machine signed in with a personal account",
      "They are overridden by any project's committed settings file",
      "They apply only to cloud sessions and never to the terminal CLI"
    ],
    answer: 1,
    explain: "A developer receives server-managed settings only after authenticating into your organisation — so they never reach the unmanaged, personally-signed-in machine that was the actual risk. Anthropic's documentation calls a server-managed list a convenience for machines you cannot reach with device management, not enforcement. Deploy managed-settings.json with forceLoginOrgUUID via MDM for that."
  },
  {
    q: "On a default install with telemetry enabled, what do MCP server and tool names look like in your logs?",
    options: [
      "Full server and tool names, always",
      "Server name only, with the tool name hashed",
      "'custom' or 'mcp', with no tool name, until OTEL_LOG_TOOL_DETAILS=1 is set",
      "They are never exportable under any configuration"
    ],
    answer: 2,
    explain: "Metrics and events are redacted by default. MCP server and tool names log as 'custom' or 'mcp' unless OTEL_LOG_TOOL_DETAILS=1. So an org that believes it can show which internal systems its agents touched has, by default, a log that says 'mcp' — worth discovering before an audit rather than during one."
  },
  {
    q: "Which US supervisory guidance on model risk management is current as of late 2026?",
    options: [
      "SR 11-7, issued April 4, 2011",
      "SR 21-8, issued April 9, 2021",
      "SR 26-2, issued April 17, 2026, superseding both SR 11-7 and SR 21-8",
      "There is no supervisory guidance on model risk management"
    ],
    answer: 2,
    explain: "SR 26-2, 'Revised Guidance on Model Risk Management', dated April 17, 2026, supersedes SR 11-7 (2011) and SR 21-8 (2021). Plenty of vendor material and internal policy still cites SR 11-7 as current. Read the letter and its attachment rather than a summary of it, and take compliance advice from counsel."
  },
  {
    q: "Why is gating a coding agent purely by job title often the wrong first move?",
    options: [
      "Because job titles are not available in Claude Code telemetry",
      "Because it removes the capability without removing the demand, which moves to personal accounts where you have no telemetry at all",
      "Because managed settings cannot express role-based rules",
      "Because regulators require equal tool access across populations"
    ],
    answer: 1,
    explain: "Unmet demand for AI analysis does not evaporate — it relocates to a personal account on a personal laptop, which is strictly worse for both governance and auditability. Gate by job instead: a chat surface, read-only MCP and shared skills absorb most of the real demand without generating review queues or micro-models."
  }
]} />

<Callout type="takeaways" items={[
  "The three jobs non-engineers bring to a coding agent — analysis, modelling, drafting — are not coding. Decide about those jobs, not about job titles.",
  "A coding agent often wins on merit because the sanctioned analytics path is slow. Fix the bottleneck or the routing-around continues after any ban.",
  "The rollout's real cost is the engineering review queue: unrefusable, non-delegable back, permanently accreting. Get a written intake rate and a right of refusal before widening access.",
  "Micro-model problem: ad-hoc position and eligibility logic can meet the supervisory definition of a model. The gap is not quality, it is that nobody can enumerate what exists.",
  "SR 26-2 (April 17, 2026) supersedes SR 11-7 and SR 21-8. Update any policy that still cites SR 11-7 as current — and verify scope claims against the primary letter.",
  "Internal coding tools and third-party agents on customer accounts are two different 2026 bank stories. Do not cite one as evidence about the other.",
  "Managed settings via MDM enforce; server-managed settings are explicitly a convenience. forceLoginOrgUUID is the key that closes the personal-account hole; allowedProviders pins the route.",
  "Telemetry is redacted by default — MCP tool names log as 'mcp'. Query your collector before claiming auditability, and treat the content flags as a privacy decision, not a checkbox."
]} />

## Sources & further reading

- [Techstrong.ai: Goldman Sachs cuts bankers, traders off from AI coding tools over risk concerns](https://techstrong.ai/agentic-ai/goldman-sachs-cuts-bankers-traders-off-from-ai-coding-tools-over-risk-concerns/) — the November 2, 2026 write-up of the Bloomberg scoop: the July-to-October reversal, the named spokesperson quote, the 12,000-engineer figure, and the governance concerns cited.
- [PYMNTS: Goldman Sachs bars bankers from employing some AI tools](https://www.pymnts.com/news/artificial-intelligence/2026/goldman-sachs-bars-bankers-from-employing-some-ai-tools/) — independent corroboration, and the Argenti "passed on their creations to one of the firm's 12,000 engineers to enhance" detail that the review-queue section is built on.
- [Federal Reserve: SR letters index](https://www.federalreserve.gov/supervisionreg/srletters/srletters.htm) and [SR 26-2, Revised Guidance on Model Risk Management](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) — the primary source for the April 17, 2026 date and the superseded letters. Read the attachment for the model definition and the scope language.
- [Axios: Unvetted AI agents are accessing U.S. bank accounts](https://www.axios.com/2026/10/22/ai-agents-banks-unauthorized-accounts-access) — the other 2026 bank AI story, the one about third-party agents at the customer-account boundary.
- [Claude Code: monitoring usage](https://code.claude.com/docs/en/monitoring-usage) — the authoritative list of metrics, events and attributes, the `OTEL_LOG_*` flags and exactly what each one reveals, and the statement that there is no built-in admin dashboard.
- [Claude Code: authentication and IAM](https://code.claude.com/docs/en/iam) — `forceLoginMethod`, `forceLoginOrgUUID`, `allowedProviders`, the credential precedence list, and the rules on blocked environment credentials.
- [Claude Code: managed settings](https://code.claude.com/docs/en/managed-settings) and [server-managed settings](https://code.claude.com/docs/en/server-managed-settings) — the precedence stack, and the explicit "convenience, not enforcement" characterisation of server-managed lists.
- AILmanac companions: [Settings & precedence](/docs/claude-code/settings) · [Permissions](/docs/claude-code/permissions) · [CI/CD for agent-written code](/docs/playbooks/ci-for-agent-written-code) · [Hard spend caps](/docs/models/hard-spend-caps)

## Next

- [CI/CD for Agent-Written Code](/docs/playbooks/ci-for-agent-written-code) — the downstream half of the review-queue problem: once the artefacts do reach your pipeline, the merge queue breaks before the runner budget does, and there is arithmetic for it.
- [The Trust Ladder](/docs/frontiers/the-trust-ladder) — the general version of the capability ladder above: how much autonomy to grant an agent, staged against what you can verify.
- [Evaluating Agents](/docs/playbooks/evaluating-agents) — how to decide whether the rollout is actually producing value, before someone else decides it is not.
