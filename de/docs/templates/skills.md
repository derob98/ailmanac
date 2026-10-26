# Skill-Packs & SKILL.md-Vorlagen

> Source: https://derob98.github.io/ailmanac/de/docs/templates/skills · AILmanac (CC BY 4.0) · last verified 2026-07-20

Einsatzbereite Agent Skills nach Nutzertyp, plus eine Anleitung zum Schreiben eigener Skills.

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-07-20" source="https://code.claude.com/docs/en/skills">
Der Aufbau von Skill-Dateien und wo Skills eingesetzt werden können (Claude Code, Claude.ai, Cowork, Cloud-Sitzungen) entwickeln sich weiter — überprüfe die Details in der offiziellen Skills-Dokumentation. Eigene Commands sind jetzt in Skills aufgegangen: Dateien unter `.claude/commands/` funktionieren weiterhin, empfohlen sind aber Skills.
</VerifyNote>

Ein **Skill** verleiht Claude fokussiertes Fachwissen, das es *bei Bedarf* lädt, wenn
deine Anfrage passt — so musst du deine Anforderungen nicht jedes Mal neu erklären.
AILmanac liefert eine Reihe **einsatzbereiter Skill-Packs**, eines pro Nutzertyp.
Lerne das Konzept ausführlich auf der [Skills](/docs/claude-code/skills)-Seite kennen.

## Fertige Packs

Sie liegen im Ordner
[`plugins/ailmanac/skills`](https://github.com/derob98/ailmanac/tree/main/plugins/ailmanac/skills) des Repos:

| Pack | Für | Was es tut |
|---|---|---|
| `ailmanac` | Alle, die Fragen zu Claude oder anderen KI-Tools haben | Sucht die Antwort in diesem Leitfaden und zitiert die Seite mit ihrem Prüfdatum |
| `claude-md-check` | Claude-Code-Nutzer | Prüft deine `CLAUDE.md` gegen dein Repo und dagegen, wie Memory-Dateien geladen werden |
| `writing-content-pro` | Autoren, Marketer, Creator | Briefing → Entwurf in Durchgängen → deine Stimme treffen → wiederverwerten |
| `developer-workflow` | Entwickler | Kontext-zuerst-Coding, Reviews, Tests, klare Commits |
| `research-analyst` | Forscher, Analysten | Quellengestützte Synthese mit Zitierdisziplin |
| `data-analyst` | Daten- & Tabellennutzer | SQL/Formeln + verständliche Auswertungen + statistische Plausibilitätsprüfungen |
| `business-marketing` | Gründer, KMU-Inhaber | Positionierung, Texte, Kundenkommunikation, leichtgewichtige Planung |
| `student-learning` | Schüler & Lernende | Sokratisches Tutoring + Teach-back (lernen statt nur kopieren) |
| `everyday-productivity` | Alle | E-Mails, Zusammenfassungen, Planung, Entscheidungen |

Jedes verankert die Hausregeln: **Kontext geben, iterieren und das Wichtige überprüfen.**

## Installieren (Claude Code)

Alle auf einmal, als Plugin:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

Oder kopiere ein einzelnes Pack aus einem Klon des Repos:

```bash
# personal — available in all your projects
mkdir -p ~/.claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro ~/.claude/skills/

# or per-project — shareable with your team via the repo
mkdir -p .claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro .claude/skills/
```

Claude aktiviert den Skill automatisch, wenn deine Anfrage zu seiner
`description` passt. In Claude.ai / Cowork erstellst du einen Skill und fügst die
`SKILL.md` des Packs ein (die Verfügbarkeit variiert je nach Plan).

## Eigenen schreiben — die minimale Vorlage

Ein Skill ist ein Ordner mit einer `SKILL.md`: YAML-Frontmatter + Anweisungen. Die
`description` ist der **Auslöser** — formuliere sie als „Use when…“. Nur die `description`
ist Pflicht; der Command-Name ergibt sich aus dem Ordnernamen.

```markdown
---
description: Use when the user is doing X — be specific about the trigger so Claude knows when to load this and when not to.
---

# My Skill

Short statement of the role/goal.

## Workflow
1. Step one…
2. Step two…

## Rules
- The non-negotiables (accuracy, privacy, output format).

## Default output
What a good response looks like.
```

### Gültigkeits-Checkliste

- [ ] Der Ordner ist kebab-case — daraus wird der `/command-name`.
- [ ] `description` sagt, **wann er einzusetzen ist** (der Auslöser), nicht nur, was er ist. Nenne den wichtigsten Anwendungsfall zuerst (die Kombination aus `description` + `when_to_use` wird in der Skill-Liste bei 1.536 Zeichen abgeschnitten).
- [ ] Anweisungen sind spezifisch und abgegrenzt — eine klare Aufgabe.
- [ ] Keine Secrets, Zugangsdaten oder personen-/kundenbezogenen Daten.
- [ ] Legt fest, wie mit Unsicherheit umzugehen ist (nichts erfinden; überprüfen).

## Verwandtes

- [Skills: Fachwissen bei Bedarf](/docs/claude-code/skills) — das vollständige Konzept
- [Eigene Slash-Commands](/docs/claude-code/slash-commands) — diese löst du bei Bedarf aus
- [Subagents](/docs/claude-code/subagents) — ganze Arbeitspakete delegieren


## Weiter

- [MCP-Konfiguration & Server-Gerüste](/docs/templates/mcp-config)
