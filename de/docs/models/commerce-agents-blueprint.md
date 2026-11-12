# Blueprint für Commerce-Agenten (Anthropic-Referenz)

> Source: https://derob98.github.io/ailmanac/de/docs/models/commerce-agents-blueprint · AILmanac (CC BY 4.0) · last verified 2026-09-08

Anthropics Open-Source-Blueprint vom September 2026 für Shopping- und Händler-Agenten auf Claude — die Aufteilung in zwei Agenten, die Staged-Write-Leitplanke und die Muster, die Sie auch ohne Commerce-Projekt übernehmen können.

<LevelBadge level="intermediate" />

# Blueprint für Commerce-Agenten (Anthropic-Referenz)

<Callout
  type="objectives"
  items={[
    "Die Aufteilung in zwei Agenten (Shopping vs. Händler) verstehen und warum Anthropic KEINEN Intent-Router und keine Domänen-Subagenten verwendet hat",
    "Die Staged-Write-Leitplanke kennenlernen: Wie kein Tool-Aufruf des Modells je Geld bewegt oder den Shop verändert — jeder Schreibvorgang endet an einer von Menschen freigegebenen Oberfläche",
    "Die drei Laufzeitpfade (Messages API, Agent SDK, Managed Agents) sehen und wie derselbe Kerncode in alle drei passt",
    "Drei übertragbare Muster für jeden Agenten übernehmen, der ein echtes Geschäftssystem berührt: vom Server vergebene IDs, abgegrenzter Fremdtext und die Trennung von Prompt und Skill"
  ]}
/>

Am 2. September 2026 veröffentlichte Anthropic **`anthropics/commerce-agents`** — einen Referenz-Blueprint unter Apache 2.0 zum Bau von Shopping- und Händler-Agenten auf Claude. Er enthält zwei lauffähige Agenten, vier Branchenbeispiele (Einzelhandel, Reisen, Telekommunikation, Unterhaltung) und — entscheidend — eine Reihe von **Leitplanken-Mustern, die im Code umgesetzt sind, nicht in Prompts**. Anthropic erklärt, das Repo sei eine Referenzimplementierung, die sie *nicht* als Produkt pflegen werden und für die sie *keine* externen Beiträge annehmen.

Interessant ist nicht, dass Sie jetzt einen Shopping-Bot bauen können. Interessant ist die **Form**: eine ungewöhnlich meinungsstarke Haltung dazu, wie ein Agent aufgebaut sein sollte, der echte Geschäftssysteme berührt. Alles Folgende lässt sich auf jeden Agenten übertragen, der in ein echtes Backend schreiben muss — Lagerbestand, Kundendaten, Banking, Ops-Tooling.

## Die Aufteilung: zwei Agenten, nicht einer

Anthropic liefert **einen Shopping-Agenten** (kundenseitig) und **einen Händler-Agenten** (mitarbeiterseitig), jeweils mit eigener Backend-Schnittstelle (`StorefrontBackend` und `MerchantBackend`) und eigenem Satz von Skills. Bewusst **nicht** gebaut wurden:

- ein Intent-Router, der an Subagenten verteilt
- Subagenten je Domäne (ein „Warenkorb-Agent“ + „Retouren-Agent“ + „Such-Agent“)
- ein monolithischer Agent, der Kunden- und Mitarbeiterarbeit zugleich erledigt

