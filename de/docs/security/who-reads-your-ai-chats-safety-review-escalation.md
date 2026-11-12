# Wer liest Ihre KI-Chats — Sicherheitsprüfung, Polizeimeldung und die Aufbewahrung, die Sie nicht löschen können

> Source: https://derob98.github.io/ailmanac/de/docs/security/who-reads-your-ai-chats-safety-review-escalation · AILmanac (CC BY 4.0) · last verified 2026-10-06

Drei öffentlich berichtete Fälle seit August 2026 endeten damit, dass ein KI-Anbieter die Polizei rief. Diese Seite dokumentiert die tatsächliche Pipeline — Klassifikator, spezialisierte Warteschlange, menschlicher Prüfer, Meldung — und die Aufbewahrungsrechnung, die niemand liest: 2 Jahre für markierte Inhalte und 7 Jahre für Klassifikationswerte bei Anthropic, selbst unter einem Zero-Data-Retention-Vertrag, bis zu 3 Jahre für von Menschen geprüfte Gemini-Chats, die das Löschen Ihrer Aktivität überleben, 30 Tage Sicherheitsaufbewahrung bei einem temporären ChatGPT-Chat und ein verpflichtendes 30-Tage-Fenster bei Anthropics Covered Models, das ZDR vollständig außer Kraft setzt.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={["Den realen Eskalationspfad nachzeichnen — automatisierter Klassifikator, spezialisierte Prüf-Warteschlange, geschulter menschlicher Prüfer, Kontosperre, Meldung an Strafverfolgungsbehörden — und sehen, wo die Latenz tatsächlich liegt (Tage, nicht Sekunden)","Die Asymmetrie kennenlernen, die OpenAI veröffentlicht hat und die fast niemand zitiert: Drohungen gegen andere können an die Polizei gemeldet werden, Suizid- und Selbstverletzungsfälle ausdrücklich nicht","Die Aufbewahrungsrechnung über Anbieter hinweg durchführen, einschließlich der zwei Zahlen, die jede Datenschutzeinstellung überleben, die Sie umschalten können","Verstehen, warum ein Zero-Data-Retention-Vertrag Sie nicht von der Sicherheits-Pipeline ausnimmt — und warum Anthropics leistungsfähigste Modelle unter ZDR überhaupt nicht nutzbar sind","Sehen, was Inkognito-, temporäre und Aktivität-aus-Modi tatsächlich regeln (Training und Verlauf) und was nicht (Missbrauchsüberwachung)","Pro Textklasse entscheiden, auf welche Oberfläche sie gehört — und was stattdessen zu tun ist, wenn die ehrliche Antwort „auf keine“ lautet"]} />

Zwischen August und Anfang Oktober 2026 wurden drei Unterhaltungen mit einem
kommerziellen KI-Assistenten öffentlich zu Polizeisachen. Eine führte zu einer Festnahme
wegen eines Verbrechens. Das Muster ist weder eine Panne noch eine neue Richtlinie —
es ist der dokumentierte Betrieb einer Missbrauchs-Pipeline, die jeder große Anbieter
betreibt, beschrieben in Hilfecenter-Artikeln, die fast niemand liest, bevor er etwas einfügt.

Die nützliche Frage ist nicht *„Lesen die meine Chats?“* — die Antwort lautet seit
Jahren ja, in einem engen und spezifischen Sinn. Die nützlichen Fragen sind, **was
einen Menschen zum Hinsehen veranlasst**, **was ein Mensch danach tun darf** und
**welche Ihrer Datenschutzeinstellungen diesen Pfad überhaupt berühren.** Die dritte
Antwort ist die, die Leute überrascht: meistens keine.

## Was in den drei Fällen tatsächlich passiert ist

<VerifyNote lastVerified="2026-10-06" source="https://sfstandard.com/2026/09/04/anthropic-threat-claude-sfpd/">
Die Falldaten stammen aus zeitnaher Berichterstattung und sind Gegenstand laufender
Strafverfahren; Anklagepunkte sind Vorwürfe, keine Feststellungen. Die Richtlinienzahlen
stammen aus der Anbieterdokumentation, die am Prüfdatum aktuell war, und ändern sich
ohne Ankündigung — lesen Sie die verlinkten Hilfecenter-Artikel erneut, bevor Sie sich
auf eine Zahl hier verlassen.
</VerifyNote>

**San Francisco, August 2026.** Ein Claude-Nutzer soll geschrieben haben, er habe ein
AR-15 gekauft und den CEO von Anthropic „im Visier“. Laut dem von *The San Francisco
Standard* zitierten Polizeibericht wurden die Nachrichten am Freitag, dem 14. August
um 14:30 Uhr gesendet. Anthropic benachrichtigte die SFPD **am folgenden Dienstag um 9 Uhr**.
Beamte suchten Anthropics Büro auf; die Person war nicht anwesend und war nach dem
damaligen Bericht weder festgenommen noch angeklagt worden. Er sagte dem *Standard*,
er habe es nicht ernst gemeint. Anthropics Erklärung: Das Konto wurde gesperrt und der
Fall gemeldet, und „das ist unser Sicherheitsprozess, der wie vorgesehen funktioniert“.

**Florida, Ende September 2026.** Carli Michelle Heller aus Bonita Springs hatte Claude
ähnlich wie ein Tagebuch benutzt. Laut Festnahmebericht schrieb sie am 26. September,
sie werde das Lee County Sheriff's Office zusammenschießen, und am 27. September, sie
habe eine neue Waffe besorgt. Automatisierte Systeme markierten den Text, ein
Prüfteam bewertete ihn, Anthropic meldete ihn, Deputies fanden sie zu Hause und nahmen
sie ohne Zwischenfall fest. Sie wurde wegen einer schriftlichen Gewaltdrohung angeklagt —
ein Verbrechen zweiten Grades — mit einem Gerichtstermin im November.

*Tom's Hardware* zählte den Fall aus Florida als **mindestens die dritte** Claude-Unterhaltung,
die seit August bei der Polizei landete.

### Die drei Details, die man mitnehmen sollte

