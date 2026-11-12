# Agenti desktop senza pixel

> Source: https://derob98.github.io/ailmanac/it/docs/models/desktop-agents-accessibility-tree · AILmanac (CC BY 4.0) · last verified 2026-11-02

Vercel Labs ha rilasciato agent-desktop il 28 ottobre 2026 — computer use basato sull'albero di accessibilità, in Rust, Apache-2.0, per macOS/Windows/Linux. Il titolo è «alberi AX al posto dei pixel». La parte da copiare è il suo modello di correttezza: ref legati a uno snapshot, risoluzione fail-closed che rifiuta di tirare a indovinare, proprietà a tre stati e una regola di retry costruita su CONSEGNATO vs NON CONSEGNATO invece che su successo vs fallimento.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-11-02" source="https://github.com/vercel-labs/agent-desktop">
agent-desktop ha raggiunto la v1.0.0 il 28 ottobre 2026 e la v1.0.2 due giorni dopo. Un progetto che si muove a questo ritmo cambierà nomi dei comandi, flag e codici di errore. Tutto ciò che segue è letto dal `README.md` e da `CONCEPTS.md` del repository all'inizio di novembre 2026 — controlla `agent-desktop --help` e il CHANGELOG prima di dipendere da un flag specifico. Il *modello di progetto* nella seconda metà è la parte duratura e vale la lettura anche se non installerai mai questo strumento.
</VerifyNote>

<Callout type="objectives" items={[
  "Capire cosa legge un agente basato sull'albero di accessibilità e in cosa differisce, a livello di protocollo, da un agente basato su screenshot",
  "Imparare la regola di retry che la maggior parte degli harness di computer use sbaglia — e perché «è fallita?» è la domanda sbagliata",
  "Vedere perché i ref sono legati a uno snapshot e cosa dovrebbe fare un harness, invece di tirare a indovinare, quando uno diventa obsoleto",
  "Conoscere il modello di proprietà a tre stati che impedisce a un agente di agire su una lettura fallita",
  "Riconoscere i due modi di fallire che questo approccio NON risolve: alberi troncati e app senza superficie di accessibilità",
  "Capire la superficie di sicurezza: tutto ciò che è a schermo diventa input dell'agente",
]} />

Il 28 ottobre 2026 Vercel Labs ha taggato la v1.0.0 di **agent-desktop** e il 31 ottobre era in cima alla classifica trending di GitHub. È una CLI Rust e libreria C, Apache-2.0, che dà a un agente il computer use su macOS, Windows e Linux leggendo l'**albero di accessibilità** del sistema operativo — la stessa struttura che consuma uno screen reader: AX API su macOS, UI Automation su Windows, AT-SPI su Linux. L'inquadramento di Vercel è «agent-browser, per tutto il tuo computer».

Ogni articolo uscito finora si ferma al titolo: alberi al posto dei pixel, quindi i click arrivano dove devono. È vero ed è la metà meno interessante.

La metà interessante è che il repository include un `CONCEPTS.md` che è, di fatto, **una specifica su come un harness di computer use dovrebbe gestire l'incertezza** — e risponde a domande che le API di computer use mainstream lasciano interamente a te. Se costruisci loop di agenti, leggi questa pagina per il modello anche se non installerai mai lo strumento. La nostra pagina [agenti computer-use a confronto](/docs/models/computer-use-agents) copre le API basate su screenshot di Anthropic, OpenAI e Google; questa è l'altra architettura.

## Cosa cambia quando leggi l'albero invece dello schermo

Un agente a screenshot riceve un'immagine e restituisce coordinate. Il contratto è: *ecco dei pixel, dimmi dove cliccare.* Tutto ciò che l'agente sa dell'interfaccia deve dedurlo visivamente e ogni azione è una scommessa su una coordinata.

Un agente ad albero riceve struttura. Uno snapshot restituisce JSON con un **ref** per ogni elemento su cui l'agente può agire, e le azioni nominano un ref anziché un punto.

