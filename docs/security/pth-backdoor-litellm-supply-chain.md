# The .pth Backdoor: LiteLLM 1.107.0 and Code That Runs Before Your Import

> Source: https://derob98.github.io/ailmanac/docs/security/pth-backdoor-litellm-supply-chain · AILmanac (CC BY 4.0) · last verified 2026-10-22

On October 21, 2026 litellm 1.107.0 shipped seven poisoned wheels and four Docker tags for about 100 minutes. The payload never needed anyone to import litellm — it arrived as a .pth file, which Python executes at every interpreter start. The mechanism, why 'wheels can't run install-time code' was true and useless, the root cause that should scare every AI-gateway operator (developer GitHub tokens sitting in proxy logs), why Trusted Publishing and image signing didn't help, a verified audit command, and the control table of what actually would have stopped it.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Understand why the payload ran on hosts where nobody ever imported litellm — Python's site module executes .pth lines that begin with import, at every interpreter start, before your code", "See why the comforting rule 'wheels don't execute code at install time' was completely true and completely irrelevant here", "Trace the root cause that matters to anyone running an AI gateway: a coding agent put a GitHub OAuth token in a response body, and the proxy logged response bodies", "Understand why Trusted Publishing, Docker image signing and immutable tags — all already in place since March — did not stop a release built from a lookalike repository", "See the attacker adopt this primitive in real time: in March 2026 litellm 1.82.7 needed you to use the package, and 1.82.8 — the next release — switched to a .pth", "Run a verified audit for executable .pth lines on your own machines, and read the result correctly (setuptools ships one legitimately)", "Apply the control table: which of the fifteen usual supply-chain defences would actually have blocked this, which would have signed the malware, and the one-line config that would have stopped both LiteLLM incidents"]} />

On **October 21, 2026**, for roughly **100 minutes**, `pip install litellm` installed a credential stealer and an hourly remote code loader. The Hacker News thread reached the front page with 519 points. The usual advice followed: pin your versions, rotate your keys.

That advice is right, and it is also the least interesting thing about this incident. Three details make it worth a page:

1. **The payload did not need to be imported.** It shipped as a `.pth` file, which Python's `site` module executes on **every interpreter start** in that environment. A host that installed LiteLLM into a shared virtualenv and then ran an unrelated script leaked its credentials anyway.
2. **The initial access came through an AI gateway's logs.** Per LiteLLM's own post-mortem, Claude Code embeds a user's GitHub CLI OAuth token in a response body; LiteLLM's internal deployment logged response bodies; that deployment was reachable from the public internet. The attacker read three developers' GitHub credentials out of a proxy log.
3. **The release was signed, published through Trusted Publishing, and attributable to the real repository** — because the attacker did not fake the publisher. They edited the publisher's workflow to build from `Berri-AI/litellm` instead of `BerriAI/litellm`.

If you run an LLM proxy in front of coding agents, point 2 is the one to read twice. Your gateway's request and response logs are a credential store you probably never classified as one.

<VerifyNote lastVerified="2026-10-22" source="LiteLLM's incident post (docs.litellm.ai/blog/security-incident-oct-21-2026), plus StepSecurity, SafeDep, JFrog and Wiz technical analyses, The Hacker News, and the Python 3 site module documentation. Timestamps, the credential-theft chain and the remediation steps are the maintainers' own account, which was still being updated at the time of writing — expect the root-cause wording to be refined. The sdist omitting the payload is SafeDep's and JFrog's finding; the March 2026 Trivy-driven first compromise is JFrog's. Independently verified on 2026-10-22: litellm 1.107.0 is absent from the PyPI JSON API and the newest release is 1.106.2 (7 wheels + 1 sdist, consistent with the maintainers' 'seven wheels'; Wiz's writeup counts eight distributions); PyPI's integrity endpoint returns 'No provenance available' for litellm 1.106.2; github.com/BerriAI/litellm returns 200 and github.com/Berri-AI/litellm returns 404. The .pth execution behaviour, the duplicate firing in a venv and the -S suppression were reproduced locally on CPython 3.14.6, as was setuptools shipping a legitimate executable .pth line. The claim that a provenance attestation would have verified correctly is this page's inference from the maintainers' description of the workflow change, not a published finding." />

## The timeline

All times UTC, October 21, 2026, from the maintainers' post-mortem.

| Time | What happened |
|---|---|
| 10:08:29 | Branch protection **rejects** an unauthorised change to the release workflow |
| 10:08:34 | Five seconds later, an **organisation-owner** credential disables branch protection and force-pushes it |
| 10:46:39 | The modified workflow starts a staging run against the lookalike repo `Berri-AI/litellm` |
| 11:08:53 | Production release pipeline begins |
| 11:11:18 | A **second** developer credential satisfies the production approval gate |
| 11:39:51–11:40:13 | **Seven poisoned wheels** for `litellm==1.107.0` land on PyPI |
| 11:46:56 | Poisoned image published; Docker tags `v1.107.0`, `latest`, `main-latest`, `main-stable` all point at it |
| 11:53:49 | A **third** credential deletes the release workflow run records |
| 12:09–12:24 | The unauthorised workflow is removed and the real one restored |
| by 13:23 | PyPI removes `litellm==1.107.0` |
| 13:51 | GHCR tags confirmed unavailable |
| 14:20 | Docker Hub tags removed or repointed at verified artifacts |

