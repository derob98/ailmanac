# Effort-Tuning: 5 Stufen, Modell-Standards und die Cache-Falle

> Source: https://derob98.github.io/ailmanac/de/docs/api/effort-tuning · AILmanac (CC BY 4.0) · last verified 2026-10-19

Der Effort-Parameter vom Juli 2026 hat fünf Stufen — low, medium, high, xhigh, max — und gehört in output_config, nicht auf die oberste Ebene. Er wirkt auf Tool-Aufrufe (nicht nur auf das Denken), macht den Prompt-Cache ungültig, wenn er mitten in einer Unterhaltung geändert wird, und jedes Modell hat einen anderen empfohlenen Startpunkt. Der praktische Tuning-Leitfaden.

<LevelBadge level="intermediate" />

Am **22. Juli 2026** hat Anthropic `effort` in die Modellkonfiguration von Claude Managed Agents aufgenommen und damit den Kreis um eine Steuerung geschlossen, die die Messages API still auf fünf Stufen ausgebaut hat. Wenn du noch `effort="high"` aus einem Blogpost von Anfang 2026 auf der obersten Ebene von `messages.create` kopierst, sieht deine Anfrage gültig aus, aber Claude beachtet womöglich nicht das Feld, das du meinst — der Parameter gehört jetzt in `output_config`, und die API erzwingt nur die Stufen, die auf der Modellkarte dokumentiert sind.

Dies ist der praktische Tuning-Leitfaden: wohin `effort` in einer Anfrage tatsächlich gehört, was die fünf Stufen wirklich tun (sie verändern die Zahl der Tool-Aufrufe, nicht nur die Denktiefe), die überraschenden Standardwerte pro Modell und die eine Falle, die die Kosten still in die Höhe treibt — wer den Effort mitten in einer Unterhaltung ändert, macht den Prompt-Cache ungültig.

<Callout type="objectives" items={[
  "Das Effort-Feld korrekt platzieren — in output_config bei der Messages API, im model-Objekt bei Managed Agents, über /effort oder CLAUDE_CODE_EFFORT_LEVEL in Claude Code",
  "Pro Modell eine Startstufe wählen — high ist der API-Standard der meisten Modelle, aber NICHT bei Opus 5.5 und Haiku 5.5, die auf medium stehen, und der empfohlene Start-Effort variiert zusätzlich (Sonnet 5.5 medium für agentisches Coding, Sonnet 4.6 medium, Opus 4.7/4.8 xhigh, Fable 5.1 high)",
  "Verstehen, dass Effort ALLE Tokens beeinflusst — Text, Tool-Aufrufe und (wenn aktiv) das Denken — ein niedrigerer Effort senkt also die Zahl der Tool-Aufrufe, nicht nur die Ausführlichkeit",
  "Die Cache-Falle vermeiden — wer den Effort innerhalb einer Unterhaltung variiert, macht das Prompt-Caching ungültig und kann die Rechnung still verdoppeln",
  "Die Effort-Oberfläche von Claude Code kennen — /effort, ultrathink (ein Zug), ultracode (xhigh + dauerhafte Multiagent-Erlaubnis), Überschreiben per Umgebungsvariable CLAUDE_CODE_EFFORT_LEVEL",
]} />

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/build-with-claude/effort">
Gegen die offizielle Effort-Dokumentation von Anthropic geprüft. Standardwerte pro Modell, die Verfügbarkeitslisten für `xhigh`/`max` sowie Beta-Status und Modellabdeckung von Effort pro Nachricht ändern sich von Release zu Release — prüfe die Quelle erneut, bevor du Verhalten in Produktion festschreibst.
</VerifyNote>

## Die fünf Stufen (und wo „ultracode“ hingehört)

Die Effort-Skala hat Stand 22. Juli 2026 **fünf** Werte, die die API akzeptiert:

