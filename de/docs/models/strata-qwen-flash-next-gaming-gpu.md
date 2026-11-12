# Strata: ein 125B-MoE mit 94 tok/s auf einer 12-GB-Karte — und die genaue Rechnung

> Source: https://derob98.github.io/ailmanac/de/docs/models/strata-qwen-flash-next-gaming-gpu · AILmanac (CC BY 4.0) · last verified 2026-10-04

Strata betreibt Qwen3.8-Flash-Next (125B, 6B aktiv) auf einer 12-GB-Gaming-GPU in interaktiver Geschwindigkeit. Diese Seite erklärt die drei Architekturfakten, die das möglich machen, liest die Benchmark-Tabelle ehrlich und beziffert die Qualität, auf die Sie verzichten: 91,3 % von SWE-bench Verified gegenüber 98,7 % von LiveCodeBench, eine KV-Cache-Einstellung, die Needle-Tests besteht und dabei 8–12 % Perplexity verliert, ein Speed-Modus, der Ablehnungsrichtungen entfernt, und eine gemessene Vision-Regression bei identischen Gewichten.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Die drei Architekturfakten verstehen, die ein 125B-Modell auf einer 12-GB-Karte interaktiv machen — und warum keiner davon aggressive Quantisierung ist","Strata-eigene Benchmark-Tabelle ehrlich lesen: Die Schlagzeile von 94 tok/s ist die *niedrigste* Quantisierungsstufe der Leiter, und die oberste Stufe kostet 43 % davon","Die Qualitätsrechnung genau beziffern: 91,3 % von SWE-bench Verified neben 98,7 % von LiveCodeBench, und was diese Lücke darüber verrät, wo Pruning tatsächlich wehtut","Die vier Stolpersteine kennen, die die README-Schlagzeile nicht erwähnt — darunter ein Standard, der Needle-in-Haystack besteht und dabei still an Genauigkeit bei langen Dokumenten verliert","Zwischen Strata, reinem llama.cpp mit --n-cpu-moe und einer gehosteten API für Ihre konkrete Aufgabe entscheiden"]} />

Am 24. September 2026 tauchte ein Repository namens **Strata** auf, mit einem
Ein-Klick-Installer und einer Behauptung, die wie ein Tippfehler klingt: ein
multimodales Modell mit 125 Milliarden Parametern auf einem Gaming-PC betreiben,
in Geschwindigkeiten, mit denen man ein Gespräch führen kann. Zehn Tage später
hat es 10.622 Sterne, 935 Forks und 265 offene Issues, und der Hacker-News-Thread
steht bei 473 Punkten mit 245 Kommentaren. Das Fazit eines Kommentators zur
Lage: *„LLM-Threads weltweit werden mit Strata-Links zugemüllt.“*

Die Behauptung stimmt. Interessant ist, was sie kostet, denn kaum jemand schreibt
diesen Teil auf — die eigenen Schlagzeilenzahlen des Projekts enthalten gar keine
Genauigkeitsspalte. Diese Seite liefert sie.

## Die Version in einem Satz

Qwen3.8-Flash-Next aktiviert pro Token nur etwa 6B seiner 125B Parameter, daher
hält Strata den Pfad pro Token (Attention, Router, Shared Expert, Ausgabekopf) im
VRAM, fixiert alle 24.576 Experten im Systemspeicher und streamt eine 28,8 GB große
Nachschlagetabelle von der SSD — und kauft damit interaktive Geschwindigkeit statt
der Batch-Geschwindigkeiten, mit denen sich Expert-Streaming-Engines zufriedengeben.

Wenn Sie [Colibrì](/docs/models/colibri-stream-frontier-moe-from-ssd) kennen,
ist dies das entgegengesetzte Ende derselben Hierarchie. Colibrì legt die *Experten*
auf die Festplatte, um Modelle mit 744B Parametern bei 0,05–6,8 tok/s zu erreichen.
Strata legt die Experten in den RAM, um 44–94 tok/s bei einem Modell von einem
Fünftel der Größe zu erreichen. Andere Ebene, anderer Anwendungsfall: Das eine ist
für Batch über Nacht, dieses hier für einen Coding-Agenten, auf den man tatsächlich wartet.

## Drei Architekturfakten, keiner davon „Quantisierung“

Man nimmt an, der Trick sei brutale Kompression. Kompression spielt eine Rolle,
aber drei Eigenschaften des Modells leisten den Großteil der Arbeit, und wer sie
kennt, kann das Verhalten auf der eigenen Maschine vorhersagen.

### 1. Das Sparsity-Verhältnis liegt bei etwa 20 zu 1

| Größe | Wert |
|---|---|
| Transformer-Parameter gesamt | 125B |
| Aktiviert pro Token | ~6B |
| MoE-Experten pro Layer | 512 (10 geroutet + 1 Shared aktiv) |
| Layer | 48 |
| Experten im Modell insgesamt | 48 × 512 = **24.576** |
| Hidden Size | 2.560 |

Zehn geroutete Experten von 512 bedeuten, dass für ein gegebenes Token etwa 2 %
der Expertenbank berührt werden. Expertengewichte sind also groß, aber kalt —
genau das Profil, das man in der Speicherhierarchie nach unten schieben will. Der
Pfad pro Token, der heiß bleibt, ist klein genug, um auf einer 12-GB-Karte zu liegen.

### 2. Das Modell ist größer als „125B“ und im RAM kleiner als seine Dateigröße

Das ist der Fakt, der die überraschend moderate RAM-Untergrenze von 32 GB erklärt,
und er wird fast immer falsch wiedergegeben.

