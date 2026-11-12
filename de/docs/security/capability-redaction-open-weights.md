# Capability Redaction: Was der Cyber-Schnitt bei Kimi K3.1 Pro tatsächlich gebracht hat

> Source: https://derob98.github.io/ailmanac/de/docs/security/capability-redaction-open-weights · AILmanac (CC BY 4.0) · last verified 2026-10-26

Moonshot hat Cyber-Daten aus zwei Trainingsphasen von Kimi K3.1 Pro entfernt und den Preis veröffentlicht: Die Exploit-Erfolgsquote fiel von 90,5 % auf 81,0 %. Derselbe Generationssprung hatte sie von 33,3 % angehoben. Die Schwärzung machte also 9,5 Punkte eines Gewinns von 47,7 Punkten rückgängig, ließ das Modell über einem ungeschwärzten Open-Weight-Konkurrenten und wurde an einem Benchmark gemessen, den außerhalb von Moonshot niemand ausführen kann. Die Rechnung, die Exportregel dahinter, das Veröffentlichungsrennen, das ihre Ausnahmen erzeugen, und eine Checkliste zum Lesen des nächsten geschwärzten Releases.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Die Rechnung machen, die die Schlagzeilen übersprungen haben: Die Schwärzung kostete 9,5 Punkte, und die Generation, in der sie ausgeliefert wurde, hatte 47,7 hinzugefügt — also stammten etwa vier Fünftel der Exploit-Fähigkeit des Modells daher, dass es ein besseres allgemeines Coding-Modell ist","Den Mechanismus verstehen, der gezielte Datenentfernung schwach macht: Moonshots eigene Erklärung ist, dass sich Fähigkeiten im Debugging über lange Horizonte auf Exploitation übertragen, was bedeutet, dass die Fähigkeit nie in den entfernten Daten lokalisiert war","Sehen, dass die Schwärzung Kimi genau eine Stufe nach unten bewegte — hinter einen Open-Weight-Konkurrenten, den niemand geschwärzt hat","Die drei Schwellen in Chinas Announcement No. 48 kennen, die ein Modell unter Exportkontrolle stellen, und dass allein die Parameterzahl eine davon ist","Die Uhr erkennen, die die Ausnahmen erzeugen: Bereits öffentliche Gewichte sind ausgenommen, die Regel belohnt also frühere statt spätere Veröffentlichung","Die Verifikationsasymmetrie erkennen — xdev-bench-hard ist intern und unveröffentlicht, daher können weder die 90,5 % noch die 81,0 % von jemandem außerhalb des Labors reproduziert werden","Die eine Frage stellen, die niemand beantwortet hat und die allein entscheidet, ob eine Schwärzung dauerhaft ist: Bringt Fine-Tuning sie zurück?","Eine Checkliste mit acht Punkten auf das nächste Open-Weight-Release anwenden, das eine Sicherheitsreduktion behauptet, bevor Sie ein Bedrohungsmodell auf die Behauptung stützen"]} />

Am **23.–24. Oktober 2026** veröffentlichte Moonshot AI **Kimi K3.1 Pro** und tat etwas, was zuvor kein Open-Weight-Frontier-Labor getan hatte: Es veröffentlichte den Preis in Benchmark-Punkten dafür, das eigene Modell absichtlich bei einer Sache schlechter zu machen.

Vor dem Open-Weight-Release identifizierte und entfernte Moonshot cyberbezogene Daten aus **zwei** Trainingsphasen — dem Mid-Training-Korpus und den Reinforcement-Learning-Umgebungen — und behielt dabei die allgemeinen Coding-Aufgaben, die das Modell braucht, um nützlich zu sein. Dann berichtete es, was das auf `xdev-bench-hard` kostete, seinem hauseigenen Satz von Experten kuratierter Aufgaben zur Schwachstellenfindung und -ausnutzung, gebaut aus echtem Quellcode:

| Modell / Checkpoint | `xdev-bench-hard` (pass@3) |
|---|---|
| K3.1-Pro-Checkpoint **ohne** die Risikominderungsmaßnahmen | **90,5 %** |
| **Kimi K3.1 Pro wie veröffentlicht** | **81,0 %** |
| DeepSeek-V4.1-Flash | 85,7 % |
| GLM-5.3 | 57,1 % |
| Kimi K3 (die vorherige Generation) | 33,3 % |

Lesen Sie diese Tabelle zweimal, denn fast jede Darstellung davon hörte nach den ersten beiden Zeilen auf. Drei Dinge darin sind eine Seite wert.

1. **Die Schwärzung brachte 9,5 Punkte. Die Generation, in der sie ausgeliefert wurde, hatte 47,7 gebracht.** K3 löste 33,3 % dieser Aufgaben; der unbeschränkte K3.1-Pro-Checkpoint löste 90,5 %. Das Entfernen der Cyber-Daten machte etwa **17 %** dieses Gewinns rückgängig und ließ die anderen 83 % bestehen. Was auch immer K3.1 Pro gut darin macht, Fehler zu finden und auszunutzen, es sind größtenteils nicht die Daten, die Moonshot herausgenommen hat.
2. **Es veränderte die Rangfolge nicht so, wie die Rahmung nahelegt.** Mit 81,0 % liegt das veröffentlichte Modell *über* GLM-5.3 und *unter* DeepSeek-V4.1-Flash mit 85,7 % — einem Open-Weight-Modell, dessen Herausgeber keine solche Filterung vorgenommen hat. Wenn Ihr Bedrohungsmodell lautet „was kann ein Angreifer herunterladen“, hat die Schwärzung Kimi genau eine Stufe nach unten bewegt, hinter ein Modell, das niemand geschwärzt hat.
3. **Die Zahl existiert wegen einer Regel, nicht wegen einer Bestenliste.** Am **16. Oktober 2026** — eine Woche vor dem Launch — setzten Chinas Handels- und Wissenschaftsministerien einen überarbeiteten Exportkontrollkatalog in Kraft, der Modelle genau dieser Größe erfasst. Die 81,0 % sind eine Offenlegung, die für ein Compliance-Gespräch entstanden ist.

Moonshots erklärtes Ziel ist die ehrliche Version davon: Es will **keine Open Weights veröffentlichen, die die absolute Grenze der Cyber-Fähigkeit verschieben**, mit der Begründung, dass die schrittweise Verbreitung von Fähigkeiten über offene Systeme Software insgesamt sicherer macht. Das ist eine vertretbare Position. Es ist auch ein *relatives* Ziel, und die Tabelle ist, wie ein relatives Ziel aussieht, wenn jemand die Messung veröffentlicht.

