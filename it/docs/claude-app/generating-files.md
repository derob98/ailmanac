# Generare file veri (docx/pptx/xlsx/pdf)

> Source: https://derob98.github.io/ailmanac/it/docs/claude-app/generating-files · AILmanac (CC BY 4.0) · last verified 2026-10-20

Claude scrive ed esegue codice in una sandbox per consegnarti un documento Word, una presentazione, un foglio di calcolo o un PDF finiti. Come impostare la richiesta, il limite di 30MB, l'interruttore da attivare e il rischio di prompt injection che deriva dal dare un computer a un modello.

<LevelBadge level="beginner" />

<VerifyNote lastVerified="2026-10-20" source="https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude">
Secondo il Help Center di Anthropic: *"Code execution and file creation is available to all Claude users (Free, Pro, Max, Team, and Enterprise) on the web, Claude Desktop, and Claude Mobile."* Claude può creare file **.xlsx, .pptx, .docx e PDF**, con un limite di **30MB per file sia in caricamento sia in scaricamento**. Su Free, Pro e Max devi attivarla tu in **Impostazioni → Funzionalità**; su Team ed Enterprise la controlla un owner nelle impostazioni dell'organizzazione. Questi controlli cambiano: conferma nel Help Center.
</VerifyNote>

Oltre al testo a schermo, Claude può produrre **file veri e scaricabili** — documenti Word, presentazioni PowerPoint, fogli Excel, PDF — formattati e pronti all'uso. Vale la pena conoscere il meccanismo, perché spiega sia la potenza sia il rischio: Claude **scrive ed esegue codice in un ambiente di calcolo isolato (sandbox)** e poi ti consegna ciò che il codice ha prodotto.

<Callout type="objectives" items={[
  "Attivare la funzione e sapere quali superfici e quali piani la hanno",
  "Impostare la richiesta di un file in modo che il primo tentativo sia utilizzabile invece del terzo",
  "Scegliere correttamente tra un file generato, un Claude Doc e una dashboard",
  "Restare entro il limite di 30MB e sapere dove può andare il file",
  "Capire il rischio di prompt injection che accompagna una sandbox e come limitarlo"
]} />

## Prima di tutto, attivala

<Steps items={[
  {title: "Free, Pro e Max — attiva l'interruttore", body: "Apri Impostazioni → Funzionalità e attiva \"Code execution and file creation\". Se Claude continua a descrivere un foglio di calcolo invece di produrlo, quasi sempre il motivo è questo."},
  {title: "Team ed Enterprise — chiedi a un owner", body: "La funzione è controllata a livello centrale nelle impostazioni dell'organizzazione. Un singolo membro non può abilitarla per sé."},
  {title: "Controlla la tua superficie", body: "Funziona su Claude sul web, Claude Desktop e Claude Mobile. È una delle poche funzioni di creazione che non sono riservate a web e desktop."}
]} />

## Cosa puoi chiedere

- **Word (.docx)** — report, lettere, proposte, documenti formattati.
- **PowerPoint (.pptx)** — presentazioni a partire da una scaletta o da appunti.
- **Excel (.xlsx)** — fogli di calcolo con dati, formule, semplici modelli.
- **PDF** — versioni pronte per la stampa di quanto sopra.

I file finiti possono essere **scaricati o salvati direttamente su Google Drive**.

## File, Doc o Dashboard?

È la scelta in cui si sbaglia più spesso, e si è fatta più netta da quando Claude Docs e Slides sono [disponibili a tutti su ogni piano](/docs/claude-app/one-claude-docs-and-slides).

| Ti serve | Scegli | Perché |
| --- | --- | --- |
| Un prodotto finale da consegnare e non toccare più dentro Claude | **Un file generato** (questa pagina) | Download una tantum. Nessun URL, nessun collaboratore, nessun commento. |
| Un documento che continuerà a cambiare, con dei colleghi dentro | **Un Claude Doc o Slides** | Artifact vivo con un URL, co-modifica in tempo reale e commenti. Si esporta in un file quando hai finito. |
| Numeri che restano aggiornati al cambiare dei dati | **Una Claude Dashboard** | Ogni grafico poggia su una query dal vivo, non su un'istantanea. Vedi [Dashboard e Motion](/docs/claude-app/dashboards-and-motion). |

Una regola utile: **se ti darebbe fastidio riscaricarlo la settimana prossima, volevi un Doc.**

