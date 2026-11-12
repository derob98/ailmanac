# Kontextverwaltung

> Source: https://derob98.github.io/ailmanac/de/docs/claude-code/context-management · AILmanac (CC BY 4.0) · last verified 2026-11-08

/compact vs. /clear, automatische Komprimierung und wie du effektiv bleibst, während Sessions wachsen.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={["/clear und /compact unterscheiden und sofort den richtigen Befehl wählen", "Eine Komprimierung steuern, statt sie raten zu lassen, und einstellen, wann die automatische auslöst", "Genau wissen, was eine Komprimierung überlebt und was weggefasst wird", "Vier Techniken anwenden, um lange Sessions scharf zu halten", "Die Symptome eines vollen Kontextfensters erkennen und schnell beheben"]} />

<VerifyNote lastVerified="2026-11-08" source="https://code.claude.com/docs/en/context-window">
Befehlsnamen, das Fenster der automatischen Komprimierung und die Tabelle dessen, was eine Komprimierung überlebt, ändern sich von Release zu Release — prüfe sie in der offiziellen Dokumentation.
</VerifyNote>

## Die Grundidee

Jede Session hat ein endliches [Kontextfenster](/docs/foundations/tokens-and-context). Während es sich füllt, werden ältere Inhalte zusammengequetscht, und Claude kann anfangen zu „driften". Den Kontext bewusst zu verwalten hält lange Sessions scharf.

## Die zwei essenziellen Befehle

Zwei Befehle decken fast jede Situation ab. Der Trick ist, den Befehl zu deiner Absicht passend zu wählen.

<Flashcards cards={[{front: "/clear", back: "Die Konversation löschen und frisch beginnen. Nutze es, wenn du zu einer UNABHÄNGIGEN Aufgabe wechselst. Der günstigste Weg zu einem sauberen, fokussierten Kontext. Aliase: /reset und /new."}, {front: "/compact", back: "Die bisherige Konversation in eine kompakte Form zusammenfassen — der Kern bleibt erhalten, Platz wird frei. Nutze es, wenn du dieselbe Aufgabe FORTSETZEN willst, das Fenster aber voll wird. Nimmt optionale Fokus-Anweisungen entgegen."}]} />

Entscheide mit einer Frage: Ist es eine neue Aufgabe oder dieselbe?

```mermaid
flowchart TD
  A{New task or same task?} -->|New / unrelated| B[/clear]
  A -->|Same task, context full| C[/compact]
```

Zwei Details, die man leicht übersieht:

- **`/compact` nimmt Anweisungen entgegen.** `/compact focus on the auth bug fix` behält, was *du* auswählst, statt dessen, was der automatische Durchlauf für wichtig hält. Führe es bewusst aus, bevor du eine lange neue Aufgabe beginnst, statt zu warten, bis das Fenster es erzwingt.
- **`/clear` ist kein Point of no Return.** Übergib einen Namen (`/clear auth refactor`), um die ausgehende Konversation im `/resume`-Picker zu beschriften; und innerhalb desselben Claude-Code-Prozesses bietet das Rewind-Menü weiterhin einen Eintrag `/resume <session-id> (previous session)` an — siehe [Checkpoints & Rewind](/docs/claude-code/checkpoints-and-rewind).

## Automatische Komprimierung — und wie du sie verschiebst

Nähert sich der Kontext dem Limit, **komprimiert Claude Code automatisch**, damit die Arbeit ohne harten Stopp weitergeht. Bei Modellen mit 1M-Kontextfenster passiert das standardmäßig bei etwa 967K Tokens; frühere Modelle komprimieren an der Grenze ihres Kontextfensters. Claude Code kann auch eine Konversation komprimieren, die du ruhen lässt.

Die Schwelle kannst du verschieben. `/autocompact 500k` komprimiert früher — nützlich, wenn du lieber zu deinen Bedingungen zusammenfasst als bei 96 % Füllstand — und `/autocompact auto` kehrt zu dem für dein Modell abgestimmten Fenster zurück.

<PromptCard title="Früher komprimieren als standardmäßig">{`/autocompact 500k`}</PromptCard>