<VerifyNote lastVerified="2026-10-26" source="Primary: Moonshot's Kimi K3.1 Pro tech blog (kimi.ai/blog/kimi-k3-1-pro) for the two-stage data removal, the xdev-bench-hard pass@3 figures for K3.1 Pro (81.0%), the unrestricted checkpoint (90.5%), DeepSeek-V4.1-Flash (85.7%), GLM-5.3 (57.1%) and K3 (33.3%), the 'absolute frontier of cyber capability' rationale, the 1M context window, the Kimi Hallu Bench Hard figures (8.3% vs 23.4%) and the 4 November 2026 open-weight date. Architecture (2.8T total / 104B active, 16 of 896 experts) and API pricing are from secondary technical coverage, not the blog section fetched here — treat them as reported. China's Announcement No. 48: effective 16 October 2026, 23 AI technology areas, the 10^26 FLOPs / 2T-parameter / global-top-ten thresholds, the autonomous-malware total ban, the vulnerability-tooling restriction, and the API / public-domain / open-source exemptions are from reporting on the draft catalogue (the-decoder, TechTimes, Sheppard Mullin); the comment period closing 15 November 2026 and the naming of Kimi K3 (2.8T) and Qwen3.8-Max (2.4T) as above-threshold examples are from that reporting, not from a translation of the text itself. The 'GPT-5.6 Sol at 100%' comparison circulating in coverage is from implicator.ai and did not appear in the blog section retrieved here — do not cite it as Moonshot's figure. Everything about whether fine-tuning restores the removed capability is unresolved: no source consulted makes a claim either way. Benchmark positions and weight availability will move; the arithmetic in the first table is the durable part." />

## Warum gezielte Entfernung schwach ist, in den Worten des Labors selbst

Der nützlichste Satz, den Moonshot veröffentlicht hat, handelt nicht von den Daten. Es ist die Beobachtung, dass sich **stärkere allgemeine Coding- und Langzeit-Debugging-Fähigkeiten auch nach gezielter Datenentfernung auf Cyber-Aufgaben übertragen**.

Das ist eine Aussage darüber, wo die Fähigkeit sitzt, und sie erklärt die 9,5 Punkte. Einen ausnutzbaren Fehler in unbekanntem Quellcode zu finden und einen funktionierenden Exploit zu verketten ist mechanisch dieselbe Schleife wie Debugging: Code lesen, den man nicht geschrieben hat, ein Modell seiner Invarianten bilden, eine Verletzung vermuten, sie testen, über viele Schritte Zustand halten, es erneut versuchen. Ein Labor kann einen Korpus von Exploit-Writeups löschen. Es kann „ist gut darin, über lange Horizonte über unbekannten Code nachzudenken“ nicht löschen, ohne das Produkt zu löschen.

Deshalb trifft die unabhängige Kritik. Die schärfste Version, vom Analyseportal Extrapolator, lautet, dass die Cyber-Minderung die **unsicherste Behauptung** des Releases ist, weil die Grenze dessen, was als „cyberbezogen“ gilt, *per Definition unscharf* ist — die Minderung wirkt als **Filter-Heuristik, nicht als prinzipielle Fähigkeitsgrenze**.

<Callout type="key" items={["Datenfilterung entfernt Beispiele. Sie entfernt nicht die allgemeine Fähigkeit, die diese Beispiele zufällig trainierten. Erwarten Sie, dass Schwärzung am wirksamsten gegen Fähigkeiten ist, die spezifisches Wissen brauchen (ein Protokoll, eine Toolchain, eine benannte Technik), und am schwächsten gegen Fähigkeiten, die eine allgemeine, auf ein Ziel gerichtete Fertigkeit sind. Offensive Sicherheit ist überwiegend die zweite Sorte."]} />

## Die Verifikationsasymmetrie

`xdev-bench-hard` ist Moonshots eigener Benchmark, und **er wurde nicht veröffentlicht**. Ebenso wenig die Methodik vollständig oder irgendein Beleg dafür, ob sich die entfernte Fähigkeit wiederherstellen lässt.

Das ergibt eine ungewöhnliche Situation. Die Behauptung „wir haben die Cyber-Fähigkeit um 9,5 Punkte reduziert“ ist:

- **grundsätzlich falsifizierbar** — sobald die Gewichte öffentlich sind, kann jeder die Exploit-Erfolgsquote an *seinem* Benchmark messen;
- **wie formuliert nicht falsifizierbar** — niemand außerhalb des Labors kann `xdev-bench-hard` ausführen, daher kann der konkrete Vergleich zwischen dem veröffentlichten Modell und dem zurückgehaltenen Checkpoint von niemandem je geprüft werden, weil der unbeschränkte Checkpoint nicht ausgeliefert wird.

Beide Hälften sind wichtig. Die zweite bedeutet, dass die Schlagzeilenzahl im strengen Sinn eine Herstellerbehauptung ist — die einzige der fünf Zeilen in dieser Tabelle, die sonst niemand reproduzieren kann, ist die, auf der die ganze Geschichte ruht. Die erste bedeutet, dass die *Richtung* der Behauptung ab dem 4. November prüfbar ist und von Leuten mit eigenen Harnesses geprüft werden wird.

Wenn Sie versucht sind, ein veröffentlichtes Sicherheits-Delta als Messung zu behandeln, wenden Sie dieselbe Disziplin an wie bei jedem Hersteller-Benchmark — [Wie man einen KI-Benchmark liest, ohne sich täuschen zu lassen](/docs/models/reading-ai-benchmarks) ist die allgemeine Version davon, und die spezifische Falle hier ist der zurückgehaltene Vergleichsarm.

## Die Regel hinter der Zahl

Chinas überarbeiteter Exportkatalog trat am **16. Oktober 2026** in Kraft (verbreitet als **Announcement No. 48**), vorgeschlagen von den Handels- und Wissenschaftsministerien, und umfasst **23 Technologiebereiche der künstlichen Intelligenz** über große Modelle, Agenten, Rechencluster und Datenverarbeitung hinweg. Berichte darüber beschreiben eine Kommentierungsfrist bis zum **15. November 2026**.

Was die Kontrolle auslöst und wie sie behandelt wird:

