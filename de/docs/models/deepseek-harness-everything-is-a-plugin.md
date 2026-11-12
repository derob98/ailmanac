# DeepSeek Harness: der Agent, bei dem die Agentenschleife selbst ein Plugin ist

> Source: https://derob98.github.io/ailmanac/de/docs/models/deepseek-harness-everything-is-a-plugin · AILmanac (CC BY 4.0) · last verified 2026-10-03

DeepSeek Harness (dsh) überschritt 242.000 Sterne und lieferte am 1. Oktober 2026 Desktop-Installer aus. Die Schlagzeile lautet „alles ist ein Plugin“ — und anders als bei den meisten solchen Behauptungen ist diese tragend: Modelladapter, Tool-Registry, Sitzungslog und die Agentenschleife sind alle über eine YAML-Patch-Datei austauschbar. Diese Seite behandelt die drei Fakten, die für Claude-Nutzer zählen (es führt Ihre bestehende Claude-Code-hooks.json aus, es spricht anthropic-messages, und run_code ist standardmäßig Codemode), die Drei-Modi-Sandbox und die Kernel-Primitive dahinter, die Invariante des Append-only-Sitzungslogs und die Konfigurations-Überschreibung, die still Ihre anderen Provider löscht.

<LevelBadge level="advanced" />

**DeepSeek Harness** — der Befehl lautet `dsh` — ist DeepSeeks Open-Source-Agent-Harness. Es erschien am 13. August 2026 auf GitHub, hat heute 242.626 Sterne und 29.081 Forks, steht unter MIT-Lizenz und ist in TypeScript geschrieben. Am 1. Oktober 2026 fügte DeepSeek signierte Desktop-Installer hinzu, was es zurück auf die Hacker-News-Startseite brachte.

Der Ein-Satz-Pitch ist die Repository-Beschreibung: *„Everything is a Plugin.“* Dieser Satz steht in der README von ungefähr jedem je veröffentlichten Agenten-Framework und bedeutet fast immer „wir haben einen Plugin-Ordner“. Hier bedeutet er etwas viel Stärkeres und viel Merkwürdigeres, klar benannt in `docs/architecture.md`: Der Modelladapter, die Tool-Registry, das Sitzungslog **und die Agentenschleife selbst** sind Plugins, „sodass jedes über die Konfiguration austauschbar ist“. Sie können die Agentenschleife aus einer YAML-Datei löschen und Ihre eigene einsetzen, ohne etwas zu forken.

Dieses Design hat Konsequenzen — manche hervorragend, manche teuer. Diese Seite behandelt jene, die man der Startseite nicht ansieht.

<Callout type="objectives" items={["Verstehen, was „alles ist ein Plugin“ hier bringt und was Cordis — das Framework darunter — tatsächlich garantiert","Ihre bestehende Claude-Code-hooks.json in dsh ausführen und wissen, welche Teilmenge die Brücke übersteht","dsh auf Claude, GPT oder ein Firmen-Gateway richten und wissen, warum ein OAuth-Abo nicht funktioniert","PTC-Modus (run_code) bewusst statt zufällig nutzen","Die drei Sandbox-Modi gegen das Kernel-Primitiv lesen, das jeder tatsächlich verwendet","Die fünf Konfigurationsfallen vermeiden, die je eine Stunde kosten"]} />

<VerifyNote lastVerified="2026-10-03" source="https://github.com/deepseek-ai/deepseek-harness">
Sternzahlen, die npm-Version und die Matrix der Desktop-Installer sind vergänglich.
Das npm-Tag `latest` verweist derzeit auf `0.2.0-rc.2` — einen Release Candidate,
kein stabiles Release — und `SAFETY.md` beschreibt das Projekt als „experimental
developer-preview software", die „has not undergone a security audit“. Die
README warnt vor Änderungen, die die Kompatibilität brechen. Behandeln Sie jeden
Dateipfad, Service-Schlüssel und jedes Konfigurationsfeld unten als gültig für die 0.2-Linie
und prüfen Sie erneut gegen die Repository-Docs, bevor Sie darauf aufbauen. Die Aussagen zu
Architektur und Sicherheit stammen aus der eigenen Dokumentation des Repositories, nicht aus
Sekundärberichten.
</VerifyNote>

## Die 60-Sekunden-Version

<Steps items={[
  { title: "Starten", body: "`npx @deepseek-ai/dsh web` startet das Web-Profil, gibt eine URL aus — `http://127.0.0.1:3080` — und öffnet Ihren Browser. Kein Klonen, kein Build. Das Verzeichnis, aus dem Sie aufrufen, wird zum Standard-Workspace-Root, aber eine frische Web-Oberfläche hat keinen Workspace ausgewählt, bis Sie einen hinzufügen, und das Eingabefeld bleibt bis dahin deaktiviert." },
  { title: "Ein Modell geben", body: "Settings → Models. Die DeepSeek-Karte nimmt einen API-Schlüssel von platform.deepseek.com. Fügen Sie einen Drittanbieter hinzu, bietet der ausgelieferte Katalog Provider-IDs an, darunter `anthropic`, `openai`, `moonshotai` (Kimi) und `zai` (GLM). Modelländerungen gelten ab der nächsten Anfrage — kein Neustart." },
  { title: "Verstehen, wo es Dinge ablegt", body: "Schlüssel landen in `$DSH_HOME/.credentials.yaml`, nur schreibbar: Die Einstellungsseite bekommt einen geschwärzten Deskriptor zurück, nie das Geheimnis, und Ihre Einstellungen speichern nur eine Credential-Referenz. Alles andere, was Sie in der Oberfläche ändern, wird nach `$DSH_HOME/profiles/web/cordis.patch.yml` geschrieben — dieselbe Datei, die Sie von Hand bearbeiten können." },
  { title: "Einen Einstiegsmodus wählen", body: "`dsh web` ist eines von fünf ausgelieferten Profilen. `dsh --profile headless \"run the tests\"` führt eine persistierte Sitzung aus, gibt die Endantwort aus und beendet sich — das ist Ihr CI-Einstiegspunkt. `dsh --profile acp` bedient Automatisierungs-Clients über ACP-stdio. `dsh --profile sdk` bedient SDK-Clients über JSON-RPC-stdio. Der Name `desktop` ist für das eigene Profil der Electron-App reserviert, und die npm-CLI weigert sich, es zu starten." },
  { title: "Plugins wie npm-Pakete installieren", body: "`dsh plugin --profile web <pnpm args>` leitet direkt an pnpm im Profilverzeichnis weiter. Plugins sind gewöhnliche Pakete im eigenen `node_modules` des Profils. Community-Plugins sind über das GitHub-Topic `dsh-plugin` auffindbar." },
]} />

