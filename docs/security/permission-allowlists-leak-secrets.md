# Your Permission Allowlist Is a Credential Store: 1,122 Leaking settings.local.json Files

> Source: https://derob98.github.io/ailmanac/docs/security/permission-allowlists-leak-secrets · AILmanac (CC BY 4.0) · last verified 2026-11-10

Apiiro found 104,185 public copies of .claude/settings.local.json and 1,379 real secrets in 1,122 of them — because 'Yes, and don't ask again' saves the approved command verbatim, credentials included. Why 215 of those files beat both gitleaks and TruffleHog, why Claude Code's gitignore protection writes to your GLOBAL excludes file and therefore cannot travel, the median 217-day exposure, and the rotate-before-you-delete order that most writeups get backwards.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={[
  "Understand the mechanism: approving a command permanently writes that command — verbatim, credentials and all — into a file in your repository",
  "See why 215 of the leaking files defeated both gitleaks and TruffleHog, and what that says about every secret scanner you run",
  "Know exactly what Claude Code's built-in gitignore protection does, why it works on your laptop, and the structural reason it cannot protect your teammates or your CI",
  "Run the five-command audit on your own repositories, including git history, where deleting the file changes nothing",
  "Apply the correct remediation ORDER — rotate first, clean up second — and understand why the reverse leaves you exposed",
  "Switch from approving literal commands to approving patterns, the one habit change that removes the whole class of problem",
  "Read the open disagreement between Apiiro's data and Anthropic's explanation, and decide which assumption to engineer against",
]} />

On **5 November 2026**, Apiiro researchers **Shmulik Cohen** and **Matan Giladi** published a survey of public GitHub for one specific filename: `.claude/settings.local.json`. They found **104,185 copies across 103,617 repositories**. In **1,122 of those files** — about **1.1%** — they found **1,379 real secrets**.

Four days later the Hacker News thread reached the front page with 622 points and 422 comments. The usual advice followed: don't commit your config files.

That advice is correct and it misses the mechanism entirely. Three details make this worth its own page:

1. **Nobody pasted a secret into a config file.** They typed a credential into a shell command — the ordinary thing you do when debugging a database — and then clicked **"Yes, and don't ask again."** Claude Code saved the approved command *as the permission rule*. The credential became part of the record that authorises the command next time.
2. **215 of the leaking files beat both industry-standard secret scanners.** Not because the scanners are bad, but because a password sitting after `PGPASSWORD=` or `sshpass -p` has no provider prefix, no key format, and no distinguishing entropy. It looks like an ordinary word in an ordinary command line.
3. **Claude Code does try to protect you, and the protection is structurally unable to travel.** It writes the ignore rule to your **global** git excludes file. That file is in your home directory. It is not in the repository, so it does not reach your teammate's clone, your CI runner, or your own next laptop.

This is not a prompt-injection story and there is no exploit. It is an authorised workflow whose audit trail happens to be a secrets file — which is a far more durable category of problem, and one that applies to every agent that persists approvals.

<VerifyNote lastVerified="2026-11-10" source="Apiiro's research by Shmulik Cohen and Matan Giladi, published 5 November 2026 at apiiro.com/blog/coding-agents-leaking-secrets-github-dont-ask-again, as reported by iTnews, iTWire, GBHackers, i10x and MLQ (Apiiro's own page returns 403 to automated fetches); Anthropic's response via Boris Cherny on Hacker News item 50408126, 7 November 2026; Claude Code settings and permissions documentation at code.claude.com.">
All counts are Apiiro's own, from a public-GitHub collection reported as spanning **1–3 November 2026** (that date range is single-sourced to iTWire). Apiiro classified candidates with a filter plus an LLM reviewer against a rubric and **did not test any credential**; one notified organisation confirmed its key had been live. Apiiro sells application and agent security products — read the totals as a vendor study that has not been independently reproduced. **No CVE and no severity rating has been assigned by anyone.** As of 8 November 2026 there was **no confirmed product fix and no version number** — the circulating claim that newer Claude Code versions resolve this could not be verified. The global-git-excludes behaviour described below was **reproduced locally on 2026-11-10**: with `core.excludesFile` unset, `~/.config/git/ignore` contained exactly `**/.claude/settings.local.json` as its first line. The scanner comparison carries one single-sourced caveat noted in its section.
</VerifyNote>