## Come ottenere un buon file

<Steps items={[
  {title: "Descrivi il prodotto finale, non l'argomento", body: "Tipo, pubblico, lunghezza, sezioni, tono. \"Una presentazione sui prezzi\" produce supposizioni; \"sei slide per un consiglio di amministrazione, un grafico per slide, niente elenchi puntati\" produce una bozza modificabile."},
  {title: "Fornisci il contenuto o la fonte", body: "Incolla gli appunti, allega i dati o dai la scaletta — oppure chiedi a Claude di abbozzare prima il contenuto e solo dopo di creare il file. Due passaggi battono uno solo confuso."},
  {title: "Perfeziona in chat, esporta per ultimo", body: "È molto più facile correggere una struttura in conversazione che dentro il .pptx finito. Itera sulla scaletta, poi chiedi il file."},
  {title: "Verifica ogni numero calcolato", body: "Un foglio di calcolo creato da Claude può contenere una formula sottilmente sbagliata, e un totale dall'aria sicura è l'errore più difficile da notare. Controlla a campione le celle che contano — vedi Allucinazioni."}
]} />

<PromptCard title="Una richiesta di file con abbastanza struttura da riuscire al primo colpo">{`Turn these notes into a 6-slide investor update deck (.pptx).

Slides, in order: traction, revenue, roadmap, team, the ask, appendix.
Audience: existing seed investors, read on a laptop, not presented live.

Rules:
- One idea per slide. No slide gets more than 25 words of body text.
- Revenue slide: a single chart, monthly, last 12 months.
- Clean and minimal: one accent color, no stock imagery, no icons.
- Use only numbers from my notes. If a figure I need isn't there,
  leave the placeholder [TBD] and list what's missing at the end.

Notes:
[paste your notes here]`}</PromptCard>

L'ultima regola è quella che ti salva. Senza, una cifra mancante viene riempita con qualcosa di plausibile; con, ottieni un elenco di lacune. Non pubblicare mai cifre di un foglio di calcolo generato che non hai controllato — vedi [Allucinazioni](/docs/foundations/hallucinations).

## I limiti da conoscere

<Callout type="warning" items={[
  "30MB per file, in entrambe le direzioni. È il tetto per ciò che carichi e per ciò che Claude restituisce. I dataset grandi vanno campionati, aggregati o divisi prima di entrare.",
  "Esegue codice vero in una sandbox. Claude ottiene \"un ambiente di calcolo isolato\" — un container separato dai tuoi sistemi. È ciò che rende possibile una formula Excel funzionante, ed è anche una superficie di attacco.",
  "L'accesso alla rete è un'impostazione, non una certezza. Le configurazioni vanno da disattivato (solo pacchetti preinstallati), a solo gestori di pacchetti — il predefinito per Team ed Enterprise — a domini specifici consentiti, a tutti i domini tranne una lista di blocco legale. Quale hai cambia ciò che Claude può scaricare durante un'attività.",
  "La prompt injection è il vero rischio qui. L'avvertenza di Anthropic stessa: un malintenzionato può aggiungere in modo poco appariscente istruzioni tramite file o siti esterni che inducono Claude a eseguire codice dannoso o a far trapelare dati. La loro indicazione è di monitorare Claude mentre usa la funzione e fermarlo se lo vedi toccare dati in modo inatteso."
]} />

L'abitudine pratica: **tratta qualsiasi file o URL che non hai scritto tu come input non fidato.** Fai particolare attenzione quando una singola richiesta sia legge un documento esterno *sia* ha accesso alla rete — è la combinazione che trasforma un'istruzione nascosta in esfiltrazione. Lo stesso ragionamento, in profondità, è in [Prompt injection](/docs/security/prompt-injection) e [Revisione di codice di terze parti](/docs/security/reviewing-third-party-code).

## Sotto il cofano

Queste funzioni sono alimentate dalle [Skill](/docs/claude-code/skills) — lo stesso meccanismo che puoi scrivere tu. Saperlo è utile in due modi: spiega perché la qualità dei file migliora senza alcun rilascio di modello, e significa che uno stile aziendale che continui a rispiegare può essere catturato una volta sola come skill invece di essere incollato in ogni prompt.

## Quiz

