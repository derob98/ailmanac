# Deine Permission-Allowlist ist ein Credential-Speicher: 1.122 settings.local.json-Dateien, die Geheimnisse leaken

> Source: https://derob98.github.io/ailmanac/de/docs/security/permission-allowlists-leak-secrets · AILmanac (CC BY 4.0) · last verified 2026-11-10

Apiiro fand 104.185 öffentliche Kopien von .claude/settings.local.json und 1.379 echte Geheimnisse in 1.122 davon, weil „Yes, and don't ask again“ den genehmigten Befehl wortwörtlich speichert, Zugangsdaten inklusive. Warum 215 dieser Dateien sowohl gitleaks als auch TruffleHog umgingen, warum der gitignore-Schutz von Claude Code in deine GLOBALE Excludes-Datei schreibt und deshalb nicht mitwandern kann, die mediane Expositionsdauer von 217 Tagen und die Reihenfolge „erst rotieren, dann löschen“, die die meisten Berichte falsch herum darstellen.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={[
  "Den Mechanismus verstehen: Das Genehmigen eines Befehls schreibt diesen Befehl dauerhaft, wortwörtlich und samt Zugangsdaten, in eine Datei in deinem Repository",
  "Verstehen, warum 215 der leakenden Dateien sowohl gitleaks als auch TruffleHog umgingen und was das über jeden Secret-Scanner aussagt, den du betreibst",
  "Genau wissen, was der eingebaute gitignore-Schutz von Claude Code tut, warum er auf deinem Laptop funktioniert und den strukturellen Grund, warum er deine Teamkollegen oder deine CI nicht schützen kann",
  "Den Fünf-Befehle-Audit auf deinen eigenen Repositories ausführen, einschließlich der Git-Historie, in der das Löschen der Datei nichts ändert",
  "Die richtige Reihenfolge bei der Behebung anwenden, erst rotieren, dann aufräumen, und verstehen, warum die umgekehrte dich exponiert lässt",
  "Von der Genehmigung literaler Befehle auf die Genehmigung von Patterns umstellen, die eine Gewohnheitsänderung, die die ganze Problemklasse beseitigt",
  "Die offene Meinungsverschiedenheit zwischen Apiiros Daten und Anthropics Erklärung lesen und entscheiden, gegen welche Annahme du entwickelst",
]} />

Am **5. November 2026** veröffentlichten die Apiiro-Forscher **Shmulik Cohen** und **Matan Giladi** eine Untersuchung des öffentlichen GitHub nach einem einzigen Dateinamen: `.claude/settings.local.json`. Sie fanden **104.185 Kopien in 103.617 Repositories**. In **1.122 dieser Dateien**, etwa **1,1 %**, fanden sie **1.379 echte Geheimnisse**.

Vier Tage später erreichte der Hacker-News-Thread mit 622 Punkten und 422 Kommentaren die Startseite. Es folgte der übliche Rat: Committe deine Konfigurationsdateien nicht.

Dieser Rat ist richtig und verfehlt den Mechanismus vollständig. Drei Details machen das zu einer eigenen Seite:

1. **Niemand hat ein Geheimnis in eine Konfigurationsdatei gepastet.** Sie tippten Zugangsdaten in einen Shell-Befehl, das Normalste der Welt beim Debuggen einer Datenbank, und klickten dann auf **„Yes, and don't ask again“.** Claude Code speicherte den genehmigten Befehl *als Permission-Regel*. Die Zugangsdaten wurden Teil des Eintrags, der den Befehl beim nächsten Mal autorisiert.
2. **215 der leakenden Dateien überlisteten beide branchenüblichen Secret-Scanner.** Nicht, weil die Scanner schlecht wären, sondern weil ein Passwort hinter `PGPASSWORD=` oder `sshpass -p` kein Provider-Präfix, kein Schlüsselformat und keine auffällige Entropie hat. Es sieht aus wie ein gewöhnliches Wort in einer gewöhnlichen Kommandozeile.
3. **Claude Code versucht, dich zu schützen, und der Schutz kann strukturell nicht mitwandern.** Er schreibt die Ignore-Regel in deine **globale** Git-Excludes-Datei. Diese Datei liegt in deinem Home-Verzeichnis. Sie ist nicht im Repository, erreicht also weder den Clone deiner Teamkollegin, noch deinen CI-Runner, noch deinen nächsten Laptop.

Das ist keine Prompt-Injection-Geschichte, und es gibt keinen Exploit. Es ist ein autorisierter Workflow, dessen Audit-Trail zufällig eine Secrets-Datei ist, eine weit langlebigere Problemkategorie, die für jeden Agenten gilt, der Genehmigungen persistiert.

