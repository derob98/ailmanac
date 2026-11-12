# Die .pth-Backdoor: LiteLLM 1.107.0 und Code, der vor Ihrem Import läuft

> Source: https://derob98.github.io/ailmanac/de/docs/security/pth-backdoor-litellm-supply-chain · AILmanac (CC BY 4.0) · last verified 2026-10-22

Am 21. Oktober 2026 lieferte litellm 1.107.0 etwa 100 Minuten lang sieben vergiftete Wheels und vier Docker-Tags aus. Die Nutzlast brauchte nie jemanden, der litellm importiert — sie kam als .pth-Datei, die Python bei jedem Interpreterstart ausführt. Der Mechanismus, warum „Wheels können keinen Code bei der Installation ausführen“ wahr und nutzlos war, die Grundursache, die jeden AI-Gateway-Betreiber erschrecken sollte (GitHub-Tokens von Entwicklern in Proxy-Logs), warum Trusted Publishing und Image-Signierung nicht halfen, ein verifizierter Audit-Befehl und die Kontrolltabelle dessen, was es tatsächlich gestoppt hätte.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Verstehen, warum die Nutzlast auf Hosts lief, auf denen nie jemand litellm importiert hat — Pythons site-Modul führt .pth-Zeilen, die mit import beginnen, bei jedem Interpreterstart aus, vor Ihrem Code","Sehen, warum die beruhigende Regel „Wheels führen bei der Installation keinen Code aus“ völlig wahr und völlig irrelevant war","Die Grundursache nachverfolgen, die für jeden zählt, der ein AI-Gateway betreibt: Ein Coding-Agent legte ein GitHub-OAuth-Token in einen Response-Body, und der Proxy protokollierte Response-Bodies","Verstehen, warum Trusted Publishing, Docker-Image-Signierung und unveränderliche Tags — alle seit März vorhanden — ein aus einem Lookalike-Repository gebautes Release nicht stoppten","Sehen, wie der Angreifer dieses Primitiv in Echtzeit übernimmt: Im März 2026 verlangte litellm 1.82.7, dass Sie das Paket benutzen, und 1.82.8 — das nächste Release — wechselte zu einer .pth","Ein verifiziertes Audit auf ausführbare .pth-Zeilen auf Ihren eigenen Maschinen laufen lassen und das Ergebnis richtig lesen (setuptools liefert legitimerweise eine mit)","Die Kontrolltabelle anwenden: welche der fünfzehn üblichen Lieferketten-Abwehrmaßnahmen dies tatsächlich blockiert hätten, welche die Malware signiert hätten und die einzeilige Konfiguration, die beide LiteLLM-Vorfälle gestoppt hätte"]} />

Am **21. Oktober 2026** installierte `pip install litellm` etwa **100 Minuten** lang einen Credential-Stealer und einen stündlichen Remote-Code-Loader. Der Hacker-News-Thread kam mit 519 Punkten auf die Startseite. Der übliche Rat folgte: Versionen pinnen, Schlüssel rotieren.

Dieser Rat ist richtig, und er ist auch das Uninteressanteste an diesem Vorfall. Drei Details machen ihn eine Seite wert:

1. **Die Nutzlast musste nicht importiert werden.** Sie wurde als `.pth`-Datei ausgeliefert, die Pythons `site`-Modul bei **jedem Interpreterstart** in dieser Umgebung ausführt. Ein Host, der LiteLLM in ein gemeinsames Virtualenv installiert und dann ein unabhängiges Skript ausgeführt hat, gab seine Zugangsdaten trotzdem preis.
2. **Der Erstzugriff kam über die Logs eines AI-Gateways.** Laut LiteLLMs eigenem Post-Mortem bettet Claude Code das GitHub-CLI-OAuth-Token eines Nutzers in einen Response-Body ein; LiteLLMs interne Instanz protokollierte Response-Bodies; diese Instanz war aus dem öffentlichen Internet erreichbar. Der Angreifer las die GitHub-Zugangsdaten von drei Entwicklern aus einem Proxy-Log.
3. **Das Release war signiert, über Trusted Publishing veröffentlicht und dem echten Repository zuzuordnen** — weil der Angreifer den Publisher nicht fälschte. Er änderte den Workflow des Publishers so, dass er aus `Berri-AI/litellm` statt aus `BerriAI/litellm` baute.

Wenn Sie einen LLM-Proxy vor Coding-Agenten betreiben, ist Punkt 2 der, den man zweimal lesen sollte. Die Request- und Response-Logs Ihres Gateways sind ein Credential-Speicher, den Sie vermutlich nie als solchen eingestuft haben.

<VerifyNote lastVerified="2026-10-22" source="LiteLLM's incident post (docs.litellm.ai/blog/security-incident-oct-21-2026), plus StepSecurity, SafeDep, JFrog and Wiz technical analyses, The Hacker News, and the Python 3 site module documentation. Timestamps, the credential-theft chain and the remediation steps are the maintainers' own account, which was still being updated at the time of writing — expect the root-cause wording to be refined. The sdist omitting the payload is SafeDep's and JFrog's finding; the March 2026 Trivy-driven first compromise is JFrog's. Independently verified on 2026-10-22: litellm 1.107.0 is absent from the PyPI JSON API and the newest release is 1.106.2 (7 wheels + 1 sdist, consistent with the maintainers' 'seven wheels'; Wiz's writeup counts eight distributions); PyPI's integrity endpoint returns 'No provenance available' for litellm 1.106.2; github.com/BerriAI/litellm returns 200 and github.com/Berri-AI/litellm returns 404. The .pth execution behaviour, the duplicate firing in a venv and the -S suppression were reproduced locally on CPython 3.14.6, as was setuptools shipping a legitimate executable .pth line. The claim that a provenance attestation would have verified correctly is this page's inference from the maintainers' description of the workflow change, not a published finding." />

## Die Zeitleiste

Alle Zeiten UTC, 21. Oktober 2026, aus dem Post-Mortem der Maintainer.

| Zeit | Was passierte |
|---|---|
| 10:08:29 | Branch Protection **lehnt** eine nicht autorisierte Änderung am Release-Workflow **ab** |
| 10:08:34 | Fünf Sekunden später deaktiviert ein Credential eines **Organisations-Owners** die Branch Protection und force-pusht die Änderung |
| 10:46:39 | Der geänderte Workflow startet einen Staging-Lauf gegen das Lookalike-Repo `Berri-AI/litellm` |
| 11:08:53 | Die Produktions-Release-Pipeline beginnt |
| 11:11:18 | Ein **zweites** Entwickler-Credential erfüllt das Produktions-Approval-Gate |
| 11:39:51–11:40:13 | **Sieben vergiftete Wheels** für `litellm==1.107.0` landen auf PyPI |
| 11:46:56 | Vergiftetes Image veröffentlicht; die Docker-Tags `v1.107.0`, `latest`, `main-latest`, `main-stable` zeigen alle darauf |
| 11:53:49 | Ein **drittes** Credential löscht die Run-Einträge des Release-Workflows |
| 12:09–12:24 | Der nicht autorisierte Workflow wird entfernt und der echte wiederhergestellt |
| bis 13:23 | PyPI entfernt `litellm==1.107.0` |
| 13:51 | GHCR-Tags als nicht verfügbar bestätigt |
| 14:20 | Docker-Hub-Tags entfernt oder auf verifizierte Artefakte umgebogen |

Zwei Dinge fallen auf. Das **Approval-Gate funktionierte genau wie vorgesehen** — es verlangte einen zweiten Menschen, und der Angreifer hatte das Token eines zweiten Menschen. Und das Docker-Expositionsfenster war länger als das von PyPI: **etwa zweieinhalb Stunden**, in denen `latest` und `main-stable` beide vergiftet waren. Jeder, dessen Deployment in diesem Fenster einen Floating-Tag zog, bekam es, auch Leute, die glaubten, `main-stable` bedeute etwas.