| Element | Detail |
|---|---|
| **Schwellen** (eine genügt) | **10^26 FLOPs** Trainingsrechenleistung · **≥ 2 Billionen** Parameter · **globale Top Ten** nach öffentlichen Evaluierungen, Aufgabenleistung, Sicherheit oder Nutzung |
| **Was an der Schwelle kontrolliert wird** | Kern-Modelltechnologie: **Gewichte, Checkpoints, Quellcode, Architektur, Trainings- und Inferenzmethoden** |
| **Totalverbot** | KI-Werkzeuge, die **autonom Malware schreiben oder verändern** können, um kritische Infrastruktur, militärische Ziele oder Regierungsstellen anzugreifen |
| **Eingeschränkt, nicht verboten** | Werkzeuge zum **Finden von Software-Schwachstellen** — neue Exportbeschränkungen, kein ausdrückliches Verbot |
| **Ebenfalls eingeschränkt** | Modelle, die auf Chinas „wichtigen Daten“ trainiert wurden und darauf bereitgestellt werden, mit engen Ausnahmen |
| **Ausgenommen** | **API-Aufrufe**, Apps, Websites und SaaS · leichtgewichtige On-Device-Versionen · **bereits veröffentlichte Open-Source-Releases** · akademische Forschung und Papers |
| **Schnellspur** | Open-Source-Veröffentlichung erhält **automatische Lizenzierung bei Anmeldung** |

<Callout type="note" items={["Die Quellen widersprechen sich zum Rechtsstatus des Katalogs, und diese Seite löst das nicht auf. TechTimes beschreibt Announcement No. 48 als am 16. Oktober 2026 in Kraft getreten, mit Kommentierungsfrist bis 15. November, und analysiert Pflichten als bereits geltend für Transaktionen nach diesem Datum. The Decoder beschreibt dieselbe Veröffentlichung vom 16. Oktober als Entwurf einer Überarbeitung, die China zu machen „plant“ und die zur Kommentierung offen ist. Beide Lesarten sind mit einer veröffentlichten Maßnahme vereinbar, die gleichzeitig wirksam und überarbeitungsoffen ist, was in diesem Verfahren üblich ist — aber wenn die Unterscheidung für eine Entscheidung zählt, die Sie treffen, lesen Sie die Maßnahme selbst oder fragen Sie die Rechtsberatung, statt hier einer der Rahmungen zu trauen."]} />

Legen Sie nun Kimi daneben. Sekundäre technische Berichte beziffern K3.1 Pro auf **2,8 Billionen Parameter insgesamt mit 104 Milliarden aktiven** (16 von 896 Experten pro Token) und ein Kontextfenster von **1.048.576 Token**, aufgebaut auf K3. Berichte über den Katalog nennen **Kimi K3 (2,8T)** und **Qwen3.8-Max (2,4T)** als Beispiele, die die Parameterschwelle klar überschreiten.

Ein 2,8T-Modell liegt also allein nach Parameterzahl über der Linie, bevor irgendjemand über Ranglisten streitet — und die strengste Klausel im Katalog ist ein *Total*-Exportverbot, das an autonome Malware-Erstellung gekoppelt ist. Vor diesem Hintergrund ist die Veröffentlichung einer gemessenen Reduktion der Exploit-Erfolgsquote bei erhaltener allgemeiner Coding-Fähigkeit genau das Artefakt, das eine Schnellspur-Anmeldung will.

<Callout type="note" items={["Diese Seite behauptet nicht, Moonshot habe gesagt, die Schwärzung sei wegen Announcement No. 48 erfolgt; der Blog rahmt sie als Sicherheitsentscheidung über die Open-Weight-Grenze, und der Zeitpunkt liegt eine Woche auseinander. Beides kann stimmen. Unstrittig ist, dass ein Modell dieser Größe im Geltungsbereich des Katalogs liegt, dass die strengste Klausel autonome Malware betrifft und dass Schwachstellen-Tooling als eingeschränkt und nicht als verboten genannt wird."]} />

## Die Ausnahmen erzeugen eine Uhr

Zwei Ausnahmen weisen zusammen gelesen in eine Richtung:

- **Bereits öffentliche Gewichte sind ausgenommen.** Sobald etwas gemeinfrei ist, liegt es, wie es eine Rechtsanalyse formulierte, außerhalb der Reichweite einer nationalen Exportregel.
- **Open-Source-Veröffentlichung erhält automatische Lizenzierung bei Anmeldung.**

Die Folge für jeden, der ein Release plant, ist unmittelbar: **Der günstigste Zeitpunkt, Open Weights zu veröffentlichen, ist bevor sich die Regel verhärtet, nicht danach.** Die Gewichte von Kimi K3.1 Pro waren bis zum **4. November 2026** fällig — elf Tage bevor die Kommentierungsfrist zum Katalog endet.

Dieselbe Asymmetrie läuft für alle, die diese Modelle *nutzen*, in die andere Richtung. Gewichte, die Sie schon haben, werden nicht rückwirkend kontrolliert, und **API-Zugriff ist vollständig ausgenommen**. Berichte über bestehende Deployments sind konsistent: Organisationen, die erfasste chinesische Modelle bereits lizenziert oder eingesetzt hatten, sind weitgehend nicht betroffen, während **neue** Lizenzvereinbarungen, Server-Deployments im Ausland oder Kontrollwechsel nach dem 16. Oktober eine Registrierung oder Lizenzierung auslösen können.

<Callout type="warning" items={["Einmal heruntergeladene Gewichte lassen sich nicht zurückrufen. Das ist das gesamte Design eines Open-Weight-Releases, und es ist auch der Grund, warum eine Schwärzung eine einmalige Entscheidung ist: Es gibt keinen Patch-Kanal, keinen Widerruf und keine Telemetrie. Welche Fähigkeit am 4. November ausgeliefert wird, ist die Fähigkeit, die für immer existiert, in der Form, in der der erste Fine-Tuner sie hinterlässt."]} />

## Die Frage, die niemand beantwortet hat

Nichts von dem, was zu K3.1 Pro veröffentlicht wurde, sagt, ob **Fine-Tuning die entfernte Fähigkeit wiederherstellt**. Diese Auslassung ist das Wichtigste am Release, aus einem einfachen Grund: Eine vor dem Release angewendete Filter-Heuristik hat keine Verteidigung dagegen, dass ein filterförmiges Loch nach dem Release wieder aufgefüllt wird.

Es ist auch die Frage, die das Open-Weight-Ökosystem bereits zu beantworten weiß und schon früher ungünstig beantwortet hat. Die Abliteration-Pipeline — eine kleine, billige nachträgliche Modifikation, die Ablehnungsverhalten aus einem offenen Modell entfernt — ist eine funktionierende, weit verbreitete Demonstration, dass *Nach-Release*-Änderungen *Vor-Release*-Sicherheitsarbeit rückgängig machen können. Siehe [Backdoored Open Weights](/docs/security/backdoored-open-weights), wie diese Lieferkette funktioniert und was sie für alles bedeutet, was Sie von einem Model Hub ziehen.

