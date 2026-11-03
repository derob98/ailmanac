# Echte Dateien erzeugen (docx/pptx/xlsx/pdf)

> Source: https://derob98.github.io/ailmanac/de/docs/claude-app/generating-files · AILmanac (CC BY 4.0) · last verified 2026-10-20

Claude schreibt und führt Code in einer Sandbox aus, um Ihnen ein fertiges Word-Dokument, eine Präsentation, eine Tabelle oder ein PDF zu liefern. Wie man eine Datei brieft, die 30-MB-Obergrenze, der Schalter, den man einschalten muss, und das Prompt-Injection-Risiko, das entsteht, wenn man einem Modell einen Computer gibt.

<LevelBadge level="beginner" />

<VerifyNote lastVerified="2026-10-20" source="https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude">
Laut Help Center von Anthropic: *„Code execution and file creation is available to all Claude users (Free, Pro, Max, Team, and Enterprise) on the web, Claude Desktop, and Claude Mobile.“* Claude kann **.xlsx-, .pptx-, .docx- und PDF**-Dateien erstellen, mit einer Obergrenze von **30 MB pro Datei sowohl für Uploads als auch für Downloads**. In Free, Pro und Max müssen Sie es selbst unter **Settings → Capabilities** einschalten; in Team und Enterprise steuert es ein Owner in den Organisationseinstellungen. Diese Steuerungen ändern sich — bestätigen Sie im Help Center.
</VerifyNote>

Über Text auf dem Bildschirm hinaus kann Claude **echte, herunterladbare Dateien** erzeugen — Word-Dokumente, PowerPoint-Präsentationen, Excel-Tabellen, PDFs —, formatiert und einsatzbereit. Der Mechanismus ist wissenswert, weil er sowohl die Stärke als auch das Risiko erklärt: Claude **schreibt und führt Code in einer abgeschotteten Rechenumgebung (Sandbox) aus** und reicht Ihnen dann, was der Code erzeugt hat.

<Callout type="objectives" items={[
  "Die Funktion einschalten und wissen, welche Oberflächen und Tarife sie haben",
  "Eine Datei so briefen, dass der erste Versuch brauchbar ist statt erst der dritte",
  "Richtig zwischen einer erzeugten Datei, einem Claude Doc und einem Dashboard wählen",
  "Innerhalb der 30-MB-Obergrenze bleiben und wissen, wohin die Datei gehen kann",
  "Das Prompt-Injection-Risiko verstehen, das mit einer Sandbox einhergeht, und wie man es begrenzt"
]} />

## Zuerst einschalten

<Steps items={[
  {title: "Free, Pro und Max — den Schalter umlegen", body: "Öffnen Sie Settings → Capabilities und schalten Sie „Code execution and file creation“ ein. Wenn Claude eine Tabelle immer nur beschreibt, statt sie zu erzeugen, ist das fast immer der Grund."},
  {title: "Team und Enterprise — einen Owner fragen", body: "Die Funktion wird zentral in den Organisationseinstellungen gesteuert. Ein einzelnes Mitglied kann sie nicht für sich selbst aktivieren."},
  {title: "Ihre Oberfläche prüfen", body: "Sie funktioniert in Claude im Web, Claude Desktop und Claude Mobile. Damit ist sie eine der wenigen Erstellungsfunktionen, die nicht auf Web und Desktop beschränkt sind."}
]} />

## Was Sie anfordern können

- **Word (.docx)** — Berichte, Briefe, Angebote, formatierte Dokumente.
- **PowerPoint (.pptx)** — Foliensätze aus einer Gliederung oder Notizen.
- **Excel (.xlsx)** — Tabellen mit Daten, Formeln, einfachen Modellen.
- **PDF** — druckfertige Versionen des Obigen.

Fertige Dateien lassen sich **herunterladen oder direkt in Google Drive speichern**.

## Datei, Doc oder Dashboard?

