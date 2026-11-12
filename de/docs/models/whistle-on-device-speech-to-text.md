# Whistle: Speech-to-Text in 16,9 MB — und die Benchmark-Balken, die niemand beschriftet hat

> Source: https://derob98.github.io/ailmanac/de/docs/models/whistle-on-device-speech-to-text · AILmanac (CC BY 4.0) · last verified 2026-10-09

Whistle von Cactus Compute packt ein mehrsprachiges ASR-Modell in 16,9 MB und erreicht 11,1 ms bis zum ersten Token auf einer CPU. Die Größenangabe stimmt. Diese Seite liest das Benchmark-Diagramm des Herstellers Balken für Balken — einschließlich der drei Konkurrenzspalten, die es nicht beschriftet — und findet das Muster, das jede Beschwerde aus der Praxis erklärt: Whistle gewinnt bei Nahmikrofon-Audio mit einem Sprecher und ist bei echtem Meeting-Audio das schlechteste der drei, 4,6 WER-Punkte hinter einem 8,6-mal größeren Modell. Dazu die architektonische 30-Sekunden-Wand, die Streaming-API, die der Launch-Thread übersehen hat, und der eine Regler, der einen Tester von 70/170 auf 164/170 brachte.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={["Verstehen, was tatsächlich in 16,9 MB steckt — und welcher Teil der 9-fach-Größenschlagzeile Architektur ist und welcher eine Quantisierungswahl, die der Vergleich nicht konstant hält","Das WER-Diagramm des Herstellers einschließlich der Konkurrenzbalken lesen, die es nie beschriftet: Whistle gewinnt 5 von 8 direkten Vergleichen und verliert die drei, die dem echten Leben am ähnlichsten sehen","Wissen, warum 30 Sekunden eine Wand im Encoder und keine Einstellung sind, und die VAD-Segmentierung bauen, die sie Ihnen aufzwingt","Die Streaming-API finden, von der die Launch-Diskussion schloss, sie existiere nicht, und verstehen, warum ihre echte Latenz nicht die 11,1 ms Time-to-First-Token sind","Keyword Biasing als primären Genauigkeitshebel nutzen, nicht als Nettigkeit — es ist der Unterschied zwischen 41 % und 96 % bei geschlossenem Vokabular","Zwischen Whistle, Whisper, Parakeet und einer Cloud-API für Ihr konkretes Audio entscheiden"]} />

Am 8. Oktober 2026 erreichte ein Blogbeitrag mit dem Titel *„Whistle: Speech to Text in 16.9 MB“*
768 Punkte auf Hacker News. Die Zahl im Titel ist der ganze Pitch,
und sie stimmt: Das gesamte mehrsprachige Spracherkennungsmodell ist eine einzige
16,9 MB große Datei, die auf einer CPU ohne GPU und ohne Abhängigkeiten läuft.

Die anschließende Diskussion teilte sich sauber in zwei Lager. Wer das
Benchmark-Diagramm las, war beeindruckt. Wer ein Mikrofon darauf richtete, war es
nicht — ein Tester meldete 70 richtige von 170 Äußerungen. Beide Gruppen hatten
recht, und der Grund, warum beide recht hatten, steht im Diagramm des Herstellers
selbst. Er steckt nur in den Balken ohne Zahl.

## Die Version in einem Satz

Whistle kauft sich seine Größe, indem es ein kleines Encoder-Decoder-ASR-Modell auf 2–4
Bit quantisiert und sein Front End auf 250–3500 Hz bandbegrenzt, was bei
Nahmikrofon-Sprache mit einem Sprecher fast nichts kostet — wo es Whisper base
tatsächlich schlägt — und bei Fernfeld-, überlappender oder akzentbehafteter
Sprache sehr viel, wo es das schlechteste der drei Modelle im eigenen Vergleich ist.

## Was tatsächlich in den 16,9 MB steckt

| Komponente | Detail |
|---|---|
| Front End | 25-ms-Fenster, 10-ms-Hop, 80 Log-Mel-Bins, bandbegrenzt auf 250–3500 Hz |
| Stem | 128-Kanal-Faltung, Downsampling auf ein Frame pro 80 ms |
| Encoder | 8 Simple-Attention-Blöcke, Monarch-Hadamard-MLP |
| Decoder | 8 gestaffelte Simple-Attention-Blöcke, Breite 512, 8 Query-Heads auf 2 KV-Heads |
| Vokabular | 8.192 Textstücke plus 7 Sprach-Token |
| Ausgabegrenze | 320 Token pro Clip |
| Eingabegrenze | 480.000 Samples — 30 s bei 16 kHz mono |
| Container | `.cact`, Cactus Quants, 2–4 Bit |
| Lizenz | Apache-2.0 |

Drei dieser Zeilen leisten mehr als der Rest, und zwei davon sind die, die man überspringt.

### Die 9-fach-Größenschlagzeile hält die Präzision nicht konstant

Der Vergleich, den alle zitieren, sind 16,9 MB gegen die 145,3 MB von Whisper base.
Das ist ein Neuntel der Größe — aber die Fußnote des Herstellers selbst sagt, dass
Whistle bei **2 bis 4 Bit** gemessen wird, Whisper dagegen **fp32 im Speicher auf der CPU**.
Das liegt 8–16-fach auseinander in Bits pro Gewicht, bevor eine einzige
Architekturentscheidung getroffen wurde.

Die ehrliche Äpfel-mit-Äpfeln-Zeile im selben Diagramm ist Moonshine tiny v2 mit
**41,9 MB in int8**. Whistle ist 2,5-mal kleiner als das, nicht 9-mal. Die
verbleibenden 2,5-fach sind echt und genau dort verdient sich die Architektur ihren
Platz — aber wer die 9-fach-Zahl wiederholt, wiederholt überwiegend eine Quantisierungswahl.