Two things to notice. The **approval gate worked exactly as designed** — it required a second human, and the attacker had a second human's token. And the Docker exposure window was longer than the PyPI one: **roughly two and a half hours**, during which `latest` and `main-stable` were both poisoned. Anyone whose deployment pulled a floating tag in that window got it, including people who believed `main-stable` meant something.

## Part 1 — The mechanism: code that runs before your import

### What a .pth file is, and what it can do

A `.pth` file in `site-packages` is normally boring: a list of directories to append to `sys.path`. That is how editable installs work. But the format has a second, far less known behaviour, and it is in the standard library documentation:

> A line in a `.pth` file that **starts with `import`** followed by a space or tab is **executed with `exec()`**.

The attacker's `cook.pth` is **12 bytes** long. Its entire content is `import cook`. That is enough. Python's `site` module, which is imported automatically during interpreter startup, finds the file, sees the `import` prefix, and executes it — which imports `cook.py`, a single-line base64-and-zlib blob containing the stealer.

Alongside it the wheel dropped **`sitecustomize.py`**, which needs no `.pth` at all: the `site` module tries to import a module by that exact name on every startup, by design, as an administrator hook. And there is a detail in the documentation that the attacker benefits from directly — if importing `sitecustomize` raises anything other than a matching `ImportError`, **the failure is silently swallowed**. A malfunctioning payload produces no traceback and no warning.

So: **nobody has to import litellm.** Any Python process in that environment runs both payloads. A cron job. A `--version` check. An unrelated script in the same container.

### Verify it yourself

This is documented behaviour, not a vulnerability, so you can confirm it in a throwaway virtualenv in thirty seconds. Reproduced on CPython 3.14.6:

<PromptCard title="Prove the .pth mechanism in a disposable venv">
{`python3 -m venv /tmp/pthdemo
SP=$(/tmp/pthdemo/bin/python -c "import site;print(site.getsitepackages()[0])")
printf 'import sys; sys.stderr.write("[pth ran: no import needed]\\n")\\n' > "$SP/zz_demo.pth"

# A command that imports nothing at all:
/tmp/pthdemo/bin/python -c "print('hello')"
#   [pth ran: no import needed]
#   hello

# -S skips the site module entirely, so nothing runs:
/tmp/pthdemo/bin/python -S -c "print('hello')"
#   hello

rm -rf /tmp/pthdemo`}
</PromptCard>

Two useful observations from running it. First, `-S` suppresses the whole mechanism — which matters below, because you want to audit for payloads **without executing them**. Second, the demo line printed **twice** per interpreter start: in a virtualenv the same site directory can be enumerated more than once, and the documentation is explicit that path entries are de-duplicated while **executable entry points are not**. A payload can fire more than once per process.

### The part that outlives the incident

If you only remember one durable fact from this page, make it this one: **`.pth` import lines are deprecated as of Python 3.15 and scheduled for removal in Python 3.20.** The replacement is an explicit `.start` entry-point file, and a `.pth` import line is **silently ignored** when a matching `.name.start` file exists.

That is a real, dated end to this specific attack primitive — and a reason to find the executable `.pth` lines in your environments now, because some of them are load-bearing and will break.

Two more documented behaviours worth knowing, both of which favour a quiet payload: since 3.15 an error on one `.pth` line **no longer aborts** processing of the remaining lines, and during the deprecation period the diagnostic for an executed import line is **only emitted under `-v`**.

### Why "wheels don't run install-time code" didn't save anyone

There is a widely repeated and genuinely correct piece of Python packaging lore: an **sdist** can execute arbitrary code at install time via `setup.py`, whereas a **wheel** is just a zip archive that the installer unpacks by copying files. Wheels are the safer format. Prefer wheels.

All of that is true. None of it helped, because **the payload never needed install-time execution.** The attacker added one line to `pyproject.toml` under the maturin build configuration —

```toml
[tool.maturin]
data = "cook"
```

— which instructs the build backend to package the `cook/` directory as wheel **data**, landing its contents at the root of `site-packages` on install. No hook, no script, no `setup.py`. Just three files copied into place, one of which Python executes on every start thereafter.

The lesson generalises past this incident: "does this package run code when I install it?" is the wrong question. The right one is **"what files does this package place in my environment, and does my runtime execute any of them on its own?"**

<Callout type="warning" items={["Treat a .pth file in a wheel as equivalent to an install-time script. It is strictly more powerful: an install script runs once, under your installer, where you might see it. A .pth line runs on every interpreter start, forever, under whatever process happens to start Python next."]} />

## Part 2 — The wheel and the source disagreed

Here is the finding that should change how you review a release. **The source distribution did not contain the payload.** Per SafeDep and JFrog, the `cook/` directory is absent from the sdist — but its `pyproject.toml` does carry the `data = "cook"` line, and that line appears in **no public commit** of `BerriAI/litellm`. It was the single visible trace of tampering, in a build configuration, in the artifact only.

Follow the consequences:

- Someone who diffed the `v1.107.0` git tag against `v1.106.2` saw nothing wrong — the tag is clean.
- Someone who read the GitHub release page saw nothing wrong.
- Someone who installed with `--no-binary :all:` could not have received the three payload files, because the sdist does not ship them.
- Someone who ran `pip install litellm` — the normal thing, which prefers wheels — got the stealer.

