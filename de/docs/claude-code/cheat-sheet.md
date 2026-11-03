# Claude-Code-Spickzettel

> Source: https://derob98.github.io/ailmanac/de/docs/claude-code/cheat-sheet · AILmanac (CC BY 4.0) · last verified 2026-10-13

Eine druckbare Seite mit Claude-Code-Flags, Befehlen, Tastenkürzeln, Berechtigungsmodi und Dateiorten — jede Zeile am 13.10.2026 gegen die offizielle Dokumentation geprüft.

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-10-13" source="https://code.claude.com/docs/en/cli-reference">
Jede Zeile des Spickzettels wurde am 13.10.2026 gegen die offizielle Claude-Code-Dokumentation geprüft, die am Ende dieser Seite unter „Quellen“ aufgeführt ist; was an diesem Tag nicht bestätigt werden konnte, wurde weggelassen. Flags, Befehle und Tastenkürzel ändern sich zwischen Releases, Kürzel unterscheiden sich außerdem je nach Plattform und Terminal — wenn Spickzettel und offizielle Dokumentation voneinander abweichen, gilt die offizielle Dokumentation.
</VerifyNote>

Eine Seite mit den Claude-Code-Flags, Befehlen, Tastenkürzeln und Dateiorten, nach denen du an den meisten Tagen greifst. Drucke sie aus, hänge sie neben dein Terminal oder teile die dunkle Version. Alles auf dem Bild steht unten noch einmal als Text, sodass du es durchsuchen, daraus kopieren und mit einem Screenreader lesen kannst.

<Callout type="objectives" items={["Das gesuchte Flag, den Befehl oder das Tastenkürzel finden, ohne die Referenz zu öffnen", "Sehen, was jeder Berechtigungsmodus ohne Nachfrage ausführt und was der Plan-Modus blockiert und was nicht", "Wissen, in welche Datei eine Einstellung, eine Anweisung oder ein Hook gehört"]} />

![Claude-Code-Spickzettel: eine A4-Querformat-Seite in drei Spalten zu Sitzungen starten und fortsetzen, Headless-Skripting, Einstellungsdateien, Befehlen in der Sitzung, Tastenkürzeln, Checkpoints, Berechtigungsmodi, Plan-Modus, Hooks und Memory-Dateien. Der gleiche Inhalt folgt als Text.](/cheatsheets/claude-code-cheat-sheet.png)

## Download

- [PDF herunterladen](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet.pdf) — A4 quer, eine Seite, markierbarer Text. In A4 mit 100 % drucken, auf US Letter mit „An Seite anpassen“.
- [PNG herunterladen, hell](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet.png) — 2400 px breit.
- [PNG herunterladen, dunkel](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet-dark.png) — 2400 px breit, für Bildschirme und Screenshots.
- [HTML-Quelle öffnen](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet.html) — eigenständig; hänge `?theme=dark` an die Adresse an, um die dunkle Version zu sehen.

Der Spickzettel steht unter [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): teilen, drucken und anpassen ist erlaubt, mit Namensnennung von AILmanac.

## Der Spickzettel als Text

### Sitzungen starten und fortsetzen

| Befehl oder Flag | Was es tut |
| --- | --- |
| `claude` | Eine interaktive Sitzung starten |
| `claude "query"` | Mit einem Start-Prompt beginnen |
| `claude -c` | Die jüngste Unterhaltung in diesem Verzeichnis fortsetzen |
| `claude -r "<session>"` | Per ID oder Name fortsetzen oder eine auswählen |
| `claude -n "<name>"` | Die Sitzung für eine spätere Wiederaufnahme benennen |
| `--fork-session` | Mit `-c` oder `-r`: neue Sitzungs-ID |
| `claude -w <name>` | In einem isolierten Git-Worktree arbeiten |
| `--model <alias\|name>` | Das Modell festlegen, etwa `sonnet` |
| `--permission-mode <mode>` | In einem bestimmten Berechtigungsmodus starten |
| `claude --bg "<task>"` | Eine Hintergrundsitzung starten; mit `claude agents` überwachen |

