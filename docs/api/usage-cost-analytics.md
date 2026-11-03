# The Usage & Cost Analytics API: Attribute Every Dollar

> Source: https://derob98.github.io/ailmanac/docs/api/usage-cost-analytics · AILmanac (CC BY 4.0) · last verified 2026-11-02

The practical guide to Claude's Usage and Cost Analytics API — the beta that replaced the legacy usage_report and cost_report endpoints. Row shape, the five-dimension limit, actor semantics, the 100x cents footgun, data-freshness rules that break naive dashboards, and the legacy migration table.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "What replaced usage_report and cost_report, and why the new shape is rows rather than time buckets",
  "The row contract: starting_at / ending_at, group, and usage or cost — and why a dimension reads null unless you grouped by it",
  "group_by[] takes five dimensions — except for the two on the cost endpoint that don't count and don't obey limit",
  "The actor model: user, service account, federated cloud identity, or the API key itself — and why api_key_ids[] and actor_ids[] answer different questions",
  "The cents footgun: amount is a decimal string in CENTS, so \"41280.000000\" is $412.80 and a naive dashboard is wrong by 100x",
  "Data freshness rules that invalidate a same-day dashboard, and the trick for results that don't change between calls",
  "The one-line recipe for per-user Claude Code cost",
]} />