## Teil 1 — Der Mechanismus: Code, der vor Ihrem Import läuft

### Was eine .pth-Datei ist und was sie kann

Eine `.pth`-Datei in `site-packages` ist normalerweise langweilig: eine Liste von Verzeichnissen, die an `sys.path` angehängt werden. So funktionieren Editable Installs. Aber das Format hat ein zweites, weit weniger bekanntes Verhalten, und es steht in der Dokumentation der Standardbibliothek:

> Eine Zeile in einer `.pth`-Datei, die **mit `import` beginnt**, gefolgt von einem Leerzeichen oder Tab, wird **mit `exec()` ausgeführt**.

Die `cook.pth` des Angreifers ist **12 Bytes** lang. Ihr gesamter Inhalt ist `import cook`. Das genügt. Pythons `site`-Modul, das beim Interpreterstart automatisch importiert wird, findet die Datei, sieht das Präfix `import` und führt sie aus — was `cook.py` importiert, einen einzeiligen Base64-und-zlib-Blob, der den Stealer enthält.

Daneben legte das Wheel **`sitecustomize.py`** ab, die gar keine `.pth` braucht: Das `site`-Modul versucht bei jedem Start, ein Modul genau dieses Namens zu importieren, als Administrator-Hook, by design. Und es gibt ein Detail in der Dokumentation, von dem der Angreifer direkt profitiert — wenn der Import von `sitecustomize` etwas anderes als einen passenden `ImportError` auslöst, **wird der Fehler stillschweigend verschluckt**. Eine fehlerhaft arbeitende Nutzlast erzeugt keinen Traceback und keine Warnung.

Also: **Niemand muss litellm importieren.** Jeder Python-Prozess in dieser Umgebung führt beide Nutzlasten aus. Ein Cron-Job. Ein `--version`-Check. Ein unabhängiges Skript im selben Container.

### Selbst nachprüfen

Das ist dokumentiertes Verhalten, keine Schwachstelle, Sie können es also in dreißig Sekunden in einem Wegwerf-Virtualenv bestätigen. Reproduziert auf CPython 3.14.6:

<PromptCard title="Den .pth-Mechanismus in einem Wegwerf-Venv beweisen">
{`python3 -m venv /tmp/pthdemo
SP=$(/tmp/pthdemo/bin/python -c "import site;print(site.getsitepackages()[0])")
printf 'import sys; sys.stderr.write("[pth ran: no import needed]\\n")\\n' > "$SP/zz_demo.pth"

# A command that imports nothing at all:
/tmp/pthdemo/bin/python -c "print('hello')"
#   [pth ran: no import needed]
#   hello

# -S skips the site module entirely, so nothing runs:
/tmp/pthdemo/bin/python -S -c "print('hello')"
#   hello

rm -rf /tmp/pthdemo`}
</PromptCard>

Zwei nützliche Beobachtungen aus dem Lauf. Erstens unterdrückt `-S` den ganzen Mechanismus — was unten wichtig ist, weil Sie nach Nutzlasten auditieren wollen, **ohne sie auszuführen**. Zweitens wurde die Demo-Zeile pro Interpreterstart **zweimal** ausgegeben: In einem Virtualenv kann dasselbe Site-Verzeichnis mehr als einmal aufgezählt werden, und die Dokumentation sagt ausdrücklich, dass Pfadeinträge dedupliziert werden, **ausführbare Einträge aber nicht**. Eine Nutzlast kann pro Prozess mehr als einmal feuern.

### Der Teil, der den Vorfall überdauert

Wenn Sie sich von dieser Seite nur eine dauerhafte Tatsache merken, dann diese: **`.pth`-Importzeilen sind ab Python 3.15 veraltet und für die Entfernung in Python 3.20 vorgesehen.** Der Ersatz ist eine explizite `.start`-Entry-Point-Datei, und eine `.pth`-Importzeile wird **stillschweigend ignoriert**, wenn eine passende Datei `.name.start` existiert.

Das ist ein reales, datiertes Ende dieses konkreten Angriffsprimitivs — und ein Grund, die ausführbaren `.pth`-Zeilen in Ihren Umgebungen jetzt zu finden, denn manche davon sind tragend und werden brechen.

Zwei weitere dokumentierte Verhaltensweisen, die beide einer stillen Nutzlast entgegenkommen: Seit 3.15 **bricht** ein Fehler in einer `.pth`-Zeile die Verarbeitung der übrigen Zeilen **nicht mehr ab**, und während der Deprecation-Phase wird die Diagnose für eine ausgeführte Importzeile **nur unter `-v`** ausgegeben.

### Warum „Wheels führen bei der Installation keinen Code aus“ niemandem half

Es gibt eine weit verbreitete und tatsächlich korrekte Weisheit des Python-Packagings: Ein **sdist** kann bei der Installation über `setup.py` beliebigen Code ausführen, während ein **Wheel** nur ein Zip-Archiv ist, das der Installer durch Kopieren von Dateien entpackt. Wheels sind das sicherere Format. Bevorzugen Sie Wheels.

Das alles stimmt. Nichts davon half, weil **die Nutzlast keine Ausführung bei der Installation brauchte.** Der Angreifer fügte in `pyproject.toml` unter der Maturin-Build-Konfiguration eine Zeile hinzu —

```toml
[tool.maturin]
data = "cook"
```

— die das Build-Backend anweist, das Verzeichnis `cook/` als Wheel-**Daten** zu verpacken, deren Inhalt bei der Installation an der Wurzel von `site-packages` landet. Kein Hook, kein Skript, kein `setup.py`. Nur drei Dateien, die an ihren Platz kopiert werden, von denen Python danach bei jedem Start eine ausführt.

Die Lehre geht über diesen Vorfall hinaus: „Führt dieses Paket bei der Installation Code aus?“ ist die falsche Frage. Die richtige ist **„Welche Dateien legt dieses Paket in meiner Umgebung ab, und führt meine Laufzeit selbstständig welche davon aus?“**

<Callout type="warning" items={["Behandeln Sie eine .pth-Datei in einem Wheel wie ein Installationsskript. Sie ist strikt mächtiger: Ein Installationsskript läuft einmal, unter Ihrem Installer, wo Sie es vielleicht sehen. Eine .pth-Zeile läuft bei jedem Interpreterstart, für immer, unter welchem Prozess auch immer als Nächstes Python startet."]} />

## Teil 2 — Wheel und Quelltext widersprachen sich

Hier ist der Befund, der verändern sollte, wie Sie ein Release prüfen. **Die Source Distribution enthielt die Nutzlast nicht.** Laut SafeDep und JFrog fehlt das Verzeichnis `cook/` im sdist — aber seine `pyproject.toml` trägt die Zeile `data = "cook"`, und diese Zeile erscheint in **keinem öffentlichen Commit** von `BerriAI/litellm`. Sie war die einzige sichtbare Spur der Manipulation, in einer Build-Konfiguration, nur im Artefakt.

Verfolgen Sie die Konsequenzen:

- Wer den Git-Tag `v1.107.0` gegen `v1.106.2` diffte, sah nichts Falsches — der Tag ist sauber.
- Wer die GitHub-Release-Seite las, sah nichts Falsches.
- Wer mit `--no-binary :all:` installierte, konnte die drei Nutzlast-Dateien nicht erhalten haben, weil das sdist sie nicht ausliefert.
- Wer `pip install litellm` ausführte — das Normale, das Wheels bevorzugt — bekam den Stealer.