## The numbers

| What Apiiro counted | Figure |
|---|---|
| Public copies of `.claude/settings.local.json` | **104,185** across **103,617** repositories |
| Files containing at least one real secret | **1,122** (≈1.1%) |
| Distinct secrets in those current copies | **1,379** |
| Organisations affected | **63**, mostly software companies |
| Additional secrets found only in **older git-history versions** | **734** across **509** repositories |
| Forks carrying the same secrets onward | **211 forks** of **74** repositories |
| Secrets in the *shared* `.claude/settings.json` | **298** of **76,011** public copies, mostly inside allow rules |
| **Total including history, shared settings and saved agent transcripts** | **2,539 secrets across 1,994 repositories** |
| Median time the secret-bearing files had been sitting on the default branch | **≈217 days** |

That last row is the one to sit with. The median exposure was not hours. It was **roughly seven months**.

### What kind of secrets

| Type | Count |
|---|---|
| Database passwords | **379** |
| Supabase service-role keys | **122** |
| Supabase account tokens | **103** |
| SSH logins for public servers (some root, inside `sshpass` commands) | **43** |
| GitHub, GitLab and npm tokens (combined) | **42** |
| AWS keys | **23** |
| Private keys | **6** |

More than a **third** of the secrets opened a database directly. Named worst cases reported include a database vendor's own cloud API key with management access, a software agency's production payment-processor token, and the owner password for a medical-records application's cloud database.

By classification method, the 1,379 split into **636** values matching a known provider key format and **743** passwords or tokens sitting next to a public server address. Hold on to that split — it explains the scanner result below. *(The 103 account-token and 6 private-key rows, and the 636/743 split, are reported by a single outlet; the rest are corroborated across several.)*

## Part 1 — The mechanism, precisely

Claude Code asks before running most shell commands. The prompt offers a persistent option — **"Yes, and don't ask again"** — and choosing it writes an `allow` rule into `.claude/settings.local.json` at the root of your repository. The approval is **permanent for that repository and command**, and applies to future sessions, including worktrees.

The file's shape is ordinary:

<PromptCard title="The safe shape — a pattern rule, from Claude Code's own documentation">{`{
  "permissions": {
    "allow": ["Bash(npm run test *)"],
    "deny": ["Read(./.env)", "Read(./.env.*)"]
  }
}`}</PromptCard>

Here is the hinge. **Sometimes the saved rule is a pattern** like the one above. **Sometimes it is the exact command as typed.** When it is the exact command, every character of that command — including a password you passed inline — becomes part of the rule string.

So the failure needs no mistake and no attacker. It needs a normal afternoon:

<Steps items={[
  {title: "You are debugging a database, so you give Claude a working command", body: "You type, or Claude proposes from a config file it just read, something with the credential inline — a psql invocation preceded by a PGPASSWORD assignment, an sshpass login, a mysql call with the password attached to the flag. This is how these tools have always been driven from a shell."},
  {title: "It works, and it is going to be needed again", body: "You are going to run it fifteen more times this hour. The permission prompt appears for the fifteenth time. You choose 'Yes, and don't ask again' — which is exactly what that option is for, and what every guide to reducing prompt fatigue recommends."},
  {title: "The command becomes the rule, verbatim", body: "Claude Code appends an allow entry containing the full command text. The credential is now a line in a JSON file inside your repository. Nothing warned you, because nothing is wrong yet."},
  {title: "The file gets committed by someone, or something, eventually", body: "Perhaps a teammate who cloned before any ignore rule existed. Perhaps a 'git add -A' on a folder that became a repository after the fact. Perhaps CI. Apiiro traced Claude-coauthored commits touching the file in 539 of 1,105 repositories it examined — a figure Anthropic's own explanation disputes, discussed below."},
  {title: "It sits there for a median of 217 days", body: "No alert fires, because the two scanners most likely to be watching cannot see the thing that leaked — which is the next section."},
]} />