<VerifyNote lastVerified="2026-11-10" source="Apiiros Forschung von Shmulik Cohen und Matan Giladi, veröffentlicht am 5. November 2026 auf apiiro.com/blog/coding-agents-leaking-secrets-github-dont-ask-again, wie von iTnews, iTWire, GBHackers, i10x und MLQ berichtet (Apiiros eigene Seite liefert 403 auf automatisierte Abrufe); Anthropics Antwort über Boris Cherny auf Hacker News Item 50408126, 7. November 2026; Claude-Code-Dokumentation zu Einstellungen und Berechtigungen auf code.claude.com.">
Alle Zahlen stammen von Apiiro selbst, aus einer Erhebung auf öffentlichem GitHub, die als **1.–3. November 2026** umfassend berichtet wird (dieser Zeitraum ist nur durch iTWire belegt). Apiiro klassifizierte Kandidaten mit einem Filter plus einem LLM-Prüfer anhand einer Rubrik und **testete keine Zugangsdaten**; eine benachrichtigte Organisation bestätigte, dass ihr Schlüssel aktiv gewesen war. Apiiro verkauft Sicherheitsprodukte für Anwendungen und Agenten: Lies die Summen als Herstellerstudie, die nicht unabhängig reproduziert wurde. **Weder eine CVE noch eine Schweregrad-Bewertung wurde von irgendjemandem vergeben.** Stand 8. November 2026 gab es **keinen bestätigten Produkt-Fix und keine Versionsnummer**: Die kursierende Behauptung, neuere Claude-Code-Versionen lösten das Problem, ließ sich nicht verifizieren. Das unten beschriebene Verhalten der globalen Git-Excludes wurde am **2026-11-10 lokal reproduziert**: Bei nicht gesetztem `core.excludesFile` enthielt `~/.config/git/ignore` als erste Zeile exakt `**/.claude/settings.local.json`. Der Scanner-Vergleich trägt einen im jeweiligen Abschnitt vermerkten Vorbehalt mit nur einer Quelle.
</VerifyNote>

## Die Zahlen

| Was Apiiro gezählt hat | Wert |
|---|---|
| Öffentliche Kopien von `.claude/settings.local.json` | **104.185** in **103.617** Repositories |
| Dateien mit mindestens einem echten Geheimnis | **1.122** (≈1,1 %) |
| Unterschiedliche Geheimnisse in diesen aktuellen Kopien | **1.379** |
| Betroffene Organisationen | **63**, überwiegend Softwareunternehmen |
| Zusätzliche Geheimnisse, die nur in **älteren Git-Historie-Versionen** gefunden wurden | **734** in **509** Repositories |
| Forks, die dieselben Geheimnisse weitertragen | **211 Forks** von **74** Repositories |
| Geheimnisse in der *geteilten* `.claude/settings.json` | **298** von **76.011** öffentlichen Kopien, meist innerhalb von Allow-Regeln |
| **Gesamt inklusive Historie, geteilter Einstellungen und gespeicherter Agent-Transkripte** | **2.539 Geheimnisse in 1.994 Repositories** |
| Mediane Zeit, die die Dateien mit Geheimnissen auf dem Default-Branch lagen | **≈217 Tage** |

Die letzte Zeile ist die, bei der man innehalten sollte. Die mediane Exposition war nicht Stunden. Sie war **etwa sieben Monate**.

### Welche Art von Geheimnissen

| Typ | Anzahl |
|---|---|
| Datenbankpasswörter | **379** |
| Supabase-Service-Role-Keys | **122** |
| Supabase-Account-Tokens | **103** |
| SSH-Logins für öffentliche Server (teils root, innerhalb von `sshpass`-Befehlen) | **43** |
| GitHub-, GitLab- und npm-Tokens (zusammen) | **42** |
| AWS-Schlüssel | **23** |
| Private Schlüssel | **6** |

Mehr als ein **Drittel** der Geheimnisse öffnete direkt eine Datenbank. Unter den berichteten schlimmsten Fällen sind der Cloud-API-Key eines Datenbankanbieters mit Verwaltungszugriff, das Produktions-Token des Zahlungsdienstleisters einer Softwareagentur und das Owner-Passwort der Cloud-Datenbank einer Anwendung für Patientenakten.

Nach Klassifizierungsmethode teilen sich die 1.379 in **636** Werte, die einem bekannten Provider-Schlüsselformat entsprechen, und **743** Passwörter oder Tokens neben einer öffentlichen Serveradresse. Merke dir diese Aufteilung: Sie erklärt das Scanner-Ergebnis weiter unten. *(Die Zeilen mit den 103 Account-Tokens und 6 privaten Schlüsseln sowie die Aufteilung 636/743 werden von nur einem Medium berichtet; der Rest ist durch mehrere belegt.)*

## Teil 1 — Der Mechanismus, genau

Claude Code fragt vor dem Ausführen der meisten Shell-Befehle nach. Die Abfrage bietet eine persistente Option, **„Yes, and don't ask again“**, und deren Wahl schreibt eine `allow`-Regel in `.claude/settings.local.json` im Wurzelverzeichnis deines Repositorys. Die Genehmigung ist **für dieses Repository und diesen Befehl dauerhaft** und gilt für künftige Sessions, einschließlich Worktrees.

Die Form der Datei ist gewöhnlich:

<PromptCard title="Die sichere Form: eine Pattern-Regel aus der Dokumentation von Claude Code selbst">{`{
  "permissions": {
    "allow": ["Bash(npm run test *)"],
    "deny": ["Read(./.env)", "Read(./.env.*)"]
  }
}`}</PromptCard>

Hier ist der Angelpunkt. **Manchmal ist die gespeicherte Regel ein Pattern** wie das obige. **Manchmal ist sie der exakte Befehl, wie getippt.** Ist es der exakte Befehl, wird jedes Zeichen dieses Befehls, auch ein Passwort, das du inline übergeben hast, Teil des Regel-Strings.