Die Unterscheidung, an der man festhalten sollte: Eine **Ablehnung** zu entfernen und eine **Fähigkeit** wiederherzustellen sind nicht dasselbe technische Problem. Abliteration wirkt auf ein Verhalten, das das Modell noch hat; Fähigkeitswiederherstellung verlangt, dass das Modell etwas neu lernt. Ob 9,5 Punkte Exploit-Erfolg mit einem bescheidenen Fine-Tune billig neu zu lernen sind, ist eine empirische Frage, auf die es zum Zeitpunkt des Schreibens keine veröffentlichte Antwort gibt.

<Callout type="key" items={["Eine Schwärzung ist nur dann dauerhaft, wenn ihre Umkehrung teuer ist. Eine veröffentlichte Schwärzung ohne veröffentlichte Umkehrkosten ist eine unfertige Behauptung. Wenn Sie eine bewerten, behandeln Sie „kann ein billiges LoRA das zurückbringen?“ als die tragende Frage — und beachten Sie, dass das Labor die Partei ist, die sie am besten beantworten kann, und die mit dem geringsten Anreiz dazu."]} />

## Was das tatsächlich verändert, nach Rolle

**Wenn Sie defensive Sicherheitsforschung betreiben.** Das ist die Gruppe mit einer echten Beschwerde, und die Reaktion der Community auf r/LocalLLaMA war überwiegend diese: Ein geschwärztes Open-Weight-Modell ist ein schlechteres lokales Werkzeug für Schwachstellenforschung, und nichts an den Ausnahmen hilft Ihnen. Aber sehen Sie sich an, was noch verfügbar ist, bevor Sie schließen, die Fähigkeit verloren zu haben: **API-Zugriff ist vom Katalog ausgenommen**, ungeschwärzte Open-Weight-Alternativen existieren bei vergleichbaren oder höheren Werten (DeepSeek-V4.1-Flash mit 85,7 % ist das Beispiel in Moonshots eigener Tabelle), und bei geschlossenen Modellen gibt es jetzt sanktionierte Wege — Anthropic betreibt ein erweitertes Cyber Verification Program, das qualifizierten Sicherheitsfachleuten fortgeschrittene Cyber-Fähigkeiten und reduzierte Blocking-Klassifikatoren zugänglich macht. Verloren haben Sie die *Standard*-Lokaloption eines Anbieters, nicht die Fähigkeitsklasse.

**Wenn Sie chinesische Open Weights einsetzen.** Ihr Risiko betrifft Transaktionen, nicht die Nutzung. Bereits vorhandene Gewichte sind als gemeinfreies Material ausgenommen; API- und SaaS-Nutzung ist ausgenommen; neue Lizenzgeschäfte, neue Deployments im Ausland und Kontrollwechsel nach dem 16. Oktober sind der Ort, an dem Pflichten ansetzen. Wenn Sie etwas der zweiten Art in der Pipeline haben, ist das eine Frage für die Rechtsberatung, nicht für eine Doku-Seite — und beachten Sie, dass es eine symmetrische Reihe von US-seitigen Beschränkungen für dieselben Modelle gibt, sodass „welche Regeln der einen oder der anderen Seite gelten“ selten eine einzige Frage ist.

**Wenn Sie Bedrohungsmodelle schreiben.** Aktualisieren Sie eine Zahl und lassen Sie die Struktur in Ruhe. Die Struktur war schon „ein leistungsfähiges Open-Weight-Modell ist herunterladbar, und daher ist die Fähigkeit in der Welt“; das Update ist, dass der am besten dokumentierte Open-Weight-Exploit-Wert gerade von 90,5 % auf 81,0 % gerutscht ist, während ein Konkurrent bei 85,7 % steht. Wenn sich die Schlussfolgerung Ihres Bedrohungsmodells ändert, sobald sich der Exploit-Erfolg des führenden offenen Modells um 9,5 Punkte bewegt, war es von vornherein zu fein abgestimmt.

## Vitalik Buterins Rahmung, und warum sie die nützliche ist

Das Release erhielt eine ungewöhnlich direkte Unterstützung vom Mitgründer von Ethereum, und sein Argument sollte man von der Krypto-Presse-Rahmung trennen.

Buterin unterstützte, fortgeschrittene offensive Cyber-Fähigkeiten aus dem Training herauszuhalten, mit der Begründung, dass Verteidiger mehr Zeit brauchen, um Software gegen zunehmend fähige Angriffe zu härten, und formulierte den allgemeinen Grundsatz, dass **die Diskriminierung von Anwendungsfällen sehr viel weniger schlimm ist als die Diskriminierung von Nutzern**. Er verband das mit einer Warnung: Wenn die erste Welle des KI-Cyberrisikos falsch gehandhabt wird, sei die wahrscheinliche Reaktion, dass Modelle streng abgeriegelt werden, mit Zugang hinter KYC-Prüfung, allgegenwärtiger Überwachung und Stratifizierung nach Identitätsnachweisen und Nationalität. Auf die Frage, ob andere Labore die Fähigkeit trotzdem bauen werden, antwortete er, dass sie das natürlich tun werden.

Dieses letzte Zugeständnis ist die ehrliche Form der ganzen Debatte. Das Argument für Capability Redaction ist nicht, dass sie etwas verhindert; Moonshots eigene Tabelle zeigt, dass sie es nicht tut, und die Person, die sie unterstützt, sagt klar, dass jemand anderes sie bauen wird. Das Argument ist, dass **sie Zeit kauft und dass eine Anwendungsfall-Beschränkung ein günstigerer Preis ist als eine Nutzer-Beschränkung**. Ob Sie das überzeugend finden, ist eine Ermessensfrage. Was Sie nicht tun sollten, ist, 81,0 % als Sicherheitsgarantie zu lesen — auch und gerade, wenn Sie die Person sind, die die Richtlinie schreibt, die sie zitiert.

## Das nächste lesen

Es wird mehr davon geben. Hier ist die Checkliste, die Sie durchgehen sollten, bevor eine veröffentlichte Sicherheitsreduktion irgendetwas ändert, was Sie tun.