<Callout type="warning" items={[
  "This is a property of Claude Code, not of any model: Apiiro reproduced the write-behaviour with both Opus 5.5 and Fable 5.1. Switching models does nothing. Apiiro also compared the documentation of 16 coding agents and reported Claude Code as the only one confirmed to save the full approved command into a project file by default — but 'confirmed' is doing work in that sentence, and persisted-approval designs are common. Audit whichever agent you run rather than assuming you are safe because you use a different one.",
]} />

## Part 2 — Why 215 files beat both scanners

Apiiro ran the leaking files past the two most widely deployed open-source secret scanners. Of the **1,122** secret-bearing files:

| Scanner | Files flagged |
|---|---|
| gitleaks | **564** |
| TruffleHog | **643** |
| **Flagged by neither** | **215** |

That is **19% of the leaking files invisible to both tools**. The reason is the 636/743 split from earlier.

A scanner finds secrets two ways: it matches **known formats** (an `AKIA…` prefix, a `ghp_…` token, a Supabase JWT shape) or it flags **high-entropy strings** in suspicious positions. Both techniques work on *issued credentials*, which are designed to be recognisable.

Neither works on a **password a human chose**, sitting in the argument position of a shell command. `PGPASSWORD=Summer2024!` has no vendor prefix to match. Its entropy is unremarkable. Structurally it is indistinguishable from a configuration value, a test fixture, or a word. The misses were overwhelmingly of exactly this kind — inline passwords after `PGPASSWORD=`, `sshpass -p` and `mysql -p`.

<Callout type="note" items={[
  "One caveat on the 564/643 split, reported by a single outlet: both scanners were run WITHOUT their verification step — the mode where a tool attempts to confirm a candidate credential is live. Verification mainly improves precision rather than recall, and it cannot help on a password that matches no rule in the first place, so the 215 figure is unlikely to be an artefact of it. But if you cite the per-scanner numbers, cite that caveat with them.",
]} />

The generalisable lesson is independent of this incident: **your secret scanning is tuned for issued tokens and largely blind to chosen passwords in command arguments.** Agent config files and saved transcripts are full of command arguments. If you only add `.claude/` to your scanner's paths and change nothing about its rules, you will catch roughly four fifths of this problem.

## Part 3 — The gitignore protection that cannot travel

Claude Code is not indifferent to this. The first time it writes `settings.local.json` into a repository that does not already ignore it, it adds an ignore rule — **to your global git excludes file**, not to the project's `.gitignore`.

You can confirm this on your own machine in two commands:

<PromptCard title="Verify the protection exists — and see where it lives">{`# Where Git looks for your personal excludes.
# If this prints nothing, Git uses the XDG default: ~/.config/git/ignore
git config --get core.excludesFile

# The rule Claude Code writes:
grep -n 'claude' ~/.config/git/ignore`}</PromptCard>

Run on this machine on 10 November 2026, `core.excludesFile` was unset and the first line of `~/.config/git/ignore` was exactly `**/.claude/settings.local.json`. The protection is real and it is working.

It also cannot possibly be enough, for four reasons that are all structural rather than bugs:

- **A global excludes file is not committed.** It lives in your home directory. Your teammate's clone has never seen it. Neither has your CI runner, your dev container, or your next laptop.
- **It does not retroactively help a folder that became a repository later.** Plenty of agent work starts in a scratch directory and gets `git init`-ed afterwards.
- **Ignore rules do nothing to already-tracked files.** This is Git's documented behaviour, not a Claude Code limitation: once a path is in the index, `.gitignore` is irrelevant to it.
- **It protects one filename.** The *shared* `.claude/settings.json` is a file teams commit deliberately, and 298 public copies of it held secrets too.