Der Fehler braucht also weder einen Fehltritt noch einen Angreifer. Er braucht einen normalen Nachmittag:

<Steps items={[
  {title: "Du debuggst eine Datenbank und gibst Claude deshalb einen funktionierenden Befehl", body: "Du tippst, oder Claude schlägt aus einer eben gelesenen Konfigurationsdatei vor, etwas mit den Zugangsdaten inline: ein psql-Aufruf mit vorangestellter PGPASSWORD-Zuweisung, ein sshpass-Login, ein mysql-Aufruf mit dem am Flag hängenden Passwort. So hat man diese Werkzeuge schon immer aus einer Shell bedient."},
  {title: "Es funktioniert, und es wird wieder gebraucht", body: "Du führst es in dieser Stunde noch fünfzehnmal aus. Die Permission-Abfrage erscheint zum fünfzehnten Mal. Du wählst „Yes, and don't ask again“, wofür diese Option genau da ist und was jeder Leitfaden gegen Prompt-Ermüdung empfiehlt."},
  {title: "Der Befehl wird wortwörtlich zur Regel", body: "Claude Code hängt einen Allow-Eintrag mit dem vollständigen Befehlstext an. Die Zugangsdaten sind nun eine Zeile in einer JSON-Datei in deinem Repository. Nichts hat dich gewarnt, denn noch ist nichts falsch."},
  {title: "Irgendwann committet jemand oder etwas die Datei", body: "Vielleicht ein Teamkollege, der geklont hat, bevor es irgendeine Ignore-Regel gab. Vielleicht ein „git add -A“ in einem Ordner, der erst nachträglich ein Repository wurde. Vielleicht die CI. Apiiro wies in 539 von 1.105 untersuchten Repositories Commits mit Claude als Co-Autor nach, die die Datei berührten, eine Zahl, die Anthropics eigene Erklärung bestreitet, siehe unten."},
  {title: "Sie liegt dort im Median 217 Tage", body: "Es schlägt kein Alarm an, weil die beiden Scanner, die am ehesten zuschauen, das Durchgesickerte nicht sehen können, und darum geht es im nächsten Abschnitt."},
]} />

<Callout type="warning" items={[
  "Das ist eine Eigenschaft von Claude Code, nicht eines Modells: Apiiro reproduzierte das Schreibverhalten sowohl mit Opus 5.5 als auch mit Fable 5.1. Ein Modellwechsel bringt nichts. Apiiro verglich außerdem die Dokumentation von 16 Coding-Agenten und berichtete Claude Code als den einzigen, für den bestätigt ist, dass er standardmäßig den vollständigen genehmigten Befehl in eine Projektdatei speichert, aber „bestätigt“ leistet in diesem Satz einiges, und Designs mit persistierten Genehmigungen sind verbreitet. Prüfe den Agenten, den du einsetzt, statt dich sicher zu fühlen, weil du einen anderen nutzt.",
]} />

## Teil 2 — Warum 215 Dateien beide Scanner umgingen

Apiiro ließ die leakenden Dateien durch die beiden am weitesten verbreiteten Open-Source-Secret-Scanner laufen. Von den **1.122** Dateien mit Geheimnissen:

| Scanner | Markierte Dateien |
|---|---|
| gitleaks | **564** |
| TruffleHog | **643** |
| **Von keinem der beiden markiert** | **215** |

Das sind **19 % der leakenden Dateien, unsichtbar für beide Werkzeuge**. Der Grund ist die Aufteilung 636/743 von vorhin.

Ein Scanner findet Geheimnisse auf zwei Wegen: Er gleicht **bekannte Formate** ab (ein `AKIA…`-Präfix, ein `ghp_…`-Token, die Form eines Supabase-JWT) oder markiert **Strings mit hoher Entropie** an verdächtigen Stellen. Beide Techniken funktionieren bei *ausgestellten Zugangsdaten*, die darauf ausgelegt sind, erkennbar zu sein.

Keine von beiden funktioniert bei einem **von einem Menschen gewählten Passwort** an der Argumentposition eines Shell-Befehls. `PGPASSWORD=Summer2024!` hat kein Hersteller-Präfix zum Abgleichen. Seine Entropie ist unauffällig. Strukturell ist es nicht zu unterscheiden von einem Konfigurationswert, einer Test-Fixture oder einem Wort. Die Fehlschläge waren überwiegend genau von dieser Art: Inline-Passwörter hinter `PGPASSWORD=`, `sshpass -p` und `mysql -p`.

<Callout type="note" items={[
  "Ein Vorbehalt zur Aufteilung 564/643, von nur einem Medium berichtet: Beide Scanner liefen OHNE ihren Verifikationsschritt, den Modus, in dem ein Werkzeug versucht zu bestätigen, dass eine Kandidaten-Zugangsdaten aktiv sind. Verifikation verbessert vor allem die Präzision, nicht den Recall, und sie kann bei einem Passwort nicht helfen, das gar keiner Regel entspricht, daher ist die Zahl 215 wohl kein Artefakt davon. Aber wenn du die Zahlen je Scanner zitierst, zitiere den Vorbehalt mit.",
]} />

