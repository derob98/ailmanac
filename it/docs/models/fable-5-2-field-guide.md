# Claude Fable 5.2: la guida pratica alla migrazione

> Source: https://derob98.github.io/ailmanac/it/docs/models/fable-5-2-field-guide · AILmanac (CC BY 4.0) · last verified 2026-11-10

Anthropic ha rilasciato Claude Fable 5.2 e Mythos 5.2 il 9 novembre 2026 — il primo point release di punta di Claude che costa MENO del modello che sostituisce ($8/$40, il 20% in meno). Quattro breaking change, un controllo del prefisso che ora vale per ogni account, righe di prompt che smettono di funzionare e una tabella di benchmark ufficiale con due righe che la copertura giornalistica ha ignorato.

<LevelBadge level="intermediate" />

Il **9 novembre 2026** Anthropic ha rilasciato **Claude Fable 5.2** (`claude-fable-5-2`) e il suo gemello con accesso verificato **Claude Mythos 5.2** (`claude-mythos-5-2`). Una cosa rende questa release strutturalmente diversa da ogni modello di punta di Claude precedente: **costa meno del modello che sostituisce.** Fable 5.1 costava $10 per milione di token in input e $50 per milione in output; Fable 5.2 costa **$8 e $40** — un taglio del 20% — e genera l'output fino al 30% più velocemente.

Questa è la metà facile. La metà difficile è che la modifica più rilevante di questa release **non** è una nuova funzionalità, ed è quella che ha più probabilità di mandare in tilt un'integrazione funzionante: il controllo del prefisso dei blocchi di thinking, che su Fable 5.1 dava errore solo sugli account creati il 31 agosto 2026 o dopo, **ora vale per ogni account**. Il codice che modifica la cronologia della conversazione gira senza errori da due mesi su un account più vecchio. Dopo il cambio dell'ID del modello restituisce un 400.

Questa pagina è la guida pratica alla migrazione: cosa si rompe, cosa compra e cosa non compra il taglio di prezzo, quali righe di prompt vanno eliminate e come leggere con onestà i benchmark del lancio di Anthropic.

<Callout type="objectives" items={[
  "Verificare sul tuo codice i quattro breaking change, a partire dal controllo del prefisso che si è appena esteso a ogni account",
  "Capire cosa cambia il taglio di prezzo del 20% e cosa no — e quando la modalità fast vale il doppio del listino",
  "Eliminare le righe di prompt che hanno smesso di funzionare in silenzio, compresa 'rispondi direttamente senza ragionare'",
  "Usare la frase sulla proprietà del codice che circa quintuplica la frequenza con cui il modello unifica il codice duplicato — e conoscerne il costo",
  "Leggere la tabella di benchmark di Anthropic, comprese le due righe in cui Fable 5.2 non vince",
  "Decidere tra Fable 5.2, Opus 5.5 e restare su Fable 5.1, poi eseguire la migrazione nell'ordine giusto",
]} />

<VerifyNote lastVerified="2026-11-10" source="https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2">
ID dei modelli, specifiche, i quattro breaking change, prezzi, tariffe della modalità fast, indicazioni sull'effort, categorie di rifiuto, modelli di fallback, stato della retention e disponibilità provengono dalla documentazione ufficiale di Anthropic ["What's new in Claude Fable 5.2"](https://platform.claude.com/docs/en/models/fable-5-2/whats-new-fable-5-2), dalla [guida alla migrazione](https://platform.claude.com/docs/en/models/fable-5-2/migration-guide), dalla [panoramica dei modelli](https://platform.claude.com/docs/en/models/overview) e da [Prompting Claude Fable 5.2](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2), tutte lette il 10 novembre 2026. I dati dei benchmark e l'affermazione "stesso modello di base" sono di Anthropic, dall'[annuncio di lancio](https://www.anthropic.com/claude-fable-and-mythos-5-2). I risultati comportamentali citati in percentuale sono i risultati dei test interni di Anthropic così come pubblicati, non misurazioni indipendenti. Gli header beta possono cambiare forma — ricontrollali prima del rilascio. Per la tabella aggiornata dei modelli vedi [Modelli e prezzi attuali](/docs/whats-new/models-and-pricing).
</VerifyNote>

## La versione in un paragrafo

Fable 5.2 è il successore di [Fable 5.1](/docs/models/fable-5-1-field-guide), stessa fascia classe Mythos sopra Opus, stesso contesto da 1M di token, stesso output massimo da 128K, stesso tokenizer (quello introdotto con Opus 4.7), stesso thinking adattivo sempre attivo, stesso comportamento `stop_reason: "refusal"` in-band, stesso requisito di retention a 30 giorni senza ZDR. L'indicazione di Anthropic non cambia: **parti dall'Opus attuale** — Opus 5.5 — e passa a Fable 5.2 "quando le tue valutazioni su un modello Claude Opus a effort più alto continuano a non soddisfare i requisiti". Le novità: un taglio di prezzo del 20%, output fino al 30% più veloce, una modalità fast opzionale a 2,5x la velocità di token per 2x il prezzo, quattro breaking change e una serie di cambiamenti nel prompting che rendono diverse righe del tuo system prompt attuale inutili o attivamente costose.

## Quattro breaking change

Ognuno di questi è un 400, non un degrado silenzioso. Affrontali in quest'ordine — il primo è quello che coglie di sorpresa chi non ha fatto nulla di sbagliato.

### 1. Il controllo del prefisso ora vale per ogni account

È la modifica da leggere due volte. Ogni blocco di thinking di Fable 5.2 registra lo stato di tutto ciò che lo precede: il prompt `system`, l'array `tools` e ogni messaggio precedente. Se rimandi un blocco di thinking dopo che una di queste parti è cambiata, l'API rifiuta la richiesta:

```text
The block is bound to a different conversation
```

Su **Fable 5.1**, quel 400 scattava solo sugli account creati il **31 agosto 2026 o dopo**. Su **Fable 5.2 scatta su ogni account, a prescindere dall'età.** (Mythos 5.1 si comportava già così sulla Claude API, quindi se arrivi da Mythos questa parte per te non è una novità.)

La conseguenza è specifica e sgradevole: un harness che riscrive la cronologia — iniettando un promemoria in un turno precedente, tagliando i messaggi vecchi, cambiando il system prompt a metà sessione, riordinando qualsiasi cosa — è girato senza errori su un account creato prima di quella data. Inizia a fallire nel momento in cui cambi l'ID del modello, e il guasto sembra una regressione del nuovo modello invece di un bug latente nel tuo codice.

:::danger[Testalo anche se Fable 5.1 non ti ha mai dato errori]
"Oggi funziona" non è una prova. Se il tuo codice costruisce da sé l'array `messages`, l'assenza di questo errore su Fable 5.1 può significare soltanto che il tuo account è precedente al 31 agosto 2026. Esegui il test prima del cambio, non dopo.
:::

Sei al sicuro senza modifiche se **tutte** queste condizioni sono vere: `system` e `tools` restano identici per tutta la conversazione; il tuo codice si limita ad **aggiungere** a `messages`; e ogni turno dell'assistant torna indietro esattamente come l'API lo ha restituito, con ogni blocco nell'ordine originale. Sei al sicuro anche se a costruire le richieste sono Claude Code, claude.ai, Claude Managed Agents o il Claude Agent SDK — in quel caso l'ID del modello è l'intera migrazione.

Il rimedio provvisorio, se devi rilasciare prima di poter correggere la modifica, è inviare l'header beta `thinking-binding-controls-2026-08-01` e impostare `thinking.block_binding.prefix_mismatch_behavior` su `"drop_block"`. La richiesta allora va a buon fine ed elenca ogni blocco scartato in un array `input_transformations` di primo livello. Trattalo come un rimedio provvisorio e non come un'impostazione: i test di Anthropic hanno rilevato che quando il thinking precedente veniva scartato a ogni turno, il modello **ragionava di nuovo da zero e usava più token di output**. Misuralo sui tuoi compiti prima di farci affidamento.

Le soluzioni durature sono gli strumenti append-only: i [messaggi di sistema a metà conversazione](/docs/api/mid-conversation-system-messages) per cambiare le istruzioni, i messaggi di sistema limitati al turno per i promemoria di singolo turno, e la compattazione o l'editing del contesto — in particolare una compattazione che non conserva **nessun** turno precedente dopo il riassunto — per accorciare la cronologia.

### 2. I blocchi di thinking di Fable 5.2 sono una porta a senso unico

Fable 5.2 e Mythos 5.2 leggono i blocchi di thinking l'uno dell'altro, e leggono quelli di Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1, Mythos 5.1, Opus 5, Fable 5, Mythos 5 e dei precedenti modelli Opus/Sonnet/Haiku. **Nessun altro modello legge i loro.**

Quindi spostare una conversazione *su* Fable 5.2 ne preserva il ragionamento. Spostarla *fuori* da Fable 5.2 fa perdere il ragionamento di ogni turno che vi si è svolto — compresi Opus 5.5, Fable 5.1 e i due modelli di fallback di Fable 5.2, Opus 4.8 e Opus 5. Se usi un router, un downgrade per risparmiare o un fallback lato server in caso di rifiuto, è un vero cambiamento di comportamento e non una questione teorica.

Il guasto è silenzioso: l'API scarta il blocco illeggibile prima che il modello lo veda, la richiesta va a buon fine e i blocchi scartati non vengono fatturati. Lo vedi solo se invii l'header `thinking-binding-controls-2026-08-01` e leggi `input_transformations`.

C'è un secondo vincolo oltre a quello sul modello: **i blocchi di thinking di Fable 5.2 funzionano solo nell'account che li ha prodotti**, o in un account collegato a esso. La richiesta di un altro account va a buon fine con il blocco scartato in silenzio, segnalato come `reason: "organization_binding_mismatch"` con l'header beta. Conta se sposti trascrizioni tra ambienti.

### 3. `computer_20251124` non c'è più fuori da Bedrock

Fable 5.1 accettava il computer use in due modi: il toolset `computer_toolset_20260801` e il vecchio strumento `computer_20251124` dietro l'header beta `computer-use-2025-11-24`. Fable 5.2 e Mythos 5.2 supportano **solo il toolset**. Dichiarare `computer_20251124` restituisce un 400 `invalid_request_error` su ogni piattaforma **tranne Amazon Bedrock**, dove il vecchio strumento funziona come prima.

Questa eccezione per Bedrock va tenuta presente se lavori su più piattaforme: lo stesso corpo di richiesta può essere valido su Bedrock e non valido sulla Claude API.

### 4. Un executor Fable 5.2 richiede un advisor Fable 5.2 o Mythos 5.2

Con l'[advisor tool](/docs/api/tool-use) in beta, l'advisor deve essere almeno capace quanto l'executor. Un executor Fable 5.2 o Mythos 5.2 accetta **solo** `claude-fable-5-2` o `claude-mythos-5-2` come advisor — qualsiasi altro valore, compresi Fable 5.1 e Mythos 5.1, restituisce un 400.

C'è una trappola sull'ordine delle operazioni che morde una volta sola e confonde per un'ora. Cambiare il `model` dell'advisor **è una modifica a `tools`**, quindi fa scattare il breaking change #1. Fai quindi il cambio dell'advisor in **nuove conversazioni**, non a metà di una esistente. E se vuoi aggiornare solo l'advisor mantenendo l'executor attuale, impostalo su `claude-fable-5-2`: ogni modello executor lo accetta.

