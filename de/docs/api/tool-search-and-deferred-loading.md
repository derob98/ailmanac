# Tool Search & Deferred Loading

> Source: https://derob98.github.io/ailmanac/de/docs/api/tool-search-and-deferred-loading · AILmanac (CC BY 4.0) · last verified 2026-09-29

Auf Tausende Tools skalieren, ohne den Kontext aufzublähen: wie defer_loading und das Tool-Search-Tool tatsächlich funktionieren, die fünf 400er, die sie erzeugen, und warum Ihr Request-Body nicht kleiner wird.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "Das eine verstehen, das fast alle bei defer_loading falsch verstehen — es macht Ihre Anfrage nicht kleiner",
  "Zwischen den Suchvarianten Regex und BM25 wählen und die Obergrenze der Abfragelänge jeder Variante kennen",
  "Das Block-Trio server_tool_use / tool_search_tool_result / tool_reference lesen und genau wissen, was zurückzuspiegeln ist",
  "Die fünf Anfrageformen vermeiden, die einen 400 liefern, einschließlich des cache_control-Konflikts",
  "Deferred Loading in ein MCP-Connector-Toolset einbinden und die eingebaute Suche durch eigene Embeddings ersetzen"
]} />

<VerifyNote lastVerified="2026-09-29" source="https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool">
Die Tool-Versionsstrings (`tool_search_tool_regex_20251119`, `tool_search_tool_bm25_20251119`), die Modell-Support-Tabelle und die numerischen Limits unten sind datierte Fakten. Der Mechanismus — zurückstellen, suchen, expandieren — ist seit dem Launch stabil. Prüfen Sie die Bezeichner und die Modellliste erneut, bevor Sie ausliefern.
</VerifyNote>

## Die zwei Probleme, und warum nur eines mit Geld zu tun hat

Alle Tool-Definitionen vorab zu laden bricht auf zwei getrennte Arten, wenn ein Katalog wächst.

Die erste ist die offensichtliche. Das eigene Beispiel von Anthropic: Ein MCP-Setup mit fünf Servern — GitHub, Slack, Sentry, Grafana, Splunk — verbrennt etwa **55k Tokens für Tool-Definitionen, bevor Claude überhaupt irgendeine Arbeit tut**. Das ist eine Steuer, die Sie in jedem Turn der Konversation zahlen.

Die zweite ist die, die Ihre Architektur tatsächlich verändert: **Die Genauigkeit der Tool-Auswahl sinkt, sobald mehr als 30–50 Tools verfügbar sind.** Darüber hinaus bedeuten mehr Tools nicht mehr Fähigkeit — es bedeutet ein Modell, das aus einer überfüllten Speisekarte wählt. Deferred Loading löst das Kostenproblem und das Genauigkeitsproblem mit demselben Zug, weil das Modell nur die 3–5 Tools sieht, die für die aktuelle Anfrage relevant sind. Anthropic beziffert die Kontextreduktion bei diesem Multiserver-Setup auf **über 85 Prozent**.

Die Wirtschaftlichkeit und die veröffentlichten Genauigkeitsdeltas behandelt AILmanac in [MCP-Token-Kosten](/docs/claude-code/mcp-token-cost). Diese Seite handelt von der Verdrahtung.

## Das mentale Modell, das Leute falsch haben

Hier ist das Missverständnis, das man korrigieren sollte, bevor man Code schreibt:

> `defer_loading` reduziert **nicht**, was Sie senden. Sie legen weiterhin die vollständige Definition jedes Tools — Namen, Beschreibungen, vollständiges `input_schema` — in das `tools`-Array **jeder einzelnen Anfrage**, auch die zurückgestellten.

Ihr HTTP-Request-Body schrumpft nicht. Ihre Upload-Bandbreite ändert sich nicht. Die API braucht diese Definitionen serverseitig, um die Suche auszuführen und die gefundenen Referenzen zu expandieren.

Was sich ändert, ist, was ins **Kontextfenster** gelangt und damit, wofür Sie bezahlen. Zurückgestellte Definitionen sind aus dem System-Prompt-Präfix ausgeschlossen. Entdeckt Claude eine, hängt die API einen `tool_reference`-Block inline an die Konversation und expandiert ihn zur vollständigen Definition, bevor das Modell sie sieht.