<Steps items={[
  {title: "Die Baseline finden, nicht das Delta", body: "Eine Reduktion ist ohne die Zahl, von der aus reduziert wurde, und die Zahl der vorherigen Generation bedeutungslos. Moonshot hat alle drei veröffentlicht, weshalb die Rechnung 9,5 gegen 47,7 überhaupt möglich ist. Wenn ein Release Ihnen nur „um X % reduziert“ gibt, können Sie eine echte Minderung nicht von einem Rundungsfehler bei einem Fähigkeitssprung unterscheiden."},
  {title: "Prüfen, ob der Benchmark veröffentlicht ist", body: "Ein interner Benchmark macht den Vergleich grundsätzlich unreproduzierbar, weil der zurückgehaltene Checkpoint nie ausgeliefert wird. Vermerken Sie es als Herstellerbehauptung und suchen Sie einen unabhängigen Harness, der dieselbe Fähigkeitsklasse misst."},
  {title: "Das geschwärzte Modell gegen ungeschwärzte Peers einordnen", body: "Die Frage eines Bedrohungsmodells lautet „was ist herunterladbar“, nicht „was hat dieser Anbieter zurückgehalten“. Wenn ein Konkurrent derselben Klasse ohne Filterung höher punktet, hat die Schwärzung die Haltung eines Anbieters verändert und nicht die Frontier."},
  {title: "Fragen, wo die Fähigkeit sitzt", body: "Wenn das Labor selbst sagt, dass sich allgemeine Fähigkeit auf die eingeschränkte Aufgabe überträgt — wie Moonshot es tut —, ist die Schwärzung eine Heuristik. Fähigkeiten, die spezifisches Wissen brauchen, lassen sich schwärzen; Fähigkeiten, die eine allgemeine, auf ein Ziel gerichtete Fertigkeit sind, nicht."},
  {title: "Nach einer genannten Umkehrkosten suchen", body: "Hat jemand gemessen, was ein Fine-Tune kostet, um sie wiederherzustellen? Wenn nicht, ist die Dauerhaftigkeit der Minderung unbekannt, und die ehrliche Zusammenfassung lautet „bei Release reduziert, danach unbekannt“."},
  {title: "Das regulatorische Artefakt vom Sicherheitsargument trennen", body: "Eine Zahl, die im selben Monat veröffentlicht wird wie eine Regel, die das Modell erfasst, erfüllt zwei Aufgaben. Beide können aufrichtig sein. Lesen Sie die Schwellen selbst — Parameterzahl, Trainings-FLOPs, Rang — und prüfen Sie, welche das Modell überschreitet."},
  {title: "Die Lizenz und die Model Card lesen, wenn die Gewichte landen, nicht den Blog", body: "Blogbeiträge vor dem Release beschreiben Absichten. Die Lizenz beschreibt, was Sie tun dürfen, und die Karte, was ausgeliefert wurde. Bei K3.1 Pro waren Lizenzbedingungen, Hardwareanforderungen und Quantisierungsformate bei der Ankündigung alle noch unveröffentlicht."},
  {title: "Die Behauptung mit ihrem Datum festhalten", body: "Veröffentlichte Sicherheits-Deltas altern schlecht: Ein neuer Checkpoint, ein Community-Fine-Tune oder eine unabhängige Eval kann eines binnen Wochen ungültig machen. Was auch immer Sie aufschreiben, schreiben Sie auf, wann es galt."},
]} />

<PromptCard title="Eine Schwärzungsbehauptung in einer Form festhalten, die den Kontakt mit dem nächsten Release überlebt">
{`Summarise this open-weight release as a capability-redaction record. Use only
what the sources support and mark anything missing as UNPUBLISHED — do not
estimate it.

Fields:
  model, publisher, announce_date, weights_date, params_total, params_active
  redaction: what data, which training stages, stated rationale
  benchmark: name, is_public (yes/no), metric (e.g. pass@3)
  score_redacted, score_unredacted_checkpoint, score_previous_generation
  peer_scores: same benchmark, same tier, no redaction
  derived: points_removed_by_redaction
  derived: points_added_by_the_generation (previous_gen -> unredacted)
  derived: share_of_gain_undone = points_removed / points_added
  reversal_cost: any published evidence that fine-tuning restores it
  licence, model_card_url, independent_eval_urls
  verified_on: <date>

Then answer one question in two sentences: does the redaction change what an
adversary can download today, or only what this publisher ships?`}
</PromptCard>

<PromptCard title="Prüfen, was ein Model Hub Ihnen tatsächlich liefert, bevor die Gewichte zählen">
{`# Resolve the repo and read its metadata — no download, public API.
REPO="moonshotai/Kimi-K3.1-Pro"   # confirm the real id from the announcement

curl -sf "https://huggingface.co/api/models/$REPO" \\
  | python3 -m json.tool \\
  || echo "404 — that id does not exist; find the canonical one first"

# The file list arrives in the same response, under "siblings".
# Three files answer 'what may I do, and what actually shipped':
#   LICENSE      — terms were unpublished at announcement
#   README.md    — the model card
#   config.json  — architecture as shipped, not as blogged
curl -sf "https://huggingface.co/api/models/$REPO" \\
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('license')); [print(s['rfilename']) for s in d.get('siblings',[])]"

# Fetch one small file without cloning the weights:
curl -sfL "https://huggingface.co/$REPO/raw/main/config.json"

# Then check the thing this page is actually about: derivatives.
# A redacted base with a popular 'uncensored' or 'restored' fine-tune
# listed against it is the signal that the redaction did not hold.
curl -sf "https://huggingface.co/api/models?search=k3.1&sort=downloads&limit=30" \\
  | python3 -c "import json,sys; [print(m['id']) for m in json.load(sys.stdin)]"`}
</PromptCard>

<Callout type="warning" items={["Repository-IDs auf Model Hubs lassen sich nicht aus einem Produktnamen vorhersagen, und diese hier ließ sich zum Zeitpunkt des Schreibens nicht auflösen. Nehmen Sie die kanonische ID aus der eigenen Ankündigung des Herausgebers, bevor Sie dagegen skripten, und werten Sie ein 404 nicht als Beleg dafür, dass die Gewichte nicht veröffentlicht wurden."]} />

## Eine weitere Zahl aus demselben Release, zur Kalibrierung

Die Cyber-Zahl bekam die Berichterstattung. Die, die mehr Leser betreffen wird, steht auf der anderen Seite der Bilanz: Bei Kimi Hallu Bench Hard — wieder Moonshots eigener interner Stresstest, mit aktivierten Tools — **sank die Halluzinationsrate auf Behauptungsebene von 23,4 % bei K3 auf 8,3 % bei K3.1 Pro**, eine relative Reduktion um 65 %, wobei Moonshot anmerkt, dass Stresstest-Raten die typische Nutzung nicht widerspiegeln.

