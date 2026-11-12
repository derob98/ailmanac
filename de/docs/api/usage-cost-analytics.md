# Die Usage-&-Cost-Analytics-API: jeden Dollar zuordnen

> Source: https://derob98.github.io/ailmanac/de/docs/api/usage-cost-analytics · AILmanac (CC BY 4.0) · last verified 2026-11-02

Der praktische Leitfaden zur Usage-and-Cost-Analytics-API von Claude — die Beta, die die älteren Endpunkte usage_report und cost_report abgelöst hat. Zeilenform, das Limit von fünf Dimensionen, die Semantik der Akteure, die Cent-Falle (Faktor 100), Regeln zur Datenaktualität, die naive Dashboards brechen, und die Migrationstabelle vom Legacy-Stand.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "Was usage_report und cost_report abgelöst hat und warum die neue Form aus Zeilen statt aus Zeit-Buckets besteht",
  "Der Zeilenvertrag: starting_at / ending_at, group und usage oder cost — und warum eine Dimension null ist, solange du nicht danach gruppierst",
  "group_by[] nimmt fünf Dimensionen — außer den zwei am Cost-Endpunkt, die nicht zählen und limit nicht beachten",
  "Das Akteursmodell: Benutzer, Servicekonto, föderierte Cloud-Identität oder der API-Schlüssel selbst — und warum api_key_ids[] und actor_ids[] unterschiedliche Fragen beantworten",
  "Die Cent-Falle: amount ist ein Dezimalstring in CENT, also ist \"41280.000000\" gleich 412,80 $ und ein naives Dashboard liegt um den Faktor 100 daneben",
  "Regeln zur Datenaktualität, die ein Dashboard für den laufenden Tag ungültig machen, und der Trick für Ergebnisse, die sich zwischen Aufrufen nicht ändern",
  "Das Ein-Zeilen-Rezept für die Claude-Code-Kosten pro Benutzer",
]} />

