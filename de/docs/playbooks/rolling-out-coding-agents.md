# Einen Coding-Agenten für Nicht-Entwickler ausrollen

> Source: https://derob98.github.io/ailmanac/de/docs/playbooks/rolling-out-coding-agents · AILmanac (CC BY 4.0) · last verified 2026-11-09

Goldman Sachs gab Claude Code an seine Banker und Händler und nahm es vier Monate später wieder zurück. Das ist der praktische Leitfaden, den die Nachrichtenberichte übersprungen haben: was Händler tatsächlich mit einem Coding-Agenten machten, warum die Kosten des Rollouts in der Review-Warteschlange der Entwicklung statt im Lizenzbudget landeten, das Mikromodell-Problem, das regulierte Firmen nervös macht, und die Kontrollen, die eine Richtlinie tatsächlich durchsetzen, gegenüber denen, die nur so aussehen.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={[
  "Die drei Aufgaben trennen, für die Nicht-Entwickler einen Coding-Agenten tatsächlich nutzen — nur eine davon ist Coding, und diese Diskrepanz ist die ganze Geschichte",
  "Den echten Kostenfaktor eines breiten Rollouts finden: nicht Lizenzen, nicht Token, sondern die Review-Warteschlange der Entwickler, die das Ergebnis erben",
  "Das Mikromodell-Problem verstehen — warum das 40-Zeilen-Positionsskript eines Händlers ein reguliertes Modell sein kann und was die US-Aufsichtsleitlinien jetzt dazu sagen",
  "Die beiden KI-Verbote der Banken von 2026 nicht mehr vermischen: interne Coding-Tools gegenüber Drittanbieter-Agenten an Kundenkonten sind verschiedene Probleme mit verschiedenen Lösungen",
  "Die Oberfläche an die Aufgabe anpassen statt an die Person, mithilfe der Fähigkeitsleiter",
  "Kontrollen einsetzen, die tatsächlich durchsetzen — und wissen, warum Server-Managed-Settings und der Standard-Audit-Trail es nicht tun"
]} />

<VerifyNote lastVerified="2026-11-09" source="https://techstrong.ai/agentic-ai/goldman-sachs-cuts-bankers-traders-off-from-ai-coding-tools-over-risk-concerns/">
Die folgenden Goldman-Sachs-Angaben (Daten, Mitarbeiterzahlen, wer den Zugang behielt) stammen aus dem Bloomberg-Bericht vom 2. November 2026 und seinen Folgeberichten sowie von einem namentlich genannten Unternehmenssprecher. Zugangsrichtlinien ändern sich leise und ohne Ankündigung — behandeln Sie den Fall Goldman als durchgearbeitetes Beispiel, dessen Details sich verschoben haben können, nicht als aktuelle Beschreibung dieser Firma. Die Mechanismen und die Kontrolloberfläche sind der dauerhafte Teil dieser Seite.
</VerifyNote>

## Was passiert ist, in einem Absatz

Im Juli 2026 lobte der CIO von Goldman Sachs, Marco Argenti, öffentlich das „Vibe Coding“ unter den nicht-technischen Mitarbeitern der Firma: Leute, die keine Entwickler waren, bauten mit KI-Tools Dinge und übergaben ihre Kreationen einem der rund 12.000 Entwickler der Firma zur Fertigstellung. Im Oktober 2026 kehrten interne Richtlinien das um. Claude Code und GitHub Copilot liegen jetzt bei Entwicklern und bei „Strats“ — der hybriden Handels-/Quant-/Entwicklungs-Population — und wurden Bankern und Händlern entzogen. Ein Sprecher stellte es als Ende eines Tests dar: Nachdem „eine Vielzahl von Faktoren einschließlich Produktivität und Risikomanagement“ bewertet worden sei, habe die Firma die Tools denen in die Hand gegeben, die sie langfristig am besten nutzen können. Bloomberg machte es am 2. November öffentlich; der Hacker-News-Thread überschritt 780 Punkte.

Die Berichterstattung lief überwiegend als Urteil über KI. Nützlicher ist sie als Fallstudie zum Rollout-Design, denn der Fehlermodus, den sie zeigt, trifft fast jede Organisation, die einen Coding-Agenten über die Entwicklung hinaus ausrollt, und kaum eine preist ihn vorher ein.

## Die drei Aufgaben, von denen nur eine Coding ist

Beginnen Sie damit, was die abgezogenen Nutzer berichteten zu tun. Drei Aufgaben tauchen in der Berichterstattung durchgängig auf:

| Wofür Händler es nutzten | Ist das Coding? | Was es tatsächlich ist |
|---|---|---|
| Verfolgen, wie Kunden handelten | Nein | Datenanalyse über sensible Flow-Daten |
| Simulieren von Marktverschiebungen und Verschiebungen ihrer Positionen | Nein | Quantitative Modellierung |
| Entwerfen von Text und Visualisierungen | Nein | Erzeugung von Dokumenten und Assets |

Keine der drei ist Softwareentwicklung. Ein Coding-Agent war das Transportmittel, nicht die Aufgabe. Das ist das Wichtigste, was man aus der Episode mitnehmen sollte, und es ist genau das, was die Erzählung „Banken fürchten KI“ verdeckt.