JFrog ergänzt ein forensisches Detail, das man kennen sollte: Die ZIP-Eintragszeitstempel der Nutzlast-Dateien **stimmen mit denen der legitimen Dateien** im Wheel überein, was darauf hindeutet, dass die Malware bei einem normalen Wheel-Build einbezogen und nicht nachträglich durch Umpacken des Archivs angeflanscht wurde. Das Artefakt ist genau das, was der vergiftete Build erzeugte — was uns zum unbequemen Teil bringt.

## Teil 3 — Warum die Härtung nicht half

LiteLLM war bei der Release-Sicherheit nicht nachlässig — und der Grund, warum es nicht nachlässig war, ist selbst Teil der Geschichte. **Das war die zweite LiteLLM-Kompromittierung des Jahres 2026.** Im **März** führte die Build-Pipeline des Projekts laut JFrog ein bösartiges **ungepinntes Trivy-0.69.4**-Release aus, das CI/CD- und Publishing-Zugangsdaten offenlegte und zu den manipulierten Versionen **1.82.7 und 1.82.8** führte. JFrog beschreibt die Nutzlasten und Infrastruktur vom Oktober als verschieden, ohne erkennbaren Zusammenhang zwischen den beiden Kampagnen.

Die Härtung im März war die Antwort auf diesen ersten Vorfall. Nach eigener Darstellung der Maintainer hatten sie seither Releases auf **private Repositories** verlegt, **Trusted GitHub Publishers** eingeführt, Docker-Tags **unveränderlich** gemacht und **Docker-Image-Signierung** aktiviert. Das ist eine bessere Haltung als bei den meisten Projekten dieser Größe — und beachten Sie, dass die erste Kompromittierung mit einer **ungepinnten Abhängigkeit in einer Build-Pipeline** begann, was dieselbe Lehre ist, mit der die Kontrolltabelle unten endet.

Jede dieser Kontrollen wurde vom Oktober-Release erfüllt. Hier ist der Grund.

<Steps items={[
  {title: "Der Angreifer gab sich nicht als Publisher aus — er benutzte ihn", body: "Der bösartige Workflow lief im legitimen Repository, durch die legitime Release-Pipeline, mit der legitimen Publishing-Identität. Geändert hatte sich, welche Quelle er auscheckte. Trusted Publishing bindet ein Artefakt an den Workflow und das Repository, die es erzeugt haben; es sagt nichts darüber, was dieser Workflow zu bauen beschloss."},
  {title: "Ein Lookalike-Organisationsname erledigte den Rest", body: "Der Workflow wurde auf Berri-AI/litellm statt auf BerriAI/litellm gerichtet. Ein Bindestrich. In einem Workflow-Datei-Diff ist das fast unsichtbar — und der Branch-Protection-Check, der ein Review erzwungen hätte, wurde fünf Sekunden nach seinem Auslösen von einem Org-Owner-Credential abgeschaltet."},
  {title: "Die Signierung signierte die Malware", body: "Image-Signierung beweist, dass ein Artefakt aus der erwarteten Pipeline stammt, seither unverändert. Das Artefakt tat es. Die Signatur ist gültig und das Image vergiftet; das steht nicht im Widerspruch, weil eine Signatur die Herkunft bescheinigt, nicht die Absicht."},
  {title: "Unveränderliche Tags schützten das Falsche", body: "Unveränderliche Tags verhindern, dass jemand stillschweigend ersetzt, worauf v1.107.0 zeigt. Hier war das vergiftete Image das erste und einzige, das je unter diesem Tag veröffentlicht wurde — die Unveränderlichkeit zementierte also die Malware. Floating Tags waren schlimmer: latest, main-latest und main-stable wurden alle darauf umgebogen."},
  {title: "„Verified“ auf den Commits bedeutete weniger, als es aussah", body: "Die bösartigen Commits wurden als Berri-AI <eine Protonmail-Adresse> verfasst und trugen GitHubs Verified-Badge. Dieses Badge bedeutet, dass GitHub den Commit im Namen einer authentifizierten Sitzung signiert hat — typischerweise des Web-Editors —, nicht dass der genannte Autor ist, wer er zu sein scheint. Ein Verified-Badge neben einem plausiblen Org-Namen ist keine Identitätsprüfung."},
  {title: "Und das saubere Release hat immer noch keine Attestierung zum Prüfen", body: "Verifiziert am 22.10.2026: PyPIs Integrity-Endpunkt liefert für litellm 1.106.2 „No provenance available“. Selbst nach dem Vorfall gibt es also nichts am aktuellen Release, wogegen ein Konsument prüfen könnte — was der Normalfall bei PyPI ist und keine Kritik, die nur dieses Projekt trifft."}
]} />

Die ehrliche Zusammenfassung ist, dass die gängige Software-Lieferketten-Toolchain darauf gebaut ist, die Frage *„Stammt dieses Artefakt aus der echten Pipeline des Projekts?“* zu beantworten. Sie antwortete korrekt **ja**. Fast nichts davon ist darauf gebaut, die Frage *„Hat die echte Pipeline des Projekts den echten Quelltext des Projekts gebaut?“* zu beantworten — und um diese Frage drehte sich der Angriff.

## Teil 4 — Die Grundursache: Die Logs Ihres Gateways sind ein Credential-Speicher

Nun der Teil, der spezifisch für KI-Infrastruktur ist, und der Grund, warum dieser Vorfall auf diese Seite gehört und nicht nur in einen Packaging-Newsletter.

Der Angreifer hat weder einen Maintainer gephisht noch ein Passwort geknackt. Laut dem Post-Mortem der Maintainer war die Kette:

<Steps items={[
  {title: "Eine interne LiteLLM-Instanz war aus dem öffentlichen Internet erreichbar", body: "Die Untersuchung fand in dieser Instanz ein „unerwartetes, harmlos benanntes Benutzerkonto“. Das Team vermutete, der Zugang sei über eine kürzlich gepatchte Schwachstelle erfolgt, hatte den Vektor zum Zeitpunkt des Schreibens aber nicht bestätigt."},
  {title: "Coding-Agent-Traffic floss hindurch und trug ein OAuth-Token", body: "Zitat aus dem Post-Mortem: Claude Code bettet das GitHub-CLI-OAuth-Token eines Nutzers in einen Response-Body ein, und wo Response-Bodies protokolliert werden, können diese Tokens in LiteLLM-Logs auftauchen. Das Gateway tat genau das, wofür Gateways konfiguriert werden — Request- und Response-Payloads für Debugging, Kostenzuordnung und Evals aufzubewahren."},
  {title: "Die Logs lieferten die GitHub-Zugangsdaten von drei Entwicklern", body: "Eines gehörte einem der beiden Owner der Organisation. Allein diese Tatsache verwandelte „Lesezugriff auf eine Log-Tabelle“ in „Branch Protection deaktivieren und den Release-Workflow force-pushen“."},
  {title: "Die Malware suchte dann nach derselben Klasse von Geheimnissen", body: "Der Stealer, der sich selbst privcollect nennt, erntet sechzehn Kategorien: Browser-Passwörter und -Cookies, SSH- und GPG-Schlüssel, AWS/Azure/GCP-Zugangsdaten, Kubernetes-Konfigurationen, CI-Geheimnisse (GitLab Runner, Jenkins, Vault, Terraform), Shell- und Datenbank-Historie, die Umgebung jedes Prozesses über /proc/<pid>/environ, Tokens von KI-Coding-Tools (Claude, Cursor, Copilot, Gemini und andere) — und, wo DATABASE_URL gesetzt war, einen Prisma-Dump der LiteLLM-Proxy-Datenbank selbst, die die Provider-Schlüssel enthält, die sie vermitteln sollte."}
]} />