## „Alles ist ein Plugin“ ist eine tragende Behauptung

Unter `dsh` liegt **Cordis**, ein Plugin-Framework, das ins Repository eingebunden (`vendor/`) ist und in einem arXiv-Paper beschrieben wird, das das Projekt zitiert — *A Programming Paradigm for Spatiotemporal Composability*, arXiv:2608.25512, eingereicht am 26. August 2026, von Autoren der Peking-Universität und von DeepSeek-AI. Die zwei Ideen des Papers bilden direkt ab, wie sich der Harness zur Laufzeit verhält:

- **Zeitliche Komponierbarkeit** — die Nebenwirkungen einer Komponente lassen sich beim Entfernen *vollständig* rückgängig machen. Im Harness ist das `ctx.effect()`: Prompt-Abschnitte, Tool-Schemata, Modelladapter, Provider und Listener werden alle als umkehrbare Effekte installiert, sodass das Entladen eines Plugins seine Registrierungen der Reihe nach abbaut, statt Waisen zu hinterlassen.
- **Räumliche Komponierbarkeit** — Abhängigkeiten werden reaktiv aufgelöst. Ein Plugin benennt die Dienste, die es braucht, per `inject`, und Cordis startet es schlicht nicht, bis diese Dienste existieren. Es gibt keine Boot-Sequenz zu pflegen; die Ladereihenfolge ergibt sich aus den deklarierten Anforderungen.

Ein **Service** beansprucht einen stabilen Schlüssel auf dem gemeinsamen Kontext. Die Namen sind die Architektur:

| Service-Schlüssel | Wem er gehört |
|---|---|
| `ctx.llm` | die Registry der LLM-Adapter — die Modellnaht |
| `ctx.tools` | die Tool-Registry und ihre Ausführungs-Pipeline mit Geltungsbereich |
| `ctx.agentLoop` | der Standard-Treiber der Agentenschleife |
| `ctx.agents` | die Registry der laufenden Agenten |
| `ctx.sessions` | das Append-only-`SessionEvent`-Log |
| `ctx.systemPrompt` | Zusammenbau des System-Prompts |
| `ctx.fs` | Dateisystemzugriff |
| `ctx.subprocess` | Subprozess-Ausführung |
| `ctx.sandbox` | Eingrenzung von Subprozessen |
| `ctx.subagents` | Delegation an Subagenten |
| `ctx.ptcRuntime` | Programmausführung für `run_code` |
| `ctx.credentials` | die Credential-Naht |

Das Repository nennt diese **Capability Seams** (Fähigkeitsnähte) und teilt jede in drei Rollen: das Paket, das den Service *deklariert*, die Pakete, die ihn *implementieren*, und die Pakete, die ihn *konsumieren*. `ctx.sandbox` wird von `packages/sandbox/sandbox` deklariert, von `sandbox-local` und `sandbox-windows-acl` implementiert und von `tool-bash` und der PTC-Laufzeit konsumiert. Tauschen Sie die Implementierung aus, folgt jeder Konsument, ohne dass ein Konsument bearbeitet werden muss.

Die Kommunikation zwischen Plugins besteht aus typisierten Ereignissen mit **fünf deklarierten Dispatch-Modi**, und der Modus gehört zum öffentlichen Vertrag eines Ereignisses:

| Modus | Abgewartet | Reihenfolge | Gibt einen Wert zurück |
|---|---|---|---|
| `emit` | nein | Registrierungsreihenfolge | nein |
| `waterfall` | nein | Registrierungsreihenfolge | ja |
| `parallel` | ja | alle gleichzeitig | nein |
| `serial` | ja | Registrierungsreihenfolge | ja |
| `bail` | nein | Registrierungsreihenfolge, stoppt beim ersten Bail | ja |

`waterfall` ist der interessante: Es ist Around-Middleware. Ein Listener bekommt `(...args, next)`, ruft `next()` auf, um ein womöglich eingepacktes Ergebnis die Kette hinunterzureichen, oder kehrt zurück, ohne `next()` aufzurufen, um kurzzuschließen. Bei Ereignissen mit Einzelentscheidung — „darf dieses Tool laufen?“ — ist Kurzschließen *das* Design: Ein Policy-Listener, dem die Entscheidung gehört, kehrt zurück, ohne zu delegieren, während ein Listener, der nur annotiert, delegieren muss. Wenn Sie je einen Claude-Code-Hook geschrieben haben, der eine Deny-Entscheidung zurückgibt, kennen Sie diese Form schon; der Unterschied ist, dass hier der native Erweiterungsmechanismus ist und kein Shell-Aufruf.

Die Agentenschleife führt **Turns** (null oder mehr Schritte) und **Steps** (eine Modellanfrage plus ihre Tool-Aufrufe) aus, und die veröffentlichte Erweiterungssequenz lautet `agent/pre-step → agent/request → llm/stream → tools/* → step/end`. Das sind die Hook-Punkte. Sie patchen die Schleife nicht; Sie hören ihr zu.

## Drei Dinge, die zählen, wenn Sie bereits Claude Code nutzen