Weiterführend: [Die claude-CLI: Flags, die das Ergebnis verändern](/docs/claude-code/cli-flags) und [Git-Worktrees & parallele Arbeitsstränge](/docs/claude-code/worktrees).

### Headless und Skripting

| Befehl oder Flag | Was es tut |
| --- | --- |
| `claude -p "query"` | Einmal ausführen, die Antwort ausgeben, beenden |
| `cat file \| claude -p "…"` | Inhalt über stdin hineinleiten (Limit 10 MB) |
| `--output-format <format>` | `text` (Standard), `json`, `stream-json` |
| `--json-schema '<schema>'` | JSON, gegen dein Schema validiert |
| `--allowedTools "<rule>" …` | Tools, die ohne Nachfrage laufen, etwa `"Bash(git diff *)"` |
| `--max-turns <n>` | Die Zahl der agentischen Züge begrenzen |
| `--max-budget-usd <n>` | Bei geschätzten Ausgaben stoppen |
| `--bare` | Hooks, Skills, Plugins, MCP-Server, Auto-Memory und CLAUDE.md überspringen |
| `claude -c -p "query"` | Die letzte Unterhaltung fortsetzen |

Die JSON-Ausgabe enthält `result`, `session_id` und `total_cost_usd`. Exit-Code 0 bedeutet Erfolg.

Weiterführend: [Headless-Modus & das Agent SDK](/docs/claude-code/headless-and-agent-sdk).

### Einstellungsdateien

Aufgelistet mit der höchsten Priorität zuerst: Wenn zwei davon denselben Schlüssel setzen, gewinnt die weiter oben stehende.

| Datei oder Flag | Geltungsbereich |
| --- | --- |
| `managed-settings.json` | Verwaltet: von deiner Organisation gesetzt |
| `--settings <file-or-json>` | Kommandozeile: nur diese Sitzung |
| `.claude/settings.local.json` | Projekt lokal: nur du, aus Git herausgehalten |
| `.claude/settings.json` | Geteiltes Projekt: für das Team einchecken |
| `~/.claude/settings.json` | Benutzer: du, in jedem Projekt |

Listenschlüssel wie `permissions.allow` werden über Dateien hinweg zusammengeführt. `/status` zeigt, welche Dateien geladen wurden; `claude doctor` meldet ungültige Einträge.

| Datei | Was sie enthält |
| --- | --- |
| `.mcp.json` | MCP-Server auf Projektebene; mit `/mcp` verwalten |

Weiterführend: [settings.json: Das Konfigurationssystem](/docs/claude-code/settings) und [MCP-Server in Claude Code](/docs/claude-code/mcp).

### Befehle in der Sitzung

| Befehl | Was er tut |
| --- | --- |
| `/init` | Eine erste CLAUDE.md erzeugen |
| `/clear` | Neue Unterhaltung mit leerem Kontext |
| `/compact` | Die Unterhaltung zusammenfassen, um Kontext freizugeben |
| `/context` | Die aktuelle Kontextnutzung visualisieren |
| `/resume` | Eine Unterhaltung fortsetzen oder die Auswahl öffnen |
| `/branch` | Die Unterhaltung an dieser Stelle verzweigen |
| `/rewind` | Code, Unterhaltung oder beides zurücksetzen |
| `/model` | Das Modell wechseln; als Standard gespeichert |
| `/plan` | Vom Prompt aus in den Plan-Modus wechseln |
| `/permissions` | Allow-, Ask- und Deny-Regeln verwalten |
| `/memory` | CLAUDE.md-Dateien bearbeiten, Auto-Memory umschalten |
| `/config` | Einstellungen öffnen oder `key=value` direkt setzen |
| `/usage` | Sitzungskosten und Nutzungslimits des Tarifs |
| `/diff` | Änderungen in deinem Arbeitsverzeichnis prüfen |
| `/btw` | Nebenfrage, die aus dem Verlauf herausbleibt |
| `/code-review` | Den aktuellen Diff auf Fehler prüfen |

