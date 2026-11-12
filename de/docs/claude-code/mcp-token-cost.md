# Die MCP-Token-Steuer

> Source: https://derob98.github.io/ailmanac/de/docs/claude-code/mcp-token-cost · AILmanac (CC BY 4.0) · last verified 2026-11-10

Warum das Anbinden von MCP-Servern 50k–150k Tokens verbrennen kann, bevor deine erste Anfrage überhaupt losgeht — und die drei Lösungen: Tool Search, Code-Ausführung und das Wissen, wann ein CLI-Aufruf gewinnt.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-11-10" source="https://www.anthropic.com/engineering/advanced-tool-use">
Token-Zahlen und Funktionsnamen (`defer_loading`, Tool Search Tool, Programmatic Tool Calling) stammen aus Anthropics Engineering-Beiträgen. Das Tool-Search-Verhalten von Claude Code selbst — dass es standardmäßig aktiv ist, die Werte von `ENABLE_TOOL_SEARCH`, die Modell-Untergrenze und die Beschreibungslimits — stammt aus der [Claude-Code-MCP-Dokumentation](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search); dort ändert sich dieser Teil. Prüfe beides, bevor du genaue Zahlen zitierst.
</VerifyNote>

Auf Hacker News und X gibt es immer wieder Streit: *warum Zehntausende Tokens für eine einzige MCP-Operation verbrennen, wenn dasselbe über eine CLI ein paar Hundert kostet?* Es klingt nach MCP-Bashing. Ist es aber nicht. Die, die am lautesten argumentieren, sind genau die, die Agenten lieben — sie haben nur die Rechnung gesehen. Diese Seite ist der praktische Leitfaden zu dieser Rechnung: wohin die Tokens tatsächlich fließen, die zwei Kosten, die fast niemand trennt, und die drei Lösungen, die aus einem 150.000-Token-Workflow einen mit 2.000 Tokens machen.

<Callout type="objectives" items={["Trenne die ZWEI unterschiedlichen MCP-Token-Kosten: das Laden der Tool-Definitionen und die Zwischenergebnisse", "Verstehe, warum die Schema-Kosten pro Konversation anfallen, nicht einmalig", "Nutze defer_loading und das Tool Search Tool, um Tool-Schemas bei Bedarf zu laden", "Nutze Code-Ausführung / Programmatic Tool Calling, um große Ergebnisse aus dem Kontext herauszuhalten", "Entscheide pro Aufgabe, wann ein MCP-Tool sich lohnt und wann ein einfacher CLI-Aufruf gewinnt"]} />

## Zwei Kosten, nicht eine

Wenn du einen MCP-Server anbindest, fragt der Client bei ihm `tools/list` ab und bekommt **jedes Tool mit seinem vollständigen JSON-Schema** zurück. Dieser gesamte Block wird in den Kontext des Modells injiziert. Die meisten Leute hören bei ihrer mentalen Buchhaltung genau hier auf. Aber es gibt zwei getrennte Steuern, und die zweite ist meist die größere.

**Kosten 1 — Tool-Definitionen.** Name, Beschreibung und Parameter-Schema jedes angebundenen Tools liegen im Kontext. Anthropics eigene Formulierung: *"In Fällen, in denen Agenten mit Tausenden von Tools verbunden sind, müssen sie Hunderttausende Tokens verarbeiten, bevor sie überhaupt eine Anfrage lesen."* Ein einzelner Enterprise-Server kann Dutzende bis Hunderte Tools veröffentlichen; Drittanbieter-Analysen beziffern einen 400-Tool-Server auf rund 400.000 Tokens allein an Schema — das Doppelte eines 200k-Fensters und immer noch 40 % eines 1M-Fensters, verbraucht vor der ersten Anfrage. (Fenstergrößen pro Modell: [Modelle und Preise](/docs/whats-new/models-and-pricing).)

**Kosten 2 — Zwischenergebnisse.** Wenn das Modell ein Tool direkt aufruft, **fließt jedes Ergebnis zurück durch den Kontext des Modells**, auch die Teile, die es nie lesen sollte. Anthropics Beispiel: Zieh ein zweistündiges Meeting-Transkript aus einem Tool und reiche es an ein anderes weiter, und das vollständige Transkript läuft *zweimal* durch das Modell — potenziell ~50.000 Tokens — nur um eine einzeilige Zusammenfassung zu erzeugen.