So the fix on your side is small and it is not optional: put the path in the **repository's own** `.gitignore`, where it travels with the project.

<PromptCard title="Make the ignore rule travel with the project">{`# In the repo, not in your home directory.
printf '%s\\n' '.claude/settings.local.json' >> .gitignore

# Or ignore the whole agent config directory, which also covers
# transcripts and anything future versions add:
printf '%s\\n' '.claude/' >> .gitignore

git add .gitignore && git commit -m "chore: ignore local agent permission settings"`}</PromptCard>

## Part 4 — Audit your own repositories

Five checks, in order. The third is the one people skip, and it is the one that matters.

<PromptCard title="The five-command audit">{`# 1. Is the file tracked RIGHT NOW?
git ls-files .claude/settings.local.json

# 2. Has it EVER been committed, on any branch?
#    An empty result from step 1 means nothing without this.
git log --all --oneline -- .claude/settings.local.json

# 3. Look for the secrets the scanners miss: inline passwords
#    in command arguments, across all of history.
git log --all -p -- .claude/ | grep -nE 'PGPASSWORD=|sshpass -p|mysql .*-p|MYSQL_PWD=|--password[= ]'

# 4. Confirm an ignore rule actually applies, and see which file it came from.
git check-ignore -v .claude/settings.local.json

# 5. Run the scanners over history too, not just the working tree.
gitleaks git -v          # gitleaks 8.19+; older: gitleaks detect -v
trufflehog git file://.`}</PromptCard>

Inside a Claude Code session, the `/permissions` command lists every active rule **and which file each one came from** — the fastest way to find a literal command sitting in an allowlist on a machine where nothing was ever committed.

Then widen the search. Apiiro's own recommendation is to sweep the whole organisation for both `.claude/settings.local.json` **and** `.claude/settings.json`, history included, even in repositories where the file is already gone. And since every persisted-approval agent has the same shape of file, scan the siblings: `.claude/`, `.cursor/`, `.gemini/`, `.specstory/`.

<Callout type="warning" items={[
  "Deleting the file does not remove the secret. It stays in git history, in every fork, and in every clone your colleagues already have. Apiiro found 734 secrets that existed ONLY in older versions of the file, plus 211 forks of 74 repositories carrying secrets onward. Treat a credential that ever touched a committed file as public.",
]} />

## Part 5 — Remediate in the right order

Most writeups put cleanup first. That is backwards, and the reason is the row above: history, forks and clones are outside your control, so **scrubbing buys you nothing until the credential is dead.**

<Steps items={[
  {title: "1. Rotate every credential the files have ever held", body: "Every password, token and key, including ones only visible in git history. Rotation is the only step that actually ends the exposure; everything after it is hygiene. Apiiro did not test any of the credentials it found, and one notified organisation confirmed its key had been live — assume yours is."},
  {title: "2. Purge the rules from every developer's machine", body: "Open .claude/settings.local.json on each machine — even ones where nothing was ever committed — and delete every allow entry containing a literal credential. Use /permissions inside a session to enumerate them and see which file holds each one."},
  {title: "3. Untrack the file and add it to the repository's .gitignore", body: "git rm --cached .claude/settings.local.json, then commit the .gitignore entry so the rule travels with the project instead of living in one person's home directory."},
  {title: "4. Stop putting credentials in command text at all", body: "Reference them from a secrets manager by variable, so the command contains a name rather than a value. Note the sharp edge here: writing the password into an inline environment-variable assignment on the command line still puts the literal into the command text — and therefore still into any rule derived from it. The variable must be exported from somewhere else, not assigned in the command you approve."},
  {title: "5. Approve patterns, never literal one-off commands", body: "This is the habit change that removes the entire class of problem. Bash(psql *) as a rule carries no secret; the exact psql invocation you just ran may. When the prompt offers to remember a command, prefer editing it down to a pattern."},
  {title: "6. For teams: make it structural", body: "Add the path to your organisation's .gitignore templates. Scan .claude/, .cursor/, .gemini/ and .specstory/ in pre-commit and in CI, history included. And extend your scanner rules to catch passwords inside command arguments, not only known key formats — otherwise you reproduce the 215-file blind spot in your own pipeline."},
]} />