Un ultimo dettaglio, se il tuo codice legge il testo del consiglio invece di limitarsi a passarlo oltre: un advisor Fable 5.2 restituisce il suo consiglio **cifrato**.

<Callout type="info" items={[
  "Due regole che NON sono nuove in 5.2, ma restano i 400 più comuni: il thinking adattivo è sempre attivo (sia thinking.type 'enabled' con budget_tokens sia 'disabled' restituiscono 400), e un tool_choice forzato ('any' o uno strumento con nome) restituisce 400. Se arrivi da Fable 5.1, Mythos 5.1 o Opus 5.5 le gestisci già entrambe. Se arrivi da Opus 5 o precedenti, per te sono entrambe breaking change.",
]} />

## La migrazione, in ordine

Anthropic pubblica un ordine esplicito. Seguilo — diversi di questi passaggi interagiscono, e farli fuori ordine significa ripetere i test.

<Steps items={[
  {title: "Cambia l'ID del modello", body: "Imposta model su claude-fable-5-2 (o claude-mythos-5-2). Se a costruire le richieste sono Claude Code, claude.ai, Managed Agents o l'Agent SDK, hai finito — fermati qui. Nota che Claude Code offre una scorciatoia /claude-api migrate per i codebase."},
  {title: "Imposta esplicitamente l'effort su high, poi fai uno sweep", body: "high è il default dell'API. Impostalo comunque in modo esplicito, così un futuro cambio di default non lo sposta sotto i tuoi piedi, poi esegui le valutazioni anche a medium e xhigh. NON riportare un livello tarato su Fable 5.1 o Opus 5.5 — i livelli sono ricalibrati per modello, quindi la stessa parola indica una quantità diversa di thinking."},
  {title: "Verifica se il tuo codice modifica la cronologia", body: "Se il tuo codice costruisce da sé l'array messages, esegui il test del controllo del prefisso anche se Fable 5.1 non ha mai restituito l'errore per il tuo account. È il passaggio che le persone saltano perché la produzione sembra a posto."},
  {title: "Controlla ogni cambio di modello", body: "Trova ogni punto in cui un router, un fallback o un downgrade per risparmiare sposta una conversazione tra modelli. Ogni modello tranne Mythos 5.2 scarta i blocchi di thinking di Fable 5.2 — compresi Opus 5.5 e Fable 5.1."},
  {title: "Sposta il computer use sul toolset", body: "Sostituisci computer_20251124 con computer_toolset_20260801 ovunque tranne su Bedrock, dove il vecchio strumento funziona ancora."},
  {title: "Aggiorna l'advisor, in una nuova conversazione", body: "Imposta il model dell'advisor tool su claude-fable-5-2 o claude-mythos-5-2. Poiché questo modifica tools, avvia una nuova conversazione invece di cambiarlo a metà sessione."},
  {title: "Leggi i prompt prima di fidarti delle valutazioni", body: "Apri system prompt, skill, file degli agent, file di memoria e testo dell'harness, ed elimina o ritesta le righe della sezione successiva. Diverse ora costano token per niente, e una cambia il comportamento in una direzione che probabilmente non vuoi."},
  {title: "Esegui il tuo compito agentico più lungo e osserva cinque comportamenti specifici", body: "Dove il modello si ferma presto, chiede approvazioni non necessarie, diventa silenzioso, delega più del necessario o aggiunge al codice esistente dove volevi una ristrutturazione. Applica una correzione alla volta e misurane il costo in token."},
]} />

## Le righe di prompt da eliminare ora

È la sezione che viene saltata e non dovrebbe. Anthropic documenta diverse istruzioni scritte per modelli precedenti che, su Fable 5.2, hanno smesso di funzionare o ora ti costano denaro.

**"Rispondi direttamente senza ragionare" non funziona più.** Fable 5.1 di solito rispettava una riga così. Nei test di Anthropic, **non ha impedito a Fable 5.2 di ragionare con effort `medium` e superiore** — e da `high` in su il modello ragiona prima di quasi ogni risposta, anche a un saluto. La soluzione non è una frase migliore; è un **livello di effort più basso per quei turni**. Elimina la riga e cambia la manopola.