Weiterführend: [Kontextverwaltung](/docs/claude-code/context-management).

### Tastatur und Eingabe

| Taste | Was sie tut |
| --- | --- |
| `Esc` | Claude unterbrechen; bisherige Arbeit bleibt erhalten |
| `Esc Esc` | Das Rewind-Menü öffnen (bei leerem Prompt) |
| `Shift+Tab` | Durch die Berechtigungsmodi wechseln |
| `Ctrl+C` | Unterbrechen oder, im Leerlauf, die Eingabe leeren |
| `Ctrl+O` | Den Transcript-Viewer umschalten |
| `Ctrl+R` | Rückwärtssuche im Befehlsverlauf |
| `Ctrl+B` | Den laufenden Befehl in den Hintergrund schicken |
| `Ctrl+G` | Den Prompt in deinem Texteditor bearbeiten |
| `Ctrl+V` | Ein Bild aus der Zwischenablage einfügen |
| `Ctrl+J` | Neue Zeile, in jedem Terminal |
| `!` | Shell-Modus: einen Befehl direkt ausführen |
| `@` | Einen Dateipfad erwähnen, mit Autovervollständigung |

### Checkpoints und Rewind

| Aspekt | Detail |
| --- | --- |
| Erstellt | Bei jedem Prompt, der einen Zug startet; die 100 jüngsten bleiben erhalten |
| Wiederherstellen | Code und Unterhaltung, oder jeweils nur eines von beiden |
| Zusammenfassen | Ab hier oder bis hier; Dateien bleiben unberührt |
| Nicht erfasst | Dateiänderungen per Bash, die meisten Subagent-Änderungen, Änderungen außerhalb der Sitzung |

Weiterführend: [Checkpoints & Rewind](/docs/claude-code/checkpoints-and-rewind).

### Berechtigungsmodi

| Modus | Was ohne Nachfrage läuft |
| --- | --- |
| `default` | Nur Lesezugriffe. Wird als Manual angezeigt |
| `acceptEdits` | Lesezugriffe, Dateiänderungen, gängige Dateisystembefehle |
| `plan` | Lesezugriffe sowie vom Classifier genehmigte Befehle |
| `auto` | Alles, mit Sicherheitsprüfungen im Hintergrund |
| `dontAsk` | Lesezugriffe und vorab genehmigte Tools; der Rest wird verweigert |
| `bypassPermissions` | Alles. Nur in isolierten Containern und VMs |

`Shift+Tab` wechselt durch `default`, `acceptEdits` und `plan`, danach `bypassPermissions` und `auto`, sofern aktiviert. Deny-Regeln blockieren in jedem Modus. Ab v2.1.283 ist der eingebaute Startmodus für interaktive Terminalsitzungen `auto`; mit `permissions.defaultMode` änderst du das.

Weiterführend: [Berechtigungen & Berechtigungsmodi](/docs/claude-code/permissions).

### Plan-Modus

| Aspekt | Detail |
| --- | --- |
| Erlaubt | Lesezugriffe, Shell-Befehle zum Erkunden, ein geschriebener Plan |
| Blockiert | Änderungen an deinem Quellcode, bis du den Plan genehmigst |
| Befehle | Vom Classifier geprüft oder per Nachfrage bestätigt, wenn sie außerhalb der Nur-Lese-Menge liegen |
| Nicht erzwungen | In einer interaktiven Terminalsitzung, in der Bypass-Berechtigungen verfügbar sind |

Weiterführend: [Plan-Modus](/docs/claude-code/plan-mode).

### Hooks