<Callout type="warning" items={["Kosten 1 fallen in JEDER Runde an, bis Prompt-Caching greift — die Schemas werden mit jeder Anfrage in der Konversation erneut gesendet, nicht einmalig geladen. Ein großer Tool-Katalog ist eine Steuer auf die gesamte Sitzung, keine einmalige Gebühr. Das ist der Preis eines Tools, dessen Definition GELADEN ist; es zurückzustellen (unten) nimmt es von der Rechnung pro Runde.", "Kosten 2 skalieren mit deinen DATEN, nicht mit deiner Tool-Anzahl. Zehn winzige Tools können günstiger sein als ein Tool, das einen riesigen Blob zurückgibt."]} />

### Die Zahlen, aus den Primärquellen

| Lösung | Aufgabe | Vorher | Nachher | Reduktion |
| --- | --- | --- | --- | --- |
| Code-Ausführung mit MCP | Google Drive → Salesforce-Workflow | 150.000 | 2.000 | **98,7 %** |
| Tool Search Tool | Definitionen laden, bevor die Arbeit beginnt | ~77.000 | ~8.700 | **85 %** |
| Programmatic Tool Calling | Komplexe Recherche-Aufgabe | 43.588 | 27.297 | **37 %** |

Alle drei Zeilen sind veröffentlichte Zahlen von Anthropic. Das Überraschende sind nicht die Kosten — es ist die **Genauigkeit**: Mit dem Tool Search Tool *stieg* die Genauigkeit der Tool-Auswahl (Opus 4.5 ging von 79,5 % → 88,1 %; Opus 4 ging von 49 % → 74 %). Weniger Tools, die den Kontext verstopfen, bedeuten, dass das Modell häufiger das richtige auswählt. Kosten und Qualität bewegen sich hier in dieselbe Richtung, was selten ist.

## Lösung 1 — Tool-Schemas bei Bedarf laden

Statt alle Schemas vorab zu injizieren, markiere sie mit `defer_loading: true`. Claude sieht dann nur einen leichtgewichtigen Index; wenn es GitHub braucht, ruft es das **Tool Search Tool** auf, das *nur* die passenden GitHub-Schemas zurückgibt — nicht die über 50 Tools jedes anderen Servers. Anthropic berichtet, dass dies ~191.300 Tokens Kontext bewahrt, verglichen mit ~122.800, wenn alles vorgeladen ist.

### In Claude Code ist es bereits aktiv

Du siehst dieses Muster gerade jetzt, wenn du Claude Code mit MCP-Servern nutzt. **Tool Search ist standardmäßig aktiviert**: Beim Sitzungsstart werden nur die *Namen* der Tools und die Server-Anweisungen geladen, und Claude holt ein vollständiges Schema über einen `ToolSearch`-Aufruf, wenn eine Aufgabe es braucht. Ein weiterer Server kostet dich also seine Tool-Namen, nicht seine Schemas — Claude Code setzt kein Tool-Limit pro Server und nennt als praktische Grenze dein Kontextfenster-Budget.

Eine weit verbreitete Behauptung muss korrigiert werden, denn sie stimmt nur halb. Die Schwelle von „~10 % des Kontextfensters“ gibt es wirklich, aber sie ist **nicht** der Standard-Trigger — sie ist ein Opt-in-Modus der Umgebungsvariable `ENABLE_TOOL_SEARCH`:

| `ENABLE_TOOL_SEARCH` | Verhalten |
| --- | --- |
| *(nicht gesetzt)* — der Standard | Jedes MCP-Tool zurückgestellt, bei Bedarf geladen |
| `true` | Wie nicht gesetzt |
| `auto` | Schwellenmodus. Zurückstellbare Tools werden **sofort** geladen, solange ihre Definitionen zusammen unter 10 % des Kontextfensters liegen; ab 10 % wird Tool Search aktiviert |
| `auto:N` | Schwellenmodus mit deinem eigenen Prozentwert (`N` ist 0–100), z. B. `auto:5` |
| `false` | Jedes MCP-Tool sofort geladen, keine Zurückstellung |

Wenn du also darauf gesetzt hast, dass Tools unter 10 % sofort geladen werden, hast du den Standard falsch herum im Kopf — nichts wird sofort geladen, solange du nicht `auto` verlangst. Und `auto` ist **klebrig**: Sobald die Summe die Schwelle überschreitet und Tool Search sich einschaltet, können diese Tools zurückgestellt bleiben, auch wenn die Summe wieder darunter fällt.

