# Berechtigungen und Berechtigungsmodi

> Source: https://derob98.github.io/ailmanac/de/docs/claude-code/permissions · AILmanac (CC BY 4.0) · last verified 2026-08-18

allow/ask/deny-Regeln und Modi — weniger Rückfragen, ohne Sicherheit zu verlieren.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-08-18" source="https://code.claude.com/docs/en/whats-new/2026-w32">
Die genaue Regelsyntax und die Modusnamen entwickeln sich weiter — prüfe sie anhand der offiziellen Claude-Code-Dokumentation zu Berechtigungen und Berechtigungsmodi. **Seit v2.1.283:** `auto` ist bei allen Tarifen und Anbietern der eingebaute Startmodus für interaktive Terminal- und VS-Code-Sitzungen (siehe unten).
</VerifyNote>

<Callout type="objectives" items={["Was die drei Berechtigungsurteile (allow / ask / deny) bedeuten", "Wie Berechtigungsregeln ein Tool mit einem Muster abgleichen", "Die sechs Berechtigungsmodi und wann man welchen nutzt", "Warum der auto-Modus jetzt der Startmodus für interaktive Sitzungen ist — und wie man ihn abwählt", "Wie der auto-Modus Rückfragen durch einen Sicherheitsklassifikator ersetzt", "Wie man eine vernünftige Start-Allowlist aufbaut, die Rückfragen reduziert, ohne Sicherheit zu verlieren", "Wo Projekt- und persönliche Berechtigungsregeln gespeichert werden"]} />

Berechtigungen legen fest, **was Claude Code tun darf, ohne bei dir nachzufragen**. Gut eingestellt bekommst du Flow ohne Kontrollverlust; schlecht eingestellt winkst du entweder alles durch oder ertrinkst in Rückfragen.

## Die drei Urteile

Jede mögliche Aktion führt zu einem von diesen:

<Flashcards cards={[{front: "allow", back: "Ausführen, ohne Rückfrage."}, {front: "ask", back: "Anhalten und dich fragen — der Standard für alles, was nicht ausdrücklich erlaubt oder verboten ist."}, {front: "deny", back: "Niemals, auch nicht auf Anfrage."}]} />

Regeln gleichen in der Regel ein Tool mit einem Muster ab, z. B. allow `Bash(npm run test:*)` oder deny `Read(./.env)`.

<PromptCard title="Ein Tool + Muster erlauben">{`Bash(npm run test:*)`}</PromptCard>

<PromptCard title="Ein Tool + Muster verbieten">{`Read(./.env)`}</PromptCard>

## Berechtigungsmodi

Ein Modus legt die Grundhaltung einer Sitzung fest. Es gibt sechs. Die gängigen schaltest du mit `Shift+Tab` durch, oder du setzt `permissions.defaultMode` in den Einstellungen.

| Modus | Läuft ohne Rückfrage | Einsatz |
|---|---|---|
| **`default`** (angezeigt als **Manual**) | Nur Lesezugriffe | Alltagsarbeit, sensible Änderungen |
| **`acceptEdits`** | Lesen, Dateibearbeitungen, gängige Dateisystembefehle | Eine vertrauenswürdige, klar abgegrenzte Bearbeitungssitzung |
| **`plan`** | Lesen sowie vom Klassifikator genehmigte Befehle, wenn der auto-Modus verfügbar ist; ändert nie deinen Quellcode | Große/riskante Aufgaben — siehe [Plan Mode](/docs/claude-code/plan-mode) |
| **`auto`** *(seit v2.1.283 der Startmodus für interaktive Sitzungen)* | Alles, geprüft von einem Sicherheitsklassifikator | Lange Aufgaben, bei denen Rückfrage-Müdigkeit das eigentliche Risiko ist |
| **`dontAsk`** | Dateilesezugriffe in deinen Arbeitsverzeichnissen und vorab genehmigte Tools; alles, was eine Rückfrage auslösen würde, wird verweigert | Abgeriegelte CI und Skripte |
| **`bypassPermissions`** | Alles, ohne Prüfungen | Nur Sandboxes/Container — **niemals** auf einem Rechner mit Geheimnissen |

### Der auto-Modus ist jetzt der Standard von Claude Code

Seit Claude Code **v2.1.283** ist `auto` bei **allen Tarifen und Anbietern** der eingebaute Startmodus für interaktive Terminal- und VS-Code-Sitzungen. In früheren Versionen war er ab dem 14. August 2026 nur bei Pro-, Max- und Team-Tarifen der Standard für neue Sitzungen. Anthropics Begründung (aus eigenen Tests mit über 1.000 zahlenden Nutzern): Der Klassifikator erkannte **89 %** der schädlichen Aktionen gegenüber **13,6 %** bei manueller Prüfung — weil sich die Nutzer daran gewöhnt hatten und etwa 97 % der manuellen Rückfragen ungelesen bestätigten.