Qwen3.8-Flash-Next hat insgesamt **176,9B Parameter**: einen 125B-Transformer,
eine **51B-N-Gram-Embedding**-Tabelle und ein 4B-Modul für Multi-Token-Prediction.
Die N-Gram-Tabelle ist eine feste Nachschlagestruktur für Prompt Lookup — sie wird
nicht matrixmultipliziert und muss daher nicht resident sein. Strata liest sie
ungepuffert von der SSD.

Nehmen Sie das Coder-Release von ISTA-DASLab als durchgerechnetes Beispiel:

| Komponente | Dateigröße | Im RAM resident? | Gespeichert mit |
|---|---|---|---|
| Transformer-Gewichte (256/512 Experten behalten) | 29,6 GB | **Ja** | 1,89 bpw effektiv über die ursprünglichen 125B |
| N-Gram-Tabelle | 28,8 GB | **Nein** — von der SSD gelesen | fest 4,5 bpw |
| **Gesamt auf der Platte** | **58,4 GB** | **29,6 GB resident** | gegenüber **354 GB** in BF16 |

Ein 58-GB-Download hat also ein Speicherbudget von 29,6 GB. Das ist der ganze Grund,
warum eine 32-GB-Maschine auf der Kompatibilitätsliste steht, und es ist der Grund,
warum dieses Modell auf einer mechanischen Festplatte zu betreiben ein
Konfigurationsfehler und keine langsame Wahl ist — die Tabelle liegt bei jedem Prompt auf dem heißen Pfad.

### 3. Nur 12 der 48 Layer bauen einen KV-Cache auf

Flash-Next ist ein Hybrid-Attention-Modell. Drei von vier Layern nutzen
**Gated DeltaNet** (GDN), einen Linear-Attention-Mechanismus, der die Historie in
einen rekurrenten Zustand *fester Größe* komprimiert. Der übrige Layer nutzt
**Qwen Sparse Attention** (QSA) für präzises Retrieval über den gesamten Kontext.
Die Aufteilung ist 36 GDN-Layer zu 12 QSA-Layern.

Die Konsequenz übersehen Leitfäden zur lokalen Inferenz ständig: Bei einem
konventionellen Transformer mit 48 Layern skalieren die Kontextkosten mit allen
48 Layern. Hier skalieren sie mit 12. Das — nicht Quantisierung — ist der Grund,
warum ein natives Fenster von 262.144 Token (erweiterbar auf 1M) auf Consumer-Hardware
bezahlbar ist, und warum Strata ein Flag `--kv-resident` anbieten kann, das den
Kontext-Cache im RAM hält und nur das Arbeitsset der Attention im VRAM.

## Die Speicherkarte

| Ebene | Was dort liegt |
|---|---|
| **VRAM** | Attention- und DeltaNet-Mixer, Router, Shared Experts, Ausgabekopf, MTP-Draft-Layer, Teil des KV-Cache oberhalb von 64K — dann ein **Expert-Cache**, der den verbleibenden VRAM mit den meistgenutzten Experten füllt |
| **RAM** | Alle 24.576 Experten, fixiert. Die CPU berechnet nicht gecachte Experten vor Ort mit AVX-512/AVX2-Kernels, gleichzeitig mit der GPU-Arbeit |
| **SSD** | Die 28,8 GB große N-Gram-Tabelle, ungepuffert gelesen (`--ple-io direct`; auf einer rotierenden Platte `--ple-io ram` verwenden) |

Zwei Mechanismen lassen den Expert-Cache besser funktionieren als eine statische
Aufteilung. Das mitgelieferte **Expert-Profil** reiht alle 24.576 Experten danach,
wie oft sie bei den Trainingsdaten feuerten, sodass der Cache warm startet. Und ab
0.1.31 gibt es **Router Lookahead**: Während die CPU an einem Layer arbeitet, lässt
ein Hintergrund-Thread den Router des *nächsten* Layers laufen, um vorherzusagen,
welche Experten gleich gebraucht werden, und wärmt die Seiten des OS-Dateicaches
dafür vor, sodass I/O und Berechnung sich überlappen. Ein adaptives Stufensystem
(`--adapt-every`) formt den Cache dann um Ihre tatsächliche Unterhaltung herum neu.

## Die Benchmark-Tabelle ehrlich lesen

Das sind die eigenen Messungen des Projekts. Beachten Sie, was die Quantisierungsspalte mit ihnen macht.

**RTX 5070 (12 GB), Ryzen 5 7600, 64 GB RAM**

| Quantisierung | Decode (tok/s) | Prefill (tok/s) |
|---|---|---|
| Q2_0 | **94** | 2.650 |
| IQ2_XS | 79 | 2.090 |
| IQ3_XXS | 62 | 1.750 |
| IQ3_S | 53 | 1.620 |
| Coder (pruned) | 55 | 2.180 |

**RX 9070 XT (16 GB), Ryzen 9 3900X, 47 GB RAM**

| Quantisierung | Decode (tok/s) | Prefill (tok/s) |
|---|---|---|
| Q2_0 | 60 | 1.160 |
| IQ2_XS | 52 | 1.110 |
| Coder (pruned) | 44 | 1.420 |

Die Schlagzeile „94 tok/s“ ist **Q2_0** — die unterste Sprosse. IQ3_S, das das
Projekt als höchste Qualität kennzeichnet, läuft mit 53 tok/s: Sie geben 43 % der
beworbenen Geschwindigkeit ab, um die Leiter hinaufzusteigen. Community-Berichte
füllen den Rest der Spanne auf, und sie ist breit: 124 tok/s auf einer 4090 mit
128 GB DDR5 und einem 7950X3D; etwa 30 tok/s auf einer 3080 (10 GB) mit einem 3600X;
33 tok/s auf einer RTX 2060 bei Q2_0, aber 21 bei IQ3_XXS; rund 25 tok/s auf einem
M1 Max bei 3 Bit; und 7 tok/s Decode bei 60 tok/s Prefill auf einem GPU-losen
8845HS-Laptop mit 96 GB.