Die verallgemeinerbare Lehre ist unabhängig von diesem Vorfall: **Dein Secret-Scanning ist auf ausgestellte Tokens abgestimmt und weitgehend blind für gewählte Passwörter in Befehlsargumenten.** Agent-Konfigurationsdateien und gespeicherte Transkripte sind voller Befehlsargumente. Wenn du nur `.claude/` zu den Pfaden deines Scanners hinzufügst und an seinen Regeln nichts änderst, fängst du etwa vier Fünftel dieses Problems ab.

## Teil 3 — Der gitignore-Schutz, der nicht mitwandern kann

Claude Code ist dem nicht gleichgültig. Beim ersten Schreiben von `settings.local.json` in ein Repository, das sie noch nicht ignoriert, fügt es eine Ignore-Regel hinzu, und zwar **in deine globale Git-Excludes-Datei**, nicht in die `.gitignore` des Projekts.

Das lässt sich auf deinem Rechner mit zwei Befehlen bestätigen:

<PromptCard title="Prüfe, dass der Schutz existiert, und sieh, wo er liegt">{`# Where Git looks for your personal excludes.
# If this prints nothing, Git uses the XDG default: ~/.config/git/ignore
git config --get core.excludesFile

# The rule Claude Code writes:
grep -n 'claude' ~/.config/git/ignore`}</PromptCard>

Auf diesem Rechner am 10. November 2026 ausgeführt, war `core.excludesFile` nicht gesetzt, und die erste Zeile von `~/.config/git/ignore` lautete exakt `**/.claude/settings.local.json`. Der Schutz ist real, und er funktioniert.

Er kann trotzdem unmöglich ausreichen, aus vier Gründen, die alle strukturell und keine Bugs sind:

- **Eine globale Excludes-Datei wird nicht committet.** Sie liegt in deinem Home-Verzeichnis. Der Clone deines Teamkollegen hat sie nie gesehen. Ebenso wenig dein CI-Runner, dein Dev-Container oder dein nächster Laptop.
- **Sie hilft nicht rückwirkend bei einem Ordner, der erst später zum Repository wurde.** Viel Agent-Arbeit beginnt in einem Scratch-Verzeichnis und wird danach mit `git init` versehen.
- **Ignore-Regeln bewirken bei bereits getrackten Dateien nichts.** Das ist dokumentiertes Git-Verhalten, keine Einschränkung von Claude Code: Sobald ein Pfad im Index steht, ist `.gitignore` für ihn irrelevant.
- **Er schützt einen einzigen Dateinamen.** Die *geteilte* `.claude/settings.json` ist eine Datei, die Teams absichtlich committen, und auch 298 öffentliche Kopien davon enthielten Geheimnisse.

Deine Korrektur ist also klein und nicht optional: Trage den Pfad in die **eigene** `.gitignore` des Repositorys ein, wo er mit dem Projekt mitwandert.

<PromptCard title="Lass die Ignore-Regel mit dem Projekt mitwandern">{`# In the repo, not in your home directory.
printf '%s\\n' '.claude/settings.local.json' >> .gitignore

# Or ignore the whole agent config directory, which also covers
# transcripts and anything future versions add:
printf '%s\\n' '.claude/' >> .gitignore

git add .gitignore && git commit -m "chore: ignore local agent permission settings"`}</PromptCard>

## Teil 4 — Audit deiner eigenen Repositories

Fünf Prüfungen, der Reihe nach. Die dritte ist die, die Leute überspringen, und sie ist die, auf die es ankommt.

<PromptCard title="Der Fünf-Befehle-Audit">{`# 1. Is the file tracked RIGHT NOW?
git ls-files .claude/settings.local.json

# 2. Has it EVER been committed, on any branch?
#    An empty result from step 1 means nothing without this.
git log --all --oneline -- .claude/settings.local.json

# 3. Look for the secrets the scanners miss: inline passwords
#    in command arguments, across all of history.
git log --all -p -- .claude/ | grep -nE 'PGPASSWORD=|sshpass -p|mysql .*-p|MYSQL_PWD=|--password[= ]'

# 4. Confirm an ignore rule actually applies, and see which file it came from.
git check-ignore -v .claude/settings.local.json

# 5. Run the scanners over history too, not just the working tree.
gitleaks git -v          # gitleaks 8.19+; older: gitleaks detect -v
trufflehog git file://.`}</PromptCard>

Innerhalb einer Claude-Code-Session listet der Befehl `/permissions` jede aktive Regel auf **und aus welcher Datei jede stammt**, der schnellste Weg, einen literalen Befehl in einer Allowlist auf einem Rechner zu finden, auf dem nie etwas committet wurde.

Dann weite die Suche aus. Apiiros eigene Empfehlung lautet, die gesamte Organisation nach `.claude/settings.local.json` **und** `.claude/settings.json` zu durchkämmen, Historie eingeschlossen, auch in Repositories, in denen die Datei schon weg ist. Und da jeder Agent mit persistierten Genehmigungen dieselbe Art Datei hat, scanne die Geschwister: `.claude/`, `.cursor/`, `.gemini/`, `.specstory/`.

