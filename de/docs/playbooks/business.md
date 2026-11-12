# Business, Marketing & Strategie

> Source: https://derob98.github.io/ailmanac/de/docs/playbooks/business · AILmanac (CC BY 4.0)

Recherche, Texte, Support-Entwürfe und Planung für Inhaber ohne technischen Hintergrund — mit Vorbehalten.

<LevelBadge level="all" />

Für Gründer und kleine Teams ist KI ein Hebel: Sie leistet die Arbeit eines Junior-Marketers, eines Analysten und eines Assistenten zugleich. Steuere sie gut und behalte das Urteil bei den Dingen, die zählen.

<Callout type="objectives" items={[
  "Die sechs Business-Aufgaben auswählen, bei denen KI pro investierter Minute den größten Hebel bietet",
  "Zuerst den Positionierungs-Einzeiler schreiben und jeden Text daraus ableiten",
  "Die vier Aussagen erkennen, die du dir nie von einem Modell generieren lassen darfst",
  "Deine besten Prompts zu wiederverwendbaren Assets machen, statt sie neu zu tippen"
]} />

## Einsatzfelder mit großem Hebel

- **Positionierung & Messaging** — das Wertversprechen schärfen, dann die Texte daraus ableiten.
- **Marketing-Inhalte** — Landingpages, E-Mails, Anzeigen, Social Media, FAQs (siehe [Schreiben](/docs/playbooks/writing)).
- **Kundenkommunikation** — Antworten entwerfen, Beschwerden bearbeiten, Ankündigungen verfassen.
- **Recherche** — Markt- und Wettbewerbsscans (prüfen!), Fragensets für Kundeninterviews.
- **Planung** — Ziele in priorisierte, zeitlich begrenzte Pläne verwandeln.
- **Doku & Betrieb** — SOPs, Stellenanzeigen, Besprechungszusammenfassungen.

## Beginne mit der Positionierung

Bevor du irgendeinen Text schreibst, bring den Einzeiler in Ordnung.

<PromptCard title="Drei Wertversprechen, jedes in einer Zeile kritisiert">
{`Write 3 versions of a value proposition using: for [audience] who [need],
[product] is a [category] that [key benefit], unlike [alternative].
Then critique each in one line.`}
</PromptCard>

Alles Nachgelagerte (Anzeigen, E-Mails, Landingpages) wird leichter, sobald dieser Satz sitzt. Der Grund ist mechanisch, nicht stilistisch: Eine Landingpage, die aus einem vagen Einzeiler entsteht, hat nichts, womit sie konsistent sein könnte, also driftet jeder Abschnitt auseinander. Korrigiere den Satz, und Überschrift, Unterzeile und die drei Feature-Texte haben alle dasselbe zu sagen.

## Vorbehalte für den geschäftlichen Einsatz

<Steps items={[
  {
    "title": "Erfinde niemals Belege",
    "body": "Kundenstimmen, Kennzahlen, Fallstudien und Auszeichnungen sind die vier Dinge, die ein Modell bereitwillig erzeugt und die du nie veröffentlichen darfst. Bitte stattdessen um Platzhalter — schreibe [echte Zahl einfügen] und fülle sie aus deinen eigenen Daten. Eine erfundene Kennzahl in einer Präsentation überlebt jahrelang."
  },
  {
    "title": "Vorsicht bei regulierten oder nicht belegten Aussagen",
    "body": "Gesundheit, Finanzen, „Nr. 1“ und Garantien sind die Kategorien, in denen der Text nicht nur falsch, sondern rechtlich folgenreich ist. Ein Modell weiß nicht, welche Aussagen deine Rechtsordnung von dir zu belegen verlangt."
  },
  {
    "title": "Marktfakten und Zahlen prüfen, bevor du handelst",
    "body": "Ein Wettbewerbsscan liest sich wie Recherche und ist zum Teil Erinnerung. Marktgrößen, Finanzierungssummen, Preise und Mitarbeiterzahlen sind genau die Zahlen, die selbstsicher und veraltet zurückkommen."
  },
  {
    "title": "Schütze deine Daten",
    "body": "Füge keine personenbezogenen Kundendaten und keine vertraulichen Zahlen in ungeprüfte Tools ein. Die Frage an jedes Tool lautet nicht, ob es allgemein vertrauenswürdig ist, sondern was es speichert und wer in dieser Firma es lesen kann."
  }
]} />