Das passiert, weil ein Coding-Agent im Terminal zufällig das leistungsfähigste Allzweck-Analysewerkzeug ist, das die meisten Firmen bereitgestellt haben. Er kann eine Datenbank erreichen, das Python schreiben, es ausführen und die Grafik rendern — in einer Schleife, ohne Ticket. Wenn der freigegebene Analysepfad eine Datenanfrage und eine zweiwöchige Warteschlange verlangt, gewinnt der Coding-Agent jedes Mal aus gutem Grund. Die Leute haben ihn nicht missbraucht. Sie haben einen internen Engpass umgangen, was fähige Leute tun.

Die Konsequenz: **Sie entscheiden nicht, ob Nicht-Entwickler programmieren dürfen. Sie entscheiden, ob nicht versionierte, ungeprüfte Analysen gegen Produktionsdaten gebaut werden dürfen, von Leuten, deren Ergebnis niemand weiter unten zu warten zugestimmt hat.** So formuliert, lösen sich viele Rollout-Debatten von selbst.

## Der Kostenfaktor, den niemand budgetiert: die Review-Warteschlange

Sehen Sie sich die Beschreibung vom Juli noch einmal an — nicht-technische Mitarbeiter bauten Dinge und gaben sie einem von 12.000 Entwicklern, „um sie zu verbessern“.

Diese Übergabe ist die wahre Stückökonomie des Rollouts, und sie ist im Business Case unsichtbar. Die Lizenzkosten sind sichtbar. Die Token-Kosten sind sichtbar, und dafür gibt es [harte Ausgabenlimits](/docs/models/hard-spend-caps). Die Entwicklerstunden, die nötig sind, um einen Strom von Prototypen zu prüfen, zu härten, zu besitzen und zu warten, die von Leuten gebaut wurden, die den Code nicht lesen können, sind für den, der die Lizenzen genehmigt hat, nicht sichtbar, weil sie im Quartal eines anderen Teams landen.

Die Rechnung ist unfreundlich. Angenommen, 2.000 Nicht-Entwickler erzeugen jeweils ein eskalationswürdiges Artefakt pro Monat — eine konservative Rate für eine begeisterte Population. Das sind 2.000 Posten im Monat, die bei einer Entwicklungsorganisation ankommen, die nicht damit gerechnet hat. Bei vier Stunden pro Posten für Review, Härtung und Übernahme der Verantwortung sind das 8.000 Entwicklerstunden im Monat, also etwa 50 Vollzeit-Entwickler, die vom Intake aufgesogen werden. Bei 12.000 Entwicklern ist das verkraftbar; als Überraschung nicht, und es bringt nichts, was auf der Roadmap der Entwicklung auftaucht.

Drei Eigenschaften machen diese Warteschlange schlimmer als einen gewöhnlichen Backlog:

<Steps items={[
  {title: "Sie ist in der Praxis nicht ablehnbar", body: "Das Artefakt funktioniert für seinen Autor bereits, der oft ranghöher ist als der Reviewer und es seinem Desk schon gezeigt hat. „Nein“ ist jetzt ein politischer Akt statt einer Triage-Entscheidung. Backlogs, die man nicht ablehnen kann, sind keine Backlogs, sondern Verpflichtungen."},
  {title: "Der Autor kann Review-Befunde nicht beheben", body: "Normales Review ist ein Gespräch zwischen zwei Personen, die beide den Diff lesen können. Hier wird jeder Befund zu Entwicklungsarbeit statt zu Nacharbeit des Autors. Der Reviewer senkt seine eigene Last nicht dadurch, dass er gut prüft — er erhöht sie."},
  {title: "Die Verantwortung wird nie übertragen, sie lagert sich nur an", body: "Sobald ein Entwickler es anfasst, gehört es ihm. Der ursprüngliche Autor bittet weiter um Änderungen und hängt weiter davon ab, aber der Pager, die Abhängigkeits-Updates und der Incident gehören dem Team, das „geholfen“ hat. Jeder eskalierte Prototyp ist eine dauerhafte Verbindlichkeit ohne zugehöriges Eigentümerbudget."}
]} />

Wenn Sie von dieser Seite eine Maßnahme mitnehmen, dann diese: **Bitten Sie vor der Ausweitung des Zugangs die Entwicklungsorganisation, die das Ergebnis erbt, schriftlich einer Intake-Rate zuzustimmen, mit einem Weg zur Ablehnung.** Ein Rollout, der „wer wartet, was diese Leute bauen, und was passiert, wenn sie Nein sagen“ nicht beantworten kann, ist kein Rollout, sondern ein aufgeschobener Streit.

## Das Mikromodell-Problem

Für Firmen in regulierten Branchen gibt es ein zweites, schärferes Problem, und es ist das, das einen Rollout am ehesten abrupt beendet.

Ein Händler, der einen Agenten bittet, „zu simulieren, wie sich mein Buch bewegt, wenn die Kurve um 50 Basispunkte steiler wird“, hat kein Skript geschrieben. Er hat ein Modell gebaut — in dem konkreten, tragenden Sinn, in dem Finanzaufseher das Wort verwenden. Langjährige US-Aufsichtsleitlinien definieren ein Modell als quantitative Methode, ein System oder einen Ansatz, der statistische, ökonomische, finanzielle oder mathematische Theorien anwendet, um Eingabedaten in quantitative Schätzungen umzuwandeln. Ein an einem Nachmittag geschriebenes Positionssimulationsskript passt bequem in diese Definition. Ebenso ein Freigabe-Routing-Helfer, der gewichtete Kriterien anwendet, um eine Gegenparteitransaktion zu markieren, oder eine Berechtigungsprüfung, die bewertet, ob ein Kunde für ein Angebot infrage kommt.