Lesen Sie diese Liste als Regel statt als Rangliste: **Die Decode-Geschwindigkeit
folgt der RAM-Bandbreite und der Quantisierungsstufe, nicht der GPU-Klasse.** Dass
die 2060 bei Q2_0 die 3080 schlägt, ist kein Messfehler. Die Karte hält den heißen
Pfad; der Systemspeicher streamt die Experten.

## Die Qualitätsrechnung

Hier ist, was die Schlagzeilenzahlen auslassen. Es sind zwei getrennte
Kompressionen im Spiel, und sie versagen auf unterschiedliche Weise.

### GSQ — der Quantisierer

**Gumbel-Softmax Quantization** ist eine skalare Post-Training-Quantisierung, die
Gitterzuordnungen und Gruppenskalen *gemeinsam* lernt. Das verkleinert die übliche
Lücke zur Vektorquantisierung bei niedrigen Bitbreiten, während die Dateien als
Standard-GGUF ladbar bleiben. Behaltene Experten landen bei 3,5 Bit pro Gewicht.

### RCO — der Pruner

**Riemannian Constraint Optimization** wählt aus, welche Experten gelöscht werden.
Es behandelt die zulässige Menge als glatte Mannigfaltigkeit, sodass Budgets pro
Layer *exakt* durchgesetzt werden, ohne einen abzustimmenden Strafkoeffizienten,
und unterstützt gleichzeitig ein unterschiedliches Budget pro Layer. Das
Coder-Release behält **256 der 512 Experten jedes Layers** — weiterhin 10 aktiv pro
Token —, kalibriert auf Code-, Agenten- und Vision-Daten.

### Was das Pruning kostet, gemessen

| Benchmark | BF16-Basis | GSQ-RCO Coder | Beibehaltung |
|---|---|---|---|
| SWE-bench Verified | 82,80 | 75,60 | **91,3 %** |
| LiveCodeBench v6 | 87,43 | 86,28 | **98,7 %** |

Lesen Sie das nicht als „ungefähr gleich“. Die Lücke zwischen den beiden ist die
nützlichste einzelne Zahl auf dieser Seite.

LiveCodeBench ist kurzhorizontig: ein Problem lesen, eine Lösung ausgeben. Es
bemerkt kaum, dass die Hälfte der Expertenbank fehlt — 1,3 % weniger.
SWE-bench Verified lässt lange agentische Verläufe gegen echte Repositories laufen,
und dort verliert dasselbe Modell **7,2 Punkte**. Gleiche Gewichte, gleiche
Quantisierung, sechsfacher relativer Schaden.

**Expert-Pruning kostet Horizont, nicht Wissen.** Das Modell weiß weiterhin, wie
man die Funktion schreibt. Was nachlässt, ist, einen Plan über vierzig Tool-Aufrufe
zu halten — genau die Fähigkeit, aus der eine agentische Coding-Schleife besteht.
Das Wort eines Kommentators dafür war „lobotomisiert“, und das Benchmark-Paar ist der Beleg.

Die Autoren sind bei der zugehörigen Grenze des Geltungsbereichs eindeutig: Die
Kalibrierung deckte Code-, Agenten- und Vision-Daten ab, und *„Verschlechterung
außerhalb dieser Menge ist ein akzeptierter Preis.“* Wenn Sie die Coder-Variante auf
Prosa, Übersetzung oder Nicht-Code-Reasoning richten, sind Sie bewusst außerhalb der
Verteilung, ohne veröffentlichte Zahl dafür, wie weit.

## Vier Stolpersteine, die die Schlagzeile nicht erwähnt

<Callout type="warning" items={["Der Speed-Modus namens ESP wird vom Projekt als Entfernen von Ablehnungsrichtungen dokumentiert. Das ist eine Änderung des Sicherheitsverhaltens, ausgeliefert in einer Performance-Funktion — behandeln Sie es als anderes Modell, nicht als schnelleres."]} />

**1. ESP tauscht Alignment und Ausgabeverteilung gegen Geschwindigkeit.** Die
eigene Dokumentation des Projekts hält fest, dass sein Speed-Projection-Pfad die
Sicherheit verschlechtert, indem er Ablehnungsrichtungen entfernt, die Perplexity
bei Code um 15 % erhöht und die Top-1-Token-Übereinstimmung mit dem Standardmodell
auf etwa 93 % senkt. Eine Abweichungsrate von 7 % bei der Wahl des nächsten Tokens
summiert sich über eine lange Generierung stark auf. Wenn Sie es aktivieren, führen
Sie nicht mehr das Modell aus, das Sie gebenchmarkt haben.

**2. 4-Bit-KV besteht Needle-Tests und verliert dabei Genauigkeit bei langen
Dokumenten.** Der mitgelieferte Standard ist 8-Bit-KV. `--kv q4_0` wendet vor der
Quantisierung eine Hadamard-Rotation an, halbiert den Cache-Speicher und ist bei
128K etwa 4 % schneller — zum Preis von **8–12 % höherer Perplexity bei langen
Dokumenten**. Die Dokumentation vermerkt, dass Needle-Tests weiterhin bestehen. Das
ist die Falle: Dass Needle-in-Haystack-Retrieval überlebt, ist kein Beleg dafür,
dass *Reasoning* über langen Kontext überlebt hat. Der Installer bietet Ihnen
4-Bit oberhalb von 4K Kontext an, also ist das eine Entscheidung, um die Sie gebeten
werden, bevor Sie einen Grund haben, sie zu verstehen. Es gibt auch ein
`--kv k8v4`-Hybrid — 8-Bit-Keys, rotierte 4-Bit-Values — für 23 % weniger
KV-Speicher bei messbar langsameren Prompts.