<Steps items={[
  {title: "Osserva", body: "Fai lo snapshot dell'albero di accessibilità di una finestra, app o superficie. Ottieni JSON — ruoli, nomi, stati — con un ref per ogni nodo azionabile e un ID di snapshot a cui i ref appartengono."},
  {title: "Risolvi", body: "Prima che l'azione parta, il ref viene riconfrontato con l'albero LIVE CORRENTE usando le prove di identità memorizzate al momento dello snapshot. Questo passaggio è la partita intera ed è trattato più sotto."},
  {title: "Agisci", body: "Invia l'input sotto un interaction lease — esclusività a livello di macchina sull'input desktop, detenuta da un solo processo alla volta, così due chiamanti non possono intercalare input sintetico nelle azioni dell'altro."},
  {title: "Verifica", body: "Rileggi l'elemento per confermare che la modifica lo abbia davvero raggiunto. Una mutazione è «consegnata» solo quando una rilettura lo conferma."},
]} />

Le differenze pratiche che ne derivano sono più grandi di quanto sembri:

- **I ref sopravvivono ai cambi di layout che rompono le coordinate.** Un pulsante che scende di 200 px nella finestra è lo stesso nodo nell'albero. Per un agente a screenshot è una nuova scommessa.
- **È headless per impostazione predefinita.** L'input passa dall'API di accessibilità senza muovere il puntatore di sistema né rubare il focus, quindi l'agente può pilotare le app mentre tu continui a usare la macchina. Esiste una modalità `--headed` per la sintesi di input fisico quando un'app ignora l'input programmatico. È un modello operativo davvero diverso dagli agenti a screenshot, che si contendono il cursore con te.
- **Gli snapshot sono testo, non immagini.** Conta per il conto e per la finestra di contesto — vedi [perché gli agenti bruciano token](/docs/models/why-agents-burn-tokens). Ma non è una vittoria gratis, perché gli alberi densi diventano grandi; la risposta del repo è mappare prima in modo grossolano (`--skeleton --compact`) e poi scendere in una regione con `--root`.
- **A volte servono comunque gli screenshot.** Lo strumento include `screenshot` accanto a `snapshot`. Le app renderizzate su canvas, le interfacce disegnate a mano e i giochi hanno poca o nessuna superficie di accessibilità, e nessuna lettura dell'albero ne inventa una.

<PromptCard title="Il loop minimo osserva / agisci / verifica">
{`npm install -g agent-desktop
agent-desktop version

# macOS only: accessibility permission must be granted first
agent-desktop permissions --guide

# 1. observe — -i limits output to interactive elements
agent-desktop snapshot --app Finder -i

# 2. act — the ref MUST carry its snapshot ID; a bare @e8 is rejected
agent-desktop click @s8f3k2p9:e8

# 3. verify — re-snapshot and confirm the change landed
agent-desktop snapshot --app Finder -i

# dense UI? map coarsely, then drill into one region
agent-desktop snapshot --app Slack --skeleton --compact
agent-desktop snapshot --root @s8f3k2p9:e42`}
</PromptCard>

L'output è JSON con un booleano `ok` e `data` oppure un `error` che porta un codice, una disposition e un suggerimento. I comandi si raggruppano in osservazione (`snapshot`, `find`, `get`, `screenshot`, `list-surfaces`), azione su ref (`click`, `type`, `set-value`, `scroll`, `toggle`, `expand`), tastiera e mouse grezzi (`press`, `hover`, `drag`, `key-down`), gestione di finestre e app (`launch`, `focus-window`, `resize-window`, `list-apps`) e sistema (`permissions`, `status`, `batch`, `skills`).

## L'idea da rubare: consegnato, non riuscito

Ecco la regola, e la cosa singolarmente più utile del repository:

> La distinzione che conta non è successo contro fallimento. È **consegnato contro non consegnato**.

Pensa a cosa fa un agente quando un comando `type` restituisce un errore. Il comportamento istintivo dell'harness — riprovare in caso di errore — è attivamente pericoloso, perché «errore» fonde due situazioni completamente diverse:

- I tasti **non hanno mai raggiunto** il campo. Riprovare è gratis.
- I tasti **potrebbero essere arrivati** e a fallire è stata la lettura di conferma. Riprovare digita tutto due volte.

Un harness che non sa distinguerle invierà due volte i form, premerà due volte Invia e duplicherà righe senza che nessuno se ne accorga. Per questo agent-desktop classifica ogni mutazione in tre stati di consegna invece che in un booleano:

| Stato di consegna | Significato | Riprovare? |
|---|---|---|
| **Non consegnato** | Errore di argomenti, accesso negato o comando di sola lettura — l'azione dimostrabilmente non ha mai raggiunto il bersaglio | **Sicuro.** Riprova liberamente |
| **Consegnato non verificato** | L'input è stato inviato ma l'effetto non è confermato — l'esito tipico della sintesi di input fisico | **Non sicuro.** Rileggere lo stato è l'unica mossa corretta |
| **Consegnato** | Effetto confermato rileggendo l'elemento | Fatto; niente da riprovare |

Le letture hanno una classificazione parallela a quattro vie, e la prima è la più sottile:

- **Assenza accertata** — al provider è stato chiesto e il bersaglio non ha davvero quella proprietà o quel pattern. Una *risposta definitiva*, mai ritentata.
- **Fallimento ritentabile** — un guasto di trasporto come un timeout o una connessione caduta. Vale la pena ripetere entro un budget.
- **Elemento non disponibile** — è sparito. Si risolve come ref obsoleto se l'elemento era stato risolto; è ritentabile se capita a metà visita.
- **Fallimento terminale** — un diniego o un codice non classificato. Definitivo, mostrato così com'è.

Lo strumento lo espone direttamente: riprovi solo quando `error.disposition.retry` vale `safe`.

<Callout type="takeaways" items={[
  "Se oggi scrivi un tuo loop di computer use, porta con te questa idea anche se non porti nient'altro. Classifica ogni azione in base a se POTREBBE essere arrivata, e fai di «potrebbe essere arrivata» un ramo distinto che rilegge lo stato invece di riprovare. L'idempotenza non è una proprietà del tuo codice di retry — è una proprietà della singola azione, e solo il livello dello strumento sa quale è quale."
]} />

## Perché i ref sono legati a uno snapshot

In agent-desktop un ref ha l'aspetto `@e8`, ma non puoi mai usarlo da solo — un ref nudo fallisce con `INVALID_ARGS`. Deve essere qualificato dal suo ID di snapshot: `@s8f3k2p9:e8`.

Sembra un attrito. È un sistema di tipi deliberato. La ragione dichiarata: **i ref sono deterministici dentro un singolo snapshot ma non sono stabili tra un cambio di interfaccia e l'altro.** L'ID di snapshot è un namespace, e ogni lookup è confinato al namespace in cui è stato creato — uno snapshot preso sotto una sessione richiede poi quello stesso scope di sessione.

Così la sintassi scomoda rende irrappresentabile un vero errore di categoria. Non puoi portarti per sbaglio un identificatore da un'osservazione di tre azioni fa e vederlo risolversi in silenzio in qualunque cosa occupi ora quello slot. Confrontalo con il mondo degli screenshot, dove una coordinata di uno screenshot vecchio è sintatticamente indistinguibile da una fresca e si risolve in *qualcosa* ogni volta.

### Risoluzione fail-closed: rifiutarsi di indovinare

Quando l'azione parte, il ref viene risolto contro l'albero live attraverso una sequenza graduata, e l'ordine codifica un giudizio su quali prove siano affidabili:

<Steps items={[
  {title: "Percorri il percorso posizionale memorizzato", body: "Segui lungo l'albero corrente il percorso registrato al momento dello snapshot."},
  {title: "Verifica con le prove di identità memorizzate", body: "Controlla il candidato rispetto a ciò che era stato registrato: prima l'ID nativo, poi il testo stabile condizionato dal ruolo. La posizione ti porta a un candidato; l'identità decide se è quello giusto."},
  {title: "Ripiega su una ricerca ampia ma limitata", body: "Se il percorso non esiste più, cerca più in largo — ma con un limite, non all'infinito."},
  {title: "Solo allora, la geometria", body: "Risolvi per geometria univoca come ultima risorsa, e solo quando il ref NON ha alcuna identità significativa su cui confrontarsi. Su Windows e Linux i bounds memorizzati devono essere un rettangolo di area positiva — un hash a estensione zero non viene mai promosso a corrispondenza geometrica."}
]} />

L'impegno di progetto sta in ciò che accade quando nulla di tutto questo produce una corrispondenza sicura: la risoluzione **fallisce in modo chiuso**. Corrispondenze mancanti, obsolete e ambigue vengono rifiutate — `STALE_REF`, `AMBIGUOUS_TARGET` — invece di essere risolte con la miglior ipotesi. Su macOS l'implementazione conserva gli oggetti di accessibilità nativi proprio perché un elemento non possa essere identificato male in silenzio quando l'ordine dell'albero si sposta sotto i suoi piedi.

È l'opposto di come degrada un agente a pixel. Una coordinata obsoleta colpisce sempre *qualcosa*; un ref obsoleto restituisce un errore. **Scambiare un'azione sbagliata silenziosa con un fallimento rumoroso è l'intera pretesa di affidabilità**, ed è lo scambio giusto per qualunque cosa un agente faccia senza supervisione.

<Callout type="note" items={["Lo stesso ragionamento compare nel trattamento a due facce dei risultati parziali nel repo: se uno snapshot esaurisce il suo budget di tempo a metà visita, restituisce ciò che ha osservato invece di scartare la visita — ma riporta la completezza per nodo. Un harness che ignora quel campo ragionerà con sicurezza su un albero troncato e concluderà che un pulsante non esiste. Controlla la completezza prima di concludere un'assenza."]} />

## Proprietà a tre stati: Absent, Unknown, Known

Un meccanismo più piccolo con conseguenze sproporzionate. Le proprietà non vengono mai ridotte a un booleano. Tre stati restano distinti:

- **Known** — un valore è stato letto.
- **Absent** — al provider è stato chiesto e davvero non ha alcun valore.
- **Unknown** — è fallita la lettura stessa.

La maggior parte degli harness appiattisce `Unknown` in `false` o `null`, e un agente poi agisce su una *lettura fallita* come se fosse un risultato negativo: la checkbox «non è spuntata» (non siamo riusciti a leggerla), il campo «è vuoto» (la query è andata in errore). La formulazione del repo è che l'incertezza deve viaggiare — quando una fonte di prova a priorità più alta fallisce, quel fallimento viene portato avanti invece di essere spianato. I nomi accessibili sono calcolati nel core da slot ordinati per rango, non in ogni adapter di piattaforma, così la logica condivisa non vede mai un token specifico di piattaforma e le stesse regole di incertezza valgono ovunque.

Se da questa pagina porti via due cose, porta via la semantica di consegna e questa. Sono due casi della stessa disciplina: **non lasciare che un'incapacità di sapere si spacci per conoscenza.**

## Due limiti da nominare

**L'interaction lease copre solo il dispatch.** L'esclusività dell'input è a livello di macchina e detenuta da un solo processo alla volta, ma il lease deliberatamente *non* copre l'attesa che precede un'azione, perché aspettare che un elemento diventi azionabile può durare a lungo. La conseguenza pratica: un elemento può diventare azionabile e poi cambiare di nuovo tra la tua attesa e il tuo dispatch. È esattamente per questo che il passaggio di verifica non è facoltativo.

**Il supporto di piattaforma non è uniforme e Linux è il bordo sfilacciato.** Albero di accessibilità, click e digitazione funzionano su tutti e tre i sistemi operativi, ma su Linux click e digitazione passano da AT-SPI con avvertenze X11/GNOME, gli screenshot richiedono X11 o un portal Wayland, la clipboard richiede `wl-clipboard` sotto Wayland, la gestione delle app è solo avvio ed elenco, e le notifiche sono GNOME Shell. macOS richiede che il permesso di accessibilità sia concesso esplicitamente, più un `TMPDIR` di proprietà dell'utente con modalità `0700`. Windows non richiede alcun permesso speciale a pari livello di integrità del terminale. Su circa 60 comandi, non tutti sono operativi su ogni piattaforma — controlla `agent-desktop status` sulla macchina su cui intendi davvero girare.