:::warning[Die Kurzfassung]
**Erfinde nie** Kundenstimmen, Kennzahlen, Fallstudien oder Auszeichnungen — nutze Platzhalter wie `[insert real number]` und fülle sie mit echten Daten. **Achte auf** regulierte oder nicht belegte Aussagen (Gesundheit, Finanzen, „Nr. 1“, Garantien). **Prüfe** Marktfakten und Zahlen, bevor du handelst ([Halluzinationen](/docs/foundations/hallucinations)). **Schütze Daten** — füge keine personenbezogenen Kundendaten oder vertraulichen Zahlen in ungeprüfte Tools ein ([Datenschutz](/docs/foundations/privacy)).
:::

## Wiederholbar machen

Mache deine besten Prompts zu wiederverwendbaren Assets — ein [Projekt](/docs/claude-app/projects) mit deiner Markenstimme und deinen Dokumenten oder das [Skill-Paket Business & Marketing](/docs/templates/skills), damit die Standards automatisch gelten.

Der Unterschied zählt, sobald mehr als eine Person schreibt. Ein guter Prompt in deinen Notizen ist etwas, woran du dich erinnern musst; derselbe Prompt als Projektanweisung oder Skill gilt, ob sich jemand erinnert oder nicht — einschließlich der Regel „erfinde nie eine Kennzahl“ von oben.

<Quiz questions={[
  {
    "q": "Du brauchst eine Fallstudie für eine Landingpage und hast noch keine veröffentlichten Kundenergebnisse. Was rät dir diese Seite?",
    "options": [
      "Um ein realistisches, klar als Beispiel gekennzeichnetes Szenario bitten",
      "Um Platzhalter wie [echte Zahl einfügen] bitten und sie aus deinen eigenen Daten füllen",
      "Stattdessen einen Branchendurchschnitt verwenden",
      "Einen Mix aus mehreren Kunden beschreiben"
    ],
    "answer": 1,
    "explain": "Kundenstimmen, Kennzahlen, Fallstudien und Auszeichnungen sind die vier Dinge, die ein Modell nie erzeugen sollte. Platzhalter erhalten die Struktur der Seite und machen den fehlenden Beleg sichtbar — eine plausible erfundene Zahl ist die, die unbemerkt live geht."
  },
  {
    "q": "Warum besteht diese Seite darauf, das Wertversprechen vor jedem Text richtig zu formulieren?",
    "options": [
      "Weil Wertversprechen schwerer zu schreiben sind als Texte",
      "Weil Suchmaschinen den Einzeiler am stärksten gewichten",
      "Weil jedes nachgelagerte Asset daraus abgeleitet wird und ein vager Einzeiler jeden Abschnitt abdriften lässt",
      "Weil es der einzige Teil ist, den ein Modell nicht für dich entwerfen kann"
    ],
    "answer": 2,
    "explain": "Anzeigen, E-Mails und Landingpages sind alle Ableitungen derselben Aussage. Mit einem scharfen Einzeiler sind sie von Natur aus konsistent; mit einem vagen erfindet jeder Abschnitt seinen eigenen Winkel."
  },
  {
    "q": "Was ist der Vorteil eines Projekts oder Skill-Pakets gegenüber einem in deinen Notizen gespeicherten Prompt?",
    "options": [
      "Es erzeugt längere Ausgaben",
      "Es wendet deine Standards automatisch an, egal ob jemand daran denkt, es einzufügen",
      "Es macht das Prüfen von Fakten überflüssig",
      "Es funktioniert ohne Abonnement"
    ],
    "answer": 1,
    "explain": "Ein gespeicherter Prompt hängt davon ab, dass sich jemand an ihn erinnert. Anweisungen, die an ein Projekt oder ein Skill-Paket gebunden sind, gelten standardmäßig — genau das willst du für feste Regeln wie „erfinde nie eine Kennzahl“."
  }
]} />

<Callout type="takeaways" items={[
  "Zuerst die Positionierung. Jedes andere Asset ist eine Ableitung dieses einen Satzes.",
  "Vier Dinge, die ein Modell nie für dich erzeugen darf: Kundenstimmen, Kennzahlen, Fallstudien, Auszeichnungen.",
  "Gesundheit, Finanzen, „Nr. 1“ und Garantien sind Aussagekategorien, in denen falsche Texte rechtlich folgenreich sind, nicht nur schlecht.",
  "Wettbewerbsrecherche liest sich wie Recherche und ist zum Teil Erinnerung — prüfe die Zahlen, bevor du handelst.",
  "Verankere deine Standards in einem Projekt oder Skill-Paket, damit sie gelten, ohne dass jemand daran denken muss."
]} />

## Weiter

- [Schreiben & Content-Erstellung](/docs/playbooks/writing)
- [Skill-Paket Business & Marketing](/docs/templates/skills)
- [Alltägliche Produktivität](/docs/playbooks/productivity)