<PromptCard title="A deny rule is cheap insurance on top of the above">{`{
  "permissions": {
    "allow": ["Bash(psql *)", "Bash(npm run test *)"],
    "deny": ["Read(./.env)", "Read(./.env.*)", "Read(./**/*.pem)"]
  }
}`}</PromptCard>

## Part 6 — The disagreement worth knowing about

Anthropic responded publicly. Boris Cherny of the Claude Code team wrote on Hacker News on 7 November 2026:

> Historically Claude Code has not done secret scrubbing (there are many good tools for that), but we are looking into what we can do to prevent this.

He added that `settings.local.json` is not a file you should check into source control, and that the exposed copies had been **"manually created and checked in"** — the argument being that since Claude Code adds the ignore rule when it creates the file, committed copies must have come from somewhere else. He recommended [auto mode](/docs/claude-code/permissions), which screens actions through a classifier instead of accumulating allow rules, plus secret scanning at the git host. Prototypes under consideration: teaching auto mode to catch these commands, and building in basic secret scanning — with the caveat it might not fully fix it. When a commenter pointed out the same exposure can happen in auto mode, his reply was "Yeah good catch."

**That explanation and Apiiro's data do not fit together.** Apiiro reports Claude-coauthored commits touching the file in **539 of 1,105** traced repositories. Apiiro is careful that co-authorship does not prove Claude introduced or pushed each credential — the commit may have swept up a pre-existing file. But "manually created and checked in" is hard to reconcile with agent-authored commits in half the sample.

You do not need to resolve it to act, and the engineering conclusion is the same under either account:

- If Anthropic is right, the protection depends on a file in your home directory, and every one of the four structural gaps in Part 3 still applies to your team.
- If Apiiro is right, agent-authored commits are a live path for the file into your repository, and the protection is weaker still.

Either way: put the ignore rule in the repo, approve patterns not literals, and scan for inline passwords. Note also that **nothing is confirmed fixed** — no version, no changelog entry, no CVE, no severity rating, as of 8 November 2026.

## Part 7 — This was reported 15 months earlier

The part that makes this a process story rather than a bug story:

| When | What |
|---|---|
| **11 August 2025** | GitHub issue #5544 on `anthropics/claude-code` reports approved commands storing API keys word-for-word |
| **4 December 2025** | Issue #13106 reports API keys reaching a public repo via `settings.local.json` because `.claude/` was not ignored; bot-closed as a duplicate |
| **3 January 2026** | Issue #5544 closed **by a bot as "not planned"** after 60 days of inactivity |
| **February 2026** | ironPeak describes a committed Claude settings file holding approved commands with database passwords and API keys, and publishes a scanner for AI config files and their history |
| **April** | Lakera reports credentials in 33 such files across 30 packages published to npm *(year not stated in the source)* |
| **5 November 2026** | Apiiro publishes the 104,185-file survey |
| **6 November 2026** | The most recent of four related issues the researchers cited is bot-closed, none having received a reply |
| **7 November 2026** | Anthropic responds on Hacker News |

The mechanism was described in a public issue tracker **fifteen months** before the survey that made it news. The issues were not rejected on the merits; they were closed by inactivity automation. That is the transferable lesson for anyone running a repository at this scale: **a staleness bot that closes security reports is a security control with the sign flipped.**