## La superficie di sicurezza è l'intero schermo

Va detto chiaramente, perché la comodità è seducente.

Un agente ad albero di accessibilità legge il **contenuto testuale delle applicazioni**, una cattura strettamente più ricca di uno screenshot della finestra in primo piano — incluso, potenzialmente, contenuto che è a schermo ma non era ciò che stavi guardando. Il repo è esplicito: snapshot, screenshot e contenuto della clipboard possono contenere dati sensibili e vanno tenuti fuori dai log pubblici. Incorpora una vera mitigazione: i **secure field**. Quando una piattaforma marca un elemento come segreto, il percorso di lettura trattiene sia il suo valore sia le prove testuali correlate, e il percorso di azione può scriverci dentro ma non ripete mai il valore tentato o osservato.

Questo protegge le password. Non protegge l'email aperta, il DM di Slack o la scheda cliente nella finestra accanto. Due conseguenze:

1. **Le trascrizioni diventano artefatti sensibili.** I log di agente da una sessione desktop somigliano più a una registrazione dello schermo che alla cronologia di un terminale. Trattali di conseguenza — vedi [cosa carica il tuo agente](/docs/security/what-your-agent-uploads).
2. **Ogni superficie leggibile è una superficie di injection.** Qualunque testo mostrato da un'app diventa input dell'agente, quindi un invito di calendario, un nome di file o un messaggio di chat costruiti ad arte sono un vettore di prompt injection senza alcuna richiesta di rete. Lo stesso ragionamento del [web che il tuo agente legge](/docs/security/the-web-your-agent-reads) vale per il desktop, e la [prompt injection](/docs/security/prompt-injection) ne è il manuale introduttivo. Un agente con esclusività d'input a livello di macchina e senza movimento del puntatore è anche, per costruzione, uno le cui azioni non vedrai accadere.

<Callout type="warning" items={["Headless per impostazione predefinita è insieme una funzione di usabilità e un pericolo per la supervisione. Poiché l'agente non muove il tuo puntatore né ruba il focus, non c'è alcun segnale ambientale che stia agendo. Se lo esegui senza supervisione, il controllo compensativo deve essere il log e un'app bersaglio ristretta — non la tua attenzione. La nostra pagina sul hardening degli autonomous run copre lo schema generale."]} />

## Quando questa architettura è la scelta giusta