<VerifyNote lastVerified="2026-11-02" source="https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api">
Die Usage-and-Cost-Analytics-API ist **Beta**: Sende bei jeder Anfrage `anthropic-beta: analytics-usage-cost-2026-08-24` plus einen `anthropic-version`-Header. Anthropic hat die bisherige Usage-and-Cost-API und die Claude-Enterprise-Analytics-Endpunkte am **29. Oktober 2026 als Legacy** gekennzeichnet — weiterhin unterstützt, nicht entfernt. Endpunktpfade, Dimensionsnamen, Limits und das centbasierte `amount`-Format stammen aus dem offiziellen Leitfaden und den API-Referenzen zu [usage](https://platform.claude.com/docs/en/api/beta/organization/analytics/usage/list) und [cost](https://platform.claude.com/docs/en/api/beta/organization/analytics/cost/list). Die Preise selbst stehen unter [Aktuelle Modelle & Preise](/docs/whats-new/models-and-pricing).
</VerifyNote>

Zwei Endpunkte, eine Aufgabe: Sie sagen dir, wohin deine Claude-Ausgaben tatsächlich geflossen sind.

- `GET /v1/organizations/analytics/usage` — Token-Zahlen und Anfragezahlen.
- `GET /v1/organizations/analytics/cost` — Kosten in USD.

Für eine Claude-Console-Organisation entspricht das grob dem, was die Seiten **Usage** und **Cost** der Console zeigen, mit den Dimensionen, die du wählst, statt der von ihnen gewählten. Der Grund, warum es darauf ankommt, ist die Frage, die niemand aus der Console beantworten kann: *Welcher meiner Kunden, Agenten oder API-Schlüssel ist für die Zeile verantwortlich, die gestiegen ist?*

:::tip[Das ist Reporting, keine Durchsetzung]
Nichts hiervon stoppt eine Rechnung. Dafür siehe [Harte Ausgabenlimits](/docs/models/hard-spend-caps) — und beachte, dass beides einander ergänzt: Limits entscheiden, *ob* die Ausgabe stattfindet, diese API sagt dir, *wer* sie verursacht hat.
:::

## Zugangsdaten, nach Organisationstyp

| Organisation | Was zu verwenden ist |
| --- | --- |
| Claude Console | Ein [Admin-API-Schlüssel](https://platform.claude.com/docs/en/manage-claude/admin-api-keys) oder ein OAuth-Bearer-Token mit dem Scope `org:admin` (gesendet als `authorization: Bearer`, nicht `x-api-key`) |
| Claude Enterprise | Ein Schlüssel mit dem Scope `read:analytics`, vom primären Owner in claude.ai erstellt, **nachdem** die Analytics-API für die Organisation aktiviert wurde |

Gib dem Collector-Dienst einen eigenen Schlüssel, bewahre ihn in einem Secrets-Manager auf und setze ein [Ablaufdatum für den Schlüssel](https://platform.claude.com/docs/en/manage-claude/authentication#key-expiration), damit die Rotation erzwungen statt nur erinnert wird. Wo verfügbar, ist eine Workload-Identity-Federation-Regel mit `org:admin` eindeutig besser — kurzlebige Tokens, kein langlebiges Geheimnis, das abfließen könnte. Dieselbe Überlegung gilt für die [Admin-API](/docs/api/admin-api) allgemein.

## Schnellstart

<PromptCard title="Tägliche Token-Nutzung nach Modell, eine Woche">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/usage?\\
starting_at=2026-09-01T00:00:00Z&\\
ending_at=2026-09-08T00:00:00Z&\\
time_bucket_width=1d&\\
group_by[]=model&\\
limit=100" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

`--globoff` ist wichtig: Ohne es versucht curl, das `[]` in `group_by[]` als Glob-Bereich zu interpretieren.

## Der Zeilenvertrag

Das ist der Teil, an dem Leute beim Wechsel von den alten Endpunkten stolpern, denn die Antwort ist absichtlich anders geformt.

<Steps items={[
  {title: "Jede Zeile hat drei Teile", body: "starting_at und ending_at geben den von der Zeile abgedeckten Zeitraum an, group enthält jede Dimension, und usage (am Cost-Endpunkt cost) enthält die Metriken. Dimensionen und Metriken stehen in getrennten Objekten — sie liegen nicht nebeneinander wie im Legacy-Report."},
  {title: "Eine Dimension ist null, solange du nicht danach gruppierst", body: "group enthält immer jede Dimension, aber jede ist null, solange sie nicht in group_by[] vorkommt. Eine gruppierte Dimension ist AUCH in Zeilen null, die dafür keinen Wert haben — die Nutzung der Codeausführung hat zum Beispiel model: null. group_by[] nimmt bis zu fünf Dimensionen."},
  {title: "Eine Zeile pro Kombination, die Daten hat", body: "Jede Zeile ist eine Kombination der gruppierten Dimensionen, und jede Kombination mit Nutzung oder Kosten erscheint über die Seiten einer Abfrage hinweg genau einmal. Kombinationen ohne Inhalt erzeugen überhaupt keine Zeile. Ohne group_by[] und ohne time_bucket_width erhältst du eine einzige Zeile mit der Summe über den gesamten Bereich."},
  {title: "Zeit-Buckets sind Opt-in", body: "Setze time_bucket_width auf 1m, 1h oder 1d, um jede Kombination nach UTC-Bucket aufzuteilen; starting_at und ending_at jeder Zeile begrenzen dann ihren Bucket. Es gibt keinen Standardwert — lass ihn weg, um Summen über den gesamten Bereich zu erhalten. Leere Buckets erzeugen keine Zeilen."},
  {title: "Zeilen sind nach Rang geordnet, nicht chronologisch", body: "Standardmäßig kommen Zeilen nach der order_by-Metrik über den gesamten Bereich geordnet zurück, die größte zuerst (order=asc kehrt um). Für eine Zeitreihe setzt du time_bucket_width UND order_by=time: Die Zeilen kommen dann Bucket für Bucket, standardmäßig der neueste zuerst, mit den größten Zeilen zuerst innerhalb jedes Buckets. Leere Buckets füllst du selbst mit Nullen auf."},
  {title: "Filter sind unabhängig von der Gruppierung", body: "Die meisten gruppierbaren Dimensionen haben einen passenden Listenfilter in Klammernotation, z. B. models[]=claude-opus-5-5. Wiederhole den Parameter für mehrere Werte, bis zu 100 pro Filter. Mehrere Werte in einem Filter sind ODER; verschiedene Filter sind UND. Du kannst nach einer Dimension filtern, ohne danach zu gruppieren, oder umgekehrt."},
]} />

`order_by` am Usage-Endpunkt akzeptiert `total_tokens` (Standard), `output_tokens`, `uncached_input_tokens`, `requests` oder `time`. Am Cost-Endpunkt: `amount` (Standard), `list_amount` oder `time`.

:::warning[Standardmäßig nach Rang geordnet ist der stille Dashboard-Fehler]
Wenn du einen Bereich anforderst und die Zeilen in der Reihenfolge ihres Eintreffens aufträgst, erhältst du ein nach Größe sortiertes Balkendiagramm, das *wie* eine Zeitreihe *aussieht*. Chronologische Zeilen bekommst du nur, wenn du **beides** setzt: `time_bucket_width` und `order_by=time`.
:::

### Nicht jede Dimension gilt für dich

`model` und `actor` gelten für jede Organisation. `api_key_id` gibt es nur in der Console. `slack_channel_id` gibt es nur in Enterprise. Eine Dimension, die nicht zutrifft, ist in jeder Zeile `null`, und ihr Filter trifft nichts — **stillschweigend**. Die einzige Ausnahme ist `rbac_group_id`, das stattdessen einen Fehler liefert, wenn Teams für deine Organisation nicht verfügbar sind.

Und eine Verhaltensänderung, die man sich an die Wand hängen sollte: In der Legacy-API lieferte ein unbekannter API-Schlüssel oder eine unbekannte Workspace-ID einen Fehler. Hier **trifft er nichts**, einschließlich eines falsch geschriebenen `models[]`-Werts. Ein leeres Ergebnis ist jetzt die normale Antwort auf einen Tippfehler.

## Akteure: wer die Kosten zugeordnet bekommt

Die Dimension `actor` gibt an, wem eine Anfrage zugeordnet wird — einem Benutzer, einem Servicekonto, einer föderierten Cloud-Identität (einem AWS- oder Google-Cloud-Principal, bei Organisationen, die Claude über ihre Cloud-Plattform erreichen) oder, wenn nichts davon dahintersteht, **dem API-Schlüssel selbst**. Gruppierst du nach `actor`, ist das `actor` jeder Zeile ein Objekt, dessen `type` angibt, um welche Art es sich handelt. Nutzung, die keiner Identität zuzuordnen ist, hat `actor: null`.

Die Zuordnungsregeln:

- **Persönliche Schlüssel und Servicekonto-Schlüssel** handeln als der Benutzer oder das Servicekonto, mit dem sie verknüpft sind: Die Identität steht in `actor`, der Schlüssel in `api_key_id`.
- **Legacy-Workspace-Schlüssel** sind nicht mit einer Identität verknüpft, daher erscheint der Schlüssel **sowohl** als `actor` **als auch** als `api_key_id`.
- **Ein Schlüssel, den Claude Code beim Anmelden für ein Mitglied erstellt**, liegt im Claude-Code-Workspace, und seine Nutzung wird diesem Mitglied zugeordnet.
- **Anfragen ganz ohne API-Schlüssel** — aus der Console, aus Claude Code nach einer Anmeldung ohne API-Schlüssel oder mit einem Workload-Identity-Federation-Token — haben `api_key_id: null`. Der `actor` ist weiterhin das angemeldete Mitglied oder, bei einer föderierten Workload, deren Servicekonto.

:::tip[Zwei Filter, zwei verschiedene Fragen]
`api_key_ids[]=apikey_…` trifft jede Anfrage, die **dieser Schlüssel authentifiziert hat**, egal, wem sie zugeordnet ist. `actor_ids[]=apikey_…` trifft nur Anfragen, die **dem Schlüssel selbst zugeordnet** sind. Sie sind nicht austauschbar, und wer sie verwechselt, bekommt ein Audit mit Lücken. Um Nutzung ohne Schlüssel in einen `api_key_ids[]`-Filter aufzunehmen, füge einen **leeren Eintrag** hinzu: `api_key_ids[]=`.
:::

## Der Cost-Endpunkt und die Faktor-100-Falle

Der Cost-Endpunkt nimmt dieselben Filter, Dimensionen und Zeit-Buckets wie `/usage`. Das `cost`-Objekt jeder Zeile enthält:

| Feld | Bedeutung |
| --- | --- |
| `amount` | Kosten nach Rabatten, **vor** Anrechnung von Guthaben |
| `list_amount` | Kosten zu Listenpreisen |
| `currency` | Immer `"USD"` |
| `requests` | Anzahl der Anfragen |

:::warning[amount ist in CENT, nicht in Dollar]
`currency` sagt `"USD"`, aber die Zahl ist ein Dezimalstring **in Cent mit sechs Nachkommastellen**. `"41280.000000"` sind **412,80 $**, nicht 41.280 $. Der Legacy-Kostenreport lieferte dollarähnliche Strings wie `"123.45"`; derselbe Wert ist hier `"12345.000000"`. Teile durch 100, bevor du irgendetwas darstellst, und schreibe den Test — das ist ein Fehler um den Faktor 100, der das Code-Review passiert, weil das Feld `amount` heißt und das Währungsfeld Dollar sagt.
:::

Zwei Dimensionen gibt es **nur** am Cost-Endpunkt, und beide brechen die üblichen Regeln zu deinen Gunsten: `group_by[]=cost_type` teilt jede Zeile nach Kostenart auf, und `group_by[]=token_type` teilt die Token-Kosten nach Token-Art auf. Keine von beiden zählt zum Limit von fünf Dimensionen, und keine beachtet `limit` — daher kann eine Seite legitim **mehr** Zeilen als `limit` enthalten.

<PromptCard title="Wohin das Geld ging: Kosten nach Modell, Kostenart und Token-Art für einen Monat">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/cost?\\
starting_at=2026-09-01T00:00:00Z&\\
ending_at=2026-10-01T00:00:00Z&\\
group_by[]=model&\\
group_by[]=cost_type&\\
group_by[]=token_type" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

Diese eine Abfrage ist bei jeder Organisation die erste, die man ausführen sollte, denn sie beantwortet die Frage, bei der die meisten Teams raten: **Wie viel der Rechnung ist gar keine Inferenz.** Die Aufteilung nach `cost_type` trennt Token-Ausgaben von serverseitigen Tools; die Aufteilung nach `token_type` trennt Cache-Lesezugriffe von nicht gecachtem Input und Output. Dominieren Cache-Lesezugriffe deine Input-Zeile, sind [Prompt Caching](/docs/api/prompt-caching) und [Cache-Diagnose](/docs/api/cache-diagnostics) die nächste Station; dominieren Output-Token, ist es [Token-Verbrauch senken](/docs/power-user/token-economy).

<PromptCard title="Claude-Code-Kosten pro Benutzer, in einer Abfrage">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/cost?\\
starting_at=2026-10-01T00:00:00Z&\\
ending_at=2026-11-01T00:00:00Z&\\
products[]=claude_code&\\
group_by[]=actor" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

Console-Organisationen haben dafür eine zweite Option — die dedizierte [Claude Code Analytics API](https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api), die die Claude-Code-Aktivität pro Benutzer zusammen mit den geschätzten Kosten meldet.

## Datumsbereiche und die Rundung, die niemand erwartet

- Zeitstempel sind RFC 3339 mit UTC-Offset (`2026-09-01T00:00:00Z`). **`starting_at` ist inklusiv, `ending_at` ist exklusiv.**
- `starting_at` muss **am oder nach dem 1. Januar 2026** liegen und **innerhalb der letzten 365 Tage**.
- Eine Anfrage umfasst **höchstens 31 Tage**. `ending_at` ist standardmäßig 31 Tage nach `starting_at` oder jetzt, je nachdem, was früher liegt. Teile längere Bereiche in mehrere Anfragen auf.
- `ending_at` ist **Pflicht**, sobald `time_bucket_width` gesetzt ist, und bei `time_bucket_width=1m` beträgt die Spanne **höchstens 24 Stunden**.
- **Beide Enden werden *abgerundet*** auf eine Bucket-Grenze — oder auf die volle Stunde, wenn `time_bucket_width` nicht gesetzt ist. Bei `1h`-Buckets wird `starting_at=2026-09-01T10:43:00Z` zu `10:00:00Z` und `ending_at=2026-09-01T15:43:00Z` zu `15:00:00Z`, sodass die Antwort 10:00–15:00 UTC abdeckt. Eine naiv geschriebene Abfrage „letzte 90 Minuten“ liefert eine Stunde.

## Datenaktualität bringt Dashboards zum Scheitern

Jede Antwort trägt einen Zeitstempel `data_refreshed_at`. Nutzung nach diesem Zeitpunkt fehlt oder ist **unvollständig**. Gibt es für keinen Teil des Bereichs schon Daten, ist `data_refreshed_at` gleich `null` und `data` leer.

| Eigenschaft | Wert |
| --- | --- |
| Typische Verzögerung der Aktualisierung | Innerhalb von **4 Stunden** nach der zugrunde liegenden Nutzung |
| Schlimmster Fall | Bis zu **24 Stunden** |
| Revisionsfenster | Werte können sich ändern, wenn verspätete Ereignisse und Abstimmungen eintreffen, bis **etwa 7 Tage nach Ende des Kalendermonats** |
| Paginierung | Jede Seite einer paginierten Abfrage liest **denselben Snapshot**, daher ist `data_refreshed_at` auf allen Seiten identisch |

In der Praxis: Die Zahlen vom 1. Oktober können sich noch bis etwa zum 7. November ändern.

Das ist ein echter Rückschritt gegenüber der Legacy-API, bei der Daten typischerweise innerhalb von **5 Minuten** erschienen, und es verändert, was du bauen kannst. Daraus folgen direkt zwei Regeln:

- **Für Ergebnisse, die sich zwischen Aufrufen nicht ändern**, setze `ending_at` auf oder vor ein `data_refreshed_at`, das du bereits gesehen hast.
- **Für endgültige Summen** frage nur Monate ab, die mindestens **7 Tage** zurückliegen.

:::warning[Baue darauf keine Echtzeit-Alarme]
Ein Alarm bei Kostenspitzen mit 4–24 Stunden Verzögerung ist kein Alarm. Nutze die API für Zuordnung, Chargeback und Trend-Reporting; nutze [Ausgabenlimits](/docs/models/hard-spend-caps) für den Teil, der in Minuten reagieren muss, und [OpenTelemetry-Tracing](/docs/api/opentelemetry-tracing) für nahezu Echtzeit-Einblick pro Anfrage — und bedenke, dass Traces Best-Effort und at-least-once sind, sodass die Analytics-API, nicht deine Traces, das Hauptbuch ist.
:::

## Migration von `usage_report` und `cost_report`

Was übernommen wird: dein Admin-API-Schlüssel, der Header `anthropic-version`, `starting_at` / `ending_at`, die Bucket-Breiten (`1m`, `1h`, `1d`), die Klammernotation, die Paginierungsfeldnamen sowie die Token- und Kostenfeldnamen. Was sich ändert:

| Legacy-Usage-&-Cost-API | Usage-&-Cost-Analytics-API |
| --- | --- |
| Kein Beta-Header | `anthropic-beta: analytics-usage-cost-2026-08-24` bei jeder Anfrage |
| Daten innerhalb von ~5 Minuten | Typisch 4 Stunden, bis zu 24, revidiert bis ~7 Tage nach Monatsende |
| `data` sind Zeit-Buckets (älteste zuerst, leere eingeschlossen), jeder mit einer `results`-Liste, die Dimensionen und Metriken mischt | `data` sind nach `order_by` geordnete Zeilen, jede mit eigenem `starting_at` / `ending_at`, Dimensionen in `group`, Metriken in `usage` oder `cost`. Keine Zeile für eine leere Kombination |
| `bucket_width`, Standard `1d` | `time_bucket_width`, **kein Standard** — übergib `1d`, um tägliche Zeilen zu behalten, lass es weg für Summen über den gesamten Bereich |
| `limit` zählt Zeit-Buckets pro Seite | `limit` zählt **Zeilen** pro Seite (1–1.000, Standard 20), sodass die Seitenzahl davon abhängt, wie viele Kombinationen Daten haben |
| Beliebiger Datumsbereich, bucketweise vorwärts paginiert | `starting_at` ≥ 1. Jan. 2026 und innerhalb von 365 Tagen; ≤ 31 Tage pro Anfrage; `ending_at` bei Buckets Pflicht; ≤ 24 h bei `1m` |
| `account_ids[]`, `service_account_ids[]`, `group_by[]=account_id`, `group_by[]=service_account_id` | `actor_ids[]` mit denselben getaggten IDs und `group_by[]=actor` oder `actor_type`; lies `actor.user_id` oder `actor.service_account_id` |
| `context_window[]` | `context_windows[]` (jetzt im Plural) |
| `group_by[]=description` im Cost-Report, mit einem `description`-String | **Entfallen.** Gruppiere stattdessen nach strukturierten Dimensionen — `model`, `cost_type`, `token_type`, `context_window`, `service_tier`, `inference_geo`, `speed`, die alle in eine Anfrage passen |
| Unbekannter API-Schlüssel oder unbekannte Workspace-ID → Fehler | Trifft nichts. Ebenso ein falsch geschriebener `models[]`-Wert |
| `workspace_id: null` bedeutete den Standard-Workspace | Der Standard-Workspace hat seine **echte** `wrkspc_`-ID |
| `inference_geo: "not_available"`, `service_tier: "standard"` für Nutzung ohne beides | `null` für beides. `inference_geos[]=not_available` trifft weiterhin die Zeilen ohne Geo |
| Der Kosten-`service_tier` war `standard` oder `batch`; `amount` wie `"123.45"` | Die tatsächliche Stufe; `amount` mit sechs Nachkommastellen (`"123.450000"`), plus `list_amount` |
| Codeausführung fehlt im Usage-Report; keine Anfragezahlen | Codeausführung erscheint als Nutzungszeilen mit `model: null`; `requests` an beiden Endpunkten und `total_tokens` in Usage-Zeilen |

Um den täglichen Legacy-Report exakt nachzubilden: Fordere `time_bucket_width=1d` mit denselben `group_by[]` an, paginiere mit `limit=1000`, füge `order_by=time&order=asc` für chronologische Tage hinzu, gruppiere die Zeilen dann nach `starting_at` und **fülle die fehlenden Tage selbst mit Nullen auf**.

:::tip[Der Standard-Workspace ist nicht mehr null — passe deinen Gruppierungscode an]
Legacy-Konsumenten behandelten `workspace_id: null` oft als Sonderfall „Default Workspace“. Diese Zuordnung ist jetzt falsch, und ein `null` bedeutet hier stattdessen „nicht danach gruppiert“. Der Standard-Workspace hat eine normale `wrkspc_`-ID — aber [List Workspaces](https://platform.claude.com/docs/en/api/organization/workspaces/list) **lässt ihn aus**, sofern du nicht `include_default=true` übergibst, sodass eine unbekannte ID in deinen Zeilen in deiner Workspace-Tabelle vielleicht nicht auftaucht. Löse sie mit Get Workspace auf: Der Standard-Workspace liefert `"name": "Default"`.
:::

## Jenseits der Claude API

| Plattform | Verfügbarkeit | Was anders ist |
| --- | --- | --- |
| Claude Platform on AWS | Beide Endpunkte | Verwendet die Basis-URL und Authentifizierung der Plattform statt eines Admin-API-Schlüssels; AWS IAM autorisiert über die Aktionen `ListAccountUsage` und `ListAccountCost`. **Jede Anfrage umfasst nur die Workspaces in der AWS-Region dieses Endpunkts** — rufe jede Region auf, um die Organisation abzudecken. `user_profile_id`, `claude_tag_category`, `claude_tag_user_id` und die Managed-Agents-Dimensionen (`agent_id`, `environment_id`, `deployment_id`, `session_id`) sind in jeder Zeile `null` |
| Claude Models on Google Cloud (von Anthropic verwaltet) | Beide Endpunkte | Aufgerufen über die Basis-URL auf Organisationsebene mit Google-Cloud-Zugangsdaten; `/usage` braucht die IAM-Berechtigung `usageAnalytics.list`, `/cost` braucht `costAnalytics.list` |

Die Dimension `user_profile_id` ist auf der Claude API selbst die interessante: In Kombination mit [Benutzerprofilen](/docs/api/user-profiles-and-enforcement) macht sie diese API zu einem Chargeback pro Endkunde für eine Plattform oder einen Reseller — dieselbe Zuordnung, die den Wirkungsradius deiner Durchsetzung begrenzt, sagt dir auch, was dich jeder Kunde kostet.

## Häufige Fehler

| Fehler | Was tatsächlich passiert |
| --- | --- |
| `amount` als Dollar darstellen | Jede Zahl ist um den Faktor 100 zu groß. Es sind Cent mit sechs Nachkommastellen |
| Zeilen in Antwortreihenfolge als Zeitreihe auftragen | Zeilen sind über den gesamten Bereich nach `order_by` geordnet. Du brauchst `time_bucket_width` **und** `order_by=time` |
| `--globoff` bei curl weglassen | curl behandelt `[]` in `group_by[]` als Glob, und die Anfrage geht nicht wie geschrieben hinaus |
| Mit Nullen aufgefüllte Buckets erwarten | Buckets und Kombinationen ohne Daten erzeugen **keine Zeilen**. Fülle Lücken clientseitig |
| Einen Alarm für Kostenspitzen darauf bauen | Die Daten hinken 4–24 Stunden hinterher und werden eine Woche nach Monatsende revidiert |
| Monat-bis-heute-Summen vergleichen, die an verschiedenen Tagen abgerufen wurden | Werte werden bis ~7 Tage nach Monatsende revidiert. Fixiere `ending_at` auf ein `data_refreshed_at`, das du schon gesehen hast |
| Ein leeres Ergebnis als „keine Nutzung“ werten | Eine unbekannte Workspace-ID, API-Schlüssel-ID oder ein falsch geschriebener Modellname trifft jetzt nichts, statt einen Fehler zu liefern |
| Die Zuordnung `workspace_id: null` → „Default“ beibehalten | Der Standard-Workspace hat jetzt eine echte `wrkspc_`-ID; `null` bedeutet „nicht nach dieser Dimension gruppiert“ |
| Annehmen, dass `limit` die Zeilen pro Seite begrenzt | `cost_type` und `token_type` ignorieren `limit` vollständig |
| `account_ids[]` / `service_account_ids[]` weiterverwenden | Ersetzt durch `actor_ids[]` mit `group_by[]=actor` oder `actor_type` |

## Quiz

<Quiz questions={[
  {
    q: "Eine Kostenzeile kommt mit cost.amount = \"41280.000000\" und cost.currency = \"USD\" zurück. Was sollte dein Dashboard anzeigen?",
    options: [
      "41.280,00 $",
      "412,80 $",
      "41.280,000000 $",
      "4.128,00 $"
    ],
    answer: 1,
    explain: "amount ist ein Dezimalstring in CENT mit sechs Nachkommastellen, auch wenn currency USD anzeigt. 41280 Cent sind 412,80 $. Es direkt darzustellen ist ein Fehler um den Faktor 100 — und er besteht das Review gerade deshalb, weil das Feld amount heißt und die Währung Dollar sagt."
  },
  {
    q: "Du fragst 7 Tage Nutzung mit group_by[]=model an und trägst die Zeilen in der Reihenfolge ihres Eintreffens auf, in der Erwartung eines täglichen Liniendiagramms. Du erhältst etwas, das nicht chronologisch ist. Was fehlt?",
    options: [
      "Nur time_bucket_width=1d — Buckets sind standardmäßig chronologisch",
      "Nur order_by=time — die Sortierung ist unabhängig vom Bucketing",
      "Sowohl time_bucket_width=1d als auch order_by=time",
      "Nichts; du musst clientseitig sortieren, weil die API nie nach Zeit ordnet"
    ],
    answer: 2,
    explain: "time_bucket_width hat keinen Standardwert, ohne ihn erhältst du also Summen über den gesamten Bereich. Und Zeilen sind nach der order_by-Metrik (größte zuerst) geordnet, sofern du nicht order_by=time setzt. Du brauchst beides: Buckets, um den Bereich aufzuteilen, und order_by=time, um sie Bucket für Bucket zu bekommen. Leere Buckets füllst du trotzdem selbst mit Nullen auf, da Buckets ohne Daten keine Zeilen erzeugen."
  },
  {
    q: "Das Finanzteam ruft die Kosten für Oktober bis heute am 2. Oktober, erneut am 20. Oktober und noch einmal am 10. November ab — und erhält drei verschiedene Summen für den 1. Oktober. Welche Erklärung entspricht dem dokumentierten Verhalten?",
    options: [
      "Ein Fehler: Sobald data_refreshed_at einen Zeitstempel überschreitet, sind diese Werte endgültig",
      "Werte werden revidiert, wenn verspätete Ereignisse und Abstimmungen eintreffen, bis etwa 7 Tage nach Ende des Kalendermonats",
      "Jede Seite einer paginierten Abfrage liest einen anderen Snapshot, sodass die Summen driften",
      "Nur der Cost-Endpunkt ist betroffen; der Usage-Endpunkt ist sofort endgültig"
    ],
    answer: 1,
    explain: "Daten werden typischerweise innerhalb von 4 Stunden aktualisiert und können bis zu 24 brauchen, und Werte können bis etwa 7 Tage nach Ende des Kalendermonats revidiert werden — der 1. Oktober kann sich also bis etwa zum 7. November ändern. Für endgültige Summen frage nur Monate ab, die mindestens 7 Tage zurückliegen. (Die Paginierung ist nicht die Ursache: Jede Seite einer Abfrage liest denselben Snapshot, deshalb ist data_refreshed_at auf allen Seiten identisch.)"
  }
]} />

<Callout type="takeaways" items={[
  "Zwei Endpunkte — /v1/organizations/analytics/usage und /cost — die beide anthropic-beta: analytics-usage-cost-2026-08-24 verlangen.",
  "Teile amount durch 100. Es sind Cent mit sechs Nachkommastellen, obwohl currency USD anzeigt.",
  "Eine Dimension ist null, solange du nicht danach gruppierst, und eine Kombination ohne Daten erzeugt überhaupt keine Zeile — also clientseitig mit Nullen auffüllen.",
  "Standardmäßig nach Rang geordnet: Eine echte Zeitreihe braucht time_bucket_width UND order_by=time.",
  "Aktualität bedeutet 4–24 Stunden mit Revisionen bis ~7 Tage nach Monatsende. Das ist Infrastruktur für Zuordnung und Chargeback, nicht für Alarme.",
  "api_key_ids[] (was der Schlüssel authentifiziert hat) und actor_ids[] (was dem Schlüssel zugeordnet ist) beantworten verschiedene Fragen — wähle bewusst.",
  "Tippfehler führen nicht mehr zu Fehlern. Ein unbekannter Workspace, Schlüssel oder Modellname trifft stillschweigend nichts.",
]} />

## Weiter

- [Die Admin-API: deine Claude-Organisation automatisieren](/docs/api/admin-api) — die Zugangsdaten, Scopes und Paginierungskonventionen, die diese Endpunkte erben.
- [Harte Ausgabenlimits: Welche KI-Anbieter die Rechnung wirklich stoppen](/docs/models/hard-spend-caps) — die Durchsetzungshälfte desselben Problems, über Anbieter hinweg.
- [Benutzerprofile & Durchsetzung](/docs/api/user-profiles-and-enforcement) — die Dimension `user_profile_id`, die diese API zum Chargeback pro Endkunde macht.
- [Erstanbieter-OpenTelemetry-Tracing](/docs/api/opentelemetry-tracing) — Einblick pro Anfrage, wenn eine Verzögerung von 4 Stunden zu langsam ist.