<Callout type="warning" items={["Drei Dinge schalten Tool Search ab und ignorieren ENABLE_TOOL_SEARCH vollständig: CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS (ab Claude Code v2.1.227 kann eine Organisation es über Managed Settings aktiv halten), eine Sitzung mit HIPAA-Konfiguration (gar keine Überschreibung) und auf Azure gehostete Microsoft-Foundry-Deployments, die es serverseitig ablehnen. Auch das Verweigern des ToolSearch-Tools in den Berechtigungen lädt alles sofort.", "Es gibt eine Modell-Untergrenze: Claude Code nutzt Tool Search bei Claude Opus 4, Sonnet 4, Haiku 4.5 und neuer. Bei früheren Modellen wird alles sofort geladen, und ENABLE_TOOL_SEARCH=true überschreibt das NICHT. Auf Google Clouds Agent Platform liegt die Untergrenze höher — Opus 4.5, Sonnet 4.5, Haiku 4.5 und neuer."]} />

Wenn du MCP-Server schreibst, verändert die Zurückstellung auch dein Beschreibungsbudget, und zwar asymmetrisch: Ein **sofort** geladenes Tool wird bei 4.096 Zeichen abgeschnitten (dasselbe Limit wie bei Server-Anweisungen), eines, das **über Tool Search** geladen wird, bei 16.384. Die Suche selbst gleicht aber nur mit dem kürzeren Limit ab, daher müssen die Wörter, nach denen Claude suchen würde, in beiden Fällen nah am Anfang stehen.

<Steps items={[{title: "Prüfe, was du angebunden hast", body: "Liste die aktiven Server auf und ungefähr, wie viele Tools jeder veröffentlicht. Führe /context aus: Es kennzeichnet Tools mit (deferred) oder (loaded on-demand), wenn Tool Search sie hat, sodass du siehst, welche Server tatsächlich Schema-Tokens verbrauchen und welche nur Namen."}, {title: "Trenne, was diese Aufgabe nicht braucht", body: "Die günstigste Lösung sind weniger Server. Binde die zwei oder drei an, die eine Aufgabe wirklich nutzt, nicht deinen ganzen Katalog — selbst zurückgestellt trägt jeder Server in jeder Runde Tool-Namen und Server-Anweisungen bei."}, {title: "Stelle den Rest zurück", body: "In Claude Code ist das bereits der Standard. Anderswo nimm einen Client bzw. eine Konfiguration, die defer_loading + Tool Search unterstützt, damit Schemas nur beim Suchen geladen werden."}]} />

## Lösung 2 — Ergebnisse mit Code-Ausführung aus dem Kontext halten

Die tiefere Lösung zielt auf Kosten 2. Statt dass das Modell Tools nacheinander aufruft und jedes Ergebnis durch es hindurchläuft, **schreibt das Modell Code**, der die Tools aufruft, und die Zwischendaten bleiben in der Ausführungsumgebung. Anthropic stellt MCP-Server als einen **Dateibaum von Tools** bereit, den der Agent wie ein Dateisystem erkundet und dabei nur die Definitionen lädt, die er braucht — und *"Zwischenergebnisse bleiben standardmäßig in der Ausführungsumgebung … der Agent sieht nur das, was du explizit protokollierst oder zurückgibst."*

Genau diese eine Designänderung ist es, die den Drive→Salesforce-Workflow von 150.000 auf 2.000 Tokens zusammenschrumpfen lässt: Die Datensätze bewegen sich durch Code, und nur die finale Zahl kommt zum Modell zurück. Auf der Developer Platform kommt dieselbe Idee als **Programmatic Tool Calling** — Claude schreibt Python, das mehrere Tools orchestriert und die Ausgaben filtert, bevor sie überhaupt in seinen Kontext gelangen.

<Callout type="tip" items={["Faustregel: Wenn ein Tool etwas Großes ZURÜCKGIBT (ein Transkript, einen Query-Dump, eine Datei), willst du Code-Ausführung, damit der Blob außerhalb des Kontexts verarbeitet wird. Wenn ein Tool nur etwas Kleines TUT (ein Issue erstellen, eine Zeile senden), ist ein direkter Aufruf in Ordnung."]} />

## Lösung 3 — Erkenne, wann ein CLI-Aufruf einfach gewinnt

Manchmal ist die richtige Antwort kein besseres MCP-Setup — sondern gar kein MCP. Das HN/X-Argument hat einen echten Punkt: Ein Shell-Befehl wie `gh pr list` oder `psql -c '…'` kostet ein paar Hundert Tokens hin und zurück, während der äquivalente MCP-Weg für Schemas plus ein strukturiertes Ergebnis zahlt. Wenn der Agent bereits ein Terminal hat und die CLI existiert, ist das oft der schlankeste Weg.