<Quiz questions={[
  {q: "Chiedi a Claude un .xlsx sul piano Pro e lui descrive il foglio di calcolo a parole invece di produrre un file. Qual è la causa più probabile?", options: ["La creazione di file è solo per Max, Team ed Enterprise", "\"Code execution and file creation\" è disattivato in Impostazioni → Funzionalità", "I fogli di calcolo vanno richiesti da Claude Desktop", "La conversazione è troppo lunga"], answer: 1, explain: "La creazione di file è disponibile su tutti i piani — Free, Pro, Max, Team ed Enterprise — su web, Desktop e Mobile, ma su Free, Pro e Max devi abilitare tu \"Code execution and file creation\" in Impostazioni → Funzionalità. Su Team ed Enterprise la controlla centralmente un owner."},
  {q: "Ti serve un report trimestrale che il tuo team continuerà a modificare insieme per le prossime tre settimane. Cosa devi chiedere?", options: ["Un .docx generato — è il vero formato di consegna", "Un Claude Doc, ed esportarlo in .docx quando è definitivo", "Una Claude Dashboard", "Un PDF, da rigenerare dopo ogni modifica"], answer: 1, explain: "Un file generato è un download una tantum senza URL, collaboratori o commenti. Un Claude Doc è un artifact vivo con co-modifica in tempo reale che si esporta in Word, PDF, Markdown o Google Docs quando il contenuto si assesta. Ricorri a un file solo quando hai finito di cambiarlo."},
  {q: "Qual è il limite dichiarato di dimensione file per la creazione di file?", options: ["10MB per file", "30MB per file, per caricamenti e scaricamenti", "100MB per conversazione", "Non esiste un limite documentato"], answer: 1, explain: "Il massimo documentato è 30MB per file, e vale in entrambe le direzioni — ciò che carichi e ciò che Claude produce. I dati sorgente grandi richiedono campionamento o aggregazione prima di entrare."},
  {q: "Perché Anthropic avverte di monitorare Claude mentre crea file?", options: ["Perché i file generati possono superare il tuo limite d'uso senza preavviso", "Perché la sandbox ha accesso al tuo filesystem locale", "Perché un file o un sito esterno può contenere istruzioni nascoste che inducono Claude a eseguire codice dannoso o a far trapelare dati", "Perché le formule nei file .xlsx vengono generate senza validazione"], answer: 2, explain: "La funzione dà a Claude un ambiente isolato che esegue codice vero, e Anthropic segnala che un malintenzionato può incorporare in modo poco appariscente istruzioni in un file o sito esterno. La loro indicazione è di osservare l'esecuzione e fermarla se Claude inizia a usare o accedere a dati in modo inatteso. La sandbox è isolata dai tuoi sistemi — il rischio sono le istruzioni iniettate, non l'accesso al filesystem locale."}
]} />

<Callout type="takeaways" items={[
  "La creazione di file è su ogni piano e ogni superficie — web, Desktop e Mobile — ma gli utenti Free, Pro e Max devono prima abilitarla in Impostazioni → Funzionalità.",
  "Funziona scrivendo ed eseguendo codice in una sandbox isolata. Per questo le formule Excel calcolano davvero, e per questo esistono le indicazioni di sicurezza.",
  "Descrivi il prodotto finale, non l'argomento: tipo, pubblico, lunghezza, struttura e una regola esplicita per cui le lacune vengono segnalate e non inventate.",
  "Scegli con cura: un file è un download una tantum, un Claude Doc è un documento vivo, una Dashboard è una query dal vivo. Sbagliare costa una ricostruzione.",
  "30MB per file, in entrambe le direzioni. Campiona o aggrega tutto ciò che è più grande prima di caricarlo.",
  "Tratta ogni file o URL esterno come input non fidato e osserva l'esecuzione — le istruzioni nascoste sono il rischio documentato, e sono peggiori quando l'accesso alla rete è completamente aperto."
]} />

## Prossimi passi

- [Claude Dashboards e Claude Motion](/docs/claude-app/dashboards-and-motion) — quando ti servono numeri dal vivo invece di un'istantanea
- [One Claude: l'unificazione, Claude Docs e Claude Slides](/docs/claude-app/one-claude-docs-and-slides) — l'alternativa viva al download
- [Artifact: output dal vivo ed eseguibili](/docs/claude-app/artifacts) — il pannello in cui tutto viene visualizzato
- [Scrittura e creazione di contenuti](/docs/playbooks/writing) · [Business, marketing e strategia](/docs/playbooks/business)