<Flashcards cards={[
  {front: "The mechanism in one sentence", back: "Choosing 'Yes, and don't ask again' can save the approved shell command verbatim as a permission rule in .claude/settings.local.json — so a credential typed inline becomes a line in a file in your repository."},
  {front: "104,185 / 1,122 / 1,379", back: "Public copies of .claude/settings.local.json found; files among them holding at least one real secret (~1.1%); distinct secrets in those files."},
  {front: "2,539 across 1,994", back: "The broader total once older git-history versions, the shared settings.json, and saved agent transcripts are included."},
  {front: "Why 215 files beat both scanners", back: "gitleaks flagged 564 and TruffleHog 643 of 1,122. The 215 misses were human-chosen passwords in command arguments (PGPASSWORD=, sshpass -p, mysql -p) — no provider prefix, no key format, unremarkable entropy."},
  {front: "Where Claude Code writes its ignore rule", back: "To your GLOBAL git excludes file (core.excludesFile, default ~/.config/git/ignore) as **/.claude/settings.local.json — never to the project .gitignore. So it cannot reach a teammate's clone, CI, or your next machine."},
  {front: "Median exposure", back: "About 217 days on the default branch — roughly seven months, not hours."},
  {front: "Correct remediation order", back: "Rotate first, clean up second. History, forks and existing clones are outside your control, so scrubbing buys nothing until the credential is dead."},
  {front: "The one habit that removes the class", back: "Approve PATTERNS, not literal commands. Bash(psql *) carries no secret; the exact invocation you just ran may."},
  {front: "Is it a model problem?", back: "No. Reproduced with both Opus 5.5 and Fable 5.1 — it is a property of Claude Code's approval persistence, so switching models changes nothing."},
  {front: "CVE / severity", back: "None assigned by anyone. It is an exposure finding, not a demonstrated breach; Apiiro did not test the credentials, though one organisation confirmed its key had been live."},
]} />

<Quiz title="Check yourself" questions={[
  {q: "How does a credential end up in .claude/settings.local.json?", options: ["Claude Code scans your environment and caches credentials for reuse", "Choosing 'Yes, and don't ask again' can save the approved command verbatim as an allow rule, including any credential typed inline", "A prompt injection tricks the agent into writing secrets to disk"], answer: 1, explain: "No attacker and no mistake is required. The persistent-approval option records the command as the rule; if you passed a password inline, the password is in the rule. This is why it is a workflow problem rather than an exploit."},
  {q: "Why did 215 of the 1,122 leaking files evade both gitleaks and TruffleHog?", options: ["The scanners were misconfigured to skip dotfolders", "The secrets were encrypted inside the JSON", "They were human-chosen passwords in command arguments, with no provider prefix or key format and unremarkable entropy"], answer: 2, explain: "Scanners match known credential formats or flag high-entropy strings. A password like one after PGPASSWORD= has neither property — it is structurally indistinguishable from an ordinary configuration value."},
  {q: "Claude Code adds an ignore rule when it first creates the file. Where does it go, and why is that insufficient?", options: ["To the project .gitignore, but only on the default branch", "To your global git excludes file in your home directory, which is never committed and so cannot reach teammates, CI, or a new machine", "To .git/info/exclude, which is deleted on every clone"], answer: 1, explain: "It writes **/.claude/settings.local.json to the global excludes file (default ~/.config/git/ignore). That protects the machine that created it and nothing else — and ignore rules never affect already-tracked files."},
  {q: "You find a committed settings.local.json with a database password. What do you do FIRST?", options: ["git rm --cached the file and force-push to rewrite history", "Rotate the credential", "Add the path to .gitignore and commit"], answer: 1, explain: "Rotate first. The secret already exists in git history, in forks, and in colleagues' clones — all outside your control. Cleanup is hygiene; rotation is the only step that actually ends the exposure."},
  {q: "Which habit removes this entire class of problem?", options: ["Using a different model, since the behaviour is model-specific", "Approving patterns like Bash(psql *) instead of literal one-off commands", "Never using the permission system and confirming every command manually"], answer: 1, explain: "A pattern rule carries no credential. The behaviour is not model-specific — it reproduced on both Opus 5.5 and Fable 5.1 — and manual confirmation of everything is what drives people to click 'don't ask again' in the first place."},
  {q: "What is the substantive disagreement between Apiiro and Anthropic's public response?", options: ["Whether the file should exist at all", "Whether the secrets were real, since Apiiro never tested them", "Anthropic said the exposed files were 'manually created and checked in', while Apiiro traced Claude-coauthored commits touching the file in 539 of 1,105 repositories"], answer: 2, explain: "Both positions lead to the same engineering actions, but they imply different exposure paths. Note that co-authorship does not prove the agent introduced each credential — the commit may have swept up a pre-existing file."},
  {q: "Why is checking 'git ls-files .claude/settings.local.json' on its own not a sufficient audit?", options: ["Because it only works on the default branch", "Because it shows only what is tracked right now, and says nothing about history, forks, or clones others already hold", "Because it requires the file to be gitignored first"], answer: 1, explain: "Apiiro found 734 secrets that existed only in older versions of the file, plus 211 forks of 74 repositories. You also need git log --all and a history-aware scanner run."}
]} />