Dieser letzte Punkt schließt den Kreis und ist der strukturelle. **Ein LLM-Gateway ist konstruktionsbedingt der einzige Host in Ihrer Landschaft, der jeden Provider-Schlüssel hält und jeden Prompt und jede Completion sieht.** Fügen Sie Response-Body-Logging hinzu, und er hält auch alle Geheimnisse, die Ihre Agenten zufällig hindurchreichen. Einen zu kompromittieren ist mehr wert als einen Entwickler-Laptop, und die Einkaufsliste der Malware zeigt, dass der Angreifer das wusste.

<Callout type="key" items={["Wenn Sie ein AI-Gateway betreiben, ist die Handlungsempfehlung aus diesem Vorfall nicht nur „litellm pinnen“. Sie lautet: Finden Sie heraus, ob Ihr Gateway Request- und Response-Bodies persistiert, entscheiden Sie, ob es das soll, und schwärzen Sie credential-förmige Zeichenketten, falls es sein muss. Agent-Traffic ist kein gewöhnlicher API-Traffic — Coding-Agenten tragen Tokens für GitHub, Cloud-Provider und Paket-Registries im selben Kanal."]} />

### Was die Nutzlast auf dem Host tat

Der Vollständigkeit halber die zweite Datei. `sitecustomize.py` forkte einen losgelösten Daemon — `setsid()`, I/O nach `/dev/null`, Arbeitsverzeichnis `/`, sodass er den Elternprozess überlebt —, der **alle 3.600 Sekunden** aufwachte, seinen nächsten Command-and-Control-Host aus einem Dead Drop auflöste (eine `domain.txt` in einem inzwischen gelöschten GitHub-Konto), von dort `/codepy` per einfachem HTTP abrief und über `exec()` ausführte. Die Exfiltration ging an `www.litellm[.]dev/healthcheck`, ebenfalls einfaches HTTP, mit AES-256-CBC-verschlüsseltem Body unter einem RSA-4096-umhüllten Schlüssel — ein Lookalike des echten `litellm.ai` des Projekts, registriert am **13. Oktober 2026**, acht Tage vor dem Release. (Domains sind auf dieser Seite entschärft; lösen Sie sie nicht auf.)

StepSecurity merkt an, dass der Daemonisierungspfad **unter Windows stillschweigend fehlschlägt**, da er auf `fcntl` und `os.fork` beruht. Ein Windows-Wheel wurde veröffentlicht, behandeln Sie den Stealer dort also als gelaufen und den stündlichen Loader als den Teil, der vermutlich nicht lief.

<Callout type="warning" items={["Das Deinstallieren des Pakets beendet den Vorfall nicht, aus vier unabhängigen Gründen. Die gestohlenen Zugangsdaten sind schon weg. Der geforkte Daemon ist ein separater Prozess ohne verbleibende Beziehung zum Paket. Jeder Python-Start auf diesem Host in der Zwischenzeit hat den Stealer neu ausgeführt. Und — wie JFrog anmerkt — pip ist selbst ein Python-Prozess, Ihr Abhilfebefehl führt die Nutzlast also auf dem Weg nach draußen noch einmal aus. Die eigene Empfehlung der Maintainer ist, den Host als kompromittiert zu behandeln: den Daemon beenden, die Dateien entfernen, neu aufbauen und alles rotieren."]} />

## Teil 5 — Dasselbe Paket, sieben Monate früher, und die eigene Eskalation des Angreifers

Der Vorfall im März verdient einen genauen Blick, denn seine zwei bösartigen Versionen zeigen die `.pth`-Technik, wie sie *übernommen* wird — in einem einzigen Versionssprung.

Laut Datadog Security Labs, die ihn als Kampagne **TeamPCP** verfolgen:

- **`litellm` 1.82.7** trug seine Nutzlast in `litellm/proxy/proxy_server.py`. Um zu feuern, musste das Opfer das Paket installieren **und es dann tatsächlich benutzen**.
- **`litellm` 1.82.8** — das allernächste Release — fügte **`litellm_init.pth`** hinzu. Dasselbe Projekt, dieselbe Kampagne, wenige Tage auseinander, und nun feuerte die Nutzlast **beim Interpreterstart**, ohne dass LiteLLM importiert werden musste.

Das ist der Angreifer, der das Primitiv entdeckt, um das es auf dieser ganzen Seite geht, und der Grund, warum die Oktober-Nutzlast mit einer 12 Byte großen `.pth` statt einem eingeschleusten Modul begann. Wenn Sie Ihre eigenen Abhängigkeiten triagieren, ist die Eskalation von „Code auf Modulebene“ zu einem „`.pth`-Dropper“ das Muster, das Sie erwarten sollten, kein einmaliger Trick.

Die März-Nutzlast ist auch erkennbar dasselbe *Handwerk* wie die vom Oktober: AES-256 mit einem RSA-4096-umhüllten Schlüssel, Exfiltration an eine **Lookalike-Domain, gebaut aus dem Namen des Projekts selbst** (`models.litellm[.]cloud` damals, `litellm[.]dev` im Oktober), Credential-Ernte über Umgebungsvariablen, SSH-Schlüssel, Cloud-Zugangsdaten und Kubernetes — plus, im März, systemd-Persistenz über `~/.config/sysmon/sysmon.py`, Befehls-Polling bei `checkmarx[.]zone/raw` und die Fähigkeit, Kubernetes-Pods anzulegen, um sich über einen Cluster auszubreiten. Die Kampagne vom März kettete sich ausgehend von **Trivy am 19. März** über npm (CanisterWorm) und Checkmarx-Tooling nach außen und erreichte PyPI am **24. März** (`litellm`) und **27. März** (`telnyx`).

<Callout type="note" items={["Die Quellen sind uneins, ob die beiden LiteLLM-Vorfälle zusammenhängen, und diese Seite löst das nicht auf. JFrog hält fest, dass Nutzlasten und Infrastruktur vom Oktober verschieden sind, ohne erkennbaren Zusammenhang mit der März-Kampagne. Dagegen: Beide nutzten einen .pth-Dropper, beide nutzten AES-256 unter einem RSA-4096-umhüllten Schlüssel, und beide exfiltrierten an eine vom Projektnamen abgeleitete Lookalike-Domain — während Datadogs Kampagnenbezeichnung (TeamPCP) und der selbstgewählte Name des Oktober-Stealers (privcollect, Marker PRIVCOLLECT_ACTIVE) einen Vergleich nahelegen, zu dem niemand ein Urteil veröffentlicht hat. Die Zuordnung ist Sache der Forscher; behandeln Sie die Ähnlichkeit als ungeklärt, nicht als Befund."]} />

### Die eine Kontrolle, die beide gestoppt hätte

Im eigenen Vorfallsbericht von PyPI zum März steht die nützlichste Zahl: **LiteLLM wird etwa 1.700-mal pro Minute installiert**, und **119.000 Downloads** gab es im Expositionsfenster vom März. PyPI stellte das März-Release **2 Stunden 32 Minuten** nach dem Upload unter Quarantäne; im Oktober waren die Wheels nach etwa **1 Stunde 43 Minuten** weg. Die Reaktion wird schneller — und sie wird nie schnell genug sein, denn bei dieser Installationsrate sind die ersten zehn Minuten bereits ein Massenkompromittierungsereignis.

Deshalb lautet PyPIs wichtigste Empfehlung an Konsumenten nicht „Lesen Sie den Code“. Sie lautet **Dependency Cooldown**: Weigern Sie sich, ein Release aufzulösen, das jünger als N Tage ist. Beide LiteLLM-Kompromittierungen wurden binnen Stunden erkannt und zurückgezogen. **Ein Cooldown von drei Tagen hätte beide für jeden, der einen hatte, zu einem Nicht-Ereignis gemacht.**

Das ist die am wenigsten genutzte hochwertige Kontrolle auf der Liste, und sie ist eine Zeile Konfiguration.