| Stufe | Was sie bewirkt | Wann man sie wählt |
|---|---|---|
| `low` | Am effizientesten. Deutliche Token-Ersparnis bei etwas geringerer Leistungsfähigkeit. Weniger Tool-Aufrufe, knappe Bestätigungen, keine Einleitung. | Einfache Klassifikation, Workloads mit hohem Volumen, Chat, latenzkritische UX, Subagenten mit eng umrissenen Aufgaben |
| `medium` | Ausgewogen. Moderate Token-Ersparnis gegenüber high. | Agentische Aufgaben, bei denen Tempo, Kosten und Qualität im Gleichgewicht sein müssen; kostenbewusster Schritt nach unten von high |
| `high` | Hohe Leistungsfähigkeit. **Entspricht dem Weglassen des Parameters — bei jedem Modell außer Opus 5.5 und Haiku 5.5, die standardmäßig `medium` verwenden.** | Komplexes Schlussfolgern, schwieriges Coding, agentische Aufgaben, bei denen Qualität wichtiger ist als Tempo |
| `xhigh` | Erweiterte Leistungsfähigkeit für Langzeitaufgaben. Erwarte deutlich höheren Token-Verbrauch als bei high. | Lang laufende (30+ Min.) agentische und Coding-Aufgaben, Token-Budgets im Millionenbereich, tiefe Refactorings über mehrere Dateien |
| `max` | Absolut maximale Leistungsfähigkeit, keine Begrenzung der Token-Ausgaben. | Nur echte Grenzprobleme. Kann bei Aufgaben mit strukturierter Ausgabe überdenken. |

Weder `max` noch `xhigh` sind universell — prüfe die Stufe am Modell, bevor du auslieferst. `xhigh` wird unterstützt von **Fable 5.1, Mythos 5.1, Fable 5, Mythos 5, Opus 5.5, Opus 5, Opus 4.8, Opus 4.7, Sonnet 5.5, Sonnet 5 und Haiku 5.5**. `max` deckt all diese ab, plus **Mythos Preview, Opus 4.6 und Sonnet 4.6**. Opus 4.5 unterstützt Effort, aber keine der beiden obersten Stufen. In den Worten von Anthropic: "Not every model that supports `max` supports `xhigh`."

<Callout type="tip" items={[
  "Den Effort auf den Standardwert des Modells zu setzen, ergibt exakt dasselbe Verhalten wie das Weglassen des Parameters — das ist 'high' bei den meisten Modellen, aber 'medium' bei Opus 5.5 und Haiku 5.5. Setze ihn in einer gecachten Unterhaltung nicht „nur zur Klarheit“, denn wer das Feld bei manchen Anfragen schreibt und bei anderen nicht, macht den Cache ungültig.",
  "'ultracode' ist keine sechste Stufe. Es ist xhigh + eine dauerhafte Erlaubnis für Claude Code, Multiagent-Workflows zu starten, erteilt über Systemnachrichten mitten in der Unterhaltung. Die API akzeptiert fünf Werte.",
]} />

## Die Feldstruktur, die die meisten Blogposts falsch haben

Frühe Artikel von 2026 zum Effort-Parameter zeigen ein Feld auf oberster Ebene:

```python
# WRONG on current models — silently ignored or 400
client.messages.create(
    model="claude-opus-4-8",
    effort="medium",
    ...
)
```

Die aktuelle API platziert `effort` in einem `output_config`-Objekt und übergibt es als Geschwister von `messages`/`model`:

<PromptCard title="Korrekte Effort-Platzierung — Messages API">
{`import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    output_config={"effort": "medium"},
    messages=[{
        "role": "user",
        "content": "Analyse the trade-offs between microservices and monoliths."
    }],
)

print(response.content[0].text)`}
</PromptCard>

Bei Claude Managed Agents (die Änderung vom 22. Juli 2026) gehört `effort` bei der Erstellung in das `model`-Objekt des Agenten. Die Sitzung legt ihn nicht fest — das tut die Agentenversion.

<PromptCard title="Korrekte Effort-Platzierung — Managed Agents (POST /v1/agents)">
{`# Effort travels with the versioned agent config,
# not the per-run session. Every session pinned to
# this agent version runs at xhigh.

POST https://api.anthropic.com/v1/agents
{
  "name": "code-reviewer",
  "model": {
    "id": "claude-opus-4-8",
    "effort": "xhigh"
  },
  "system_prompt": "You review pull requests for security issues.",
  "tools": [...],
  "mcp_servers": [...]
}`}
</PromptCard>

## Effort ist keine Denk-Steuerung

Das ist das zweite große Missverständnis. Effort wirkt **unabhängig davon, ob Thinking aktiviert ist**, und verändert die Tokens, die Claude für Teile der Antwort aufwendet, die kein Denken sind:

- **Tool-Aufrufe.** Weniger Effort → weniger Tool-Aufrufe. Claude fasst Operationen in einzelnen Aufrufen zusammen, überspringt optionale Erkundung und geht ohne Einleitung zur Aktion über.
- **Textlänge.** Weniger Effort → knappere Ausgabe. Knappe Bestätigungen nach Tool-Aufrufen statt ausführlicher Zusammenfassungen. Weniger Code-Kommentare.
- **Denktiefe** (wenn Thinking an ist). Weniger Effort → bei einfachen Prompts wird das Denken ganz übersprungen; bei wirklich schweren wird weiter gedacht, nur weniger.

Der letzte Punkt ist wichtig: Bei `low` denkt Claude bei einer Beweisaufgabe trotzdem, weil die Aufgabe es verlangt. Effort ist ein *Verhaltenssignal*, kein striktes Token-Budget. Erwarte keine harte Obergrenze.

Der `thinking`-Parameter und der `effort`-Parameter beantworten verschiedene Fragen. `thinking` entscheidet, ob Claude überhaupt Thinking-Blöcke erzeugt. `effort` entscheidet, wie viel Arbeit in die gesamte Antwort fließt — einschließlich dessen, wie oft und wie tief Claude denkt, wenn Adaptive Thinking aktiv ist. `effort="adaptive"` zu übergeben ist ein häufiger Fehler; `adaptive` ist ein *Denkmodus*, keine Effort-Stufe.

<Callout type="tip">
Bei <strong>Opus 4.5</strong> — dem einzigen Modell nur mit Extended Thinking, das Effort unterstützt — setzt du Effort <em>und</em> `budget_tokens` zusammen. Wähle die Effort-Stufe passend zur Aufgabe und bemiss dann das Denk-Token-Budget nach der gewünschten Argumentationstiefe. Alle anderen Effort-fähigen Modelle nutzen Adaptive Thinking und nehmen kein `budget_tokens`.
</Callout>

## Modellspezifische Startpunkte, die Teams überraschen

Der API-Standard ist bei den meisten Effort-fähigen Modellen `high` — **aber nicht bei allen. Opus 5.5 und Haiku 5.5 verwenden standardmäßig `medium`.** Dazu kommt, dass Anthropics *empfohlener Start-Effort* je nach Modell variiert, und in dieser Abweichung geben Teams zu viel oder zu wenig aus.

