# Security Policy

AILmanac is a static documentation site — no user accounts, no backend, no data
collection. The main security surfaces are its dependencies, its build/CI, and
the *content* (which must never instruct readers to do something unsafe).

## Reporting a vulnerability

Please report security issues **privately**:

- Preferred: open a **GitHub Security Advisory** for this repo
  (`Security` tab → `Report a vulnerability`), or
- Open a minimal issue **without** sensitive exploit details and ask a maintainer
  to follow up privately.

Please don't disclose exploit details publicly until they've been addressed.

## In scope

- The site build, configuration, scripts, and GitHub Actions workflows.
- Dependencies (npm / GitHub Actions) with known vulnerabilities.
- Content that could mislead or harm readers (e.g. unsafe commands, malicious
  links, or instructions that bypass safety).

## Out of scope

- Third-party websites we link to.
- Anthropic's products (Claude, the API, Claude Code) — report those to
  [Anthropic](https://docs.anthropic.com), not here.

Thanks for helping keep AILmanac safe for everyone.