Beide Zahlen stammen vom selben Labor, am selben Tag, aus zwei unveröffentlichten internen Benchmarks. Die eine ist eine Reduktion, die das Labor gewählt hat und für die es Anerkennung will; die andere ist eine Verbesserung, für die das Labor Anerkennung will. Messen Sie beide am selben Maßstab: Die Halluzinationszahl ist für Sie genauso reproduzierbar wie die Exploit-Zahl, das heißt, überhaupt nicht, bis jemand einen offenen Harness auf die veröffentlichten Gewichte anwendet.

<Callout type="takeaways" items={["Das Entfernen von Cyber-Daten aus zwei Trainingsphasen kostete 9,5 Punkte Exploit-Erfolg (90,5 % auf 81,0 %) — gegenüber einem Gewinn von 47,7 Punkten, den dieselbe Generation gegenüber K3 mit 33,3 % geliefert hatte. Etwa vier Fünftel der Fähigkeit überlebten die Schwärzung.", "Die eigene Erklärung des Labors ist der Grund: Allgemeine Coding- und Langzeit-Debugging-Fähigkeit überträgt sich auf Exploitation. Man kann das nicht löschen, ohne das Produkt zu löschen, daher ist gezielte Filterung eine Heuristik und keine Fähigkeitsgrenze.", "Mit 81,0 % liegt das veröffentlichte Modell weiterhin über GLM-5.3 (57,1 %) und unter DeepSeek-V4.1-Flash (85,7 %), einem Open-Weight-Modell ohne solche Filterung. Die Schwärzung verschob die Haltung eines Anbieters, nicht die herunterladbare Frontier.", "xdev-bench-hard ist intern und unveröffentlicht, und der unbeschränkte Checkpoint wird nie ausgeliefert — der Schlagzeilenvergleich ist also die eine Zeile in der Tabelle, die außerhalb von Moonshot nie jemand reproduzieren kann.", "Chinas Announcement No. 48 (in Kraft seit 16. Oktober 2026, Kommentierung bis 15. November) kontrolliert Gewichte, Checkpoints, Quellcode und Trainingsmethoden an einer von drei Schwellen: 10^26 Trainings-FLOPs, 2T Parameter oder ein globaler Top-Ten-Rang. Eine Parameterzahl allein genügt, und Kimi K3 mit 2,8T wird als Beispiel genannt.", "Der Katalog verbietet Tooling für autonome Malware ausdrücklich, schränkt Werkzeuge zum Finden von Schwachstellen aber nur ein — und nimmt API-Zugriff, SaaS, On-Device-Builds und alles bereits Öffentliche aus, mit automatischer Lizenzierung bei Anmeldung für Open-Source-Releases.", "Diese Ausnahmen erzeugen in der einen Richtung ein Veröffentlichungsrennen und in der anderen ein transaktionsförmiges Risiko: Bereits gehaltene Gewichte und API-Aufrufe sind ausgenommen, neue Lizenzen und Deployments nach dem 16. Oktober nicht.", "Niemand hat veröffentlicht, ob Fine-Tuning die entfernte Fähigkeit wiederherstellt. Bis das jemand tut, lautet die ehrliche Zusammenfassung jeder Schwärzung „bei Release reduziert, danach unbekannt“ — und die Abliteration-Lieferkette ist der bestehende Beweis dafür, dass Nach-Release-Änderungen Vor-Release-Sicherheitsarbeit schlagen.", "Buterins Verteidigung des Schnitts räumt den entscheidenden Punkt ein: Andere Labore werden die Fähigkeit trotzdem bauen. Die Behauptung ist, dass Schwärzung Verteidigern Zeit kauft und dass die Beschränkung von Anwendungsfällen besser ist als die von Nutzern — nicht, dass sie irgendetwas verhindert."]} />

<Flashcards title="Zehn Begriffe zum Lesen eines geschwärzten Releases" cards={[
  {front: "Capability Redaction", back: "Trainingsdaten für eine Fähigkeitsklasse vor der Veröffentlichung eines Modells absichtlich entfernen, sodass die veröffentlichten Gewichte bei dieser Fähigkeit niedriger punkten. Zu unterscheiden von einer Ablehnung, die die Fähigkeit intakt lässt und es ablehnt, sie zu nutzen."},
  {front: "xdev-bench-hard", back: "Moonshots interner, unveröffentlichter Benchmark mit von Experten kuratierten Aufgaben zur Schwachstellenfindung und -ausnutzung, gebaut aus echtem Quellcode, bewertet mit pass@3. Quelle sowohl der 90,5 % als auch der 81,0 % und außerhalb des Labors von niemandem reproduzierbar."},
  {front: "pass@3", back: "Eine Aufgabe gilt als gelöst, wenn einer von drei Versuchen gelingt. Bläht absolute Zahlen gegenüber pass@1 auf und ist die Metrik, die Moonshot berichtet — lesen Sie 81,0 % also als „gelingt innerhalb von drei Versuchen“, nicht als „gelingt“."},
  {front: "Mid-Training", back: "Die Phase zwischen Pretraining und Post-Training, in der ein Modell mit gezielten, hochwertigeren Korpora gefüttert wird, um bestimmte Kompetenzen aufzubauen. Eine der zwei Phasen, die Moonshot gefiltert hat, die andere sind die Reinforcement-Learning-Umgebungen."},
  {front: "Filter-Heuristik vs. Fähigkeitsgrenze", back: "Eine Heuristik entfernt Beispiele, die der eingeschränkten Klasse ähneln; eine Grenze würde garantieren, dass die Fähigkeit fehlt. Weil „cyberbezogen“ per Definition unscharf ist, kann Datenfilterung immer nur das Erste sein."},
  {front: "Announcement No. 48", back: "Chinas überarbeiteter Exportkontrollkatalog, in Kraft seit 16. Oktober 2026, umfasst 23 KI-Technologiebereiche. Kontrolliert Modellgewichte, Checkpoints, Quellcode und Trainingsmethoden bei 10^26 FLOPs, 2T Parametern oder einem globalen Top-Ten-Rang."},
  {front: "Gemeinfrei-Ausnahme", back: "Die Ausnahme, die bereits veröffentlichte Open Weights außerhalb der Exportregel stellt. Sie macht ein Release im rechtlichen wie im technischen Sinn unumkehrbar und belohnt die Veröffentlichung, bevor sich eine Regel verhärtet."},
  {front: "Verifikationsasymmetrie", back: "Wenn die Richtung einer Sicherheitsbehauptung prüfbar ist, sobald Gewichte ausgeliefert werden, ihre konkrete Größenordnung aber nie, weil der Vergleichsarm — hier der unbeschränkte Checkpoint — zurückgehalten wird."},
  {front: "Umkehrkosten", back: "Was es bräuchte, um eine geschwärzte Fähigkeit durch Fine-Tuning wiederherzustellen. Für K3.1 Pro unveröffentlicht, und die Zahl, die entscheidet, ob eine Schwärzung eine Minderung oder eine Momentaufnahme am Release-Tag ist."},
  {front: "Abliteration", back: "Eine billige nachträgliche Modifikation an Open Weights, die Ablehnungsverhalten entfernt. Der bestehende Beweis, dass Nach-Release-Änderungen Vor-Release-Sicherheitsarbeit rückgängig machen können — wobei die Wiederherstellung einer Fähigkeit ein schwierigeres Problem ist als das Entfernen einer Ablehnung."},
]} />