**3. Identische Gewichte, andere Engine, andere Antworten.** Ein HN-Kommentator ließ
einen Benchmark zur Koordinatenlokalisierung mit 50 Bildern durch beide Engines
laufen, mit *demselben GGUF und demselben Vision-Adapter*: Strata erzeugte einen
medianen Fehler von 154,8 Pixeln (Mittel 168,8); llama.cpp 46,5 (Mittel 81,4). Seine
Einschätzung war, die Lücke „ist so groß wie der Sprung von einem 9B- zu einem
35B-Modell“. Die Dokumentation des Projekts liefert einen plausiblen Mechanismus aus
derselben Problemfamilie — seine IQ-Pack-Multi-Token-Kernels runden anders als die
Single-Token-CPU-Pfade, mit einem Opt-in-Reproduzierbarkeits-Flag
(`STRATA_IQ_MT_MIN=1`), das in 0.1.30 hinzukam. Die Lehre geht über dieses Projekt
hinaus: Wenn eine neue Engine große Beschleunigung bei Gewichten behauptet, die Sie
schon haben, **lassen Sie Ihre eigene Eval auf Ihrer eigenen Aufgabe laufen, bevor
Sie der Ausgabe trauen**, denn „gleiche Datei“ heißt nicht „gleiche Antworten“.

**4. Jenseits von 262K sind Sie in ungetestetem Gebiet.** Außerhalb des nativen
Fensters greift Yarn-RoPE-Skalierung, und die Dokumentation beschreibt sie als
experimentell, mit auf einer einzigen Maschine gemessener Qualität.
Community-Berichte über Tool-Calling-Fehler und Rechtschreibfehler ab 150K+ passen
zu diesem Vorbehalt.

## Das erste Token bekommen

<Steps items={[
  {
    title: "Die Untergrenze prüfen, bevor Sie 58 GB herunterladen",
    body: "Minimum sind 12 GB VRAM auf einer NVIDIA-RTX-20/30/40/50-Serie oder einer unterstützten AMD Radeon (RX 7700 XT und höher, RX 9060 XT, RX 9070/9070 XT, Radeon AI PRO R9700, RX 6800/6900), 32 GB Systemspeicher und etwa 80 GB freier Platz. Nehmen Sie als Speicher eine SSD: Die 28,8 GB große N-Gram-Tabelle wird bei jedem Prompt gelesen, eine rotierende Platte ist also keine langsame, sondern eine defekte Konfiguration."
  },
  {
    title: "Den Installer ausführen und die Variante wählen lassen",
    body: "Windows: START-HERE.bat. Linux: ./setup.sh. Er erkennt Ihre Hardware und empfiehlt anhand Ihres verfügbaren RAM eine Modellgröße. Rechnen Sie beim ersten Lauf mit etwa einer Stunde von Anfang bis Ende — das meiste davon Download — und bei späteren Starts mit etwa 15 Minuten für das Laden des Modells."
  },
  {
    title: "4-Bit-KV beim ersten Lauf ablehnen",
    body: "Oberhalb von 4K Kontext bietet der Installer 4-Bit-KV an. Sagen Sie beim ersten Mal nein. Stellen Sie fest, was das Modell mit dem 8-Bit-Standard für Sie leistet, und entscheiden Sie dann, ob 8–12 % höhere Perplexity bei langen Dokumenten ein Tausch ist, den Sie für ~4 % Geschwindigkeit wollen. Eine Verschlechterung, für die Sie nie eine Baseline gemessen haben, können Sie nicht bewerten."
  },
  {
    title: "Ihr bestehendes Tooling auf localhost richten",
    body: "Der Server stellt eine OpenAI-kompatible Oberfläche unter http://127.0.0.1:8080/v1, die OpenAI Responses API unter /v1/responses und einen Endpunkt in Anthropic-Form unter /v1/messages bereit. Alles, was bereits gegen diese Formen geschrieben wurde — einschließlich Claude Code über seine Base-URL-Überschreibung — verbindet sich ohne Codeänderungen."
  },
  {
    title: "Ihre eigene Eval laufen lassen, bevor Sie vertrauen",
    body: "Zwanzig bis fünfzig Aufgaben aus Ihrer tatsächlichen Arbeit, zweimal gleich bewertet: einmal über Strata, einmal über Standard-llama.cpp mit dem ggml-org-GGUF. Die obige Vision-Regression wurde genau so von einer Person an einem Nachmittag gefunden. Dieser Schritt ist bei einem zehn Tage alten Projekt mit 265 offenen Issues keine optionale Sorgfalt."
  }
]} />

<PromptCard title="Den Server mit API-Key im LAN verfügbar machen">{`START-HERE.bat --setup --host 0.0.0.0 --api-key <your-secret>`}</PromptCard>

<PromptCard title="Die Flags, die man kennen sollte, und was jedes eintauscht">{`--ple-io direct      # unbuffered n-gram table reads (use 'ram' on a rotational disk)
--kv-resident 32768  # keep the context cache in RAM, only attention's working set in VRAM
--prefill auto       # chunk prompts up to 8,192 tokens for GPU streaming
--pcie-frac N        # share of missing experts fetched over PCIe vs computed on CPU
--pool-workers N     # CPU threads computing non-cached experts
--adapt-every N      # how often the expert cache re-ranks around your conversation
--kv q4_0            # halve KV memory: ~4% faster at 128K, 8-12% worse perplexity on long docs
--kv k8v4            # 8-bit keys, rotated 4-bit values: 23% less KV memory, slower prompts
--spec-min-p         # draft-acceptance confidence threshold for speculative decoding`}</PromptCard>