Das ist die Wahl, die Leute falsch treffen, und sie wurde schärfer, als Claude Docs und Slides [in jedem Tarif allgemein verfügbar](/docs/claude-app/one-claude-docs-and-slides) wurden.

| Sie wollen | Greifen Sie zu | Weil |
| --- | --- | --- |
| Ein Ergebnis zum Übergeben, das in Claude nie wieder angefasst wird | **Eine erzeugte Datei** (diese Seite) | Einmaliger Download. Keine URL, keine Mitwirkenden, keine Kommentare. |
| Ein Dokument, das sich weiter ändert, mit Kolleginnen und Kollegen darin | **Ein Claude Doc oder Slides** | Lebendes Artefakt mit URL, Co-Editing in Echtzeit und Kommentaren. Exportiert in eine Datei, wenn Sie fertig sind. |
| Zahlen, die aktuell bleiben, wenn sich die Daten ändern | **Ein Claude Dashboard** | Jedes Diagramm hängt an einer Live-Abfrage, nicht an einem Snapshot. Siehe [Dashboards & Motion](/docs/claude-app/dashboards-and-motion). |

Eine nützliche Faustregel: **Wenn es Sie nerven würde, es nächste Woche erneut herunterzuladen, wollten Sie ein Doc.**

## So bekommen Sie eine gute Datei

<Steps items={[
  {title: "Das Ergebnis beschreiben, nicht das Thema", body: "Typ, Zielgruppe, Länge, Abschnitte, Ton. „Eine Präsentation über Preise“ erzeugt Raten; „sechs Folien für eine Vorstandssitzung, ein Diagramm pro Folie, keine Aufzählungen“ erzeugt einen Entwurf, den Sie bearbeiten können."},
  {title: "Den Inhalt oder die Quelle liefern", body: "Fügen Sie die Notizen ein, hängen Sie die Daten an oder geben Sie die Gliederung — oder bitten Sie Claude, zuerst den Inhalt zu entwerfen und erst dann die Datei anzufordern. Zwei Schritte schlagen einen verworrenen."},
  {title: "Im Chat verfeinern, zuletzt exportieren", body: "Eine Struktur im Gespräch zu korrigieren ist weit einfacher als in der fertigen .pptx. Iterieren Sie an der Gliederung und fordern Sie dann die Datei an."},
  {title: "Jede berechnete Zahl prüfen", body: "Eine von Claude gebaute Tabelle kann eine Formel enthalten, die subtil falsch ist, und eine selbstsicher wirkende Summe ist der am schwersten zu bemerkende Fehler. Prüfen Sie die Zellen, die zählen, stichprobenartig — siehe Halluzinationen."}
]} />

<PromptCard title="Ein Datei-Briefing mit genug Struktur, um beim ersten Mal zu sitzen">{`Turn these notes into a 6-slide investor update deck (.pptx).

Slides, in order: traction, revenue, roadmap, team, the ask, appendix.
Audience: existing seed investors, read on a laptop, not presented live.

Rules:
- One idea per slide. No slide gets more than 25 words of body text.
- Revenue slide: a single chart, monthly, last 12 months.
- Clean and minimal: one accent color, no stock imagery, no icons.
- Use only numbers from my notes. If a figure I need isn't there,
  leave the placeholder [TBD] and list what's missing at the end.

Notes:
[paste your notes here]`}</PromptCard>

Diese letzte Regel ist die, die Sie rettet. Ohne sie wird eine fehlende Zahl mit etwas Plausiblem aufgefüllt; mit ihr bekommen Sie eine Liste der Lücken. Liefern Sie nie Zahlen aus einer erzeugten Tabelle aus, die Sie nicht geprüft haben — siehe [Halluzinationen](/docs/foundations/hallucinations).

## Die Grenzen, die man kennen sollte