<PromptCard title="Bevorzuge die CLI, wenn das Tool bereits eine CLI ist">
{`# Instead of connecting a GitHub MCP server for read-only work,
# let the agent use the gh CLI it already has:
gh pr list --state open --json number,title,author

# ~200 tokens of command + compact output, no schema tax,
# no server to keep connected across the session.`}
</PromptCard>

MCP verdient seinen Overhead, wenn du **typisierte, berechtigungsgeprüfte, oberflächenübergreifende** Fähigkeit brauchst — eine Datenbank mit einer Nur-Lese-Rolle, einen Browser, den es steuern kann, eine SaaS-API mit OAuth — oder wenn dieselben Tools über viele Runden hinweg wiederverwendet werden, sodass Caching die Schema-Kosten amortisiert. Greif zu einer CLI, wenn die Fähigkeit einmalig ist, bereits skriptbar und etwas Kleines zurückgibt. Keines ist "besser"; sie sind unterschiedliche Punkte auf einer Kostenkurve.

<Callout type="takeaways" items={["MCP hat zwei Token-Kosten: Tool-Definitions-Schemas (fallen ~jede Runde an) und Zwischenergebnisse (skalieren mit deinen Daten).", "Tool Search + defer_loading senken die Schema-Kosten um ~85 % UND steigern die Genauigkeit der Tool-Auswahl — lade Schemas nur bei Suche.", "In Claude Code ist Tool Search standardmäßig AN: Beim Sitzungsstart werden nur Tool-Namen geladen. Die oft zitierte Schwelle von ~10 % ist der Opt-in-Modus ENABLE_TOOL_SEARCH=auto, nicht der Standard.", "Code-Ausführung / Programmatic Tool Calling halten große Ergebnisse in der Ausführungsumgebung; nur was du protokollierst oder zurückgibst, erreicht das Modell (150k → 2k in Anthropics Beispiel).", "Die günstigste Optimierung ist, pro Aufgabe weniger Server anzubinden.", "Wenn die Fähigkeit einmalig ist, etwas Kleines zurückgibt und bereits eine CLI hat, schlägt ein Shell-Aufruf (~200 Tokens) einen MCP-Roundtrip."]} />

<Flashcards title="Begriffe der MCP-Ökonomie" cards={[{front: "Die MCP-Token-Steuer", back: "Tokens, die für Tool-Schemas + Zwischenergebnisse ausgegeben werden, nicht für die eigentliche Arbeit — die versteckten Kosten des Anbindens von Servern."}, {front: "defer_loading", back: "Ein Flag, das das Schema eines Tools AUS dem Kontext hält, bis Claude über das Tool Search Tool danach sucht."}, {front: "Tool Search Tool", back: "Lässt Claude Tools bei Bedarf entdecken; die Suche nach 'github' gibt nur GitHub-Schemas zurück statt jedes angebundenen Tools. ~85 % Schema-Token-Einsparung in Anthropics Zahlen."}, {front: "Programmatic Tool Calling", back: "Claude schreibt Code, der Tools orchestriert; Zwischenergebnisse werden in der Ausführungsumgebung gefiltert, sodass nur die finale Ausgabe in den Kontext gelangt."}, {front: "Progressive Disclosure", back: "Allgemeines Muster: Stelle vorab einen leichtgewichtigen Index der Tools bereit, hole vollständige Schemas nur bei Bedarf."}, {front: "ENABLE_TOOL_SEARCH", back: "Der Regler von Claude Code. Nicht gesetzt oder true = alles zurückgestellt (der Standard). auto / auto:N = sofort laden, bis die Definitionen N % des Fensters übersteigen (standardmäßig 10 %), dann einschalten und eingeschaltet bleiben. false = alles sofort."}]} />