<PromptCard title="Dependency Cooldowns in den drei Tools, die sie unterstützen">
{`# --- uv: pyproject.toml (or uv.toml at the root) ---
# exclude-newer accepts an RFC 3339 timestamp, a friendly duration,
# or an ISO 8601 duration. Relative durations landed in uv 0.9.17.
[tool.uv]
exclude-newer = "7 days"     # equivalently: "P7D"

# --- Renovate: renovate.json ---
# The oldest implementation of the idea (formerly stabilityDays).
{
  "minimumReleaseAge": "7 days"
}

# --- Dependabot: .github/dependabot.yml ---
# Note: Dependabot already applies a DEFAULT 3-day cooldown to version
# updates even with no cooldown block at all -- and never to security
# updates. Configure it only to lengthen or target the window.
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule: { interval: "weekly" }
    cooldown:
      default-days: 7
      semver-patch-days: 3`}
</PromptCard>

Der Kompromiss ist ausdrücklich und klein: Sie erhalten Nicht-Sicherheits-Updates bis zu eine Woche später. Im Gegenzug schrumpft das Fenster, in dem ein vergiftetes Release Sie erreichen kann, von „so lange, bis jemand es bemerkt“ auf „null, sofern jemand es innerhalb des Cooldowns bemerkt“ — und in beiden LiteLLM-Fällen bemerkte es jemand binnen Stunden.

<Callout type="tip" items={["Ein Cooldown darf Sicherheits-Patches nicht verzögern, sonst haben Sie ein Risiko gegen ein anderes getauscht. Dependabot macht das konstruktionsbedingt richtig: Cooldown ist nur eine Option für Versions-Updates und ist als nicht für Sicherheits-Updates geltend dokumentiert. Wenn Sie einen Cooldown selbst umsetzen — etwa über uvs exclude-newer in der CI —, behalten Sie einen dokumentierten Override-Pfad für ein Release, das eine bekannte Advisory behebt.", "Prüfen Sie, was Sie schon haben, bevor Sie Konfiguration hinzufügen. Dependabots 3-Tage-Standard bedeutet, dass viele Repositories teilweise abgedeckt sind, ohne dass jemand es gewählt hätte, während ein Dockerfile, das einen Floating Tag zieht, und ein CI-Schritt, der pip install -U ausführt, von alledem nicht abgedeckt sind."]} />

## Triage: Betrifft das Sie?

Führen Sie diese der Reihe nach aus. Die erste Frage ist billig und beantwortet es für die meisten.

<PromptCard title="1. Wurde 1.107.0 irgendwo aufgelöst?">
{`# Lockfiles, requirement files, constraints — anywhere a resolver wrote a version down
grep -rniE "litellm[=<>~! ]*1\\.107\\.0([^0-9rc]|$)" . \\
  --include="requirements*.txt" --include="*.lock" --include="*.txt" \\
  --include="poetry.lock" --include="Pipfile.lock" --include="uv.lock" 2>/dev/null

# Installed right now, in this environment
pip list 2>/dev/null | grep -i litellm

# Container images you are actually running (compare against the poisoned digest)
docker images --digests | grep -i litellm`}
</PromptCard>

<PromptCard title="2. Nach den drei abgelegten Dateien und den Laufzeitmarkern suchen">
{`# The payload files, at the ROOT of site-packages (not inside a litellm/ directory)
find / -name "cook.pth" -path "*site-packages*" 2>/dev/null
find / -name "cook.py" -path "*site-packages*" 2>/dev/null
find / -name "sitecustomize.py" -path "*site-packages*" 2>/dev/null

# Known SHA-256 of the three files
#   cook.pth          7f191632e7320705d154b85204f1ae546b543acbd7e8861229b76f5042b92bdb
#   cook.py           9dd0a3926f96a37eb86cf1ee2310d9be93139cc4ebef3ef9e2efe9531390be25
#   sitecustomize.py  34bef04fe88ac9d0aae0475630b1738681d15b94f233ac8aa46eacf5968305fa

# Execution markers
ls -la /tmp/.pc_once_72129118c59f5636c0bb /tmp/remote_code_loader.lock 2>/dev/null
ls -d /tmp/.pc_sq_* /tmp/.pc_e_* 2>/dev/null

# The live hourly loader: whatever process holds the lock (parent PID 1, cwd /)
lsof /tmp/remote_code_loader.lock 2>/dev/null`}
</PromptCard>

<PromptCard title="3. Netzwerkseitig, falls Sie Egress- oder DNS-Logs führen">
{`# Exfiltration, dead drop, and the fetched payload path
#   litellm.dev                                    (NOT litellm.ai — the lookalike)
#   www.litellm.dev/healthcheck                    plain HTTP POST, encrypted body
#   raw.githubusercontent.com/letters9813/...      dead drop for the next C2 host
#   any request path ending in /codepy             the fetched code

grep -hiE "litellm\\.dev|letters9813|/codepy" /var/log/**/*.log 2>/dev/null | head`}
</PromptCard>

Wenn etwas davon anschlägt: den Daemon beenden, `cook.pth`, `cook.py`, `sitecustomize.py` und ihre `__pycache__`-Einträge löschen, `litellm==1.106.2` pinnen (oder das `v1.106.2`-Image **per Digest**), dann den Host neu aufbauen und **alles rotieren** — Cloud-IAM-Zugangsdaten, Provider-API-Schlüssel, Datenbankpasswörter, SSH-Schlüssel, CI-Geheimnisse, Agent-Tool-Tokens — und CloudTrail oder das Äquivalent auf die Nutzung dieser Zugangsdaten von unbekannten Quellen prüfen. Die Maintainer geben an, dass Kunden auf dem privaten Enterprise-Release nicht betroffen waren.

## Das Audit, das man behalten sollte: Welche .pth-Dateien führen Code aus?

Unabhängig von diesem Vorfall sollten Sie wissen, was auf Maschinen, die Ihnen wichtig sind, beim Python-Start ausgeführt wird. Beachten Sie das `-S` — das Audit darf nicht das auslösen, wonach es sucht.

<PromptCard title="Jede ausführbare .pth-Zeile in einer Umgebung auflisten (mit -S ausführen)">
{`cat > /tmp/audit_pth.py <<'EOF'
import glob, os, site, sys
dirs = list(site.getsitepackages())
try:
    if site.ENABLE_USER_SITE:
        dirs.append(site.getusersitepackages())
except Exception:
    pass
seen, hits = set(), 0
for d in dirs:
    if d in seen or not os.path.isdir(d):
        continue
    seen.add(d)
    for p in sorted(glob.glob(os.path.join(d, "*.pth"))):
        for n, line in enumerate(open(p, encoding="utf-8", errors="replace"), 1):
            s = line.strip()
            if s[:6] == "import" and s[6:7] in (" ", "\\t"):
                hits += 1
                print(f"{p}:{n}: {s}")
print(f"\\n{hits} executable line(s) across {len(seen)} site dir(s): {sys.executable}")
EOF

python3 -S /tmp/audit_pth.py`}
</PromptCard>

**Lesen Sie die Ausgabe richtig.** Ein Treffer ist kein Befund. In einem frischen Virtualenv mit nichts als `setuptools` meldet dies **eine** ausführbare Zeile, und sie ist legitim:

```
.../site-packages/distutils-precedence.pth:1: import os; var = 'SETUPTOOLS_USE_DISTUTILS'; ...
```

Das ist `setuptools`, das seinen distutils-Shim installiert, und es ist die häufigste legitime Nutzung des Mechanismus. Editable Installs (`__editable__*.pth`) sind eine weitere. Das Signal, das Sie wollen, ist **eine ausführbare Zeile, die Sie keinem bewusst installierten Paket zuordnen können** — und eine Datei an der Wurzel von `site-packages`, deren Name zu keiner Distribution passt, die Sie benennen können, ist die stärkste Version dieses Signals. Auf den kompromittierten Hosts lautete der Name `cook`.