JFrog adds a forensic detail worth knowing: the ZIP entry timestamps of the payload files **match those of the legitimate files** in the wheel, which indicates the malware was included during a normal wheel build rather than bolted on by repacking the archive afterwards. The artifact is exactly what the poisoned build produced — which brings us to the uncomfortable part.

## Part 3 — Why the hardening didn't help

LiteLLM was not careless about release security — and the reason it was not careless is itself part of the story. **This was the second LiteLLM compromise of 2026.** In **March**, per JFrog, the project's build pipeline ran a malicious **unpinned Trivy 0.69.4** release, which exposed CI/CD and publishing credentials and led to backdoored versions **1.82.7 and 1.82.8**. JFrog describes the October payloads and infrastructure as different, with no apparent connection between the two campaigns.

The March hardening was the answer to that first incident. By the maintainers' own account they had since moved releases to **private repositories**, adopted **Trusted GitHub Publishers**, made Docker tags **immutable**, and enabled **Docker image signing**. That is a better posture than most projects of its size — and note that the first compromise began with an **unpinned dependency in a build pipeline**, which is the same lesson the control table below ends on.

Every one of those controls was satisfied by the October release. Here is why.

<Steps items={[
  {title: "The attacker didn't impersonate the publisher — they used it", body: "The malicious workflow ran inside the legitimate repository, through the legitimate release pipeline, with the legitimate publishing identity. What changed was which source it checked out. Trusted Publishing binds an artifact to the workflow and repository that produced it; it says nothing about what that workflow chose to build."},
  {title: "A lookalike org name did the rest", body: "The workflow was pointed at Berri-AI/litellm instead of BerriAI/litellm. One hyphen. In a workflow file diff, that is close to invisible — and the branch-protection check that would have forced a review was switched off by an org-owner credential five seconds after it fired."},
  {title: "Signing signed the malware", body: "Image signing proves an artifact came from the pipeline you expect, unmodified since. The artifact did. The signature is valid and the image is poisoned; those are not in tension, because a signature attests to origin, not to intent."},
  {title: "Immutable tags protected the wrong thing", body: "Immutable tags stop someone silently replacing what v1.107.0 points to. Here, the poisoned image was the first and only thing ever published under that tag — so immutability locked in the malware. Floating tags were worse: latest, main-latest and main-stable were all repointed at it."},
  {title: "'Verified' on the commits meant less than it looked", body: "The malicious commits were authored as Berri-AI <a protonmail address> and carried GitHub's Verified badge. That badge means GitHub signed the commit on behalf of an authenticated session — typically the web editor — not that the named author is who they appear to be. A Verified badge beside a plausible org name is not an identity check."},
  {title: "And the clean release still has no attestation to check", body: "Verified on 2026-10-22: PyPI's integrity endpoint returns 'No provenance available' for litellm 1.106.2. So even post-incident there is nothing on the current release for a consumer to verify against — which is the common case across PyPI, not a criticism unique to this project."}
]} />

The honest summary is that the mainstream software-supply-chain toolchain is built to answer *"did this artifact come from the project's real pipeline?"* It answered **yes**, correctly. Almost none of it is built to answer *"did the project's real pipeline build the project's real source?"* — and that is the question this attack turned on.

## Part 4 — The root cause: your gateway's logs are a credential store

Now the part specific to AI infrastructure, and the reason this incident belongs on this site rather than only in a packaging newsletter.

The attacker did not phish a maintainer or crack a password. According to the maintainers' post-mortem, the chain was:

<Steps items={[
  {title: "An internal LiteLLM deployment was reachable from the public internet", body: "The investigation found an 'unexpected, innocuously named user account' in that deployment. The team suspected access came through a recently patched vulnerability but had not confirmed the vector at the time of writing."},
  {title: "Coding-agent traffic flowed through it, carrying an OAuth token", body: "Quoting the post-mortem: Claude Code will embed a user's GitHub CLI OAuth token into a response body, and where response bodies are logged, those tokens may appear in LiteLLM logs. The gateway was doing exactly what gateways are configured to do — keeping request and response payloads for debugging, cost attribution and evals."},
  {title: "The logs yielded three developers' GitHub credentials", body: "One of them belonged to one of the organisation's two owners. That single fact is what converted 'read access to a log table' into 'disable branch protection and force-push the release workflow'."},
  {title: "The malware then went looking for the same class of secret", body: "The stealer, which names itself privcollect, harvests sixteen categories: browser passwords and cookies, SSH and GPG keys, AWS/Azure/GCP credentials, Kubernetes configs, CI secrets (GitLab Runner, Jenkins, Vault, Terraform), shell and database history, every process's environment via /proc/<pid>/environ, AI coding-tool tokens (Claude, Cursor, Copilot, Gemini and others) — and, where DATABASE_URL was set, a Prisma dump of the LiteLLM proxy database itself, containing the provider keys it was built to broker."}
]} />

That last item closes the loop, and it is the structural point. **An LLM gateway is, by construction, the single host in your estate that holds every provider key and sees every prompt and completion.** Add response-body logging and it also holds whatever secrets your agents happen to pass through it. Compromising one is worth more than compromising a developer laptop, and the malware's shopping list shows the attacker knew it.