Modelle in diesem Sinn sollen in einem Modellinventar stehen, mit Dokumentation, unabhängiger Validierung und Änderungshistorie. Die Praxis des Modellrisikomanagements wurde für eine Welt gebaut, in der Modelle einzeln, teuer und wenige waren — erstellt von identifizierbaren Quant-Teams in einem Release-Zyklus, der langsam genug war, dass eine Validierungsfunktion mithalten konnte.

Ein Coding-Agent in den Händen von 2.000 Nicht-Entwicklern kehrt jede dieser Annahmen um. Die Artefakte sind billig, zahlreich, undokumentiert, nicht versioniert und stammen von Leuten, die nicht wissen, dass das Wort „Modell“ jetzt auf sie zutrifft. Das ist das **Mikromodell-Problem**: Entscheidungslogik, die die regulatorische Definition eines Modells erfüllt, erzeugt schneller, als eine Validierungsfunktion sie inventarisieren kann, von Autoren, die die Frage nie gestellt haben. Die Governance-Lücke besteht nicht darin, dass das Ergebnis schlecht ist. Sie besteht darin, dass niemand aufzählen kann, was existiert.

Auch der Aufsichtsboden hat sich 2026 verschoben, was für alle wichtig ist, die Kapitel und Vers zitieren. Am **17. April 2026** gab die Federal Reserve **SR 26-2, „Revised Guidance on Model Risk Management“**, heraus, das **SR 11-7** (4. April 2011) und **SR 21-8** (9. April 2021) ablöst. Wenn Ihre interne Richtlinie, die Compliance-Präsentation Ihres Anbieters oder ein Blogbeitrag, auf den Sie sich stützen, SR 11-7 noch als aktuell zitiert, ist sie um mehr als sechs Monate veraltet.

<VerifyNote lastVerified="2026-11-09" source="https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm">
Die Existenz von SR 26-2, das Datum und die abgelösten Schreiben sind anhand des eigenen SR-Letter-Index der Federal Reserve bestätigt. Mehrere Sekundärdarstellungen stellen konkrete Behauptungen dazu auf, wie SR 26-2 generative und agentische KI im Geltungsbereich behandelt; wir konnten diese am Originalschreiben nicht bestätigen und haben sie bewusst weggelassen. Lesen Sie das Schreiben und seinen Anhang selbst, bevor Sie eine Kontrolle auf eine Geltungsbereichsbehauptung stützen, und lassen Sie das auch Ihre Rechtsberatung tun — nichts hier ist Rechts- oder Compliance-Beratung.
</VerifyNote>

## Zwei verschiedene Verbote, routinemäßig vermischt

Suchen Sie nach Berichten über KI-Beschränkungen von Banken 2026, und Sie bekommen zwei Geschichten zu einer vermischt. Sie sind nicht dasselbe Problem und haben nicht dieselbe Lösung.

| | Interne Coding-Agenten | Drittanbieter-Agenten an Kundenkonten |
|---|---|---|
| Beispiel | Goldman Sachs beschränkt Claude Code und Copilot auf Entwickler | JPMorgan, Bank of America und Citi begrenzen den Zugriff externer KI-Agenten auf Kundenkonten |
| Wer handelt | Ihre eigenen Mitarbeiter, innerhalb Ihres Perimeters | Software, die für einen Kunden handelt, außerhalb Ihres Perimeters |
| Die Furcht | Ungeprüfte Logik, Datenbarrieren, Nachvollziehbarkeit von maschinengeschriebenem Code | Nicht autorisierte Transaktionen und credential-bezogener Zugriff im großen Maßstab — Jamie Dimons „Rogue Agents“, von denen es „Tausende geben könnte“ |
| Typische Kontrolle | Zugriffsbeschränkung, verwaltete Richtlinie, Review-Gates | Nur-Lese-Beschränkung an der API-Grenze — Metas Muse kann zum Beispiel einen Chase-Kontostand lesen, aber kein Geld bewegen |
| Mehr dazu | Diese Seite | [Agenten absichern](/docs/security/securing-agents) · [Agent-Zahlungen und x402](/docs/models/agent-payments-x402-and-agentcore) |

Der CEO der Bank of America sagte, die Firma habe 1.000 Auftragnehmer eingestellt, um Software gegen von Agenten ausnutzbare Schwachstellen zu patchen — das ist die zweite Spalte, nicht die erste. Wenn Sie das in einem internen Memo darüber zitieren, Ihren Analysten Claude Code zu geben, haben Sie das Falsche zitiert, und die erste Person, die es bemerkt, wird Ihre Glaubwürdigkeit aufbrauchen.

Noch ein Stück Kontext, das man im Kopf behalten sollte, weil es gegen die einfache Lesart spricht: Goldman Sachs ist Lead-Left-Underwriter beim Anthropic-IPO, mit dem am 26. Oktober 2026 eingereichten S-1 und der für die Woche des 9. November 2026 erwarteten Roadshow. Eine Firma, die den internen Zugang zu einem Produkt einschränkt, während sie dessen Börsengang zeichnet, ist kein Widerspruch. Es ist ein Beleg dafür, dass es bei der Entscheidung um den **Einsatzbereich** ging und nicht um ein Urteil über das Tool — genau so sollten Sie jede ähnliche Beschränkung lesen, auch Ihre eigene.

## Die Fähigkeitsleiter: die Oberfläche an die Aufgabe anpassen