## Was es tatsächlich gestoppt hätte

Das ist die Tabelle, die Sie in Ihr eigenes Setup mitnehmen sollten. „Ja“ heißt, die Kontrolle blockiert diesen konkreten Angriff, nicht dass sie allgemein ausreicht.

| Kontrolle | Stoppt das hier? | Warum |
|---|---|---|
| **Dependency Cooldown** (3–7 Tage) | **Ja — und auch März** | Beide Releases wurden binnen Stunden zurückgezogen. Die einzige Kontrolle in dieser Tabelle, die auch den nächsten abdeckt. |
| Exakter Versions-Pin (`litellm==1.106.2`) | **Ja** | 1.107.0 gelangt nie in die Auflösung. Die wertvollste Einzelkontrolle hier. |
| Hash-Pinning (`pip install --require-hashes`) | **Ja** | Gleicher Grund, und es fängt zusätzlich ein erneutes Hochladen unter einer bestehenden Versionsnummer. |
| Lockfile eingecheckt und in der CI befolgt | **Ja** | Das 100-Minuten-Fenster erreicht nur Resolver, die eine neue Version wählen dürfen. |
| `pip install -U` / ungepinnte Installationen in diesem Fenster | **Nein** | Genau diese traf es. |
| Docker `latest` / `main-latest` / `main-stable` | **Nein** | Alle drei wurden ~2,5 Stunden lang auf den vergifteten Digest umgebogen. |
| Docker-Pin **per Digest** | **Ja** | Ein Digest kann nicht umgebogen werden. |
| Trusted Publishing / PyPI-Attestierungen | **Nein** *(Schlussfolgerung)* | Der echte Workflow im echten Repo veröffentlichte es; die Provenance hätte sie korrekt benannt. |
| Docker-Image-Signierung | **Nein** | Die Signatur ist gültig; sie bescheinigt Herkunft, nicht Absicht. |
| Unveränderliche Docker-Tags | **Nein** | Das vergiftete Image war das erste je unter diesem Tag veröffentlichte Artefakt. |
| „sdists meiden, Wheels bevorzugen“ | **Nein** | Hier umgekehrt: Die Wheels waren vergiftet, und das sdist lieferte die Nutzlast nicht aus. |
| „Pakete mit Installationsskripten blockieren“ | **Nein** | Es gab keinen Installations-Hook. Die Nutzlast war eine Datendatei. |
| Aus dem Quelltext bauen (`--no-binary :all:`) | **Ja**, hier | Nur weil das sdist die Nutzlast-Dateien ausließ. Keine allgemeine Kontrolle. |
| Strikte Egress-Allowlist auf Entwickler-/CI-Hosts | **Teilweise** | Exfiltration an eine brandneue Domain über einfaches HTTP ist genau das, was eine Allowlist verweigert. |
| Response-Bodies in Ihrem Gateway nicht protokollieren | **Erstzugriff** | Hätte die Zugangsdaten entfernt, mit denen der Angreifer begann. |
| Kurzlebige, eng begrenzte GitHub-Tokens | **Erstzugriff** | Ein langlebiges Org-Owner-OAuth-Token in einem Log ist der ganze Dreh- und Angelpunkt. |

Die billigen und langweiligen Kontrollen gewinnen. **Setzen Sie einen Cooldown, pinnen Sie exakt, sperren Sie den Pin, ziehen Sie Images per Digest, und lassen Sie ein Gateway nicht aufbewahren, was es nicht braucht.** Beachten Sie, wie wenig davon mit der Prüfung von Code zu tun hat: Die drei Kontrollen oben in der Tabelle wirken genau deshalb, weil niemand etwas bemerken muss.

<Callout type="takeaways" items={["Eine .pth-Datei ist ein Code-Ausführungs-Primitiv, keine Pfadliste. Pythons site-Modul führt jede Zeile, die mit import beginnt, bei jedem Interpreterstart per exec aus, ohne dass das Paket importiert werden muss. Behandeln Sie sie als strikt gefährlicher als ein Installationsskript.", "Der Rat „Wheels bevorzugen“ betrifft die Ausführung bei der Installation und deckt die Ausführung beim Laufzeitstart nicht ab. Eine Zeile in einer Build-Konfiguration — data = \"cook\" — legte drei Dateien an die Wurzel von site-packages, ganz ohne Hook.", "Quelltext und Artefakt können sich widersprechen. Der Git-Tag war sauber und das sdist lieferte die Nutzlast nicht aus; nur die Wheels trugen sie, daher fand ein Diff des Repositorys nichts. Die einzige sichtbare Spur war eine Build-Konfigurationszeile, die in keinem öffentlichen Commit stand.", "Lieferketten-Signierung beantwortet „Kam das aus der echten Pipeline?“ — und hier lautete die Antwort legitimerweise ja. Sie beantwortet nicht „Hat die echte Pipeline den echten Quelltext gebaut?“, und genau dort rutschte eine Lookalike-Organisation mit einem Bindestrich Unterschied durch.", "Ein AI-Gateway ist der wertvollste Host in einem KI-Stack: jeder Provider-Schlüssel, jeder Prompt und — wenn Sie Response-Bodies protokollieren — alle Tokens, die Ihre Coding-Agenten im selben Kanal tragen. Stufen Sie seine Logs als Geheimnisse ein oder bewahren Sie sie nicht mehr auf.", "Ausführbare .pth-Importzeilen sind in Python 3.15 veraltet und werden in 3.20 entfernt, ersetzt durch explizite .start-Dateien. Auditieren Sie Ihre jetzt, mit python -S, und erwarten Sie, dass setuptools ein legitimer Treffer ist.", "Das war LiteLLMs zweite Kompromittierung des Jahres 2026, und die erste begann mit einer ungepinnten Abhängigkeit in der Build-Pipeline. Pinning ist nicht nur, wie Sie sich vor einem vergifteten Release schützen — es ist auch, wie ein Projekt vermeidet, eines zu veröffentlichen.", "Die beste Einzelkontrolle ist ein Dependency Cooldown, weil er die einzige ist, die nicht davon abhängt, dass jemand etwas bemerkt. Beide LiteLLM-Releases wurden binnen Stunden zurückgezogen; ein 3-Tage-Cooldown hätte beide zu einem Nicht-Ereignis gemacht. Dependabot wendet standardmäßig bereits 3 Tage an, und nie auf Sicherheits-Updates."]} />