1. **Die Latenz beträgt Tage, nicht Sekunden.** Vom Freitagnachmittag bis zum
   Dienstagmorgen sind es etwa vier Tage. Das ist eine von Menschen besetzte
   Prüf-Warteschlange, kein an eine Leitstelle angeschlossener Auslöser. Das schneidet
   in beide Richtungen: Es ist keine Echtzeitüberwachung, und es ist auch kein System,
   das in ein tatsächlich unmittelbar bevorstehendes Ereignis eingreifen kann.
2. **Ein Mensch traf die Entscheidung.** In beiden Fällen *leitete* der automatisierte
   Klassifikator nur *weiter*. Die Entscheidung, die Polizei zu kontaktieren, traf ein
   geschulter Prüfer, der den Text las. Das, was Leute am unangenehmsten finden — ein
   Mitarbeiter hat mein privates Tagebuch gelesen —, ist das gewollte Design, nicht der Fehlermodus.
3. **Die Kontosperre kam zuerst.** Die Sperre ging der Meldung voraus oder begleitete sie.
   Wenn Sie aus harmlosen Gründen je auf der falschen Seite eines Klassifikators landen,
   ist das erste Symptom der Verlust des Zugangs, kein Anruf.

## Die Pipeline, wie dokumentiert

Jeder große Anbieter betreibt irgendeine Version davon. Das Vokabular unterscheidet sich; die Form nicht.

<Steps items={[
  {title: "1 — Automatisierte Klassifikation bei jeder Anfrage", body: "Sicherheitsklassifikatoren bewerten Eingaben und Ausgaben. Das läuft bei im Wesentlichen dem gesamten Traffic zu Verbraucheroberflächen und lässt sich nicht abwählen; so werden Nutzungsrichtlinien im großen Maßstab durchgesetzt. Die Werte sind eigene Daten und werden getrennt von der Unterhaltung aufbewahrt — eine Unterscheidung, die später auf dieser Seite enorm wichtig wird."},
  {title: "2 — Weiterleitung in eine spezialisierte Warteschlange", body: "Hoch bewertete Unterhaltungen in bestimmten Kategorien werden aus dem normalen Ablauf herausgeleitet. OpenAIs veröffentlichte Beschreibung: „Wenn wir Nutzer erkennen, die planen, anderen zu schaden, leiten wir ihre Unterhaltungen an spezialisierte Pipelines weiter, in denen sie von einem kleinen, auf unsere Nutzungsrichtlinien geschulten Team geprüft werden, das befugt ist, Maßnahmen zu ergreifen, einschließlich der Sperrung von Konten.“ Anthropics Usage Policy hält fest, dass sein Safeguards Team „Erkennung und Überwachung implementieren wird, um unsere Usage Policy durchzusetzen“."},
  {title: "3 — Menschliche Prüfung", body: "Ein geschulter Prüfer liest die Unterhaltung. Bei Google ist diese Funktion ausdrücklich und breiter als Missbrauch: Eine Teilmenge der Gemini-Chats wird von Menschen geprüft, einschließlich geschulter Dienstleister, um Qualität und Sicherheit zu bewerten und Verstöße gegen die Nutzungsbedingungen zu behandeln. Googles eigene Anweisung an Nutzer ist deutlich: Geben Sie keine vertraulichen Informationen ein, die ein Prüfer nicht sehen soll."},
  {title: "4 — Durchsetzung", body: "Drosselung, Sperrung oder Beendigung. Anthropics Usage Policy behält sich genau das vor: „wir können Ihren Zugang zu unseren Produkten oder Diensten drosseln, aussetzen oder beenden“. Das ist das bei Weitem häufigste Ergebnis und das einzige, das die meisten markierten Nutzer je erleben."},
  {title: "5 — Externe Meldung, in einem engen Band", body: "Zwei verschiedene Auslöser. Verpflichtend: Anthropic gibt an, dass es die zuständigen Behörden informiert, wenn es CSAM erkennt, einschließlich KI-generiertem CSAM, oder die Nötigung oder Verleitung eines Minderjährigen. Ermessensabhängig: OpenAIs Position ist, dass „wir, wenn menschliche Prüfer feststellen, dass ein Fall eine unmittelbare Gefahr ernsthafter körperlicher Schädigung anderer beinhaltet, ihn an die Strafverfolgung weiterleiten können“. Anthropics Datenschutzerklärung stützt dasselbe Ermessen auf die Gutgläubigkeit, dass eine Offenlegung unter anderem „zur Verhinderung ernsthafter Schäden an Personen oder Eigentum“ vernünftigerweise notwendig ist."},
]} />

### Die Asymmetrie, die fast niemand zitiert

Als OpenAI die obige Passage veröffentlichte, bekam der Satz, der darauf folgte, weit
weniger Aufmerksamkeit und ist wohl folgenreicher:

> OpenAI erklärte, es leite „derzeit keine Selbstverletzungsfälle an die Strafverfolgung
> weiter, um die Privatsphäre der Menschen angesichts der einzigartig privaten Natur von
> ChatGPT-Interaktionen zu respektieren“.

Die veröffentlichte Linie wird also bei **Schaden an anderen** gezogen, nicht bei Not.
Jemand, der sich um sich selbst in einer Krise befindet, wird innerhalb des Produkts
behandelt — Krisenressourcen, Änderungen im Modellverhalten, möglicherweise menschliche
Prüfung — ohne Polizeimeldung. Wer eine Drohung gegen einen Dritten schreibt, ist in einer
ganz anderen Pipeline. Wenn Sie sich nur eines über Eskalationsschwellen merken: Die Linie
betrifft, *wer verletzt wird*, und sie ist eine Richtlinienentscheidung, die ein Anbieter ändern kann.

## Die Aufbewahrungsrechnung

Das ist der Abschnitt, der das Verhalten ändert, weil die Zahlen länger sind, als fast
jeder annimmt, und mehrere davon immun gegen die Einstellungen in Ihrem Einstellungsfenster sind.

