# Capability Redaction: What Kimi K3.1 Pro's Cyber Cut Actually Bought

> Source: https://derob98.github.io/ailmanac/docs/security/capability-redaction-open-weights · AILmanac (CC BY 4.0) · last verified 2026-10-26

Moonshot removed cyber data from two training stages of Kimi K3.1 Pro and published the price: exploit success fell from 90.5% to 81.0%. The same generation jump had raised it from 33.3%. So the redaction undid 9.5 points of a 47.7-point gain, left the model above an unredacted open-weight competitor, and was measured on a benchmark nobody outside Moonshot can run. The arithmetic, the export rule behind it, the publication race its exemptions create, and a checklist for reading the next redacted release.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Do the arithmetic the headlines skipped: the redaction cost 9.5 points, and the generation it shipped in had added 47.7 — so roughly four-fifths of the model's exploitation ability came from being a better general coding model", "Understand the mechanism that makes targeted data removal weak: Moonshot's own explanation is that long-horizon debugging skill generalises to exploitation, which means the capability was never localised in the data they removed", "See that the redaction moved Kimi down exactly one rung — past an open-weight competitor that nobody redacted at all", "Know the three thresholds in China's Announcement No. 48 that put a model under export control, and that a parameter count alone is one of them", "Spot the clock the exemptions create: already-public weights are exempt, so the rule rewards publishing sooner rather than later", "Recognise the verification asymmetry — xdev-bench-hard is internal and unpublished, so neither the 90.5% nor the 81.0% can be reproduced by anyone outside the lab", "Ask the one question nobody has answered, and the only one that decides whether a redaction is durable: does fine-tuning put it back?", "Apply an eight-point checklist to the next open-weight release that claims a safety reduction, before you build a threat model on the claim"]} />

On **October 23–24, 2026** Moonshot AI shipped **Kimi K3.1 Pro** and did something no frontier open-weight lab had done before: it published the price, in benchmark points, of deliberately making its own model worse at one thing.

Before the open-weight release, Moonshot identified and removed cyber-related data from **two** training stages — the mid-training corpus and the reinforcement-learning environments — while keeping the general coding tasks the model needs to be useful. Then it reported what that cost on `xdev-bench-hard`, its in-house set of expert-curated vulnerability-discovery and exploitation tasks built from real source code:

| Model / checkpoint | `xdev-bench-hard` (pass@3) |
|---|---|
| K3.1 Pro checkpoint **without** the risk-reduction measures | **90.5%** |
| **Kimi K3.1 Pro as released** | **81.0%** |
| DeepSeek-V4.1-Flash | 85.7% |
| GLM-5.3 | 57.1% |
| Kimi K3 (the previous generation) | 33.3% |

Read that table twice, because almost every write-up of it stopped at the first two rows. Three things in it are worth a page.

1. **The redaction bought 9.5 points. The generation it shipped in had bought 47.7.** K3 solved 33.3% of these tasks; the unrestricted K3.1 Pro checkpoint solved 90.5%. Removing the cyber data undid about **17%** of that gain and left the other 83% in place. Whatever makes K3.1 Pro good at finding and exploiting bugs, it mostly is not the data Moonshot took out.
2. **It did not change the ranking in the way the framing implies.** At 81.0% the released model sits *above* GLM-5.3 and *below* DeepSeek-V4.1-Flash at 85.7% — an open-weight model whose publisher did no such filtering. If your threat model is "what can an adversary download", the redaction moved Kimi down exactly one rung, past a model nobody redacted.
3. **The number exists because of a rule, not a leaderboard.** On **16 October 2026** — a week before the launch — China's commerce and science ministries put a revised export-control catalogue into effect, and it reaches models of exactly this size. The 81.0% is a disclosure produced for a compliance conversation.

Moonshot's stated goal is the honest version of this: they aim **not to release open weights that extend the absolute frontier of cyber capability**, on the reasoning that diffusing capability gradually across open systems makes software more secure overall. That is a defensible position. It is also a *relative* goal, and the table is what a relative goal looks like when someone publishes the measurement.