Das ist dieselbe Falle wie in
[Wie man einen KI-Benchmark liest, ohne sich täuschen zu lassen](/docs/models/reading-ai-benchmarks):
Die Zahl ist nicht falsch, der *Vergleich* wird nicht konstant gehalten.

### Die Bandbegrenzung auf 3500 Hz ist eine Designentscheidung mit vorhersagbarer Fehlerklasse

Das Front End behält 250–3500 Hz und wirft alles andere weg. Das entspricht
ungefähr dem Telefonband und ist eine sinnvolle Wahl für ein Modell, das auf einem
Wearable laufen soll — der Großteil der Sprachenergie liegt darunter.

Der Großteil, nicht alles. Die Literatur zur akustischen Phonetik ist hier konkret: 3–4 kHz
reichen als Bandbreite für verständliche Vokale, **nicht** aber für die meisten
stimmlosen Frikative, deren Spektren *oberhalb* von 4 kHz konzentriert sind. Das
englische `s` hat seine größte Energiekonzentration etwa im Bereich 5–10 kHz mit
einem Maximum nahe 8 kHz — mehr als das Doppelte von Whistles Grenzfrequenz —, und
`sh` ist bei etwa 4 kHz zentriert, mit Energie bis 8.

Das Abschneiden bei 3500 Hz macht diese Laute nicht unhörbar. Es entfernt das Band,
das sie am saubersten voneinander trennt.

Noch vor dem ersten Test lässt sich also die Fehlerklasse vorhersagen: Verwechslungen
und weggefallene Wortendungen bei Frikativen, am schlimmsten bei Sprechern, deren
Rhythmus oder Akzent diesen Konsonanten weniger Dauer zum Ausgleich lässt. Die
Praxisberichte im Launch-Thread — spanische Ausgabe mit „nicht existierenden Wörtern
und furchtbaren Tippfehlern“, nicht erkannte mexikanische und venezolanische Akzente,
stark nachlassende Qualität bei ausgeprägten Akzenten — sind genau diese Vorhersage,
pünktlich eingetroffen.

## Die Benchmark-Balken, die niemand beschriftet hat

Hier ist der Teil, der die Seite wert ist. Whistles Diagramm trägt die Wortfehlerrate
über neun Testsets für drei Modelle auf. Es druckt eine Zahl auf **jeden Whistle-Balken
und auf keinen der anderen**.

Die Balken sind trotzdem da, auf linearer Skala gezeichnet. Whistles gedruckte
Beschriftungen kalibrieren diese Skala exakt — 6,867 Pixel pro WER-Punkt, auf ±0,01
konsistent über alle neun —, sodass sich die Konkurrenzwerte aus der Balkenhöhe
zurückgewinnen lassen. Das ergibt die Tabelle, die das Diagramm gerade nicht mehr liefert.

| Testset | Was es ist | Whistle | Whisper base ≈ | Moonshine tiny v2 ≈ |
|---|---|---|---|---|
| LibriSpeech test-clean | Vorgelesene Hörbücher, sauber | **4.31** | 4.89 | 4.51 |
| LibriSpeech test-other | Vorgelesene Hörbücher, schwieriger | **10.49** | 11.00 | 11.71 |
| SPGISpeech | Finanzgespräche | **7.65** | — | 7.70 |
| Earnings-22 | Telefonkonferenzen zu Quartalszahlen, mit Akzent | **19.01** | — | 21.25 |
| AMI | Meetings, Fernfeld, überlappend | 26.07 | **21.50** | 22.78 |
| AMI cleaned | Dasselbe, bereinigte Referenzen | 22.87 | — | — |
| TED-LIUM | Konferenzvorträge | 7.61 | **4.99** | 5.64 |
| FLEURS | Mehrsprachige vorgelesene Sprache | **21.39** | 24.50 | — |
| MLS | Mehrsprachige Hörbücher | 24.90 | **23.10** | — |

Niedriger ist besser; fett markiert den Gewinner jeder Zeile. Whistles Spalte sind die
vom Hersteller gedruckten Zahlen. Die beiden anderen Spalten sind von den Balken des
Diagramms abgelesen — der Hersteller gibt an, dass es die veröffentlichten Zahlen von
Whisper und Moonshine selbst sind, und druckt sie nicht ab.

**Whistle gewinnt fünf der acht Zeilen, in denen ein Vergleich existiert.** Für ein
Modell, das 2,5-mal kleiner ist als der Rivale mit der nächsten Präzision, ist das ein
echtes Ergebnis, und die FLEURS-Zeile — 3,1 Punkte besser als Whisper base bei
mehrsprachiger vorgelesener Sprache — ist das Beeindruckendste im Diagramm.

Nun, was es verliert:

- **AMI, um 4,57 Punkte an Whisper base.** Fernfeldmikrofone, mehrere Sprecher,
  Überlappung, Unterbrechung. Whistle liegt hier nicht nur zurück, es ist das
  *schlechteste der drei* und verliert gegen ein 8,6-mal größeres Modell.
- **TED-LIUM, um 2,62 Punkte.** Ein Sprecher, aber ein großer Raum, ein Bühnenmikrofon
  und freier Vortrag.
- **MLS, um 1,80 Punkte.** Mehrsprachig im Langformat, gemittelt über sechs
  nicht-englische Sprachen.

Das Muster ist nicht subtil, sobald die Zahlen nebeneinanderstehen. **Jede Zeile, die
Whistle gewinnt, ist Nahmikrofon und praktisch ein Sprecher. Jede Zeile, die es
verliert, hat entweder Abstand zwischen Mund und Mikrofon oder mehr als eine Person im
Raum.** Vorgelesene Hörbücher und Diktat-Audio sind genau das Profil, das ein
bandbegrenztes 16-kHz-Front-End mit winzigem Encoder gut bewältigt. Nachhall und
überlappende Sprecher sind genau das, wofür es sich die Kapazität zum Entwirren nicht leisten kann.