<Callout type="warning" items={[
  "Das Löschen der Datei entfernt das Geheimnis nicht. Es bleibt in der Git-Historie, in jedem Fork und in jedem Clone, den deine Kollegen schon haben. Apiiro fand 734 Geheimnisse, die NUR in älteren Versionen der Datei existierten, dazu 211 Forks von 74 Repositories, die Geheimnisse weitertrugen. Behandle Zugangsdaten, die je eine committete Datei berührt haben, als öffentlich.",
]} />

## Teil 5 — In der richtigen Reihenfolge beheben

Die meisten Berichte stellen das Aufräumen an den Anfang. Das ist verkehrt herum, und der Grund steht in der Zeile oben: Historie, Forks und Clones liegen außerhalb deiner Kontrolle, **das Bereinigen bringt dir also nichts, bevor die Zugangsdaten tot sind.**

<Steps items={[
  {title: "1. Rotiere jede Zugangsdaten, die die Dateien je enthalten haben", body: "Jedes Passwort, jedes Token, jeden Schlüssel, auch die, die nur in der Git-Historie sichtbar sind. Rotation ist der einzige Schritt, der die Exposition tatsächlich beendet; alles danach ist Hygiene. Apiiro testete keine der gefundenen Zugangsdaten, und eine benachrichtigte Organisation bestätigte, dass ihr Schlüssel aktiv gewesen war: Geh davon aus, dass es deiner ist."},
  {title: "2. Entferne die Regeln von den Rechnern aller Entwickler", body: "Öffne auf jedem Rechner .claude/settings.local.json, auch dort, wo nie etwas committet wurde, und lösche jeden Allow-Eintrag, der literale Zugangsdaten enthält. Nutze /permissions in einer Session, um sie aufzulisten und zu sehen, welche Datei welche enthält."},
  {title: "3. Entferne die Datei aus dem Tracking und trage sie in die .gitignore des Repositorys ein", body: "git rm --cached .claude/settings.local.json, dann den .gitignore-Eintrag committen, damit die Regel mit dem Projekt wandert, statt im Home-Verzeichnis einer einzelnen Person zu leben."},
  {title: "4. Schreibe Zugangsdaten gar nicht erst in den Befehlstext", body: "Referenziere sie per Variable aus einem Secrets-Manager, sodass der Befehl einen Namen statt eines Werts enthält. Beachte die scharfe Kante: Das Passwort in eine Inline-Umgebungsvariablen-Zuweisung auf der Kommandozeile zu schreiben, bringt das Literal trotzdem in den Befehlstext und damit auch in jede daraus abgeleitete Regel. Die Variable muss von woanders exportiert werden, nicht in dem Befehl zugewiesen, den du genehmigst."},
  {title: "5. Genehmige Patterns, nie literale Einmal-Befehle", body: "Das ist die Gewohnheitsänderung, die die ganze Problemklasse beseitigt. Bash(psql *) als Regel trägt kein Geheimnis; der exakte psql-Aufruf, den du eben ausgeführt hast, kann eines tragen. Wenn die Abfrage anbietet, einen Befehl zu merken, kürze ihn lieber zu einem Pattern."},
  {title: "6. Für Teams: mach es strukturell", body: "Nimm den Pfad in die .gitignore-Vorlagen deiner Organisation auf. Scanne .claude/, .cursor/, .gemini/ und .specstory/ im Pre-Commit und in der CI, Historie eingeschlossen. Und erweitere die Regeln deines Scanners so, dass sie Passwörter in Befehlsargumenten erkennen, nicht nur bekannte Schlüsselformate, sonst bildest du die Blindstelle der 215 Dateien in deiner eigenen Pipeline nach."},
]} />

<PromptCard title="Eine Deny-Regel ist eine günstige Zusatzversicherung zu alldem">{`{
  "permissions": {
    "allow": ["Bash(psql *)", "Bash(npm run test *)"],
    "deny": ["Read(./.env)", "Read(./.env.*)", "Read(./**/*.pem)"]
  }
}`}</PromptCard>

## Teil 6 — Die Meinungsverschiedenheit, die man kennen sollte

Anthropic antwortete öffentlich. Boris Cherny vom Claude-Code-Team schrieb am 7. November 2026 auf Hacker News:

> Historically Claude Code has not done secret scrubbing (there are many good tools for that), but we are looking into what we can do to prevent this.

(Auf Deutsch: Historisch hat Claude Code kein Secret-Scrubbing gemacht, dafür gibt es viele gute Werkzeuge, aber wir prüfen, was wir tun können, um das zu verhindern.)

Er fügte hinzu, `settings.local.json` sei keine Datei, die man in die Versionskontrolle einchecken solle, und die exponierten Kopien seien **„manually created and checked in“** gewesen (von Hand angelegt und eingecheckt), mit dem Argument: Da Claude Code die Ignore-Regel beim Anlegen der Datei hinzufügt, müssten committete Kopien von woanders stammen. Er empfahl den [Auto Mode](/docs/claude-code/permissions), der Aktionen durch einen Klassifikator prüft, statt Allow-Regeln anzuhäufen, dazu Secret-Scanning beim Git-Host. Erwogene Prototypen: dem Auto Mode beibringen, diese Befehle abzufangen, und ein einfaches Secret-Scanning einzubauen, mit dem Vorbehalt, dass es das Problem vielleicht nicht vollständig behebt. Als ein Kommentator darauf hinwies, dass dieselbe Exposition auch im Auto Mode passieren kann, lautete seine Antwort „Yeah good catch.“