### 1. Es führt Ihre bestehende Claude-Code-`hooks.json` aus

Das ist die am wenigsten berichtete Tatsache über `dsh`. `packages/hooks` liefert drei Pakete: `hook-protocol` (die gemeinsame Engine), **`hooks-claude-code`** und **`hooks-codex`**. Richten Sie die Claude-Code-Brücke auf eine bestehende `hooks.json`, und Ihre Hooks laufen in `dsh`, wenn Sitzungen starten, Prompts eintreffen, Tools laufen und Läufe enden. Die README der Gruppe ist ausdrücklich darin, was sie können: Prompts oder Tool-Aufrufe **mit für das Modell sichtbaren Meldungen** blockieren, Gesprächskontext hinzufügen oder verlangen, dass der Lauf weitergeht.

Die Grenze ist ebenso ausdrücklich, und sie ist das, was Sie vor einer Migrationsplanung prüfen sollten: *Jede Integration unterstützt nur die Teilmenge der Command-Hooks, die ihr Quellwerkzeug dokumentiert.* Ihre Hooks vom Typ `command` lassen sich also portieren. Alles, was von Claude-Code-Verhalten außerhalb dieser Teilmenge abhängt, nicht. Wenn Sie eine Hook-Schicht haben, der Sie vertrauen — siehe [Claude-Code-Hooks](/docs/claude-code/hooks) —, ist das ein echter „bring Deine Leitplanken mit“-Weg, kein Neuschreiben.

### 2. Sie können es auf Claude richten — aber nicht mit Ihrem Abo

Die Provider-Liste im installierten Katalog nennt `anthropic` und `openai` ausdrücklich. Für alles, was nicht im Katalog steht — ein Relay, ein Firmen-Gateway, ein selbst gehosteter Server — fragt das Formular für benutzerdefinierte Provider nach einer Provider-ID, einer Basis-URL, einer Credential und einem **API-Protokoll** und bietet genau drei an: OpenAI Chat Completions, OpenAI Responses und Anthropic Messages. In `cordis.patch.yml` stehen diese als `openai-completions`, `openai-responses` und `anthropic-messages`.

Zwei Folgen, über die Leute stolpern:

- **Ein Provider spricht ein Protokoll.** Ein Gateway, das sowohl OpenAI- als auch Anthropic-Formen bedient, braucht *zwei* Provider-Einträge, nicht einen.
- **OAuth-Anmeldung wird nicht unterstützt.** Der Provider-Leitfaden sagt es direkt, mit Codex als Beispiel: Provider, die sich per OAuth anmelden, „are not supported here yet“. Das heißt API-Key-Abrechnung, nicht ein Platz, für den Sie schon zahlen. Wenn Sie hofften, `dsh` über ein bestehendes Assistenten-Abo zu betreiben, planen Sie stattdessen mit abgerechneten Tokens — die Rechnung steht unter [was KI bei verschiedenen Anbietern kostet](/docs/models/what-ai-costs-across-providers).

Es gibt auch einen Button zur Modell-Erkennung, der Ihren Endpunkt fragt, welche Modelle er bedient. Nützlich, mit einem Vorbehalt, den man verinnerlichen sollte: Ein **eingebauter** Provider wird immer aus dem installierten Katalog beantwortet, selbst wenn seine Basis-URL auf ein Gateway zeigt. Wollen Sie also sehen, was ein Gateway wirklich bedient, müssen Sie es als *benutzerdefinierten* Provider hinzufügen. Sonst lesen Sie DeepSeeks ausgelieferte Liste an sich selbst zurück.

### 3. `run_code` ist Codemode und eine erstklassige Laufzeit

`packages/ptc-runtime` ist die Fähigkeitsfamilie hinter dem, was die Tool-Registry dem Modell als `run_code` präsentiert. Der Vertrag: Das Modell schreibt **ein Programm**, das vom Host bereitgestellte Funktionen als gewöhnliche asynchrone Aufrufe nutzt, und nur die ausgegebene Ausgabe und der Rückgabewert des Programms kommen zurück. Nicht die Zwischenergebnisse der Tools. Nicht zwanzig Round-Trips.

Die Einzelheiten:

- Das TypeScript-Backend führt jedes Programm in einem **frischen verwalteten Node-Prozess** unter der aufgelösten Sandbox-Policy aus.
- **Jeder Lauf beginnt ohne Zustand früherer Programme.** Es gibt keine implizite REPL-Sitzung, auf die man sich stützen kann; tragen Sie Zustand über Dateien oder den Rückgabewert weiter.
- Fehler kommen als *Ergebnisse* zurück, nicht als Ausnahmen, sodass ein Aufrufer sie diagnostizieren oder dem Modell übergeben kann.
- Ein experimentelles **Python-Backend** existiert und besitzt ein fd-3-Wire-Protokoll zwischen dem Node-Host und einem CPython-Subprozess, für den Fall, dass Sie wirklich CPython brauchen.

Falls Ihnen dieses Muster neu ist: Die klarste Darstellung, *warum* es so viel Kontext spart, steht unter [Pi 1.0 und der Codemode-Trick](/docs/models/pi-1-0-minimal-agent-harness): Tool-Ergebnisse, die nie ins Transkript gelangen, können es nicht aufblähen. Dieselbe Logik gilt hier. Der Unterschied ist, dass in `dsh` die Programmlaufzeit eine austauschbare Naht (`ctx.ptcRuntime`) ist statt einer festen Sandbox-Wahl.

## Die Sandbox: drei Modi, drei Kernel-Primitive, ein ehrlicher Vorbehalt

Die drei Modi kommen Ihnen bekannt vor, wenn Sie Codex konfiguriert haben:

| Modus | Was ein Subprozess mit Dateien tun darf |
|---|---|
| `read-only` | nur lesen |
| `workspace-write` | nur unter dem Sitzungs-Workspace schreiben |
| `danger-full-access` | uneingeschränkt |