Der Instinkt nach dem Obigen ist, nach Jobtitel zu sperren. Das hat Goldman getan, und für eine Firma mit 12.000 Entwicklern und einem Aufsichtsprüfer ist das ein vertretbares stumpfes Instrument. Für alle anderen ist es meist der falsche erste Schritt, weil es die Fähigkeit entfernt, ohne die Nachfrage zu entfernen — und unerfüllte Nachfrage nach KI-Analyse verschwindet nicht, sie wandert auf ein privates Konto auf einem privaten Laptop, wo Sie gar keine Telemetrie haben.

Sperren Sie stattdessen nach Aufgabe. Das meiste, was Nicht-Entwickler von einem Coding-Agenten wollen, gibt es auf einer Oberfläche, die keine Review-Warteschlange und keine Mikromodelle erzeugt.

| Die Aufgabe | Die richtige Oberfläche | Warum sie die richtige ist |
|---|---|---|
| Einen Datensatz analysieren, eine Grafik erstellen | Claude-App mit Datei-Upload und ihrem Analysewerkzeug | Flüchtig, kein Repo, kein Artefakt zu warten. Siehe [Datenanalyse](/docs/playbooks/data-analysis) |
| Dokumente, Präsentationen, Visualisierungen entwerfen | Claude-App, Projects | Brauchte nie einen Coding-Agenten. Siehe [Business & Strategie](/docs/playbooks/business) |
| Freigegebene Systeme abfragen | Nur-Lese-MCP-Server, den Sie betreiben | Sie kontrollieren Schema, Geltungsbereich und Log. Siehe [MCP-Server absichern](/docs/security/securing-mcp-servers) |
| Eine wiederkehrende Analyse wiederverwenden | Ein einmal von der Entwicklung gebauter Skill oder gespeicherter Prompt | Macht aus 200 Ad-hoc-Mikromodellen ein geprüftes Artefakt. Siehe [Skills](/docs/claude-code/skills) |
| Etwas prototypisieren, das echte Software werden muss | Coding-Agent, mit deklariertem Intake-Pfad | Die einzige Sprosse, die legitim Review-Arbeit erzeugt — machen Sie die Warteschlange also explizit |
| Mit Produktionsdaten oder Geld arbeiten | Nichts im Self-Service | Siehe [Die Vertrauensleiter](/docs/frontiers/the-trust-ladder) |

Die Leiter hat eine bemerkenswerte Eigenschaft: Die oberste Sprosse ist die einzige, die eine Wartungsverpflichtung erzeugt, und die fünf Sprossen darunter nehmen den Großteil der realen Nachfrage auf. Firmen, die die Leiter überspringen und einen Coding-Agenten als ihr allgemeines KI-Angebot ausrollen, zahlen Review-Preise der Entwicklung für Arbeit, die eine Chat-Oberfläche gratis erledigt.

## Kontrollen, die durchsetzen, und Kontrollen, die nur so aussehen

Wenn Sie einen Coding-Agenten für eine breite Population betreiben, ist die folgende Unterscheidung die, die in Rollout-Plänen übersehen wird — auch von Leuten, die die Doku gelesen haben.

<Steps items={[
  {title: "Managed Settings setzen durch. Server-Managed-Settings sind eine Bequemlichkeit.", body: "Eine von Ihrem Geräteverwaltungs-Tooling ausgerollte managed-settings.json steht an der Spitze des Vorrangstapels und lässt sich lokal nicht überschreiben. Einstellungen, die aus Ihrer claude.ai-Organisation ausgeliefert werden, erreichen nur Sitzungen, die sich bereits in Ihrer Organisation authentifiziert haben — sie erreichen also nie die Maschine, die mit einem privaten Konto angemeldet wurde, und genau um diese Maschine ging die Sorge. Anthropics eigene Dokumentation sagt, eine servergesteuerte Liste sei als Bequemlichkeit für Maschinen zu betrachten, die Sie mit der Geräteverwaltung nicht erreichen, nicht als Durchsetzung. Planen Sie entsprechend: MDM ist die Kontrolle, die serverseitige Kopie ist die Rückfalloption."},
  {title: "forceLoginOrgUUID schließt das Loch des privaten Kontos", body: "Ohne ihn kann sich ein Entwickler mit einem privaten claude.ai-Konto anmelden, und Ihre Organisation sieht nichts: keine Telemetrie, keine Richtlinie, keinen Audit-Trail, und Ihre Daten verlassen das Haus über ein Verbraucherkonto. Wer forceLoginMethod und forceLoginOrgUUID in den Managed Settings setzt, bringt Claude Code dazu, eine Anmeldung abzulehnen, die zu einer nicht aufgelisteten Organisation gehört, und beim Start zu beenden, wenn die verwendete Anmeldung zu einer solchen gehört. Das ist der wirkungsvollste einzelne Schlüssel in der Datei."},
  {title: "allowedProviders bestimmt, über welche Dienste die Maschine Claude erreichen darf", body: "Ein anderes Thema als die Frage, welches Konto verwendet wird. Er listet die erlaubten Routen — die Anthropic API, Amazon Bedrock, ein Gateway — und lehnt eine für etwas anderes konfigurierte Sitzung beim Start ab, oder bei der nächsten Anfrage, wenn mitten in der Sitzung gewechselt wird. Erfordert Claude Code v2.1.285 oder neuer. Das ist der Schlüssel, der verhindert, dass Traffic unbemerkt einen Umweg über einen nicht genehmigten Proxy nimmt; siehe [Graumarkt-KI-Proxys](/docs/security/gray-market-ai-proxies), warum das wichtig ist."},
  {title: "Umgebungs-Credentials werden abgelehnt, nicht nur nicht empfohlen", body: "Unter diesen Schlüsseln blockiert Claude Code Sitzungen, die sich mit ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN oder apiKeyHelper authentifizieren — selbst wenn die Managed Settings sie selbst liefern —, weil die Organisationszugehörigkeit bei einem Umgebungs-Credential nicht verifiziert werden kann. Gut zu wissen, bevor Sie es als Support-Ticket von jedem Ihrer CI-Jobs entdecken."},
  {title: "Berechtigungen sind ein Gate pro Repo, kein Gate für die Population", body: "Allow- und Deny-Regeln sind das richtige Werkzeug dafür, was ein Agent in einem bestimmten Projekt darf. Sie sind das falsche Werkzeug dafür, wer überhaupt einen Agenten ausführen darf. Lassen Sie eine gut geschriebene Deny-Liste keine Zugriffsentscheidung ersetzen. Siehe Berechtigungen und den Vorrangstapel in den Einstellungen."}
]} />