**Diese Erklärung und Apiiros Daten passen nicht zusammen.** Apiiro berichtet Commits mit Claude als Co-Autor, die die Datei berührten, in **539 von 1.105** nachverfolgten Repositories. Apiiro weist sorgfältig darauf hin, dass Co-Autorschaft nicht beweist, dass Claude jede Zugangsdaten eingeführt oder gepusht hat: Der Commit kann eine bereits vorhandene Datei mitgenommen haben. Aber „von Hand angelegt und eingecheckt“ lässt sich schwer mit agent-verfassten Commits in der Hälfte der Stichprobe in Einklang bringen.

Du musst das nicht auflösen, um zu handeln, und die technische Schlussfolgerung ist in beiden Darstellungen dieselbe:

- Hat Anthropic recht, hängt der Schutz von einer Datei in deinem Home-Verzeichnis ab, und jede der vier strukturellen Lücken aus Teil 3 gilt weiterhin für dein Team.
- Hat Apiiro recht, sind vom Agenten verfasste Commits ein aktiver Weg der Datei in dein Repository, und der Schutz ist noch schwächer.

So oder so: Lege die Ignore-Regel ins Repository, genehmige Patterns statt Literale und scanne nach Inline-Passwörtern. Beachte außerdem, dass **nichts als behoben bestätigt ist**: keine Version, kein Changelog-Eintrag, keine CVE, keine Schweregrad-Bewertung, Stand 8. November 2026.

## Teil 7 — Das wurde 15 Monate früher gemeldet

Der Teil, der daraus eine Prozessgeschichte statt einer Bug-Geschichte macht:

| Wann | Was |
|---|---|
| **11. August 2025** | GitHub-Issue #5544 in `anthropics/claude-code` meldet, dass genehmigte Befehle API-Keys wortwörtlich speichern |
| **4. Dezember 2025** | Issue #13106 meldet, dass API-Keys über `settings.local.json` in ein öffentliches Repo gelangten, weil `.claude/` nicht ignoriert wurde; von einem Bot als Duplikat geschlossen |
| **3. Januar 2026** | Issue #5544 nach 60 Tagen Inaktivität **von einem Bot als „not planned“** geschlossen |
| **Februar 2026** | ironPeak beschreibt eine committete Claude-Einstellungsdatei mit genehmigten Befehlen samt Datenbankpasswörtern und API-Keys und veröffentlicht einen Scanner für KI-Konfigurationsdateien und deren Historie |
| **April** | Lakera berichtet Zugangsdaten in 33 solchen Dateien in 30 auf npm veröffentlichten Paketen *(Jahr in der Quelle nicht angegeben)* |
| **5. November 2026** | Apiiro veröffentlicht die Untersuchung der 104.185 Dateien |
| **6. November 2026** | Das jüngste von vier verwandten Issues, die die Forscher zitierten, wird von einem Bot geschlossen, ohne dass eines eine Antwort erhalten hatte |
| **7. November 2026** | Anthropic antwortet auf Hacker News |

Der Mechanismus wurde in einem öffentlichen Issue-Tracker **fünfzehn Monate** vor der Untersuchung beschrieben, die ihn zur Nachricht machte. Die Issues wurden nicht in der Sache abgelehnt; sie wurden von einer Inaktivitäts-Automatisierung geschlossen. Das ist die übertragbare Lehre für jeden, der ein Repository dieser Größenordnung betreibt: **Ein Staleness-Bot, der Sicherheitsmeldungen schließt, ist eine Sicherheitskontrolle mit umgedrehtem Vorzeichen.**

