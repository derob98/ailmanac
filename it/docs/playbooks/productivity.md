# Produttività quotidiana

> Source: https://derob98.github.io/ailmanac/it/docs/playbooks/productivity · AILmanac (CC BY 4.0)

I tuoi primi cinque usi di grande valore di Claude nel lavoro di tutti i giorni — con prompt da copiare e incollare.

<LevelBadge level="beginner" />

Cinque cose che quasi chiunque può usare da subito. Ognuna ha un prompt di partenza: incollalo, sostituisci le parentesi, perfezionalo con parole semplici.

<Callout type="objectives" items={[
  "Preparare una risposta, un riassunto o un piano con un solo prompt da copiare e incollare",
  "Riconoscere le tre parti che ognuno di questi prompt nomina: obiettivo, formato, vincoli",
  "Usare le richieste successive per guidare un output invece di riscrivere il prompt da zero",
  "Ottenere testi che suonano come te, fornendo un campione dei tuoi",
  "Sapere quali output devi verificare prima di agire"
]} />

## 1. Domare la casella di posta

<PromptCard title="Prepara una risposta a un'email ricevuta">
{`Here's an email I received. Draft a polite, concise reply that [accepts the
meeting but proposes Thursday instead]. Keep it under 80 words.

Email: [paste]`}
</PromptCard>

Richieste successive utili: *"più formale"*, *"aggiungi una riga di ringraziamento"*, *"dammi due versioni"*.

## 2. Riassumere le cose lunghe

<PromptCard title="Riassumi qualsiasi cosa, con le decisioni estratte a parte">
{`Summarise this in 5 bullet points a busy manager could read in 30 seconds,
then list any decisions or action items separately.

Text: [paste]`}
</PromptCard>

Funziona su articoli, appunti di riunioni, thread e report. Per input molto lunghi, chiedi **prima** il riassunto, poi approfondisci.

## 3. Pianificare e scomporre il lavoro

<PromptCard title="Trasforma un obiettivo vago in un piano con i rischi segnalati">
{`I need to [organise a 30-person team offsite] by [October]. Give me a
step-by-step plan with rough timing, and flag the 3 things most likely
to go wrong.`}
</PromptCard>

Ottimo per piani di progetto, checklist e per trasformare un obiettivo vago in azioni concrete.

## 4. Ragionare insieme a te

<PromptCard title="Metti alla prova una decisione invece di limitarti a prenderla">
{`I'm deciding between [option A] and [option B] for [situation]. Lay out the
trade-offs in a table, then tell me what else I should consider before
deciding.`}
</PromptCard>

Usalo come sparring partner — chiedigli di sostenere la tesi opposta per mettere alla prova il tuo ragionamento.

## 5. Scrivere una bozza, poi farla tua

<PromptCard title="Ottieni una bozza con la tua voce">
{`Write a first draft of [a LinkedIn post announcing our new feature].
Match this voice: [paste a paragraph you wrote]. Then suggest a punchier
opening line.`}
</PromptCard>

Fornire un campione dei *tuoi* testi è il segreto per ottenere risultati che non suonino generici.

## Le due abitudini che contano

<Steps items={[
  {
    "title": "Dai contesto, poi itera",
    "body": "Ogni prompt qui sopra nomina l'obiettivo, il formato e i vincoli — è tutta la ricetta. E nessuno deve venire giusto al primo colpo: di' cosa non va con parole semplici (\"più corto\", \"meno formale\", \"due versioni\") invece di riscrivere il prompt."
  },
  {
    "title": "Verifica tutto ciò che è fattuale",
    "body": "Date, numeri, nomi, citazioni e \"fatti\" possono essere sbagliati con grande sicurezza. Il riassunto di un documento che hai incollato è a basso rischio; una cifra di mercato che il modello ha richiamato a memoria no. Per tutto ciò che conta, controlla."
  }
]} />

Ognuna di queste due abitudini ha una pagina dedicata: [Basi del prompting](/docs/prompting/basics) per indicare obiettivo, formato e vincoli, e [Allucinazioni](/docs/foundations/hallucinations) per capire quali output possono essere sbagliati con sicurezza.

<Quiz questions={[
  {
    "q": "Incolli un report di 40 pagine e vuoi capirlo. Cosa suggerisce questa pagina di chiedere per prima cosa?",
    "options": [
      "Un'analisi dettagliata sezione per sezione",
      "Il riassunto in 5 punti, poi approfondire le parti che contano",
      "Un elenco di ogni numero presente nel documento",
      "Una riscrittura in un linguaggio più semplice"
    ],
    "answer": 1,
    "explain": "Per input molto lunghi, chiedi prima il riassunto e poi approfondisci. Ti dà una mappa prima di dedicare attenzione a una sola sezione — e ti dice subito se il documento è davvero quello che ti serviva."
  },
  {
    "q": "La bozza torna con un tono generico e per niente tuo. Qual è il rimedio indicato da questa pagina?",
    "options": [
      "Chiedere un tono più creativo",
      "Incollare un paragrafo dei tuoi testi come campione di voce",
      "Chiedere dieci versioni e sceglierne una",
      "Scrivere una descrizione più lunga della tua personalità"
    ],
    "answer": 1,
    "explain": "Fornire un campione dei tuoi testi è la mossa più efficace. La descrizione di una voce (\"amichevole ma professionale\") viene interpretata; un tuo paragrafo vero viene imitato."
  },
  {
    "q": "Quale di questi output ha più bisogno di essere verificato prima di agire?",
    "options": [
      "Un riassunto di appunti che hai incollato nel prompt",
      "Una risposta preparata a partire da un'email che hai incollato",
      "Una statistica di mercato prodotta dal modello a memoria",
      "Una tabella di compromessi tra due opzioni che hai descritto"
    ],
    "answer": 2,
    "explain": "Tutto ciò che si basa su un testo che hai fornito può essere controllato su quel testo. Un numero richiamato dal modello senza fonte è quello che può essere sbagliato con sicurezza — sono date, cifre, nomi e citazioni da controllare."
  }
]} />

<Callout type="takeaways" items={[
  "Obiettivo + formato + vincoli è tutta la ricetta. Tutti e cinque i prompt qui sono quello schema.",
  "Perfeziona con parole semplici invece di riscrivere — \"più corto\", \"più formale\", \"due versioni\" funzionano tutti.",
  "Riassumi prima, poi approfondisci, ogni volta che l'input è lungo.",
  "Un campione dei tuoi testi batte qualsiasi descrizione del tuo tono.",
  "Gli output ancorati al testo sono facili da controllare; i fatti richiamati a memoria sono quelli che mordono."
]} />

## Prossimi passi

- Migliora il tuo prompting → [Libreria di pattern per i prompt](/docs/prompting/pattern-library)
- Uno spazio di lavoro persistente per un progetto → [Progetti](/docs/claude-app/projects)
- Usa l'AI dentro i tuoi strumenti esistenti → [L'AI nei tuoi strumenti](/docs/claude-app/ai-in-your-tools)