Interessanter ist die Backend-Tabelle, denn sie verrät, was die Policy auf Ihrem Rechner tatsächlich durchsetzt:

- **Linux** — bwrap, dann Landlock als Rückfallstufe.
- **macOS** — Seatbelt.
- **Windows** — ein eingeschränktes Token, mit `sandbox-windows-acl` als Schreibbeschränkungs-Backend: Eingegrenzte Kinder dürfen nur im Workspace und in einem privaten Temp-Verzeichnis schreiben.

Ein verweigerter Aufruf kann über eine **vom Nutzer genehmigte einmalige Eskalation** wiederholt werden, die Policy ist also eine Grenze nach dem Muster „fragen und fortfahren“ und keine harte Wand.

Und dann der Vorbehalt, den die Paket-README selbst nennt und den Sie jedem zitieren sollten, der sagt, das sei „gesandboxt“: **Die Eingrenzung gilt nur innerhalb derselben Welt.** Sie teilt den Host-Kernel und das Host-Dateisystem. Echte Isolation — Container, MicroVMs, Remote-Executor — wird hier gar nicht registriert; sie ersetzt stattdessen ganze Fähigkeiten.

`SAFETY.md` ist für ein Repository mit 242k Sternen ungewöhnlich offen und lohnt die Lektüre vor dem ersten Lauf statt danach. Es sagt, der Harness könne modellgenerierten Code ausführen, Plugins Dritter laden, das Netzwerk erreichen und Prozesse, Zugangsdaten und Dateien berühren; es gebe **keine inhärente Garantie**, dass Sandboxing, Genehmigungsabfragen und Berechtigungskontrollen Schaden an allem Erreichbaren verhindern; und die Software „must not be treated as secure or production-ready“. Die eigenen Empfehlungen sind die langweilig richtigen: Wegwerf-VMs oder Container, Backups von allem im Projektumfang und keine sensiblen Zugangsdaten, wenn Sie das Risiko nicht akzeptieren. Dieselbe Überlegung gilt für jeden lokal betriebenen Harness — siehe [lokale und hybride Agenten absichern](/docs/models/securing-local-and-hybrid-agents) und [Sandboxing und Credential-Maskierung](/docs/claude-code/sandbox-credential-masking).

Es gibt außerdem eine kleine **Guard**-Gruppe, die man kennen sollte: `timeout-policy` und `repeat-tool-reminder` — letzteres ein Anstoß für den Fehlermodus, in dem ein Modell dasselbe Tool in einer Schleife aufruft.

## Das Sitzungslog ist das Produkt

`dsh` persistiert Sitzungen als versionierte JSONL-Datei — `session.vN.jsonl[.zstd]` — mit Migrationsketten zwischen den Versionen, über eine Naht `ctx.sessionPersistence`, deren ausgelieferte Implementierung `session-persistence-jsonl` ist. Zu den committeten Ereignissen gehören `turn/start`, `step/start`, `user/message`, `assistant/message`, `tool/result` und `turn/end`.

Die Invariante dahinter ist der Teil zum Übernehmen, auch wenn Sie `dsh` nie ausführen: **„Model-visible means logged.“** Jede Eingabe, die das Modell sah, muss aus dem Log rekonstruierbar sein. Live-Ereignisse existieren separat, um die Oberfläche in Echtzeit zu steuern; sie sind ausdrücklich nicht die Wahrheitsquelle.

Diese eine Regel macht die umgebenden Pakete möglich:

- `session-query-sqlite` — Sitzungen aus SQLite abfragen, statt JSONL zu durchgreppen.
- `dsh-session-projection` mit `ctx.sessionProjections` — Sitzungszustand inkrementell falten, statt von null neu abzuspielen.
- `llm-replay` plus `token-meter` („replay token measurement“) — eine aufgezeichnete Sitzung abspielen und ihre Token-Kosten *messen*, womit man zwei Prompt- oder Modelländerungen auf identischen Eingaben vergleicht statt nach Gefühl.
- `compaction-tool-result-pruner` — beschrieben als **modellfreies** Beschneiden von Tool-Ergebnissen, also das Transkript schrumpfen, ohne ein Modell fürs Zusammenfassen zu bezahlen. Vergleichen Sie mit Claudes eigenem Ansatz in [Kontext-Kompaktierung](/docs/api/compaction).

Wenn Sie je einen Agentenlauf debuggen wollten und entdeckten, dass Ihre Logs die *gerenderte Oberfläche* aufzeichneten statt der Bytes, die das Modell erhielt, wissen Sie schon, warum diese Invariante mehr wert ist als die meisten Features.

## MCP ist hier ein Plugin pro Server, keine globale Registry

`dsh` spricht MCP sowohl über stdio als auch über Streamable HTTP und nutzt das offizielle SDK für Aushandlung, Erkennung, Validierung und Abbruch. Die Designentscheidungen sind ungewöhnlich genug, um sie aufzulisten:

- **Server sind Opt-in, ein Plugin-Eintrag pro Server.** Sie konfigurieren pro Server einen `@deepseek-ai/dsh-mcp-client`-Eintrag in dem Cordis-Scope, in dem er sichtbar sein soll. Es gibt bewusst **keinen gemeinsamen `ctx.mcp`-Service**: Der Client ist ein Verbindungs-Plugin und ein *Konsument* der Tool-Registry.
- **Kein konfigurierter Server bedeutet keine MCP-Steuer.** Ein Aufrufer ohne sichtbaren konfigurierten Server erhält weder MCP-Prompt-Text noch MCP-Tools, im nativen oder PTC-Modus. Null Bytes, nicht „ein kleiner Abschnitt“. Das zählt mehr, als es klingt — siehe [die wahren Kosten von MCP-Tools](/docs/claude-code/mcp-token-cost).
- **Öffentliche Tool-Namen enthalten den Servernamen**, sodass gleichnamige Tools zweier Server unterscheidbar bleiben. Ein `serverName` muss innerhalb seines Registrierungs-Scopes eindeutig sein, aber getrennte Agenten-Scopes dürfen ihn wiederverwenden.
- **Server-Anweisungen werden Teil des geloggten System-Prompts**, begrenzt durch `maxInstructionBytes` des Clients. Ein geschwätziger Server kann Ihren Prompt nicht still annektieren — beachten Sie aber, dass dies auch der Kanal ist, über den ein bösartiger Server zu Ihrem Modell spricht. Das ist die Angriffsfläche, beschrieben unter [MCP Tool Poisoning und Rug Pulls](/docs/security/mcp-tool-poisoning-and-rug-pulls).
- **Eine fehlgeschlagene Aktualisierung der Tool-Liste behält die vorherige Tool-Generation**, statt Ihre Tools mitten in der Sitzung zu verwerfen, und es gibt keine Produkteinstellung, die eine Protokollrevision erzwingt — die Aushandlung folgt den vom SDK unterstützten Revisionen.

## Konfiguration: fünf Schichten und die Überschreibung, die Ihre Provider frisst

Ein Profilverzeichnis enthält eine `package.json` — Plugin-Abhängigkeiten außerhalb des Baums plus ein `dsh.profile`-Manifest mit geordneter `bundles`-Liste — und eine `cordis.patch.yml`, Ihre eigene Patch-Schicht. Der zusammengesetzte Baum wird über einer leeren Wurzel in dieser Reihenfolge aufgebaut:

<Steps items={[
  { title: "Der Patch jedes Bundles, in der Reihenfolge von `dsh.profile.bundles`", body: "Bundles werden zuerst aus der dsh-Installation aufgelöst — `@deepseek-ai/dsh-base`, `dsh-web-app`, `dsh-headless`, `dsh-sdk-app`, `dsh-sdk-minimal`, `dsh-acp-app` — dann aus dem eigenen `node_modules` des Profils, wo pnpm Plugins außerhalb des Baums installiert. `dsh-base` ist der gemeinsame Unterbau: Modelladapter, Tools, Persistenz, Sandbox-Policy. Ein Bundle deklariert sich über ein `dsh`-Feld in seiner `package.json`." },
  { title: "Dann die `cordis.patch.yml` des Profils", body: "`$DSH_HOME/profiles/<profile>/cordis.patch.yml`. Bei einem einfachen `dsh web`-Start ist das Profil `web`. Das ist die Datei, die die Settings-Oberfläche schreibt; Sie können sie direkt bearbeiten, und die Adapter lesen sie bei der nächsten Anfrage neu." },
  { title: "Dann der Home-Patch", body: "`$DSH_HOME/cordis.patch.yml` — profilübergreifende Überschreibungen." },
  { title: "Dann `--patch`-Overlays", body: "Kommandozeilen-Overlays, zuletzt angewandt. `config/examples/` liefert Opt-in-Overlays für GitHub-Review-Webhooks, Memory-MCP-Server und Cordis-Laufzeit-Tools; sie sind nie Teil eines Standardprofils." },
  { title: "Vor dem Start inspizieren", body: "`--dump-default-config` und `--dump-config` geben den zusammengesetzten Baum aus, ohne etwas zu starten — der schnellste Weg, „welche Schicht hat das gesetzt?“ zu beantworten." },
]} />

Ist HMR in YAML aktiviert, beobachtet `dsh-hmr` das Profilmanifest und beide Patch-Dateien und setzt jede Schicht über ein serialisiertes Reload neu zusammen. Ohne greifen Änderungen nach einem Neustart.

## Fünf Fallstricke, die je eine Stunde kosten

1. **Eine Cordis-Konfigurations-Überschreibung ersetzt die komplette Eintragskonfiguration.** Der Provider-Leitfaden buchstabiert es aus: Wenn Sie eine bestehende Überschreibung bearbeiten, müssen Sie die anderen Felder und die anderen Provider selbst erhalten. Patchen Sie einen Provider nachlässig, haben Sie den Rest gelöscht. Das ist der teuerste einzelne Fehler, der in `cordis.patch.yml` möglich ist.
2. **Eine Provider-ID ist dauerhaft.** Anfragen, gespeicherte Sitzungen, Modell-Standards und Credential-Referenzen hängen alle an ihr. Umbenennen heißt: einen neuen Provider hinzufügen und den alten löschen. Anzeigename, Basis-URL, Protokoll, Credential und Modellliste bleiben bearbeitbar.
3. **`--dump-config-schema` importiert Plugin-Code.** Anders als die anderen Dump-Flags lädt es die deklarierten Plugin-Schemata des zusammengesetzten Baums, um JSON Schema auszugeben — wer es auf nicht vertrauenswürdige Plugins richtet, führt deren Code zur Importzeit aus. Die CLI-Referenz enthält dazu einen eigenen Sicherheitshinweis. Behandeln Sie es wie [das Prüfen von Fremdcode](/docs/security/reviewing-third-party-code), nicht wie `--help`.
4. **Plugin-Versionskompatibilität wird erzwungen, und der Notausgang ist explizit.** Installation und Profilstart prüfen deklarierte DSH-Peer-Bereiche gegen die Laufzeitversion aus `dsh --version`; ein inkompatibles Plugin braucht eine bestätigte Ausnahme für die exakte Version (`allow-version`, `revoke-version`). Gute Hygiene, überraschend beim ersten Mal, wenn ein Plugin das Laden verweigert.
5. **Eine Sitzung, die bereits eine Anfrage gesendet hat, behält das in ihrem eigenen Log festgehaltene Modell.** Eine Änderung des Standardmodells verschiebt eine laufende Sitzung nicht rückwirkend, und wenn ein gespeicherter Standard einen gelöschten Provider benennt, blockiert das Eingabefeld, bis Sie einen anderen wählen. Beides ist korrektes Verhalten; beides sieht um 1 Uhr nachts wie ein Bug aus.

