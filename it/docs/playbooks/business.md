# Business, marketing e strategia

> Source: https://derob98.github.io/ailmanac/it/docs/playbooks/business · AILmanac (CC BY 4.0)

Ricerca, copy, bozze di assistenza e pianificazione per titolari non tecnici — con le dovute cautele.

<LevelBadge level="all" />

Per fondatori e piccoli team, l'AI è una leva: fa il lavoro di un marketer junior, di un analista e di un assistente allo stesso tempo. Guidala bene e tieni per te il giudizio sulle cose che contano.

<Callout type="objectives" items={[
  "Scegliere i sei lavori di business in cui l'AI dà più leva per minuto speso",
  "Scrivere prima la frase di posizionamento e ricavare da essa ogni pezzo di copy",
  "Riconoscere le quattro affermazioni che non devi mai lasciar generare a un modello",
  "Trasformare i tuoi prompt migliori in risorse riutilizzabili invece di riscriverli ogni volta"
]} />

## Usi ad alta leva

- **Posizionamento e messaggio** — definisci la proposta di valore, poi ricavane il copy.
- **Contenuti di marketing** — landing page, email, annunci, social, FAQ (vedi [Scrittura](/docs/playbooks/writing)).
- **Comunicazioni con i clienti** — bozze di risposte, gestione dei reclami, annunci.
- **Ricerca** — analisi di mercato e concorrenti (da verificare!), set di domande per interviste ai clienti.
- **Pianificazione** — trasforma gli obiettivi in piani con priorità e tempi definiti.
- **Documentazione e operations** — procedure operative (SOP), annunci di lavoro, riassunti di riunioni.

## Parti dal posizionamento

Prima di qualsiasi copy, metti a punto la frase chiave.

<PromptCard title="Tre proposte di valore, ciascuna criticata in una riga">
{`Write 3 versions of a value proposition using: for [audience] who [need],
[product] is a [category] that [key benefit], unlike [alternative].
Then critique each in one line.`}
</PromptCard>

Tutto ciò che viene dopo (annunci, email, landing page) diventa più facile quando questa frase è nitida. Il motivo è meccanico, non stilistico: una landing page scritta partendo da una frase vaga non ha nulla con cui essere coerente, quindi ogni sezione va per conto suo. Sistema la frase e titolo, sottotitolo e le tre descrizioni delle funzioni avranno tutti la stessa cosa da dire.

## Cautele per l'uso in azienda

<Steps items={[
  {
    "title": "Non inventare mai prove",
    "body": "Testimonianze, metriche, casi di studio e premi sono le quattro cose che un modello genera volentieri e che tu non puoi mai pubblicare. Chiedi invece dei segnaposto — scrivi [inserisci numero reale] e compilalo con i tuoi dati. Una metrica inventata in una presentazione sopravvive per anni."
  },
  {
    "title": "Attenzione alle affermazioni regolamentate o non dimostrabili",
    "body": "Salute, finanza, \"n. 1\" e garanzie sono le categorie in cui il testo non è solo sbagliato ma perseguibile. Un modello non sa quali affermazioni la tua giurisdizione ti obbliga a dimostrare."
  },
  {
    "title": "Verifica fatti e cifre di mercato prima di agire",
    "body": "Un'analisi dei concorrenti sembra ricerca ed è in parte memoria. Dimensioni di mercato, importi dei finanziamenti, prezzi e organici sono proprio i numeri che tornano sicuri di sé e superati."
  },
  {
    "title": "Proteggi i tuoi dati",
    "body": "Non incollare dati personali dei clienti o numeri riservati in strumenti non verificati. La domanda da farsi su qualsiasi strumento non è se sia affidabile in generale, ma cosa conserva e chi, in quell'azienda, può leggerlo."
  }
]} />