Dieses Detail des Inline-Anhängens ist das zweite nicht offensichtliche: Weil die Expansion *in der Konversation* stattfindet und nicht im Präfix, **wird das gecachte Präfix nie invalidiert**. Deferred Loading und Prompt Caching lassen sich kombinieren. Ebenso [Strict Tool Use](/docs/api/tool-use) — die Grammatik, die die Tool-Call-Ausgabe einschränkt, wird aus dem vollständigen Toolset gebaut, es wird also nichts neu kompiliert, wenn mitten in der Konversation ein Tool eintrifft.

## Einschalten

<Steps items={[
  {title: "Ein Such-Tool zum tools-Array hinzufügen", body: "Wählen Sie eine Variante: tool_search_tool_regex_20251119 oder tool_search_tool_bm25_20251119. Es ist ein Server-Tool — es läuft auf der Infrastruktur von Anthropic und braucht keinen Beta-Header."},
  {title: "Den Großteil Ihres Katalogs mit defer_loading: true markieren", body: "Pro Tool-Definition, neben name / description / input_schema. Das ist das Flag, das eine Definition aus dem Präfix heraushält."},
  {title: "Ihre 3–5 meistgenutzten Tools nicht zurückstellen", body: "Alles, was bei den meisten Anfragen aufgerufen wird, sollte vorab geladen werden. Einen Such-Roundtrip zu zahlen, um ein Tool zu erreichen, das Sie immer brauchen, ist ein schlechter Tausch. Mindestens ein Tool MUSS nicht zurückgestellt bleiben — normalerweise das Such-Tool selbst."},
  {title: "Weiterhin jede Definition bei jeder Anfrage senden", body: "Auch die zurückgestellten, und auch bei Folge-Turns nach einem tool_result. Lassen Sie eine weg, wird ein tool_reference, der darauf zeigt, zu einem 400."},
  {title: "Die Such-Blöcke unverändert zurückspiegeln", body: "Reichen Sie bei der nächsten Anfrage den Inhalt des Assistenten unverändert durch — einschließlich server_tool_use und tool_search_tool_result. Die API expandiert Referenzen über die gesamte Historie erneut, sodass Claude entdeckte Tools in späteren Turns wiederverwendet, ohne erneut zu suchen."}
]} />

<PromptCard title="Minimale funktionierende Anfrage — ein Such-Tool, zwei zurückgestellte Tools">
{`curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-opus-5-5",
    "max_tokens": 2048,
    "messages": [{"role": "user", "content": "What is the weather in San Francisco?"}],
    "tools": [
      {
        "type": "tool_search_tool_regex_20251119",
        "name": "tool_search_tool_regex"
      },
      {
        "name": "get_weather",
        "description": "Get the weather at a specific location",
        "input_schema": {
          "type": "object",
          "properties": {
            "location": {"type": "string"},
            "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
          },
          "required": ["location"]
        },
        "defer_loading": true
      },
      {
        "name": "search_files",
        "description": "Search through files in the workspace",
        "input_schema": {
          "type": "object",
          "properties": {
            "query": {"type": "string"},
            "file_types": {"type": "array", "items": {"type": "string"}}
          },
          "required": ["query"]
        },
        "defer_loading": true
      }
    ]
  }'`}
</PromptCard>

Beachten Sie, was das Such-Tool im Präfix kostet: nichts außer seinem eigenen Eintrag. Die beiden zurückgestellten Definitionen stehen im Body, aber nicht im Kontext.

## Regex oder BM25

Beide Varianten durchsuchen dieselben vier Felder — **Tool-Namen, Beschreibungen, Argumentnamen und Argumentbeschreibungen** — und beide sind bei jedem Modell verfügbar, das das Feature unterstützt. Sie unterscheiden sich nur darin, was Claude in die Abfrage schreibt.

| | `tool_search_tool_regex_20251119` | `tool_search_tool_bm25_20251119` |
|---|---|---|
| Claude schreibt | Python-`re.search()`-Muster | Abfragen in natürlicher Sprache |
| Eingabefeld | `pattern` | `query` |
| Maximale Länge | 200 Zeichen | 500 Zeichen |
| Abgleich | Groß-/Kleinschreibung egal | BM25-Ranking |
| Gut, wenn | Ihre Namen Namespaces haben (`github_`, `slack_`) | Ihre Beschreibungen wie Fließtext lesen |