<Steps items={[{title: "Akzeptierte Werte", body: "Eine reine Token-Zahl (500000), eine mit Suffix (500k, 1m), auto, um zum abgestimmten Fenster des Modells zurückzukehren, oder off, um die automatische Komprimierung für die Session zu deaktivieren. Führe /autocompact ohne Argument aus, um das aktuelle Fenster zu sehen."}, {title: "Wo man es einstellen kann", body: "Der Befehl /autocompact speichert in deinen Benutzereinstellungen unter dem aktuellen Modell in modelSettings. Du kannst autoCompactWindow auch auf oberster Ebene deines Settings-JSON oder pro Modell unter modelSettings setzen, oder die Umgebungsvariable CLAUDE_CODE_AUTO_COMPACT_WINDOW verwenden."}, {title: "Vorrang, höchster zuerst", body: "CLAUDE_CODE_AUTO_COMPACT_WINDOW, dann autoCompactWindow pro Modell in modelSettings, dann autoCompactWindow auf oberster Ebene, dann das Standardfenster des Modells. Setzt ein Settings-Scope mit höherer Priorität, etwa verwaltete Einstellungen, das Fenster, speichert /autocompact deinen Wert, aber die Session behält den Wert dieses Scopes — und sagt dir das."}]} />

<Callout type="tip" items={["Betrachte die automatische Komprimierung als Auffangnetz, nicht als Strategie. Zwischen unabhängigen Aufgaben zu leeren hält den Kontext sauberer, als das Fenster volllaufen zu lassen, bis die automatische Komprimierung greift.", "Wenn du komprimierst, dann mit Absicht: /compact mit Fokus-Anweisungen schlägt einen automatischen Durchlauf, der rät, was wichtig war."]} />

## Was die Komprimierung überlebt

Die Komprimierung fasst die *Konversation* zusammen. Alles, was dein Setup von der Festplatte lädt, wird separat behandelt — deshalb kennt eine komprimierte Session weiterhin deine Projektkonventionen.

<Steps items={[{title: "Von der Festplatte neu eingespielt", body: "Der System-Prompt und der Output-Stil gelten weiter; die CLAUDE.md im Projektstamm, Regeln ohne Scope, Auto-Memory und der Plan, den Claude im Plan Mode geschrieben hat, kommen zurück. Skill-Beschreibungen werden aus deinen aktuellen Skills neu aufgebaut (Claude Code v2.1.304 oder neuer). Begann die Session mit einem git-status-Snapshot, liest Claude Code einen frischen."}, {title: "Bei Bedarf nachgeladen", body: "Regeln mit paths:-Frontmatter und verschachtelte CLAUDE.md-Dateien in Unterverzeichnissen werden weggefasst und erst neu geladen, wenn Claude das nächste Mal eine passende Datei berührt. Muss eine Regel die Komprimierung überdauern, entferne das paths:-Frontmatter oder verschiebe sie in die CLAUDE.md im Projektstamm."}, {title: "Teilweise wiederhergestellt", body: "Claude Code liest bis zu fünf der Dateien erneut, die Claude gelesen oder bearbeitet hat, zuletzt geänderte zuerst — eine Datei über 5.000 Tokens kommt jedoch nur als Pfadverweis ('Referenced file') ohne Inhalt zurück. Die Texte aufgerufener Skills werden mit einer Obergrenze von 5.000 Tokens pro Skill und 25.000 insgesamt neu eingespielt, die ältesten fallen zuerst weg, und der Dateianfang bleibt erhalten: Setze Wichtiges an den Anfang der SKILL.md."}, {title: "Weggefasst", body: "Die Konversation selbst, einschließlich Kontext, den Hooks zuvor hinzugefügt haben. SessionStart-Hooks, die zur Quelle 'compact' passen, laufen erneut, und ihre Ausgabe wird Teil des komprimierten Kontexts — das ist der Hook für alles, was zurückkommen muss."}, {title: "Unberührt", body: "Hintergrundbefehle und Hintergrund-Subagenten laufen weiter, und Claude Code erinnert Claude daran, welche noch aktiv sind, damit es keinen Duplikat startet."}]} />

## Techniken, um effektiv zu bleiben