<Quiz title="Testen Sie sich selbst" questions={[
  {
    q: "Moonshot berichtete 90,5 % für einen unbeschränkten Checkpoint, 81,0 % für das veröffentlichte K3.1 Pro und 33,3 % für die vorherige Generation K3. Was ist die vertretbarste Lesart?",
    options: [
      "Die Schwärzung entfernte den Großteil der Exploit-Fähigkeit des Modells",
      "Die Schwärzung machte etwa ein Sechstel eines Generationsgewinns von 47,7 Punkten rückgängig und ließ den großen Großteil davon bestehen",
      "K3.1 Pro ist bei Exploitation weniger fähig, als K3 es war",
      "Die Zahlen sind inkonsistent, und mindestens eine muss falsch sein"
    ],
    answer: 1,
    explain: "33,3 % auf 90,5 % ist ein Gewinn von 57,2 Punkten für den unbeschränkten Checkpoint; das veröffentlichte Modell mit 81,0 % behält 47,7 dieser Punkte. Die Schwärzung kostete 9,5 — etwa 17 % des Gewinns. Das veröffentlichte Modell liegt noch immer beim etwa 2,4-Fachen von K3s Wert."
  },
  {
    q: "Welche einzelne Tatsache erklärt am besten, warum das Entfernen cyberspezifischer Trainingsdaten den Wert nur um 9,5 Punkte bewegte?",
    options: [
      "Der entfernte Korpus war klein im Verhältnis zur Pretraining-Mischung",
      "pass@3-Bewertung verdeckt Fähigkeitsverluste, die pass@1 zeigen würde",
      "Allgemeine Coding- und Langzeit-Debugging-Fähigkeit überträgt sich auf Exploitation, die Fähigkeit war also nicht in den entfernten Daten lokalisiert",
      "Die Reinforcement-Learning-Phase wurde tatsächlich nicht gefiltert"
    ],
    answer: 2,
    explain: "Das ist Moonshots eigene erklärte Begründung, und es ist der Mechanismus, der gezielte Entfernung allgemein schwach macht: Exploitation ist die Debugging-Schleife, auf ein anderes Ziel gerichtet, und ein Labor kann das nicht löschen, ohne das Produkt zu löschen."
  },
  {
    q: "Welches davon genügt unter Announcement No. 48 allein, um die Gewichte eines Modells in den Geltungsbereich zu bringen?",
    options: [
      "2 Billionen oder mehr Parameter zu haben",
      "Außerhalb Chinas trainiert zu sein",
      "Über eine öffentliche API angeboten zu werden",
      "Eine veröffentlichte Lizenz zu haben, die kommerzielle Nutzung erlaubt"
    ],
    answer: 0,
    explain: "Die Schwellen sind disjunktiv: 10^26 Trainings-FLOPs, 2T+ Parameter oder ein globaler Top-Ten-Rang nach Evaluierungen, Aufgabenleistung, Sicherheit oder Nutzung. Berichte nennen Kimi K3 mit 2,8T und Qwen3.8-Max mit 2,4T als Beispiele über der Schwelle. API- und SaaS-Zugriff ist ausgenommen, kein Auslöser."
  },
  {
    q: "Sie aktualisieren nach diesem Release ein Bedrohungsmodell. Welche Schlussfolgerung folgt aus der veröffentlichten Tabelle?",
    options: [
      "Die herunterladbare Frontier für Exploit-Fähigkeit sank um 9,5 Punkte",
      "Open-Weight-Modelle können Schwachstellen nicht mehr in nennenswerter Rate ausnutzen",
      "Die herunterladbare Frontier ist unverändert, weil ein ungeschwärzter Open-Weight-Peer höher punktet als das geschwärzte Modell",
      "Es lässt sich nichts schließen, weil der Benchmark intern ist"
    ],
    answer: 2,
    explain: "DeepSeek-V4.1-Flash erreicht 85,7 % am selben Benchmark ohne vergleichbare Filterung. Moonshots Schwärzung änderte, was Moonshot ausliefert; sie senkte nicht die Obergrenze dessen, was ein Angreifer herunterladen kann. Der interne Benchmark schwächt die Größenaussage, aber diese Zeilen sind alle am selben Harness gemessen, die Rangfolge bleibt also aussagekräftig."
  },
  {
    q: "Was ist der stärkste Grund, die Reduktion um 9,5 Punkte als „bei Release reduziert, danach unbekannt“ zu beschreiben?",
    options: [
      "Open Weights werden häufig neu quantisiert, was Benchmark-Werte verschlechtert",
      "Keine Quelle hat veröffentlicht, was es kostet, die entfernte Fähigkeit durch Fine-Tuning wiederherzustellen",
      "Die Gewichte waren bei der Ankündigung nicht auf einem Model Hub verfügbar",
      "Benchmarks driften, wenn Harnesses aktualisiert werden"
    ],
    answer: 1,
    explain: "Eine Filter-Heuristik vor dem Release hat keine Verteidigung gegen einen Fine-Tune nach dem Release, und die Umkehrkosten sind schlicht unveröffentlicht. Abliteration zeigt bereits, dass billige nachträgliche Änderungen Vor-Release-Sicherheitsarbeit rückgängig machen können, auch wenn die Wiederherstellung einer Fähigkeit schwieriger ist als das Entfernen einer Ablehnung."
  },
  {
    q: "Ein defensiver Sicherheitsforscher sagt, die Schwärzung habe ihm die Möglichkeit genommen, Schwachstellenforschung mit leistungsfähigen Modellen zu betreiben. Was ist die zutreffende Korrektur?",
    options: [
      "Nichts hat sich geändert, weil die Schwärzung überhaupt keine Wirkung hatte",
      "Er hat die Standard-Lokaloption eines Anbieters verloren; API-Zugriff ist vom Katalog ausgenommen, ungeschwärzte Open-Weight-Peers punkten höher, und es gibt Anbieterprogramme für verifizierte Sicherheitsfachleute",
      "Der Exportkatalog verbietet Werkzeuge zum Finden von Schwachstellen ausdrücklich, also hat er recht",
      "Er sollte warten, bis der unbeschränkte Checkpoint veröffentlicht wird"
    ],
    answer: 1,
    explain: "Der Katalog verbietet Tooling für autonome Malware ausdrücklich, schränkt aber Werkzeuge zum Finden von Schwachstellen nur ein und nimmt API-, SaaS- und On-Device-Zugriff aus. DeepSeek-V4.1-Flash ist ein ungeschwärzter Open-Weight-Peer bei 85,7 %, und Anthropics erweitertes Cyber Verification Program bietet qualifizierten Fachleuten reduzierte Blocking-Klassifikatoren. Der unbeschränkte Checkpoint wird ausdrücklich nicht ausgeliefert."
  }
]} />