<Callout type="key" items={["If you operate an AI gateway, the action item from this incident is not only 'pin litellm'. It is: find out whether your gateway persists request and response bodies, decide whether it should, and redact credential-shaped strings if it must. Agent traffic is not ordinary API traffic — coding agents carry tokens for GitHub, cloud providers and package registries in-band."]} />

### What the payload did on the host

For completeness, the second file. `sitecustomize.py` forked a detached daemon — `setsid()`, I/O to `/dev/null`, working directory `/`, so it survives the parent — which woke **every 3,600 seconds**, resolved its next command-and-control host from a dead drop (a `domain.txt` in a since-deleted GitHub account), fetched `/codepy` from it over plain HTTP and ran it through `exec()`. Exfiltration went to `www.litellm[.]dev/healthcheck`, also plain HTTP, with the body AES-256-CBC encrypted under an RSA-4096-wrapped key — a lookalike of the project's real `litellm.ai`, registered on **October 13, 2026**, eight days before the release. (Domains are defanged on this page; do not resolve them.)

StepSecurity notes the daemonisation path **fails silently on Windows**, since it relies on `fcntl` and `os.fork`. A Windows wheel was published, so treat the stealer as having run there and the hourly loader as the part that probably did not.

<Callout type="warning" items={["Uninstalling the package does not end the incident, for four independent reasons. The stolen credentials are already gone. The forked daemon is a separate process with no remaining relationship to the package. Every Python start on that host in the meantime ran the stealer afresh. And — as JFrog points out — pip is itself a Python process, so your remediation command runs the payload one more time on the way out. The maintainers' own guidance is to treat the host as compromised: kill the daemon, remove the files, rebuild, and rotate everything."]} />

## Part 5 — The same package, seven months earlier, and the attacker's own escalation

The March incident is worth a close look, because its two malicious versions show the `.pth` technique being *adopted* — in a single version bump.

Per Datadog Security Labs, who track it as the **TeamPCP** campaign:

- **`litellm` 1.82.7** carried its payload inside `litellm/proxy/proxy_server.py`. To fire, the victim had to install the package **and then actually use it**.
- **`litellm` 1.82.8** — the very next release — added **`litellm_init.pth`**. Same project, same campaign, days apart, and now the payload fired at **interpreter startup**, with no import of LiteLLM required.

That is the attacker discovering the primitive this entire page is about, and it is why the October payload opened with a 12-byte `.pth` rather than an injected module. If you are triaging your own dependencies, the escalation from "module-level code" to "`.pth` dropper" is the pattern to expect, not a one-off trick.

The March payload is also recognisably the same *craft* as October's: AES-256 with an RSA-4096-wrapped key, exfiltration to a **lookalike domain built from the project's own name** (`models.litellm[.]cloud` then, `litellm[.]dev` in October), credential harvesting across environment variables, SSH keys, cloud credentials and Kubernetes — plus, in March, systemd persistence via `~/.config/sysmon/sysmon.py`, command polling at `checkmarx[.]zone/raw`, and the ability to create Kubernetes pods to spread across a cluster. The March campaign chained outward from **Trivy on March 19**, through npm (CanisterWorm) and Checkmarx tooling, reaching PyPI on **March 24** (`litellm`) and **March 27** (`telnyx`).

<Callout type="note" items={["Sources disagree on whether the two LiteLLM incidents are related, and this page does not resolve it. JFrog states the October payloads and infrastructure are different, with no apparent connection to the March campaign. Against that: both used a .pth dropper, both used AES-256 under an RSA-4096-wrapped key, and both exfiltrated to a lookalike domain derived from the project's name — while Datadog's campaign label (TeamPCP) and the October stealer's self-chosen name (privcollect, marker PRIVCOLLECT_ACTIVE) invite a comparison nobody has published a verdict on. Attribution belongs to the researchers; treat the resemblance as unexplained, not as a finding."]} />

### The one control that would have stopped both

PyPI's own incident report on March is where the most useful number lives: **LiteLLM is installed roughly 1,700 times per minute**, and **119,000 downloads** happened during the March exposure window. PyPI quarantined the March release **2 hours 32 minutes** after upload; in October the wheels were gone in about **1 hour 43 minutes**. The response is getting faster — and it will never be fast enough, because at that install rate the first ten minutes are already a mass-compromise event.

Which is why PyPI's headline recommendation to consumers is not "read the code". It is a **dependency cooldown**: refuse to resolve any release younger than N days. Both LiteLLM compromises were detected and pulled within hours. **A three-day cooldown would have made both of them a non-event for anyone who had one.**

This is the most under-adopted high-value control in the list, and it is one line of config.

<PromptCard title="Dependency cooldowns in the three tools that support them">
{`# --- uv: pyproject.toml (or uv.toml at the root) ---
# exclude-newer accepts an RFC 3339 timestamp, a friendly duration,
# or an ISO 8601 duration. Relative durations landed in uv 0.9.17.
[tool.uv]
exclude-newer = "7 days"     # equivalently: "P7D"

# --- Renovate: renovate.json ---
# The oldest implementation of the idea (formerly stabilityDays).
{
  "minimumReleaseAge": "7 days"
}

# --- Dependabot: .github/dependabot.yml ---
# Note: Dependabot already applies a DEFAULT 3-day cooldown to version
# updates even with no cooldown block at all -- and never to security
# updates. Configure it only to lengthen or target the window.
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule: { interval: "weekly" }
    cooldown:
      default-days: 7
      semver-patch-days: 3`}