| Situazione | Cosa scegliere |
|---|---|
| App desktop nativa con vero supporto all'accessibilità (Finder, Office, la maggior parte delle app Cocoa/WinUI) | **Agente ad albero.** Ref stabili, snapshot di testo economici, nessun calcolo di coordinate |
| App web in un browser | Prima un harness specifico per browser — il DOM è un albero migliore della proiezione AX del browser. Vedi [agenti computer-use a confronto](/docs/models/computer-use-agents) e [browser con login condiviso](/docs/models/browser-agents-shared-login) |
| App canvas/WebGL, gioco, interfaccia disegnata a mano, desktop remoto | **Agente a screenshot.** Non c'è alcuna superficie di accessibilità da leggere |
| L'agente deve girare mentre tu continui a lavorare | **Agente ad albero**, modalità headless — niente furto di focus, niente lotta per il puntatore |
| Azioni ripetute, mutanti, senza supervisione | **Agente ad albero**, e rispetta la semantica di consegna. È il caso per cui esiste l'intero progetto |
| Verifica visiva («ha un bell'aspetto?») | Screenshot, qualunque sia l'harness. Un albero non può dirti che il layout è rotto |

<Flashcards cards={[
  { front: "agent-desktop, in una riga", back: "CLI Rust + libreria C di Vercel Labs (Apache-2.0, v1.0.0 il 28 ott 2026) che dà agli agenti il computer use tramite gli alberi di accessibilità del SO — AX API su macOS, UI Automation su Windows, AT-SPI su Linux." },
  { front: "La regola di retry", back: "Non «successo vs fallimento» ma CONSEGNATO vs NON CONSEGNATO. Non consegnato = sicuro riprovare. Consegnato non verificato = rileggi lo stato, mai riprovare. Consegnato = fatto. Riprova solo quando error.disposition.retry è 'safe'." },
  { front: "Perché @e8 da solo è rifiutato", back: "I ref sono deterministici dentro uno snapshot ma non stabili tra cambi di interfaccia. L'ID di snapshot (@s8f3k2p9:e8) è un namespace che rende irrappresentabile portarsi dietro un identificatore obsoleto invece di sbagliare in silenzio. Un ref nudo fallisce con INVALID_ARGS." },
  { front: "Ordine graduato di risoluzione dei ref", back: "Percorso posizionale memorizzato → prove di identità (ID nativo, poi testo stabile condizionato dal ruolo) → ricerca ampia limitata → geometria univoca solo come ultima risorsa, e solo quando il ref non ha identità significativa. Fail-closed su mancante/obsoleto/ambiguo: STALE_REF, AMBIGUOUS_TARGET." },
  { front: "Absent vs Unknown vs Known", back: "Known = un valore è stato letto. Absent = al provider è stato chiesto e non ne ha. Unknown = la lettura è fallita. Ridurre Unknown a false fa agire un agente su una lettura fallita come se fosse un risultato negativo." },
  { front: "Quattro esiti di lettura", back: "Assenza accertata (definitiva, mai ritentata), fallimento ritentabile (guasto di trasporto), elemento non disponibile (obsoleto se risolto, ritentabile a metà visita), fallimento terminale (diniego o non classificato — definitivo)." },
  { front: "Interaction lease — il tranello", back: "Esclusività dell'input a livello di macchina, un processo alla volta, ma copre SOLO IL DISPATCH, mai l'attesa precedente (le attese possono durare a lungo). Lo stato può quindi cambiare tra attesa e dispatch — ecco perché il passaggio di verifica è obbligatorio." },
  { front: "Secure field", back: "Quando una piattaforma marca un elemento come segreto, le letture trattengono il suo valore E le prove testuali correlate; le azioni possono scriverci dentro ma non ripetono mai il valore tentato o osservato. Protegge le password — non le altre finestre a schermo." },
  { front: "Osservazione parziale", back: "Se uno snapshot supera il suo budget di tempo restituisce ciò che ha visitato invece di scartarlo, e riporta la completezza per nodo. Se ignori quel campo l'agente prenderà un albero troncato come prova che un elemento non esiste." },
  { front: "Dove falliscono gli agenti ad albero", back: "App canvas/WebGL, giochi, interfacce disegnate a mano e desktop remoti espongono poca o nessuna superficie di accessibilità. Anche ogni domanda visiva («ha un bell'aspetto?») — lì usa gli screenshot." },
]} />

<Quiz questions={[
  {
    q: "Il tuo harness invia un comando `type` in un campo di un form e riceve un errore con stato di consegna 'delivered unverified'. Qual è la mossa successiva corretta?",
    options: [
      "Riprovare subito il comando type — non verificato significa che non è arrivato",
      "Rileggere lo stato corrente del campo e decidere da lì",
      "Abortire l'intero task, dato che lo stato è inconoscibile",
      "Ripiegare sulla sintesi di input fisico e digitare di nuovo"
    ],
    answer: 1,
    explain: "'Delivered unverified' significa che l'input è stato inviato ma il suo effetto non è confermato — il risultato tipico della sintesi di input fisico. Riprovare rischia di digitare tutto due volte; abortire butta via un'azione probabilmente riuscita. Leggere lo stato corrente è l'unica mossa che risolve l'ambiguità. Solo 'not delivered' (errore di argomenti, accesso negato, comando di sola lettura) è libero di essere ritentato."
  },
  {
    q: "Perché agent-desktop rifiuta un ref nudo come `@e8` e richiede `@s8f3k2p9:e8`?",
    options: [
      "Per permettere a più agenti di condividere una macchina senza collisioni",
      "Perché i ref sono deterministici dentro uno snapshot ma non stabili tra cambi di interfaccia, quindi l'ID di snapshot delimita il lookup",
      "Per comprimere il JSON dello snapshot e risparmiare token",
      "Perché le API di accessibilità richiedono un token di sessione a ogni chiamata"
    ],
    answer: 1,
    explain: "L'ID di snapshot è un confine di namespace. I ref sono deterministici dentro uno snapshot, ma le mutazioni dell'interfaccia invalidano l'identità posizionale, quindi un ref non qualificato è un errore di categoria — lascerebbe che un identificatore di una vecchia osservazione si risolva in silenzio contro un albero cambiato. Richiedere il qualificatore fa sì che quell'errore fallisca con INVALID_ARGS invece di riuscire in modo sbagliato. (La collisione a livello di macchina è gestita separatamente, dall'interaction lease.)"
  },
  {
    q: "Uno snapshot ritorna senza il pulsante che il tuo agente si aspettava. Cosa devi controllare prima di concludere che il pulsante non esiste?",
    options: [
      "Se la finestra aveva il focus al momento dello snapshot",
      "Se lo snapshot era completo, dato che una visita andata in timeout restituisce risultati parziali con la completezza riportata per nodo",
      "Se l'app è stata avviata da agent-desktop anziché a mano",
      "Se era attiva la modalità --headed"
    ],
    answer: 1,
    explain: "Se uno snapshot supera il suo budget di tempo restituisce ciò che è riuscito a osservare invece di scartare la visita, e riporta la completezza su ogni nodo. Un agente che ignora la completezza tratta un albero troncato come prova di assenza. È la stessa disciplina della distinzione Absent/Unknown: un'osservazione fallita non è un'osservazione negativa."
  },
  {
    q: "Quale task è il PEGGIOR candidato per un agente ad albero di accessibilità?",
    options: [
      "Rinominare un lotto di file nel Finder",
      "Compilare un form a più passaggi in un'applicazione Windows nativa",
      "Verificare se una visualizzazione dati WebGL è stata renderizzata correttamente",
      "Pilotare un'app macOS mentre l'utente continua a scrivere in un'altra finestra"
    ],
    answer: 2,
    explain: "Un canvas WebGL non espone praticamente alcuna superficie di accessibilità, e «renderizzato correttamente» è una domanda visiva a cui un albero non può rispondere nemmeno in linea di principio — serve uno screenshot. Gli altri tre sono i punti di forza dell'architettura: ref stabili su app native e operatività headless che non muove il puntatore né ruba il focus."
  },
  {
    q: "Qual è la principale NUOVA esposizione di sicurezza di un agente ad albero desktop rispetto a un agente a screenshot confinato a una sola scheda del browser?",
    options: [
      "Le API di accessibilità possono essere usate per scalare i privilegi del SO",
      "Legge il contenuto testuale di più applicazioni, quindi tutto ciò che è a schermo diventa insieme cattura sensibile e vettore di injection",
      "Gli snapshot sono non cifrati su disco per impostazione predefinita",
      "I secure field non sono supportati su Windows"
    ],
    answer: 1,
    explain: "La cattura è più ricca di uno screenshot della finestra in primo piano: il testo delle applicazioni su più superfici finisce nella trascrizione, quindi i log si comportano più come una registrazione dello schermo, e qualunque testo mostrato — un invito di calendario, un nome di file, un messaggio di chat — è un vettore di prompt injection che non richiede alcuna richiesta di rete. Il repo mitiga il caso ristretto: i secure field marcati dalla piattaforma trattengono valore e prove testuali correlate in lettura e non fanno mai eco in scrittura. Copre le password, non le altre finestre."
  }
]} />

<Callout type="takeaways" items={[
  "Gli alberi di accessibilità sostituiscono una scommessa sulle coordinate con un riferimento nominato, quindi i cambi di layout che rompono un agente a screenshot diventano un non-evento — ma canvas, giochi e interfacce disegnate a mano non hanno alcun albero da leggere.",
  "Ruba il modello di consegna: classifica le azioni in base a se POTREBBERO essere arrivate, non a se hanno restituito un errore. «Potrebbe essere arrivata» merita una rilettura, mai un retry.",
  "Legare i ref a uno snapshot è un sistema di tipi, non attrito — rende impossibili da esprimere i bug da identificatore obsoleto invece di lasciarli sbagliare in silenzio.",
  "La risoluzione fail-closed è la pretesa di affidabilità: una coordinata obsoleta colpisce sempre qualcosa, un ref obsoleto restituisce STALE_REF. Preferisci il fallimento rumoroso per tutto ciò che è senza supervisione.",
  "Tieni Unknown distinto da Absent. Un agente che legge una query fallita come risultato negativo agirà con sicurezza sul nulla.",
  "L'operatività headless elimina il segnale ambientale che un agente sta lavorando. Se lo esegui senza supervisione, log e un'app bersaglio ristretta sono il controllo — non la tua attenzione.",
]} />

## Fonti e approfondimenti

- [vercel-labs/agent-desktop](https://github.com/vercel-labs/agent-desktop) — il progetto: README, installazione e matrice di supporto per piattaforma, gruppi di comandi, forma dell'output JSON, i flag `--skeleton`/`--compact`/`--root`, licenza (Apache-2.0) e la cronologia dei rilasci v1.0.0–v1.0.2
- [agent-desktop — CONCEPTS.md](https://github.com/vercel-labs/agent-desktop/blob/main/CONCEPTS.md) — la fonte di tutto ciò che c'è nella seconda metà di questa pagina: scoping dei ref, risoluzione graduata fail-closed, i quattro esiti di lettura, semantica di consegna, prove a tre stati, interaction lease, secure field e osservazione parziale
- [agent-desktop — docs/faq.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/faq.md) e [docs/json-output.md](https://github.com/vercel-labs/agent-desktop/blob/main/docs/json-output.md) — i codici di errore e il contratto di output leggibile dalle macchine
- [Apple — Accessibility API (NSAccessibility)](https://developer.apple.com/documentation/appkit/nsaccessibility) · [Microsoft — UI Automation](https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32) · [GNOME — AT-SPI2](https://gitlab.gnome.org/GNOME/at-spi2-core) — i tre alberi di piattaforma sottostanti
- Correlato su AILmanac: [Agenti computer-use a confronto](/docs/models/computer-use-agents) — le API basate su screenshot di Anthropic, OpenAI e Google, e i bug di coordinate che questa architettura aggira
- Correlato su AILmanac: [Browser con login condiviso per agenti AI](/docs/models/browser-agents-shared-login) — la variante browser, in cui l'agente eredita la tua sessione per progetto
- Correlato su AILmanac: [Prompt injection](/docs/security/prompt-injection) — il manuale introduttivo che ora vale per ogni finestra del tuo desktop
- Correlato su AILmanac: [Cosa carica il tuo agente](/docs/security/what-your-agent-uploads) — perché le trascrizioni degli agenti desktop vanno trattate come registrazioni dello schermo

## Avanti

- [Agenti computer-use a confronto](/docs/models/computer-use-agents) — l'altra architettura, e come divergono gli spazi d'azione dei tre grandi provider
- [Browser con login condiviso per agenti AI](/docs/models/browser-agents-shared-login) — il caso browser, dove la postura di sicurezza si rovescia
- [Hardening degli autonomous run](/docs/security/hardening-autonomous-runs) — i controlli da mettere attorno a un agente che agisce senza un segnale ambientale
- [Runtime degli agenti: isolate vs container](/docs/frontiers/agent-runtimes-isolates-vs-containers) — dove dovrebbe davvero eseguirsi questo loop