## Ausführen

<PromptCard title="Start the Web UI, then a headless one-shot run — no clone, no build">{`# Web UI on http://127.0.0.1:3080, workspace defaults to the invoking directory
npx @deepseek-ai/dsh web

# One persisted session, final answer to stdout, then exit — the CI shape
npx @deepseek-ai/dsh --profile headless "summarize this repo and list its main packages"

# Serve automation clients over ACP stdio (editor integrations)
npx @deepseek-ai/dsh --profile acp

# Inspect the composed config tree WITHOUT booting it
npx @deepseek-ai/dsh --profile web --dump-config

# Manage a profile's plugins (forwards to pnpm inside the profile directory)
npx @deepseek-ai/dsh plugin --profile web add some-dsh-plugin`}</PromptCard>

<PromptCard title="Point dsh at a gateway that speaks Anthropic Messages — in $DSH_HOME/profiles/web/cordis.patch.yml">{`# WARNING: a Cordis config override replaces the ENTIRE entry config.
# Include every provider you want to keep, not just the new one.
- id: llm-pi-ai
  config:
    providers:
      my-anthropic-gateway:
        apiKeyEnv: GATEWAY_API_KEY
        api: anthropic-messages      # or openai-completions / openai-responses
        baseURL: https://gateway.example/v1
        models:
          - id: some-text-model
          - id: some-vision-model
            input: [text, image]     # omit to inherit the catalog's input types`}</PromptCard>

<PromptCard title="Bring your Claude Code guardrails across">{`# The Claude Code hook bridge runs your existing command hooks inside dsh.
# Only the command-hook subset documented by Claude Code is supported.
# Hooks can: block a prompt or a tool call with a MODEL-VISIBLE message,
# add conversation context, or require the run to continue.
#
# Check the bridge's own README for the current config field names before
# wiring this up — the 0.2 line is a developer preview and they can move:
#   packages/hooks/hooks-claude-code/README.md
#
# Verify enforcement the same way you would in Claude Code: a hook that is
# configured but never fires is worse than no hook, because you trust it.`}</PromptCard>

## Wo es steht

Wenn Sie einen Harness auswählen statt ihn zu studieren, lautet die ehrliche Zusammenfassung: `dsh` ist der *architektonisch* interessanteste offene Harness, der derzeit ausgeliefert wird, und der am wenigsten bereite, tragend zu sein. Die eigene Sicherheitsdatei sagt das. Das Plugin-Modell ist wirklich stärker als das der Konkurrenz — dass `ctx.agentLoop` austauschbar ist, geht in den meisten Harnesses zu keinem Preis — und die Hook-Brücken machen die Einführung nicht zur Alles-oder-nichts-Wette.

Dagegen stehen: ein Release-Candidate als `latest`-Tag, kein Sicherheits-Audit, angekündigte Breaking Changes und ein Provider-Konzept, das API-Schlüssel voraussetzt. Für einen Vergleich über das Feld siehe [Coding-Agent-CLIs im Vergleich](/docs/models/coding-agent-clis-compared) und [lokale Coding-Agenten](/docs/models/local-coding-agents). Für die Modelle, mit denen Sie ihn am plausibelsten betreiben würden, siehe [DeepSeek-V4.1-Flash](/docs/models/deepseek-v4-1-flash-open-weight-1m).