Die Regex-Variante ist die, die man falsch konfiguriert, weil der Name eine Stichwortsuche nahelegt und sie keine ist. Claude schreibt echte Muster: `"weather"`, `"get_.*_data"`, `"database.*query|query.*database"`. Findet das Modell ein erwartetes Tool nicht, testen Sie das Muster selbst, bevor Sie dem Modell die Schuld geben:

<PromptCard title="Einen fehlgeschlagenen Regex-Treffer lokal reproduzieren">
{`import re
# Claude writes broad patterns, e.g. ".*weather.*" — not exact names.
# Search the same four fields the API searches.
haystacks = ["get_weather", "Get the weather at a specific location", "location", "unit"]
print(any(re.search(r"weather", h, re.IGNORECASE) for h in haystacks))`}
</PromptCard>

Die praktische Lösung für einen verpassten Treffer ist fast nie ein cleveres Muster — es sind **Schlüsselwörter in der Beschreibung**. Schreiben Sie die Wörter hinein, die Ihre Nutzer verwenden würden. Geben Sie Ihren Tool-Namen einen Namespace pro Dienst, damit ein Muster eine ganze Gruppe erfasst.

## Die Antwort lesen

Eine erfolgreiche Suche erzeugt im Assistant-Turn drei neue Blocktypen, in dieser Reihenfolge:

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "I'll search for tools to help with the weather information." },
    {
      "type": "server_tool_use",
      "id": "srvtoolu_01ABC123",
      "name": "tool_search_tool_regex",
      "input": { "pattern": "weather", "limit": 10 }
    },
    {
      "type": "tool_search_tool_result",
      "tool_use_id": "srvtoolu_01ABC123",
      "content": {
        "type": "tool_search_tool_search_result",
        "tool_references": [{ "type": "tool_reference", "tool_name": "get_weather" }]
      }
    },
    {
      "type": "tool_use",
      "id": "toolu_01XYZ789",
      "name": "get_weather",
      "input": { "location": "San Francisco", "unit": "fahrenheit" }
    }
  ],
  "stop_reason": "tool_use"
}
```

Drei Regeln für den Umgang damit:

1. **Geben Sie nie ein `tool_result` für die ID `srvtoolu_...` zurück.** Die Suche lief bereits auf den Servern von Anthropic. Antworten Sie darauf, lehnt die API die Anfrage ab. Ihr `tool_result` geht nur an die ID `toolu_...` — ab da gewöhnliche Tool-Nutzung.
2. **Expandieren Sie `tool_reference`-Blöcke nie selbst.** Das tut die API, solange die passende Definition in `tools` vorhanden ist.
3. **Lassen Sie `tool_search_tool_result` unverändert in der Historie.** So erfahren spätere Turns, welche Tools schon entdeckt sind.

Eine Suche ohne Treffer ist **kein** Fehler — Sie erhalten ein `tool_search_tool_search_result` mit leerem `tool_references`-Array, und Claude entscheidet, was als Nächstes geschieht.

Ein stilles Detail zu `limit`: Er steht standardmäßig auf **5** Ergebnisse, aber Claude kann in seiner eigenen Sucheingabe alles von 1 bis 10.000 setzen. Sie steuern ihn nicht direkt. Wenn Sie eine harte Obergrenze dafür brauchen, wie viele Definitionen hereinfluten können, ist das ein Argument für die benutzerdefinierte Implementierung unten.

## Die fünf 400er

Vier davon sind Fehler der Anfrageform, die vor jeder Inferenz auftreten, und einer ist der Konflikt, den niemand erwartet.

<Steps items={[
  {title: "Jedes Tool zurückgestellt", body: "„At least one tool must have defer_loading=false. All tools cannot be deferred.“ Die übliche Ursache ist eine Schleife, die defer_loading: true über das ganze Array stempelt, das Such-Tool eingeschlossen. Stellen Sie das Such-Tool nie zurück."},
  {title: "Eine Referenz ohne Definition", body: "„Tool reference 'unknown_tool' not found in available tools.“ Verursacht dadurch, dass zurückgestellte Definitionen aus Folgeanfragen herausgekürzt werden, um Bytes zu sparen. Senden Sie das vollständige Array in jedem Turn."},
  {title: "defer_loading zusammen mit cache_control am selben Tool", body: "Ein zurückgestelltes Tool kann keinen Cache-Breakpoint tragen — die API liefert einen 400. Setzen Sie den Breakpoint stattdessen auf ein nicht zurückgestelltes Tool. Das ist der, der Teams trifft, die ihr Caching schon abgestimmt hatten."},
  {title: "defer_loading auf Ebene des Toolset-Eintrags", body: "Die Toolsets für Computer Use und Browser Use (computer_toolset_20260801, browser_toolset_20260801) nehmen defer_loading pro Mitglieds-Tool im configs-Objekt des Eintrags. Es am Eintrag selbst zu setzen wird abgelehnt."},
  {title: "Mitglieder eines Toolsets widersprechen sich", body: "Weil ein Toolset als Einheit zurückstellt und expandiert, muss defer_loading bei jedem aktivierten Mitglied denselben Wert ergeben. Entdecken Sie das Toolset, werden alle aktivierten Mitglieder auf einmal geladen — es gibt keine teilweise Expansion."}
]} />

Suchfehler *während* der Ausführung sind anders: Sie kommen mit HTTP **200** zurück, mit dem Fehler in einem Objekt `tool_search_tool_result_error`.

| `error_code` | Was passiert ist |
|---|---|
| `invalid_tool_input` | Fehlerhafter Regex oder ein Muster über dem 200-Zeichen-Limit |
| `unavailable` | Die Suche konnte nicht laufen — Timeout oder Dienst nicht verfügbar |
| `too_many_requests` | Rate Limit speziell für Tool-Search-Operationen |
| `execution_time_exceeded` | Die Suche hat ihr Ausführungszeitlimit überschritten |

Behandeln Sie diese als behebbar: Die Konversation ist intakt, und der ehrliche Zug ist meist, Claude mit einem anderen Muster erneut versuchen zu lassen, statt den ganzen Turn scheitern zu lassen. Die umgebende Retry-Richtlinie siehe [Fehler & Rate Limits](/docs/api/errors-and-rate-limits).

## Prompt Caching

Die Schlagzeile ist gut: Zurückgestellte Definitionen liegen außerhalb des gecachten Präfix, das Hinzufügen und Entdecken von Tools mitten in der Konversation invalidiert es also nicht. Die Präfix-Regeln siehe [Prompt Caching](/docs/api/prompt-caching), und [Cache diagnostics](/docs/api/cache-diagnostics), wenn Sie einen Treffer belegen müssen.

Die Falle ist die oben genannte — `defer_loading: true` und `cache_control` schließen sich an einem einzelnen Tool gegenseitig aus. Wenn Ihr Breakpoint derzeit am letzten Tool eines langen Arrays sitzt und Sie dieses Array dann zurückstellen, sind Sie stillschweigend von „gecacht“ zu „400“ gewechselt. Verankern Sie den Breakpoint an einem Tool, das Sie ohnehin immer geladen halten wollten.

## MCP-Connector: am Toolset setzen, nicht am Tool

Wenn Tools über den [MCP-Connector](/docs/api/mcp) von Remote-Servern eintreffen, fassen Sie einzelne Definitionen nicht an — sie gehören Ihnen nicht. Konfigurieren Sie es am Eintrag `mcp_toolset`: einmal für den ganzen Server über `default_config` oder pro Tool in `configs`.

<PromptCard title="Einen ganzen MCP-Server zurückstellen, bis auf das eine Tool, das Sie immer brauchen">
{`{
  "type": "mcp_toolset",
  "mcp_server_name": "observability",
  "default_config": { "defer_loading": true },
  "configs": {
    "search_events": { "defer_loading": false }
  }
}`}
</PromptCard>

Das ist die Form, die sich in der Praxis am schnellsten auszahlt: Mehrere Server zu aggregieren ist genau die Situation mit über 200 Tools, für die das Feature existiert, und fast immer gibt es ein oder zwei Einstiegs-Tools, die es wert sind, warm gehalten zu werden.

## Die Suche durch eine eigene ersetzen

Beide eingebauten Varianten sind lexikalisch. Wenn Ihre Tools besser nach Bedeutung als nach Wortlaut zu finden sind, implementieren Sie die Suche selbst: Definieren Sie ein gewöhnliches benutzerdefiniertes Tool und geben Sie `tool_reference`-Blöcke in einem normalen `tool_result` zurück.

<PromptCard title="Ein clientseitiges Suchergebnis, das die API expandiert">
{`{
  "type": "tool_result",
  "tool_use_id": "toolu_your_tool_id",
  "content": [
    { "type": "tool_reference", "tool_name": "discovered_tool_name" }
  ]
}`}
</PromptCard>

Jeder Name, den Sie referenzieren, braucht weiterhin seine vollständige Definition im `tools`-Array der obersten Ebene, normalerweise mit `defer_loading: true`. Der Expansionspfad ist identisch — Sie haben nur das Retrieval ausgetauscht. Beachten Sie den Formatunterschied: `tool_search_tool_result` ist die *serverseitige* Form, intern zu den eingebauten Varianten. Ihr benutzerdefiniertes Tool gibt die oben gezeigte Standardform `tool_result` zurück. Anthropic veröffentlicht ein [durchgespieltes Embeddings-Rezept](https://platform.claude.com/cookbook/tool-use-tool-search-with-embeddings).

Das ist auch Ihr Notausgang für das `limit`-Problem: Ihre eigene Suche entscheidet, wie viele Referenzen zurückkommen.

## Wann man es weglässt

Deferred Loading bringt nichts — und kostet einen Such-Roundtrip —, wenn die Prämisse nicht zutrifft. Greifen Sie danach, wenn **irgendeines** davon zutrifft:

- 10 oder mehr verfügbare Tools
- Tool-Definitionen über etwa 10k Tokens
- Auswahlgenauigkeit sinkt sichtbar, wenn der Katalog wächst
- mehrere aggregierte MCP-Server (über 200 Tools)
- eine Tool-Bibliothek, die weiter wächst

Bleiben Sie beim einfachen Tool Calling, wenn Sie weniger als 10 Tools haben, oder jedes Tool bei jeder Anfrage genutzt wird, oder der gesamte Katalog unter etwa 100 Tokens liegt. Und beachten Sie die Abrechnungsform: **Tool Search wird nicht als separates Server-Tool bemessen.** Es gibt kein Tool-Search-Feld in `usage.server_tool_use`. Die einzigen Tokens, die es kostet, sind die Definitionen, die es in den Kontext zieht, bepreist wie jede andere Tool-Definition.

Die harten Obergrenzen, für die Kapazitätsplanung: **10.000 zurückgestellte Tools pro Anfrage**, 200-Zeichen-Regex-Muster, 500-Zeichen-BM25-Abfragen.

## Plattformhinweise

Zwei Deployment-Fußnoten, die leicht einen Tag kosten. Auf **Amazon Bedrock** funktioniert serverseitiges Tool Search nur über die InvokeModel API — nicht über die Converse API. Auf **Claude Platform on AWS** verhält es sich genau wie in der Claude API, weil dieser Pfad die Messages API direkt nutzt und keine Aufteilung in InvokeModel/Converse hat. Claude Opus 4.1 und früher unterstützen das Feature überhaupt nicht.

<Flashcards title="Vokabular zu Tool Search" cards={[
  {front: "defer_loading", back: "Boolean pro Tool. Hält eine Definition aus dem System-Prompt-Präfix heraus, bis Claude sie per Suche entdeckt. Ändert NICHT, was Sie hochladen — Sie senden weiter jede Definition bei jeder Anfrage."},
  {front: "tool_reference", back: "Ein leichtgewichtiger Zeiger, den die API inline an die Konversation hängt, wenn eine Suche trifft. Die API expandiert ihn zur vollständigen Definition, bevor Claude ihn sieht. Sie expandieren ihn nie selbst."},
  {front: "server_tool_use", back: "Claudes Aufruf des Such-Tools, mit einer srvtoolu_-ID. Er wurde bereits auf den Servern von Anthropic ausgeführt — ein tool_result für diese ID zurückzugeben lässt die API Ihre Anfrage ablehnen."},
  {front: "tool_search_tool_result", back: "Der Block mit den Suchergebnissen, der ein Objekt tool_search_tool_search_result mit einem tool_references-Array umschließt. Unverändert zurückspiegeln; so verwenden spätere Turns entdeckte Tools wieder."},
  {front: "Regex- vs. BM25-Variante", back: "regex_20251119: Claude schreibt Python-re.search()-Muster, max. 200 Zeichen, Groß-/Kleinschreibung egal. bm25_20251119: Abfragen in natürlicher Sprache, max. 500 Zeichen. Beide durchsuchen Namen, Beschreibungen, Argumentnamen und Argumentbeschreibungen."},
  {front: "Der cache_control-Konflikt", back: "Ein Tool kann nicht zugleich defer_loading: true sein und cache_control tragen — 400. Setzen Sie den Cache-Breakpoint auf ein Tool, das geladen bleibt."},
  {front: "defer_loading bei Toolsets", back: "computer_toolset_20260801 / browser_toolset_20260801 nehmen das Flag pro Mitglied innerhalb von configs, nie am Eintrag. Es muss bei allen aktivierten Mitgliedern identisch sein, und das ganze Toolset expandiert auf einmal."},
  {front: "limit", back: "Optionale Ganzzahl in Claudes Sucheingabe, 1 bis 10.000, Standard 5. Begrenzt, wie viele passende Tools eine Suche zurückgibt. Sie setzen ihn nicht — Claude tut es."}
]} />

<Quiz title="Prüfen Sie sich selbst" questions={[
  {q: "Sie setzen defer_loading: true bei 400 Ihrer 405 Tools. Was passiert mit der Größe des JSON, das Sie per POST senden?", options: ["Sie sinkt um etwa 99 Prozent — zurückgestellte Definitionen entfallen", "Sie bleibt unverändert: Sie senden weiter jede vollständige Definition, zurückgestellt oder nicht", "Sie sinkt nur bei Folgeanfragen nach der ersten Suche"], answer: 1, explain: "defer_loading steuert, was ins Kontextfenster gelangt, nicht, was Sie übertragen. Die API braucht jede Definition serverseitig, um die Suche auszuführen und Referenzen zu expandieren. Ihre abgerechneten Input-Tokens sinken; Ihr Request-Body nicht."},
  {q: "Eine Schleife stempelt defer_loading: true über Ihr gesamtes tools-Array. Was liefert die API?", options: ["200, wobei das Such-Tool stillschweigend für Sie nicht zurückgestellt wird", "Einen 400: mindestens ein Tool muss defer_loading=false haben", "200, aber Claude kann nie ein Tool finden"], answer: 1, explain: "„At least one tool must have defer_loading=false. All tools cannot be deferred.“ Normalerweise ist das nicht zurückgestellte das Such-Tool selbst — stellen Sie das nie zurück."},
  {q: "Ihre Antwort enthält einen server_tool_use-Block mit der id srvtoolu_01ABC und einen tool_use-Block mit der id toolu_01XYZ. Was senden Sie zurück?", options: ["Ein tool_result für jede ID", "Nur ein tool_result für srvtoolu_01ABC", "Nur ein tool_result für toolu_01XYZ, wobei die Such-Blöcke unverändert zurückgespiegelt werden"], answer: 2, explain: "Die Suche lief bereits auf der Infrastruktur von Anthropic. Ein tool_result für die srvtoolu_-ID zurückzugeben lässt die API die Anfrage ablehnen. Spiegeln Sie server_tool_use und tool_search_tool_result wörtlich zurück und beantworten Sie nur den echten Tool-Aufruf."},
  {q: "Sie hatten bereits einen Cache-Breakpoint am letzten Tool Ihres Arrays. Jetzt stellen Sie dieses Array zurück. Was bricht?", options: ["Nichts — zurückgestellte Tools werden separat gecacht", "Ein 400: defer_loading und cache_control können nicht an einem Tool koexistieren", "Der Cache trifft stillschweigend nicht mehr"], answer: 1, explain: "Ein zurückgestelltes Tool kann kein cache_control tragen; die API liefert einen 400. Verschieben Sie den Breakpoint auf ein Tool, das nicht zurückgestellt bleibt. Zurückgestellte Definitionen liegen ohnehin außerhalb des gecachten Präfix, was Ihren Cache über Entdeckungen hinweg erhält."},
  {q: "Claude findet Ihre Grafana-Tools mit der Regex-Variante immer wieder nicht. Bester erster Schritt?", options: ["Auf ein Exact-Match-Muster wechseln", "Die Schlüsselwörter, die Nutzer tatsächlich sagen, in die Tool-Beschreibungen schreiben und die Namen mit dem Präfix grafana_ versehen", "Das limit über 5 anheben"], answer: 1, explain: "Die Suche deckt Namen, Beschreibungen, Argumentnamen und Argumentbeschreibungen ab — und Claude schreibt breite Muster wie \".*grafana.*\", keine exakten Treffer. Auffindbarkeit ist ein Schreibproblem: Bringen Sie das Vokabular des Nutzers in die Beschreibung und geben Sie den Namen einen Namespace, damit ein Muster die Gruppe erfasst."},
  {q: "Wie wird Tool Search abgerechnet?", options: ["Pro Suche, wie Web-Suche", "Nicht separat bemessen — Sie zahlen nur für die Definitionen, die es in den Kontext lädt", "Eine monatliche Pauschale pro zurückgestelltem Tool"], answer: 1, explain: "Es gibt kein Tool-Search-Feld in usage.server_tool_use. Die einzigen Kosten sind die Tool-Definitionen, die die Suche in den Kontext zieht, bepreist wie alle anderen Input-Tokens."}
]} />

## Quellen & weiterführende Literatur

- [Tool search tool — Claude Platform docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool) — die zwei Varianten und ihre Versionsstrings, die Semantik von `defer_loading`, die Zahl von ~55k Tokens beim Multiserver-Setup und die 85-Prozent-Reduktion, die Genauigkeitsklippe bei 30–50 Tools, die Formen der Antwortblöcke, alle fünf 400er, die vier `error_code`-Werte, die Obergrenze von 10.000 Tools, der Bedrock-InvokeModel-Hinweis und die Modell-Support-Tabelle.
- [Tool use with prompt caching — Claude Platform docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-use-with-prompt-caching) — was einen Cache von Tool-Definitionen invalidiert und warum die zurückgestellte Menge außerhalb des Präfix liegt.
- [MCP connector — Claude Platform docs](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) — Form von `mcp_toolset`, `default_config` und `configs` pro Tool.
- [Tool reference — Claude Platform docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference) — Client-Toolsets und das `configs`-Format, das die Computer-/Browser-Toolsets verlangen.
- [Tool search with embeddings — Anthropic cookbook](https://platform.claude.com/cookbook/tool-use-tool-search-with-embeddings) — eine vollständige benutzerdefinierte, semantische Implementierung, die `tool_reference`-Blöcke zurückgibt.
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) — Anthropic Engineering, der Launch-Beitrag hinter den veröffentlichten Token- und Genauigkeitszahlen.
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — das Just-in-time-Retrieval-Prinzip, dessen Instanz Deferred Loading ist.
- Verwandt auf AILmanac: [Tool Use / Function Calling](/docs/api/tool-use) · [Programmatic Tool Calling](/docs/api/programmatic-tool-calling) · [MCP](/docs/api/mcp) · [MCP-Token-Kosten](/docs/claude-code/mcp-token-cost) · [Prompt Caching](/docs/api/prompt-caching) · [Cache diagnostics](/docs/api/cache-diagnostics)

## Weiter

- [Programmatic Tool Calling](/docs/api/programmatic-tool-calling) — die andere Hälfte fortgeschrittener Tool-Nutzung: Die Suche findet das richtige Tool, Programmatic Calling führt es aus, ohne Ergebnisse durch den Kontext zu schleppen.
- [MCP-Token-Kosten](/docs/claude-code/mcp-token-cost) — die Wirtschaftlichkeit und die veröffentlichten Genauigkeitsdeltas hinter diesem Feature.
- [Memory & Context Editing](/docs/api/memory-and-context-editing) — was zu tun ist, wenn die *Ergebnisse* Ihren Kontext füllen, sobald die Definitionen erledigt sind.