<Steps items={[
  {title: "Opus 5.5 — der Standard ist medium, nicht high", body: "Opus 5.5 ist der einzige Opus mit medium als Standard. Eine Anfrage ohne Effort läuft also eine Stufe NIEDRIGER als derselbe Code auf Opus 5. Wenn nach der Migration die Qualität nachgelassen hat, prüfe das zuerst. Adaptive Thinking ist immer an und lässt sich nicht abschalten (thinking: {type: 'disabled'} liefert auf jeder Stufe 400), daher ist Effort deine einzige Steuerung dafür, wie viel das Modell nachdenkt und was die Anfrage kostet. Führe einen frischen Effort-Sweep durch, statt Einstellungen zu übernehmen — auf gleicher Stufe denkt es pro Zug mehr als Opus 5."},
  {title: "Haiku 5.5 — ebenfalls medium als Standard, und low ist die Spar-Stufe", body: "Das andere Modell mit medium als Standard und der erste Haiku überhaupt mit Effort-Unterstützung. Starte bei medium für die meiste Arbeit, einschließlich agentischem Coding. Nutze low — am günstigsten und schnellsten — für Chat, kurze Tool-Aufgaben und einfache Anfragen mit hohem Volumen, aber kenne den Preis: In langen Agenten-Prompts überspringt es bei low eher eine Suche, hört früh auf oder lässt eine Prüfung aus. Wechsle zu high für Wissensarbeit, längere Agentenaufgaben und strikte Befolgung von Anweisungen. Vergleiche xhigh/max mit Sonnet 5.5 bei Kosten und Tempo, bevor du dich festlegst."},
  {title: "Fable 5.1 und Sonnet 5.5 — high bleibt der Standard", body: "Beide haben high als Standard und unterstützen alle fünf Stufen. Starte bei Fable 5.1 mit high, geh für die leistungskritischsten agentischen und Coding-Aufgaben auf xhigh/max und für medium/low zurück, sobald deine Evals zeigen, dass die Qualität hält. Die Stufen von Sonnet 5.5 sind gegenüber Sonnet 5 NEU KALIBRIERT — eine Stufe bringt nicht mehr dieselbe Menge Denken, also sweep erneut. Für agentisches Coding auf Sonnet 5.5 starte bei medium für klar spezifizierte Aufgaben und geh für schwierigere auf high; setze für agentisches Coding max_tokens auf 128.000, das Maximum des Modells, und streame."},
  {title: "Sonnet 5 — starte bei high (dem Standard)", body: "Sonnet 5 nutzt sowohl in der API als auch in Claude Code high als Standard, und die Empfehlung deckt sich damit. Geh nur für die schwersten Coding- und Agentenaufgaben auf xhigh. Als Sparmaßnahme geh auf medium — Sonnet 5 medium ist mit Sonnet 4.6 high vergleichbar. Nutze low für Chat und latenzkritische Workloads ohne Coding."},
  {title: "Sonnet 4.6 — starte bei medium, überschreibe den Standard", body: "Sonnet 4.6 hat high als Standard, aber Anthropics eigene Empfehlung nennt medium als ausgewogenen Standard für die meisten Anwendungen, einschließlich agentischem Coding. Setze effort='medium' explizit — sonst erbst du high und zahlst für Latenz, die du nicht bestellt hast."},
  {title: "Opus 4.7 und 4.8 — für Coding bei xhigh starten, für alles andere bei high", body: "Der Standard ist high, aber die Empfehlung für Coding und agentische Arbeit lautet xhigh. Nutze high als Minimum für intelligenzkritische Workloads. Geh nur auf medium, wenn deine Evals zeigen, dass die Qualität hält. Hebe max für echte Grenzprobleme auf — bei den meisten Workloads bringt max erhebliche Mehrkosten für kleine Qualitätsgewinne, und bei Aufgaben mit strukturierter Ausgabe kann es überdenken."},
  {title: "Opus 4.7 achtet low/medium strenger — fordere Tiefe per Prompt an, wenn du sie brauchst", body: "Opus 4.7 (und 4.8) fassen die Arbeit bei low/medium enger als Opus 4.6. Wenn du bei low flaches Schlussfolgern bei einem komplexen Prompt beobachtest, erhöhe den Effort, statt per Prompt drumherum zu arbeiten. Wenn dich die Latenz bei low hält, füge eine gezielte Zeile hinzu wie 'This task involves multistep reasoning. Think carefully before responding.'"},
  {title: "Fable 5 und Mythos 5 — high ist die Hauptsteuerung", body: "Effort ist bei Fable 5 der wichtigste Hebel für Intelligenz, Latenz und Kosten. Starte bei high (dem Standard), nutze xhigh für die leistungskritischste Arbeit und geh bei Routineaufgaben auf medium oder low — niedrigere Stufen bei Fable 5 übertreffen immer noch frühere Modelle bei xhigh. Setze bei high/xhigh ein großes max_tokens, da es Denken und Antworttext zusammen begrenzt."},
  {title: "Opus 4.7/4.8 bei xhigh oder max — max_tokens auf mindestens 64k erhöhen", body: "Beide Modelle können bei xhigh/max über Subagenten und Tool-Aufrufe hinweg stark verbrauchen. Anthropic empfiehlt, max_tokens bei 64k zu beginnen und von dort aus anzupassen. Lässt du es bei 4096, bekommst du nach vielversprechendem Start eine abgeschnittene Antwort mit stop_reason='max_tokens'."},
]} />

## Die Cache-Falle — die, die deine Rechnung still verdoppelt

Prompt-Caching bietet Cache-Lesevorgänge zu einem Bruchteil des Standard-Eingabepreises (ein Zehntel bei den meisten Modellen, bei den neuesten weniger — siehe [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)). Wer das **oberste** `output_config.effort` zwischen Anfragen derselben Unterhaltung ändert, **macht den Cache ungültig**, genau wie beim Modellwechsel: Der Effort der obersten Ebene prägt den gerenderten Prompt, ein neuer Wert bedeutet also, dass kein gecachtes Präfix mehr passt. Bei langem Kontext ist das ein erneutes Lesen deiner gesamten Historie zum vollen Preis, bei jeder einzelnen Folgerunde.

### Der Ausweg: Effort pro Nachricht (Beta)