Dieser eine Satz versöhnt die beiden Hälften des Launch-Threads. Alle, die Diktat in ein
nah ans Gesicht gehaltenes Telefon getestet haben, mochten es. Alle, die es auf einen
Filmausschnitt, ein Meeting oder einen Raum richteten, mochten es nicht. Niemand hat falsch gemessen.

:::tip[Die Zahl zum Mitnehmen]
4,31 und 26,07 sind dasselbe Modell mit denselben Gewichten. Wenn Sie sich für Whistle nur
einen WER-Wert merken, merken Sie sich die *Spanne*, nicht die Schlagzeile.
:::

### Eine Anmerkung zum 70/170-Bericht

Das meistzitierte Praxisergebnis im Thread — 70 richtige von 170, gegenüber 168/170 für ein
viel größeres Qwen-ASR-Modell — ist eine echte Messung, aber eine Messung von
*Standardeinstellungen bei geschlossenem Vokabular*. Derselbe Tester meldete nach dem
Tuning 164/170. Was sich geändert hat, ist das Thema des nächsten Abschnitts, und es ist
das am schlechtesten verkaufte Feature auf der Model Card.

## Keyword Biasing ist der primäre Genauigkeitshebel

Whistle dekodiert mit **fünf Beams, bewertet nach längennormalisierter
Log-Wahrscheinlichkeit**, und es akzeptiert eine Liste von Wörtern, die Sie erwarten, und
bevorzugt sie während dieser Suche, abgeglichen mit einem Aho-Corasick-Automaten.

In einem Allzweck-ASR-Modell ist das eine Bequemlichkeit. In einem 16,9-MB-Modell mit
8.192-Stücke-Vokabular ist es näher an tragend. Das Modell hat sehr wenig Kapazität für
ein implizites Sprachmodell, daher sind Eigennamen, Produktnamen, Ortsnamen und
Fachjargon genau das, was es falsch macht — und genau das, was eine Keyword-Liste
behebt. Von 70/170 auf 164/170 zu kommen ist 41 % auf 96 % bei denselben Gewichten.

<PromptCard title="Transkribieren mit den zwei Argumenten, auf die es ankommt">
{`import needle

r = needle.transcribe(
    "clip.wav",
    keywords=["Kubernetes", "Grafana", "Prometheus", "Aoife", "Nguyen"],
    word_timestamps=True,
    language="en",          # skip detection when you already know
)

print(r["text"])
for w in r["words"]:
    print(w["word"], w["start"], w["end"], w["probability"])`}
</PromptCard>

Drei Dinge in diesem Snippet sollten klar ausgesprochen werden:

1. **`keywords` ist kein Nachbearbeitungsfilter.** Es verändert die Beam-Suche und kann
   so ein Wort zurückholen, das der Decoder sonst nie platziert hätte.
2. **`language="en"` beseitigt einen Fehlermodus, nicht nur Latenz.** Automatische
   Erkennung über sieben Sprachen bei einem kurzen oder verrauschten Clip ist eine
   weitere Sache, die schiefgehen kann. Wenn Ihre App die Sprache kennt, sagen Sie es.
3. **Jedes Wort trägt seine eigene `probability`.** Das ist Ihr Konfidenz-Gate —
   siehe das Übergabemuster unten.

<Callout type="warning" items={["Eine zu lange Keyword-Liste verwässert den Bias und beginnt, den Decoder zu Wörtern zu ziehen, die niemand gesagt hat. Beschränken Sie sie auf das Vokabular, das Ihre Nutzer in diesem Kontext tatsächlich erzeugen — den aktuellen Bildschirm, die aktuelle Kontaktliste, das aktuelle Dokument — nicht Ihr gesamtes Produktglossar."]} />

## Die 30-Sekunden-Wand steckt im Encoder, nicht in einer Konfigurationsdatei

30 Sekunden bei 16 kHz sind 480.000 Samples. Nach dem Faltungs-Stem ist das ein Frame
pro 80 ms, also 375 Encoder-Frames, und der Decoder endet bei 320 Ausgabe-Token. Das
sind feste Formen in einer 16,9-MB-Tensordatei. Es gibt kein Flag, das sie anhebt, und
ein Tester im Launch-Thread, der über die Grenze hinaus aufnahm, bekam einen
Laufzeitfehler statt eines abgeschnittenen Transkripts.

Jeder Clip über 30 Sekunden bedeutet also, dass *Sie* die Segmentierung besitzen — und
Segmentierung ist der Ort, an dem die Genauigkeit von Langform-ASR tatsächlich liegt,
denn ein Schnitt mitten durch ein Wort oder einen Satzteil ist ein Fehler, von dem sich
das Modell nicht erholen kann.

<Steps items={[
  { title: "Zuerst neu abtasten und auf Mono mischen", body: "16 kHz mono ist keine Empfehlung, sondern der Eingabevertrag. Eine 44,1-kHz-Stereodatei muss konvertiert werden, bevor sie das Modell erreicht; die Basisinstallation verarbeitet 16-kHz-WAV und Rohsamples, und das Extra [mic] ergänzt Resampling und Mikrofonaufnahme." },
  { title: "An Stille segmentieren, nicht nach Uhr", body: "Lassen Sie einen Voice-Activity-Detector laufen und schneiden Sie in den Pausen. Feste 30-Sekunden-Stücke schneiden irgendwann mitten im Wort, und dieser Fehler landet dauerhaft in Ihrem Transkript. Zielen Sie auf Segmente von 10–25 Sekunden, damit Sie Spielraum für einen langen letzten Satzteil behalten." },
  { title: "Die Segmente um etwa eine Sekunde überlappen", body: "Geben Sie aufeinanderfolgenden Durchläufen einen gemeinsamen Bereich, damit Sie über Übereinstimmung zusammenfügen können, statt einer harten Grenze zu vertrauen. Der Preis ist das erneute Dekodieren einer Sekunde Audio; bei 1.319 Token/s Decode ist das nicht Ihr Engpass." },
  { title: "Mit den Wort-Zeitstempeln zusammenfügen, nicht mit dem Text", body: "Jedes Wort kommt mit Start und Ende zurück, also entfernen Sie den Überlappungsbereich nach Zeit statt durch String-Abgleich. Das ist der einzige zuverlässige Weg, ein doppeltes Wort zu verwerfen, ohne ein legitim wiederholtes zu verwerfen." },
  { title: "Nach Wahrscheinlichkeit filtern und übergeben", body: "Mitteln Sie die Wahrscheinlichkeiten pro Wort über jedes Segment. Segmente mit niedriger Konfidenz sind Ihre Warteschlange für ein größeres Modell — auf dem Gerät kostenlos, außerhalb des Geräts, wenn es darauf ankommt. Lassen Sie nicht alles erneut laufen." }
]} />