Neben den beiden Befehlen halten vier Gewohnheiten deinen Kontext von Anfang an schlank.

<Steps items={[{title: "Eine Aufgabe pro Session", body: "Lass nicht einen ganzen Nachmittag unabhängiger Arbeit in einem Kontext zusammenlaufen."}, {title: "Schweres Lesen an Subagenten delegieren", body: "Gib große Lesearbeiten an Subagenten ab — sie verbrennen IHREN Kontext und liefern nur das Ergebnis zurück. Siehe /docs/claude-code/subagents."}, {title: "Verweisen, nicht einfügen", body: "Zeige Claude per @path auf Dateien, statt große Blöcke einzufügen, und halte die CLAUDE.md schlank (siehe /docs/claude-code/claude-md)."}, {title: "Das Budget im Blick behalten", body: "Führe /context aus für eine Live-Aufschlüsselung nach Kategorien — ein farbiges Raster plus Optimierungsvorschläge für kontextlastige Tools und aufgeblähtes Memory, einschließlich der geladenen CLAUDE.md- und Auto-Memory-Dateien. Übergib 'all', um die Liste pro Eintrag im Vollbildmodus aufzuklappen. Eine Statusline, die die Kontextnutzung anzeigt, liefert dasselbe Signal passiv. Siehe /docs/claude-code/statusline."}]} />

<PromptCard title="Sieh, wohin dein Kontext tatsächlich gegangen ist">{`/context`}</PromptCard>

Diese verweisen auf die aktuelle Dokumentation: [Subagenten](/docs/claude-code/subagents), [CLAUDE.md](/docs/claude-code/claude-md) und [Statusline](/docs/claude-code/statusline).

:::tip[Symptom → Abhilfe]
Wenn Claude beginnt, eine frühere Anweisung zu vergessen oder sich zu wiederholen, ist das Fenster wahrscheinlich voll. `/compact` (dieselbe Aufgabe) oder `/clear` (neue Aufgabe) behebt das meist sofort. Führe `/context` aus, um es zu bestätigen — hat die Konversation das Fenster tatsächlich überschritten, nennt die Ausgabe, wie weit du darüber liegst und welcher Befehl Platz schafft. Mehr in [Warum hat Claude das getan?](/docs/contribute/troubleshooting).

Stößt du stattdessen auf `Autocompact is thrashing`, funktioniert die Komprimierung, aber etwas Überdimensioniertes füllt das Fenster immer wieder neu — siehe [Claude Code Fehlerbehebung](/docs/claude-code/troubleshooting).
:::

<Callout type="takeaways" items={["/clear löscht die Konversation für einen frischen Start — nutze es für unabhängige Aufgaben (Aliase: /reset, /new)", "/compact fasst die Session zusammen, um Platz zu schaffen — nutze es, um dieselbe Aufgabe fortzusetzen, wenn das Fenster voll wird, und gib Fokus-Anweisungen mit, damit es behält, was dir wichtig ist", "Die automatische Komprimierung ist ein Sicherheitsnetz, keine Strategie: Sie löst bei Modellen mit 1M-Kontext um 967K Tokens aus, und /autocompact 500k (oder auto, oder off) verschiebt diese Linie", "Die Komprimierung fasst die Konversation zusammen, spielt aber CLAUDE.md, Regeln ohne Scope, Auto-Memory und den Plan von der Festplatte neu ein; pfadbezogene Regeln, verschachtelte CLAUDE.md-Dateien und große Dateiinhalte kommen nicht intakt zurück", "Halte den Kontext schlank: eine Aufgabe pro Session, schweres Lesen an Subagenten delegieren, auf Dateien verweisen statt einzufügen und /context oder eine Statusline prüfen", "Vergessen oder Wiederholen bedeutet ein volles Fenster — /compact (dieselbe Aufgabe) oder /clear (neue Aufgabe) behebt es"]} />