Die neuesten Modelle erlauben es, den Effort zu ändern, *ohne* den Cache zu verlieren. Füge eine `role: "system"`-Nachricht mit leerem `content` hinzu, die die neue Stufe in `output_config.effort` trägt, und alles davor bleibt byte-identisch — das gecachte Präfix passt also weiterhin.

<PromptCard title="Effort mitten in der Unterhaltung ändern, ohne Cache-Miss">
{`# Beta header required:
#   anthropic-beta: mid-conversation-output-config-2026-07-01

{
  "model": "claude-fable-5-1",
  "max_tokens": 4096,
  "output_config": {"effort": "high"},
  "messages": [
    {"role": "user", "content": "Plan a migration from SQLite to PostgreSQL."},
    {"role": "assistant", "content": "1. Export... 2. Create schema... 3. Import."},
    {"role": "system", "content": [], "output_config": {"effort": "low"}},
    {"role": "user", "content": "Summarize the plan in one sentence."}
  ]
}`}
</PromptCard>

Verfügbarkeit Stand 19. Oktober 2026: Auf der Claude API und Google Cloud funktioniert es mit **Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 und Haiku 5.5**; auf Amazon Bedrock nur mit **Fable 5.1, Mythos 5.1 und Opus 5.5**. Es braucht den Beta-Header `mid-conversation-output-config-2026-07-01` — ohne ihn liefert ein `output_config` pro Nachricht `400 messages.N.output_config: Extra inputs are not permitted`. Mit dem Header, aber bei einem nicht unterstützten Modell (darunter Fable 5), erhältst du `400 output_config.effort requires a model that supports per-turn effort; this model does not`.

Zwei Modelle verweigern den Effort-Wechsel pro Zug, sobald das Thinking festgelegt ist: **Sonnet 5.5 mit `thinking: {"type": "between_tools"}`** und **Haiku 5.5 mit `thinking: {"type": "disabled"}`** liefern 400, wenn eine Stufe pro Nachricht von der gerade geltenden abweicht. Nutze dort Adaptive Thinking, um den Effort zu variieren.

Bei allem anderen gilt weiter die alte Regel — wähle eine Stufe und behalte sie bei:

<Callout type="tip" items={[
  "Bei Modellen ohne Effort pro Nachricht variierst du den Effort ZWISCHEN Workloads, nicht INNERHALB einer gecachten Unterhaltung. Wähle die Stufe zu Beginn der Unterhaltung und halte sie konstant, bis du /clear ausführst.",
  "Bevorzuge Effort pro Nachricht gegenüber einer Änderung auf oberster Ebene, auch wenn beides geht: Bei Fable 5.1 steuert ein Wechsel auf oberster Ebene das Modell zudem weniger zuverlässig, weil seine früheren Antworten auf der alten Stufe geschrieben wurden und es dazu neigt, konsistent mit ihnen zu bleiben.",
  "In Claude Code ist /effort mitten in der Sitzung gleichbedeutend mit einem Modellwechsel — erwarte im nächsten Zug einen großen Cache-Miss.",
  "Wenn du die Tiefe nur für einen Zug erhöhen willst, nutze in Claude Code 'ultrathink' (ein Schub tieferen Schlussfolgerns für einen Zug) statt /effort xhigh — so änderst du die Sitzungskonfiguration nicht.",
  "Wenn du für den Rest der Sitzung erhöhen musst, tu es früh. Ein Wechsel bei Zug 3 ist billig; ein Wechsel bei Zug 30 liest 30 Züge Kontext zum vollen Preis neu.",
]} />

Die Folgerung: Wer `effort="high"` bei manchen gecachten Anfragen explizit setzt und bei anderen weglässt, macht den Cache auf dieselbe Weise ungültig — denn beides ist *im Verhalten* gleich, aber *im Text* verschieden. Wähle eine Konvention (immer setzen oder immer weglassen) und halte sie ein.

## Claude Code — die CLI-Oberfläche

Claude Code stellt Effort als interaktiven Befehl, als Startflag und als Umgebungsvariable bereit (die höchste Priorität gewinnt, in umgekehrter Reihenfolge):

```bash
# In-session (interactive slider, or direct)
/effort
/effort xhigh
/effort auto           # reset to model default

# At launch
claude --effort low

# Environment (overrides everything else)
CLAUDE_CODE_EFFORT_LEVEL=high claude
```

Zwei verwandte Befehle sind wissenswert, weil sie keine Effort-Stufen sind, sich aber ähnlich verhalten:

- **`ultrathink`** — ein Schub tieferen Schlussfolgerns für einen Zug, der den Sitzungs-Effort *nicht* verändert. Nutze ihn, wenn der nächste Zug härter nachdenken soll, ohne den Cache für alle folgenden Züge ungültig zu machen.
- **`ultracode`** — setzt für die ganze Sitzung `xhigh` **und** erteilt Claude Code die dauerhafte Erlaubnis, Multiagent-Workflows zu starten (über Systemnachrichten mitten in der Unterhaltung). Die API kennt keinen `ultracode`-Wert — es ist eine CLI-Komfortfunktion, die `xhigh` mit einer Orchestrierungserlaubnis kombiniert.

Persistenzregeln zum Merken: `low`, `medium`, `high` und `xhigh` bleiben über Claude-Code-Sitzungen hinweg erhalten, sobald du sie gesetzt hast. `max` gilt nur für die aktuelle Sitzung — du musst es beim nächsten Mal erneut anwenden.

## Ein Tuning-Durchlauf — ein Prompt, drei Efforts

Um ein Gefühl zu bekommen, führe *denselben* Prompt auf drei Stufen aus und vergleiche die Form der Ausgabe:

<PromptCard title="Tuning-Kalibrierungs-Prompt (bei low, high, xhigh ausführen)">
{`Task: Review this pull request for security issues.

<pr_diff>
[paste a real diff — 300+ lines, multi-file, at least one auth-touching change]
</pr_diff>

Report: severity-tagged findings + a one-line fix per finding.
Do not restate what the diff does.`}
</PromptCard>

Erwarte ungefähr:

- **low** — findet die offensichtlichen Probleme mit hohem Schweregrad (SQL-String-Verkettung, ungeprüfte Nutzereingabe in einem Header). Übersieht subtile Logikfehler. 1–2 Tool-Aufrufe, falls Tools verfügbar sind. Kurze Ausgabe. Schnell.
- **high** — vollständige Analyse. Findet die meisten Schwachstellen, auch subtile. Mehrere gezielte Tool-Aufrufe, um verwandte Dateien zu lesen. Strukturierte Befunde. Hier hören die meisten Teams auf.
- **xhigh** — erschöpfend. Berücksichtigt neuartige Angriffsvektoren und Defense in Depth. Liest benachbarte Dateien, die low/high nicht angefasst haben. Deutlich mehr Tool-Aufrufe. Merklich höherer Token-Verbrauch.

Wenn deine Evals zeigen, dass `high` und `xhigh` bei deiner Codebasis dieselben Befunde liefern, liefere mit `high` aus. Der Wert von xhigh zeigt sich gerade dann, wenn die Aufgabe von wiederholten Tool-Aufrufen und detaillierter Erkundung profitiert — und genau dann empfiehlt Anthropic es.

## Sonnet 5 hat die Kalibrierung verschoben — Stufen nicht blind übertragen

Wenn du Sonnet 4.6 mit `high` betrieben hast und auf Sonnet 5 migriert bist, verbraucht Sonnet 5 bei gleicher Stufe eher das, was Sonnet 4.6 bei `max` verbraucht hat — die Effort-Skala von Sonnet 5 ist *verschoben*. Anthropics eigene Empfehlung: **Sonnet 5 medium ≈ Sonnet 4.6 high**. Das ist ein Kostenunterschied pro Anfrage, den du prüfen solltest, wenn du Traffic ohne Effort-Anpassung wiedergegeben hast. Die ganze Migrationsgeschichte findest du im [Sonnet-5-Praxisleitfaden](/docs/models/sonnet-5-field-guide).

## Festigen