### Stille wird behandelt; Sprache mit niedrigem SNR nicht

Die Model Card macht eine konkrete und willkommene Aussage: Stille und gleichmäßiges
Rauschen liefern ein **leeres Transkript statt eines erfundenen Satzes**, weil die
Stille-Erkennung *vor* der Beam-Suche läuft. Das ist eine direkte Behebung von Whispers
berüchtigtstem Fehler — selbstbewusst Untertitel über Nichts zu halluzinieren.

Lesen Sie die Aussage genau. Sie deckt Stille und gleichmäßiges Rauschen ab. Sie deckt
nicht leise, entfernte oder überlappende *Sprache* ab, und der Thread enthält genau
diesen Fehler: Ein Tester meldete, das Modell habe über eine Minute lang wiederholt „Thank you.“
ausgegeben, während echter Dialog lief, und ein anderer fand eine umgedrehte Verneinung —
„can handle“ statt „can't handle“ — sowie ein glatt erfundenes Wort.

Das sind die klassischen Artefakte des Trainings mit Untertiteln von Web-Videos, in denen
„Thanks for watching“ einen enormen Textanteil einnimmt, und sie überleben das
Stille-Gate, weil das Gate nie auf sie gerichtet war. Wenn ein weggefallenes `n't` ändern
würde, was Ihre Anwendung tut, ist eine Wahrscheinlichkeitsprüfung pro Wort nicht optional.

## Streaming existiert — der Launch-Thread schloss, es gebe es nicht

Eine wiederkehrende Beschwerde in der Diskussion war, dass Whistle keine
Live-Transkription kann, weil die Demo beim Sprechen keinen Teiltext zeigte. Die Demo
tat es nicht; die Bibliothek schon. `needle.stream(chunks)` nimmt Live-Mikrofoneingabe
und **übernimmt Wörter, über die sich aufeinanderfolgende überlappende Durchläufe einig sind**.

Diese Richtlinie — ein überlappendes Fenster wiederholt dekodieren, nur das Präfix
ausgeben, über das sich zwei Durchläufe einig sind — ist die LocalAgreement-Familie des
Streaming-ASR, und das zu wissen sagt Ihnen, was das Datenblatt nicht sagt:

**Ihre wahrgenommene Latenz sind nicht die 11,1 ms Time-to-First-Token.** Es ist die
Einigungsverzögerung: wie lange ein Wort warten muss, bis ein zweiter Durchlauf es
bestätigt. TTFT ist eine Decode-Geschwindigkeitsmessung an einem vollständigen
10-Sekunden-Clip. In einer Streaming-Schleife wird die für den Nutzer sichtbare Zahl
durch Ihre Fenster-Schrittweite bestimmt und dadurch, wie lange Sie auf Stabilität
warten wollen, und sie liegt bei Hunderten von Millisekunden, nicht bei elf.

Schnell ist trotzdem schnell — 11,1 ms gegenüber 73,2 ms bei Whisper base und 22,8 ms
bei Moonshine, und 1.319 Token/s Decode gegenüber 266 und 262, gemessen an 10 s Audio
auf einer Apple-M4-Pro-CPU. Versprechen Sie einem Product Manager nur keine 11 ms Live-Untertitelung.

## Zwei Features, die stillschweigend interessanter sind als die Größe

### Der Decoder ist gestaffelt, also ist eine Datei eine Familie

Jede Tiefe ab zwei Layern ist ein einsetzbares Modell, gewählt **beim Laden** mit
`--audio-depth`. Sie laden einen 16,9-MB-Blob herunter und wählen Ihren
Genauigkeits-/Latenz-Punkt auf dem Gerät, was der richtige Ort dafür ist — eine Uhr und
ein Telefon können dasselbe Artefakt in unterschiedlichen Tiefen ausführen. Zum
Maßstab: Das Schwestermodell Needle für Text dekodiert auf einem Raspberry Pi 5 bei
zwei Layern mit etwa 4.000 Token/s und bei zwanzig mit 400.

### `embed()` liefert Sprachabgleich ganz ohne Transkript

Die Encoder-Ausgabe ist direkt verfügbar: eine Zeile pro 80-ms-Frame, über
`needle.Whistle().embed(audio)`. Das ist Wake-Word-Erkennung, Kommando-Abgleich,
Audio-Deduplizierung und „finde, wo in dieser Aufnahme jemand das gesagt hat“ — ohne
Text zu dekodieren, ohne Sprachmodell und ohne die oben besprochenen Fehlerklassen,
weil Sie es nie bitten, etwas zu buchstabieren.

Für viele Embedded-Aufgaben („hat der Nutzer eines dieser elf Dinge gesagt?“) ist das
das richtige Werkzeug, und Transkription ist der Umweg.

