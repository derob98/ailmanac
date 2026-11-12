# Die claude-CLI: Flags, die das Ergebnis verändern

> Source: https://derob98.github.io/ailmanac/de/docs/claude-code/cli-flags · AILmanac (CC BY 4.0) · last verified 2026-10-07

Eine meinungsstarke Tour durch die Claude-Code-Kommandozeile — der Fünf-Flag-Vertrag für unbeaufsichtigte Läufe, die Falle des aufgezeichneten System-Prompts und die Unterschiede zwischen --bare, --safe-mode und --restricted.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-10-07" source="https://code.claude.com/docs/en/cli-reference">
Jeder Befehl, jedes Flag, jeder Standardwert und jede Mindestversion unten stammt aus der offiziellen [CLI-Referenz](https://code.claude.com/docs/en/cli-reference), gelesen am 2026-10-07. Flags kommen hinzu und ändern sich zwischen Releases, und die Referenz hält ausdrücklich fest, dass `claude --help` **nicht jedes Flag auflistet** — ein Flag, das in `--help` fehlt, fehlt also nicht zwingend in deinem Build. Prüfe die Referenz, nicht den Hilfetext, und prüfe deine Version mit `claude -v`.
</VerifyNote>

Die meisten lernen über die Claude-Code-Kommandozeile drei Dinge — `claude`, `claude -c` und `claude -p` — und hören dann auf. Das ist ein vernünftiger Punkt zum Aufhören, solange du immer selbst davorsitzt. Sobald du Claude Code aber in ein Skript, einen CI-Job, eine Hintergrund-Queue oder in die Hände eines Teamkollegen legst, sind die Flags keine Annehmlichkeiten mehr, sondern der Unterschied zwischen einem Lauf, der einen Dollar kostet, und einem, der eine Stunde hängt.

Diese Seite ist keine zweite Kopie der Referenztabelle. Sie zeigt die **Reihenfolge, in der du die Oberfläche lernen solltest**, die Flags, die tatsächlich etwas verändern, und die vier Fallen, die echte Zeit kosten.

<Callout type="objectives" items={["Die sechs Arten von Sitzungen, die du starten kannst, und welches Flag welche auswählt","Der Fünf-Flag-Vertrag, der einen unbeaufsichtigten Lauf begrenzt, beantwortbar und maschinenlesbar macht","Warum das Bearbeiten von --append-system-prompt und ein erneutes --continue scheinbar nichts bewirkt — die Regel vom aufgezeichneten Prompt","Wie sich --bare, --safe-mode und --restricted unterscheiden und wann du welches wählst","Hintergrundsitzungen von der Shell steuern: agents, attach, logs, respawn, rm, daemon","Die Flag-Paare, die oft verwechselt werden: --tools vs. --allowedTools vs. --disallowedTools"]} />

## Beginne mit der Frage: Was für eine Sitzung ist das?

Jede weitere Entscheidung folgt aus dieser. Claude Code kann sechs grundverschiedene Dinge starten, und das Flag, das eines davon auswählt, tippst du meist als Erstes.

| Du willst | Flag | Du bekommst |
| --- | --- | --- |
| Eine Unterhaltung, die du verfolgst | *(keins)* | Interaktive Sitzung in diesem Terminal |
| Eine Antwort, dann Ende | `-p` / `--print` | Nicht-interaktiver Lauf, Ausgabe auf stdout |
| Arbeit, die dieses Terminal überdauert | `--bg` / `--background` | Eine Hintergrundsitzung; sie gibt ihre ID aus und wie du sie verwaltest |
| Einen isolierten Branch zum Experimentieren | `-w` / `--worktree` | Ein Git-Worktree unter `<repo>/.claude/worktrees/<name>` |
| Arbeit auf Anthropics Maschinen | `--cloud` | Eine Cloud-Sitzung oder eine Folgeaufgabe, die in eine bestehende eingereiht wird |
| Diese Sitzung vom Handy aus steuern | `--rc` / `--remote-control` | Eine interaktive Sitzung, die zusätzlich von claude.ai oder der Claude-App aus steuerbar ist |

Zwei davon lassen sich nicht kombinieren: `--bg` und `-p` schließen sich aus, weil das eine sofort zurückkehrt und das andere auf eine Antwort wartet. Wenn du im Hintergrund einen Shell-Befehl statt einer Claude-Sitzung willst, kombiniere `--bg` mit `--exec`:

<PromptCard title="Die Testsuite als Hintergrundjob laufen lassen, nicht als Claude-Sitzung">
{`claude --bg --exec 'pytest -x'`}
</PromptCard>

Und `--bg` prüft vor dem Start das Workspace-Vertrauen für das Verzeichnis — eine Hintergrundsitzung in einem nicht vertrauenswürdigen Repo scheitert also gleich am Anfang statt auf halbem Weg.

## Der Fünf-Flag-Vertrag für unbeaufsichtigte Läufe

Das ist das Wertvollste auf dieser Seite. Ein unbeaufsichtigter `claude -p`-Lauf kann auf drei Arten schiefgehen, die es in einer interaktiven Sitzung schlicht nicht gibt: Er kann an Berechtigungsabfragen **hängen bleiben**, die niemand beantwortet, er kann **viel länger loopen** als erwartet, und er kann **Fließtext ausgeben**, wo dein Skript Daten brauchte. Fünf Flags schließen alle drei Risiken.

<Steps items={[
  {title: "Nicht-interaktiv ausführen — -p", body: "`claude -p \"query\"` gibt die Antwort aus und beendet sich. Alles Folgende gilt nur im Print-Modus, dieses Flag ist also das Tor zu den übrigen."},
  {title: "Entscheiden, wer Berechtigungsabfragen beantwortet — --permission-prompts", body: "Der Standard ist `host`: Die Abfragen gehen an den Agent-SDK-Host oder an ein `--permission-prompt-tool`. Übergib `--permission-prompts none`, wenn niemand antworten kann, etwa in einem Cron-Job oder einem CI-Schritt: Der Lauf fragt keinen Host mehr an und wartet nicht mehr auf ihn, alles, was eine Abfrage auslösen würde, wird abgelehnt, es sei denn, ein `PermissionRequest`-Hook erlaubt es, und Claude wird angewiesen, es nicht erneut zu versuchen. Ein `-p`-Lauf ganz ohne Host lehnt diese Anfragen bereits ab; dort verhindert das Flag vor allem die Wiederholungsversuche. Erfordert v2.1.259 oder neuer. Kombiniere es mit eng gefassten `--allowedTools`-Regeln, damit Ablehnungen die Ausnahme bleiben statt der Dauerzustand."},
  {title: "Die Schleife begrenzen — --max-turns", body: "Standardmäßig gibt es kein Turn-Limit. `--max-turns 3` beendet den Lauf mit einem Fehler, sobald das Limit erreicht ist. Nutze es als Stolperdraht gegen außer Kontrolle geratene agentische Schleifen, nicht als Budget."},
  {title: "Die Ausgaben begrenzen — --max-budget-usd", body: "`--max-budget-usd 5.00` stoppt, sobald die clientseitige Kostenschätzung das Limit erreicht. Die Ausgaben von Subagenten zählen mit; ist es erreicht, schlägt das Starten eines weiteren Subagenten mit `Budget limit reached` fehl, und laufende Hintergrund-Subagenten werden gestoppt. Die Durchsetzung des Limits erfordert v2.1.217 oder neuer."},
  {title: "Die Ausgabe parsbar machen — --output-format oder --json-schema", body: "`--output-format json` liefert dir einen strukturierten Umschlag. `--json-schema '<schema>'` geht weiter: Claude Code validiert die endgültige Antwort gegen dein JSON-Schema und meldet ein ungültiges Schema sofort als Fehler, sodass dein Skript nie Fließtext per Regex zerlegen muss."}
]} />

<PromptCard title="Ein CI-Schritt, der nicht hängen, nicht endlos loopen und nicht zu viel ausgeben kann">
{`claude -p "Review the staged diff and list bugs" \\
  --permission-prompts none \\
  --allowedTools "Read" "Bash(git diff *)" \\
  --max-turns 6 \\
  --max-budget-usd 2.00 \\
  --output-format json`}
</PromptCard>

<Callout type="warning" title="--max-budget-usd ist eine Schätzung, nicht deine Rechnung" items={["Claude Code prüft das Limit gegen seine eigene clientseitige Kostenschätzung, die von dem abweichen kann, was dir berechnet wird.","Wenn du mit --continue oder --resume zu einer Unterhaltung zurückkehrst, zählen die aus früheren Läufen wiederhergestellten Summen nicht zum Limit — drei fortgesetzte Läufe unter einem 2-$-Limit können also insgesamt mehr als 2 $ kosten.","Betrachte es als Sicherung für einen einzelnen Lauf. Für eine echte Obergrenze über ein ganzes Konto oder Projekt siehe Hard Spend Caps."]} />

Zur gesamten Haltung beim Laufenlassen ohne Menschen — was erlauben, was maskieren, was protokollieren — siehe [Autonome Läufe absichern](/docs/security/hardening-autonomous-runs) und [Headless-Modus und Agent SDK](/docs/claude-code/headless-and-agent-sdk). Für Obergrenzen auf Anbieterebene: [Hard Spend Caps](/docs/models/hard-spend-caps).

## Die System-Prompt-Familie und die Falle darin

Fünf Flags formen den System-Prompt. Vier legen seinen Text fest; das fünfte entscheidet, ob die Unterhaltung den Text behält, mit dem sie begonnen hat.

| Flag | Was es tut |
| --- | --- |
| `--system-prompt` | Ersetzt den gesamten Standard-Prompt durch deinen Text |
| `--system-prompt-file` | Ersetzt ihn durch den Inhalt einer Datei |
| `--append-system-prompt` | Hängt deinen Text an den Standard-Prompt an |
| `--append-system-prompt-file` | Hängt den Inhalt einer Datei an den Standard-Prompt an |
| `--system-prompt-snapshot` | `off` baut den Prompt bei jeder Anfrage neu auf; `on` (der Standard) verwendet den aufgezeichneten wieder |

Die Wahl zwischen *anhängen* und *ersetzen* ist eine Wahl über die Identität. Anhängen behält die Standard-Werkzeughinweise, Sicherheitsanweisungen und Coding-Konventionen von Claude Code und legt deine Regeln obendrauf — richtig für Anweisungen pro Lauf, Ausgabeformatierung oder Projektkontext. Ersetzen verwirft **all das**, einschließlich der Werkzeughinweise, und ist deshalb nur richtig, wenn die Oberfläche tatsächlich kein Coding-Assistent ist: ein nicht programmierender Agent in einer Pipeline, die niemand beobachtet. Wenn du ersetzt, gehört dir alles, was die Aufgabe noch braucht.

Du kannst beides kombinieren. Ein Append-Flag zusammen mit einem Replace-Flag ersetzt den Standard und hängt danach deinen Text an. Ab v2.1.283 kannst du außerdem ein Flag zusammen mit seiner eigenen Dateiform übergeben — `--append-system-prompt` *und* `--append-system-prompt-file` — und Claude Code verwendet beide, wobei der Dateiinhalt zuerst kommt, unabhängig von der getippten Reihenfolge.

<Callout type="warning" title="Die Falle: Eine fortgesetzte Unterhaltung verwendet den Prompt wieder, mit dem sie geboren wurde" items={["Claude Code baut den System-Prompt einmal bei der ersten Anfrage einer Unterhaltung auf und zeichnet ihn in der Sitzung auf.","Bis die Unterhaltung kompaktiert wird, verwendet jede spätere Anfrage diesen aufgezeichneten Prompt — auch nach --resume oder --continue.","Du bearbeitest also deinen --append-system-prompt-Text, startest claude --continue erneut, und nichts ändert sich. Das Flag ist nicht kaputt; die Unterhaltung nutzt noch die Aufzeichnung.","Neuer Text greift, sobald die Unterhaltung kompaktiert wird oder in einer ganz neuen Unterhaltung.","Um über mehrere --continue-Läufe an der Formulierung zu feilen, übergib --system-prompt-snapshot off, dann wird der Prompt bei jeder Anfrage neu aufgebaut. Erfordert v2.1.257 oder neuer."]} />

Einen weiteren Kniff solltest du in einem Ersatz-Prompt kennen, der stabile Anweisungen mit Kontext pro Lauf mischt. Setze zwischen beide eine Zeile, die nur `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` enthält: Claude Code teilt an der ersten solchen Zeile und entfernt sie, sodass der Teil darüber im Cache bleibt, während sich der Teil darunter ändert. Erfordert v2.1.275 oder neuer. Warum das für deine Rechnung wichtig ist, steht in [Prompt Caching](/docs/api/prompt-caching).

Und für skriptgesteuerte Workloads mit mehreren Nutzern verschiebt `--exclude-dynamic-system-prompt-sections` Kontext pro Nutzer, etwa den Speicherort des Auto-Memorys, aus dem System-Prompt in die erste Nutzernachricht — so teilt dieselbe Aufgabe auf verschiedenen Maschinen einen einzigen gecachten Präfix. Es gilt nur für den Standard-Prompt und wird ignoriert, wenn du `--system-prompt` oder `--system-prompt-file` setzt.

## Drei Flags, die Dinge abschalten — und sie sind nicht dasselbe

Man greift gern wahllos zu diesen und wundert sich dann, warum das Symptom bleibt. Sie lösen drei verschiedene Probleme.

| | `--bare` | `--safe-mode` | `--restricted` |
| --- | --- | --- | --- |
| Das Problem, das es löst | Der Start ist für einen skriptgesteuerten Aufruf zu langsam | Meine Konfiguration ist kaputt und ich weiß nicht, welcher Teil | Ein Eval-Harness darf diese gemeinsam genutzte Maschine nicht anfassen |
| CLAUDE.md, Skills, Befehle, Subagenten, Plugins, MCP, Auto-Memory | Werden nicht gefunden | Werden nicht geladen | Nur verwaltete Einstellungen und `--settings` werden geladen |
| Eingebaute Werkzeuge | Bash, Datei lesen, Datei bearbeiten | Funktionieren normal | Werkzeuge zum Ausführen von Befehlen/Code und WebFetch werden **entfernt**, sofern nicht einzeln in `--tools` genannt |
| Dateizugriff | Normal | Normal | Auf die Arbeitsverzeichnisse beschränkt |
| `bypassPermissions` | Erlaubt | Erlaubt | **Verweigert** |
| Verwaltete Richtlinie | Gilt | Gilt weiterhin, einschließlich Policy-Hooks und Statuszeile | Gilt |
| Nebeneffekt | Setzt `CLAUDE_CODE_SIMPLE` | Setzt `CLAUDE_CODE_SAFE_MODE` | Verweigert das Erstellen von Cloud-Sitzungen |

Lies die Tabelle als Abfolge von Absichten: `--bare` zielt auf **Geschwindigkeit**, `--safe-mode` auf **Diagnose**, `--restricted` auf **Eindämmung**. Ein nützliches Detail: Skills in einem Verzeichnis, das du mit `--add-dir` übergibst, werden auch unter `--bare` geladen — so behältst du genau eine Fähigkeit in einem sonst abgespeckten Lauf.

`--safe-mode` ist das Flag, nach dem du zuerst greifst, wenn etwas nicht stimmt und du nicht weißt, ob es an Claude Code oder an deiner eigenen Konfiguration liegt — auch dann, wenn du herausfinden willst, ob eine Anpassung den automatischen Modell-Fallback auslöst. Kombiniere es mit `claude doctor`, das schreibgeschützte Installations- und Einstellungsdiagnosen ausgibt, ohne überhaupt eine Sitzung zu starten. (Der Befehl `/doctor` in der Sitzung ist etwas anderes: Er kann auch Korrekturen anwenden.) Mehr symptomorientiertes Debugging in [Claude Code Fehlerbehebung](/docs/claude-code/troubleshooting). `--restricted` erfordert v2.1.248 oder neuer.

## Hintergrundsitzungen von der Shell aus steuern

Sobald du Sitzungen mit `--bg` startest, wird das Terminal zur Steuerzentrale. Der ganze Lebenszyklus hat einen Befehl, und nichts davon erfordert die interaktive Oberfläche.

<Steps items={[
  {title: "Sehen, was läuft — claude agents", body: "Öffnet die Agent-Ansicht, um parallele Hintergrundsitzungen zu überwachen und zu starten. Für Skripte gibt `--json` die aktiven Sitzungen als JSON-Array aus, und `--json --all` schließt abgeschlossene ein. `--cwd <path>` beschränkt auf Sitzungen, die unter diesem Verzeichnis gestartet wurden. Die Ansicht selbst braucht ein interaktives Terminal; die JSON-Form nicht."},
  {title: "In eine hineinschauen — claude logs", body: "`claude logs <id|name>` gibt die jüngste Ausgabe einer Hintergrundsitzung aus. Ab v2.1.290 kannst du statt der ID einen Teil des Namens einer laufenden Sitzung angeben — `claude logs auth` genügt also meist."},
  {title: "Sie übernehmen — claude attach", body: "`claude attach <id|name>` holt eine Hintergrundsitzung in dieses Terminal. Auch die Teilnamen-Zuordnung erfordert v2.1.290 oder neuer."},
  {title: "Neu starten — claude respawn", body: "`claude respawn <id>` startet eine Sitzung, laufend oder gestoppt, mit unveränderter Unterhaltung neu. `--all` startet alle laufenden Sitzungen neu — der richtige Schritt nach einem Upgrade der Claude-Code-Binärdatei."},
  {title: "Stoppen und aufräumen — claude stop, claude rm", body: "`claude stop <id>` (auch `claude kill`) hält eine Sitzung an. `claude rm <id>` entfernt sie aus der Liste; das Transkript bleibt auf deiner Maschine und ist weiterhin über `claude --resume` erreichbar. Wenn das Entfernen wegen des Worktrees der Sitzung verweigert wird, nennt die Meldung das genaue Flag für den nächsten Versuch — `--discard-unpushed` (v2.1.260+) oder `--force-remove-worktree` (v2.1.268+)."},
  {title: "Wenn alles festhängt — claude daemon", body: "Hintergrundsitzungen werden von einem Supervisor-Prozess gehostet. `claude daemon status` gibt dessen Zustand, Version, Socket-Verzeichnis und Worker-Anzahl aus und beendet sich mit 1, wenn er nicht läuft. `claude daemon logs` verfolgt `~/.claude/daemon.log`. `claude daemon stop --any --keep-workers` startet den Supervisor neu und lässt die Sitzungen am Leben, damit sich der nächste wieder verbinden kann."}
]} />

Das Gegenstück dazu innerhalb einer Sitzung — wie Arbeit in den Hintergrund gelegt wird und was dabei mitgenommen wird — ist [Hintergrundaufgaben, /loop und Zeitplanung](/docs/claude-code/background-tasks).

## Die Flag-Paare, die man falsch versteht

<Callout type="warning" title="Sechs Verwechslungen, denen man besser vorbeugt" items={["--tools beschränkt, welche eingebauten Werkzeuge es überhaupt gibt. --allowedTools legt fest, welche Aufrufe die Berechtigungsabfrage überspringen. --disallowedTools lehnt Aufrufe ab. Das sind drei verschiedene Aufgaben, und das falsche Flag zu übergeben ist die häufigste Ursache für „warum fragt es immer noch“.","--tools hat auf MCP-Werkzeuge gar keine Wirkung. Um auch diese zu entfernen, füge --disallowedTools \"mcp__*\" hinzu.","Ein bloßer Name in --disallowedTools entfernt das Werkzeug aus Claudes Kontext; eine eingegrenzte Regel wie Bash(rm *) lässt das Werkzeug verfügbar und lehnt nur passende Aufrufe ab.","--dangerously-skip-permissions startet in bypassPermissions. --allow-dangerously-skip-permissions fügt diesen Modus nur dem Shift+Tab-Zyklus hinzu, sodass du im Plan Mode starten und später wechseln kannst. Das zweite ist fast immer das, was du eigentlich wolltest.","--add-dir gewährt Dateizugriff, aber Claude Code findet in diesen Verzeichnissen die meiste .claude/-Konfiguration nicht. Ein Verzeichnis hinzuzufügen heißt nicht, seine Konfiguration zu übernehmen.","--desktop nimmt keinen Prompt und keine anderen Flags außer --verbose und den --debug-Flags, weil die Desktop-App die Sitzung selbst startet. Erfordert v2.1.285 oder neuer."]} />

Ein kleines Komfortdetail: Vertippst du dich bei einem Unterbefehl, schlägt Claude Code den nächstliegenden vor und beendet sich, ohne eine Sitzung zu starten — `claude udpate` gibt `Did you mean claude update?` aus, statt eine Unterhaltung zu öffnen, die du nicht wolltest.

## Prüfe dich selbst

<Quiz questions={[
  {
    q: "Dein nächtlicher Job führt `claude -p` in einer Agent-SDK-App aus, deren `canUseTool`-Callback einen Menschen fragt, und nachts hängt er bis zum Timeout. Welches Flag fehlt am wahrscheinlichsten?",
    options: [
      "--max-turns, weil der Agent loopt",
      "--permission-prompts none, weil niemand da ist, der eine Berechtigungsabfrage beantwortet",
      "--output-format json, weil der Parser blockiert",
      "--bare, weil der Start langsam ist"
    ],
    answer: 1,
    explain: "Im Print-Modus gehen Berechtigungsabfragen standardmäßig an den Host — hier dein SDK-Callback, und der Lauf wartet auf dessen Antwort. `--permission-prompts none` hört auf, den Host zu befragen: Alles, was eine Abfrage auslösen würde, wird abgelehnt, es sei denn, ein PermissionRequest-Hook erlaubt es, und Claude wird angewiesen, es nicht erneut zu versuchen, sodass der Job abschließt. Ein einfacher `-p`-Lauf ganz ohne Host lehnt diese Anfragen bereits ab. `--max-turns` begrenzt eine Schleife, was ein anderes Symptom ist."
  },
  {
    q: "Du änderst deinen --append-system-prompt-Text, startest `claude --continue` erneut, und das Verhalten bleibt gleich. Warum?",
    options: [
      "Append-Flags funktionieren nur mit -p",
      "Die Unterhaltung verwendet den bei ihrer ersten Anfrage aufgezeichneten System-Prompt wieder, bis sie kompaktiert wird",
      "--continue verwirft stillschweigend alle System-Prompt-Flags",
      "Der Text wird angehängt, aber hinter der Nutzernachricht platziert"
    ],
    answer: 1,
    explain: "Claude Code baut den Prompt einmal bei der ersten Anfrage der Unterhaltung auf und zeichnet ihn auf. Spätere Anfragen — auch nach --continue oder --resume — verwenden die Aufzeichnung wieder, bis die Unterhaltung kompaktiert wird. Übergib --system-prompt-snapshot off, um den Prompt bei jeder Anfrage neu aufzubauen, solange du iterierst."
  },
  {
    q: "Eine Anpassung stört deine Sitzung und du weißt nicht, welche. Welches Flag isoliert sie, während deine Werkzeuge und Berechtigungen normal weiterarbeiten?",
    options: [
      "--bare",
      "--restricted",
      "--safe-mode",
      "--disable-slash-commands"
    ],
    answer: 2,
    explain: "--safe-mode deaktiviert Anpassungen — CLAUDE.md, Skills, Plugins, Hooks, MCP-Server, Befehle, Agenten, Output-Styles, Statuszeile, Auto-Memory —, während Authentifizierung, Modellauswahl, eingebaute Werkzeuge und Berechtigungen weiter funktionieren. --bare dient der Startgeschwindigkeit und --restricted der Eindämmung auf einer gemeinsam genutzten Maschine."
  }
]} />

<Flashcards cards={[
  {front: "--bg vs. -p", back: "Schließen sich aus. --bg kehrt sofort mit einer Sitzungs-ID zurück; -p wartet und gibt die Antwort aus. Kombiniere --bg mit --exec, um statt einer Claude-Sitzung einen Shell-Befehl in den Hintergrund zu legen."},
  {front: "--max-budget-usd", back: "Print-Modus-Limit, geprüft gegen die clientseitige Kostenschätzung von Claude Code, nicht gegen deine Rechnung. Ausgaben von Subagenten zählen mit; durch --continue/--resume wiederhergestellte Summen nicht. v2.1.217+."},
  {front: "--system-prompt-snapshot off", back: "Baut den System-Prompt bei jeder Anfrage neu auf, statt den bei der ersten Anfrage der Unterhaltung aufgezeichneten wiederzuverwenden. v2.1.257+."},
  {front: "__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__", back: "Eine Zeile, die nur diese Markierung enthält, teilt einen Ersatz-System-Prompt so, dass der Teil darüber im Cache bleibt und der Teil darunter sich pro Lauf ändert. v2.1.275+."},
  {front: "--tools vs. --allowedTools", back: "--tools bestimmt, welche eingebauten Werkzeuge überhaupt existieren. --allowedTools bestimmt, welche Aufrufe ohne Berechtigungsabfrage laufen. Keines von beiden betrifft MCP-Werkzeuge."},
  {front: "claude doctor vs. /doctor", back: "`claude doctor` gibt schreibgeschützte Installations- und Einstellungsdiagnosen aus, ohne eine Sitzung zu starten. Der Befehl `/doctor` in der Sitzung kann auch Korrekturen anwenden."},
  {front: "claude respawn --all", back: "Startet alle laufenden Hintergrundsitzungen mit unveränderten Unterhaltungen neu — der richtige Schritt nach einem Upgrade der Claude-Code-Binärdatei."},
  {front: "--add-dir", back: "Gewährt Lese-/Schreibzugriff auf ein weiteres Verzeichnis. Claude Code findet dadurch die meiste .claude/-Konfiguration dort nicht."}
]} />

<Callout type="takeaways" items={["Wähle zuerst die Sitzungsart — das Flag, das sie bestimmt, schränkt jedes weitere Flag ein, das du übergeben kannst.","Ein unbeaufsichtigter Lauf braucht fünf Flags, nicht eins: -p, --permission-prompts none, --max-turns, --max-budget-usd und ein strukturiertes Ausgabeformat.","Betrachte --max-budget-usd als Sicherung für einen einzelnen Lauf, nicht als Obergrenze deiner Rechnung. Es ist eine clientseitige Schätzung, und fortgesetzte Summen entgehen ihr.","Unterhaltungen zeichnen ihren System-Prompt bei der ersten Anfrage auf. Wenn eine Prompt-Änderung ignoriert scheint, liegt es daran — nutze --system-prompt-snapshot off, solange du iterierst.","--bare ist Geschwindigkeit, --safe-mode ist Diagnose, --restricted ist Eindämmung. Das falsche zu wählen kostet dich einen Nachmittag.","--help ist absichtlich unvollständig. Die CLI-Referenz ist die maßgebliche Quelle, und Mindestversionen zählen — prüfe claude -v, bevor du einem Flag die Schuld gibst."]} />

## Weiter

- [Headless-Modus und Agent SDK](/docs/claude-code/headless-and-agent-sdk) — was du baust, wenn ein einzelner `-p`-Aufruf nicht mehr reicht
- [settings.json: Das Konfigurationssystem](/docs/claude-code/settings) — das dauerhafte Zuhause für die Flags, die du ständig neu tippst
- [Claude Code Fehlerbehebung](/docs/claude-code/troubleshooting) — symptomorientiertes Debugging, beginnend mit `--safe-mode`