<Flashcards title="Neun Begriffe aus diesem Vorfall" cards={[
  {front: ".pth-Datei", back: "Eine Datei in site-packages, normalerweise eine Liste von Verzeichnissen, die an sys.path angehängt werden. Eine Zeile, die mit „import“ plus Leerraum beginnt, wird stattdessen vom site-Modul bei jedem Interpreterstart mit exec() ausgeführt. In Python 3.15 veraltet, Entfernung für 3.20 geplant."},
  {front: "sitecustomize.py", back: "Ein Modulname, den das site-Modul bei jedem Start zu importieren versucht, by design, als Administrator-Hook. Braucht keine .pth-Datei zum Feuern, und jede Ausnahme beim Import wird stillschweigend verschluckt."},
  {front: "python -S", back: "Unterdrückt den automatischen Import des site-Moduls: keine .pth-Verarbeitung, kein sitecustomize, kein usercustomize. Nutzen Sie es beim Auditieren einer verdächtigen Umgebung, damit das Audit die Nutzlast nicht ausführt."},
  {front: "Wheel-Datenverzeichnis", back: "Dateien, die ein Wheel als Daten deklariert, werden in die Umgebungswurzel kopiert — bei purelib ist das site-packages selbst. Hier lieferte eine Zeile (data = \"cook\") unter der Maturin-Build-Konfiguration cook.pth, cook.py und sitecustomize.py ganz ohne Code bei der Installation aus."},
  {front: "privcollect", back: "Der Eigenname des Stealers. Sechzehn Kategorien: Browser-Passwörter und -Cookies, SSH- und GPG-Schlüssel, AWS/Azure/GCP-Zugangsdaten, Kubernetes-Konfigurationen, CI-Geheimnisse, Shell- und DB-Historie, jede Prozessumgebung über /proc, Tokens von KI-Coding-Tools und ein Prisma-Dump der LiteLLM-Proxy-Datenbank."},
  {front: "Lookalike-Repository", back: "Berri-AI/litellm, einen Bindestrich von BerriAI/litellm entfernt. Der Release-Workflow im echten Repo wurde per Force-Push so geändert, dass er daraus baute, sodass Publishing-Identität, Signatur und Provenance alle echt blieben, die Quelle aber nicht."},
  {front: "Trusted Publishing", back: "Bindet ein veröffentlichtes Artefakt an den konkreten Workflow und das Repository, die es erzeugt haben, und ersetzt langlebige API-Tokens. Es war vorhanden und es wurde erfüllt: Der echte Workflow im echten Repo veröffentlichte die Malware."},
  {front: "Unveränderliche Tags", back: "Verhindert, dass ein veröffentlichter Container-Tag später umgebogen wird. Nutzlos, wenn das erste Artefakt unter dem Tag bereits bösartig ist — und irrelevant für die Floating Tags (latest, main-stable), die darauf umgebogen wurden."},
  {front: "Remote-Code-Loader", back: "Die sitecustomize-Nutzlast: ein losgelöster Daemon (setsid, cwd /, I/O nach /dev/null), der stündlich aufwacht, seinen nächsten C2-Host aus einem GitHub-Dead-Drop auflöst, /codepy per einfachem HTTP abruft und über exec() ausführt. Abgesichert durch /tmp/remote_code_loader.lock."}
]} />

<Quiz title="Testen Sie sich selbst" questions={[
  {q: "Ein Host installierte litellm 1.107.0 um 11:50 UTC in ein Virtualenv, und auf diesem Host importierte nie etwas litellm. Wie groß ist die Exposition?", options: ["Keine — die Nutzlast läuft nur beim Import", "Voll — cook.pth wird bei jedem Interpreterstart vom site-Modul von Python ausgeführt, also führte jeder Python-Prozess in dieser Umgebung den Stealer aus", "Nur wenn der LiteLLM-Proxy gestartet wurde", "Nur unter Windows"], answer: 1, explain: "Das ist der zentrale Mechanismus. Eine 12 Byte große .pth-Datei mit „import cook“ wird beim Interpreterstart vom site-Modul per exec ausgeführt. Jeder Python-Prozess in dieser Umgebung — ein Cron-Job, ein --version-Check, ein unabhängiges Skript — führte beide Nutzlasten aus. Die Empfehlung der Maintainer ist, den Host als vollständig kompromittiert zu behandeln."},
  {q: "Ihre Richtlinie lautet „Wheels gegenüber sdists bevorzugen, weil sdists bei der Installation setup.py ausführen können.“ Wie schnitt diese Richtlinie hier ab?", options: ["Sie verhinderte die Kompromittierung", "Sie war sachlich korrekt, kehrte aber das Ergebnis um: Nur die Wheels trugen die Nutzlast, die das sdist nicht auslieferte", "Sie ist falsch — Wheels führen bei der Installation Code aus", "Sie machte so oder so keinen Unterschied"], answer: 1, explain: "Die Weisheit stimmt: Wheels werden durch Kopieren von Dateien entpackt, ohne Ausführung bei der Installation. Die Nutzlast brauchte schlicht keine. Eine Zeile in der Maturin-Build-Konfiguration lieferte drei Dateien als Wheel-Daten nach site-packages — und das sdist enthielt das Verzeichnis cook/ gar nicht, ein Build aus dem Quelltext hätte die Nutzlast also nicht installieren können."},
  {q: "LiteLLM hatte seit März Trusted Publishing, Docker-Image-Signierung und unveränderliche Tags. Warum blockierte keines davon dieses Release?", options: ["Sie waren falsch konfiguriert", "Der Angreifer stahl das PyPI-API-Token", "Der Angreifer nutzte die echte Pipeline und änderte nur, welche Quelle sie baute — Provenance und Signaturen bescheinigten korrekt eine echte Herkunft für ein vergiftetes Artefakt", "Signierung deckt nur sdists ab"], answer: 2, explain: "Der bösartige Workflow lief im echten Repository mit der echten Publishing-Identität und checkte das Lookalike Berri-AI/litellm aus. Diese Kontrollen beantworten „Kam das aus der echten Pipeline des Projekts?“ — und die ehrliche Antwort war ja. Sie sind nicht darauf ausgelegt, „Hat die echte Pipeline den echten Quelltext gebaut?“ zu beantworten."},
  {q: "Wie kam der Angreifer laut dem Post-Mortem der Maintainer zuerst an die GitHub-Zugangsdaten der Entwickler?", options: ["Eine Phishing-Kampagne gegen Maintainer", "Eine durchgesickerte .env-Datei in einem öffentlichen Commit", "Aus den Logs einer mit dem Internet verbundenen internen LiteLLM-Instanz, in der das GitHub-CLI-OAuth-Token eines Coding-Agenten in protokollierten Response-Bodies auftauchte", "Durch Knacken von 2FA"], answer: 2, explain: "Das Post-Mortem hält fest, dass Claude Code das GitHub-CLI-OAuth-Token eines Nutzers in einen Response-Body einbettet und dass diese Tokens, wo Response-Bodies protokolliert werden, in LiteLLM-Logs auftauchen können. Der Angreifer erreichte diese öffentlich exponierte interne Instanz und las die Zugangsdaten von drei Entwicklern — einer davon ein Org-Owner — aus ihren Logs."},
  {q: "Welches Paar von Kontrollen hätte diesen Angriff am günstigsten blockiert?", options: ["PyPI-Attestierungen plus Image-Signierung", "Ein exakter Versions-Pin in einem eingecheckten Lockfile, plus das Ziehen von Container-Images per Digest", "Statische Analyse des Paket-Quelltexts", "Das Blockieren von Paketen, die Installationsskripte deklarieren"], answer: 1, explain: "Beide signaturbasierten Kontrollen wurden vom vergifteten Release erfüllt, und es gab keine Installationsskripte zu blockieren — während Quelltextanalyse nichts gefunden hätte, da der öffentliche Quelltext sauber war. Die langweiligen Kontrollen gewinnen: Ein gepinntes Lockfile bedeutet, dass 1.107.0 nie in die Auflösung gelangt, und ein Digest lässt sich nicht umbiegen, wie es bei latest, main-latest und main-stable alle geschah."},
  {q: "Beide LiteLLM-Kompromittierungen wurden binnen Stunden erkannt und zurückgezogen — 2 h 32 min im März, etwa 1 h 43 min im Oktober. Welche konsumentenseitige Kontrolle macht daraus nahezu vollständigen Schutz?", options: ["Den Diff jedes Abhängigkeits-Updates lesen", "Ein Dependency Cooldown: sich weigern, ein Release aufzulösen, das jünger als 3–7 Tage ist", "Einen Schwachstellen-Scanner in der CI laufen lassen", "Eine Security-Mailingliste abonnieren"], answer: 1, explain: "Das ist PyPIs eigene wichtigste Empfehlung an Konsumenten und die einzige Kontrolle in der Tabelle, die neben diesen beiden auch den nächsten Vorfall abdeckt. Bei etwa 1.700 Installationen pro Minute wird die Erkennung der Exposition nie davonlaufen — aber ein Cooldown von drei Tagen macht einen binnen Stunden eingedämmten Vorfall für Sie irrelevant. uvs exclude-newer, Renovates minimumReleaseAge und Dependabots cooldown setzen es alle um; Dependabot wendet auch unkonfiguriert einen 3-Tage-Standard an, und nie auf Sicherheits-Updates."},
  {q: "Im März 2026 legte litellm 1.82.7 seine Nutzlast in proxy_server.py, und 1.82.8 lieferte stattdessen litellm_init.pth aus. Was sagt Ihnen diese Änderung?", options: ["Der Angreifer verlor den Zugang und musste von vorn beginnen", "Der Angreifer eskalierte von einer Nutzlast, die verlangt, dass das Opfer das Paket benutzt, zu einer, die bei jedem Interpreterstart feuert", "1.82.8 war ein gescheiterter Versuch", "Nichts — die beiden sind gleichwertig"], answer: 1, explain: "Es ist dieselbe Kampagne, die das Primitiv entdeckt. Eine Nutzlast auf Modulebene läuft nur, wenn jemand LiteLLM importiert und benutzt; eine .pth läuft bei jedem Python-Start in der Umgebung, egal was. Die 12 Byte große cook.pth vom Oktober begann dort, wo der März endete, weshalb „Code auf Modulebene“ zu „.pth-Dropper“ eine zu erwartende Entwicklung ist und kein einmaliger Trick."},
  {q: "Sie lassen das .pth-Audit auf einer Entwicklermaschine laufen, und es meldet eine ausführbare Zeile in distutils-precedence.pth. Was sollten Sie schließen?", options: ["Die Maschine ist kompromittiert", "Nichts ist falsch — das ist der distutils-Shim von setuptools, die häufigste legitime Nutzung des Mechanismus", "Die Datei muss sofort gelöscht werden", "Python muss neu installiert werden"], answer: 1, explain: "Ein Treffer ist kein Befund. setuptools liefert distutils-precedence.pth mit einer echten ausführbaren Importzeile aus, und Editable Installs fügen __editable__*.pth hinzu. Das Signal ist eine ausführbare Zeile, die Sie keinem bewusst installierten Paket zuordnen können — etwa eine Datei namens cook, die zu keiner Distribution auf dem System passt."}
]} />