<Quiz title="Prüfe dich selbst" questions={[{q: "Warum sind die Tool-Definitions-Kosten schlimmer als eine einmalige Gebühr?", options: ["Schemas werden auf der Festplatte gespeichert und langsam erneut gelesen", "Die Schemas werden mit jeder Anfrage in der Konversation erneut gesendet, bis Prompt-Caching greift", "Jeder Tool-Aufruf verdoppelt die Schema-Größe"], answer: 1, explain: "Tool-Schemas liegen im Kontext, der jede Runde gesendet wird, sodass ein großer Katalog die gesamte Sitzung besteuert — nicht nur die erste Nachricht — bis Caching greift."}, {q: "Ein Tool zieht ein 2-stündiges Transkript und übergibt es per direkten Aufrufen an ein Zusammenfassungs-Tool. Was sind die versteckten Kosten?", options: ["Nichts — nur die Zusammenfassung nutzt Tokens", "Das vollständige Transkript läuft durch den Kontext des Modells, potenziell ~50k Tokens, obwohl du nur eine Zusammenfassung wolltest", "Das Transkript wird einmal am Server abgerechnet, nicht am Modell"], answer: 1, explain: "Bei direkten Tool-Aufrufen fließt jedes Zwischenergebnis durch das Modell. Code-Ausführung hält das Transkript in der Ausführungsumgebung, sodass nur die Zusammenfassung zurückkommt."}, {q: "Du brauchst während einer Coding-Sitzung ein einzelnes Nur-Lese-'offene PRs auflisten' und der Agent hat ein Terminal. Schlankeste Option?", options: ["Einen vollständigen GitHub-MCP-Server anbinden", "Die gh CLI direkt ausführen — ~200 Tokens, keine Schema-Steuer, nichts, was angebunden bleiben muss", "Alle GitHub-Tools mit deaktiviertem defer_loading laden"], answer: 1, explain: "Für etwas Einmaliges, das etwas Kleines zurückgibt und bereits eine CLI hat, vermeidet ein Shell-Aufruf die Schema-Steuer vollständig. MCP verdient seine Kosten bei wiederverwendeter, typisierter, berechtigungsgeprüfter Fähigkeit."}, {q: "Was Überraschendes passiert mit der Genauigkeit der Tool-Auswahl, wenn du das Tool Search Tool nutzt?", options: ["Sie sinkt, weil Claude weniger Tools sieht", "Sie bleibt gleich; nur die Kosten ändern sich", "Sie steigt — weniger Tools, die den Kontext verstopfen, bedeuten, dass Claude häufiger das richtige auswählt"], answer: 2, explain: "Anthropic berichtet, dass die Genauigkeit STIEG (Opus 4.5: 79,5 % → 88,1 %) mit Tool Search. Kosten und Qualität bewegten sich in dieselbe Richtung."}]} />

## Verwandtes auf AILmanac

- [MCP-Server in Claude Code](/docs/claude-code/mcp) — wie man Server hinzufügt, ihren Umfang festlegt und absichert.
- [Die Token-Ökonomie](/docs/power-user/token-economy) — Befehlsausgabe komprimieren, bevor sie das Modell erreicht.
- [Dynamische Workflows](/docs/claude-code/dynamic-workflows) — wo Orchestrierungskosten auftauchen und wie man in Scheiben schneidet, um den Aufwand abzuschätzen.
- [Tool Use über die API](/docs/api/tool-use) — die Request/Response-Form hinter all dem.
- [Playwright MCP: Der ausführliche Praxisleitfaden](/docs/api/playwright-mcp-deep-guide) — durchgespieltes Beispiel zum schwersten einzelnen Server, den Leute anbinden (~3.500 Token Schema-Steuer), und wann stattdessen der Skill/CLI-Weg gewinnt.
- [Tool Search & Deferred Loading](/docs/api/tool-search-and-deferred-loading) — der Deep Dive auf API-Ebene: Regex vs. BM25, die fünf 400er-Fehler und warum der Request-Body nicht kleiner wird.

## Quellen & weiterführende Literatur

- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) — Anthropic Engineering. Quelle der Zahl 150.000 → 2.000 Tokens (98,7 %) und des Musters "Zwischenergebnisse bleiben in der Ausführungsumgebung".
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) — Anthropic Engineering. Tool Search Tool (`defer_loading`, ~85 % Reduktion, Genauigkeitsgewinne) und Programmatic Tool Calling (43.588 → 27.297 Tokens).
- [Claude Code MCP-Dokumentation](https://code.claude.com/docs/en/mcp) — offizielle Referenz zum Anbinden und Festlegen des Umfangs von Servern. Der Abschnitt [Scale with MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search) ist die Quelle dafür, dass Tool Search der Standard ist, für die Tabelle zu `ENABLE_TOOL_SEARCH`, die Modell-Untergrenze und die Beschreibungslimits von 4.096 / 16.384 Zeichen.
- [modelcontextprotocol — Progressive Tool Discovery-Diskussion](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1923) — Community-Design-Konversation zum Laden von Tools bei Bedarf.
- [MCP Progressive Disclosure](https://www.solo.io/blog/mcp-progressive-disclosure) (Solo.io) — Drittanbieter-Durchgang durch das Muster leichtgewichtiger Index / Schema bei Bedarf holen.


## Weiter

- [Barrierefreiheit](/docs/claude-code/accessibility)