<Callout type="note" items={["Einstellungen verteilen sich auf CLI-Argumente, den Block args pro Modell in strata-<model>.json und STRATA_*-Umgebungsvariablen, und die Dokumentation sagt nicht durchgängig, was wo liegt. Nützliche Umgebungsvariablen sind STRATA_PF_FUSED (fusionierte Prompt-Kernels), STRATA_DECODE_TIMING=1 (Decode-Fenster profilieren), STRATA_RESIDENT_PIN=0 (Page-Locking im residenten Modus bei wenig RAM deaktivieren) und STRATA_IQ_MT_MIN=1 (Rundung im Single-Token-Pfad für Reproduzierbarkeit)."]} />

## Welche Sprosse Sie tatsächlich wollen

| Ihre Aufgabe | Wählen | Warum |
|---|---|---|
| Agentisches Coding, lange Tool-Call-Verläufe | Volles Modell mit IQ3_S oder Unsloth UD-IQ4_XS (~80 GB RAM) | SWE-bench ist, wo Pruning 7,2 Punkte kostet. Zahlen Sie das nicht bei Ihrer Hauptarbeitslast |
| Einmalige Code-Generierung, Snippets, Review | Coder (pruned, 32 GB RAM) | 98,7 % von LiveCodeBench bei halber Expertenbank. Das ist die Sprosse, für die das Pruning entworfen wurde |
| Vision- und Koordinatenarbeit | Standard-llama.cpp mit `ggml-org/Qwen3.8-Flash-Next-GGUF` | Die einzige Gegenüberstellung bei identischen Gewichten spricht beim Lokalisierungsfehler 3-fach für llama.cpp |
| Maximale tok/s für Wegwerf-Entwürfe | Q2_0 | 94 tok/s, und nach der informationstheoretischen Schätzung eines Kommentators etwa 80 % der „Erinnerungen“ des Modells bei 2 Bit. Gut für Entwürfe, nicht für Fakten |
| Lange Dokumente, 128K+ Kontext | Volles Modell, 8-Bit-KV, innerhalb von 262K bleiben | 4-Bit-KV und Yarn-Skalierung sind beide als verlustbehaftet oder experimentell dokumentiert |
| Zuverlässigkeit vor Geschwindigkeit | Standard-llama.cpp mit `--n-cpu-moe` | Auf derselben Hardware langsamer, aber es ist die Referenzimplementierung, an der Ihre Eval gemessen werden sollte |
| Alles, bei dem ein Fehler teuer ist | Eine gehostete API | Der HN-Konsens von Leuten, die diese Hardware besitzen: Für anspruchsvolle Arbeit nehmen sie weiterhin standardmäßig die Cloud |

## Die ehrliche Baseline: llama.cpp mit --n-cpu-moe

Strata ist keine Engine von Grund auf. Es baut auf **llama.cpp / ggml** (MIT) auf,
übernimmt i-quant-GPU-Kernels aus dem Upstream, nutzt die quantisierten
MMQ-Skalarprodukt-Kernels von llama.cpp und bezieht seinen Vision-Encoder aus der
`mtmd`-Bibliothek von llama.cpp. Der Beitrag sind das Packaging und das
Flash-Next-spezifische Scheduling. Das ist praktisch relevant: Die Baseline ist ein Flag entfernt.

`--n-cpu-moe N` verschiebt die MoE-Feed-Forward-Gewichte der ersten N Layer auf die
CPU. Die Begründung ist dasselbe Sparsity-Argument, mit dem diese Seite begann:
Expert-Stacks sind groß und werden selten berührt, daher bringen sie den meisten
VRAM für die geringste Geschwindigkeitseinbuße, während Attention, Embeddings und
der KV-Cache klein sind, bei jedem Token berührt werden und auf die GPU gehören.
Mehr VRAM bedeutet ein niedrigeres N und eine höhere Decke, bevor die CPU-Seite zum
Engpass wird. Passt das Modell bereits in den VRAM, verschlechtert ein höheres N den
Durchsatz stetig — das Flag ist ein Weg, etwas unterzubringen, nicht ein Weg, schneller zu werden.

Berichtete Community-Zahlen setzen llama.cpp bei etwa 21 tok/s an, wo Strata auf
vergleichbarer Hardware 100+ erreicht. Das ist eine reale und große Lücke. Es ist
auch die Lücke, die Sie sich mit einer zehn Tage alten Codebasis, 265 offenen
Issues, dokumentierter Rundungsabweichung der Kernels und ohne Genauigkeitsspalte
erkaufen. Entscheiden Sie bewusst und nicht nach der Schlagzeile.

<Callout type="note" items={["Das GGUF-Ökosystem für dieses Modell ist ungewöhnlich überfüllt: die GSQ-RCO-Releases von ISTA-DASLab (1,89M und 351k Downloads), unsloth (1,4M), der offizielle ggml-org-Build, bartowski und mehrere abliterated und uncensored Community-Varianten. Die Download-Zahl ist Popularität, nicht Qualität. Die zwei mit veröffentlichten Benchmark-Tabellen sind die von ISTA-DASLab; der Referenz-Build zum Vergleich ist der von ggml-org."]} />

## Was dieser Durchlauf des Hype-Zyklus tatsächlich lehrt