<PromptCard title="managed-settings.json — der Durchsetzungsboden, per MDM ausgerollt">{`{
  "forceLoginMethod": "claudeai",
  "forceLoginOrgUUID": ["00000000-0000-0000-0000-000000000000"],
  "allowedProviders": ["anthropic", "bedrock"],
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.internal.example.com:4317",
    "OTEL_LOG_TOOL_DETAILS": "1"
  }
}`}</PromptCard>

Ersetzen Sie die UUID durch Ihre eigene Organisations-ID aus Ihren Admin-Einstellungen und den Endpunkt durch Ihren Collector. Die Telemetrie-Variablen im verwalteten `env`-Block festzuschreiben ist wichtig: Ein dort gesetztes Ziel ist gesperrt, und Claude Code entfernt beim Start widersprechende, vom Entwickler gesetzte Variablen. Ein Ziel, das ein Entwickler ändern kann, ist kein Audit-Trail.

## Der Audit-Trail-Haken, der Sie in einem Review blamieren wird

Dieser lohnt den Eintrittspreis, denn er ist die Lücke zwischen dem, was Rollout-Pläne behaupten, und dem, was die Daten enthalten.

Claude Code exportiert einen wirklich nützlichen Satz von OpenTelemetry-Metriken — `claude_code.session.count`, `claude_code.lines_of_code.count`, `claude_code.commit.count`, `claude_code.pull_request.count`, `claude_code.cost.usage`, `claude_code.code_edit_tool.decision`, `claude_code.active_time.total` — mit Attributen wie `user.email`, `user.account_uuid` und `organization.id`. Kostenzuordnung pro Nutzer und aktive Zeit pro Nutzer sind beide sofort verfügbar. Das Gesamtbild finden Sie unter [OpenTelemetry-Tracing](/docs/api/opentelemetry-tracing) und [Nutzungs- und Kostenanalyse](/docs/api/usage-cost-analytics).

Aber **Metriken und Events werden standardmäßig geschwärzt**, und die Schwärzung ist aggressiver, als die meisten erwarten:

- MCP-Server- und Tool-Namen erscheinen als `"custom"` oder `"mcp"` — ohne Tool-Namen —, solange `OTEL_LOG_TOOL_DETAILS=1` nicht gesetzt ist. Eine Organisation, die glaubt, ein Protokoll darüber zu haben, welche internen Systeme ihre Agenten berührt haben, hat standardmäßig ein Protokoll, das `mcp` sagt.
- Prompt-Inhalte, Assistant-Antworten und System-Prompts erfordern `OTEL_LOG_USER_PROMPTS=1`.
- Tool-Ausgabe — Dateilesungen, Befehlsausgabe — erfordert `OTEL_LOG_TOOL_CONTENT=1`.
- Bash-Befehle und Dateipfade stehen ebenfalls hinter `OTEL_LOG_TOOL_DETAILS=1`.
- Es gibt **kein eingebautes Admin-Dashboard**. Sie exportieren in Ihr eigenes Observability-Backend und bauen die Ansicht selbst. Planen Sie dafür Budget ein; es ist der Schritt, der stillschweigend nicht passiert.

Der Standard ist der richtige Standard — er schützt Mitarbeiter vor beiläufiger Überwachung, und `claude_code.safety_event` erfasst weiterhin Berechtigungsprüfungen und Blockaden, ohne Inhalte offenzulegen. Aber er bedeutet, dass der Satz „wir haben volle Nachvollziehbarkeit“ bei einer Standardinstallation falsch ist, und der günstigste Zeitpunkt, das zu entdecken, ist jetzt und nicht während einer Prüfung. Die Flags einzuschalten ist eine Entscheidung mit echtem Datenschutzgewicht: Sagen Sie den Leuten, was Sie protokollieren, vereinbaren Sie eine Aufbewahrungsdauer und lassen Sie die Inhalts-Flags aus, es sei denn, eine benannte Verpflichtung verlangt sie. Die Sicht der Mitarbeiter auf dieselbe Frage finden Sie unter [was Ihr Agent hochlädt](/docs/security/what-your-agent-uploads).

## Fünf Fragen, bevor Sie den Zugang ausweiten

Kein Reifegradmodell. Fünf Fragen, deren fehlende Antwort eine Rücknahme vier Monate später vorhersagt.