| Was | Anbieter | Dauer | Übersteht das Löschen durch Sie? |
|---|---|---|---|
| Normale Unterhaltung, die Sie löschen | Anthropic (Verbraucher) | Sofort aus dem Verlauf verschwunden, binnen **30 Tagen** aus dem Back-End-Speicher bereinigt | — |
| Als Verstoß gegen die Usage Policy **markierte** Unterhaltung | Anthropic | Ein- und Ausgaben bis zu **2 Jahre** | **Ja** |
| Trust-and-Safety-**Klassifikationswerte** für diese Unterhaltung | Anthropic | Bis zu **7 Jahre** | **Ja** |
| Daten, für die Sie sich zur Modellverbesserung entschieden haben | Anthropic (Verbraucher) | De-identifiziert, bis zu **5 Jahre** in Trainings-Pipelines | Je nach Opt-out zum damaligen Zeitpunkt |
| Von einem **menschlichen Prüfer** gelesener Chat | Google (Gemini Apps) | Bis zu **3 Jahre**, von Ihrem Google-Konto getrennt | **Ja** — das Löschen Ihrer Aktivität entfernt ihn nicht |
| Gemini Apps Activity **an** | Google | Standardmäßig automatisches Löschen nach **18 Monaten** (einstellbar auf 3 oder 36 Monate oder aus) | — |
| Gemini Apps Activity **aus** | Google | Temporäre Chats werden **72 Stunden** aufbewahrt, um Ihnen zu antworten und die Sicherheit zu schützen | — |
| ChatGPT **Temporary Chat** | OpenAI | Nicht im Verlauf, nicht im Gedächtnis, nicht für Training genutzt; kann bis zu **30 Tage** für die Sicherheit aufbewahrt werden | — |
| Prompts und Completions bei einem **Covered Model** | Anthropic | **Mindestens 30 Tage**, verpflichtend, dann automatisch gelöscht | — |

Zwei Zeilen sollte man zweimal lesen.

**Sieben Jahre Klassifikationswerte.** Die Unterhaltung selbst mag weg sein; das
strukturierte Urteil darüber bleibt fast ein Jahrzehnt bestehen. Ein Klassifikationswert
ist keine Kopie Ihres Textes, aber er ist eine dauerhafte, kontogebundene Aussage, dass
Ihr Text in einer bestimmten Kategorie auf bestimmte Weise bewertet wurde. Für alle, die
über langfristige Exposition nachdenken, ist das der echte Aufbewahrungshorizont, und er
ist etwa 85-mal länger als das 30-Tage-Bereinigungsfenster, das Leute nennen, wenn sie
sagen, Löschen funktioniere.

**Drei Jahre, die das Löschen überdauern.** Google sagt ausdrücklich, dass von Menschen
geprüfte Chats und ihre zugehörigen Metadaten — Sprache, Gerätetyp, Standortinformationen,
Feedback — *nicht* gelöscht werden, wenn Sie Ihre Aktivität löschen, gerade weil sie von
Ihrem Konto getrennt wurden. Die Anonymisierung ist es, die die Aufbewahrung vertretbar
macht, und zugleich das, was sie aus Ihrer Sicht dauerhaft macht: Es gibt keinen
Konto-Handle mehr, gegen den ein Löschbefehl ausgegeben werden könnte. Google versucht,
geprüfte Chats zu trennen, bevor ein Mensch sie sieht, aber alles, was Sie *in* die
Nachricht getippt haben, ist Teil der Nachricht.

## Der ZDR-Mythos

Das ist das häufigste Missverständnis unter Entwicklern, die glauben, das Problem
vertraglich gelöst zu haben.

Zero Data Retention für Claude Code auf Claude for Enterprise bedeutet, dass Prompts und
Antworten in Echtzeit verarbeitet und „nach der Rückgabe der Antwort nicht von Anthropic
gespeichert“ werden — **„außer wo es zur Einhaltung von Gesetzen oder zur Bekämpfung von
Missbrauch nötig ist.“** Anthropics eigene Dokumentation buchstabiert die Ausnahme aus:

> Auch mit aktiviertem ZDR kann Anthropic Daten aufbewahren, wo es gesetzlich erforderlich
> ist oder um Verstöße gegen die Usage Policy zu behandeln. Wird eine Sitzung wegen eines
> Richtlinienverstoßes markiert, kann Anthropic die zugehörigen Ein- und Ausgaben bis zu
> 2 Jahre aufbewahren.

Und gesondert, zu dem, was ZDR von vornherein nie abdeckte:

> Anthropic bewahrt weiterhin die Ergebnisse des User-Safety-Klassifikators auf, um die
> Usage Policy durchzusetzen.

Das richtige mentale Modell lautet also: **ZDR entfernt die Speicherung, nicht die Pipeline.**
Die Klassifikation findet weiterhin bei jeder Anfrage statt; die Werte werden weiterhin
aufbewahrt; eine markierte Sitzung erhält weiterhin eine zweijährige Aufbewahrung. ZDR ist
eine ausgezeichnete Kontrolle gegen *routinemäßige* Aufbewahrung und eine schlechte gegen
*Missbrauchsreaktions*-Aufbewahrung, und genau das ist die Aufbewahrung, die zählt, wenn
etwas, das Sie gesendet haben, je angefochten wird.

### Vier weitere Dinge, die ZDR nicht tut

Anthropic dokumentiert diese ausdrücklich, und jedes hat schon jemanden erwischt:

- **Es deckt die Web-App oder Cowork nicht ab.** ZDR für Claude Code deckt Claude-Code-Inferenz ab.
  Chat auf claude.ai über dieselbe Enterprise-Oberfläche und Cowork-Sitzungen folgen der
  Standardaufbewahrung.
- **Es folgt nicht dem Nutzer, nur der Organisation.** ZDR gilt für Anfragen, die sich in
  einer ZDR-aktivierten Organisation authentifizieren. Ein Entwickler, der sich mit einem
  privaten Konto oder mit einem API-Schlüssel einer anderen Organisation anmeldet, ist
  schlicht nicht abgedeckt. Anthropics Antwort sind die Managed Settings `forceLoginMethod`
  und `forceLoginOrgUUID` — sinnvoll auszurollen, wenn Sie glauben, dass ZDR für Sie tragend ist.