Ohne das konkrete Projekt bleiben drei dauerhafte Lehren, und sie gelten auch für
die nächste Engine, die trendet:

1. **Sparsity, nicht Kompression, macht große Modelle lokal.** Ein 125B-MoE mit 6B
   aktiv kann auf Consumer-Hardware komfortabler sein als ein dichtes 32B-Modell,
   weil die Beschränkung, unter der Sie stehen, RAM-Kapazität und -Bandbreite ist
   und nicht VRAM-Kapazität. Prüfen Sie die Zahl der aktiven Parameter vor der Gesamtzahl.
2. **Kompression hat eine Form, keine Größe.** „91 % behalten“ und „99 % behalten“
   stammen vom selben Artefakt am selben Tag. Welche Zahl Sie bekommen, hängt
   vollständig davon ab, ob Ihre Aufgabe kurz- oder langhorizontig ist. Fragen Sie,
   auf welchem Benchmark die Beibehaltungszahl gemessen wurde.
3. **Eine Engine ist Teil des Modells.** Identische Gewichte erzeugten zwischen zwei
   Engines einen 3-fachen Unterschied beim Lokalisierungsfehler. Kernels runden,
   Caches quantisieren, Speed-Modi projizieren. Ihre Eval muss die Engine abdecken,
   nicht nur den Checkpoint.

<Quiz questions={[
  {
    q: "Warum kann hier ein Modell mit 125B Parametern auf einer 12-GB-GPU laufen, wo ein dichtes 32B-Modell Mühe hätte?",
    options: [
      "Die Gewichte sind auf 1 Bit komprimiert",
      "Nur ~6B der 125B Parameter werden pro Token aktiviert, sodass der heiße Pfad pro Token in den VRAM passt, während die 24.576 kalten Experten im Systemspeicher fixiert sind",
      "Die GPU wird gar nicht benutzt",
      "Das Modell wird bei Bedarf Layer für Layer heruntergeladen"
    ],
    answer: 1,
    explain: "Zehn geroutete Experten von 512 bedeuten, dass pro Token etwa 2 % der Expertenbank berührt werden. Expertengewichte sind groß, aber kalt, deshalb werden sie in der Hierarchie in den RAM verschoben; Attention, Router, der Shared Expert und der Ausgabekopf bleiben heiß und klein genug für eine 12-GB-Karte."
  },
  {
    q: "Die Coder-Variante behält 98,7 % von LiveCodeBench v6, aber nur 91,3 % von SWE-bench Verified. Was sagt diese Lücke aus?",
    options: [
      "SWE-bench ist ein defekter Benchmark",
      "Die Quantisierung ist instabil und die Ergebnisse sind Rauschen",
      "Expert-Pruning schädigt vor allem die langhorizontige agentische Fähigkeit, nicht das Coding-Wissen für kurze Antworten",
      "Das Modell wurde auf LiveCodeBench trainiert"
    ],
    answer: 2,
    explain: "LiveCodeBench ist Problem lesen und Lösung ausgeben und verliert 1,3 %. SWE-bench Verified lässt lange Verläufe über echte Repositories laufen und verliert 7,2 Punkte — sechsfacher relativer Schaden bei denselben Gewichten. Pruning kostet Horizont, nicht Wissen."
  },
  {
    q: "Sie aktivieren den 4-Bit-KV-Cache, und Ihr Needle-in-Haystack-Test besteht bei 128K weiterhin. Was haben Sie damit festgestellt?",
    options: [
      "Die Qualität bei langem Kontext ist unbeeinträchtigt",
      "Fast nichts — dass Needle-Retrieval überlebt, ist mit dem dokumentierten Anstieg der Perplexity um 8–12 % bei langen Dokumenten vereinbar",
      "Dass der Cache verlustfrei ist",
      "Dass Sie auch ESP aktivieren sollten"
    ],
    answer: 1,
    explain: "Needle-Tests prüfen das Auffinden eines platzierten Fakts, ein weit leichteres Ziel als Reasoning über das ganze Dokument. Das Projekt dokumentiert 8–12 % höhere Perplexity bei langen Dokumenten, während Needle-Tests weiterhin bestehen — ein bestandener Needle-Test ist also keine Qualitätsprüfung für langen Kontext."
  },
  {
    q: "Ein 58,4-GB-Download ist als nur 32 GB Systemspeicher benötigend aufgeführt. Warum ist das kein Widerspruch?",
    options: [
      "Die Datei ist auf der Platte komprimiert und dehnt sich im RAM aus",
      "28,8 GB davon sind die N-Gram-Nachschlagetabelle, die ungepuffert von der SSD gelesen wird und nie resident wird — übrig bleibt ein residenter Fußabdruck von 29,6 GB",
      "Die Hälfte der Datei ist Dokumentation",
      "Sie wird bei Speicherdruck auf die Platte ausgelagert"
    ],
    answer: 1,
    explain: "Qwen3.8-Flash-Next besteht aus einem 125B-Transformer plus einem 51B-N-Gram-Embedding plus einem 4B-MTP-Modul. Die N-Gram-Tabelle ist eine Nachschlagestruktur, keine pro Token multiplizierte Matrix, daher bleibt sie auf der SSD. Das ist auch der Grund, warum eine rotierende Platte eine defekte Konfiguration ist und nicht bloß eine langsame."
  },
  {
    q: "Dasselbe GGUF und derselbe Vision-Adapter ergaben auf einer Engine einen medianen Lokalisierungsfehler von 154,8 px und auf einer anderen 46,5 px. Was ist die richtige Schlussfolgerung?",
    options: [
      "Die GGUF-Datei ist beschädigt",
      "Vision-Adapter sind generell unzuverlässig",
      "Die Engine ist Teil des Modells — Kernel-Rundung, Cache-Quantisierung und Speed-Modi verändern alle die Ausgaben, daher muss Ihre Eval die Engine abdecken und nicht nur den Checkpoint",
      "Die langsamere Engine ist immer genauer"
    ],
    answer: 2,
    explain: "Die eigene Dokumentation des Projekts vermerkt, dass seine IQ-Pack-Multi-Token-Kernels anders runden als die Single-Token-CPU-Pfade, mit STRATA_IQ_MT_MIN=1 als hinzugefügtem Opt-in-Reproduzierbarkeits-Flag. 'Gleiche Gewichte' bedeutet nicht 'gleiche Antworten'."
  },
  {
    q: "Was macht das Flag --n-cpu-moe von llama.cpp, und wann schadet ein höherer Wert?",
    options: [
      "Es fügt der Inferenz CPU-Kerne hinzu; ein höherer Wert hilft immer",
      "Es verschiebt die MoE-Feed-Forward-Gewichte der ersten N Layer auf die CPU; passt das Modell bereits in den VRAM, verschlechtert ein höheres N den Durchsatz stetig",
      "Es aktiviert das Mixture-of-Experts-Routing",
      "Es quantisiert die Experten auf 4 Bit"
    ],
    answer: 1,
    explain: "Es ist ein Weg, etwas unterzubringen, nicht ein Weg, schneller zu werden. Experten sind groß und werden selten berührt, daher gibt ihr Auslagern den meisten VRAM für die geringste Geschwindigkeitseinbuße frei — aber sobald das Modell auf die GPU passt, ist jeder zusätzlich ausgelagerte Layer reiner Verlust."
  }
]} />

