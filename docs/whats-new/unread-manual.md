# Claude has never seen 68% of the Claude Code docs

> Source: https://derob98.github.io/ailmanac/docs/whats-new/unread-manual · AILmanac (CC BY 4.0) · last verified 2026-10-15

We replayed 15 months of the official Claude Code docs, one week at a time. 68% of what they say today was written after June 2026, the training cutoff of every current Claude model. Here is what each model missed, and a plugin that tells it.

import {UnreadHeadline, ModelBars, LearnedSlider, CohortChart, SurvivalChart, NewIdentifiers} from '@site/src/components/DocsDecay';

<VerifyNote lastVerified="2026-10-15" source="https://platform.claude.com/docs/en/about-claude/models/overview">
Training cutoffs come from each model's page in the Claude Platform docs. The history of the Claude Code docs comes from a community mirror that copies the official pages several times a day. The numbers are a snapshot of 15 October 2026; the script that produces them is linked below, so anyone can re-run it.
</VerifyNote>

Every Claude model learned Claude Code from the docs as they stood at its training cutoff. Then the docs kept moving. We replayed their history, one week at a time, to measure how far apart the two have drifted.

<UnreadHeadline />

The newest models, Fable 5.1, Opus 5.5, Sonnet 5.5 and Haiku 5.5, have a reliable knowledge cutoff of June 2026. Between the end of June and 15 October, the docs grew from 107 pages to 164, and most of what they say now was written in those three and a half months. Count more strictly, by exact wording instead of by facts, and the share rises to 72%. Leave the code examples out and it is 70%. However you count it, Claude has never seen most of its own manual.

## What each model never saw

The older the cutoff, the less of today's docs a model could have read. All of these models are still available through the Claude API.

<ModelBars />

Claude Haiku 4.5, cutoff February 2025, predates almost everything: Claude Code launched as a research preview that month, and nearly all of today's docs came later.

## Pick the week you learned Claude Code

The same arithmetic applies to people. Move the slider to the week you read the docs, or to the date of the tutorial you are following.

<LearnedSlider />

## The docs are rebuilt, not just extended

Growth explains most of the gap, but not all of it. Pages also get rewritten. Each band below is the text written in one quarter; a band thins out as its sentences are deleted or changed.

<CohortChart />

In July 2025 the docs had 29 pages. Today they have 164, and 21 times as many sentences and code lines. Of the docs as they stood in July 2025, 30.5% still stands; the rest was deleted, or rewritten with a different number, flag or name. Even the June 2026 docs that the newest models saw have lost 26.9% of their facts in under four months.

## How long a sentence lasts

Follow every sentence from the week it appeared to the week it vanished, and half of them are gone or reworded within 196 days. If a rewording only counts when it changes a number, flag, path or name, half of the facts are gone within 266 days: about nine months.

<SurvivalChart />

## What your model has never heard of

These are the identifiers in the reference tables today that were not there at a model's cutoff: CLI flags, slash commands, hook events and environment variables. Ask Claude about one of them and it can only guess.

<NewIdentifiers />

"Documented since" is not "shipped since": a few of these existed earlier and only reached the docs later. Either way, the model had no page to learn them from.

## Give Claude the list

The [since-cutoff plugin](https://github.com/derob98/ailmanac/tree/main/plugins/since-cutoff) puts these lists in front of Claude. When a session starts, a hook reads which model is running and adds a short note to its context: the flags, commands and hook events documented after that model's cutoff, and an instruction to check the docs before relying on memory or saying a feature does not exist.

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install since-cutoff@ailmanac
```

The hook is a few lines of POSIX shell: no Node, no network, about 400 to 750 tokens per session. When Claude Code doesn't pass the model to the hook, as in our headless `-p` test, the note lists what changed since June 2026, which holds for every Claude model. In that test, the session received the note and Claude quoted it back word for word.

## What to do with this

- **Don't trust Claude's memory of Claude Code.** For flags, settings, hooks and commands, have it read the page. Claude Code ships a guide agent for questions about itself, and the docs publish an index at [code.claude.com/docs/llms.txt](https://code.claude.com/docs/llms.txt).
- **Date your tutorials.** A guide from six months ago has lost more than a third of its facts. Check anything older against the docs before you copy commands from it.
- **Prefer pages that say when they were checked.** Every page on this site carries the date it was last verified; the [freshness dashboard](/docs/whats-new/freshness) lists them all, and [Deprecation & Migration Watch](/docs/whats-new/deprecations) tracks what was removed.

## How we measured it

- **History.** [web3dev1337/claude-code-docs](https://github.com/web3dev1337/claude-code-docs) is a fork of a well-known docs mirror that kept the full sync history: 3,604 syncs between July 2025 and October 2026. We took the last sync of every week, 67 snapshots in all.
- **Scope.** Every Claude Code page except the changelog and the weekly digests, which record history by design, and the Agent SDK pages, which moved in from another docs site in 2026 and would otherwise count as new.
- **Units.** Each page is split into sentences, table rows and code lines, with links and markup stripped. A line that appears on five or more pages at once, such as a banner or a generic code line, is dropped. That left 90,674 distinct units to follow.
- **Deaths.** A unit is gone once it is missing from two weekly snapshots in a row, or from the latest one, so a page that failed one sync doesn't count.
- **Facts.** A new sentence that replaces one deleted the same week is treated as the same fact when at least 60% of their words match and every number, flag, path and identifier is identical. 7,965 rewordings were linked this way.
- **Cutoffs.** Each model is compared with the last weekly snapshot on or before the last day of its cutoff month, the most generous reading. Cutoffs before July 2025 use the first snapshot, which already holds more than those models could have seen: their shares are lower bounds.
- **Survival.** Kaplan–Meier estimates over every unit born after the first snapshot, with units still present today counted as censored.

The mirror is unofficial: if it missed or garbled a page, the numbers inherit that. We checked the cutoff weeks for pages that vanished for a sync and found none. The analysis compares text, not product behaviour.

## Reproduce it

The script and its output are in this site's repository: [scripts/research/docs-decay.mjs](https://github.com/derob98/ailmanac/blob/main/scripts/research/docs-decay.mjs) and [data/research/claude-code-docs-decay.json](https://github.com/derob98/ailmanac/blob/main/data/research/claude-code-docs-decay.json). It needs Node and git, and runs in about 15 seconds:

```bash
git clone https://github.com/web3dev1337/claude-code-docs
git clone https://github.com/derob98/ailmanac
node ailmanac/scripts/research/docs-decay.mjs claude-code-docs
```