<Quiz title="Teste dich selbst" questions={[{q: "Du beendest eine Aufgabe und wechselst zu etwas völlig Unabhängigem. Welcher Befehl?", options: ["/compact — um die bisherige Arbeit zusammenzufassen", "/clear — um die Konversation zu löschen und frisch zu beginnen", "Keiner — die automatische Komprimierung erledigt das"], answer: 1, explain: "/clear löscht die Konversation und beginnt frisch. Es ist der günstigste Weg zu einem sauberen, fokussierten Kontext, wenn du zu einer unabhängigen Aufgabe wechselst."}, {q: "Du bist mitten in einer Aufgabe, das Kontextfenster wird voll, aber du willst an derselben Arbeit weitermachen. Welcher Befehl?", options: ["/clear — um den meisten Platz freizugeben", "/compact — um die Konversation zusammenzufassen und den Kern zu behalten", "Ein neues Terminal öffnen"], answer: 1, explain: "/compact fasst die bisherige Konversation in eine kompakte Form zusammen, behält den Kern und schafft Platz — ideal, um dieselbe Aufgabe fortzusetzen."}, {q: "Wie sollte man die automatische Komprimierung richtig einordnen?", options: ["Als primäre Strategie zur Kontextverwaltung", "Als Sicherheitsnetz, dessen Schwelle du verschieben kannst — ein proaktives /clear und ein bewusstes /compact liefern bessere Ergebnisse", "Als Bug, den man deaktivieren sollte"], answer: 1, explain: "Die automatische Komprimierung lässt die Arbeit ohne harten Stopp weiterlaufen, wenn der Kontext sich dem Limit nähert — bei Modellen mit 1M-Kontext standardmäßig bei etwa 967K Tokens. Sie ist ein Auffangnetz: Zwischen unabhängigen Aufgaben zu leeren und gezielt mit Fokus-Anweisungen zu komprimieren schlägt beides, sich darauf zu verlassen. Du kannst die Linie auch mit /autocompact 500k verschieben oder sie für die Session mit /autocompact off abschalten."}, {q: "Du hältst eine Regel in einer Datei mit `paths:`-Frontmatter. Die Session wird komprimiert. Gilt die Regel weiterhin?", options: ["Ja — Regeln werden nach der Komprimierung immer von der Festplatte neu eingespielt", "Nicht sofort — sie wird erst neu geladen, wenn Claude das nächste Mal eine passende Datei berührt", "Nein — sie ist für den Rest der Session weg"], answer: 1, explain: "Pfadbezogene Regeln werden in den Nachrichtenverlauf geladen, wenn Claude ihre Auslöser-Datei liest oder bearbeitet, daher fasst die Komprimierung sie mit der Konversation weg. Sie werden bei Bedarf neu geladen, sobald das nächste Mal eine passende Datei berührt wird. Nur die CLAUDE.md im Projektstamm und Regeln ohne Scope werden bedingungslos von der Festplatte neu eingespielt — soll eine Regel jede Komprimierung überstehen, entferne also das paths:-Frontmatter oder verschiebe sie dorthin."}, {q: "Claude beginnt, eine frühere Anweisung zu vergessen oder sich zu wiederholen. Was ist die wahrscheinliche Ursache und Abhilfe?", options: ["Ein Netzwerkproblem — Rechner neu starten", "Das Fenster ist wahrscheinlich voll — /compact (dieselbe Aufgabe) oder /clear (neue Aufgabe)", "Das Modell ist kaputt — Modell wechseln"], answer: 1, explain: "Vergessen oder Wiederholen bedeutet meist, dass das Fenster voll ist. /compact (dieselbe Aufgabe) oder /clear (neue Aufgabe) behebt es in der Regel sofort."}]} />

## Weiter

- [Kontext-Budget-Audit](/docs/claude-code/context-budget-audit) — die Checkliste einmal pro Projekt: `/skill-doctor`, Ausgabelimits, `omitClaudeMd`, das Fenster der automatischen Komprimierung
- [Checkpoints & Rewind](/docs/claude-code/checkpoints-and-rewind) — `/rewind`, um Änderungen rückgängig zu machen oder den Kontext ab einem beliebigen Punkt zu komprimieren
- [Tokens, Kontext & Memory](/docs/foundations/tokens-and-context)
- [Subagenten & parallele Agenten](/docs/claude-code/subagents)
- [Statusline-Anpassung](/docs/claude-code/statusline)