Zwei Ausnahmen wahren die Absicht:

- Wenn **du** `permissions.defaultMode` in deinen Benutzereinstellungen gesetzt hast, bleibt es bestehen, es sei denn, du akzeptierst eine einmalige Umschaltaufforderung in der App.
- Wenn **deine Organisation** den Standard verwaltet (verwaltete Einstellungen bei Team/Enterprise), ändert sich nichts automatisch.

Du kannst die Modi jederzeit mitten in der Sitzung mit `Shift+Tab` durchschalten. Eine verwandte Änderung, die bei diesen Tarifen bereits gilt: Die Klassifikator-Aufrufe des auto-Modus **zählen nicht mehr auf deine Nutzungslimits**.

<PromptCard title="Früh umsteigen (vor dem 14. Aug.) — auto als Standard setzen">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "auto"
  }
}`}</PromptCard>

<PromptCard title="Nach dem 14. Aug. beim alten Rückfrageverhalten bleiben">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "default"
  }
}`}</PromptCard>

### Wie der auto-Modus tatsächlich funktioniert

`auto` ist der Mittelweg zwischen „bei allem nachfragen“ und „Sicherheit abschalten“. Statt dich zu fragen, prüft ein separates **Klassifikatormodell** jede Aktion vor der Ausführung und blockiert alles, was über das Erbetene hinaus eskaliert, Infrastruktur berührt, die es nicht kennt, oder von feindlichen Inhalten getrieben scheint, die Claude gerade gelesen hat. Ausdrückliche `ask`-Regeln halten weiterhin an und fragen dich.

Blockiert werden etwa `curl | bash`, Force-Pushes, Produktions-Deployments und -Migrationen, `rm -rf` auf nicht aufgelösten Variablen, Manipulationen am Transkript, destruktive Git-Befehle, die nicht committete Arbeit verwerfen, und das Senden von Geheimnissen an externe Endpunkte — Routinearbeit (lokale Änderungen, Installation deklarierter Abhängigkeiten, schreibgeschütztes HTTP, Push auf deinen eigenen Branch) läuft dagegen direkt durch. Wird dieselbe Aktion wiederholt blockiert, pausiert der auto-Modus und gibt die Rückfragen an dich zurück.

Der auto-Modus ist keine Sicherheitsgarantie — er reduziert Rückfragen, ersetzt aber nicht die Prüfung sensibler Vorgänge. Die Verfügbarkeit hängt von Tarif, Modell und (bei Team/Enterprise) einem Admin-Schalter ab. Wenn du wirklich unbeaufsichtigt arbeitest (Cron, Cloud-Sitzungen, CI), kombiniere ihn mit [Hardening Autonomous Runs](/docs/security/hardening-autonomous-runs) — auto ist trotzdem nicht `bypassPermissions`.

<Callout type="warning" items={["bypassPermissions gehört in eine Sandbox. Mit abgeschalteten Rückfragen auf deinem echten Rechner zu arbeiten, ist der Weg, auf dem ein Agent etwas anfasst, was er nicht sollte. Reserviere es für Wegwerf-Umgebungen — wenn du eigentlich nur weniger Rückfragen willst, nutze stattdessen den auto-Modus. Siehe Hardening Autonomous Runs unter /docs/security/hardening-autonomous-runs."]} />

## Eine vernünftige Start-Allowlist

Das Ziel: das Sichere und Wiederkehrende vorab erlauben; Destruktives auf **ask** oder **deny** lassen.

<Steps items={[{title: "Das Sichere und Wiederkehrende erlauben", body: "Dateien lesen, deine Test-/Lint-/Build-Befehle ausführen, git status/diff."}, {title: "Bei mittlerem Risiko vorher fragen", body: "Abhängigkeiten installieren, Dateien außerhalb des Projekts schreiben, Netzwerkaufrufe."}, {title: "Das Destruktive verbieten", body: "Geheime Dateien lesen (.env, Schlüsseldateien), Force-Push, rm -rf."}]} />

Speichere Projektregeln in [`settings.json`](/docs/claude-code/settings) (geteilt) und persönliche Überschreibungen in `settings.local.json`.

<Callout type="tip" items={["Lass es aus deinen Rückfragen lernen: Bestätige denselben sicheren Befehl ein paar Mal, und du weißt genau, was in deine Allowlist gehört — so werden wiederholte Rückfragen zu einer einmaligen Regel."]} />