:::warning[In breve]
**Non inventare mai** testimonianze, metriche, casi di studio o premi — usa segnaposto `[inserisci numero reale]` e compilali con dati veri. **Attenzione** alle affermazioni regolamentate o non dimostrabili (salute, finanza, "n. 1", garanzie). **Verifica** fatti e cifre di mercato prima di agire ([Allucinazioni](/docs/foundations/hallucinations)). **Proteggi i dati** — non incollare dati personali dei clienti o numeri riservati in strumenti non verificati ([Privacy](/docs/foundations/privacy)).
:::

## Rendilo ripetibile

Trasforma i tuoi prompt migliori in risorse riutilizzabili — un [Progetto](/docs/claude-app/projects) con la voce del tuo brand e i tuoi documenti, oppure lo [skill pack Business e Marketing](/docs/templates/skills), così gli standard si applicano in automatico.

La differenza conta non appena scrive più di una persona. Un buon prompt nelle tue note è qualcosa che ti ricordi di usare; lo stesso prompt come istruzione di un Progetto o come skill si applica che qualcuno se ne ricordi o no — compresa la regola "non inventare mai una metrica" qui sopra.

<Quiz questions={[
  {
    "q": "Ti serve un caso di studio per una landing page e non hai ancora risultati di clienti pubblicabili. Cosa ti dice di fare questa pagina?",
    "options": [
      "Chiedere un esempio realistico, dichiaratamente illustrativo",
      "Chiedere segnaposto come [inserisci numero reale] e compilarli con i tuoi dati",
      "Usare una media di settore",
      "Descrivere un composito di più clienti"
    ],
    "answer": 1,
    "explain": "Testimonianze, metriche, casi di studio e premi sono le quattro cose che non vanno mai lasciate generare a un modello. I segnaposto mantengono la struttura della pagina rendendo visibile la prova mancante — una cifra inventata ma plausibile è quella che finisce online senza che nessuno se ne accorga."
  },
  {
    "q": "Perché questa pagina insiste sul definire la proposta di valore prima di scrivere qualsiasi copy?",
    "options": [
      "Perché le proposte di valore sono più difficili da scrivere del copy",
      "Perché i motori di ricerca danno il maggior peso alla frase chiave",
      "Perché ogni risorsa successiva ne deriva, quindi una frase vaga lascia che ogni sezione vada per conto suo",
      "Perché è l'unica parte che un modello non può abbozzare per te"
    ],
    "answer": 2,
    "explain": "Annunci, email e landing page sono tutte derivazioni della stessa affermazione. Con una frase nitida sono coerenti per costruzione; con una vaga, ogni sezione inventa il proprio taglio."
  },
  {
    "q": "Qual è il vantaggio di un Progetto o di uno skill pack rispetto a un prompt salvato nelle tue note?",
    "options": [
      "Produce output più lunghi",
      "Applica i tuoi standard in automatico, che qualcuno si ricordi o no di incollarli",
      "Elimina la necessità di verificare i fatti",
      "Funziona senza abbonamento"
    ],
    "answer": 1,
    "explain": "Un prompt salvato dipende dal fatto che una persona se ne ricordi. Le istruzioni collegate a un Progetto o a uno skill pack si applicano di default — ed è ciò che vuoi per le regole permanenti come \"non inventare mai una metrica\"."
  }
]} />

<Callout type="takeaways" items={[
  "Prima il posizionamento. Ogni altra risorsa è una derivazione di quell'unica frase.",
  "Quattro cose che un modello non deve mai produrre per te: testimonianze, metriche, casi di studio, premi.",
  "Salute, finanza, \"n. 1\" e garanzie sono categorie di affermazioni in cui un testo sbagliato è perseguibile, non solo brutto.",
  "La ricerca sui concorrenti sembra ricerca ed è in parte memoria — verifica i numeri prima di agire.",
  "Codifica i tuoi standard in un Progetto o in uno skill pack, così si applicano senza che nessuno debba ricordarsene."
]} />

## Prossimi passi

- [Scrittura e creazione di contenuti](/docs/playbooks/writing)
- [Skill pack Business e Marketing](/docs/templates/skills)
- [Produttività quotidiana](/docs/playbooks/productivity)