<Flashcards cards={[
  {front: "Wohin gehört das Effort-Feld bei der Messages API?", back: "In ein output_config-Objekt auf oberster Ebene von messages.create — output_config: {effort: 'medium'}. Nicht als Effort-Argument auf oberster Ebene."},
  {front: "Welche fünf Effort-Stufen gibt es?", back: "low, medium, high, xhigh, max. high ist bei den meisten Modellen der Standard — aber Opus 5.5 und Haiku 5.5 verwenden medium."},
  {front: "Welche Modelle verwenden medium statt high als Standard-Effort?", back: "Opus 5.5 und Haiku 5.5. Bei Opus 5.5 heißt das, dass von Opus 5 migrierter Code eine Stufe NIEDRIGER läuft, sofern du den Effort nicht explizit setzt."},
  {front: "Beeinflusst Effort noch etwas außer dem Denken?", back: "Ja — er beeinflusst ALLE Tokens der Antwort: Text, Tool-Aufrufe (weniger Effort → weniger Aufrufe) und das Denken, wenn aktiv."},
  {front: "Was passiert, wenn du den Effort mitten in einer Unterhaltung änderst?", back: "Eine Änderung auf OBERSTER Ebene macht das Prompt-Caching ungültig, genau wie ein Modellwechsel. Die Form pro Nachricht — eine role:'system'-Nachricht mit leerem content und dem neuen output_config.effort, hinter dem Beta-Header mid-conversation-output-config-2026-07-01 — erhält den Cache bei Fable 5.1, Mythos 5.1, Opus 5.5, Opus 5, Sonnet 5.5 und Haiku 5.5."},
  {front: "Ist 'ultracode' eine sechste Effort-Stufe?", back: "Nein. Ultracode ist eine Komfortfunktion der Claude-Code-CLI, die xhigh setzt UND die dauerhafte Erlaubnis für Multiagent-Orchestrierung erteilt. Die API akzeptiert nur die fünf dokumentierten Stufen."},
  {front: "Was ist der empfohlene Effort für Opus 4.7/4.8 bei Coding-Aufgaben?", back: "xhigh — und erhöhe max_tokens auf mindestens 64k, damit das Modell Raum hat, über Subagenten hinweg zu denken und Tools aufzurufen."},
  {front: "Wie verhält sich die Effort-Skala von Sonnet 5 zu der von Sonnet 4.6?", back: "Verschoben. Sonnet 5 medium entspricht ungefähr Sonnet 4.6 high. Übertrage Effort-Stufen bei der Migration nicht 1:1."},
  {front: "Wohin gehört Effort bei Claude Managed Agents?", back: "In das model-Objekt der versionierten Agentenkonfiguration bei der Erstellung (POST /v1/agents) — nicht pro Sitzung. Eingeführt am 22. Juli 2026."},
]} />