<PromptCard title="Über die CLI ausführen, einschließlich des eingebauten Dreiervergleichs">
{`pip install cactus-needle

# microphone playground
needle whistle playground

# put Whistle next to Whisper and Moonshine on YOUR audio
needle whistle compare my-clip.wav

# air-gapped / embedded: fetch a platform engine and the weights
needle download macos-arm64
needle download whistle
./macos-arm64/needle --model whistle.cact --audio clip.wav --audio-word-timestamps`}
</PromptCard>

Der Unterbefehl `compare` verdient eine Erwähnung: Der Hersteller liefert das Werkzeug,
das seine eigenen Behauptungen an Ihrem Audio prüft. Da die oben gezeigte WER-Spanne
so stark von den Aufnahmebedingungen abhängt, ist ein Lauf mit einem repräsentativen Clip
*Ihres* Audios mehr wert als jede Tabelle auf dieser Seite.

### Eine Reproduzierbarkeitseigenschaft, die man kopieren sollte

Die Engine **liest keine Umgebungsvariablen**. Jedes Verhalten ist ein einkompilierter
Standard oder ein explizites Flag. Das heißt, derselbe Blob mit denselben Flags liefert
auf jeder Maschine dasselbe Ergebnis — eine Eigenschaft, die die meisten
Inferenz-Stacks nicht für sich beanspruchen können und die enorm wichtig ist, wenn Sie
herausfinden wollen, ob die Eval der letzten Woche regrediert ist oder die Shell der letzten Woche.

## Auswahl: Whistle, Whisper, Parakeet oder eine Cloud-API

| Ihre Situation | Wählen | Warum |
|---|---|---|
| Diktat auf Telefon oder Wearable, Nahmikrofon, offline, 7 unterstützte Sprachen | **Whistle** | Das ist der Designschwerpunkt. 16,9 MB, keine GPU, Wort-Zeitstempel, und es schlägt Whisper base bei genau diesem Audioprofil |
| Wake Words oder feste Kommandosätze auf einem Mikrocontroller | **Whistle `embed()`** | Transkription ganz überspringen; Encoder-Frames abgleichen |
| Meeting-Aufnahmen, mehrere Sprecher, Raummikrofone | **Nicht Whistle** | Sein eigenes Diagramm setzt es bei AMI auf den letzten Platz. Nutzen Sie ein ausgewachsenes Whisper, Parakeet oder eine Cloud-ASR mit Diarisierung |
| Jede Sprache außerhalb der sieben | **Nicht Whistle** | Nur Englisch, Deutsch, Französisch, Spanisch, Italienisch, Niederländisch, Polnisch. Kein Chinesisch, obwohl es die meistgewünschte Ergänzung im Launch-Thread war |
| Beste Open-Weight-Genauigkeit pro Sekunde auf einer GPU, Englisch | **Parakeet** | NVIDIAs `parakeet-tdt-0.6b-v2` war der Favorit der Praktiker im Thread; CC-BY-4.0 |
| Audio, das Sie nirgendwohin senden können, und Genauigkeit ist wichtiger als Größe | **Whisper large, lokal** | Weiterhin die Genauigkeitsreferenz. Sie tauschen dafür den ~100-fachen Footprint ein |
| Medizinische, juristische oder finanzielle Protokolle von Rang | **Cloud-ASR mit Mensch in der Schleife** | Der oben genannte Fehlermodus der umgedrehten Verneinung ist für sich genommen ein Ausschlusskriterium |

Eine Hybridlösung ist meist die richtige Antwort, und sie hat dieselbe Form wie jede
andere Lokal/Remote-Aufteilung auf dieser Seite: das kleine Modell auf alles anwenden,
die Wahrscheinlichkeiten pro Wort als Gate nutzen, den unsicheren Anteil eskalieren. Siehe
[Claude plus lokale Modelle](/docs/models/claude-plus-local-models) für das
allgemeine Muster und [einen privaten lokalen KI-Stack](/docs/models/private-local-ai-stack)
dafür, wo ein Transkriptionsschritt darin hingehört.

## Was das über die On-Device-Welle im Allgemeinen sagt

Whistle ist ein gutes Beispiel für ein Muster, das jetzt bei kleinen Modellen auftaucht:
**Die Fähigkeit ist real und der Einsatzbereich schmal, und nur die erste Hälfte passt in
eine Schlagzeile.** Die 2-Bit-Quantisierung ist kein Betrug — das Modell funktioniert
tatsächlich —, aber sie kauft ihre Größe, indem sie die Kapazität ausgibt, die schwieriges
Audio bewältigt hätte, und das Diagramm des Herstellers zeigt genau, wo diese Rechnung
fällig wird, während es nur die Zeilen beschriftet, in denen sie nicht fällig wird.

Die praktische Regel gilt über ASR hinaus: Wenn ein kleines Modell eine breite
Benchmark-Spanne veröffentlicht, *ist* die Spanne die Spezifikation. Finden Sie die Zeile,
in der es am schlechtesten abschneidet, überlegen Sie, was dieses Testset hat, das die
anderen nicht haben, und prüfen Sie, ob Ihre echte Eingabe wie diese Zeile aussieht. Bei
Whistle lautet die Antwort Abstand und Überlappung. Bei einem quantisierten Sprachmodell
ist es meist langer Kontext — siehe
[was „98,2 % Beibehaltung“ verbirgt](/docs/models/ternary-quantization-bonsai-2-27b).