- **Es überträgt sich nicht auf neue Organisationen.** ZDR wird pro Organisation vom
  Account-Team von Anthropic aktiviert und gilt nicht automatisch für neue Organisationen,
  die unter demselben Konto angelegt werden.
- **Es deckt Dritte nicht ab.** Daten, die von MCP-Servern und externen Integrationen
  verarbeitet werden, liegen vollständig außerhalb von ZDR. (Siehe [Was Ihr Agent
  hochlädt](/docs/security/what-your-agent-uploads) und [MCP-Server
  absichern](/docs/security/securing-mcp-servers).)

### Covered Models: Der Tausch zwischen Fähigkeit und Aufbewahrung ist jetzt ausdrücklich

Anthropic bezeichnet seine leistungsfähigsten Modelle — derzeit Claude Mythos 5.1,
Claude Fable 5.1, Claude Mythos 5 und Claude Fable 5 — als **Covered Models**,
die standardmäßig Datenaufbewahrung erfordern. Prompts und Completions werden mindestens
30 Tage aufbewahrt und dann automatisch gelöscht, und das aufbewahrte Fenster wird von
automatisierten Sicherheitssystemen bewertet, die darauf ausgelegt sind, schädliche Inhalte zu markieren.

Der genannte Grund ist der wirklich interessante Teil, denn er ist ein Eingeständnis der
Grenzen der Filterung pro Anfrage:

> Weil „einige Formen von Missbrauch erst über viele Anfragen hinweg erkennbar werden,
> erfordern diese Modelle Schutzmaßnahmen, die über ein aufbewahrtes Fenster von
> Nutzungsdaten arbeiten statt jeweils auf einer einzelnen Anfrage“.

Eine einzelne Anfrage, die ein harmlos aussehendes Teil eines gefährlichen Ganzen
zusammensetzt, ist für einen zustandslosen Klassifikator unsichtbar. Das Muster zu
erkennen setzt voraus, sich an die Anfragen zu erinnern. Das ist ein echtes
Sicherheitsargument, und es bedeutet, dass **Fähigkeit und Aufbewahrung jetzt
konstruktionsbedingt gekoppelt sind**: Bei diesen Modellen können Sie die Frontier-Fähigkeit
haben oder Zero Retention, nicht beides. ZDR ist für Covered Models in
Standardkonfigurationen nicht verfügbar; wo einer Organisation oder einem Workspace die
verpflichtende Aufbewahrung fehlt, werden Anfragen für diese Modelle serverseitig
abgelehnt, unabhängig von der Client-Konfiguration, und der Alias `best` von Claude Code
löst stillschweigend zu Opus statt zu Fable auf. Anthropic hat einen Enterprise-Frontier-
Safeguards-Pfad für berechtigte Kunden signalisiert, um Fable 5 und 5.1 unter ZDR für
interne Geschäftsanwendungen zu nutzen, der im Herbst 2026 ausgerollt wird — bestätigen Sie
den aktuellen Stand mit Ihrem Account-Team, statt es so oder so anzunehmen.

Die modellseitige Sicht darauf finden Sie im [Fable-5.1-Leitfaden](/docs/models/fable-5-1-field-guide),
der dasselbe verpflichtende 30-Tage-Fenster aus der Perspektive des API-Verhaltens vermerkt:
Eine Anfrage aus einer Organisation ohne dieses liefert einen 400er-Fehler.

## Was Ihre Datenschutzeinstellungen tatsächlich steuern

Hier ist die saubere Trennung, und sie ist die praktische These dieser Seite.

| Kontrolle | Regelt | Regelt **nicht** |
|---|---|---|
| Anthropic-Inkognito-Chat | Von der Modellverbesserung ausgeschlossen, auch wenn Verbesserung an ist | Sicherheitsmarkierung und die darauf folgende Aufbewahrung |
| ChatGPT Temporary Chat | Verlauf, Gedächtnis, Training | Sicherheits-/Missbrauchsaufbewahrung — bis zu 30 Tage laut OpenAIs FAQ |
| Gemini Apps Activity aus | Training, menschliche Prüfung künftiger Chats, langfristige Aktivitätsspeicherung | Ein 72-Stunden-Fenster, das aufbewahrt wird, um Ihnen zu antworten *und die Sicherheit zu schützen* |
| Unterhaltung löschen | Ihr Verlauf und Back-End-Kopien auf einem Bereinigungs-Timer | Markierte Inhalte, Klassifikationswerte, bereits geprüfte Chats |
| Zero Data Retention | Routinemäßige Speicherung von Prompts und Completions | Die Klassifikation selbst, die Wertaufbewahrung, die Aufbewahrung markierter Sitzungen |

Lesen Sie die rechte Spalte als einen einzigen Satz: **Verbraucher-Datenschutzkontrollen sind
Training-und-Verlauf-Kontrollen. Keine davon ist eine Missbrauchsüberwachungs-Kontrolle.**
Das ist keine im Kleingedruckten versteckte Falle — es ist die einzige Möglichkeit, wie eine
Nutzungsrichtlinie überhaupt durchsetzbar sein kann. Aber es bedeutet, dass das mentale
Modell „Inkognito heißt, niemand sieht das“ auf eine Weise falsch ist, die zählt.

Eine Kontrolle verengt die menschliche Prüfung tatsächlich: Google lässt Sie den Pfad
abschalten, der Chats an Prüfer weiterleitet, über **myaccount.google.com → Daten und
Datenschutz → Gemini Apps Activity → Ausschalten**. Künftige Unterhaltungen werden dann
nicht zur menschlichen Prüfung gesendet und nicht für Training genutzt. Bereits geprüfte
Chats liegen weiterhin in ihrem Dreijahresfenster.

## Der rechtliche Mechanismus, kurz