<Callout type="takeaways" items={["Drei Urteile: allow (keine Rückfrage), ask (Standard — anhalten und bestätigen), deny (niemals).", "Regeln gleichen ein Tool mit einem Muster ab, etwa Bash(npm run test:*) oder Read(./.env).", "Sechs Modi legen die Sitzungshaltung fest: default (Manual), acceptEdits, plan, auto, dontAsk, bypassPermissions.", "Seit v2.1.283 ist auto bei allen Tarifen der Startmodus für interaktive Terminal- und VS-Code-Sitzungen; ein selbst gesetzter defaultMode bleibt bestehen, und von der Organisation verwaltete Standards bleiben unberührt.", "Der auto-Modus prüft jede Aktion mit einem Sicherheitsklassifikator, statt dich zu fragen — das ist das Mittel gegen Rückfrage-Müdigkeit, nicht bypassPermissions.", "Baue eine Allowlist: Sicheres und Wiederkehrendes erlauben, bei mittlerem Risiko fragen, Destruktives verbieten.", "Geteilte Regeln gehören in settings.json; persönliche Überschreibungen in settings.local.json."]} />

<Quiz title="Teste dich selbst" questions={[{q: "Was bewirkt das Standardurteil 'ask' bei einer Aktion, die weder ausdrücklich erlaubt noch verboten ist?", options: ["Führt sie stillschweigend aus", "Hält an und bittet dich um Bestätigung", "Blockiert sie dauerhaft"], answer: 1, explain: "ask ist der Standard für alles, was nicht ausdrücklich erlaubt oder verboten ist — es hält an und fragt dich."}, {q: "Welcher Berechtigungsmodus ist NUR in Sandboxes oder Containern sicher, niemals auf einem Rechner mit Geheimnissen?", options: ["plan", "acceptEdits", "bypassPermissions"], answer: 2, explain: "bypassPermissions überspringt Rückfragen und Sicherheitsprüfungen vollständig; reserviere es für Wegwerf-Umgebungen — niemals auf einem Rechner mit Geheimnissen."}, {q: "Du willst bei einer langen Aufgabe deutlich weniger Berechtigungsrückfragen, aber trotzdem ein Sicherheitsnetz. Welcher Modus?", options: ["bypassPermissions — überspringt jede Rückfrage", "auto — ein Klassifikator prüft jede Aktion und blockiert riskante", "dontAsk — unterbricht dich nie"], answer: 1, explain: "Der auto-Modus ersetzt Rückfragen durch einen Klassifikator, der Eskalationen wie curl | bash, Force-Pushes und Produktions-Deployments blockiert. bypassPermissions entfernt das Sicherheitsnetz; dontAsk verweigert einfach alles, was nicht vorab genehmigt ist."}, {q: "Wo speicherst du geteilte Projekt-Berechtigungsregeln und wo persönliche Überschreibungen?", options: ["Beides in settings.local.json", "Projektregeln in settings.json; persönliche Überschreibungen in settings.local.json", "Projektregeln in settings.local.json; persönliche Überschreibungen in settings.json"], answer: 1, explain: "Projektregeln gehören in settings.json (geteilt); persönliche Überschreibungen in settings.local.json."}, {q: "Was davon gehört in einer vernünftigen Start-Allowlist auf die 'deny'-Liste?", options: ["git status / diff", "rm -rf und das Lesen von .env", "Deine Test-/Lint-/Build-Befehle ausführen"], answer: 1, explain: "Verbiete Destruktives: das Lesen geheimer Dateien (.env, Schlüsseldateien), Force-Push und rm -rf."}, {q: "Was passiert am 14. August 2026 bei einem Pro-Tarif, wenn du permissions.defaultMode in deinen Benutzereinstellungen bereits auf 'default' gesetzt hattest?", options: ["Es wird automatisch auf 'auto' überschrieben", "Es bleibt 'default', es sei denn, du akzeptierst eine einmalige Umschaltaufforderung in der App", "Der auto-Modus wird trotzdem stillschweigend auf jede neue Sitzung angewendet"], answer: 1, explain: "Ein defaultMode, den du selbst in den Benutzereinstellungen gesetzt hast, bleibt erhalten; Claude Code bietet eine einmalige Umschaltaufforderung an, überschreibt aber nicht deine Wahl. Von der Organisation verwaltete Standards bleiben ebenfalls unberührt."}]} />

## Weiter

- [settings.json: Das Konfigurationssystem](/docs/claude-code/settings)
- [Hooks](/docs/claude-code/hooks) — Regeln deterministisch durchsetzen, über allow/deny hinaus
- [Sandbox Credential Masking](/docs/claude-code/sandbox-credential-masking) — `gh`, `npm` und `aws` sich authentifizieren lassen, ohne dass der Befehl in der Sandbox je das echte Geheimnis besitzt
- [Sicherheit und verantwortungsvolle Nutzung](/docs/security/responsible-use)