<Quiz questions={[
  {
    q: "Whistle hat 16,9 MB gegenüber 145,3 MB bei Whisper base. Was macht diesen 9-fach-Vergleich irreführend?",
    options: [
      "Whisper base ist eine größere Modellfamilie, daher sind die Parameterzahlen nicht vergleichbar",
      "Die beiden Zahlen sind mit unterschiedlicher Präzision gemessen — Whistle mit 2–4 Bit, Whisper mit fp32 —, sodass der Großteil des Verhältnisses eine Quantisierungswahl ist und keine Architektur",
      "Die 145,3 MB enthalten den Tokenizer von Whisper, die 16,9 MB nicht",
      "Whistles Datei schließt die Engine aus, die separat heruntergeladen werden muss"
    ],
    answer: 1,
    explain: "Die Fußnote des Herstellers selbst nennt Whistle mit 2–4 Bit und Whisper als fp32 im Speicher. Das liegt 8–16-fach auseinander in Bits pro Gewicht, noch vor jedem Architekturvergleich. Der Rivale mit der nächsten Präzision ist Moonshine tiny v2 mit 41,9 MB in int8, gegen den Whistle 2,5-mal kleiner ist — weiterhin ein echtes Ergebnis, nur nicht 9-fach."
  },
  {
    q: "Whistle erreicht 4,31 WER auf LibriSpeech test-clean und 26,07 auf AMI. Was unterscheidet die Testsets, die es gewinnt, von denen, die es verliert?",
    options: [
      "Die gewonnenen Sets sind englisch und die verlorenen mehrsprachig",
      "Die gewonnenen Sets sind kürzer als 30 Sekunden pro Äußerung und die verlorenen länger",
      "Die gewonnenen Sets sind Nahmikrofon und praktisch ein Sprecher; die verlorenen haben Abstand zwischen Mund und Mikrofon oder mehr als einen Sprecher",
      "Die verlorenen Sets waren in Whistles Trainingsdaten, die Zahlen sind also um Kontamination bereinigt"
    ],
    answer: 2,
    explain: "Die Konkurrenzbalken aus dem Diagramm abzulesen macht das Muster klar. Whistle gewinnt LibriSpeech, SPGISpeech, Earnings-22 und FLEURS — alle Nahmikrofon, praktisch ein Sprecher. Es verliert AMI (Fernfeld-Meetings, wo es das schlechteste der drei ist), TED-LIUM (Bühnenmikrofon, großer Raum) und MLS. Beachten Sie, dass FLEURS mehrsprachig ist und Whistle es gewinnt, die Sprache ist also nicht die Trennlinie — die Aufnahmebedingungen sind es."
  },
  {
    q: "Ihre App muss eine 90-Sekunden-Sprachnachricht transkribieren. Was verlangt Whistles 30-Sekunden-Grenze?",
    options: [
      "Nichts — übergeben Sie die Datei, die Engine zerlegt sie intern",
      "Das Sample-Rate-Budget mit --audio-depth anheben, um mehr Audio pro Durchlauf unterzubringen",
      "Ihre eigene VAD-Segmentierung, mit überlappenden Segmenten, die über Wort-Zeitstempel statt über String-Abgleich zusammengefügt werden",
      "Auf die Streaming-API wechseln, die keine Dauerbegrenzung hat"
    ],
    answer: 2,
    explain: "480.000 Samples sind eine feste Tensorform, keine Einstellung — sie zu überschreiten löste bei einem Tester einen Laufzeitfehler aus. Sie segmentieren an Stille statt nach Uhr (eine Uhr schneidet irgendwann mitten im Wort), überlappen die Segmente und entfernen die Überlappung nach Zeit mithilfe der Start-/Endwerte pro Wort. --audio-depth wählt die Decoder-Tiefe, das hat damit nichts zu tun."
  },
  {
    q: "Ein Tester ging mit denselben Whistle-Gewichten von 70/170 auf 164/170 richtige Äußerungen. Was ist der wahrscheinlichste Hebel?",
    options: [
      "Keyword Biasing — die erwartete Vokabelliste liefern, die die Fünf-Beam-Suche verändert, statt die Ausgabe hinterher zu filtern",
      "Das Modell auf eigenen Aufnahmen feinabstimmen",
      "Die Decoder-Tiefe auf die maximalen 20 Layer anheben",
      "Von automatischer Spracherkennung auf erzwungenes Englisch wechseln"
    ],
    answer: 0,
    explain: "Mit einem Vokabular von 8.192 Stücken und fast keiner Kapazität für ein implizites Sprachmodell sind Eigennamen und Fachbegriffe genau das, was Whistle falsch macht — und genau das, was eine Keyword-Liste zurückholt, weil der Bias innerhalb der Beam-Suche über einen Aho-Corasick-Automaten angewendet wird. Die Sprache zu erzwingen hilft ebenfalls, ist aber ein kleinerer Effekt als 41 % auf 96 %."
  },
  {
    q: "Whistle gibt 11,1 ms bis zum ersten Token an. Was sieht ein Nutzer in einer Live-Untertitelschleife?",
    options: [
      "Etwa 11 ms, da das Ende-zu-Ende ab dem Audioeingang gemessen ist",
      "Hunderte von Millisekunden, weil Streaming nur Wörter übernimmt, über die sich aufeinanderfolgende überlappende Durchläufe einig sind, und diese Einigungsverzögerung dominiert",
      "Etwa 73 ms, entsprechend dem Wert von Whisper base, weil Streaming Whistles Vorteil aufhebt",
      "Es variiert mit der Länge der Keyword-Liste, die der dominante Term ist"
    ],
    answer: 1,
    explain: "11,1 ms ist die Decode-Latenz bei einem vollständigen 10-Sekunden-Clip. needle.stream() nutzt eine Richtlinie im LocalAgreement-Stil — nur das Präfix ausgeben, über das sich zwei überlappende Durchläufe einig sind —, daher wird die wahrgenommene Latenz durch Ihre Fenster-Schrittweite und Ihre Stabilitätsschwelle bestimmt. Whistle ist beim Clip-Benchmark weiterhin tatsächlich das schnellste der drei; es ist nur keine Live-Untertitelung mit 11 ms."
  },
  {
    q: "Die Model Card sagt, Stille liefere ein leeres Transkript statt eines erfundenen Satzes. Wovor schützt das Sie NICHT?",
    options: [
      "Halluzinierter Text über lange Strecken reiner Stille",
      "Erfundene Ausgabe bei gleichmäßigem Hintergrundrauschen wie einem Lüfter",
      "Artefakten aus Untertitelkorpora bei leiser, entfernter oder überlappender echter Sprache — darunter ein sich wiederholendes „Thank you.“ und eine umgedrehte Verneinung",
      "Leeren Transkripten bei Clips, die kürzer als eine Sekunde sind"
    ],
    answer: 2,
    explain: "Das Stille-Gate läuft vor der Beam-Suche und deckt Stille und gleichmäßiges Rauschen tatsächlich ab. Es war nie auf Sprache mit niedrigem SNR gerichtet, wo Untertitel-Artefakte aus Web-Videos überleben — Tester meldeten „Thank you.“, das sich über eine Minute lang während echten Dialogs wiederholte, und „can handle“ für „can't handle“. Wenn eine weggefallene Verneinung das Verhalten Ihrer Anwendung ändert, prüfen Sie die Wahrscheinlichkeiten pro Wort."
  }
]} />