<Flashcards cards={[
  {front: "Der Mechanismus in einem Satz", back: "Die Wahl von „Yes, and don't ask again“ kann den genehmigten Shell-Befehl wortwörtlich als Permission-Regel in .claude/settings.local.json speichern, sodass Zugangsdaten, die inline getippt wurden, zu einer Zeile in einer Datei in deinem Repository werden."},
  {front: "104.185 / 1.122 / 1.379", back: "Gefundene öffentliche Kopien von .claude/settings.local.json; darunter Dateien mit mindestens einem echten Geheimnis (~1,1 %); unterschiedliche Geheimnisse in diesen Dateien."},
  {front: "2.539 in 1.994", back: "Die größere Gesamtzahl, wenn ältere Git-Historie-Versionen, die geteilte settings.json und gespeicherte Agent-Transkripte einbezogen werden."},
  {front: "Warum 215 Dateien beide Scanner umgingen", back: "gitleaks markierte 564 und TruffleHog 643 von 1.122. Die 215 Fehlschläge waren von Menschen gewählte Passwörter in Befehlsargumenten (PGPASSWORD=, sshpass -p, mysql -p): kein Provider-Präfix, kein Schlüsselformat, unauffällige Entropie."},
  {front: "Wohin Claude Code seine Ignore-Regel schreibt", back: "In deine GLOBALE Git-Excludes-Datei (core.excludesFile, Standard ~/.config/git/ignore) als **/.claude/settings.local.json, nie in die .gitignore des Projekts. Deshalb erreicht sie weder den Clone eines Teamkollegen, noch die CI, noch deinen nächsten Rechner."},
  {front: "Mediane Exposition", back: "Etwa 217 Tage auf dem Default-Branch, grob sieben Monate, nicht Stunden."},
  {front: "Richtige Reihenfolge der Behebung", back: "Erst rotieren, dann aufräumen. Historie, Forks und bestehende Clones liegen außerhalb deiner Kontrolle, das Bereinigen bringt also nichts, bevor die Zugangsdaten tot sind."},
  {front: "Die eine Gewohnheit, die die Klasse beseitigt", back: "PATTERNS genehmigen, keine literalen Befehle. Bash(psql *) trägt kein Geheimnis; der exakte Aufruf, den du eben ausgeführt hast, kann eines tragen."},
  {front: "Ist es ein Modellproblem?", back: "Nein. Mit Opus 5.5 und Fable 5.1 reproduziert: Es ist eine Eigenschaft der Genehmigungs-Persistenz von Claude Code, ein Modellwechsel ändert nichts."},
  {front: "CVE / Schweregrad", back: "Von niemandem vergeben. Es ist ein Expositionsbefund, keine nachgewiesene Kompromittierung; Apiiro testete die Zugangsdaten nicht, doch eine Organisation bestätigte, dass ihr Schlüssel aktiv gewesen war."},
]} />

<Quiz title="Teste dich selbst" questions={[
  {q: "Wie gelangen Zugangsdaten in .claude/settings.local.json?", options: ["Claude Code durchsucht deine Umgebung und cached Zugangsdaten zur Wiederverwendung", "Die Wahl von „Yes, and don't ask again“ kann den genehmigten Befehl wortwörtlich als Allow-Regel speichern, inklusive aller inline getippten Zugangsdaten", "Eine Prompt Injection bringt den Agenten dazu, Geheimnisse auf die Platte zu schreiben"], answer: 1, explain: "Weder ein Angreifer noch ein Fehler ist nötig. Die Option für persistente Genehmigung hält den Befehl als Regel fest; wenn du ein Passwort inline übergeben hast, steht das Passwort in der Regel. Darum ist es ein Workflow-Problem und kein Exploit."},
  {q: "Warum entgingen 215 der 1.122 leakenden Dateien sowohl gitleaks als auch TruffleHog?", options: ["Die Scanner waren so konfiguriert, dass sie Dot-Ordner überspringen", "Die Geheimnisse waren innerhalb des JSON verschlüsselt", "Es waren von Menschen gewählte Passwörter in Befehlsargumenten, ohne Provider-Präfix oder Schlüsselformat und mit unauffälliger Entropie"], answer: 2, explain: "Scanner gleichen bekannte Zugangsdaten-Formate ab oder markieren Strings mit hoher Entropie. Ein Passwort wie das hinter PGPASSWORD= hat keine der beiden Eigenschaften, es ist strukturell nicht von einem gewöhnlichen Konfigurationswert zu unterscheiden."},
  {q: "Claude Code fügt beim ersten Anlegen der Datei eine Ignore-Regel hinzu. Wohin geht sie, und warum reicht das nicht?", options: ["In die .gitignore des Projekts, aber nur auf dem Default-Branch", "In deine globale Git-Excludes-Datei im Home-Verzeichnis, die nie committet wird und deshalb weder Teamkollegen noch CI noch einen neuen Rechner erreichen kann", "In .git/info/exclude, das bei jedem Clone gelöscht wird"], answer: 1, explain: "Es schreibt **/.claude/settings.local.json in die globale Excludes-Datei (Standard ~/.config/git/ignore). Das schützt den Rechner, der sie angelegt hat, und sonst nichts, und Ignore-Regeln wirken nie auf bereits getrackte Dateien."},
  {q: "Du findest eine committete settings.local.json mit einem Datenbankpasswort. Was tust du ZUERST?", options: ["Die Datei mit git rm --cached entfernen und mit force-push die Historie umschreiben", "Die Zugangsdaten rotieren", "Den Pfad in .gitignore eintragen und committen"], answer: 1, explain: "Erst rotieren. Das Geheimnis existiert bereits in der Git-Historie, in Forks und in den Clones deiner Kollegen, alles außerhalb deiner Kontrolle. Aufräumen ist Hygiene; Rotation ist der einzige Schritt, der die Exposition tatsächlich beendet."},
  {q: "Welche Gewohnheit beseitigt diese gesamte Problemklasse?", options: ["Ein anderes Modell nutzen, weil das Verhalten modellspezifisch ist", "Patterns wie Bash(psql *) genehmigen statt literaler Einmal-Befehle", "Das Permission-System nie benutzen und jeden Befehl manuell bestätigen"], answer: 1, explain: "Eine Pattern-Regel trägt keine Zugangsdaten. Das Verhalten ist nicht modellspezifisch (es reproduzierte sich mit Opus 5.5 und Fable 5.1), und die manuelle Bestätigung von allem ist genau das, was Leute überhaupt erst dazu bringt, auf „don't ask again“ zu klicken."},
  {q: "Was ist die inhaltliche Meinungsverschiedenheit zwischen Apiiro und Anthropics öffentlicher Antwort?", options: ["Ob die Datei überhaupt existieren sollte", "Ob die Geheimnisse echt waren, da Apiiro sie nie getestet hat", "Anthropic sagte, die exponierten Dateien seien „manually created and checked in“ gewesen, während Apiiro Commits mit Claude als Co-Autor, die die Datei berührten, in 539 von 1.105 Repositories nachwies"], answer: 2, explain: "Beide Positionen führen zu denselben technischen Maßnahmen, implizieren aber unterschiedliche Expositionswege. Beachte, dass Co-Autorschaft nicht beweist, dass der Agent jede Zugangsdaten eingeführt hat: Der Commit kann eine bereits vorhandene Datei mitgenommen haben."},
  {q: "Warum ist die alleinige Prüfung von 'git ls-files .claude/settings.local.json' kein ausreichender Audit?", options: ["Weil es nur auf dem Default-Branch funktioniert", "Weil es nur zeigt, was gerade getrackt wird, und nichts über Historie, Forks oder Clones aussagt, die andere bereits halten", "Weil es voraussetzt, dass die Datei zuerst in gitignore steht"], answer: 1, explain: "Apiiro fand 734 Geheimnisse, die nur in älteren Versionen der Datei existierten, dazu 211 Forks von 74 Repositories. Du brauchst außerdem git log --all und einen Scan mit einem Scanner, der die Historie berücksichtigt."}
]} />