<VerifyNote lastVerified="2026-10-26" source="Primary: Moonshot's Kimi K3.1 Pro tech blog (kimi.ai/blog/kimi-k3-1-pro) for the two-stage data removal, the xdev-bench-hard pass@3 figures for K3.1 Pro (81.0%), the unrestricted checkpoint (90.5%), DeepSeek-V4.1-Flash (85.7%), GLM-5.3 (57.1%) and K3 (33.3%), the 'absolute frontier of cyber capability' rationale, the 1M context window, the Kimi Hallu Bench Hard figures (8.3% vs 23.4%) and the 4 November 2026 open-weight date. Architecture (2.8T total / 104B active, 16 of 896 experts) and API pricing are from secondary technical coverage, not the blog section fetched here — treat them as reported. China's Announcement No. 48: effective 16 October 2026, 23 AI technology areas, the 10^26 FLOPs / 2T-parameter / global-top-ten thresholds, the autonomous-malware total ban, the vulnerability-tooling restriction, and the API / public-domain / open-source exemptions are from reporting on the draft catalogue (the-decoder, TechTimes, Sheppard Mullin); the comment period closing 15 November 2026 and the naming of Kimi K3 (2.8T) and Qwen3.8-Max (2.4T) as above-threshold examples are from that reporting, not from a translation of the text itself. The 'GPT-5.6 Sol at 100%' comparison circulating in coverage is from implicator.ai and did not appear in the blog section retrieved here — do not cite it as Moonshot's figure. Everything about whether fine-tuning restores the removed capability is unresolved: no source consulted makes a claim either way. Benchmark positions and weight availability will move; the arithmetic in the first table is the durable part." />

## Why targeted removal is weak, in the lab's own words

The most useful sentence Moonshot published is not about the data. It is the observation that **stronger general coding and long-horizon debugging capabilities generalise to cyber tasks even after targeted data removal**.

That is a statement about where the capability lives, and it explains the 9.5 points. Finding an exploitable bug in unfamiliar source and chaining a working exploit is, mechanically, the same loop as debugging: read code you did not write, build a model of its invariants, hypothesise a violation, test it, keep state across many steps, try again. A lab can delete a corpus of exploit write-ups. It cannot delete "is good at reasoning about unfamiliar code over long horizons" without deleting the product.

This is why the independent criticism lands. The sharpest version, from the analyst outlet Extrapolator, is that the cyber mitigation is the release's **most uncertain claim**, because the boundary of what counts as "cyber-related" is *fuzzy by definition* — the mitigation works as a **filtering heuristic, not a principled capability boundary**.

<Callout type="key" items={["Data filtering removes examples. It does not remove the general ability those examples happened to exercise. Expect redaction to be most effective against capabilities that need specific knowledge (a protocol, a toolchain, a named technique) and weakest against capabilities that are a general skill pointed at a target. Offensive security is mostly the second kind."]} />

## The verification asymmetry

`xdev-bench-hard` is Moonshot's own benchmark, and **it has not been published**. Neither has the methodology in full, nor any evidence about whether the removed capability can be restored.

That produces an unusual situation. The claim "we reduced cyber capability by 9.5 points" is:

- **falsifiable in principle** — once the weights are public, anyone can measure exploit success on *their* benchmark;
- **unfalsifiable as stated** — nobody outside the lab can run `xdev-bench-hard`, so the specific comparison between the released model and the withheld checkpoint cannot be checked by anyone, ever, because the unrestricted checkpoint is not being shipped.

Both halves matter. The second means the headline number is a vendor claim in the strict sense — the only one of the five rows in that table that nobody else can reproduce is the one the whole story rests on. The first means the *direction* of the claim is checkable from 4 November onward, and will be, by people with their own harnesses.

If you are tempted to treat a published safety delta as a measurement, apply the same discipline you would to any vendor benchmark — [how to read an AI benchmark without getting fooled](/docs/models/reading-ai-benchmarks) is the general version of this, and the specific trap here is the withheld-comparison arm.

## The rule behind the number

China's revised export catalogue took effect **16 October 2026** (circulated as **Announcement No. 48**), proposed by the commerce and science ministries, covering **23 artificial-intelligence technology areas** across large models, agents, compute clusters and data processing. Reporting on it describes a comment period open until **15 November 2026**.

What triggers control, and what the treatment is:

| Element | Detail |
|---|---|
| **Thresholds** (any one) | **10^26 FLOPs** of training compute · **≥ 2 trillion** parameters · **global top ten** by public evaluations, task performance, safety or usage |
| **What is controlled at threshold** | Core model technology: **weights, checkpoints, source code, architecture, training and inference methods** |
| **Total ban** | AI tools that can **autonomously write or modify malware** to attack critical infrastructure, military targets or government agencies |
| **Restricted, not banned** | Tools for **finding software vulnerabilities** — new export limits, no outright prohibition |
| **Also restricted** | Models trained on China's "important data" and serving on it, with narrow carve-outs |
| **Exempt** | **API calls**, apps, websites and SaaS · lightweight on-device versions · **already-public open-source releases** · academic research and papers |
| **Fast-track** | Open-source publication gets **automatic licensing on filing** |

<Callout type="note" items={["Sources disagree on the catalogue's legal status and this page does not resolve it. TechTimes describes Announcement No. 48 as having taken effect on 16 October 2026 with a comment period to 15 November, and analyses obligations as already applying to transactions entered into after that date. The Decoder describes the same 16 October publication as a draft revision that China 'plans' to make, open for comment. Both readings are consistent with a published measure that is simultaneously operative and open to revision, which is common in this process — but if the distinction matters to a decision you are making, read the measure itself or ask counsel rather than trusting either framing here."]} />

Now put Kimi next to it. Secondary technical coverage puts K3.1 Pro at **2.8 trillion total parameters with 104 billion active** (16 of 896 experts per token) and a **1,048,576-token** context window, built on K3. Reporting on the catalogue names **Kimi K3 (2.8T)** and **Qwen3.8-Max (2.4T)** as examples that clear the parameter threshold outright.

So a 2.8T model is above the line on parameter count alone, before anyone argues about rankings — and the strictest clause in the catalogue is a *total* export ban keyed to autonomous malware authorship. Against that backdrop, publishing a measured reduction in exploitation success, with the general coding ability intact, is exactly the artefact a fast-track filing wants.

<Callout type="note" items={["This page does not claim Moonshot said the redaction was done for Announcement No. 48; the blog frames it as a safety choice about the open-weight frontier, and the timing is a week apart. Both can be true. What is not in dispute is that a model of this size is within the catalogue's scope, that the strictest clause concerns autonomous malware, and that vulnerability tooling is named as restricted rather than banned."]} />

## The exemptions create a clock

Two carve-outs, read together, point one way:

- **Already-public weights are exempt.** Once something is in the public domain it is, as one legal analysis put it, beyond the reach of a national export rule.
- **Open-source publication gets automatic licensing on filing.**

The consequence for anyone planning a release is immediate: **the cheapest moment to publish open weights is before the rule hardens, not after.** Kimi K3.1 Pro's weights were due by **4 November 2026** — eleven days before the comment period on the catalogue closes.

The same asymmetry runs the other way for anyone *consuming* these models. Weights you already have are not retroactively controlled, and **API access is exempt entirely**. Reporting on existing deployments is consistent: organisations that had already licensed or deployed covered Chinese models are largely unaffected, while **new** licensing agreements, overseas server deployments or changes of control entered into after 16 October can trigger registration or licensing.

<Callout type="warning" items={["Once weights are downloaded they cannot be recalled. That is the whole design of an open-weight release and it is also why a redaction is a one-shot decision: there is no patch channel, no revocation, and no telemetry. Whatever capability ships on 4 November is the capability that exists forever, in whatever form the first fine-tuner leaves it in."]} />

## The question nobody answered

None of the material published about K3.1 Pro says whether **fine-tuning restores the removed capability**. That omission is the single most important thing about the release, for a simple reason: a filtering heuristic applied before release has no defence against a filtering-shaped hole being refilled after release.

It is also the question the open-weight ecosystem already knows how to answer, and has answered unfavourably before. The abliteration pipeline — a small, cheap post-hoc modification that removes refusal behaviour from an open model — is a working, widely distributed demonstration that *post-release* edits can undo *pre-release* safety work. See [backdoored open weights](/docs/security/backdoored-open-weights) for how that supply chain operates and what it means for anything you pull off a model hub.

The distinction worth holding onto: removing a **refusal** and restoring a **capability** are not the same engineering problem. Abliteration works on a behaviour the model still has; capability restoration requires the model to relearn something. Whether 9.5 points of exploit success is cheap to relearn with a modest fine-tune is an empirical question with, as of this writing, no published answer.