</PromptCard>

The tradeoff is explicit and small: you receive non-security updates up to a week late. In exchange, the window in which a poisoned release can reach you shrinks from "however long until someone notices" to "zero, provided someone notices within the cooldown" — and in both LiteLLM cases, someone noticed within hours.

<Callout type="tip" items={["A cooldown must not delay security patches, or you have traded one risk for another. Dependabot gets this right by construction: cooldown is a version-update option only and is documented as not applying to security updates. If you implement a cooldown yourself — via uv's exclude-newer in CI, say — keep a documented override path for a release that fixes a known advisory.", "Check what you already have before adding config. Dependabot's 3-day default means many repositories are partly covered without anyone having chosen it, while a Dockerfile pulling a floating tag and a CI step running pip install -U are not covered by any of this."]} />

## Triage: is this you?

Run these in order. The first question is cheap and answers it for most people.

<PromptCard title="1. Did 1.107.0 ever get resolved anywhere?">
{`# Lockfiles, requirement files, constraints — anywhere a resolver wrote a version down
grep -rniE "litellm[=<>~! ]*1\\.107\\.0([^0-9rc]|$)" . \\
  --include="requirements*.txt" --include="*.lock" --include="*.txt" \\
  --include="poetry.lock" --include="Pipfile.lock" --include="uv.lock" 2>/dev/null

# Installed right now, in this environment
pip list 2>/dev/null | grep -i litellm

# Container images you are actually running (compare against the poisoned digest)
docker images --digests | grep -i litellm`}
</PromptCard>

<PromptCard title="2. Look for the three dropped files and the runtime markers">
{`# The payload files, at the ROOT of site-packages (not inside a litellm/ directory)
find / -name "cook.pth" -path "*site-packages*" 2>/dev/null
find / -name "cook.py" -path "*site-packages*" 2>/dev/null
find / -name "sitecustomize.py" -path "*site-packages*" 2>/dev/null

# Known SHA-256 of the three files
#   cook.pth          7f191632e7320705d154b85204f1ae546b543acbd7e8861229b76f5042b92bdb
#   cook.py           9dd0a3926f96a37eb86cf1ee2310d9be93139cc4ebef3ef9e2efe9531390be25
#   sitecustomize.py  34bef04fe88ac9d0aae0475630b1738681d15b94f233ac8aa46eacf5968305fa

# Execution markers
ls -la /tmp/.pc_once_72129118c59f5636c0bb /tmp/remote_code_loader.lock 2>/dev/null
ls -d /tmp/.pc_sq_* /tmp/.pc_e_* 2>/dev/null

# The live hourly loader: whatever process holds the lock (parent PID 1, cwd /)
lsof /tmp/remote_code_loader.lock 2>/dev/null`}
</PromptCard>

<PromptCard title="3. Network-side, if you keep egress or DNS logs">
{`# Exfiltration, dead drop, and the fetched payload path
#   litellm.dev                                    (NOT litellm.ai — the lookalike)
#   www.litellm.dev/healthcheck                    plain HTTP POST, encrypted body
#   raw.githubusercontent.com/letters9813/...      dead drop for the next C2 host
#   any request path ending in /codepy             the fetched code

grep -hiE "litellm\\.dev|letters9813|/codepy" /var/log/**/*.log 2>/dev/null | head`}
</PromptCard>

If any of that hits: kill the daemon, delete `cook.pth`, `cook.py`, `sitecustomize.py` and their `__pycache__` entries, pin `litellm==1.106.2` (or the `v1.106.2` image **by digest**), then rebuild the host and **rotate everything** — cloud IAM credentials, provider API keys, database passwords, SSH keys, CI secrets, agent tool tokens — and audit CloudTrail or the equivalent for use of those credentials from unfamiliar sources. The maintainers state that customers on the private enterprise release were not affected.

## The audit worth keeping: which .pth files execute code?

Independent of this incident, you should know what executes at Python startup on machines you care about. Note the `-S` — the audit must not trigger the thing it is hunting for.

<PromptCard title="List every executable .pth line in an environment (run with -S)">
{`cat > /tmp/audit_pth.py <<'EOF'
import glob, os, site, sys
dirs = list(site.getsitepackages())
try:
    if site.ENABLE_USER_SITE:
        dirs.append(site.getusersitepackages())
except Exception:
    pass
seen, hits = set(), 0
for d in dirs:
    if d in seen or not os.path.isdir(d):
        continue
    seen.add(d)
    for p in sorted(glob.glob(os.path.join(d, "*.pth"))):
        for n, line in enumerate(open(p, encoding="utf-8", errors="replace"), 1):
            s = line.strip()
            if s[:6] == "import" and s[6:7] in (" ", "\\t"):
                hits += 1
                print(f"{p}:{n}: {s}")
print(f"\\n{hits} executable line(s) across {len(seen)} site dir(s): {sys.executable}")
EOF

python3 -S /tmp/audit_pth.py`}
</PromptCard>

**Read the output correctly.** A hit is not a finding. On a fresh virtualenv with nothing but `setuptools`, this reports **one** executable line, and it is legitimate:

```
.../site-packages/distutils-precedence.pth:1: import os; var = 'SETUPTOOLS_USE_DISTUTILS'; ...
```