## Quellen & weiterführende Literatur

- [Apiiro — coding agents leaking secrets via "don't ask again"](https://apiiro.com/blog/coding-agents-leaking-secrets-github-dont-ask-again): die Primärforschung von Shmulik Cohen und Matan Giladi, 5. November 2026, mit der vollständigen Methodik und allen Zahlen. Die Seite wird per Skript gerendert und liefert 403 auf automatisierte Abrufe; die Zahlen hier stammen aus den unten genannten Medien, die sie alle zitieren
- [iTnews — "Don't ask again" in Anthropic's Claude Code leaks developer secrets](https://www.itnews.com.au/news/dont-ask-again-in-anthropics-claude-code-leaks-developer-secrets-630203): die Scanner-Aufteilung, die Aufschlüsselung nach Secret-Typ, die genannten schlimmsten Fälle und Anthropics Antwort
- [iTWire — Claude Code approval files found exposing company secrets on GitHub](https://itwire.com/business-it-news/security/claude-code-approval-files-found-exposing-company-secrets-on-github-says-apirro-researchers): die klarste Darstellung der Methodik: das Erhebungsfenster 1.–3. November, der Klassifizierungsschritt mit LLM-Prüfer und der Vorbehalt, dass Zugangsdaten nie getestet wurden
- [GBHackers — Claude Code's "don't ask again" feature exposed](https://gbhackers.com/claude-codes-dont-ask-again-feature-exposed/): die Unteraufteilung der 1.379 in Schlüssel im Provider-Format gegenüber hostnahen Passwörtern
- [Boris Chernys Antwort auf Hacker News](https://news.ycombinator.com/item?id=50408126): Anthropics Position zu Scrubbing, Auto Mode und dem, was von Hand eingecheckt wurde
- [GitHub-Issue #5544 — anthropics/claude-code](https://github.com/anthropics/claude-code/issues/5544): die Meldung genau dieses Verhaltens vom August 2025, im Januar 2026 von einem Bot als „not planned“ geschlossen
- [ironPeak — leaking secrets from the Claude settings file](https://ironpeak.be/blog/leaking-secrets-from-the-claud/): der Beitrag vom Februar 2026 und ein Scanner für KI-Konfigurationsdateien und deren Historie
- [gitleaks](https://github.com/gitleaks/gitleaks) und [TruffleHog](https://github.com/trufflesecurity/trufflehog): die beiden Scanner des Vergleichs; beide sind es wert, über die Historie zu laufen, beide sind standardmäßig blind für Inline-Passwörter
- [Claude-Code-Einstellungsdokumentation](https://code.claude.com/docs/en/settings): die offizielle Beschreibung von `settings.local.json` und dem Verhalten der globalen Excludes
- [Git — gitignore-Dokumentation](https://git-scm.com/docs/gitignore): die Regel, dass Ignore-Muster bereits getrackte Dateien nicht betreffen

## Weiter

- [Berechtigungen & Permission-Modi](/docs/claude-code/permissions): das Allow/Ask/Deny-System, um das es auf dieser Seite geht, einschließlich Auto Mode, der Alternative, die Anthropic gegenüber dem Anhäufen von Allow-Regeln empfiehlt
- [Sandbox-Credential-Masking](/docs/claude-code/sandbox-credential-masking): die strukturelle Lösung: `gh`, `npm` und `aws` sich authentifizieren lassen, ohne dass der Befehl je das echte Geheimnis hält
- [Coding-Agenten unter Beschuss](/docs/security/coding-agents-under-attack): die weitere Vertrauensgrenze um einen Agenten, der dein Repository liest und schreibt
- [Autonome Läufe härten](/docs/security/hardening-autonomous-runs): was sich ändert, wenn überhaupt niemand mehr die Genehmigungsabfrage beobachtet