| Ereignis oder Aspekt | Detail |
| --- | --- |
| Konfigurieren in | `hooks` in einer Einstellungsdatei; `/hooks` listet sie auf |
| `SessionStart` | Eine Sitzung beginnt oder wird fortgesetzt |
| `UserPromptSubmit` | Ein Prompt wird abgeschickt, vor der Verarbeitung |
| `PreToolUse` | Bevor ein Tool-Aufruf läuft; kann ihn blockieren |
| `PostToolUse` | Nachdem ein Tool-Aufruf erfolgreich war |
| `Stop` | Claude beendet seine Antwort |
| Eingabe | Ereignisdaten als JSON auf stdin |
| Exit-Codes | 0: kein Einwand. 2: die Aktion blockieren, wo das Ereignis es zulässt; stderr ist die Begründung |

Weiterführend: [Hooks: Deterministische Automatisierung](/docs/claude-code/hooks).

### Memory und CLAUDE.md

| Datei oder Syntax | Was sie tut |
| --- | --- |
| `./CLAUDE.md` | Projektanweisungen, über Git geteilt |
| `./CLAUDE.local.md` | Persönliche Projektnotizen; zu `.gitignore` hinzufügen |
| `~/.claude/CLAUDE.md` | Deine Vorlieben, in jedem Projekt |
| `.claude/rules/*.md` | Themenregeln, optional per `paths:` eingegrenzt |
| `@path/to/file` | In CLAUDE.md importieren, bis zu vier Ebenen tief |
| `MEMORY.md` | Von Claude geschriebener Auto-Memory-Index; die ersten 200 Zeilen oder 25 KB werden geladen |

Weiterführend: [CLAUDE.md & Memory-Dateien](/docs/claude-code/claude-md).

## Quellen & weiterführende Links

Jeder Abschnitt wurde am 13.10.2026 gegen diese offiziellen Seiten geprüft:

- [CLI-Referenz](https://code.claude.com/docs/en/cli-reference) — Sitzungen starten und fortsetzen, Headless-Flags
- [Claude Code programmatisch ausführen](https://code.claude.com/docs/en/headless) — `-p`, Ausgabeformate, `--bare`, die JSON-Ergebnisfelder und Exit-Codes
- [Einstellungsdateien und Vorrang](https://code.claude.com/docs/en/settings) — die fünf Einstellungsquellen, ihre Reihenfolge, das Zusammenführen von Listen
- [Das .claude-Verzeichnis erkunden](https://code.claude.com/docs/en/claude-directory) — `.mcp.json` und die übrigen Dateiorte
- [Befehle](https://code.claude.com/docs/en/commands) — Befehle in der Sitzung
- [Interaktiver Modus](https://code.claude.com/docs/en/interactive-mode) — Tastenkürzel und Eingabepräfixe
- [Checkpointing](https://code.claude.com/docs/en/checkpointing) — was ein Checkpoint erfasst, das Rewind-Menü, die Grenzen
- [Einen Berechtigungsmodus wählen](https://code.claude.com/docs/en/permission-modes) — die sechs Modi, der `Shift+Tab`-Zyklus, Plan-Modus
- [Hooks-Referenz](https://code.claude.com/docs/en/hooks) und [Aktionen mit Hooks automatisieren](https://code.claude.com/docs/en/hooks-guide) — Ereignisse, Orte, Exit-Codes
- [Wie Claude sich dein Projekt merkt](https://code.claude.com/docs/en/memory) — CLAUDE.md-Orte, Regeln, Importe, Auto-Memory

## Weiter

- [Die claude-CLI: Flags, die das Ergebnis verändern](/docs/claude-code/cli-flags) — die Überlegungen hinter den Flags auf dem Spickzettel
- [Berechtigungen & Berechtigungsmodi](/docs/claude-code/permissions) — einen Modus bewusst wählen
- [Hooks: Deterministische Automatisierung](/docs/claude-code/hooks) — aus einer Gewohnheit eine Garantie machen