## Quellen und weiterführende Literatur

- **LiteLLM** — *Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised*: https://docs.litellm.ai/blog/security-incident-oct-21-2026 — das Post-Mortem der Maintainer und die Primärquelle für Zeitleiste, Credential-Diebstahl-Kette, das Lookalike-Repository, die frühere Härtung und die Abhilfeschritte.
- **Python documentation** — `site` — *Site-specific configuration hook*: https://docs.python.org/3/library/site.html — die maßgebliche Beschreibung der `.pth`-Verarbeitung, der `import`-Zeilen-Regel, der Deprecation in 3.15 und Entfernung in 3.20, `.start`-Dateien, `sitecustomize`/`usercustomize` und des `-S`-Flags.
- **StepSecurity** — *litellm 1.107.0 Compromised on PyPI: Backdoored Wheels Drop a Credential Stealer and an Hourly Remote Code Loader*: https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer — Dateigrößen und Hashes, die sechzehn Kategorien des Stealers, die Daemonisierung und der Dead Drop des Loaders, die Exfiltrations-Header und die IOC-Liste.
- **SafeDep** — *Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor*: https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/ — der Befund, dass das sdist den Ordner `cook/` auslässt und dass kein öffentlicher Commit `data = "cook"` enthält. Das war der Artikel, der die Hacker-News-Startseite erreichte.
- **JFrog Security Research** — *LiteLLM Hijacked Again: Malicious 1.107.0 Wheels Steal Credentials*: https://research.jfrog.com/post/litellm-hijacked-again/ — die erste Kompromittierung im März 2026 (ungepinntes Trivy 0.69.4 in der Build-Pipeline, manipulierte 1.82.7/1.82.8, XRAY-955589), die übereinstimmenden ZIP-Zeitstempel, die auf Injektion zur Build-Zeit hinweisen, und die Beobachtung, dass schon ein `pip`-Befehl die Nutzlast auslöst.
- **Wiz** — *LiteLLM Compromised, Steals Credentials*: https://www.wiz.io/blog/litellm-compromised-steals-credentials — eine unabhängige Darstellung des Expositionsfensters, der betroffenen Distributionen und Container-Tags.
- **The Hacker News** — *LiteLLM Suspects GitHub Token Leak in AI Gateway Logs Behind Malicious Package Release*: https://thehackernews.com/2026/10/litellm-suspects-github-token-leak-in.html — unabhängige Berichterstattung über die Grundursache in den Gateway-Logs.
- **Hacker-News-Diskussion** — *Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor*: https://news.ycombinator.com/item?id=50181114 — der Startseiten-Thread, 519 Punkte und 170 Kommentare Stand 22.10.2026.
- **Datadog Security Labs** — *LiteLLM compromised on PyPI: the TeamPCP supply-chain campaign*: https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/ — der Vorfall vom März 2026, einschließlich `litellm_init.pth` in 1.82.8 gegenüber der Nutzlast auf Modulebene in 1.82.7, der Exfiltrationsdomain und der systemd-Persistenz.
- **PyPI-Blog** — *Incident report: LiteLLM and Telnyx supply-chain attack* (2026-04-02): https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/ — die Zahlen ~1.700 Installationen/Minute und 119.000 Downloads, die Zeiten der Quarantäne und PyPIs eigene Empfehlung für Dependency Cooldowns.
- **LiteLLM** — *Security Update: Suspected Supply Chain Incident* (März 2026): https://docs.litellm.ai/blog/security-update-march-2026 — der erste Vorfallsbeitrag der Maintainer.
- **uv** — Referenz der Einstellung `exclude-newer`: https://docs.astral.sh/uv/reference/settings/ — akzeptiert RFC-3339-Zeitstempel, verständliche Dauern und ISO-8601-Dauern wie `P7D`.
- **GitHub Docs** — Dependabot-Optionsreferenz, `cooldown`: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — die Unterschlüssel, der auch unkonfiguriert angewendete 3-Tage-Standard und die dokumentierte Tatsache, dass Cooldown nicht für Sicherheits-Updates gilt.
- **Renovate** — Konfigurationsoption `minimumReleaseAge`: https://docs.renovatebot.com/configuration-options/#minimumreleaseage — die am längsten bestehende Umsetzung der Idee.
- **PyPI** — Projektseite `litellm`: https://pypi.org/project/litellm/ — 1.107.0 fehlt; 1.106.2 ist aktuell. PyPIs Provenance-API für eine bestimmte Datei: https://docs.pypi.org/api/integrity/
- **BerriAI/litellm** (das echte Repository): https://github.com/BerriAI/litellm

## Weiter

- [Code von Drittanbietern prüfen](/docs/security/reviewing-third-party-code) — die allgemeine Review-Disziplin für Abhängigkeiten, nachdem dieser Vorfall gezeigt hat, dass das Lesen des Repos nicht dasselbe ist wie das Lesen des Artefakts
- [AI-Gateways: LiteLLM, OpenRouter, Portkey](/docs/models/ai-gateways-litellm-openrouter-portkey) — wofür ein Gateway da ist, und die Logging- und Schlüsselverwaltungsentscheidungen, die Sie laut dieser Seite überdenken sollten
- [GemStuffer: Wie OpenAI-Agenten RubyGems angriffen](/docs/security/rubygems-gemstuffer-rogue-agents) — die andere Registry-Kompromittierung von 2026, bei der die Registry der Verbreitungsmechanismus war und nicht das Ziel