Heller wurde nach Floridas Gesetz zu schriftlichen Drohungen angeklagt, **Fla. Stat.
836.10**. Seine Tatbestandsmerkmale sind lesenswert, weil sie erklären, wie das Schreiben
an einen Chatbot überhaupt angeklagt werden kann. Das Gesetz erfasst eine Person, die ein
Schriftstück oder eine andere Aufzeichnung, **einschließlich einer elektronischen
Aufzeichnung**, sendet, postet oder übermittelt — oder deren Senden, Posten oder
Übermitteln veranlasst —, *„auf eine Weise, auf die sie von einer anderen Person eingesehen
werden kann“*, mit einer Drohung zu töten oder körperlichen Schaden zuzufügen oder eine
Massenschießerei oder einen terroristischen Akt zu verüben. Es ist ein Verbrechen zweiten Grades.

Zwei Beobachtungen, als Lesart des Gesetzestextes und nicht als Rechtsberatung:

- **Der Text verlangt keinen beabsichtigten menschlichen Empfänger.** Er verlangt eine
  Aufzeichnung, die auf eine Weise übermittelt wird, in der sie von einer anderen Person
  *eingesehen werden kann*. Eine Unterhaltung, die auf den Servern eines Anbieters
  gespeichert und von den Prüfern dieses Anbieters lesbar ist, liegt nicht offensichtlich
  außerhalb dieser Formulierung. Das ist genau die Lücke zwischen dem, was ein Nutzer zu
  tun glaubt (privat schreiben), und dem, was das Gesetz beschreibt (eine einsehbare
  elektronische Aufzeichnung übermitteln).
- **Absicht bleibt ein Tatbestandsmerkmal.** Floridas Musterelemente verlangen, dass der
  Angeklagte die Drohung als *echte Drohung* (true threat) beabsichtigte — die
  dogmatische Linie, die eine strafbare Drohung von Übertreibung oder Dampfablassen trennt
  und das offensichtliche Terrain einer Verteidigung. „Ich habe nur bei einem Chatbot Dampf
  abgelassen“ ist ein Tatsachenargument über Absicht, kein durch das Medium geschaffener sicherer Hafen.

Wenn Sie das Gesetz selbst brauchen: Es wird vom Florida Senate veröffentlicht; der Link
steht in den Quellen. Wenn Sie in tatsächlichen rechtlichen Schwierigkeiten sind, sprechen
Sie mit einem Anwalt, nicht mit einem Leitfaden.

## Wohin also mit dem Text?

Das ehrliche Entscheidungsverfahren, nach Textklasse.

| Textklasse | Richtige Oberfläche | Warum |
|---|---|---|
| Gewöhnliche Arbeit, Code, Schreiben | Jeder gehostete Assistent | Die Pipeline existiert, ist für Sie aber irrelevant |
| Vertrauliche Geschäftsdaten | Commercial-/Enterprise-Tarif mit den richtigen Bedingungen; ZDR, wenn Sie sich qualifizieren | Routineaufbewahrung entfällt; Missbrauchsaufbewahrung bleibt |
| Regulierte Daten (Gesundheit, Finanzen) | BAA-/HIPAA-konfigurierte Enterprise-Bereitstellung | Vertraglicher, nicht nur technischer Schutz |
| Sicherheitsforschung zu Gewalt, Waffen, Exploits | Gehostet ist in Ordnung — aber **Kontext im selben Kanal liefern** | Prüfer lesen Text, und Kontext unterscheidet Forschung von Absicht |
| Tagebuch, Krise, aufdringliche Gedanken, Ideation | **Lokales Modell oder ein Mensch** | Die eine Klasse, in der die Pipeline wirklich gegen das Interesse des Nutzers arbeitet |

Diese letzte Zeile ist der Fall Florida in einer Zeile. Ein Chat-Assistent hat die
*Anmutung* eines Tagebuchs — fühlt sich privat an, ist immer verfügbar, langweilt sich nie —
und keine seiner *Eigenschaften*. Wenn Sie die Anmutung wollen, betreiben Sie das Modell
auf Ihrer eigenen Maschine, wo die Pipeline nicht existiert, weil es keinen Server gibt.

<PromptCard title="Ein Tagebuch, das nie ein Klassifikator sieht">{`# one-time: install Ollama, then pull a small local model
ollama pull llama3.2

# a private journalling session — no network, no review queue, no retention
ollama run llama3.2`}</PromptCard>

Alles in dieser Sitzung bleibt auf Ihrer Festplatte. Siehe [Modelle lokal mit Ollama
betreiben](/docs/models/run-models-locally-ollama) für das vollständige Setup und
[Der private lokale KI-Stack](/docs/models/private-local-ai-stack) für die Architektur,
die die gehostete Oberfläche ganz entfernt.

Der andere praktische Schritt: Wenn Ihre legitime Arbeit Gewalt, Waffen, Selbstverletzung
oder Ausbeutung tatsächlich als *Gegenstand* beinhaltet, sagen Sie das in der Unterhaltung.
Ein Klassifikator bewertet Text; ein menschlicher Prüfer liest ihn. Ausdrücklich genannter
Kontext ist das Einzige in Ihrer Hand, das verändert, was der Prüfer schlussfolgert.

<PromptCard title="Dem Prüfer den Kontext geben, den ein Klassifikator nicht ableiten kann">{`Context for this conversation, stated up front:

I am a [threat analyst / security researcher / novelist / clinician / trust-and-safety
engineer] working on [specific artefact: a tabletop exercise, a published paper,
chapter 14 of a manuscript, an abuse-detection ruleset].

I need to discuss [violent / self-harm / weapons / exploitation] subject matter as
material to be analysed, depicted or detected — not planned. My output is
[a report / fiction / a detection rule], not an operational plan.

Please keep that frame for the whole thread, and tell me if a request of mine
crosses from analysis into operational detail so I can rephrase it.`}</PromptCard>

Diese letzte Zeile ist die nützliche Hälfte. Sie bittet das Modell, als kooperativer
Grenzhüter zu agieren, statt Sie raten zu lassen, und ein Thread mit einem ausdrücklichen
Austausch aus Ablehnung und Umformulierung liest sich für einen Prüfer ganz anders als
einer ohne.

## Was das nicht bedeutet

Drei Überkorrekturen, die man vermeiden sollte, weil der Diskurs um diese Fälle alle drei hervorgebracht hat:

- **Es ist keine kontinuierliche Überwachung durch Menschen.** Der menschliche Schritt wird
  von einem kleinen Bruchteil der Unterhaltungen erreicht, die in bestimmten Kategorien per
  Klassifikator weitergeleitet werden. Die Standarderfahrung jeder dieser Pipelines ist,
  dass niemand Ihren Chat je liest.
- **Es ist nicht neu.** Inhaltsklassifikation plus eine menschliche Missbrauchs-Warteschlange
  plus eine enge rechtliche Meldeklausel ist die Standardarchitektur jeder großen
  Kommunikationsplattform und seit zwei Jahrzehnten so. Neu ist die *Intimität* der
  Eingabe — Leute sagen einem Assistenten Dinge, die sie nie posten würden — und die
  Tatsache, dass die Aufbewahrungsausnahmen jetzt lang und aufgeschrieben sind.
- **Es ist nicht auf einen Anbieter beschränkt.** Jede Tabelle auf dieser Seite hat Einträge
  für Anthropic, OpenAI und Google, weil alle drei dasselbe Grunddesign veröffentlichen.
  Einen Anbieter auf dieser Achse zu wählen heißt, konkrete dokumentierte Zahlen zu
  vergleichen, keine Stimmungen. Die eine echte Wahlachse ist **gehostet versus lokal**, und
  [Einen Modellanbieter wählen](/docs/foundations/choosing-a-model-provider) ist die Seite
  für den Rest dieser Entscheidung.

<Flashcards cards={[
  {front: "Sicherheitsklassifikator", back: "Ein automatisiertes Modell, das Ein- und Ausgaben bei im Wesentlichen dem gesamten Verbraucher-Traffic nach Richtlinienkategorien bewertet. Es leitet weiter, es entscheidet nicht. Seine Werte werden getrennt von der Unterhaltung aufbewahrt — bei Anthropic bis zu 7 Jahre."},
  {front: "Spezialisierte Prüf-Pipeline", back: "Die Warteschlange, in die hoch bewertete Unterhaltungen geleitet werden. OpenAI beschreibt sie als von „einem kleinen, auf unsere Nutzungsrichtlinien geschulten Team“ geprüft, das befugt ist, Konten zu sperren. Beobachtete Latenz im SFPD-Fall: etwa vier Tage."},
  {front: "Notfall-/Ernstschaden-Offenlegungsklausel", back: "Die Bestimmung der Datenschutzerklärung, die die Offenlegung an die Strafverfolgung bei gutgläubiger Annahme erlaubt, dass sie vernünftigerweise notwendig ist, um ernsthaften Schaden an Personen oder Eigentum zu verhindern. Ermessensabhängig, anders als die verpflichtende CSAM-Meldepflicht."},
  {front: "Die Linie zwischen Selbstverletzung und Schaden an anderen", back: "OpenAIs veröffentlichte Schwelle: Unmittelbare Gefahren ernsthafter körperlicher Schädigung anderer können an die Polizei gemeldet werden; Selbstverletzungsfälle werden ausdrücklich nicht gemeldet, um die Privatsphäre der Nutzer zu respektieren."},
  {front: "Zero Data Retention (ZDR)", back: "Prompts und Antworten werden nach der Rückgabe der Antwort nicht gespeichert — außer wo es zur Einhaltung von Gesetzen oder zur Bekämpfung von Missbrauch nötig ist. Entfernt die Routinespeicherung, nicht die Klassifikations-Pipeline, nicht die Wertaufbewahrung und nicht die 2-Jahres-Aufbewahrung einer markierten Sitzung."},
  {front: "Covered Model", back: "Eine Anthropic-Bezeichnung (Mythos 5.1, Fable 5.1, Mythos 5, Fable 5), die mindestens 30 Tage verpflichtende Aufbewahrung mit Prüfung durch automatisierte Sicherheitssysteme verlangt, weil sich manche Formen von Missbrauch nur über viele Anfragen hinweg erkennen lassen. ZDR ist für sie in Standardkonfigurationen nicht verfügbar."},
  {front: "Aufbewahrung von Klassifikationswerten", back: "Bis zu 7 Jahre bei Anthropic für die Trust-and-Safety-Werte einer Unterhaltung, die als Verstoß gegen die Usage Policy markiert wurde — gegenüber bis zu 2 Jahren für die Ein- und Ausgaben selbst."},
  {front: "Von Menschen geprüfter Chat (Gemini)", back: "Ein Chat, den ein Google-Prüfer gelesen hat. Bis zu 3 Jahre aufbewahrt, von Ihrem Google-Konto getrennt und daher nicht entfernt, wenn Sie Ihre Gemini-Aktivität löschen."},
  {front: "True Threat", back: "Das Absichtselement, das Floridas Musterelemente unter Fla. Stat. 836.10 verlangen und das eine strafbare Drohung von Übertreibung trennt. Das Medium (ein Chatbot) ist selbst keine Verteidigung; die Absicht ist die umstrittene Frage."},
  {front: "Die Ein-Zeilen-Regel", back: "Verbraucher-Datenschutzkontrollen sind Training-und-Verlauf-Kontrollen. Keine davon ist eine Missbrauchsüberwachungs-Kontrolle."},
]} />