<Flashcards cards={[
  { front: "DeepSeek Harness in einem Satz", back: "`dsh` — DeepSeeks Open-Source-Agent-Harness. MIT, TypeScript, erstmals veröffentlicht am 13. August 2026, 242.626 Sterne / 29.081 Forks (Stand 2026-10-03). Start mit `npx @deepseek-ai/dsh web`." },
  { front: "Cordis", back: "Das unter dsh eingebundene Plugin-Framework. Services beanspruchen stabile `ctx.<key>`-Namen, Abhängigkeiten werden mit `inject` deklariert, und Registrierungen sind umkehrbare Effekte, die über `ctx.effect()` installiert werden. Paper: arXiv:2608.25512, 26. August 2026." },
  { front: "Capability Seam", back: "Ein austauschbarer Service, in drei Rollen geteilt: das Paket, das ihn deklariert, die Pakete, die ihn implementieren, und die Pakete, die ihn konsumieren. Beispiele: `ctx.fs`, `ctx.subprocess`, `ctx.sandbox`, `ctx.subagents`, `ctx.llm`, `ctx.ptcRuntime`." },
  { front: "Die fünf Cordis-Dispatch-Modi", back: "`emit` (beobachten, keine Rückgabe), `waterfall` (Around-Middleware, gibt zurück), `parallel` (abgewartet, nebenläufig), `serial` (abgewartet, geordnet, gibt zurück), `bail` (stoppt beim ersten Bail-Wert). Der Modus gehört zum öffentlichen Vertrag eines Ereignisses." },
  { front: "Profile", back: "Geordnete Stapel von Patch-Schichten aus Plugin-Bundles unter `$DSH_HOME/profiles/<name>`. Ausgeliefert: `web`, `headless`, `sdk`, `sdk-minimal`, `acp`. `desktop` ist für die Electron-App reserviert, und die npm-CLI weigert sich, es zu starten." },
  { front: "Die Reihenfolge der Konfigurationsschichten", back: "Bundle-Patches in der Reihenfolge von `dsh.profile.bundles` → die `cordis.patch.yml` des Profils → `$DSH_HOME/cordis.patch.yml` → `--patch`-Overlays. Das Ergebnis vor dem Start mit `--dump-config` inspizieren." },
  { front: "Die Überschreibungsfalle", back: "Eine Cordis-Konfigurations-Überschreibung ersetzt die KOMPLETTE Eintragskonfiguration. Wer einen Provider in `llm-pi-ai` bearbeitet, ohne die anderen erneut aufzulisten, löscht sie." },
  { front: "Claude-Code-Hook-Brücke", back: "`hooks-claude-code` (und `hooks-codex`) führen Ihre bestehenden Command-Hooks aus der `hooks.json` in dsh aus — sie blockieren Prompts oder Tool-Aufrufe mit für das Modell sichtbaren Meldungen oder fügen Kontext hinzu. Unterstützt wird nur die Command-Hook-Teilmenge des Quellwerkzeugs." },
  { front: "Unterstützte Modellprotokolle", back: "Drei: `openai-completions`, `openai-responses`, `anthropic-messages`. Ein Provider spricht ein Protokoll, ein Gateway mit zwei Protokollen braucht also zwei Provider. Provider mit OAuth-Anmeldung werden nicht unterstützt — nur API-Schlüssel." },
  { front: "PTC-Modus / run_code", back: "Das Modell schreibt ein Programm, das Host-Funktionen als gewöhnliche asynchrone Aufrufe nutzt; nur die ausgegebene Ausgabe und der Rückgabewert kommen zurück. Frischer Node-Prozess pro Lauf unter der Sandbox-Policy, kein Zustand zwischen Läufen, Fehler als Ergebnisse. Experimentelles CPython-Backend über ein fd-3-Protokoll." },
  { front: "Die drei Sandbox-Modi", back: "`read-only`, `workspace-write` (Schreiben auf den Sitzungs-Workspace beschränkt), `danger-full-access`. Backends: bwrap dann Landlock unter Linux, Seatbelt unter macOS, ein eingeschränktes Token plus ACL-Schreibbeschränkung unter Windows. Ein verweigerter Aufruf kann über eine einmalige, vom Nutzer genehmigte Eskalation wiederholt werden." },
  { front: "\"Same-world only\"", back: "Die eigene Beschreibung der Sandbox-Gruppe für ihre Eingrenzung: Sie teilt den Host-Kernel und das Host-Dateisystem. Container, MicroVMs und Remote-Executor sind hier keine Backends — sie ersetzen stattdessen ganze Fähigkeiten." },
  { front: "\"Model-visible means logged\"", back: "Die Invariante des Sitzungslogs: Jede Eingabe, die das Modell sah, muss aus dem Append-only-Log `session.vN.jsonl[.zstd]` rekonstruierbar sein. Live-Ereignisse steuern nur die Oberfläche und sind nicht die Wahrheitsquelle." },
  { front: "Replay + token-meter", back: "`llm-replay` spielt eine aufgezeichnete Sitzung erneut ab, und `token-meter` misst ihre Token-Kosten — so vergleicht man zwei Prompt- oder Modelländerungen auf identischen Eingaben. Ermöglicht durch die Logging-Invariante." },
  { front: "MCP in dsh", back: "Opt-in, ein `@deepseek-ai/dsh-mcp-client`-Plugin-Eintrag pro Server, stdio oder Streamable HTTP, kein gemeinsamer `ctx.mcp`-Service. Kein konfigurierter Server bedeutet null MCP-Prompt-Text und null MCP-Tools. Tool-Namen sind durch `serverName` namensraumgetrennt; Server-Anweisungen sind durch `maxInstructionBytes` begrenzt." },
]} />