That is `setuptools` installing its distutils shim, and it is the most common legitimate use of the mechanism. Editable installs (`__editable__*.pth`) are another. The signal you want is **an executable line you cannot attribute to a package you deliberately installed** — and a file at the root of `site-packages` whose name matches no distribution you can name is the strongest version of that signal. On the compromised hosts, the name was `cook`.

## What would actually have stopped it

This is the table to take to your own setup. "Yes" means the control blocks this specific attack, not that it is sufficient in general.

| Control | Stops this? | Why |
|---|---|---|
| **Dependency cooldown** (3-7 days) | **Yes — and March too** | Both releases were pulled within hours. The only control in this table that also covers the next one. |
| Exact version pin (`litellm==1.106.2`) | **Yes** | 1.107.0 never enters resolution. The single highest-value control here. |
| Hash pinning (`pip install --require-hashes`) | **Yes** | Same reason, plus it catches a re-upload under an existing version number. |
| Lockfile committed and respected in CI | **Yes** | The 100-minute window only reaches resolvers allowed to pick a new version. |
| `pip install -U` / unpinned installs in that window | **No** | This is precisely who was hit. |
| Docker `latest` / `main-latest` / `main-stable` | **No** | All three were repointed at the poisoned digest for ~2.5 hours. |
| Docker pin **by digest** | **Yes** | A digest cannot be repointed. |
| Trusted Publishing / PyPI attestations | **No** *(inference)* | The real workflow in the real repo published it; provenance would have named them correctly. |
| Docker image signing | **No** | The signature is valid; it attests origin, not intent. |
| Immutable Docker tags | **No** | The poisoned image was the first artifact ever published under that tag. |
| "Avoid sdists, prefer wheels" | **No** | Inverted here: the wheels were poisoned and the sdist did not ship the payload. |
| "Block packages with install-time scripts" | **No** | There was no install hook. The payload was a data file. |
| Build from source (`--no-binary :all:`) | **Yes**, here | Only because the sdist omitted the payload files. Not a general control. |
| Strict egress allowlist on dev/CI hosts | **Partly** | Exfiltration to a brand-new domain over plain HTTP is exactly what an allowlist denies. |
| Not logging response bodies in your gateway | **Initial access** | Would have removed the credentials the attacker used to start. |
| Short-lived, narrowly scoped GitHub tokens | **Initial access** | A long-lived org-owner OAuth token in a log is the whole pivot. |

The cheap and boring controls win. **Set a cooldown, pin exactly, lock the pin, pull images by digest, and do not let a gateway keep what it does not need.** Note how little of this involves inspecting code: the three controls at the top of the table work precisely because they do not require anyone to notice anything.

<Callout type="takeaways" items={["A .pth file is a code-execution primitive, not a path list. Python's site module execs any line beginning with import, at every interpreter start, with no import of the package required. Treat it as strictly more dangerous than an install-time script.", "Prefer-wheels advice is about install-time execution and does not cover runtime-startup execution. One line in a build config — data = \"cook\" — put three files at the root of site-packages with no hook at all.", "The source and the artifact can disagree. The git tag was clean and the sdist did not ship the payload; only the wheels carried it, so diffing the repository found nothing. The one visible trace was a build-config line present in no public commit.", "Supply-chain signing answers 'did this come from the real pipeline?' — and here the answer was legitimately yes. It does not answer 'did the real pipeline build the real source?', which is where a one-hyphen lookalike org slipped through.", "An AI gateway is the highest-value host in an AI stack: every provider key, every prompt, and — if you log response bodies — whatever tokens your coding agents carry in-band. Classify its logs as secrets or stop keeping them.", "Executable .pth import lines are deprecated in Python 3.15 and removed in 3.20, replaced by explicit .start files. Audit yours now, with python -S, and expect setuptools to be a legitimate hit.", "This was LiteLLM's second compromise of 2026, and the first one started with an unpinned dependency in the build pipeline. Pinning is not only how you protect yourself from a poisoned release — it is also how a project avoids publishing one.", "The best single control is a dependency cooldown, because it is the only one that does not depend on anyone noticing. Both LiteLLM releases were pulled within hours; a 3-day cooldown would have made both a non-event. Dependabot already applies 3 days by default, and never to security updates."]} />