<Flashcards cards={[
  { front: "Qwen3.8-Flash-Next in Zahlen", back: "125B Transformer-Parameter mit ~6B aktiviert pro Token, plus ein 51B-N-Gram-Embedding und ein 4B-MTP-Modul — 176,9B insgesamt. 48 Layer, Hidden Size 2.560, 512 Experten pro Layer mit 10 geroutet + 1 Shared aktiv, 24.576 Experten insgesamt. Nativer Kontext von 262.144 Token, erweiterbar auf 1M. Multimodal (Text, Bild, Video). Eine experimentelle Vorschau auf die Qwen4-Architektur." },
  { front: "GDN und QSA — die Hybrid-Attention-Aufteilung", back: "Gated DeltaNet ist Linear Attention, die die Historie in einen rekurrenten Zustand fester Größe komprimiert; Qwen Sparse Attention leistet präzises Retrieval über den gesamten Kontext. 36 von 48 Layern sind GDN, 12 sind QSA. Nur diese 12 bauen einen KV-Cache auf — das ist der eigentliche Grund, warum ein 262K-Fenster lokal bezahlbar ist, und kein Quantisierungstrick." },
  { front: "GSQ (Gumbel-Softmax Quantization)", back: "Skalare Post-Training-Quantisierung, die Gitterzuordnungen und Gruppenskalen gemeinsam lernt, die übliche Lücke zur Vektorquantisierung bei niedrigen Bitbreiten verkleinert und die Ausgabe als Standard-GGUF ladbar hält. Behaltene Experten im ISTA-DASLab-Release liegen bei 3,5 Bit pro Gewicht." },
  { front: "RCO (Riemannian Constraint Optimization)", back: "Die Expert-Pruning-Methode. Sie behandelt die zulässige Menge als glatte Mannigfaltigkeit, sodass Budgets pro Layer exakt und ohne abzustimmenden Strafkoeffizienten durchgesetzt werden und mehrere gleichzeitige Budgets (eines pro Layer) unterstützt werden. Das Coder-Release behält 256 der 512 Experten jedes Layers, weiterhin 10 aktiv pro Token." },
  { front: "Die zwei Beibehaltungszahlen, die zählen", back: "GSQ-RCO Coder vs. BF16-Basis: SWE-bench Verified 75,60 vs. 82,80 (91,3 %), LiveCodeBench v6 86,28 vs. 87,43 (98,7 %). Die Lücke ist die Lehre — Pruning kostet langhorizontige agentische Fähigkeit relativ etwa sechsmal mehr als Coding-Wissen für kurze Antworten." },
  { front: "Expert-Cache und Router Lookahead", back: "Der Expert-Cache füllt übrigen VRAM mit den meistgenutzten Experten, vorbelegt durch ein mitgeliefertes Profil, das alle 24.576 Experten nach Feuerhäufigkeit bei Trainingsdaten reiht, und über --adapt-every um Ihre Unterhaltung herum neu gereiht. Router Lookahead (0.1.31+) lässt den Router des nächsten Layers in einem Hintergrund-Thread laufen, während die CPU am aktuellen arbeitet, und wärmt Dateicache-Seiten vor, sodass I/O und Berechnung sich überlappen." },
  { front: "Die KV-Cache-Optionen und ihre Preise", back: "8-Bit-KV ist der mitgelieferte Standard. --kv q4_0 wendet eine Hadamard-Rotation an und quantisiert dann: halbiert den Cache-Speicher, ~4 % schneller bei 128K, 8–12 % höhere Perplexity bei langen Dokumenten, während Needle-Tests weiterhin bestehen. --kv k8v4 behält 8-Bit-Keys mit rotierten 4-Bit-Values: 23 % weniger KV-Speicher, messbar langsamere Prompts." },
  { front: "ESP (Speed Projection) — warum man es ausgeschaltet lässt", back: "Vom Projekt dokumentiert als Verschlechterung der Sicherheit durch Entfernen von Ablehnungsrichtungen, Anhebung der Perplexity bei Code um 15 % und Senkung der Top-1-Token-Übereinstimmung mit dem Standardmodell auf etwa 93 %. Eine Abweichungsrate von 7 % beim nächsten Token summiert sich über eine lange Generierung. Es zu aktivieren heißt, nicht mehr das Modell auszuführen, das Sie gebenchmarkt haben." },
  { front: "Effektive Bits pro Gewicht, durchgerechnet", back: "ISTA-DASLab Coder: 29,6 GB Transformer-Gewichte über die ursprünglichen 125B Parameter sind 1,89 Bit pro Parameter (29,6 x 8 / 125). Die N-Gram-Tabelle sind 28,8 GB über 51B Parameter, fest 4,5 bpw. Gesamt 58,4 GB gegenüber 354 GB in BF16 (176,9B x 2 Byte)." },
  { front: "Worauf Strata aufbaut", back: "llama.cpp / ggml, MIT. Es übernimmt i-quant-GPU-Kernels aus dem Upstream, nutzt die quantisierten MMQ-Skalarprodukt-Kernels von llama.cpp und bezieht seinen Vision-Encoder aus der mtmd-Bibliothek von llama.cpp. Der Beitrag ist Packaging plus Flash-Next-spezifische Platzierung und Scheduling — das heißt, reines llama.cpp mit --n-cpu-moe steht immer als Ihre Referenz-Baseline zur Verfügung." },
  { front: "--n-cpu-moe in einer Zeile", back: "Verschiebt die MoE-Feed-Forward-Gewichte der ersten N Layer auf die CPU. Experten sind groß und werden selten berührt, daher geben sie den meisten VRAM für die geringste Geschwindigkeitseinbuße frei, während Attention, Embeddings und KV klein sind, bei jedem Token berührt werden und auf der GPU bleiben. Ein Weg, etwas unterzubringen, nicht schneller zu werden: Sobald das Modell passt, kostet ein höheres N nur Durchsatz." }
]} />