## Sources & further reading

- [Apiiro — coding agents leaking secrets via "don't ask again"](https://apiiro.com/blog/coding-agents-leaking-secrets-github-dont-ask-again) — the primary research by Shmulik Cohen and Matan Giladi, 5 November 2026, with the full methodology and all counts. Note the page is script-rendered and returns 403 to automated fetches; the figures here come from the outlets below, which all cite it
- [iTnews — "Don't ask again" in Anthropic's Claude Code leaks developer secrets](https://www.itnews.com.au/news/dont-ask-again-in-anthropics-claude-code-leaks-developer-secrets-630203) — the scanner split, the secret-type breakdown, the named worst cases, and Anthropic's response
- [iTWire — Claude Code approval files found exposing company secrets on GitHub](https://itwire.com/business-it-news/security/claude-code-approval-files-found-exposing-company-secrets-on-github-says-apirro-researchers) — the clearest account of methodology: the 1–3 November collection window, the LLM-reviewer classification step, and the caveat that credentials were never tested
- [GBHackers — Claude Code's "don't ask again" feature exposed](https://gbhackers.com/claude-codes-dont-ask-again-feature-exposed/) — the sub-breakdown of the 1,379 into provider-format keys versus host-adjacent passwords
- [Boris Cherny's response on Hacker News](https://news.ycombinator.com/item?id=50408126) — Anthropic's position on scrubbing, auto mode, and what was manually checked in
- [GitHub issue #5544 — anthropics/claude-code](https://github.com/anthropics/claude-code/issues/5544) — the August 2025 report of this exact behaviour, bot-closed as "not planned" in January 2026
- [ironPeak — leaking secrets from the Claude settings file](https://ironpeak.be/blog/leaking-secrets-from-the-claud/) — the February 2026 writeup and a scanner for AI config files and their history
- [gitleaks](https://github.com/gitleaks/gitleaks) and [TruffleHog](https://github.com/trufflesecurity/trufflehog) — the two scanners in the comparison; both worth running over history, both blind to inline passwords by default
- [Claude Code settings documentation](https://code.claude.com/docs/en/settings) — the official description of `settings.local.json` and the global-excludes behaviour
- [Git — gitignore documentation](https://git-scm.com/docs/gitignore) — the rule that ignore patterns do not affect already-tracked files

## Next

- [Permissions & Permission Modes](/docs/claude-code/permissions) — the allow/ask/deny system this page is about, including auto mode, the alternative Anthropic recommends over accumulating allow rules
- [Sandbox Credential Masking](/docs/claude-code/sandbox-credential-masking) — the structural fix: let `gh`, `npm` and `aws` authenticate without the command ever holding the real secret
- [Coding Agents Under Attack](/docs/security/coding-agents-under-attack) — the wider trust boundary around an agent that reads and writes your repository
- [Hardening Autonomous Runs](/docs/security/hardening-autonomous-runs) — what changes when nobody is watching the approval prompt at all