<Flashcards cards={[
  { front: "Whistle in einer Zeile", back: "Das On-Device-ASR-Modell von Cactus Compute: eine einzelne 16,9-MB-Datei .cact, Apache-2.0, nur CPU, 7 Sprachen, 16 kHz mono, 30 s pro Durchlauf. Transkription, Wort-Zeitstempel und Sprach-Embeddings aus derselben Engine, die das Textmodell Needle ausführt." },
  { front: "Der Eingabevertrag", back: "16 kHz mono, maximal 480.000 Samples (30 s). Front End: 25-ms-Fenster, 10-ms-Hop, 80 Log-Mel-Bins, bandbegrenzt auf 250–3500 Hz. Ein Encoder-Frame pro 80 ms nach dem Faltungs-Stem. Maximal 320 Ausgabe-Token pro Clip. Das sind Tensorformen, keine Einstellungen." },
  { front: "Die WER-Spanne, die die eigentliche Spezifikation ist", back: "4,31 bei LibriSpeech test-clean, 26,07 bei AMI — dieselben Gewichte. Siege (Nahmikrofon, ein Sprecher): LibriSpeech clean/other, SPGISpeech, Earnings-22, FLEURS. Niederlagen (Abstand oder Überlappung): AMI um ~4,6 an Whisper base, TED-LIUM um ~2,6, MLS um ~1,8." },
  { front: "Warum der 9-fach-Größenanspruch weich ist", back: "16,9 MB bei 2–4 Bit gegenüber 145,3 MB bei fp32 für Whisper base — der Vergleich hält die Präzision nicht konstant. Der Rivale mit der nächsten Präzision ist Moonshine tiny v2, 41,9 MB bei int8, gegen den Whistle 2,5-mal kleiner ist. Diese 2,5-fach sind das architektonische Ergebnis." },
  { front: "Bandbegrenzung bei 3500 Hz und ihre Fehlerklasse", back: "Behält 250–3500 Hz, etwa das Telefonband. Stimmlose Frikative und Zischlaute (s, f, th, sh) tragen einen Großteil ihrer unterscheidenden Energie oberhalb von 4 kHz, daher sind die vorhersagbaren Fehler Frikativ-Verwechslungen und weggefallene Wortendungen — am schlimmsten bei Akzenten und schneller natürlicher Sprache. Passt genau zu den Praxisberichten." },
  { front: "Keyword Biasing", back: "keywords=[...] bevorzugt erwartete Wörter innerhalb der Fünf-Beam-Suche mit längennormalisierter Log-Wahrscheinlichkeit, abgeglichen mit einem Aho-Corasick-Automaten. Keine Nachbearbeitung. Bei einem Vokabular von 8.192 Stücken und wenig implizitem Sprachmodell ist das der wichtigste Genauigkeitshebel: Das Set mit geschlossenem Vokabular eines Testers ging von 70/170 auf 164/170." },
  { front: "needle.stream() und LocalAgreement", back: "Live-Streaming existiert tatsächlich — es übernimmt Wörter, über die sich aufeinanderfolgende überlappende Durchläufe einig sind. Folge: Die wahrgenommene Latenz ist die Einigungsverzögerung (Hunderte ms, bestimmt durch Fenster-Schrittweite und Stabilitätsschwelle), nicht die 11,1 ms Time-to-First-Token, die die Decode-Geschwindigkeit bei einem vollständigen 10-s-Clip sind." },
  { front: "Der gestaffelte Decoder", back: "Jede Decoder-Tiefe ab 2 Layern ist einsetzbar, gewählt beim Laden mit --audio-depth. Ein 16,9-MB-Download ist eine Familie von Genauigkeits-/Latenz-Punkten, gewählt auf dem Gerät statt beim Build." },
  { front: "embed() — ASR ohne Transkript", back: "needle.Whistle().embed(audio) liefert die Encoder-Ausgabe, eine Zeile pro 80-ms-Frame. Wake Words, feste Kommandosätze, Audio-Deduplizierung und Suche innerhalb einer Aufnahme ohne Dekodierung und ohne die Buchstabierfehlerklassen. Oft das richtige Werkzeug für Embedded-Arbeit." },
  { front: "Der genaue Geltungsbereich des Stille-Gates", back: "Die Stille-Erkennung läuft vor der Beam-Suche, sodass Stille und gleichmäßiges Rauschen ein leeres Transkript statt eines erfundenen Satzes liefern — eine echte Behebung von Whispers schlimmster Angewohnheit. Sie deckt nicht leise, entfernte oder überlappende Sprache ab, wo Untertitelkorpus-Artefakte (ein sich wiederholendes „Thank you.“, eine umgedrehte Verneinung) weiterhin auftreten." },
  { front: "Keine Umgebungsvariablen", back: "Die Engine liest keine: Jedes Verhalten ist ein einkompilierter Standard oder ein explizites Flag. Derselbe Blob mit denselben Flags liefert auf jeder Maschine dasselbe Ergebnis — eine Reproduzierbarkeitseigenschaft, die man von jedem Inferenz-Stack einfordern sollte, den man evaluiert." },
  { front: "Wann man Whistle nicht nutzt", back: "Meetings und Raummikrofone (Letzter von drei bei AMI), jede Sprache außerhalb der sieben (kein Chinesisch) und Protokolle von Rang, bei denen eine umgedrehte Verneinung zählt. Parakeet (nvidia/parakeet-tdt-0.6b-v2, CC-BY-4.0) für GPU-Englisch; Whisper large für lokale Genauigkeit; Cloud plus Mensch für Medizin/Recht/Finanzen." }
]} />