<Callout type="warning" items={[
  "30 MB pro Datei, in beide Richtungen. Das ist die Obergrenze für das, was Sie hochladen, und für das, was Claude zurückgibt. Große Datensätze müssen vor dem Hochladen gesampelt, aggregiert oder aufgeteilt werden.",
  "Es führt echten Code in einer Sandbox aus. Claude bekommt „a sandboxed computing environment“ — einen isolierten Container, getrennt von Ihren Systemen. Das macht eine funktionierende Excel-Formel möglich, und es ist zugleich eine Angriffsfläche.",
  "Netzwerkzugriff ist eine Einstellung, keine Selbstverständlichkeit. Die Konfigurationen reichen von deaktiviert (nur vorinstallierte Pakete) über nur Paketmanager — der Standard für Team und Enterprise — und bestimmte erlaubte Domains bis zu allen Domains außer einer gesetzlichen Sperrliste. Welche davon Sie haben, ändert, was Claude mitten in der Aufgabe abrufen kann.",
  "Prompt Injection ist hier das eigentliche Risiko. Die eigene Warnung von Anthropic: Ein böswilliger Akteur kann unauffällig Anweisungen über externe Dateien oder Websites einschleusen, die Claude dazu verleiten, bösartigen Code auszuführen oder Daten preiszugeben. Die Empfehlung lautet, Claude bei der Nutzung der Funktion zu beobachten und es zu stoppen, wenn es unerwartet Daten berührt."
]} />

Die praktische Gewohnheit: **Behandeln Sie jede Datei oder URL, die Sie nicht selbst geschrieben haben, als nicht vertrauenswürdige Eingabe.** Seien Sie besonders vorsichtig, wenn eine einzelne Anfrage ein externes Dokument liest *und* Netzwerkzugriff hat — diese Kombination macht aus einer versteckten Anweisung Exfiltration. Dieselbe Überlegung, ausführlich, steht unter [Prompt Injection](/docs/security/prompt-injection) und [Code von Drittanbietern prüfen](/docs/security/reviewing-third-party-code).

## Unter der Haube

Diese Fähigkeiten werden von [Skills](/docs/claude-code/skills) angetrieben — demselben Mechanismus, den Sie selbst schreiben können. Das zu wissen ist auf zwei Arten nützlich: Es erklärt, warum die Qualität der Dateiausgabe ohne Modell-Release steigt, und es heißt, dass ein Hausstil, den Sie ständig neu erklären, einmal als Skill festgehalten werden kann, statt in jeden Prompt kopiert zu werden.

## Quiz