<Callout type="key" items={["A redaction is durable only if it is expensive to reverse. A published redaction with no published reversal cost is an unfinished claim. If you are evaluating one, treat 'can a cheap LoRA put this back?' as the load-bearing question — and note that the lab is the party best placed to answer it and the party with the least incentive to."]} />

## What this actually changes, by role

**If you do defensive security research.** This is the group with a real grievance, and the community reaction on r/LocalLLaMA was mostly this: a redacted open-weight model is a worse local tool for vulnerability research, and nothing about the carve-outs helps you. But look at what is still available before concluding you have lost the capability: **API access is exempt from the catalogue**, unredacted open-weight alternatives exist at comparable or higher scores (DeepSeek-V4.1-Flash at 85.7% is the example in Moonshot's own table), and on closed models there are now sanctioned routes — Anthropic runs an expanded Cyber Verification Program that makes advanced cyber capabilities and reduced blocking classifiers available to qualifying security professionals. What you have lost is the *default* local option from one vendor, not the capability class.

**If you deploy Chinese open weights.** Your exposure is about transactions, not usage. Weights already in hand are exempt as public-domain material; API and SaaS consumption is exempt; new licensing deals, new overseas deployments and control changes after 16 October are where obligations attach. If you have any of the second kind in flight, that is a question for counsel, not for a docs page — and note there is a symmetric set of US-side restrictions on the same models, so "which side's rules apply" is rarely one question.

**If you write threat models.** Update one number and leave the structure alone. The structure was already "a capable open-weight model is downloadable, and therefore the capability is in the world"; the update is that the best-documented open-weight exploit score just moved from 90.5% to 81.0% while a competitor sits at 85.7%. If your threat model's conclusion changes when the leading open model's exploit success moves 9.5 points, it was keyed too finely to begin with.

## Vitalik Buterin's framing, and why it is the useful one

The release drew an unusually direct endorsement from Ethereum's co-founder, and his argument is worth separating from the crypto-press framing of it.

Buterin supported leaving advanced offensive cyber capabilities out of training on the grounds that defenders need more time to harden software against increasingly capable attacks, and offered the general principle that **discriminating against use cases is much less bad than discriminating against users**. He paired it with a warning: if the first wave of AI cyber risk is mishandled, the likely response is models locked down tightly with access gated behind KYC review, pervasive surveillance, and stratification by identity credentials and nationality. Asked whether other labs will build the capability anyway, he answered that of course they will.

That last concession is the honest shape of the whole debate. The case for capability redaction is not that it prevents anything; Moonshot's own table shows it does not, and the person endorsing it says plainly that someone else will build it. The case is that **it buys time, and that a use-case restriction is a cheaper price than a user restriction**. Whether you find that persuasive is a judgement call. What you should not do is read 81.0% as a safety guarantee — including, and especially, if you are the person writing the policy that cites it.

## Reading the next one

There will be more of these. Here is the checklist to run before a published safety reduction changes anything you do.

<Steps items={[
  {title: "Find the baseline, not the delta", body: "A reduction is meaningless without the number it reduced from and the number the previous generation scored. Moonshot published all three, which is why the 9.5-versus-47.7 arithmetic is possible at all. If a release gives you only 'reduced by X%', you cannot tell a real mitigation from a rounding error on a capability jump."},
  {title: "Check whether the benchmark is published", body: "An internal benchmark makes the comparison unreproducible in principle, because the withheld checkpoint is never shipped. Note it as a vendor claim and look for an independent harness measuring the same capability class."},
  {title: "Rank the redacted model against unredacted peers", body: "The question a threat model asks is 'what is downloadable', not 'what did this vendor withhold'. If a competitor at the same tier scores higher with no filtering, the redaction changed one vendor's posture and not the frontier."},
  {title: "Ask where the capability lives", body: "If the lab itself says general ability generalises to the restricted task — as Moonshot does — the redaction is a heuristic. Capabilities that need specific knowledge are redactable; capabilities that are a general skill aimed at a target are not."},
  {title: "Look for a stated reversal cost", body: "Has anyone measured what a fine-tune costs to restore it? If nobody has, the durability of the mitigation is unknown, and the honest summary is 'reduced at release, unknown thereafter'."},
  {title: "Separate the regulatory artefact from the safety argument", body: "A number published in the same month as a rule that covers the model is doing two jobs. Both can be sincere. Read the thresholds yourself — parameter count, training FLOPs, ranking — and check which one the model crosses."},
  {title: "Read the licence and the model card when the weights land, not the blog", body: "Pre-release blog posts describe intentions. The licence describes what you may do, and the card describes what shipped. For K3.1 Pro the licence terms, hardware requirements and quantisation formats were all still unpublished at announcement."},
  {title: "Record the claim with its date", body: "Published safety deltas age badly: a new checkpoint, a community fine-tune or an independent eval can invalidate one within weeks. Whatever you write down, write down when it was true."},
]} />

<PromptCard title="Record a redaction claim in a form that survives contact with the next release">
{`Summarise this open-weight release as a capability-redaction record. Use only
what the sources support and mark anything missing as UNPUBLISHED — do not
estimate it.

Fields:
  model, publisher, announce_date, weights_date, params_total, params_active
  redaction: what data, which training stages, stated rationale
  benchmark: name, is_public (yes/no), metric (e.g. pass@3)
  score_redacted, score_unredacted_checkpoint, score_previous_generation
  peer_scores: same benchmark, same tier, no redaction
  derived: points_removed_by_redaction
  derived: points_added_by_the_generation (previous_gen -> unredacted)
  derived: share_of_gain_undone = points_removed / points_added
  reversal_cost: any published evidence that fine-tuning restores it
  licence, model_card_url, independent_eval_urls
  verified_on: <date>

Then answer one question in two sentences: does the redaction change what an
adversary can download today, or only what this publisher ships?`}
</PromptCard>

<PromptCard title="Check what a model hub actually hands you, before the weights matter">
{`# Resolve the repo and read its metadata — no download, public API.
REPO="moonshotai/Kimi-K3.1-Pro"   # confirm the real id from the announcement

curl -sf "https://huggingface.co/api/models/$REPO" \\
  | python3 -m json.tool \\
  || echo "404 — that id does not exist; find the canonical one first"

# The file list arrives in the same response, under "siblings".
# Three files answer 'what may I do, and what actually shipped':
#   LICENSE      — terms were unpublished at announcement
#   README.md    — the model card
#   config.json  — architecture as shipped, not as blogged
curl -sf "https://huggingface.co/api/models/$REPO" \\
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('license')); [print(s['rfilename']) for s in d.get('siblings',[])]"

# Fetch one small file without cloning the weights:
curl -sfL "https://huggingface.co/$REPO/raw/main/config.json"

# Then check the thing this page is actually about: derivatives.
# A redacted base with a popular 'uncensored' or 'restored' fine-tune
# listed against it is the signal that the redaction did not hold.
curl -sf "https://huggingface.co/api/models?search=k3.1&sort=downloads&limit=30" \\
  | python3 -c "import json,sys; [print(m['id']) for m in json.load(sys.stdin)]"`}
</PromptCard>

<Callout type="warning" items={["Repository ids on model hubs are not predictable from a product name, and this one did not resolve at the time of writing. Take the canonical id from the publisher's own announcement before scripting against it, and do not read a 404 as evidence that the weights were not released."]} />

## One more number from the same release, for calibration

The cyber figure got the coverage. The one that will affect more readers is on the other side of the ledger: on Kimi Hallu Bench Hard — again Moonshot's own internal stress test, with tools enabled — the **claim-level hallucination rate fell from 23.4% on K3 to 8.3% on K3.1 Pro**, a 65% relative reduction, with Moonshot noting that stress-test rates do not reflect typical use.

Both numbers come from the same lab, on the same day, on two unpublished internal benchmarks. One is a reduction the lab chose and wants credit for; the other is an improvement the lab wants credit for. Hold them to the same standard: the hallucination figure is exactly as reproducible by you as the exploit figure, which is to say not at all until someone runs an open harness on the released weights.

<Callout type="takeaways" items={["Removing cyber data from two training stages cost 9.5 points of exploit success (90.5% to 81.0%) — against a 47.7-point gain the same generation had delivered over K3's 33.3%. Roughly four-fifths of the capability survived the redaction.", "The lab's own explanation is why: general coding and long-horizon debugging skill generalises to exploitation. You cannot delete that without deleting the product, so targeted filtering is a heuristic rather than a capability boundary.", "At 81.0% the released model still scores above GLM-5.3 (57.1%) and below DeepSeek-V4.1-Flash (85.7%), an open-weight model with no such filtering. The redaction moved one vendor's posture, not the downloadable frontier.", "xdev-bench-hard is internal and unpublished, and the unrestricted checkpoint is never shipped — so the headline comparison is the one row in the table nobody outside Moonshot can ever reproduce.", "China's Announcement No. 48 (effective 16 October 2026, comment to 15 November) controls weights, checkpoints, source code and training methods at any one of three thresholds: 10^26 training FLOPs, 2T parameters, or a global top-ten ranking. A parameter count alone is enough, and Kimi K3 at 2.8T is cited as an example.", "The catalogue bans autonomous-malware tooling outright but merely restricts vulnerability-finding tools — and exempts API access, SaaS, on-device builds and anything already public, with automatic licensing on filing for open-source releases.", "Those exemptions create a publication race in one direction and a transaction-shaped exposure in the other: weights you already hold and API calls are exempt, while new licences and deployments after 16 October are not.", "Nobody has published whether fine-tuning restores the removed capability. Until someone does, the honest summary of any redaction is 'reduced at release, unknown thereafter' — and the abliteration supply chain is the existing proof that post-release edits beat pre-release safety work.", "Buterin's defence of the cut concedes the point that matters: other labs will build the capability anyway. The claim is that redaction buys defenders time and that restricting use cases beats restricting users — not that it prevents anything."]} />

<Flashcards title="Ten terms for reading a redacted release" cards={[
  {front: "Capability redaction", back: "Deliberately removing training data for a capability class before releasing a model, so the published weights score lower on that capability. Distinct from a refusal, which leaves the capability intact and declines to use it."},
  {front: "xdev-bench-hard", back: "Moonshot's internal, unpublished benchmark of expert-curated vulnerability-discovery and exploitation tasks built from real source code, scored at pass@3. The source of both the 90.5% and 81.0% figures, and reproducible by nobody outside the lab."},
  {front: "pass@3", back: "A task counts as solved if any of three attempts succeeds. It inflates absolute numbers relative to pass@1 and is the metric Moonshot reports — so read 81.0% as 'succeeds within three tries', not 'succeeds'."},
  {front: "Mid-training", back: "The stage between pretraining and post-training where a model is fed targeted, higher-quality corpora to build specific competencies. One of the two stages Moonshot filtered, the other being the reinforcement-learning environments."},
  {front: "Filtering heuristic vs capability boundary", back: "A heuristic removes examples that look like the restricted class; a boundary would guarantee the capability is absent. Because 'cyber-related' is fuzzy by definition, data filtering can only ever be the first."},
  {front: "Announcement No. 48", back: "China's revised export-control catalogue, effective 16 October 2026, covering 23 AI technology areas. Controls model weights, checkpoints, source code and training methods at 10^26 FLOPs, 2T parameters, or a global top-ten ranking."},
  {front: "Public-domain exemption", back: "The carve-out that puts already-published open weights outside the export rule. It makes a release irreversible in the legal sense as well as the technical one, and rewards publishing before a rule hardens."},
  {front: "Verification asymmetry", back: "When a safety claim's direction is checkable once weights ship, but its specific magnitude never is, because the comparison arm — here the unrestricted checkpoint — is withheld."},
  {front: "Reversal cost", back: "What it would take to restore a redacted capability by fine-tuning. Unpublished for K3.1 Pro, and the figure that decides whether a redaction is a mitigation or a release-day snapshot."},
  {front: "Abliteration", back: "A cheap post-hoc modification to open weights that strips refusal behaviour. The existing proof that post-release edits can undo pre-release safety work — though restoring a capability is a harder problem than removing a refusal."},
]} />

<Quiz title="Check yourself" questions={[
  {
    q: "Moonshot reported 90.5% for an unrestricted checkpoint, 81.0% for the released K3.1 Pro, and 33.3% for the previous generation K3. What is the most defensible reading?",
    options: [
      "The redaction removed most of the model's exploitation ability",
      "The redaction undid about a sixth of a 47.7-point generational gain, leaving the large majority of it in place",
      "K3.1 Pro is less capable at exploitation than K3 was",
      "The numbers are inconsistent and at least one must be wrong"
    ],
    answer: 1,
    explain: "33.3% to 90.5% is a 57.2-point gain for the unrestricted checkpoint; the released model at 81.0% keeps 47.7 of those points. The redaction cost 9.5 — roughly 17% of the gain. The released model is still about 2.4x K3's score."
  },
  {
    q: "Which single fact best explains why removing cyber-specific training data only moved the score 9.5 points?",
    options: [
      "The removed corpus was small relative to the pretraining mix",
      "pass@3 scoring masks capability losses that pass@1 would reveal",
      "General coding and long-horizon debugging skill generalises to exploitation, so the capability was not localised in the removed data",
      "The reinforcement-learning stage was not actually filtered"
    ],
    answer: 2,
    explain: "This is Moonshot's own stated explanation, and it is the mechanism that makes targeted removal weak in general: exploitation is the debugging loop pointed at a different goal, and a lab cannot delete that without deleting the product."
  },
  {
    q: "Under Announcement No. 48, which of these on its own is enough to bring a model's weights within scope?",
    options: [
      "Having 2 trillion or more parameters",
      "Being trained outside China",
      "Being offered through a public API",
      "Having a published licence that permits commercial use"
    ],
    answer: 0,
    explain: "The thresholds are disjunctive: 10^26 training FLOPs, 2T-plus parameters, or a global top-ten ranking by evaluations, task performance, safety or usage. Reporting cites Kimi K3 at 2.8T and Qwen3.8-Max at 2.4T as above-threshold examples. API and SaaS access is exempt, not a trigger."
  },
  {
    q: "You are updating a threat model after this release. Which conclusion follows from the published table?",
    options: [
      "The downloadable frontier for exploit capability dropped by 9.5 points",
      "Open-weight models can no longer perform vulnerability exploitation at a meaningful rate",
      "The downloadable frontier is unchanged, because an unredacted open-weight peer scores higher than the redacted model",
      "Nothing can be concluded, because the benchmark is internal"
    ],
    answer: 2,
    explain: "DeepSeek-V4.1-Flash scores 85.7% on the same benchmark with no comparable filtering. Moonshot's redaction changed what Moonshot ships; it did not lower the ceiling on what an adversary can download. The internal benchmark weakens the magnitude claim but these rows are all measured on the same harness, so the ordering is still informative."
  },
  {
    q: "What is the strongest reason to describe the 9.5-point reduction as 'reduced at release, unknown thereafter'?",
    options: [
      "Open weights are frequently re-quantised, which degrades benchmark scores",
      "No source has published what it costs to restore the removed capability by fine-tuning",
      "The weights were not available on a model hub at announcement",
      "Benchmarks drift as harnesses are updated"
    ],
    answer: 1,
    explain: "A pre-release filtering heuristic has no defence against a post-release fine-tune, and the reversal cost is simply unpublished. Abliteration already demonstrates that cheap post-hoc edits can undo pre-release safety work, though restoring a capability is harder than stripping a refusal."
  },
  {
    q: "A defensive security researcher says the redaction has removed their ability to do vulnerability research with capable models. What is the accurate correction?",
    options: [
      "Nothing has changed, because the redaction had no effect at all",
      "They have lost the default local option from one vendor; API access is exempt from the catalogue, unredacted open-weight peers score higher, and vendor programs exist for verified security professionals",
      "The export catalogue bans vulnerability-finding tools outright, so they are correct",
      "They should wait for the unrestricted checkpoint to be released"
    ],
    answer: 1,
    explain: "The catalogue bans autonomous-malware tooling outright but only restricts vulnerability-finding tools, and exempts API, SaaS and on-device access. DeepSeek-V4.1-Flash is an unredacted open-weight peer at 85.7%, and Anthropic's expanded Cyber Verification Program offers reduced blocking classifiers to qualifying professionals. The unrestricted checkpoint is explicitly not being shipped."
  }
]} />

## Sources & further reading

- **Moonshot AI** — *Kimi K3.1 Pro Tech Blog: Advancing Open Intelligence*: https://www.kimi.ai/blog/kimi-k3-1-pro — the primary source. The two-stage data removal, the `xdev-bench-hard` pass@3 table (81.0% / 90.5% / 85.7% / 57.1% / 33.3%), the "absolute frontier of cyber capability" rationale, the Kimi Hallu Bench Hard figures and the 4 November 2026 weight date all come from here.
- **Implicator.ai** — *Kimi K3.1 Pro Hacking Cut Rests on Unpublished Moonshot Test*: https://www.implicator.ai/kimi-k3-1-pro-hacking-cut-unpublished-test/ — the clearest account of what Moonshot did and did not publish, including that the benchmark is internal and that no claim is made about fine-tuning restoration. Also the source of the Extrapolator criticism quoted here and of a "GPT-5.6 Sol at 100%" comparison that this page attributes to them rather than to Moonshot.
- **The Next Web** — *Moonshot releases Kimi K3.1 Pro and says it cut its hacking skills*: https://thenextweb.com/news/moonshot-kimi-k3-1-pro-open-weight-cyber — independent reporting, including the explicit caveat that the benchmark figures are Moonshot's own and unverified, and the Terminal-Bench 4.0 context (65.7% against Claude Opus 5.5's 66.4%).
- **DataStudios** — *Moonshot AI Kimi K3.1 Pro: open-weight, 1M context, cyber safeguards*: https://www.datastudios.org/post/moonshot-ai-kimi-k3-1-pro-open-weight-1m-context-cyber-safeguards — the specification and pricing detail, and the note that licence terms, hardware requirements and quantisation formats were unpublished at announcement.
- **The Decoder** — *China plans to tighten export controls on open-weight models and 23 key AI technologies*: https://the-decoder.com/china-plans-to-tighten-export-controls-on-open-weight-models-and-23-key-ai-technologies/ — the catalogue's scope, the three thresholds, the autonomous-malware ban, the vulnerability-tooling restriction and the exemption list.
- **TechTimes** — *China's New AI Export Controls Apply Now if You Licensed or Deployed Covered Chinese Models*: https://www.techtimes.com/articles/329196/20261019/chinas-new-ai-export-controls-apply-now-if-you-licensed-deployed-covered-chinese-models.htm — the Announcement No. 48 label, the 15 November comment deadline, the naming of Kimi K3 and Qwen3.8-Max as above-threshold examples, and the transaction-shaped analysis of existing deployments.
- **Sheppard Mullin** — *Choosing Between U.S. and Chinese AI Models: The Export Control Risks on Both Sides*: https://www.sheppard.com/insights/blogs/us-vs-chinese-ai-models-export-control-risks — the reminder that the two regimes are symmetric, so "which rules apply" is rarely a single question.
- **crypto.news** — *Vitalik Buterin backs Kimi AI hacking limits, warns of KYC risks*: https://crypto.news/vitalik-buterin-kimi-ai-hacking-limits-kyc-risks/ — the "use cases rather than users" principle, the KYC-and-surveillance warning, and the concession that other labs will build the capability anyway.
- **Anthropic** — *Cyber Verification Program*: https://support.claude.com/en/articles/14604842-cyber-verification-program — the sanctioned route for verified security professionals, expanded on 6 October 2026 into three tiers (Defense Access, Red Team Access, Specialized Access) with reduced blocking classifiers and access to Opus 5.5, Sonnet 5.5 and Mythos 5.1. Check the program page for current eligibility; the terms are the part most likely to have moved.
- **Hugging Face** — Moonshot AI's organisation page: https://huggingface.co/moonshotai — where the weights land, and where to check the licence and model card rather than the blog.

## Next

- [Backdoored open weights](/docs/security/backdoored-open-weights) — the other half of this story: how post-release modifications to open weights actually work, and why "reduced at release" is not the same as "reduced"
- [Kimi K3: the world's largest open-weight model](/docs/models/kimi-k3-open-weight-frontier) — the generation this one is post-trained from, including the architecture and the cache-hit pricing that decides whether it is cheap
- [Deploy Kimi K3 locally with vLLM](/docs/models/kimi-k3-deploy-locally-vllm-dspark) — what a 2.8T open-weight model costs to actually run, if you are planning to pull the 4 November weights
- [How to read an AI benchmark without getting fooled](/docs/models/reading-ai-benchmarks) — the general discipline for vendor-reported numbers, which a published safety delta needs as much as a published capability one