<Steps items={[
  {title: "Welche der drei Aufgaben wollen die Leute tatsächlich?", body: "Fragen Sie zehn von ihnen. Wenn die Antworten Analyse, Entwerfen und Abfragen sind — und das sind sie meist —, ist ein Coding-Agent die falsche Sprosse der Leiter, und Sie können den Großteil dieser Seite überspringen."},
  {title: "Wer hat zugestimmt, das Ergebnis zu erben, mit welcher Rate und mit welchem Ablehnungsrecht?", body: "Schriftlich, von der Führungskraft der Entwicklung, bei deren Team es landet. Wenn niemand zugestimmt hat, haben Sie die Lizenzen budgetiert und nicht die Kosten."},
  {title: "Können Sie aufzählen, was gebaut wird?", body: "Wenn die Artefakte auf Laptops liegen, lautet die Antwort Nein, und in einem regulierten Umfeld ist Nein ein Befund. Ein freigegebenes Repo oder Workspace pro Population ist das Minimum, das Aufzählung überhaupt möglich macht."},
  {title: "Wird die Richtlinie per MDM durchgesetzt oder nur veröffentlicht?", body: "Eine ausgerollte managed-settings.json mit forceLoginOrgUUID oder eine Wiki-Seite. Nur eines davon übersteht einen motivierten Nutzer mit einem privaten Konto."},
  {title: "Was enthält Ihre Telemetrie tatsächlich?", body: "Nicht, was die Metrikliste anbietet — was Ihr Collector letzte Woche empfangen hat. Fragen Sie es ab, bevor Sie es behaupten. Wenn MCP-Tool-Namen als „mcp“ zurückkommen, wissen Sie, welches Flag Sie nicht gesetzt haben."}
]} />

<Flashcards title="Rollout-Vokabular" cards={[
  {front: "Mikromodell-Problem", back: "Entscheidungslogik, die die regulatorische Definition eines Modells erfüllt — statistische oder finanzielle Methode, die Eingaben in quantitative Schätzungen umwandelt —, erzeugt schneller, als eine Validierungsfunktion sie inventarisieren kann, von Autoren, die nicht wissen, dass das Wort auf sie zutrifft."},
  {front: "SR 26-2", back: "Federal Reserve „Revised Guidance on Model Risk Management“, 17. April 2026. Löst SR 11-7 (2011) und SR 21-8 (2021) ab. Richtlinien, die SR 11-7 noch als aktuell zitieren, sind veraltet."},
  {front: "forceLoginOrgUUID", back: "Schlüssel der Managed Settings, der Claude Code dazu bringt, claude.ai-Anmeldungen außerhalb Ihrer aufgelisteten Organisationen abzulehnen und beim Start zu beenden, wenn das aktive Credential zu einer solchen gehört. Schließt das Telemetrie-Loch des privaten Kontos."},
  {front: "allowedProviders", back: "Liste in den Managed Settings der Dienste, über die eine Maschine Claude erreichen darf (anthropic, bedrock, customEndpoint, …). Lehnt andere Provider beim Start ab. Claude Code v2.1.285+."},
  {front: "Server-Managed-Settings", back: "Aus Ihrer claude.ai-Organisation ausgelieferte Einstellungen. Erreichen nur Sitzungen, die sich bereits dort authentifiziert haben — eine Bequemlichkeit für unerreichbare Maschinen, ausdrücklich kein Durchsetzungsmechanismus."},
  {front: "OTEL_LOG_TOOL_DETAILS", back: "Flag, das Bash-Befehle, Dateipfade sowie MCP-Server- und Tool-Namen in der Telemetrie sichtbar macht. Ohne es werden sie als „custom“ oder „mcp“ protokolliert — Tool-Namen fehlen."},
  {front: "Die Review-Warteschlange", back: "Der echte Kostenfaktor eines breiten Coding-Agent-Rollouts: Entwicklerstunden für Review, Härtung und Übernahme von Prototypen, die von Leuten gebaut wurden, die den Code nicht lesen können. Nicht ablehnbar, nicht zurückdelegierbar und dauerhaft anwachsend."},
  {front: "Fähigkeitsleiter", back: "Nach Aufgabe sperren, nicht nach Jobtitel. Chat-Oberfläche, Nur-Lese-MCP, gemeinsame Skills und freigegebene Prompts nehmen den Großteil der Nachfrage auf; nur die Prototyping-Sprosse erzeugt eine Wartungsverpflichtung."}
]} />