Stattdessen: **ein einheitlicher Agent pro Zielgruppe, in einer Standard-Agentenschleife, mit Skills und Tools.** Ihre Leitlinie im Beitrag [anatomy of effective commerce agents](https://claude.com/blog/the-anatomy-of-effective-commerce-agents): *„Alles, was der Agent in den meisten Zügen braucht, gehört in der Regel in den System-Prompt“* — beim Shopping-Agenten steht die Katalogsuche also im Prompt, weil sie fast in jedem Zug gebraucht wird. *„Der Rest kommt in Skills.“* Kundenservice, Personalisierung, Retouren — Skills.

Das ist eine klare Position. Intent-Router und Domänen-Subagenten sind in vielen Tutorials die Standardarchitektur, und Anthropic sagt Ihnen: Für eine einzelne Zielgruppe mit eng gekoppelten Sitzungen lassen Sie es.

## Die tragende Leitplanke: gestufte Schreibvorgänge

<Callout
  type="tip"
  items={[
    "Der wichtigste Satz im Blueprint: 'No model tool call moves money or changes the business.' Jede Änderung läuft über einen servergesteuerten Freigabeschritt. Wenn Sie nur eines aus dem Repo mitnehmen, dann dies."
  ]}
/>

Der Blueprint erzwingt Sicherheit im Code, nicht in Prompts. Der Mechanismus hat drei Teile:

<Steps
  items={[
    {
      title: "1. Der Server vergibt jede ID, auf die das Modell verweisen darf",
      body: "Der Server führt pro Sitzung ein Protokoll jeder Produkt-ID, SKU, Kampagnen-ID und Preis-ID, die er dem Modell übergeben hat. Schreib- und Rendervorgänge akzeptieren NUR IDs aus diesem Protokoll. Halluziniert das Modell eine SKU, lehnt der Harness ab — ganz ohne Prompt Engineering."
    },
    {
      title: "2. Jeder Schreibvorgang wird gestuft, nie direkt angewendet",
      body: "Bestellungen, Zahlungen, Erstattungen, Preisänderungen und Kampagnenstarts enden alle in einem servergenerierten Entwurf mit eigener Freigabe-ID. Der Tool-Aufruf gibt die Entwurfs-ID und eine Vorschau zurück. Noch ist nichts live."
    },
    {
      title: "3. Die Freigabe geschieht an einer echten menschlichen Oberfläche",
      body: "Eine gestufte Änderung gelingt nur, wenn die Freigabe-ID über eine echte Oberfläche bestätigt wird — ein Button im Portal des Bedieners, eine Bestätigung in der CLI. Der Agent kann sich nicht selbst freigeben; der Freigabe-Endpunkt akzeptiert keine vom Modell erzeugte Identität."
    }
  ]}
/>

Der Blueprint behandelt außerdem zwei weitere klassische Stolperfallen:

- **Regulierte Inhalte:** Bei Gebühren, Pflichtangaben und dem dem Verbraucher gezeigten Preis wählt das Modell, *welches* Produkt offengelegt wird; die *Worte* stammen aus vom Server gelieferten, freigegebenen Texten. Das Modell schreibt nie Offenlegungstexte.
- **Bereinigung von Fremdtext:** Jeder nutzergenerierte Inhalt (Bewertungen, Verkäufernotizen, Nachrichten) wird in „fenced text“-Markierungen eingefasst, bevor er das Modell erreicht, damit er keine Anweisungen in den Prompt einschmuggeln kann.

## Zahlungen: ausdrücklich außerhalb des Umfangs

Der Blueprint **gibt keine Bestellungen auf und belastet keine Karten**. Der Checkout wird dargestellt, damit ihn die Host-Anwendung abschließt. In Anthropics Worten bleiben so „Zahlungsabwicklung, Betrugsregeln und Zugangsdaten außerhalb des Agenten“. Visa, Mastercard und Accenture sind in der Ankündigung als Partner genannt, doch der Zahlungsschritt liegt in Ihrem bestehenden Checkout oder bei einem Anbieter für agentische Zahlungen — nie in der Tool-Oberfläche des Modells.

Auch das ist eine klare Linie: **Was mit einem einzigen Schritt Geld verlieren kann, fasst das Modell nicht an.**

## Drei Laufzeitpfade, ein Kern

Das Repo teilt jeden Agenten in ein **Core**-Paket (Typen, Backend-Schnittstelle, Prompt, Tool-Verträge) und getrennte **Runtime**-Pakete, die den Kern an verschiedene Ausführungsumgebungen anpassen:

<PromptCard title="Messages API — the reference loop">
{`from shopping_agent import ShoppingAgentConfig
from shopping_agent_runtime import ShoppingAgent

agent = ShoppingAgent(
  backend=your_backend,
  skills_dir=Path("shopping-agent/skills"),
  config=ShoppingAgentConfig(brand_name="Your Store"),
)
async for event in agent.stream_turn(messages, session, state):
  # yields: text_delta | tool_call | ui | cart_update | turn_complete
  ...
await agent.update_memory(messages, session)`}
</PromptCard>

<PromptCard title="Agent SDK — with a local console">
{`python shopping-agent/runtime-agent-sdk/main.py \\
  --once "a two-person tent under $250"

python merchant-agent/runtime-agent-sdk/main.py
# prints staged changes and waits for y/n approval`}
</PromptCard>

<PromptCard title="Managed Agents (beta) — hosted">
{`scripts/deploy_managed_agent.sh \\
  shopping-agent/managed-agents/shopping-agent

# The manifest declares tools + a storefront MCP server;
# Anthropic hosts the loop.`}
</PromptCard>

Derselbe `core/`-Code läuft unter allen dreien — das ist das eigentlich übertragbare Muster: **Halten Sie den Vertrag des Agenten (Tools, Prompt, Backend-Schnittstelle) getrennt vom Ausführungs-Harness.** Wenn Sie in sechs Monaten von der Messages API auf Managed Agents wechseln, ändert sich nur das Runtime-Paket.

## Gedächtnis: nicht im Kontext

Das Langzeitgedächtnis (Präferenzen, frühere Bestellungen, Service-Notizen) wird **in Ihren bestehenden Datenbanken** gespeichert, nicht im Modellkontext. Die Extraktion läuft *asynchron nach Ende der Unterhaltung* — für die Aktualisierung des Gedächtnisses zahlen Sie keine Latenz auf dem kritischen Pfad. Im nächsten Zug lädt die Laufzeit relevantes Gedächtnis in den System-Prompt.

Das lohnt sich zu verinnerlichen, auch wenn Sie keinen Commerce-Agenten bauen: In jedem Zug Gesprächszusammenfassungen in den Kontext zu schieben ist ein verbreiteter Performance-Fehler. Die Form des Blueprints — asynchron schreiben, beim Zugstart lesen — ist die günstigere.

## Die vier Branchen (und warum sie sich unterscheiden)

`examples/` enthält Ende-zu-Ende-Demos für vier Branchen, jede mit einer eigenen strukturellen Besonderheit, die Sie übernehmen können:

- **Einzelhandel** — der Basisfall. Standardkatalog, Warenkorb, Checkout.
- **Reisen** — zeitgebundener Bestand (ein Flugsitz verfällt), Reiseverlaufsdarstellung mit Vergleich über mehrere Teilstrecken.
- **Telekommunikation** — Kontokontext („Ihr aktueller Tarif ist X“), Tarifmatrizen, regulierte Gebührenoffenlegung.
- **Unterhaltung** — zeitlich begrenzte Reservierungen für Tickets, Wartelisten, Saalpläne.

Wenn Ihr Produkt kein Commerce ist, aber eine dieser Eigenschaften hat (verfallender Bestand, regulierte Offenlegung, zeitlich begrenzte Reservierungen), lohnt sich die passende Branche zum Lesen, bevor Sie Ihren eigenen Agenten entwerfen.

## An einem Nachmittag zum Laufen bringen

<PromptCard title="Clone, install, run one vertical">
{`git clone https://github.com/anthropics/commerce-agents.git
cd commerce-agents

python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add ANTHROPIC_API_KEY

(cd examples && npm ci)

python scripts/run_demo.py retail
# API on :8000, storefront on :3000`}
</PromptCard>

Das Repo prüft sich mit `ruff check . && ruff format --check . && pytest && python scripts/check.py`, und für den umfassenden Durchlauf gibt es `python scripts/verify_all.py`.

## Begriffe, die man kennen sollte

<Flashcards
  cards={[
    { front: "Staged write (gestufter Schreibvorgang)", back: "Eine Änderung, die der Agent als Entwurf mit einer servergenerierten Freigabe-ID zurückgibt und die erst angewendet wird, nachdem ein Mensch sie an einer echten Oberfläche bestätigt hat. Das zentrale Leitplanken-Muster des Blueprints." },
    { front: "Vom Server vergebene ID", back: "Jede Produkt-/SKU-/Kampagnen-ID, die der Schreib-Endpunkt akzeptiert, muss dem Modell in dieser Sitzung vom Server übergeben worden sein. Stoppt halluzinierte Kennungen sofort." },
    { front: "Fenced text (abgegrenzter Text)", back: "Nutzergenerierte Inhalte Dritter werden mit Markierungen eingefasst, bevor sie das Modell erreichen, damit nicht vertrauenswürdiger Text keine Anweisungen in den Prompt einschmuggeln kann." },
    { front: "Runtime-Split", back: "Anthropics Repo-Aufbau: ein einziges 'core'-Paket mit Prompt, Tool-Verträgen und Backend-Schnittstelle, dazu getrennte Runtime-Pakete (Messages API, Agent SDK, Managed Agents), die den Kern an verschiedene Ausführungsumgebungen anpassen." },
    { front: "Prompt vs. Skill", back: "Anthropics Regel: Was der Agent in den meisten Zügen braucht, gehört in den System-Prompt (z. B. die Katalogsuche beim Shopping-Agenten). Alles andere kommt in Skills (z. B. Retouren, Personalisierung)." }
  ]}
/>

## Prüfen Sie sich selbst

<Quiz
  questions={[
    {
      q: "Warum stuft der Blueprint jeden Schreibvorgang, statt sich auf Prompt-Anweisungen wie 'never place an order without confirming' zu verlassen?",
      options: [
        "Damit das Modell leichter zu testen ist",
        "Weil Regeln auf Prompt-Ebene per Jailbreak umgangen werden können; ein Server, der nur freigegebene IDs akzeptiert, lässt sich nicht von der Durchsetzung abbringen",
        "Um API-Kosten zu senken",
        "Weil man Claude nicht zutrauen kann, strukturiertes JSON auszugeben"
      ],
      answer: 1,
      explain: "Leitplanken im Code halten auch unter feindlichen Prompts. Der Server behandelt jede Änderung als Entwurf mit servergenerierter ID und wendet sie erst an, nachdem ein Mensch über eine echte Oberfläche freigegeben hat — das Modell kann sich unabhängig davon, was man ihm sagt, nicht selbst freigeben."
    },
    {
      q: "Wie unterscheidet sich die Architektur des Händler-Agenten vom verbreiteten 'Router + Subagent'-Muster, das viele Tutorials lehren?",
      options: [
        "Sie verwendet mehr Subagenten, einen je Geschäftsfunktion",
        "Sie verwendet einen einzigen einheitlichen Agenten für die Mitarbeiter-Zielgruppe, mit Skills statt Subagenten und ohne Intent-Router",
        "Sie verwendet zwei Modelle, eines zum Lesen und eines zum Schreiben",
        "Sie leitet jede Anfrage erst durch GPT, bevor sie an Claude geht"
      ],
      answer: 1,
      explain: "Anthropic empfiehlt ausdrücklich einen Agenten pro Zielgruppe in einer Standardschleife, mit Skills für seltener gebrauchte Fähigkeiten. Bei eng gekoppelten Sitzungen raten sie von Intent-Routern und domänenspezifischen Subagenten ab."
    },
    {
      q: "Wo liegt das Langzeitgedächtnis über Kunden im Blueprint?",
      options: [
        "In jedem Zug an den System-Prompt angehängt",
        "Im eigenen Memory-Tool von Claude",
        "In Ihren bestehenden Datenbanken, asynchron nach Ende der Unterhaltung extrahiert und im nächsten Zug geladen",
        "In einem Vektorspeicher, der bei jedem Tool-Aufruf abgefragt wird"
      ],
      answer: 2,
      explain: "Der Blueprint hält das Gedächtnis in bestehenden Datenbanken und extrahiert es asynchron nach der Unterhaltung — keine Kosten auf dem kritischen Pfad —, dann lädt er relevantes Gedächtnis in den System-Prompt des nächsten Zugs."
    },
    {
      q: "Der Blueprint 'places no orders and charges no cards.' Warum?",
      options: [
        "Weil Anthropic Tool-Nutzung für Zahlungen nicht unterstützt",
        "Weil der Checkout dargestellt wird, damit ihn die Host-Anwendung abschließt — Zahlungsabwicklung, Betrugsregeln und Zugangsdaten bleiben außerhalb des Agenten",
        "Weil es eine Demo ist, die keine echten Zahlungen braucht",
        "Weil Claude Managed Agents Aktionen blockiert, die Geld bewegen"
      ],
      answer: 1,
      explain: "Der Blueprint übergibt den Checkout bewusst an die Host-App oder einen Anbieter für agentische Zahlungen — das Modell hat nie Zahlungs-Zugangsdaten oder die Fähigkeit zu belasten. Dasselbe Prinzip wie bei gestuften Schreibvorgängen: Was mit einem einzigen Schritt Geld verlieren kann, fasst das Modell nicht an."
    }
  ]}
/>

<VerifyNote
  lastVerified="2026-09-08"
  source="https://claude.com/blog/claude-for-commerce-agents · https://github.com/anthropics/commerce-agents"
/>

## Quellen & weiterführende Lektüre

- [Building Commerce Agents with Claude](https://claude.com/blog/claude-for-commerce-agents) — Anthropics Launch-Beitrag vom 2. September 2026
- [A guide to the anatomy of effective commerce agents](https://claude.com/blog/the-anatomy-of-effective-commerce-agents) — Anthropics Architektur-Beitrag zur Aufteilung, zu Prompts vs. Skills und zu Leitplanken
- [anthropics/commerce-agents](https://github.com/anthropics/commerce-agents) — das Referenz-Repo unter Apache 2.0
- [Anthropic's commerce agent blueprint: two reference agents you can run in an afternoon](https://www.aicodex.to/articles/claude-commerce-agents) — unabhängiger Bericht
- [Anthropic Debuts Commerce Agent Blueprint With Visa and Mastercard (PYMNTS)](https://www.pymnts.com/news/artificial-intelligence/2026/anthropic-built-the-shopping-brain-and-skipped-the-wallet/) — die Einordnung, dass Zahlungen außerhalb des Umfangs liegen

## Weiter

- **Agenten allgemein auf Claude:** [Agenten bauen](/docs/api/building-agents) — die zugrunde liegende Schleife, auf der der Blueprint läuft.
- **Der gehostete Pfad:** [Managed Agents & Memory Stores](/docs/api/managed-agents-memory-stores) — wohin `scripts/deploy_managed_agent.sh` den Code schickt.
- **Die Open-Source-Alternative:** [Open-Source-Agenten-Frameworks](/docs/models/open-source-agent-frameworks) — zum Vergleich, falls Sie lieber einen eigenen Harness bauen.