<Quiz questions={[
  {q: "Sie haben eine Zero-Data-Retention-Vereinbarung mit Anthropic. Eine Sitzung wird als Verstoß gegen die Usage Policy markiert. Was geschieht damit?", options: ["Nichts wird aufbewahrt — das bedeutet ZDR", "Ein- und Ausgaben können bis zu 2 Jahre aufbewahrt werden, und die Ergebnisse des Sicherheitsklassifikators werden unabhängig davon aufbewahrt", "Sie wird 30 Tage aufbewahrt und dann gelöscht", "ZDR wird für die gesamte Organisation automatisch widerrufen"], answer: 1, explain: "Anthropic dokumentiert, dass es auch mit ZDR Daten aufbewahren kann, um Verstöße gegen die Usage Policy zu behandeln, wobei markierte Ein- und Ausgaben bis zu 2 Jahre aufbewahrt werden, und gesondert, dass es weiterhin die Ergebnisse des User-Safety-Klassifikators aufbewahrt, um die Usage Policy durchzusetzen. ZDR entfernt die Routinespeicherung, nicht die Missbrauchs-Pipeline."},
  {q: "Sie löschen Ihre Gemini-Aktivität. Ein Chat vom letzten Monat wurde von einem menschlichen Prüfer gelesen. Ist er weg?", options: ["Ja — Löschen entfernt alles", "Ja, aber erst nach einem 30-Tage-Bereinigungsfenster", "Nein — von Menschen geprüfte Chats werden bis zu 3 Jahre aufbewahrt und nicht mit Ihrer Aktivität gelöscht", "Nein, aber nur wenn Sie in einem kostenpflichtigen Tarif waren"], answer: 2, explain: "Google gibt an, dass von menschlichen Prüfern geprüfte Chats und zugehörige Daten wie Sprache, Gerätetyp, Standortinformationen und Feedback nicht gelöscht werden, wenn Sie Ihre Aktivität löschen, weil sie von Ihrem Google-Konto getrennt wurden. Sie werden bis zu drei Jahre aufbewahrt."},
  {q: "Welcher Fall wird laut OpenAIs veröffentlichter Richtlinie ausdrücklich NICHT an die Strafverfolgung gemeldet?", options: ["Eine unmittelbare Gefahr ernsthafter körperlicher Schädigung einer anderen Person", "Ein Selbstverletzungsfall", "Eine Bitte um Anleitungen zur Waffenherstellung", "Jeder Fall, in dem der Nutzer zahlender Abonnent ist"], answer: 1, explain: "OpenAI erklärte, es leite „derzeit keine Selbstverletzungsfälle an die Strafverfolgung weiter, um die Privatsphäre der Menschen angesichts der einzigartig privaten Natur von ChatGPT-Interaktionen zu respektieren“. Die veröffentlichte Meldeschwelle ist eine unmittelbare Gefahr ernsthafter körperlicher Schädigung anderer."},
  {q: "Warum verlangt Anthropic verpflichtende Aufbewahrung bei Covered Models wie Fable 5.1?", options: ["Um die nächste Modellgeneration mit Frontier-Nutzung zu trainieren", "Weil sich manche Formen von Missbrauch nur über viele Anfragen hinweg erkennen lassen, die Schutzmaßnahmen also über ein aufbewahrtes Fenster arbeiten müssen statt jeweils auf einer Anfrage", "Um eine Protokollierungsanforderung des EU AI Act zu erfüllen", "Um Abrechnungsstreitigkeiten bei teuren Modellen zu unterstützen"], answer: 1, explain: "Anthropics genannter Grund ist, dass manche Formen von Missbrauch erst über viele Anfragen hinweg erkennbar werden, diese Modelle also Schutzmaßnahmen brauchen, die über ein aufbewahrtes Fenster von Nutzungsdaten arbeiten statt jeweils auf einer einzelnen Anfrage. Das aufbewahrte Fenster wird von automatisierten Sicherheitssystemen bewertet."},
  {q: "Wie viel Zeit verging im Fall San Francisco ungefähr zwischen den Nachrichten und der Benachrichtigung der Polizei durch den Anbieter?", options: ["Sekunden — es ist ein automatisierter Auslöser", "Etwa vier Tage — Freitagnachmittag bis Dienstagmorgen", "Etwa sechs Wochen", "Die Polizei wurde nie kontaktiert"], answer: 1, explain: "Laut dem von The San Francisco Standard zitierten Polizeibericht wurden die Nachrichten am Freitag, dem 14. August um 14:30 Uhr gesendet, und Anthropic benachrichtigte die SFPD am folgenden Dienstag um 9 Uhr. Der Schritt der menschlichen Prüfung macht das zu einer Warteschlange, nicht zu einem Auslöser — was auch bedeutet, dass sie in ein tatsächlich unmittelbar bevorstehendes Ereignis nicht eingreifen kann."},
  {q: "Sie sind Sicherheitsforscher und müssen Waffen und Gewalt als Gegenstand besprechen. Was ist das Nützlichste in Ihrer Hand?", options: ["Inkognito oder temporären Chat nutzen, damit nichts geprüft wird", "Eine ZDR-Organisation nutzen, damit die Klassifikation übersprungen wird", "Ihren beruflichen Kontext und das Artefakt, das Sie erstellen, im selben Kanal nennen und das Modell bitten zu melden, wenn eine Anfrage in operative Details übergeht", "Die Anfrage auf viele Konten aufteilen"], answer: 2, explain: "Inkognito- und temporäre Modi regeln Training und Verlauf, nicht die Missbrauchsüberwachung; ZDR überspringt die Klassifikation nicht. Ein Klassifikator bewertet Text, aber ein menschlicher Prüfer liest ihn, daher ist ausdrücklich genannter Kontext — und ein Thread, der zeigt, wie das Modell markiert und Sie umformulieren — der eine Hebel, der verändert, was ein Prüfer schlussfolgert."},
]} />

## Quellen und weiterführende Literatur