## Quellen und weiterführende Literatur

- **Moonshot AI** — *Kimi K3.1 Pro Tech Blog: Advancing Open Intelligence*: https://www.kimi.ai/blog/kimi-k3-1-pro — die Primärquelle. Die zweiphasige Datenentfernung, die `xdev-bench-hard`-pass@3-Tabelle (81,0 % / 90,5 % / 85,7 % / 57,1 % / 33,3 %), die Begründung „absolute Grenze der Cyber-Fähigkeit“, die Kimi-Hallu-Bench-Hard-Zahlen und das Gewichtsdatum 4. November 2026 stammen alle von hier.
- **Implicator.ai** — *Kimi K3.1 Pro Hacking Cut Rests on Unpublished Moonshot Test*: https://www.implicator.ai/kimi-k3-1-pro-hacking-cut-unpublished-test/ — die klarste Darstellung dessen, was Moonshot veröffentlicht hat und was nicht, einschließlich dessen, dass der Benchmark intern ist und keine Aussage zur Wiederherstellung durch Fine-Tuning gemacht wird. Auch die Quelle der hier zitierten Kritik von Extrapolator und eines Vergleichs „GPT-5.6 Sol bei 100 %“, den diese Seite ihnen und nicht Moonshot zuschreibt.
- **The Next Web** — *Moonshot releases Kimi K3.1 Pro and says it cut its hacking skills*: https://thenextweb.com/news/moonshot-kimi-k3-1-pro-open-weight-cyber — unabhängige Berichterstattung, einschließlich des ausdrücklichen Vorbehalts, dass die Benchmark-Zahlen Moonshots eigene und unverifiziert sind, und des Terminal-Bench-4.0-Kontexts (65,7 % gegenüber 66,4 % bei Claude Opus 5.5).
- **DataStudios** — *Moonshot AI Kimi K3.1 Pro: open-weight, 1M context, cyber safeguards*: https://www.datastudios.org/post/moonshot-ai-kimi-k3-1-pro-open-weight-1m-context-cyber-safeguards — die Spezifikations- und Preisdetails und der Hinweis, dass Lizenzbedingungen, Hardwareanforderungen und Quantisierungsformate bei der Ankündigung unveröffentlicht waren.
- **The Decoder** — *China plans to tighten export controls on open-weight models and 23 key AI technologies*: https://the-decoder.com/china-plans-to-tighten-export-controls-on-open-weight-models-and-23-key-ai-technologies/ — der Geltungsbereich des Katalogs, die drei Schwellen, das Verbot autonomer Malware, die Einschränkung von Schwachstellen-Tooling und die Ausnahmeliste.
- **TechTimes** — *China's New AI Export Controls Apply Now if You Licensed or Deployed Covered Chinese Models*: https://www.techtimes.com/articles/329196/20261019/chinas-new-ai-export-controls-apply-now-if-you-licensed-deployed-covered-chinese-models.htm — die Bezeichnung Announcement No. 48, die Kommentierungsfrist bis 15. November, die Nennung von Kimi K3 und Qwen3.8-Max als Beispiele über der Schwelle und die transaktionsbezogene Analyse bestehender Deployments.
- **Sheppard Mullin** — *Choosing Between U.S. and Chinese AI Models: The Export Control Risks on Both Sides*: https://www.sheppard.com/insights/blogs/us-vs-chinese-ai-models-export-control-risks — die Erinnerung daran, dass die beiden Regime symmetrisch sind, „welche Regeln gelten“ also selten eine einzige Frage ist.
- **crypto.news** — *Vitalik Buterin backs Kimi AI hacking limits, warns of KYC risks*: https://crypto.news/vitalik-buterin-kimi-ai-hacking-limits-kyc-risks/ — der Grundsatz „Anwendungsfälle statt Nutzer“, die Warnung vor KYC und Überwachung und das Zugeständnis, dass andere Labore die Fähigkeit trotzdem bauen werden.
- **Anthropic** — *Cyber Verification Program*: https://support.claude.com/en/articles/14604842-cyber-verification-program — der sanktionierte Weg für verifizierte Sicherheitsfachleute, am 6. Oktober 2026 auf drei Stufen erweitert (Defense Access, Red Team Access, Specialized Access) mit reduzierten Blocking-Klassifikatoren und Zugang zu Opus 5.5, Sonnet 5.5 und Mythos 5.1. Prüfen Sie die Programmseite auf aktuelle Zulassungsbedingungen; die Bedingungen sind der Teil, der sich am ehesten verschoben hat.
- **Hugging Face** — Organisationsseite von Moonshot AI: https://huggingface.co/moonshotai — wo die Gewichte landen und wo man Lizenz und Model Card prüft statt des Blogs.

## Weiter

- [Backdoored Open Weights](/docs/security/backdoored-open-weights) — die andere Hälfte dieser Geschichte: wie Nach-Release-Änderungen an Open Weights tatsächlich funktionieren und warum „bei Release reduziert“ nicht dasselbe ist wie „reduziert“
- [Kimi K3: das größte Open-Weight-Modell der Welt](/docs/models/kimi-k3-open-weight-frontier) — die Generation, aus der dieses nachtrainiert wurde, einschließlich der Architektur und der Cache-Hit-Preise, die entscheiden, ob es günstig ist
- [Kimi K3 lokal mit vLLM bereitstellen](/docs/models/kimi-k3-deploy-locally-vllm-dspark) — was ein 2,8T-Open-Weight-Modell im tatsächlichen Betrieb kostet, falls Sie die Gewichte vom 4. November ziehen wollen
- [Wie man einen KI-Benchmark liest, ohne sich täuschen zu lassen](/docs/models/reading-ai-benchmarks) — die allgemeine Disziplin für vom Hersteller berichtete Zahlen, die ein veröffentlichtes Sicherheits-Delta ebenso braucht wie ein veröffentlichtes Fähigkeits-Delta