<Flashcards title="Nine terms from this incident" cards={[
  {front: ".pth file", back: "A file in site-packages, normally a list of directories appended to sys.path. A line beginning with 'import' plus whitespace is instead executed with exec() by the site module at every interpreter start. Deprecated in Python 3.15, removal planned for 3.20."},
  {front: "sitecustomize.py", back: "A module name the site module attempts to import on every startup, by design, as an administrator hook. Needs no .pth file to fire, and any exception during its import is silently swallowed."},
  {front: "python -S", back: "Suppresses automatic import of the site module: no .pth processing, no sitecustomize, no usercustomize. Use it when auditing an environment you suspect, so the audit does not execute the payload."},
  {front: "Wheel data directory", back: "Files a wheel declares as data are copied to the environment root — for purelib, that is site-packages itself. Here, one line (data = \"cook\") under the maturin build config shipped cook.pth, cook.py and sitecustomize.py with no install-time code at all."},
  {front: "privcollect", back: "The stealer's own name for itself. Sixteen categories: browser passwords and cookies, SSH and GPG keys, AWS/Azure/GCP credentials, Kubernetes configs, CI secrets, shell and DB history, every process environment via /proc, AI coding-tool tokens, and a Prisma dump of the LiteLLM proxy database."},
  {front: "Lookalike repository", back: "Berri-AI/litellm, one hyphen away from BerriAI/litellm. The release workflow in the genuine repo was force-pushed to build from it, so the publishing identity, signature and provenance all remained genuine while the source did not."},
  {front: "Trusted Publishing", back: "Binds a published artifact to the specific workflow and repository that produced it, replacing long-lived API tokens. It was in place and it was satisfied: the real workflow in the real repo published the malware."},
  {front: "Immutable tags", back: "Prevents a published container tag from being repointed later. Useless when the first artifact under the tag is already malicious — and irrelevant to the floating tags (latest, main-stable) that were repointed at it."},
  {front: "Remote code loader", back: "The sitecustomize payload: a detached daemon (setsid, cwd /, I/O to /dev/null) waking hourly, resolving its next C2 host from a GitHub dead drop, fetching /codepy over plain HTTP and running it through exec(). Guarded by /tmp/remote_code_loader.lock."}
]} />

<Quiz title="Check yourself" questions={[
  {q: "A host installed litellm 1.107.0 into a virtualenv at 11:50 UTC, and nothing on that host ever imported litellm. What is the exposure?", options: ["None — the payload only runs on import", "Full — cook.pth is executed by Python's site module at every interpreter start, so any Python process in that environment ran the stealer", "Only if the LiteLLM proxy was started", "Only on Windows"], answer: 1, explain: "This is the central mechanism. A 12-byte .pth file containing 'import cook' is exec'd during interpreter startup by the site module. Any Python process in that environment — a cron job, a --version check, an unrelated script — ran both payloads. The maintainers' guidance is to treat the host as fully compromised."},
  {q: "Your policy is 'prefer wheels over sdists, because sdists can run setup.py at install time.' How did that policy fare here?", options: ["It prevented the compromise", "It was factually correct but inverted the outcome: only the wheels carried the payload, which the sdist did not ship", "It is wrong — wheels do run install-time code", "It made no difference either way"], answer: 1, explain: "The lore is accurate: wheels are unpacked by copying files, with no install-time execution. The payload simply did not need any. One line in the maturin build config shipped three files into site-packages as wheel data — and the sdist did not contain the cook/ directory at all, so a source build could not have installed the payload."},
  {q: "LiteLLM had Trusted Publishing, Docker image signing and immutable tags in place since March. Why did none of them block this release?", options: ["They were misconfigured", "The attacker stole the PyPI API token", "The attacker used the genuine pipeline and changed only which source it built — provenance and signatures correctly attested a genuine origin for a poisoned artifact", "Signing only covers sdists"], answer: 2, explain: "The malicious workflow ran in the real repository with the real publishing identity, checking out the lookalike Berri-AI/litellm. These controls answer 'did this come from the project's real pipeline?' — and the honest answer was yes. They are not designed to answer 'did the real pipeline build the real source?'"},
  {q: "Per the maintainers' post-mortem, how did the attacker first obtain developers' GitHub credentials?", options: ["A phishing campaign against maintainers", "A leaked .env file in a public commit", "From the logs of an internal LiteLLM deployment exposed to the internet, where a coding agent's GitHub CLI OAuth token appeared in logged response bodies", "By cracking 2FA"], answer: 2, explain: "The post-mortem states that Claude Code embeds a user's GitHub CLI OAuth token in a response body, and that where response bodies are logged those tokens may appear in LiteLLM logs. The attacker reached that publicly exposed internal deployment and read three developers' credentials — one an org owner — out of its logs."},
  {q: "Which pair of controls would have blocked this attack most cheaply?", options: ["PyPI attestations plus image signing", "An exact version pin in a committed lockfile, plus pulling container images by digest", "Static analysis of the package source", "Blocking packages that declare install-time scripts"], answer: 1, explain: "Both signing-based controls were satisfied by the poisoned release, and there were no install-time scripts to block — while source analysis would have found nothing, since the public source was clean. The boring controls win: a pinned lockfile means 1.107.0 never enters resolution, and a digest cannot be repointed the way latest, main-latest and main-stable all were."},
  {q: "Both LiteLLM compromises were detected and pulled within hours — 2h32m in March, about 1h43m in October. Which consumer-side control turns that into near-total protection?", options: ["Reading the diff of every dependency update", "A dependency cooldown: refusing to resolve any release younger than 3-7 days", "Running a vulnerability scanner in CI", "Subscribing to a security mailing list"], answer: 1, explain: "This is PyPI's own headline recommendation to consumers, and the only control in the table that covers the next incident as well as these two. At roughly 1,700 installs per minute, detection will never outrun exposure — but a three-day cooldown makes an incident that is contained in hours irrelevant to you. uv's exclude-newer, Renovate's minimumReleaseAge and Dependabot's cooldown all implement it; Dependabot applies a 3-day default even unconfigured, and never to security updates."},
  {q: "In March 2026, litellm 1.82.7 put its payload in proxy_server.py and 1.82.8 shipped litellm_init.pth instead. What does that change tell you?", options: ["The attacker lost access and had to start over", "The attacker escalated from a payload needing the victim to use the package, to one firing at every interpreter start", "1.82.8 was a failed attempt", "Nothing — the two are equivalent"], answer: 1, explain: "It is the same campaign discovering the primitive. A module-level payload only runs if someone imports and uses LiteLLM; a .pth runs on every Python start in the environment regardless. October's 12-byte cook.pth started where March ended, which is why 'module-level code' to '.pth dropper' is a progression to expect rather than a one-off."},
  {q: "You run the .pth audit on a developer machine and it reports one executable line, in distutils-precedence.pth. What should you conclude?", options: ["The machine is compromised", "Nothing is wrong — that is setuptools' distutils shim, the most common legitimate use of the mechanism", "The file must be deleted immediately", "Python needs reinstalling"], answer: 1, explain: "A hit is not a finding. setuptools ships distutils-precedence.pth with a real executable import line, and editable installs add __editable__*.pth. The signal is an executable line you cannot attribute to a package you chose to install — such as a file named cook that matches no distribution on the system."}
]} />