<Quiz title="Testen Sie sich selbst" questions={[
  {
    q: "Wofür nutzten Goldmans Händler und Banker die Coding-Agenten Berichten zufolge?",
    options: [
      "Produktive Handelssysteme ohne Review ausliefern",
      "Kundenflüsse verfolgen, Markt- und Positionsverschiebungen simulieren sowie Text und Visualisierungen entwerfen",
      "Interne Compliance-Tools für das Modellrisiko-Team schreiben",
      "Proprietäre Modelle mit Kundendaten trainieren"
    ],
    answer: 1,
    explain: "Alle drei berichteten Aufgaben — Analyse von Kundenflüssen, Positionssimulation und Erstellen von Inhalten — sind Analyse- und Dokumentenarbeit, keine Softwareentwicklung. Der Coding-Agent war das Transportmittel, weshalb „Sollen Nicht-Entwickler programmieren?“ die falsche Rahmung der Entscheidung ist."
  },
  {
    q: "Welcher Kostenpunkt fehlt bei einem breiten Rollout an Nicht-Entwickler am häufigsten im Business Case?",
    options: [
      "Lizenzkosten pro Platz",
      "Token-Ausgaben bei langen Agentenläufen",
      "Entwicklerstunden für Review, Härtung und Übernahme der Artefakte, die Nicht-Entwickler eskalieren",
      "Geräteverwaltungs-Tooling zum Ausrollen der Managed Settings"
    ],
    answer: 2,
    explain: "Lizenzen und Token sind sichtbar und deckelbar. Die Review-Warteschlange landet im Quartal eines anderen Teams, lässt sich nicht leicht ablehnen, weil das Artefakt für einen ranghohen Autor bereits funktioniert, und verwandelt jeden Review-Befund in Entwicklungsarbeit statt in Nacharbeit des Autors."
  },
  {
    q: "Sie veröffentlichen eine Claude-Code-Richtlinie als Server-Managed-Settings aus Ihrer claude.ai-Organisation. Wo ist die Lücke?",
    options: [
      "Keine — Server-Managed-Settings stehen an der Spitze des Vorrangstapels",
      "Sie erreichen nur Sitzungen, die sich bereits in Ihrer Organisation authentifiziert haben, und verfehlen damit die Maschine, die mit einem privaten Konto angemeldet ist",
      "Sie werden von der eingecheckten Einstellungsdatei jedes Projekts überschrieben",
      "Sie gelten nur für Cloud-Sitzungen und nie für die Terminal-CLI"
    ],
    answer: 1,
    explain: "Ein Entwickler erhält Server-Managed-Settings erst nach der Authentifizierung in Ihrer Organisation — sie erreichen also nie die nicht verwaltete, privat angemeldete Maschine, die das eigentliche Risiko war. Anthropics Dokumentation nennt eine servergesteuerte Liste eine Bequemlichkeit für Maschinen, die Sie mit der Geräteverwaltung nicht erreichen, keine Durchsetzung. Rollen Sie dafür per MDM eine managed-settings.json mit forceLoginOrgUUID aus."
  },
  {
    q: "Wie sehen MCP-Server- und Tool-Namen bei einer Standardinstallation mit aktivierter Telemetrie in Ihren Logs aus?",
    options: [
      "Immer vollständige Server- und Tool-Namen",
      "Nur der Servername, mit gehashtem Tool-Namen",
      "„custom“ oder „mcp“, ohne Tool-Namen, bis OTEL_LOG_TOOL_DETAILS=1 gesetzt ist",
      "Sie sind unter keiner Konfiguration exportierbar"
    ],
    answer: 2,
    explain: "Metriken und Events sind standardmäßig geschwärzt. MCP-Server- und Tool-Namen werden als „custom“ oder „mcp“ protokolliert, solange OTEL_LOG_TOOL_DETAILS=1 nicht gesetzt ist. Eine Organisation, die glaubt, zeigen zu können, welche internen Systeme ihre Agenten berührt haben, hat standardmäßig ein Log, das „mcp“ sagt — das sollte man vor einem Audit entdecken und nicht währenddessen."
  },
  {
    q: "Welche US-Aufsichtsleitlinie zum Modellrisikomanagement ist Ende 2026 aktuell?",
    options: [
      "SR 11-7, herausgegeben am 4. April 2011",
      "SR 21-8, herausgegeben am 9. April 2021",
      "SR 26-2, herausgegeben am 17. April 2026, das sowohl SR 11-7 als auch SR 21-8 ablöst",
      "Es gibt keine Aufsichtsleitlinie zum Modellrisikomanagement"
    ],
    answer: 2,
    explain: "SR 26-2, „Revised Guidance on Model Risk Management“, datiert vom 17. April 2026, löst SR 11-7 (2011) und SR 21-8 (2021) ab. Viel Anbietermaterial und manche interne Richtlinie zitieren SR 11-7 noch als aktuell. Lesen Sie das Schreiben und seinen Anhang statt einer Zusammenfassung davon, und holen Sie Compliance-Rat bei der Rechtsberatung ein."
  },
  {
    q: "Warum ist es oft der falsche erste Schritt, einen Coding-Agenten rein nach Jobtitel zu sperren?",
    options: [
      "Weil Jobtitel in der Claude-Code-Telemetrie nicht verfügbar sind",
      "Weil es die Fähigkeit entfernt, ohne die Nachfrage zu entfernen, die dann zu privaten Konten wandert, wo Sie gar keine Telemetrie haben",
      "Weil Managed Settings keine rollenbasierten Regeln ausdrücken können",
      "Weil Aufsichtsbehörden gleichen Tool-Zugang über alle Populationen verlangen"
    ],
    answer: 1,
    explain: "Unerfüllte Nachfrage nach KI-Analyse verschwindet nicht — sie wandert auf ein privates Konto auf einem privaten Laptop, was sowohl für Governance als auch für Nachvollziehbarkeit streng schlechter ist. Sperren Sie stattdessen nach Aufgabe: Eine Chat-Oberfläche, Nur-Lese-MCP und gemeinsame Skills nehmen den Großteil der realen Nachfrage auf, ohne Review-Warteschlangen oder Mikromodelle zu erzeugen."
  }
]} />