<VerifyNote lastVerified="2026-10-04" source="Niko1221/Strata README and docs/DETAILS.md; GitHub API (10,622 stars, 935 forks, 265 open issues, MIT, created 2026-09-24); ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-Coder-GGUF model card; Qwen/Qwen3.8-Flash-Next model card; Hacker News thread 49953495 (473 points, 245 comments). Benchmark tables are the respective projects' own measurements. This repository is ten days old and moving daily — flags, defaults and variant names will drift; re-read DETAILS.md before relying on any flag here." />

## Quellen und weiterführende Literatur

- Niko1221/Strata — Repository, README, Hardware-Matrix und Benchmark-Tabellen: https://github.com/Niko1221/Strata
- Strata `docs/DETAILS.md` — Speicherebenen, Expert-Cache, Router Lookahead, KV-Optionen, Flags, Umgebungsvariablen und die genannten Genauigkeitsvorbehalte: https://github.com/Niko1221/Strata/blob/main/docs/DETAILS.md
- „Run Qwen 3.8 Flash Next (125B) on consumer hardware (RTX 4090) at 100T/s“ — der Hacker-News-Thread, einschließlich Vision-Benchmark-Vergleich und Hardware-Spanne: https://news.ycombinator.com/item?id=49953495
- Qwen/Qwen3.8-Flash-Next — offizielle Model Card: Architektur, GDN/QSA-Aufteilung, Expertenzahlen, Kontext und empfohlene Serving-Stacks: https://huggingface.co/Qwen/Qwen3.8-Flash-Next
- ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-Coder-GGUF — das Pruned-Release mit der veröffentlichten Beibehaltungstabelle für SWE-bench und LiveCodeBench: https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-Coder-GGUF
- ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF — das ungeprunte GSQ-Release: https://huggingface.co/ISTA-DASLab/Qwen3.8-Flash-Next-GSQ-RCO-GGUF
- ggml-org/Qwen3.8-Flash-Next-GGUF — der llama.cpp-Referenz-Build zum Vergleichen: https://huggingface.co/ggml-org/Qwen3.8-Flash-Next-GGUF
- unsloth/Qwen3.8-Flash-Next-GGUF — die UD-IQ4_XS-Quantisierung, die für nahezu volle Modellqualität bei ~80 GB genannt wird: https://huggingface.co/unsloth/Qwen3.8-Flash-Next-GGUF
- „Performant local mixture-of-experts CPU inference with GPU acceleration in llama.cpp“ — der Baseline-Leitfaden zum Offloading: https://huggingface.co/blog/Doctor-Shotgun/llamacpp-moe-offload-guide
- „REAP the Experts: Why Pruning Prevails for One-Shot MoE Compression“ — Hintergrund zu Expert-Pruning als Kompressionsstrategie: https://arxiv.org/abs/2510.13999

## Weiter

- [Colibrì: ein 744B-MoE von Ihrer SSD betreiben](/docs/models/colibri-stream-frontier-moe-from-ssd) — das andere Ende derselben Hierarchie: Experten auf der Platte, Modelle in Frontier-Größe, Batch-Geschwindigkeiten
- [Ternäre Quantisierung in der Praxis: Bonsai 2 27B in 5,95 GB](/docs/models/ternary-quantization-bonsai-2-27b) — was ein Beibehaltungsprozentsatz verbirgt und warum ein Standard-Loader selbstbewussten Unsinn ausgeben kann
- [Ein privater lokaler KI-Stack](/docs/models/private-local-ai-stack) — wo ein schnelles, aber geprunetes lokales Modell neben allem anderen hingehört, was Sie betreiben