<VerifyNote lastVerified="2026-11-02" source="https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api">
The Usage and Cost Analytics API is **beta**: send `anthropic-beta: analytics-usage-cost-2026-08-24` plus an `anthropic-version` header on every request. Anthropic marked the previous Usage and Cost API and the Claude Enterprise Analytics endpoints **legacy on October 29, 2026** — still supported, not removed. Endpoint paths, dimension names, limits, and the cents-based `amount` format are from the official guide and the [usage](https://platform.claude.com/docs/en/api/beta/organization/analytics/usage/list) and [cost](https://platform.claude.com/docs/en/api/beta/organization/analytics/cost/list) API references. Pricing itself lives in [Current Models & Pricing](/docs/whats-new/models-and-pricing).
</VerifyNote>

Two endpoints, one job: tell you where your Claude spend actually went.

- `GET /v1/organizations/analytics/usage` — token counts and request counts.
- `GET /v1/organizations/analytics/cost` — cost in USD.

For a Claude Console organization this is roughly what the Console's **Usage** and **Cost** pages show, with the dimensions you choose instead of the ones they chose. The reason to care is the question nobody can answer from the Console: *which of my customers, agents, or API keys is responsible for the line that went up?*

:::tip[This is reporting, not enforcement]
Nothing here stops a bill. For that, see [Hard Spend Caps](/docs/models/hard-spend-caps) — and note that the two are complementary: caps decide *whether* the spend happens, this API tells you *who* caused it.
:::

## Credentials, by organization type

| Organization | What to use |
| --- | --- |
| Claude Console | An [Admin API key](https://platform.claude.com/docs/en/manage-claude/admin-api-keys), or an OAuth bearer token with the `org:admin` scope (sent as `authorization: Bearer`, not `x-api-key`) |
| Claude Enterprise | A key with the `read:analytics` scope, created in claude.ai by the primary owner **after** the Analytics API is enabled for the organization |

Give the collector service its own key, keep it in a secrets manager, and set a [key expiration](https://platform.claude.com/docs/en/manage-claude/authentication#key-expiration) so rotation is enforced rather than remembered. Where it's available, a Workload Identity Federation rule with `org:admin` is strictly better — short-lived tokens, no long-lived secret to leak. Same reasoning as the [Admin API](/docs/api/admin-api) generally.

## Quick start

<PromptCard title="Daily token usage by model, one week">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/usage?\\
starting_at=2026-09-01T00:00:00Z&\\
ending_at=2026-09-08T00:00:00Z&\\
time_bucket_width=1d&\\
group_by[]=model&\\
limit=100" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

`--globoff` matters: without it, curl tries to interpret the `[]` in `group_by[]` as a glob range.

## The row contract

This is the part that trips people migrating from the old endpoints, because the response is shaped differently on purpose.

<Steps items={[
  {title: "Every row has three parts", body: "starting_at and ending_at give the period the row covers, group holds every dimension, and usage (or cost on the cost endpoint) holds the metrics. Dimensions and metrics are in separate objects — they are not side by side as they were in the legacy report."},
  {title: "A dimension is null unless you grouped by it", body: "group always contains every dimension, but each one reads null unless it appears in group_by[]. A grouped dimension is ALSO null on rows that have no value for it — code execution usage, for example, has model: null. group_by[] takes up to five dimensions."},
  {title: "One row per combination that has data", body: "Each row is one combination of the grouped dimensions, and every combination with usage or cost appears exactly once across the pages of a query. Combinations with nothing produce no row at all. With no group_by[] and no time_bucket_width you get a single row totalling the whole range."},
  {title: "Time buckets are opt-in", body: "Set time_bucket_width to 1m, 1h, or 1d to split each combination by UTC bucket; each row's starting_at and ending_at then bound its bucket. There is no default — omit it for whole-range totals. Empty buckets produce no rows."},
  {title: "Rows are ranked, not chronological", body: "By default rows come back ordered by the order_by metric across the whole range, largest first (order=asc reverses). For a time series, set time_bucket_width AND order_by=time: rows then arrive bucket by bucket, newest first by default, with the largest rows first inside each bucket. You fill the empty buckets with zeros yourself."},
  {title: "Filters are independent of grouping", body: "Most groupable dimensions have a matching bracket-notation list filter, e.g. models[]=claude-opus-5-5. Repeat the parameter for several values, up to 100 per filter. Multiple values in one filter are OR; different filters are AND. You can filter by a dimension without grouping by it, or the reverse."},
]} />

`order_by` on the usage endpoint accepts `total_tokens` (default), `output_tokens`, `uncached_input_tokens`, `requests`, or `time`. On the cost endpoint: `amount` (default), `list_amount`, or `time`.

:::warning[Ranked-by-default is the silent dashboard bug]
If you request a range and plot the rows in the order they arrive, you get a bar chart sorted by size that *looks* like a time series. You only get chronological rows when you set **both** `time_bucket_width` and `order_by=time`.
:::

### Not every dimension applies to you

`model` and `actor` apply to every organization. `api_key_id` is Console-only. `slack_channel_id` is Enterprise-only. A dimension that doesn't apply reads `null` on every row and its filter matches nothing — **silently**. The single exception is `rbac_group_id`, which returns an error instead when teams aren't available to your organization.

And a behavior change worth pinning to the wall: in the legacy API an unknown API key or workspace ID returned an error. Here it **matches nothing**, including a misspelled `models[]` value. An empty result is now the normal response to a typo.

## Actors: who gets the charge

The `actor` dimension is who a request is attributed to — a user, a service account, a federated cloud identity (an AWS or Google Cloud principal, for organizations reaching Claude through their cloud platform), or, when none of those is behind it, **the API key itself**. Group by `actor` and each row's `actor` is an object whose `type` says which kind it is. Usage attributable to no identity has `actor: null`.

The mapping rules:

- **Personal keys and service account keys** act as the user or service account they're linked to: the identity shows in `actor`, the key in `api_key_id`.
- **Legacy workspace keys** aren't linked to an identity, so the key appears as **both** `actor` and `api_key_id`.
- **A key Claude Code creates for a member at sign-in** lives in the Claude Code workspace, and its usage is attributed to that member.
- **Requests with no API key at all** — from the Console, from Claude Code after a sign-in without an API key, or with a Workload Identity Federation token — have `api_key_id: null`. The `actor` is still the member who signed in, or, for a federated workload, its service account.

:::tip[Two filters, two different questions]
`api_key_ids[]=apikey_…` matches every request **that key authenticated**, whoever it's attributed to. `actor_ids[]=apikey_…` matches only requests **attributed to the key itself**. They are not interchangeable, and conflating them is how an audit comes back short. To include no-key usage in an `api_key_ids[]` filter, add an **empty entry**: `api_key_ids[]=`.
:::

## The cost endpoint, and the 100× footgun

The cost endpoint takes the same filters, dimensions, and time buckets as `/usage`. Each row's `cost` object holds:

| Field | Meaning |
| --- | --- |
| `amount` | Cost after discounts, **before** credits are applied |
| `list_amount` | Cost at list prices |
| `currency` | Always `"USD"` |
| `requests` | Request count |

:::warning[amount is in CENTS, not dollars]
`currency` says `"USD"`, but the number is a decimal string **in cents with six decimal places**. `"41280.000000"` is **$412.80**, not $41,280. The legacy cost report returned dollar-ish strings like `"123.45"`; the same value here is `"12345.000000"`. Divide by 100 before you render anything, and write the test — this is a 100× error that passes code review because the field is called `amount` and the currency field says dollars.
:::

Two dimensions exist **only** on the cost endpoint, and both break the usual rules in your favor: `group_by[]=cost_type` splits each row per cost type, and `group_by[]=token_type` splits token cost per token type. Neither counts toward the five-dimension limit, and neither obeys `limit` — so a page can legitimately hold **more** rows than `limit`.

<PromptCard title="Where the money went: cost by model, cost type, and token type for a month">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/cost?\\
starting_at=2026-09-01T00:00:00Z&\\
ending_at=2026-10-01T00:00:00Z&\\
group_by[]=model&\\
group_by[]=cost_type&\\
group_by[]=token_type" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

That single query is the one worth running first on any organization, because it answers the question most teams guess at: **how much of the bill is not inference at all.** Splitting by `cost_type` separates token spend from server-side tooling; splitting by `token_type` separates cached reads from uncached input and output. If cache reads dominate your input line, [Prompt Caching](/docs/api/prompt-caching) and [Cache Diagnostics](/docs/api/cache-diagnostics) are the next stop; if output tokens dominate, [Cut Your Token Usage](/docs/power-user/token-economy) is.

<PromptCard title="Per-user Claude Code cost, in one query">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/cost?\\
starting_at=2026-10-01T00:00:00Z&\\
ending_at=2026-11-01T00:00:00Z&\\
products[]=claude_code&\\
group_by[]=actor" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

Console organizations have a second option for this — the dedicated [Claude Code Analytics API](https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api), which reports per-user Claude Code activity alongside estimated cost.

## Date ranges, and the rounding nobody expects

- Timestamps are RFC 3339 with a UTC offset (`2026-09-01T00:00:00Z`). **`starting_at` is inclusive, `ending_at` is exclusive.**
- `starting_at` must be **on or after January 1, 2026** and **within the last 365 days**.
- A request spans **at most 31 days**. `ending_at` defaults to 31 days after `starting_at`, or now, whichever is earlier. Split longer ranges into several requests.
- `ending_at` is **required** whenever `time_bucket_width` is set, and with `time_bucket_width=1m` the span is **at most 24 hours**.
- **Both ends round *down*** to a bucket boundary — or to the hour when `time_bucket_width` isn't set. With `1h` buckets, `starting_at=2026-09-01T10:43:00Z` becomes `10:00:00Z` and `ending_at=2026-09-01T15:43:00Z` becomes `15:00:00Z`, so the response covers 10:00–15:00 UTC. A "last 90 minutes" query written naively returns one hour.

## Data freshness is the thing that breaks dashboards

Every response carries a `data_refreshed_at` timestamp. Usage after that time is **missing or partial**. When no data exists yet for any part of the range, `data_refreshed_at` is `null` and `data` is empty.

| Property | Value |
| --- | --- |
| Typical refresh lag | Within **4 hours** of the underlying usage |
| Worst case | Up to **24 hours** |
| Revision window | Values can change as late events and reconciliation arrive, until **about 7 days after the end of the calendar month** |
| Pagination | Every page of one paginated query reads the **same snapshot**, so `data_refreshed_at` is identical across pages |

In practice: October 1's numbers can still change until roughly November 7.

This is a real regression from the legacy API, where data typically appeared within **5 minutes**, and it changes what you can build. Two rules follow directly:

- **For results that don't change between calls**, set `ending_at` at or before a `data_refreshed_at` you have already seen.
- **For final totals**, query only months that ended at least **7 days** ago.

:::warning[Don't build real-time alerting on this]
A cost spike alert with a 4–24 hour lag isn't an alert. Use the API for attribution, chargeback, and trend reporting; use [spend caps](/docs/models/hard-spend-caps) for the part that has to react in minutes, and [OpenTelemetry tracing](/docs/api/opentelemetry-tracing) for near-real-time per-request visibility — remembering that traces are best-effort and at-least-once, so the Analytics API, not your traces, is the ledger.
:::

## Migrating from `usage_report` and `cost_report`

What carries over: your Admin API key, the `anthropic-version` header, `starting_at` / `ending_at`, the bucket-width values (`1m`, `1h`, `1d`), bracket notation, the pagination field names, and the token and cost field names. What changes:

| Legacy Usage & Cost API | Usage & Cost Analytics API |
| --- | --- |
| No beta header | `anthropic-beta: analytics-usage-cost-2026-08-24` on every request |
| Data within ~5 minutes | 4 hours typical, up to 24, revised for ~7 days after month end |
| `data` is time buckets (oldest first, empty ones included), each with a `results` list mixing dimensions and metrics | `data` is rows ranked by `order_by`, each with its own `starting_at` / `ending_at`, dimensions in `group`, metrics in `usage` or `cost`. No row for an empty combination |
| `bucket_width`, default `1d` | `time_bucket_width`, **no default** — pass `1d` to keep daily rows, omit it for whole-range totals |
| `limit` counts time buckets per page | `limit` counts **rows** per page (1–1,000, default 20), so page count depends on how many combinations have data |
| Any date range, paged forward by bucket | `starting_at` ≥ Jan 1 2026 and within 365 days; ≤ 31 days per request; `ending_at` required with buckets; ≤ 24 h with `1m` |
| `account_ids[]`, `service_account_ids[]`, `group_by[]=account_id`, `group_by[]=service_account_id` | `actor_ids[]` with the same tagged IDs, and `group_by[]=actor` or `actor_type`; read `actor.user_id` or `actor.service_account_id` |
| `context_window[]` | `context_windows[]` (now plural) |
| `group_by[]=description` on the cost report, with a `description` string | **Gone.** Group by structured dimensions instead — `model`, `cost_type`, `token_type`, `context_window`, `service_tier`, `inference_geo`, `speed`, all of which fit in one request |
| Unknown API key or workspace ID → error | Matches nothing. So does a misspelled `models[]` value |
| `workspace_id: null` meant the default workspace | The default workspace has its **real** `wrkspc_` ID |
| `inference_geo: "not_available"`, `service_tier: "standard"` for usage with neither | `null` for both. `inference_geos[]=not_available` still matches the no-geo rows |
| Cost `service_tier` was `standard` or `batch`; `amount` like `"123.45"` | The actual tier; `amount` with six decimals (`"123.450000"`), plus `list_amount` |
| Code execution absent from the usage report; no request counts | Code execution appears as usage rows with `model: null`; `requests` on both endpoints and `total_tokens` on usage rows |

To reproduce the legacy daily report exactly: request `time_bucket_width=1d` with the same `group_by[]`, page through with `limit=1000`, add `order_by=time&order=asc` for chronological days, then group rows by `starting_at` and **fill the missing days with zeros** yourself.

:::tip[The default workspace stopped being null — update your grouping code]
Legacy consumers often special-cased `workspace_id: null` as "Default Workspace". That mapping is now wrong, and a `null` here means "not grouped by it" instead. The default workspace has a normal `wrkspc_` ID — but [List Workspaces](https://platform.claude.com/docs/en/api/organization/workspaces/list) **omits** it unless you pass `include_default=true`, so an unfamiliar ID in your rows may not appear in your workspace table. Resolve it with Get Workspace: the default one returns `"name": "Default"`.
:::

## Beyond the Claude API

| Platform | Availability | What's different |
| --- | --- | --- |
| Claude Platform on AWS | Both endpoints | Uses the platform base URL and auth instead of an Admin API key; AWS IAM authorizes via the `ListAccountUsage` and `ListAccountCost` actions. **Each request covers only the workspaces in that endpoint's AWS region** — call every region to cover the organization. `user_profile_id`, `claude_tag_category`, `claude_tag_user_id` and the Managed Agents dimensions (`agent_id`, `environment_id`, `deployment_id`, `session_id`) are `null` on every row |
| Claude Models on Google Cloud (Anthropic-managed) | Both endpoints | Called through the organization-level base URL with Google Cloud credentials; `/usage` needs the `usageAnalytics.list` IAM permission, `/cost` needs `costAnalytics.list` |

That `user_profile_id` dimension is the interesting one on the Claude API itself: combined with [user profiles](/docs/api/user-profiles-and-enforcement), it turns this API into per-end-customer chargeback for a platform or reseller — the same attribution that limits your enforcement blast radius also tells you what each customer costs you.

## Common mistakes

| Mistake | What actually happens |
| --- | --- |
| Rendering `amount` as dollars | Every figure is 100× too large. It's cents with six decimal places |
| Plotting rows in response order as a time series | Rows are ranked by `order_by` across the whole range. You need `time_bucket_width` **and** `order_by=time` |
| Omitting `--globoff` from curl | curl treats `[]` in `group_by[]` as a glob and the request never goes out as written |
| Expecting zero-filled buckets | Buckets and combinations with no data produce **no rows**. Fill gaps client-side |
| Building a cost-spike alert on it | The data is 4–24 hours behind and revised for a week after month end |
| Comparing month-to-date totals pulled on different days | Values are revised until ~7 days after month end. Pin `ending_at` to a `data_refreshed_at` you already saw |
| Treating an empty result as "no usage" | An unknown workspace ID, API key ID, or misspelled model name now matches nothing instead of erroring |
| Keeping the `workspace_id: null` → "Default" mapping | The default workspace has a real `wrkspc_` ID now; `null` means "not grouped by this dimension" |
| Assuming `limit` bounds the rows per page | `cost_type` and `token_type` ignore `limit` entirely |
| Reusing `account_ids[]` / `service_account_ids[]` | Replaced by `actor_ids[]` with `group_by[]=actor` or `actor_type` |

## Quiz

<Quiz questions={[
  {
    q: "A cost row comes back with cost.amount = \"41280.000000\" and cost.currency = \"USD\". What should your dashboard display?",
    options: [
      "$41,280.00",
      "$412.80",
      "$41,280.000000",
      "$4,128.00"
    ],
    answer: 1,
    explain: "amount is a decimal string in CENTS with six decimal places, even though currency reads USD. 41280 cents is $412.80. Rendering it directly is a 100x error — and it passes review precisely because the field is named amount and the currency says dollars."
  },
  {
    q: "You request 7 days of usage with group_by[]=model and plot the rows in the order they arrive, expecting a daily line chart. You get something that isn't chronological. What's missing?",
    options: [
      "time_bucket_width=1d only — buckets are chronological by default",
      "order_by=time only — ordering is independent of bucketing",
      "Both time_bucket_width=1d and order_by=time",
      "Nothing; you must sort client-side because the API never orders by time"
    ],
    answer: 2,
    explain: "time_bucket_width has no default, so without it you get whole-range totals. And rows are ranked by the order_by metric (largest first) unless you set order_by=time. You need both: buckets to split the range, and order_by=time to get them bucket by bucket. You still fill empty buckets with zeros yourself, since buckets with no data produce no rows."
  },
  {
    q: "Finance pulls month-to-date cost for October on October 2nd, again on October 20th, and again on November 10th — and gets three different totals for October 1st. Which explanation matches the documented behavior?",
    options: [
      "A bug: once data_refreshed_at passes a timestamp, those values are final",
      "Values are revised as late events and reconciliation arrive, until about 7 days after the calendar month ends",
      "Each page of a paginated query reads a different snapshot, so totals drift",
      "Only the cost endpoint is affected; the usage endpoint is immediately final"
    ],
    answer: 1,
    explain: "Data typically refreshes within 4 hours and can take up to 24, and values can be revised until roughly 7 days after the end of the calendar month — so October 1 can change until about November 7. For final totals, query only months that ended at least 7 days ago. (Pagination is not the cause: every page of one query reads the same snapshot, which is why data_refreshed_at is identical across pages.)"
  }
]} />

<Callout type="takeaways" items={[
  "Two endpoints — /v1/organizations/analytics/usage and /cost — both requiring anthropic-beta: analytics-usage-cost-2026-08-24.",
  "Divide amount by 100. It is cents with six decimal places, despite currency reading USD.",
  "A dimension is null unless you grouped by it, and a combination with no data produces no row at all — so zero-fill client-side.",
  "Ranked by default: a real time series needs time_bucket_width AND order_by=time.",
  "Freshness is 4-24 hours with revisions for ~7 days after month end. This is attribution and chargeback infrastructure, not alerting.",
  "api_key_ids[] (what the key authenticated) and actor_ids[] (what is attributed to the key) answer different questions — pick deliberately.",
  "Typos no longer error. An unknown workspace, key, or model name silently matches nothing.",
]} />

## Next

- [The Admin API: automate your Claude org](/docs/api/admin-api) — the credentials, scopes, and pagination conventions these endpoints inherit.
- [Hard Spend Caps: Which AI Providers Actually Stop the Bill](/docs/models/hard-spend-caps) — the enforcement half of the same problem, across providers.
- [User Profiles & Enforcement](/docs/api/user-profiles-and-enforcement) — the `user_profile_id` dimension that turns this API into per-end-customer chargeback.
- [First-party OpenTelemetry tracing](/docs/api/opentelemetry-tracing) — per-request visibility when a 4-hour lag is too slow.