<Callout type="takeaways" items={[
  "Die drei Aufgaben, die Nicht-Entwickler an einen Coding-Agenten herantragen — Analyse, Modellierung, Entwurf — sind kein Coding. Entscheiden Sie über diese Aufgaben, nicht über Jobtitel.",
  "Ein Coding-Agent gewinnt oft aus gutem Grund, weil der freigegebene Analysepfad langsam ist. Beheben Sie den Engpass, sonst geht das Umgehen nach jedem Verbot weiter.",
  "Die echten Kosten des Rollouts sind die Review-Warteschlange der Entwicklung: nicht ablehnbar, nicht zurückdelegierbar, dauerhaft anwachsend. Holen Sie eine schriftliche Intake-Rate und ein Ablehnungsrecht ein, bevor Sie den Zugang ausweiten.",
  "Mikromodell-Problem: Ad-hoc-Positions- und Berechtigungslogik kann die aufsichtsrechtliche Definition eines Modells erfüllen. Die Lücke ist nicht die Qualität, sondern dass niemand aufzählen kann, was existiert.",
  "SR 26-2 (17. April 2026) löst SR 11-7 und SR 21-8 ab. Aktualisieren Sie jede Richtlinie, die SR 11-7 noch als aktuell zitiert — und prüfen Sie Geltungsbereichsbehauptungen am Originalschreiben.",
  "Interne Coding-Tools und Drittanbieter-Agenten an Kundenkonten sind zwei verschiedene Bankgeschichten von 2026. Zitieren Sie nicht die eine als Beleg für die andere.",
  "Managed Settings per MDM setzen durch; Server-Managed-Settings sind ausdrücklich eine Bequemlichkeit. forceLoginOrgUUID ist der Schlüssel, der das Loch des privaten Kontos schließt; allowedProviders legt die Route fest.",
  "Telemetrie ist standardmäßig geschwärzt — MCP-Tool-Namen werden als „mcp“ protokolliert. Fragen Sie Ihren Collector ab, bevor Sie Nachvollziehbarkeit behaupten, und behandeln Sie die Inhalts-Flags als Datenschutzentscheidung, nicht als Häkchen."
]} />

## Quellen und weiterführende Literatur

- [Techstrong.ai: Goldman Sachs cuts bankers, traders off from AI coding tools over risk concerns](https://techstrong.ai/agentic-ai/goldman-sachs-cuts-bankers-traders-off-from-ai-coding-tools-over-risk-concerns/) — die Darstellung des Bloomberg-Scoops vom 2. November 2026: die Umkehr von Juli zu Oktober, das Zitat des namentlich genannten Sprechers, die Zahl von 12.000 Entwicklern und die genannten Governance-Bedenken.
- [PYMNTS: Goldman Sachs bars bankers from employing some AI tools](https://www.pymnts.com/news/artificial-intelligence/2026/goldman-sachs-bars-bankers-from-employing-some-ai-tools/) — unabhängige Bestätigung und das Detail von Argenti, sie „gaben ihre Kreationen an einen der 12.000 Entwickler der Firma zur Verbesserung weiter“, auf dem der Abschnitt zur Review-Warteschlange aufbaut.
- [Federal Reserve: SR letters index](https://www.federalreserve.gov/supervisionreg/srletters/srletters.htm) und [SR 26-2, Revised Guidance on Model Risk Management](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) — die Primärquelle für das Datum vom 17. April 2026 und die abgelösten Schreiben. Lesen Sie den Anhang für die Modelldefinition und die Formulierungen zum Geltungsbereich.
- [Axios: Unvetted AI agents are accessing U.S. bank accounts](https://www.axios.com/2026/10/22/ai-agents-banks-unauthorized-accounts-access) — die andere KI-Geschichte der Banken von 2026, die über Drittanbieter-Agenten an der Grenze zum Kundenkonto.
- [Claude Code: monitoring usage](https://code.claude.com/docs/en/monitoring-usage) — die maßgebliche Liste von Metriken, Events und Attributen, den `OTEL_LOG_*`-Flags und was jedes davon genau offenlegt, sowie die Aussage, dass es kein eingebautes Admin-Dashboard gibt.
- [Claude Code: authentication and IAM](https://code.claude.com/docs/en/iam) — `forceLoginMethod`, `forceLoginOrgUUID`, `allowedProviders`, die Credential-Vorrangliste und die Regeln zu blockierten Umgebungs-Credentials.
- [Claude Code: managed settings](https://code.claude.com/docs/en/managed-settings) und [server-managed settings](https://code.claude.com/docs/en/server-managed-settings) — der Vorrangstapel und die ausdrückliche Charakterisierung servergesteuerter Listen als „Bequemlichkeit, keine Durchsetzung“.
- AILmanac-Begleiter: [Einstellungen & Vorrang](/docs/claude-code/settings) · [Berechtigungen](/docs/claude-code/permissions) · [CI/CD für von Agenten geschriebenen Code](/docs/playbooks/ci-for-agent-written-code) · [Harte Ausgabenlimits](/docs/models/hard-spend-caps)

## Weiter

- [CI/CD für von Agenten geschriebenen Code](/docs/playbooks/ci-for-agent-written-code) — die nachgelagerte Hälfte des Review-Warteschlangen-Problems: Sobald die Artefakte Ihre Pipeline erreichen, bricht die Merge-Warteschlange vor dem Runner-Budget, und es gibt dafür eine Rechnung.
- [Die Vertrauensleiter](/docs/frontiers/the-trust-ladder) — die allgemeine Version der obigen Fähigkeitsleiter: wie viel Autonomie einem Agenten zu gewähren ist, gestaffelt danach, was Sie verifizieren können.
- [Agenten evaluieren](/docs/playbooks/evaluating-agents) — wie Sie entscheiden, ob der Rollout tatsächlich Wert erzeugt, bevor jemand anderes entscheidet, dass er es nicht tut.