**Un budget di token scritto nel prompt ti sta costando.** Alcuni harness dicono al modello nel prompt quanti token può usare il compito e quanti ne restano. Nei test di Anthropic su compiti di coding a `high` e `xhigh`, **rimuovere un budget ampio ha ridotto il costo con prestazioni equivalenti**. (Si parla di *testo nel prompt*, non della funzione beta task-budgets dell'API, che i test non hanno coperto.)

**Istruzioni permanenti di delegare.** Le righe che spingono il lavoro verso i subagent si accumulano in system prompt, skill e file degli agent. Fable 5.2 delega volentieri in un harness i cui prompt lo invitano a farlo, e Anthropic osserva che i subagent possono rappresentare una quota ampia di quanto costa una sessione. Leggi quei file prima di migrare e controlla su quale modello il tuo harness esegue i subagent di default.

**I limiti di stile rigidi rendono la prosa a scatti.** Fable 5.2 segue le regole di stile da vicino, quindi una regola come "una istruzione per frase, in 20 parole o meno" viene ora seguita alla lettera fino a far danno.

**Le righe "tratta quella risposta come conclusa" della guida a Opus 5.5.** Quelle due frasi riducono davvero il thinking di Fable 5.2 sulle domande di approfondimento a effort `high` — e nei test di Anthropic hanno anche reso il modello **molto meno propenso a segnalare errori nelle sue risposte precedenti.** È uno scambio sfavorevole nella maggior parte delle applicazioni. Lasciale fuori dove vuoi che il modello continui a riesaminare il proprio lavoro.

**Cautele accumulate.** Questo punto è sottile e specifico di quanto da vicino la 5.2 segua le istruzioni. Le regole prudenziali si accumulano ovunque il contesto venga riportato — file di memoria, note, file di istruzioni, messaggi tra agent — e alcune sono state scritte dal modello stesso. I numeri di Anthropic: con una dozzina di note di sessioni precedenti, una delle quali diceva di non riprovare mai, il modello ha riprovato dopo uno strumento occupato in circa **quattro tentativi su dieci, contro quasi tutti** senza quelle note. L'"fermati al primo errore" di un agent revisore nel contesto è bastato a impedire a Fable 5.2 di riprovare in circa un terzo dei tentativi, in una configurazione in cui **sia Fable 5.1 sia Opus 5.5 hanno riprovato**.

La correzione che funziona davvero è controintuitiva: **scrivi l'eccezione dentro la regola stessa**, invece di aggiungere una riga separata che concede l'eccezione. Con una regola "mai" nuda, dove una persona responsabile aveva approvato il passaggio, il modello lo ha eseguito in circa **un tentativo su dieci**; una riga separata che dice che un passaggio approvato ha il via libera ha spostato poco; riscrivere la regola stessa in modo che dica di ottenere prima un via libera lo ha portato a circa **nove tentativi su dieci**.

## Due aggiunte al prompt che si meritano i loro token

### Finisci tutto il compito

Fable 5.2 a volte chiude un turno prima che il lavoro sia finito — concludendo con un elenco di ciò che resta, un'offerta di continuare, o una sosta davanti a un ostacolo ordinario come un timeout. Succede di più con effort `low` e `medium`. Anthropic pubblica un testo per il system prompt a questo scopo, e il suo effetto misurato su sessioni riprodotte da un prodotto di coding agentico a effort `medium`: **circa la metà delle sessioni è terminata con lavoro fattibile ancora da fare**, al costo di circa il **30% di token di output in più**.

<PromptCard title="Finisci tutto il compito — aggiunta al system prompt">
{`# Finishing work
Please avoid stopping while you still owe work the user asked for. Be persistent and do not stop unless needed.

While status notes are welcome, as is clarifying with the user on open decisions, carry on with work that does not depend on the user's answer without unnecessary stops.

If you notice yourself inviting the user to redirect you or offering to wait, instead proceed on the next part of the task. You may meet ordinary obstacles like errors, timeouts, locked files, empty results or failing tools. Diagnose them first, and when they are not real blockers, work through them with the access you have (wait and retry, fix the request, use another tool or source) rather than stopping unnecessarily.

If someone clearly decided something is a hard blocker, such as a file marked not to be touched, access that was intentionally withheld, or a safety guardrail, leave it alone, say plainly what you found, and look for another safe way to finish the task. Stopping before the task is complete is very rarely merited, as in when the task can't move forward without user input, or where the blocker is deliberate and should not be worked past. This does not override the need for confirmation on risky or destructive actions.`}
</PromptCard>

L'idea strutturale da conservare quando lo adatti: **separa due tipi di ostacolo**. I guasti ordinari — errori, timeout, strumenti occupati — si diagnosticano e si superano. Gli ostacoli deliberati — un file marcato da non toccare, un accesso volutamente negato, una protezione di sicurezza — si lasciano stare e si segnalano. Anthropic osserva anche che il testo ha eliminato la maggior parte dei finali che chiedono il permesso, ma **non** i finali che elencano ciò che resta e poi si fermano.

Una conseguenza su cui progettare: poiché il modello ora chiede meno spesso, **mantieni un tuo passaggio di conferma per le azioni rischiose o irreversibili.** Il prompt non sostituisce un gate.

### Dì chi è il proprietario del codice

È l'effetto misurato più sorprendente di tutta la release, ed è una sola frase. Fable 5.2 reagisce con attenzione a ciò che il prompt dice su chi possiede il codice. Quando il prompt non diceva nulla sulla proprietà, o presentava il codebase come di qualcun altro, il modello tendeva ad **aggiungere alla struttura esistente anche quando questo duplicava il codice**, e a **segnalare i problemi vicini invece di risolverli**.

<PromptCard title="Proprietà del codice — una frase, effetto misurato">
{`This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.`}
</PromptCard>

I numeri di Anthropic su piccoli compiti di coding: il modello ha unificato il codice duplicato in circa la **metà** dei tentativi con questa frase, e in **meno di un decimo** senza. L'effetto reggeva anche quando la frase stava dentro un lungo system prompt.

Ora il conto, perché questo è uno scambio e non una vittoria gratuita. Con la frase, il modello ha usato circa **1,5x i token di output**, ha fatto diverse modifiche che nessuno aveva chiesto (molte erano nuovi test e documentazione) e — correzioni di bug a parte — ha **cambiato il comportamento di una funzionalità esistente in un tentativo su sei-dieci**, più spesso a effort più alto. Il riassunto finale nominava le modifiche più grandi ma spesso ometteva quelle piccole.

:::warning[Rivedi il diff, non il riassunto]
Quest'ultimo risultato è quello operativo: il recap del modello non è un changelog completo di ciò che ha fatto. E nota che un limite di ambito altrove nel prompt **non** annulla questa frase — con "Niente refactor, rinomine o pulizie collaterali" prima nello stesso prompt, il modello ha comunque unificato il codice duplicato in circa un terzo dei tentativi. Lascia fuori del tutto la frase dove il codice è dell'utente e vuole modifiche minime.
:::

## Effort: parti da high e sappi a cosa serve ogni livello

Fable 5.2 supporta tutti e cinque i livelli di effort e usa di default **`high`** sulla Claude API. Per Anthropic **la maggior parte del guadagno di capacità è già presente a `high`**, e oltre i guadagni sono disomogenei e dipendenti dal compito.

| Livello | Per cosa lo raccomanda Anthropic |
|---|---|
| `low` | Scambi rapidi, compiti ben specificati, lavoro ad alto volume, subagent veloci. Qui i punteggi erano **vicini a quelli di Fable 5.1 a livelli di effort più alti**. |
| `medium` | Coding interattivo, chat, lavoro di conoscenza quotidiano. |
| `high` | Coding difficile, ricerca, lavoro agentico, esecuzioni lunghe senza supervisione. Il default. I turni durano sensibilmente di più rispetto a `medium`. |
| `xhigh` | Il tuo lavoro di coding e agentico più difficile e di lunga durata, *dove hai misurato un guadagno*. Ha alzato leggermente i punteggi di coding interni e usato molti più token. |
| `max` | Misurare il tetto, o problemi aperti come scoperta scientifica e matematica, dove tempo e token non contano. |

Tre comportamenti da tenere a mente quando scegli un livello. Il modello è **più incline a fermarsi presto con effort più basso**, quindi abbina il lavoro agentico a `low`/`medium` al testo "finisci tutto il compito" qui sopra. Da `high` in su **ragiona prima di quasi ogni risposta**, quindi manda i turni facili a un livello più basso invece di provare a eliminare il thinking col prompt. E **l'effort cambia appena la lunghezza della risposta** — quello è un lavoro di prompting, non una manopola.

Puoi mescolare i livelli in un unico flusso: pianifica a `medium`, poi alza l'effort per il lungo tratto senza supervisione. Per cambiare livello a metà conversazione *senza* azzerare la cache del prompt, usa l'effort per messaggio (beta, `mid-conversation-output-config-2026-07-01`); impostare invece un nuovo `effort` di primo livello fa ripartire la cache. Approfondimento: [Effort Tuning](/docs/api/effort-tuning) e [Thinking & Effort](/docs/api/thinking-and-effort).

## Cosa compra davvero il taglio di prezzo

| | Fable 5.1 | Fable 5.2 | Fable 5.2 fast mode |
|---|---|---|---|
| Input base | $10 / MTok | **$8 / MTok** | $16 / MTok |
| Output | $50 / MTok | **$40 / MTok** | $80 / MTok |
| Letture dalla cache | $0.25 / MTok | **$0.20 / MTok** | — |
| Scritture in cache 5m | — | $10 / MTok | — |
| Scritture in cache 1h | — | $16 / MTok | — |
| Batch | — | $4 in / $20 out | — |

Tre cose da ricavare da quella tabella. **Il moltiplicatore delle letture dalla cache non è cambiato** — è ancora 0,025x l'input base, lo stesso rapporto introdotto da Fable 5.1, quindi il risparmio principale è un 20% netto su tutta la linea e non una nuova storia sul caching. **Il batch è il solito 50% di sconto**, il che porta l'input Fable 5.2 in batch al prezzo di Opus 5.5 non in batch. E **la modalità fast è esattamente 2x la tariffa standard** per "fino a 2,5 volte" la velocità di generazione dei token, il che ne fa un acquisto di latenza con un bilancio di throughput tra il pareggio e un leggero vantaggio — vale la pena quando c'è una persona che aspetta, non come default.

La modalità fast per Fable 5.2 è disponibile sulla Claude API, su entrambi i percorsi Google Cloud e su Microsoft Foundry (dove è un **ID modello separato**, `claude-fable-5-2-fast`, per i deployment ospitati da Anthropic). Anthropic la elenca anche in Claude Code.

:::tip[Il modello di punta più economico non è comunque l'opzione economica]
Opus 5.5 costa $4 / $20 — la metà di Fable 5.2 — e resta il punto di partenza raccomandato da Anthropic stessa. Il taglio di prezzo riduce il divario; non cambia il consiglio. Passa a Fable 5.2 quando le tue valutazioni su Opus a effort più alto non bastano, e per i numeri aggiornati vedi [Modelli e prezzi attuali](/docs/whats-new/models-and-pricing).
:::

## Leggere con onestà i benchmark del lancio

Anthropic ha pubblicato una tabella di confronto al lancio. Eccola, così com'è stata pubblicata — e poi le tre cose da notare.

| Benchmark | Fable 5.2 | Fable 5.1 | Opus 5.5 | GPT-6 Astra | Gemini 4 Carbon |
|---|---|---|---|---|---|
| FrontierCode 2.0 (agentic coding) | 49.1% *(xhigh)* | 41.1% *(medium)* | 45.5% | 42.8% | — |
| FrontierSWE v2 (agentic coding) | 69.9% | 56.3% | 62.3% | 65.5% | 61.2% |
| AutomationBench (business workflows) | 51.4% | 31.4% | 42.5% | 41.4% | **53.9%** |
| Terminal-Bench-Science 0.1 | 74.6% | 52.6% | 58.7% | 68.1% | 64.8% |
| WANDR (agentic search, relaxed) | 82.1% | 68.7% | 72.3% | — | — |
| OSWorld 2.1 (computer use, partial) | 89.3% | 83.5% | 87.2% | 79.5% | 81.5% |
| RoboDojo Sim (robotics) | 64.9% | 27.6% | 39.4% | 29.8% | — |
| AA-Briefcase v1.1 (rubric) | 66.1% | 61.5% | 61.2% | 52.0% | 61.8% |
| AA-Briefcase v1.1 (Elo) | 1785 | 1669 | **1800** | 1569 | 1611 |
| Remote Labor Index | 41.3% *(high)* | 17.9% | 21.3% | 20.8% | — |
| Humanity's Last Exam (with tools) | 74.2% | 65.6% | 67.7% | 57.2% | — |
| Chartography (visual charts, no tools) | 73.4% | 44.8% | 64.4% | 71.0% | 72.5% |

**Primo: la riga di coding in evidenza confronta livelli di effort diversi.** Il 49,1% di Fable 5.2 su FrontierCode 2.0 è a `xhigh`; il 41,1% di Fable 5.1 è a `medium`. Anthropic lo indica nelle proprie note, e la maggior parte della copertura ha lasciato cadere le etichette. Non è un numero inventato — semplicemente non è il salto di 8 punti a parità di impostazioni che sembra. La riga FrontierSWE v2 (69,9% contro 56,3%) non ha questa riserva ed è il confronto di coding più pulito.

**Secondo: Fable 5.2 non fa cappotto.** Gemini 4 Carbon lo batte su AutomationBench (53,9% contro 51,4%) e — la riga che nessuno ha citato — **Opus 5.5 lo batte sull'Elo di AA-Briefcase, 1800 a 1785**, anche se Fable 5.2 vince il punteggio rubric dello stesso benchmark 66,1% a 61,2%. Un punteggio rubric e un Elo testa a testa misurano cose diverse, e qui discordano. Se il tuo carico di lavoro è lavoro di conoscenza e non coding a lungo orizzonte, quel disaccordo è la riga più rilevante per la decisione in tutta la tabella, e porta a eseguire le tue valutazioni invece di aggiornare sulla base di un post di lancio.

**Terzo: i salti più grandi sono nei domini più ristretti.** RoboDojo Sim più che raddoppia (27,6% → 64,9%) e Remote Labor Index più che raddoppia (17,9% → 41,3%). Impressionante, e anche le righe che meno probabilmente dicono qualcosa sulla tua applicazione. La lezione generale e la checklist di sei domande: [Come leggere un benchmark AI senza farsi ingannare](/docs/models/reading-ai-benchmarks).

Sul versante Mythos, la tabella di Anthropic lo colloca leggermente sopra Fable 5.2 esattamente dove le protezioni si applicano: **76,3%** su CyScenarioBench, **89,6%** su CVE Rediscovery, **85,1%** nel design de novo di binder in 24 ore, **75,3%** su Terminal-Bench-Science 0.1.

## Fable 5.2 vs Mythos 5.2

La dichiarazione di Anthropic stessa è l'inquadramento più chiaro disponibile, e vale la pena citarla invece di parafrasarla: "Claude Fable e Claude Mythos sono lo stesso modello di base. Fable ha solide protezioni in ambito cybersecurity e biologia contro gli usi impropri, il che ci permette di renderlo disponibile a tutti gli utenti."

Quindi Mythos 5.2 non è un modello più grande. Sono gli stessi pesi senza le protezioni cyber e biologia, disponibili solo alle organizzazioni verificate tramite programmi come il **Cyber Verification Program**. Anthropic afferma anche che le protezioni di Fable 5.2 sono "robuste quanto quelle di Fable 5.1 ma producono meno blocchi non necessari" — quindi se il lavoro benigno di sicurezza o scienze della vita faceva scattare i classificatori sulla 5.1, il tasso di falsi positivi dovrebbe essere più basso prima ancora che tu valuti di chiedere l'accesso.

In pratica: i due leggono i blocchi di thinking l'uno dell'altro, quindi spostare una conversazione fra loro ne mantiene intatto il ragionamento. Se un rifiuto blocca un lavoro legittimo, la strada è un programma di verifica, non un aggiramento col prompt.

## Rifiuti e fallback

Fable 5.2 rifiuta in-band: **HTTP 200** con `stop_reason: "refusal"` e un oggetto `stop_details` che indica la categoria. Cinque categorie:

- `cyber` — potrebbe abilitare lo sviluppo di malware o exploit
- `bio` — potrebbe abilitare danni biologici, come metodi di laboratorio pericolosi
- `frontier_llm` — potrebbe aiutare a sviluppare modelli AI concorrenti
- `reasoning_extraction` — chiede al modello di riprodurre il proprio ragionamento interno nel testo della risposta
- `general_harms` — un'altra area della policy d'uso

Due note operative. I modelli di fallback lato server consentiti per Fable 5.2 sono **Opus 4.8 e Opus 5** — entrambi, secondo il breaking change #2, non possono leggere i blocchi di thinking di Fable 5.2, quindi un fallback perde il ragionamento della conversazione. E **`reasoning_extraction` non ha un fallback raccomandato**, quindi quel rifiuto resta; la soluzione è smettere di chiedere il ragionamento nel testo della risposta e leggerlo invece dai blocchi di thinking con `display: "summarized"`.

## Una contraddizione tra fonti, riportata e non risolta

Al 10 novembre 2026 due pagine ufficiali di Anthropic descrivono in modo diverso lo stato di Fable 5.1. La [panoramica dei modelli](https://platform.claude.com/docs/en/models/overview) elenca `claude-fable-5-1` sotto **"Legacy models (still available)"**. La tabella di stato delle [deprecazioni dei modelli](https://platform.claude.com/docs/en/about-claude/model-deprecations) lo elenca come **Active**, senza alcuna deprecazione annunciata e con una soglia di ritiro non prima del 1° settembre 2027.

Sono conciliabili più che in conflitto, e la distinzione è utile: nel vocabolario del ciclo di vita di Anthropic, **Legacy** significa "non riceverà più aggiornamenti e potrebbe essere deprecato in futuro" — un gradino prima di **Deprecated**, che è quando viene assegnata una data di ritiro. Il raggruppamento della panoramica è il segnale editoriale; la tabella di stato è quella contrattuale. Anthropic si impegna a dare almeno **60 giorni di preavviso** prima di ritirare un modello rilasciato pubblicamente, e quel conto parte dalla pubblicazione dell'avviso.

In ogni caso non c'è motivo di indugiare: Fable 5.1 ora costa **più** del suo successore. Tracciamento completo del ciclo di vita: [Deprecation & Migration Watch](/docs/whats-new/deprecations).

## Errori comuni

- **Considerare "funziona su Fable 5.1" una prova che la gestione della cronologia sia corretta.** Può dimostrare soltanto che il tuo account è precedente al 31 agosto 2026. È il modo più probabile in cui questa migrazione ti morde.
- **Usare `"drop_block"` come soluzione invece che come rimedio provvisorio.** Trasforma un 400 in un costo: il thinking scartato significa che il modello ragiona di nuovo.
- **Riportare un livello di effort.** La stessa parola indica una quantità diversa di thinking su un modello diverso. Rifai lo sweep.
- **Lasciare nel prompt righe "rispondi direttamente".** Non funzionano più da `medium` in su, e costano comunque token. Abbassa invece l'effort.
- **Aggiungere la frase sulla proprietà del codice a un codebase che è dell'utente.** Circa quintuplica l'unificazione dei duplicati, alza i token di output di ~1,5x e cambia il comportamento di funzionalità esistenti in un tentativo su sei-dieci. Va bene per alcuni repo e sbagliato per la maggior parte del lavoro per clienti.
- **Cambiare il `model` dell'advisor a metà conversazione.** Modifica `tools`, quindi fa scattare il controllo del prefisso. Solo nuove conversazioni.
- **Leggere il riassunto finale del modello come un diff completo.** I test di Anthropic stessa dicono che le modifiche piccole vengono omesse.
- **Aggiornare sulla base della tabella di lancio.** Due righe vanno contro Fable 5.2, una delle quali a favore di Opus 5.5 a meno della metà del prezzo.

## Verifica te stesso

<Quiz questions={[
  {
    q: "Il tuo agent gira su Fable 5.1 da due mesi senza errori e a ogni richiesta inietta un promemoria di stato nel turno utente precedente. Cambi l'ID in claude-fable-5-2 e iniziano i 400. Cos'è successo?",
    options: [
      "Fable 5.2 ha eliminato del tutto il supporto alle modifiche dei turni utente, senza alternative",
      "Il controllo del prefisso dei blocchi di thinking, che su Fable 5.1 dava errore solo sugli account creati il 31 agosto 2026 o dopo, su Fable 5.2 si applica a ogni account",
      "L'ID del modello è sbagliato — richiede un suffisso con la data",
      "I promemoria ora vanno inviati come risultati di strumento"
    ],
    answer: 1,
    explain: "È il breaking change #1 e il fallimento di migrazione più probabile. Modificare qualunque cosa prima di un blocco di thinking lo invalida; su Fable 5.1 il 400 risultante scattava solo sugli account più recenti, quindi gli account più vecchi facevano girare senza problemi un bug latente. La soluzione duratura è una cronologia append-only (messaggi di sistema limitati al turno per i promemoria di singolo turno); il rimedio provvisorio è prefix_mismatch_behavior: \"drop_block\", che costa token di output perché il modello ragiona di nuovo."
  },
  {
    q: "Usi un router che manda i turni difficili a Fable 5.2 e quelli economici a Opus 5.5 nella stessa conversazione. Che succede al ragionamento?",
    options: [
      "Niente — Opus 5.5 è più recente di Fable 5.1, quindi legge i blocchi di Fable 5.2",
      "La richiesta fallisce con un 400 finché non abiliti un header beta",
      "Opus 5.5 scarta i blocchi di thinking di Fable 5.2 prima che il modello li veda; la richiesta va a buon fine, lo scarto non è fatturato ed è silenzioso a meno che tu non invii thinking-binding-controls-2026-08-01 e legga input_transformations",
      "I blocchi vengono convertiti in blocchi di testo e fatturati come input"
    ],
    answer: 2,
    explain: "La preservazione è a senso unico. Fable 5.2 legge i blocchi dei modelli precedenti; solo Fable 5.2 e Mythos 5.2 leggono i suoi. Opus 5.5 e Fable 5.1 li scartano entrambi — come Opus 4.8 e Opus 5, che sono i modelli di fallback di Fable 5.2 stesso, quindi anche un fallback per rifiuto perde il ragionamento."
  },
  {
    q: "Nella tabella di lancio di Anthropic, quale riga argomenta CONTRO il passaggio del lavoro di conoscenza da Opus 5.5 a Fable 5.2?",
    options: [
      "FrontierSWE v2, dove Opus 5.5 ottiene un punteggio più alto",
      "L'Elo di AA-Briefcase v1.1, dove Opus 5.5 ottiene 1800 contro i 1785 di Fable 5.2 — anche se Fable 5.2 vince il punteggio rubric dello stesso benchmark",
      "Humanity's Last Exam, dove Fable 5.2 perde contro GPT-6 Astra",
      "RoboDojo Sim, dove il guadagno è il più piccolo"
    ],
    answer: 1,
    explain: "Il punteggio rubric e l'Elo testa a testa dello stesso benchmark discordano, e l'Elo favorisce Opus 5.5 a meno della metà del prezzo. Anche Gemini 4 Carbon batte Fable 5.2 su AutomationBench (53,9% contro 51,4%). Inoltre, la riga FrontierCode 2.0 in evidenza confronta Fable 5.2 a xhigh con Fable 5.1 a medium — etichettato da Anthropic, ignorato dalla maggior parte della copertura."
  },
  {
    q: "Il tuo system prompt per un codebase cliente dice 'Niente refactor, rinomine o pulizie collaterali.' Un collega aggiunge la frase sulla proprietà del codice per migliorare la struttura. Cosa devi aspettarti?",
    options: [
      "Niente — il limite di ambito precedente annulla la frase sulla proprietà",
      "Un 400, perché le due istruzioni sono in conflitto",
      "Il modello unifica comunque il codice duplicato in circa un terzo dei tentativi, usa ~1,5x i token di output e può cambiare il comportamento di funzionalità esistenti in un tentativo su sei-dieci",
      "La frase sulla proprietà vale solo se è la prima riga del prompt"
    ],
    answer: 2,
    explain: "Anthropic ha testato esattamente questa combinazione: il limite di ambito non annulla la frase sulla proprietà. Nel lavoro per clienti in cui il codice è dell'utente e vuole modifiche minime, lascia fuori la frase invece di provare a recintarla — e rivedi il diff invece del riassunto finale del modello, che omette le modifiche piccole."
  }
]} />

## Termini da ricordare

<Flashcards cards={[
  {front: "Prefix check", back: "Il test dell'API su se qualcosa prima di un blocco di thinking è cambiato da quando il modello lo ha prodotto — system, tools o un messaggio precedente. Su Fable 5.2 una violazione restituisce 400 'The block is bound to a different conversation' su OGNI account; su Fable 5.1 solo sugli account creati il 31 agosto 2026 o dopo."},
  {front: "prefix_mismatch_behavior: \"drop_block\"", back: "Impostazione beta (thinking-binding-controls-2026-08-01) che scarta i blocchi di thinking non validi e va a buon fine invece di dare errore, segnalando ciascuno in un array input_transformations di primo livello. Un rimedio provvisorio: il thinking scartato significa che il modello ragiona di nuovo, aumentando i token di output."},
  {front: "computer_toolset_20260801", back: "Il toolset di computer use richiesto da Fable 5.2. Il precedente strumento computer_20251124 restituisce 400 su ogni piattaforma tranne Amazon Bedrock, dove funziona ancora."},
  {front: "Regola di abbinamento dell'advisor", back: "Un executor Fable 5.2 o Mythos 5.2 accetta solo claude-fable-5-2 o claude-mythos-5-2 come advisor. Cambiare il model dell'advisor modifica tools, quindi fallo in nuove conversazioni. Ogni executor accetta un advisor Fable 5.2."},
  {front: "Fast mode", back: "Modalità opzionale di Fable 5.2 / Mythos 5.2: fino a 2,5x i token di output al secondo a esattamente 2x il listino ($16 in / $80 out). Su Microsoft Foundry è un ID modello separato, claude-fable-5-2-fast."},
  {front: "Fable vs Mythos", back: "Anthropic: 'lo stesso modello di base'. Fable porta le protezioni cyber e biologia che gli permettono di essere rilasciato a tutti; Mythos è la build senza, per organizzazioni verificate tramite programmi come il Cyber Verification Program. Leggono i blocchi di thinking l'uno dell'altro."},
  {front: "reasoning_extraction", back: "L'unica categoria di rifiuto di Fable 5.2 senza fallback lato server raccomandato, quindi il rifiuto resta. Scatta chiedendo al modello di riprodurre il proprio ragionamento interno nel testo della risposta; leggi invece i blocchi di thinking con display: \"summarized\"."},
  {front: "Legacy vs Deprecated", back: "Nel vocabolario del ciclo di vita di Anthropic: Legacy = non riceve più aggiornamenti, potrebbe essere deprecato in seguito. Deprecated = sconsigliato, con una data di ritiro assegnata. Fable 5.1 è attualmente elencato come Legacy nella panoramica dei modelli ma Active nella tabella di stato."},
]} />

## Punti chiave

<Callout type="takeaways" items={[
  "L'estensione del controllo del prefisso a ogni account è il rischio principale, non una funzionalità: il codice che modifica la cronologia della conversazione girava senza errori su un account più vecchio con Fable 5.1 e restituisce un 400 dopo il cambio. Testalo anche se non hai mai visto l'errore.",
  "È il primo point release di punta di Claude più economico del predecessore — $8/$40 contro $10/$50, con il moltiplicatore delle letture dalla cache invariato a 0,025x. Non c'è alcun argomento di prezzo per restare su Fable 5.1.",
  "Non è comunque l'opzione economica: Opus 5.5 costa la metà e resta il punto di partenza raccomandato da Anthropic stessa. Passa a Fable 5.2 quando le tue valutazioni su Opus a effort più alto non bastano.",
  "Elimina prima di aggiungere: 'rispondi direttamente senza ragionare' non funziona più da effort medium in su, un budget di token scritto nel prompt ha aumentato il costo a parità di prestazioni, e le righe 'tratta quella risposta come conclusa' di Opus 5.5 rendono il modello molto meno propenso a segnalare i propri errori precedenti.",
  "La frase sulla proprietà del codice è la singola riga a più alta leva della release e un vero compromesso: l'unificazione dei duplicati passa da meno di un decimo dei tentativi a circa la metà, a ~1,5x i token di output e con cambi di comportamento non richiesti in un tentativo su sei-dieci. Giusta per il tuo repo, sbagliata per la maggior parte del lavoro per clienti.",
  "Leggi la tabella di lancio con le sue note: la riga FrontierCode 2.0 in evidenza confronta xhigh con medium, Gemini 4 Carbon vince AutomationBench e Opus 5.5 vince l'Elo di AA-Briefcase a meno della metà del prezzo.",
]} />

## Prossimi passi

- [Claude Fable 5.1: cosa è cambiato e come migrare](/docs/models/fable-5-1-field-guide) — la release che questa sostituisce, e da dove arrivano le regole su thinking sempre attivo e `tool_choice` forzato
- [Claude Opus 5.5: la guida pratica](/docs/models/opus-5-5-field-guide) — il modello da cui Anthropic ti dice ancora di partire, alla metà del prezzo
- [Come leggere un benchmark AI senza farsi ingannare](/docs/models/reading-ai-benchmarks) — la checklist dietro la lettura della tabella di lancio in questa pagina