## Sources & further reading

- **LiteLLM** — *Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised*: https://docs.litellm.ai/blog/security-incident-oct-21-2026 — the maintainers' post-mortem, and the primary source for the timeline, the credential-theft chain, the lookalike repository, the prior hardening and the remediation steps.
- **Python documentation** — `site` — *Site-specific configuration hook*: https://docs.python.org/3/library/site.html — the authoritative description of `.pth` processing, the `import`-line rule, the 3.15 deprecation and 3.20 removal, `.start` files, `sitecustomize`/`usercustomize`, and the `-S` flag.
- **StepSecurity** — *litellm 1.107.0 Compromised on PyPI: Backdoored Wheels Drop a Credential Stealer and an Hourly Remote Code Loader*: https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer — file sizes and hashes, the stealer's sixteen categories, the loader's daemonisation and dead drop, the exfiltration headers, and the IOC list.
- **SafeDep** — *Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor*: https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/ — the finding that the sdist omits the `cook/` folder and that no public commit contains `data = "cook"`. This was the article that reached the Hacker News front page.
- **JFrog Security Research** — *LiteLLM Hijacked Again: Malicious 1.107.0 Wheels Steal Credentials*: https://research.jfrog.com/post/litellm-hijacked-again/ — the March 2026 first compromise (unpinned Trivy 0.69.4 in the build pipeline, backdoored 1.82.7/1.82.8, XRAY-955589), the matching ZIP timestamps that point to build-time injection, and the observation that even a `pip` command triggers the payload.
- **Wiz** — *LiteLLM Compromised, Steals Credentials*: https://www.wiz.io/blog/litellm-compromised-steals-credentials — an independent account of the exposure window, affected distributions and container tags.
- **The Hacker News** — *LiteLLM Suspects GitHub Token Leak in AI Gateway Logs Behind Malicious Package Release*: https://thehackernews.com/2026/10/litellm-suspects-github-token-leak-in.html — independent reporting of the gateway-log root cause.
- **Hacker News discussion** — *Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor*: https://news.ycombinator.com/item?id=50181114 — the front-page thread, 519 points and 170 comments as of 2026-10-22.
- **Datadog Security Labs** — *LiteLLM compromised on PyPI: the TeamPCP supply-chain campaign*: https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/ — the March 2026 incident, including `litellm_init.pth` in 1.82.8 versus the module-level payload in 1.82.7, the exfiltration domain and the systemd persistence.
- **PyPI blog** — *Incident report: LiteLLM and Telnyx supply-chain attack* (2026-04-02): https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/ — the ~1,700 installs/minute and 119,000-download figures, the quarantine timings, and PyPI's own recommendation of dependency cooldowns.
- **LiteLLM** — *Security Update: Suspected Supply Chain Incident* (March 2026): https://docs.litellm.ai/blog/security-update-march-2026 — the maintainers' first incident post.
- **uv** — `exclude-newer` settings reference: https://docs.astral.sh/uv/reference/settings/ — accepts RFC 3339 timestamps, friendly durations and ISO 8601 durations such as `P7D`.
- **GitHub Docs** — Dependabot options reference, `cooldown`: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — the sub-keys, the 3-day default applied even when unconfigured, and the documented fact that cooldown does not apply to security updates.
- **Renovate** — `minimumReleaseAge` configuration option: https://docs.renovatebot.com/configuration-options/#minimumreleaseage — the longest-standing implementation of the idea.
- **PyPI** — `litellm` project page: https://pypi.org/project/litellm/ — 1.107.0 is absent; 1.106.2 is current. PyPI's provenance API for a given file: https://docs.pypi.org/api/integrity/
- **BerriAI/litellm** (the genuine repository): https://github.com/BerriAI/litellm

## Next

- [Reviewing Third-Party Code](/docs/security/reviewing-third-party-code) — the general review discipline for dependencies, after this incident showed that reading the repo is not the same as reading the artifact
- [AI Gateways: LiteLLM, OpenRouter, Portkey](/docs/models/ai-gateways-litellm-openrouter-portkey) — what a gateway is for, and the logging and key-handling decisions this page argues you should revisit
- [GemStuffer: How OpenAI Agents Attacked RubyGems](/docs/security/rubygems-gemstuffer-rogue-agents) — the other 2026 registry compromise, where the registry was the delivery mechanism rather than the target