<Quiz title="Teste dich selbst" questions={[
  {q: "Welcher dieser Werte ist KEIN gültiger Effort-Wert in der Messages API?", options: ["low", "medium", "adaptive", "xhigh"], answer: 2, explain: "'adaptive' ist ein Denkmodus, keine Effort-Stufe. Die fünf gültigen Werte sind low, medium, high, xhigh, max."},
  {q: "Du führst eine gecachte Unterhaltung mit 20 Zügen und stellst in Zug 21 den Effort auf OBERSTER Ebene von high auf xhigh um. Was passiert?", options: ["Nichts — Effort ist ein Laufzeit-Hinweis, der den Cache nicht berührt", "Die nächste Anfrage kostet etwas mehr, weil Claude mehr nachdenkt", "Die nächste Anfrage macht den Cache ungültig und liest alle 20 vorherigen Züge zum vollen Eingabepreis neu", "Die API liefert 400, weil sich der Effort mitten in der Unterhaltung nicht ändern lässt"], answer: 2, explain: "Der Effort auf oberster Ebene prägt den gerenderten Prompt, daher macht seine Änderung das Prompt-Caching ungültig wie ein Modellwechsel. Bei langer Historie kann das die Eingabekosten des nächsten Zugs verzehnfachen. Die Form pro Nachricht (eine role:'system'-Nachricht hinter der Beta mid-conversation-output-config-2026-07-01) vermeidet das bei den neuesten Modellen."},
  {q: "Du nutzt Opus 5.5 und lässt den Effort-Parameter ganz weg. Welche Stufe läuft?", options: ["high — der API-Standard bei jedem Modell", "medium — Opus 5.5 ist eines von zwei Modellen mit medium als Standard", "low — ohne Effort sinken die Ausgaben auf ein Minimum", "xhigh — Opus-Modelle haben für Coding xhigh als Standard"], answer: 1, explain: "Opus 5.5 und Haiku 5.5 verwenden medium als Standard; jedes andere Effort-fähige Modell verwendet high. Von Opus 5 übernommener Code läuft daher eine Stufe niedriger als zuvor, sofern du den Effort nicht explizit setzt."},
  {q: "Du bist in Claude Code und willst, dass nur der NÄCHSTE Zug härter nachdenkt, ohne die Effort-Einstellung deiner Sitzung anzufassen. Was ist das Beste?", options: ["/effort max und nach dem Zug /effort auto", "ultrathink für diesen einen Zug nutzen", "Claude Code mit --effort xhigh neu starten", "CLAUDE_CODE_EFFORT_LEVEL=max in einer Subshell setzen"], answer: 1, explain: "ultrathink ist genau das — ein Schub tieferen Schlussfolgerns für einen Zug, der den Sitzungs-Effort nicht ändert und deshalb den Cache in den folgenden Zügen nicht ungültig macht."},
  {q: "Bei Opus 4.8 mit effort='xhigh' werden deine Antworten nach langem Denken immer wieder mit stop_reason='max_tokens' abgeschnitten. Was ist die wahrscheinlichste Lösung?", options: ["Effort auf high senken", "max_tokens auf 64k oder höher erhöhen", "Thinking ausschalten", "Zu Opus 4.7 wechseln"], answer: 1, explain: "max_tokens begrenzt Denken und Antworttext zusammen. Bei xhigh empfiehlt Anthropic, max_tokens bei 64k zu beginnen. Ein Limit, das auf „nur die Antwort“ ausgelegt ist, schneidet Antworten ab, die viel internes Schlussfolgern erfordern."},
  {q: "Wohin gehört Effort, wenn du einen Claude-Managed-Agents-Agenten erstellst (das Update vom Juli 2026)?", options: ["In jede Sitzung bei POST /v1/sessions", "Als Feld auf oberster Ebene von POST /v1/agents", "In das model-Objekt bei POST /v1/agents", "In die Systemnachricht mitten in der Unterhaltung"], answer: 2, explain: "Das Update vom 22. Juli 2026 erlaubt es, 'effort' bei der Agentenerstellung in das model-Objekt zu übergeben. Sitzungen erben den Effort der festgelegten Agentenversion — du setzt ihn nicht pro Lauf."},
  {q: "Welche Änderung sorgt dafür, dass Sonnet 5 'medium' sich am ehesten wie Sonnet 4.6 bei 'high' verhält?", options: ["Sonnet 5 hat ein kleineres Kontextfenster", "Die Effort-Skala hat sich zwischen den beiden Modellen verschoben", "Sonnet 5 deaktiviert bei medium die Tool-Nutzung", "medium wurde bei Sonnet 5 umbenannt"], answer: 1, explain: "Anthropics eigene Empfehlung: Sonnet 5 medium ≈ Sonnet 4.6 high. Übertrage Effort-Stufen bei der Migration nicht 1:1."}
]} />

## Quellen & weiterführende Literatur

- [Anthropic — Effort (build-with-claude/effort)](https://platform.claude.com/docs/en/build-with-claude/effort) — maßgebliche Referenz für die fünf Stufen, `output_config.effort` und die Empfehlungen pro Modell
- [Anthropic — Thinking (build-with-claude/thinking)](https://platform.claude.com/docs/en/build-with-claude/thinking) — wie Effort mit Adaptive Thinking zusammenspielt und wann man welche Steuerung nutzt
- [Anthropic Platform Release Notes — Eintrag vom 22. Juli 2026](https://platform.claude.com/docs/en/release-notes/overview) — die Einführung von `effort` bei Managed Agents und die am selben Tag ausgelieferten Änderungen an Webhooks und Session-Seeding
- [Prompting Claude Sonnet 5 — Effort und Denktiefe kalibrieren](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5) — die Verschiebung der Effort-Skala bei Sonnet 5 und wann man zu xhigh greift
- [Anthropic — Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets) — beratende Token-Budgets für ganze agentische Schleifen, eine Ergänzung zu Effort bei langen Läufen
- [AILmanac — Extended Thinking & Effort](/docs/api/thinking-and-effort) — die einführende Einordnung, die diese Seite voraussetzt
- [AILmanac — Claude Sonnet 5: Der Praxisleitfaden](/docs/models/sonnet-5-field-guide) — die Geschichte von Migration und Neukalibrierung
- [AILmanac — Prompt caching](/docs/api/prompt-caching) — die Cache-Ökonomie, die den Effort-Wechsel mitten in der Unterhaltung so teuer macht


## Weiter

- [Das Advisor-Tool: Sonnet erledigt die Arbeit, Fable denkt](/docs/api/advisor-tool)