<Quiz questions={[
  {q: "Sie fordern im Pro-Tarif eine .xlsx an, und Claude beschreibt die Tabelle in Text, statt eine Datei zu erzeugen. Was ist die wahrscheinlichste Ursache?", options: ["Dateierstellung gibt es nur in Max, Team und Enterprise", "„Code execution and file creation“ ist unter Settings → Capabilities ausgeschaltet", "Tabellen müssen in Claude Desktop angefordert werden", "Die Konversation ist zu lang"], answer: 1, explain: "Dateierstellung ist in allen Tarifen verfügbar — Free, Pro, Max, Team und Enterprise — im Web, in Desktop und Mobile, aber in Free, Pro und Max müssen Sie „Code execution and file creation“ selbst unter Settings → Capabilities aktivieren. In Team und Enterprise steuert es ein Owner zentral."},
  {q: "Sie brauchen einen Quartalsbericht, den Ihr Team die nächsten drei Wochen gemeinsam weiter bearbeitet. Was sollten Sie anfordern?", options: ["Eine erzeugte .docx — das ist das echte Liefer-Format", "Ein Claude Doc, und beim Finalisieren in .docx exportieren", "Ein Claude Dashboard", "Ein PDF, das nach jeder Änderung neu erzeugt wird"], answer: 1, explain: "Eine erzeugte Datei ist ein einmaliger Download ohne URL, Mitwirkende oder Kommentare. Ein Claude Doc ist ein lebendes Artefakt mit Co-Editing in Echtzeit, das nach Word, PDF, Markdown oder Google Docs exportiert, sobald sich der Inhalt setzt. Greifen Sie erst zu einer Datei, wenn Sie nichts mehr ändern."},
  {q: "Was ist die angegebene Obergrenze der Dateigröße für die Dateierstellung?", options: ["10 MB pro Datei", "30 MB pro Datei, für Uploads und Downloads", "100 MB pro Konversation", "Es gibt kein dokumentiertes Limit"], answer: 1, explain: "Das dokumentierte Maximum sind 30 MB pro Datei, und es gilt in beide Richtungen — für das, was Sie hochladen, und das, was Claude erzeugt. Große Quelldaten brauchen vor dem Hochladen Sampling oder Aggregation."},
  {q: "Warum warnt Anthropic davor, Claude bei der Dateierstellung zu beobachten?", options: ["Weil erzeugte Dateien Ihr Nutzungslimit ohne Warnung überschreiten können", "Weil die Sandbox Zugriff auf Ihr lokales Dateisystem hat", "Weil eine externe Datei oder Website versteckte Anweisungen tragen kann, die Claude dazu verleiten, bösartigen Code auszuführen oder Daten preiszugeben", "Weil Formeln in .xlsx-Dateien ohne Validierung erzeugt werden"], answer: 2, explain: "Die Funktion gibt Claude eine Sandbox-Umgebung, die echten Code ausführt, und Anthropic weist darauf hin, dass ein böswilliger Akteur unauffällig Anweisungen in eine externe Datei oder Website einbetten kann. Die Empfehlung: den Lauf beobachten und stoppen, wenn Claude unerwartet Daten nutzt oder darauf zugreift. Die Sandbox ist von Ihren eigenen Systemen isoliert — das Risiko sind eingeschleuste Anweisungen, nicht der Zugriff auf das lokale Dateisystem."}
]} />

<Callout type="takeaways" items={[
  "Dateierstellung gibt es in jedem Tarif und auf jeder Oberfläche — Web, Desktop und Mobile —, aber Free-, Pro- und Max-Nutzer müssen sie zuerst unter Settings → Capabilities aktivieren.",
  "Sie funktioniert, indem Code in einer isolierten Sandbox geschrieben und ausgeführt wird. Deshalb rechnen Excel-Formeln tatsächlich, und deshalb gibt es die Sicherheitshinweise.",
  "Briefen Sie das Ergebnis, nicht das Thema: Typ, Zielgruppe, Länge, Struktur und eine explizite Regel, dass Lücken gemeldet statt erfunden werden.",
  "Wählen Sie bewusst: Eine Datei ist ein einmaliger Download, ein Claude Doc ein lebendes Dokument, ein Dashboard eine Live-Abfrage. Falsch zu wählen kostet einen Neuaufbau.",
  "30 MB pro Datei, in beide Richtungen. Alles Größere vor dem Hochladen sampeln oder aggregieren.",
  "Behandeln Sie jede externe Datei oder URL als nicht vertrauenswürdige Eingabe und beobachten Sie den Lauf — versteckte Anweisungen sind das dokumentierte Risiko, und sie sind am schlimmsten bei weit offenem Netzwerkzugriff."
]} />

## Weiter

- [Claude Dashboards & Claude Motion](/docs/claude-app/dashboards-and-motion) — wenn Sie Live-Zahlen statt eines Snapshots brauchen
- [One Claude: Die Zusammenführung, Claude Docs & Claude Slides](/docs/claude-app/one-claude-docs-and-slides) — die lebende Dokument-Alternative zum Download
- [Artifacts: Live, ausführbare Ausgaben](/docs/claude-app/artifacts) — das Panel, in das alles gerendert wird
- [Schreiben & Content-Erstellung](/docs/playbooks/writing) · [Business, Marketing & Strategie](/docs/playbooks/business)
