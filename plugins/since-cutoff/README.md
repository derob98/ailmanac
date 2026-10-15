# since-cutoff

Claude learned Claude Code from the docs as they stood at its training cutoff.
The docs kept moving. On 15 October 2026, 68% of what they said was not in them
at the end of June 2026, the cutoff of every current Claude model
([how that was measured](https://derob98.github.io/ailmanac/docs/whats-new/unread-manual)).

This plugin tells Claude what it missed. At the start of each session, a hook
adds a short note to Claude's context: the CLI flags, slash commands and hook
events documented after the running model's cutoff, how many environment
variables arrived since, and an instruction to check the docs before relying on
memory or saying a feature does not exist.

```text
Claude Code has changed since your training cutoff (Jun 2026). As of 2026-10-15,
68.3% of what the official Claude Code docs say was not in them at your cutoff,
and 65 of their 164 pages are new.
Documented since then (names only; read the docs before you use one):
- CLI flags (11): --append-subagent-system-prompt, --autocompact, --cloud, ...
- Slash commands (21): /artifacts, /auto-mode-setup, /skill-doctor, ...
- Hook events (3): DirectoryAdded, PostModelSwitch, PreModelSwitch
- Environment variables: 168 new, listed at https://code.claude.com/docs/en/env-vars
...
```

## Install

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install since-cutoff@ailmanac
```

Update with `claude plugin marketplace update ailmanac`, remove with
`claude plugin uninstall since-cutoff@ailmanac`.

## How it works

- `hooks/hooks.json` runs `scripts/briefing.sh` on `SessionStart` (new
  session, `/clear`, and after compaction).
- The script reads the model from the hook input and prints the ready-made note
  for that model's reliable knowledge cutoff from `briefings/`. It uses only
  POSIX `sh` and `sed`: no Node, no jq, no network.
- Claude Code leaves the model out of some sessions, such as headless `-p`
  runs. Those get `briefings/default.json`, the list since the newest cutoff of
  any Claude model, which holds whichever model is running. A model ID the
  script does not recognise may be newer than its data, so it gets nothing.
- The note costs roughly 400 to 750 tokens, once per session.

## Where the lists come from

`scripts/research/docs-decay.mjs` in this repository replays 15 months of
history from a community mirror of the official docs
([web3dev1337/claude-code-docs](https://github.com/web3dev1337/claude-code-docs),
one commit per sync since July 2025). An identifier counts as new when it
appears in the reference tables today and did not at the model's cutoff: flags
from the CLI reference, commands from the commands page, hook events from the
hooks reference, environment variables from any table. Cutoffs come from each
model's page in the Claude Platform docs. The lists are dated: they say what
was documented, not when a feature first shipped.