- [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy) — Abschnitt 3, „Recipients and Third-Party Data Sources“, ist die Klausel, die die Offenlegung an Regierungsbehörden und Strafverfolgung bei gutgläubiger Annahme erlaubt, dass sie vernünftigerweise notwendig ist, unter anderem um ernsthaften Schaden an Personen oder Eigentum zu verhindern.
- [Anthropic Usage Policy](https://www.anthropic.com/legal/aup) — die Verpflichtung des Safeguards Teams zu Erkennung und Überwachung, die Durchsetzungsformulierung Drosseln/Aussetzen/Beenden, die verpflichtende CSAM-Meldepflicht und die Geltungsbereichsaussage, die jeden abdeckt, der Eingaben einreichen kann, auch über Reseller und Passthrough-Zugang.
- [How long do you store my data? — Anthropic privacy centre](https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data) — die Quelle für das sofortige Entfernen aus dem Verlauf, die 30-Tage-Bereinigung im Back-End, die 5-jährige Aufbewahrung de-identifizierter Daten in Trainings-Pipelines und das entscheidende Paar: bis zu 2 Jahre für markierte Ein- und Ausgaben, bis zu 7 Jahre für Trust-and-Safety-Klassifikationswerte.
- [Is my data used for model training? — Anthropic privacy centre](https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training) — die Opt-in-Rahmung für die Modellverbesserung, der Ausschluss von Inkognito-Chats und die Aussage, dass für die Sicherheitsprüfung markierte Unterhaltungen genutzt werden können, um Erkennung und Durchsetzung zu verbessern, einschließlich des Trainings von Modellen für das Safeguards Team.
- [I have a zero data retention agreement with Anthropic. What products does it apply to?](https://privacy.claude.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to) — welche Produkte ZDR abdeckt, und die ausdrückliche Aussage, dass Anthropic weiterhin die Ergebnisse des User-Safety-Klassifikators aufbewahrt, um die Usage Policy durchzusetzen.
- [Zero data retention — Claude Code docs](https://code.claude.com/docs/en/zero-data-retention) — die Primärquelle für die Ausnahme „außer wo es zur Einhaltung von Gesetzen oder zur Bekämpfung von Missbrauch nötig ist“, die 2-Jahres-Aufbewahrung markierter Sitzungen unter ZDR, die Tabelle dessen, was ZDR nicht abdeckt (claude.ai-Chat, Cowork, Drittanbieter-Integrationen), die Vorbehalte zu Organisation und `forceLoginOrgUUID`-Routing, die unter ZDR deaktivierten Funktionen und die Verfügbarkeit von Covered Models.
- [Covered Models — Anthropic support](https://support.claude.com/en/articles/15425695-covered-models) — die Modellliste (Mythos 5.1, Fable 5.1, Mythos 5, Fable 5), die mindestens 30 Tage verpflichtende Aufbewahrung mit Prüfung durch automatisierte Sicherheitssysteme, die Begründung der Erkennung über mehrere Anfragen und der Enterprise-Frontier-Safeguards-Pfad für ZDR-berechtigte Kunden.
- [Gemini Apps Privacy Hub — Google](https://support.google.com/gemini/answer/13594961?hl=en) — menschliche Prüfer einschließlich geschulter Dienstleister, die Aufbewahrung geprüfter Chats bis zu drei Jahren, die das Löschen Ihrer Aktivität übersteht, das automatische Löschen nach 18 Monaten als Standard, das 72-Stunden-Fenster bei ausgeschalteter Aktivität und die ausdrückliche Anweisung, keine vertraulichen Informationen einzugeben.
- [Helping people when they need it most — OpenAI](https://openai.com/index/helping-people-when-they-need-it-most/) — der Beitrag mit den Formulierungen zur spezialisierten Pipeline und zur Meldung an die Strafverfolgung sowie dem Satz, der Selbstverletzungsfälle von der Meldung ausnimmt. (Die Passagen werden weithin zitiert; die Seite blockiert automatisiertes Abrufen.)
- [Temporary Chat FAQ — OpenAI help centre](https://help.openai.com/en/articles/8914046-temporary-chat-faq) — was Temporary Chat entfernt (Verlauf, Gedächtnis, Training) und das Sicherheitsaufbewahrungsfenster von bis zu 30 Tagen. Blockiert ebenfalls automatisiertes Abrufen; die Zahlen hier sind wie aus diesem Artikel berichtet.
- [Anthropic called SFPD over threat against CEO — The San Francisco Standard, 4. September 2026](https://sfstandard.com/2026/09/04/anthropic-threat-claude-sfpd/) — die Zeitleiste von Freitag bis Dienstag, Anthropics Aussage „Sicherheitsprozess funktioniert wie vorgesehen“ und die eigene Darstellung des Nutzers.
- [A Florida Woman Used Claude as a Diary — Decrypt, 5. Oktober 2026](https://decrypt.co/380119/florida-woman-claude-diary-anthropic-reported-police) — der Fall Florida: Daten, die automatisierte Markierung, das menschliche Prüfteam, die Festnahme und die Anklage.
- [Anthropic reports Florida woman's Claude 'diary' threat — Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/anthropic-reports-florida-womans-claude-diary-threat-to-shoot-up-sheriffs-office-felony-charge-follows-its-at-least-the-third-such-conversation-to-reach-police-since-august) — die Zählung von mindestens drei solchen Unterhaltungen, die seit August 2026 bei der Polizei landeten.
- [Fla. Stat. 836.10, „Written threats to kill, do bodily injury, or conduct a mass shooting or an act of terrorism“ — The Florida Senate](https://www.flsenate.gov/Laws/Statutes/2025/836.10) — der Gesetzestext, einschließlich des Elements „auf eine Weise, auf die sie von einer anderen Person eingesehen werden kann“ und der Einstufung als Verbrechen zweiten Grades.
- Verwandt auf AILmanac: [Was KI-Chats an Tracker verraten](/docs/security/what-ai-chats-leak-to-trackers), [Was Ihr Agent hochlädt](/docs/security/what-your-agent-uploads), [Datenschutz & Datenverarbeitung](/docs/foundations/privacy), [Verantwortungsvolle Nutzung, Ethik & Verifikation](/docs/security/responsible-use).

## Weiter

- [Datenschutz & Datenverarbeitung](/docs/foundations/privacy) — die Einsteigerversion derselben Entscheidung: was sicher einzufügen ist, welchen Tarif man nutzt und wann die Antwort „lokal ausführen“ lautet.
- [Der private lokale KI-Stack](/docs/models/private-local-ai-stack) — die Architektur, die Klassifikator, Prüf-Warteschlange und Aufbewahrungsuhr auf einmal entfernt, samt einer ehrlichen Bilanz der Fähigkeit, auf die Sie verzichten.
- [Verantwortungsvolle Nutzung, Ethik & Verifikation](/docs/security/responsible-use) — die andere Seite derselben Richtlinienoberfläche: wofür Sie verantwortlich sind, wenn das Modell die Ausgabe erzeugt.