<VerifyNote lastVerified="2026-10-09" source="Cactus-Compute/whistle Hugging Face model card (README.md and assets/whistle-benchmarks.svg, Apache-2.0, 210 likes, 5,558 downloads); cactuscompute.com/blog/whistle (published 2 October 2026); cactus-compute/needle on GitHub (13,669 stars, Apache-2.0); cactuscompute.com/blog/needle-supported-devices for platform folders and runner flags; Hacker News thread 50008427, 'Whistle: Speech to Text in 16.9 MB', 768 points and 153 comments, submitted 8 October 2026, for all field reports. Whistle's WER figures are its own printed labels. The Whisper base and Moonshine tiny v2 columns are derived from the chart's bar heights against the scale Whistle's labels establish (6.867 px per WER point, self-consistent to ±0.01 — the derived AMI-cleaned value reproduces the printed 22.87 as 22.86); the vendor states these are the respective authors' published figures. Star counts, download counts and the model's API surface will drift — re-read the model card before relying on a flag or argument name." />

## Quellen und weiterführende Literatur

- [Cactus-Compute/whistle — Hugging Face Model Card](https://huggingface.co/Cactus-Compute/whistle) — Architektur, Eingabevertrag, API-Argumente, Benchmark-Diagramm, Lizenz und Zitierweise
- [Whistle: Speech to Text in 16.9 MB — Cactus-Compute-Blog](https://cactuscompute.com/blog/whistle) — der Launch-Beitrag: Blockstruktur, Dekodierstrategie, Benchmark-Methodik und Präzisions-Fußnoten
- [cactus-compute/needle — GitHub](https://github.com/cactus-compute/needle) — das Python-Paket `cactus-needle` und der Engine-Quellcode, einschließlich `needle.stream()`, `transcribe()` und `embed()`
- [Cactus-Compute/needle3 — Hugging Face](https://huggingface.co/Cactus-Compute/needle3) — die gemeinsame Engine und ihre Ordner pro Plattform (`needle`-Binary, `libneedle.a`, `needle.h`)
- [Needle supported devices — Cactus Compute](https://cactuscompute.com/blog/needle-supported-devices) — die 13 Plattformordner, Runner-Flags, die WASI-Komponente und das Air-Gapped-Setup
- [„Whistle: Speech to Text in 16.9 MB“ — Hacker News](https://news.ycombinator.com/item?id=50008427) — 768 Punkte, 153 Kommentare: die Berichte 70/170 und 164/170, der 30-Sekunden-Laufzeitfehler, die Beschwerden zu Akzenten und spanischer Ausgabe, das sich wiederholende „Thank you.“ und die umgedrehte Verneinung
- [Robust Speech Recognition via Large-Scale Weak Supervision — Radford et al. (arXiv 2212.04356)](https://arxiv.org/abs/2212.04356) — das Whisper-Paper; die Tabellen 9, 10 und 13 sind die Quelle der Whisper-Zahlen in Whistles Diagramm
- [Moonshine: Speech Recognition for Live Transcription and Voice Commands — Jeffries et al. (arXiv 2410.15608)](https://arxiv.org/abs/2410.15608) — das Moonshine-Paper, Tabelle 3
- [nvidia/parakeet-tdt-0.6b-v2 — Hugging Face](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2) — der Favorit der Praktiker im Launch-Thread für Genauigkeit pro Sekunde, CC-BY-4.0
- [Turning Whisper into Real-Time Transcription System — Macháček et al. (arXiv 2307.14743)](https://arxiv.org/abs/2307.14743) — die LocalAgreement-Streaming-Richtlinie, die `needle.stream()` umsetzt, und woher ihre Latenz tatsächlich kommt
- [Classification of Fricative Consonants for Speech Enhancement in Hearing Devices — PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0095001) — warum 3–4 kHz Bandbreite für Vokale genügen, nicht aber für stimmlose Frikative, deren Energie oberhalb von 4 kHz liegt
- [The perceptual significance of high-frequency energy in the human voice — Monson et al., PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4059169/) — was ein bandbegrenztes Front End verwirft und was Hörer dabei verlieren

## Weiter

- [Full-Duplex-Sprach-KI: Warum Sprachagenten plötzlich real wurden](/docs/models/full-duplex-voice-ai) — die andere Hälfte der Schleife: was sich ändert, wenn ein Modell gleichzeitig zuhört und spricht, und warum menschlicher Sprecherwechsel das Latenzbudget setzt
- [Ein privater lokaler KI-Stack](/docs/models/private-local-ai-stack) — wo ein Offline-Transkriptionsschritt neben alles andere gehört, was Sie auf eigener Hardware betreiben
- [Ternäre Quantisierung in der Praxis: Bonsai 2 27B in 5,95 GB](/docs/models/ternary-quantization-bonsai-2-27b) — dieselbe Lehre eine Ebene höher: was ein Beibehaltungsprozentsatz verbirgt und warum ein Standard-Loader selbstbewussten Unsinn ausgeben kann