<Quiz questions={[
  {
    q: "Welches davon ist in DeepSeek Harness NICHT über die Konfiguration austauschbar?",
    options: [
      "Der Modelladapter",
      "Die Agentenschleife",
      "Das Sitzungslog",
      "Keines davon — architecture.md nennt alle drei Plugins"
    ],
    answer: 3,
    explain: "docs/architecture.md: 'Every part of the product is a plugin, including the model adapter, the tool registry, the session log, and the agent loop itself, so each is replaceable from configuration.' Das ist der ungewöhnliche Teil des Designs — in den meisten Harnesses ist die Schleife das eine Feste."
  },
  {
    q: "Sie wollen dsh mit Claude über das Abo betreiben, für das Sie bereits zahlen. Was passiert?",
    options: [
      "Es funktioniert — den Provider `anthropic` wählen und anmelden",
      "Es funktioniert nicht: OAuth-Anmelde-Provider werden nicht unterstützt, Sie brauchen einen API-Schlüssel",
      "Es funktioniert nur im Profil `acp`",
      "Es funktioniert, erfordert aber, dass das Anthropic-Messages-Protokoll manuell gesetzt wird"
    ],
    answer: 1,
    explain: "Der Provider-Leitfaden sagt, dass Provider, die sich per OAuth anmelden — er nennt Codex als Beispiel — 'are not supported here yet.' Der ausgelieferte Katalog enthält eine Provider-ID `anthropic`, die aber einen API-Schlüssel nimmt. Planen Sie mit abgerechneten Tokens, nicht mit einem Platz."
  },
  {
    q: "Sie bearbeiten `llm-pi-ai` in cordis.patch.yml, um ein neues Gateway hinzuzufügen, und listen unter `providers` nur dieses Gateway auf. Was ist das Ergebnis?",
    options: [
      "Das neue Gateway wird neben Ihren bestehenden Providern zusammengeführt",
      "Die Änderung wird abgelehnt, weil die Konfiguration unvollständig ist",
      "Ihre anderen Provider verschwinden — eine Cordis-Überschreibung ersetzt die komplette Eintragskonfiguration",
      "Das neue Gateway wird ignoriert, bis Sie dsh neu starten"
    ],
    answer: 2,
    explain: "Die Docs sagen es klar: 'A Cordis config override replaces the complete entry config; preserve other providers and fields when editing an existing override.' Das ist der teuerste einzelne Fehler in dieser Datei — und da Modelländerungen ohne Neustart gelten, merken Sie es bei der nächsten Anfrage, nicht beim Start."
  },
  {
    q: "Worauf stützt sich `workspace-write` unter macOS tatsächlich?",
    options: [
      "Eine Container-Laufzeit",
      "Seatbelt",
      "Landlock",
      "Ein eingeschränktes Zugriffstoken"
    ],
    answer: 1,
    explain: "Die Backends von sandbox-local sind bwrap dann Landlock unter Linux, Seatbelt unter macOS und ein eingeschränktes Windows-Token (mit sandbox-windows-acl, das Schreibzugriffe auf den Workspace und ein privates Temp-Verzeichnis beschränkt). Alles ist 'same-world only' — gemeinsamer Host-Kernel und Dateisystem, keine Isolation."
  },
  {
    q: "Warum kann dsh eine Sitzung abspielen und ihre Token-Kosten messen?",
    options: [
      "Weil es jede Modellantwort cacht",
      "Weil das Sitzungslog garantiert, dass alles für das Modell Sichtbare protokolliert ist",
      "Weil die DeepSeek-API deterministische Ausgaben liefert",
      "Weil token-meter das gerenderte UI-Transkript neu tokenisiert"
    ],
    answer: 1,
    explain: "Die Invariante lautet 'model-visible means logged': Jede Modelleingabe muss aus dem Append-only-JSONL-Log rekonstruierbar sein, während Live-UI-Ereignisse ausdrücklich getrennt bleiben. Deshalb sind `llm-replay` plus `token-meter` eine echte Messung und keine Näherung."
  },
  {
    q: "Sie konfigurieren keine MCP-Server. Was sieht das Modell?",
    options: [
      "Einen kurzen MCP-Abschnitt, der erklärt, dass keine Server verbunden sind",
      "Die gemeinsamen Ressourcen-Tools mit leerer Serverliste",
      "Gar nichts MCP-Bezogenes — keinen Prompt-Text und keine Tools, im nativen oder PTC-Modus",
      "Es hängt vom Profil ab"
    ],
    answer: 2,
    explain: "Das MCP-Subsystem-Dokument: Ein Aufrufer ohne sichtbaren konfigurierten Server 'receive[s] no MCP prompt text or tools in native or PTC mode.' Server sind Opt-in pro Plugin-Eintrag, und der erste Provider in einem Scope aktiviert die gemeinsamen Ressourcen-Tools."
  },
  {
    q: "Welches Dump-Flag sollten Sie NICHT auf nicht vertrauenswürdige Plugins richten?",
    options: [
      "`--dump-config`",
      "`--dump-default-config`",
      "`--dump-config-schema`",
      "Alle drei sind inert"
    ],
    answer: 2,
    explain: "`--dump-config-schema` importiert die deklarierten Plugin-Schemata des zusammengesetzten Baums, um JSON Schema auszugeben, und führt damit Plugin-Code zur Importzeit aus. Die anderen beiden geben die zusammengesetzte Konfiguration aus, ohne zu starten. Die CLI-Referenz trägt genau dafür einen eigenen Sicherheitshinweis."
  }
]} />

## Quellen &amp; weiterführende Lektüre

- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) — das Repository: README, Stern- und Fork-Zahlen, MIT-Lizenz, Topic `dsh-plugin`.
- [docs/architecture.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md) — die Plugin-Behauptung, Service-Schlüssel, Profile und Bundles, die Turn/Step-Schleife, die Invariante des Sitzungslogs.
- [docs/cordis-primer.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md) — Cordis in fünf Ideen, die fünf Dispatch-Modi, Waterfall-Semantik, Loader-Konfiguration.
- [docs/capability-seams.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md) — der generierte Service-Graph: jeder `ctx.*`-Schlüssel, sein Eigentümer, Implementierungen und Konsumenten.
- [SAFETY.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md) — was der Harness Ihrem Rechner antun kann, und die ausdrückliche Aussage „not secure or production-ready“.
- [packages/sandbox/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/sandbox/README.md) — die drei Modi, die Backends pro Plattform, Eskalation und „same-world only“.
- [packages/hooks/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/hooks/README.md) — die Hook-Brücken für Claude Code und Codex und die Grenze der Command-Hook-Teilmenge.
- [packages/ptc-runtime/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/ptc-runtime/README.md) — der `run_code`-Vertrag, Ausführung im frischen Prozess, das experimentelle Python-Backend.
- [docs/subsystems/mcp.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/mcp.md) — Client-Plugins pro Server, Scope-Regeln, Namensräume für Namen, `maxInstructionBytes`, Protokollaushandlung.
- [docs/user/guide/providers.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/providers.md) — Provider-IDs, die drei API-Protokolle, die OAuth-Einschränkung, Credential-Speicherung, die Warnung zur Überschreibung.
- [apps/cli/README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/README.md) — Einstiegsmodi, Reihenfolge der Profilzusammensetzung, Bundle-Namen, `dsh plugin`, die Dump-Flags, Versionsausnahmen.
- [DeepSeek-Harness-Produktseite](https://deepseek.com/harness) — die Desktop-Installer (macOS Apple Silicon `.dmg`, Windows 64-Bit `.exe`) und der Preview-Status.
- [arXiv:2608.25512](https://arxiv.org/abs/2608.25512) — *A Programming Paradigm for Spatiotemporal Composability*, das vom Projekt zitierte Cordis-Paper.
- [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) — Community-Plugin-Index für das Topic `dsh-plugin`.

## Weiter

- [Pi 1.0: der minimale Harness und der Codemode-Trick](/docs/models/pi-1-0-minimal-agent-harness) — die klarste veröffentlichte Darstellung, warum `run_code` Kontext spart, und die dazugehörigen MCP-Expositionsmodi.
- [Coding-Agent-CLIs im Vergleich](/docs/models/coding-agent-clis-compared) — wo `dsh` gegenüber den Harnesses steht, die Sie vielleicht schon betreiben.
- [Lokale und hybride Agenten absichern](/docs/models/securing-local-and-hybrid-agents) — was man um jeden Harness legen sollte, dessen eigene Sicherheitsdatei einem rät, seiner Sandbox nicht zu trauen.
