# Il livello di memoria di terze parti: come funziona davvero claude-mem

> Source: https://derob98.github.io/ailmanac/it/docs/models/agent-memory-layer-claude-mem · AILmanac (CC BY 4.0) · last verified 2026-10-26

claude-mem ha 103.000 stelle su GitHub e risolve la lamentela di ogni utente di agenti di programmazione: l'agente dimentica tutto quando la sessione finisce. Sotto il cofano è un secondo modello che gira in un demone in background e legge ogni chiamata a strumenti che fai — e nel percorso ospitato il suo stesso dataset dei costi associa quell'osservatore a un modello DeepSeek, non a Claude. I sei hook, il contratto dei codici di uscita che può bloccare la tua sessione, il richiamo a tre livelli che fa tornare i conti sui token, dove atterrano i dati, chi paga la compressione e una checklist per valutare qualsiasi livello di memoria prima di installarlo.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Capire cosa significa 'memoria' in questa classe di strumenti: non una trascrizione salvata, ma osservazioni estratte da un secondo modello che guarda le tue chiamate a strumenti", "Imparare il ciclo di vita a sei hook e il contratto dei codici di uscita che decide se un livello di memoria rotto degrada in silenzio o blocca la tua sessione di programmazione", "Vedere il dettaglio che quasi nessuno controlla: l'osservatore è un modello separato su un provider che scegli tu, e il dataset dei costi di claude-mem associa il suo osservatore ospitato a un modello DeepSeek — il contenuto della tua sessione non va necessariamente a Claude", "Seguire il richiamo a tre livelli che fa funzionare l'aritmetica dei token — un riscontro d'indice da ~50-100 token prima di un recupero di dettaglio da ~500-1.000 token — e perché quell'ordine è l'intero progetto", "Sapere dove atterrano i dati: SQLite con FTS5, un archivio vettoriale Chroma che indicizza separatamente ogni fatto estratto, e un worker sulla porta 37700 + (uid % 100)", "Capire chi paga la compressione, e perché esista un livello ospitato da 30 $/mese", "Evitare cinque modalità di guasto documentate, a partire da quella in cui i token di ragionamento dell'osservatore hanno mangiato il budget di output della sessione", "Applicare una checklist di valutazione in otto punti a qualsiasi livello di memoria per agenti prima di lasciargli leggere ogni file che il tuo agente tocca"]} />

Ogni utente di agenti di programmazione si scontra con lo stesso muro. Passi un'ora a stabilire il contesto — quale modulo possiede cosa, perché l'approccio precedente è fallito, l'unica trappola nella build — poi la sessione finisce e tutto sparisce. Domani lo spieghi di nuovo.

**claude-mem** è di gran lunga la risposta più popolare a quel problema: **103.252 stelle** su GitHub al 26 ottobre 2026, Apache-2.0, e con un ritmo di rilascio tale da passare da v13.38 a v15.2.1 nei dodici giorni precedenti la scrittura di questa pagina. Funziona con Claude Code, Cursor, Codex, OpenCode, Antigravity, Claude Desktop e molti altri.

Questa pagina non è una guida all'installazione — il README la fa bene. È ciò che il README non fa: spiegare cosa sia *davvero* lo strumento dal punto di vista architetturale, quanto costa, cosa legge del tuo codice e cosa si rompe. Gran parte di ciò che segue viene dalla cartella `docs/` del repository stesso, che è dettagliata, onesta e quasi certamente non letta dalla grande maggioranza di quei 103.000 che hanno messo la stella.

<VerifyNote lastVerified="2026-10-26" source="Primary: the thedotmack/claude-mem repository — README.md, docs/architecture-overview.md (hook table and timeouts, data flow, worker port formula, SQLite schema, Chroma document naming, dedup hash, generator restart backoff, the exit-0/exit-2 degradation contract, the two session-id types), docs/security.md (cmem_ key prefix, SHA-256 storage, the local-dev bypass requiring two env vars, BullMQ/Redis notes), docs/ip-boundary.md (the open-core split), docs/expense-pricing/README.md (the cmem-observer to deepseek/deepseek-v4-flash mapping on/after 2026-08-08, and the ~98%-input working shape), and the GitHub release notes for v15.0.0, v15.0.2, v15.1.0, v15.2.0 and v15.2.1. Star count (103,252), licence (Apache-2.0), creation date (2025-08-31) and last push (2026-10-26) verified via the GitHub API on 2026-10-26. Pricing ($30/month after a 30-day trial) and the 'moves memory generation off your primary agent's subscription' framing are from cmem.ai. This project ships multiple releases per week and renames features between majors — treat every specific port, flag, command, default and price here as a snapshot, and check the current release notes before relying on one. The architecture-overview hook table lists Setup plus five lifecycle events; the README describes six hooks including UserPromptSubmit and Stop separately. Where the two disagree, this page follows architecture-overview.md and says so." />

## Ciò che memorizza non è la tua trascrizione

Il primo modello mentale da scartare è "salva le mie chat". Non lo fa. L'unità di memorizzazione è un'**osservazione**: una nota strutturata con un tipo, un titolo e una narrazione, estratta *da un modello* da ciò che il tuo agente ha fatto.

Il flusso, dal diagramma del flusso di dati del repository stesso:

1. Invii un prompt. Il gestore `session-init` registra la sessione e chiede al worker il contesto semanticamente rilevante.
2. Il tuo agente usa uno strumento. L'hook `PostToolUse` invia quell'uso dello strumento al worker, che lo accoda.
3. L'**SDKAgent** del worker — una sessione di modello, in esecuzione in un demone in background — legge la coda e produce osservazioni e riepiloghi.
4. Questi finiscono in SQLite, vengono sincronizzati in un archivio vettoriale Chroma e trasmessi a un'interfaccia locale tramite server-sent events.

Quindi ciò che osserva il tuo lavoro è un **secondo modello**, e ciò che legge è **ogni chiamata a strumenti**: letture di file, scritture di file, output di comandi, risultati di ricerca. È il prezzo d'ingresso per l'intera categoria di strumenti, e vale la pena dirlo chiaramente prima di tutto il resto.

<Callout type="key" items={["Un livello di memoria non è una funzione di archiviazione. È un secondo modello con un abbonamento permanente a tutto ciò che il tuo primo modello tocca. Valutalo come valuteresti l'aggiunta di qualsiasi modello alla tua pipeline — cosa legge, dove lo invia, chi paga i suoi token e cosa succede quando fallisce."]} />

## I sei hook, e l'unico contratto che conta operativamente

claude-mem si installa come un insieme di hook del ciclo di vita, ciascuno invocato come un singolo comando senza shell della forma `claude-mem hook claude-code <event>`. Secondo `docs/architecture-overview.md`:

| Evento | Gestore | Cosa fa | Timeout |
|---|---|---|---|
| Setup | `version-check.js` | Controllo del marcatore di versione sotto i 100 ms; stampa un suggerimento a eseguire `npx claude-mem repair` in caso di discrepanza | 60s |
| SessionStart | avvio worker + contesto | Avvia il servizio worker e inietta il contesto precedente | 60s |
| UserPromptSubmit | `session-init` | Registra la sessione, avvia l'agente SDK, iniezione semantica | 60s |
| PostToolUse | `observation` | Cattura l'uso degli strumenti e lo accoda nel worker | 120s |
| Summary | `summarize` | Richiede un riepilogo di sessione all'agente SDK | 120s |
| SessionEnd | `session-complete` | Termina la sessione e svuota i messaggi in sospeso | 30s |

Ora la parte che conterà alle 2 di notte. L'orchestratore degli hook implementa un esplicito **contratto di degradazione**:

- **Errori di trasporto** — `ECONNREFUSED`, timeout, 5xx dal worker — **exit 0**. Non bloccanti. Il worker spento non blocca mai la tua sessione di programmazione.
- **Bug del client** — 4xx, `TypeError`, `ReferenceError` — **exit 2**. Bloccanti, con la motivazione dichiarata che indicano un bug da correggere.

È un progetto difendibile, e ha una conseguenza da interiorizzare: **"il demone di memoria è morto" è innocuo, ma "il demone di memoria risponde 400" no.** Una richiesta malformata, una deriva dello schema dopo un aggiornamento parziale o una chiave scaduta che si manifesta come 4xx rientrano nella categoria che lo strumento ha scelto deliberatamente di rendere rumorosa. È anche il motivo per cui l'hook Setup insiste su `npx claude-mem repair` dopo un aggiornamento esterno del plugin — un'installazione con versioni sfasate è esattamente il modo per arrivare al ramo bloccante.

<Callout type="warning" items={["Se una sessione di programmazione inizia a fallire subito dopo aver aggiornato un plugin, controlla il tuo livello di memoria prima di fare il debug del tuo agente. Il contratto pubblicato qui è che i guasti di trasporto degradano in silenzio e i guasti lato client bloccano — quindi il sintomo di un'installazione aggiornata a metà è una sessione che non parte, non una sessione senza memoria."]} />

## Il richiamo a tre livelli è la vera idea

Qualsiasi sistema di memoria può archiviare cose. La parte difficile è un recupero che non costi più contesto di quanto ne risparmi — scarica venti note ricordate a ogni avvio di sessione e hai peggiorato il problema.

La risposta di claude-mem, distribuita come predefinita in **v15.0.0** il 20 ottobre 2026 con il nome *Smart memory search*, è una ricerca in tre passi su cui l'agente ragiona, anziché un singolo recupero:

<Steps items={[
  {title: "Cerca nell'indice compatto", body: "Una query full-text (SQLite FTS5, facoltativamente ibridata con vettori Chroma) restituisce un elenco compatto di risultati con ID di osservazione. Il README li stima in circa 50-100 token per risultato — abbastanza per valutare la rilevanza, non abbastanza per essere utili da soli."},
  {title: "Esamina la timeline attorno a ciò che sembra rilevante", body: "Dato un ID di osservazione promettente, recupera il contesto cronologico attorno ad esso. È il passo che distingue 'una nota che corrisponde alle tue parole chiave' da 'la nota che corrisponde, più ciò che è successo subito prima e dopo'."},
  {title: "Recupera i dettagli completi solo per gli ID selezionati", body: "Solo ora il testo completo dell'osservazione entra nel contesto, a circa 500-1.000 token ciascuna. L'affermazione del README per questo ordine è un risparmio di token di circa 10x rispetto al recupero dei dettagli in anticipo."}
]} />

I tre passi sono esposti all'agente come strumenti MCP — `search(query, type, date, project, limit)`, `timeline(observation_id, query)` e `get_observations(ids[])` — ed è per questo che l'agente può ragionare tra l'uno e l'altro anziché avere un recupero a pipeline fissa.

La lezione trasferibile qui non ha nulla a che fare con claude-mem. **Filtra su rappresentazioni economiche, poi paga il dettaglio solo per le sopravvissute.** È lo stesso schema del leggere una pagina di risultati prima di aprire una scheda, lo stesso di un indice di database prima del recupero di una riga, ed è la forma corretta per qualsiasi recupero che aggiungi a un agente. Se stai progettando il tuo, vedi [context engineering](/docs/frontiers/context-engineering) per l'inquadramento generale e [come funziona davvero la memoria degli agenti](/docs/frontiers/agent-memory-architectures) per la tassonomia in cui si colloca questo strumento.

## Dove vivono davvero i tuoi dati

Tutto ciò che è locale atterra sotto `~/.claude-mem/`. Due archivi, con compiti distinti:

**SQLite** (`claude-mem.db`), con FTS5 per la ricerca full-text:

| Tabella | Scopo |
|---|---|
| `sdk_sessions` | Ciclo di vita della sessione e mappatura tra i due ID di sessione |
| `observations` | Le note estratte: tipo, titolo, narrazione, hash del contenuto |
| `session_summaries` | Per sessione: richiesta / appreso / completato |
| `user_prompts` | La cronologia dei tuoi prompt |
| `pending_messages` | La coda di lavoro per sessione |
| `observation_feedback` | Segnali d'uso per osservazione |

**ChromaDB** (`chroma.sqlite3`) per gli embedding vettoriali, a cui si accede tramite `chroma-mcp` su stdio. Il dettaglio da notare: **ogni osservazione produce più documenti, non uno** — `obs_{id}_narrative` per il testo principale più `obs_{id}_fact_0`, `obs_{id}_fact_1` e così via per ogni fatto estratto. I fatti sono incorporati singolarmente, ed è per questo che una query su un dettaglio specifico può recuperare un'osservazione il cui riepilogo complessivo riguarda altro.

Il worker è un demone Express su una **porta per utente: `37700 + (uid % 100)`**. Se hai visto `localhost:37777` nelle note di rilascio e nella documentazione del progetto, quella è la porta di un uid, non una costante — una piccola cosa che ti costerà dieci minuti esattamente una volta.

<Callout type="note" items={["Il worker apre un'API HTTP locale e serve da essa un'interfaccia. docs/security.md è esplicito: la beta del server usa per impostazione predefinita l'autenticazione con chiave API, le chiavi hanno il prefisso cmem_ e vengono mostrate una sola volta con solo un hash SHA-256 memorizzato, e il bypass di sviluppo su loopback richiede due variabili d'ambiente impostate insieme (CLAUDE_MEM_AUTH_MODE=local-dev e CLAUDE_MEM_ALLOW_LOCAL_DEV_BYPASS=1) e non deve essere usato dietro un reverse proxy né su un indirizzo di bind raggiungibile pubblicamente. Consideralo una regola ferrea: questo demone detiene un indice ricercabile di tutto ciò che i tuoi agenti leggono."]} />

## Chi paga la compressione — e quale modello legge il tuo codice

Ecco il fatto che più mi ha sorpreso, e il motivo per cui questa pagina esiste.

L'osservatore è una **chiamata a modello separata**, e ne scegli il provider al momento dell'installazione: `npx claude-mem install --provider [host|openrouter|gemini|anthropic]`. Quattro opzioni, quattro risposte diverse a "dove va il contenuto della mia sessione".

Il dataset di contabilità dei costi del repository stesso, in `docs/expense-pricing/README.md`, documenta come valorizzare il traffico dell'osservatore — e così facendo documenta cosa sia l'osservatore ospitato. La sua ricetta di join dice di risolvere l'id di modello `cmem-observer` in **`deepseek/deepseek-v4-flash`** dal 2026-08-08 in poi, e in `deepseek/deepseek-chat` prima di allora.

C'è un'apparente contraddizione da chiarire, perché la incontrerai leggendo il repo da te: `docs/architecture-overview.md` etichetta il componente osservatore `SDKAgent (Claude Agent SDK)`, il che suggerisce che debba essere Claude. Entrambe le cose sono vere insieme. L'Agent SDK è l'*impalcatura* — il ciclo che gestisce la sessione e interpreta le risposte — e può essere puntato a un endpoint non Anthropic, che è esattamente ciò che implicano le note di rilascio di v15.0.2 quando descrivono richieste dell'osservatore verso "OpenRouter, il gateway cmem.ai ed endpoint compatibili con OpenAI". L'SDK è il client; il flag del provider decide chi risponde.

Leggi con attenzione anche la mappatura DeepSeek, perché è facile sovrastimarla o sottostimarla. Non significa che il progetto nasconda qualcosa — il provider è un flag di installazione documentato e il dataset è pubblicato nel repo aperto. Significa però che **uno strumento chiamato `claude-mem`, nel suo percorso ospitato, ha valorizzato il proprio osservatore come un modello DeepSeek**, e che se la tua ipotesi era "gira su Claude per via del nome", l'ipotesi era sbagliata. Se il tuo codice non può andare a un provider di inferenza di terze parti, `--provider anthropic` o un endpoint self-hosted compatibile con OpenAI è la scelta che devi fare deliberatamente.

Lo stesso dataset ti dice anche la *forma* di quel traffico: le note del progetto trattano l'uso dell'osservatore come circa **98% di token di input**, esattamente ciò che ti aspetteresti da un processo il cui compito è leggere l'output degli strumenti ed emettere brevi note. Molto prompt, poco output.

E questa è l'intera economia del livello ospitato. Il prodotto a pagamento, **CMEM Pro**, è descritto su cmem.ai come osservazione ospitata e sincronizzazione cloud a **30 $/mese dopo una prova gratuita di 30 giorni**, con la proposta che l'osservazione ospitata *sposti la generazione della memoria fuori dall'abbonamento del tuo agente principale*. In altre parole: per impostazione predefinita, qualcuno deve pagare un secondo modello perché legga tutto ciò che fa il tuo primo modello. O è il tuo account di provider e i limiti del tuo piano, o sono 30 $/mese a qualcun altro. Il sito è anche attento a dire che l'effetto sull'uso dei token dipende dal tuo carico di lavoro e dal provider, e che Pro non cambia prezzo o limiti di un altro abbonamento.

<Callout type="key" items={["Qualsiasi livello di memoria ha un secondo conto nascosto: il costo del modello che scrive i ricordi. Prima di installarne uno, rispondi a tre domande. Quale modello fa l'estrazione? Il conto di chi la paga? E il contenuto che legge può andare lì? Per claude-mem le risposte sono configurabili, documentate e, per impostazione predefinita, non quelle che il nome suggerisce."]} />

Anche la ripartizione delle licenze è pubblicata, in `docs/ip-boundary.md`, ed è un confine open-core pulito da conoscere se pensi di costruirci sopra: Apache-2.0 copre il motore di memoria, il server, la CLI, gli SDK, gli schemi REST, gli strumenti MCP, gli adattatori per Claude Code e per agenti generici e gli adattatori di archiviazione. Le aree commerciali riservate includono Magic Recall ospitato, la sincronizzazione di memoria di team/organizzazione, la dashboard admin, SSO/SAML/SCIM, RBAC enterprise e UI di audit, il motore DLP/policy, le valutazioni gestite e i connettori privati. Quindi il motore è davvero tuo da incorporare; la superficie per team ed enterprise no.

## Cinque modalità di guasto documentate

Provengono tutte dalle note di rilascio e dalla documentazione architetturale del progetto, che è la migliore fonte possibile per un elenco di trappole.

**1. I token di ragionamento dell'osservatore hanno mangiato il budget di output della sessione.** Corretto in **v15.0.2** (23 ottobre 2026): le richieste dell'osservatore a OpenRouter, al gateway cmem.ai e agli endpoint compatibili con OpenAI ora disattivano il ragionamento per impostazione predefinita, perché i token di ragionamento riempivano il budget di output lasciando a una sessione nulla da emettere. È il bug più istruttivo dell'elenco — è una pura conseguenza dell'aver messo un modello di ragionamento in un ruolo di estrazione con budget limitato, e si ripresenterà in tutto ciò che costruisci allo stesso modo.

**2. Due ID di sessione non intercambiabili.** `contentSessionId` proviene dall'host ed è invariante per la sessione; `memorySessionId` proviene dall'agente SDK e **cambia a ogni riavvio del worker**. Il documento di architettura definisce la conversione tra i due critica per i vincoli di chiave esterna. Se interroghi direttamente l'archivio SQLite, questa è la prima cosa che ti confonderà.

**3. La deduplicazione ha una finestra di 30 secondi.** L'hash del contenuto è `SHA256(memory_session_id + title + narrative)` troncato a 16 caratteri esadecimali, e una ripetizione entro 30 secondi restituisce l'ID esistente anziché inserire. Utile, e anche un motivo per cui osservazioni dall'aspetto identico possono legittimamente coesistere se sono arrivate a 31 secondi di distanza.

**4. I crash del generatore riprovano tre volte, poi si fermano.** Il backoff è 1s, 2s, 4s; dopo più di tre riavvii consecutivi il worker smette di riprovare e lascia terminare l'iteratore. Il contatore si azzera quando il generatore completa il lavoro in modo naturale. I messaggi in sospeso sopravvivono ai riavvii e vengono eliminati dal percorso del parser alla successiva risposta valida — quindi un osservatore che va in crash di continuo significa una coda che cresce in silenzio, non input perso.

**5. L'impronta dell'installazione è più grande di `npm install`.** `npx claude-mem install` configura **Bun e uv a livello globale**, esegue `bun install` nella cache del plugin e scrive un marcatore di versione. Il README è esplicito: `npm install -g` installa solo l'SDK e devi usare `npx claude-mem install`. Due runtime di gestori di pacchetti installati globalmente da uno strumento di memoria sono una scelta ingegneristica ragionevole e anche una superficie di supply chain che devi sapere di aver accettato — [verificare le skill degli agenti](/docs/security/vetting-agent-skills) è la disciplina generale.

<Callout type="warning" items={["La velocità di rilascio taglia in entrambe le direzioni. Tra il 13 e il 25 ottobre 2026 questo progetto ha rilasciato da v13.38 a v15.2.1 — due salti di versione maggiore in dodici giorni, con funzioni rinominate nel mezzo (il viewer, la modalità di richiamo, le viste di lavoro). Uno strumento così attivo corregge i bug in fretta e rompe in fretta anche le tue note. Fissa una versione se lo documenti per un team e leggi le note di rilascio prima di aggiornare, non dopo."]} />

## Cosa lascia la tua macchina, e l'unico controllo da conoscere

`docs/security.md` e il README insieme offrono un quadro utilizzabile:

- Il motore locale memorizza la memoria sulla tua macchina, sotto `~/.claude-mem/`.
- La sincronizzazione cloud è opt-in; se la abiliti, anche i dati sincronizzati sono memorizzati da CMEM. L'indicazione del sito stesso è di leggere l'informativa sulla privacy prima di connettersi.
- `CLAUDE_MEM_ONLINE_OPTIN=false` salta il flusso di accesso.
- Il contenuto racchiuso tra **tag `<private>` è escluso del tutto dalla memorizzazione** — non scritto nell'archivio delle osservazioni, né nella memoria di profilo o di progetto.

Quest'ultimo è il controllo più da ricordare, perché è l'unico in banda. Tutto il resto è una decisione di configurazione che prendi una volta all'installazione; `<private>` è ciò a cui puoi ricorrere a sessione in corso quando un segreto, il nome di un cliente o un hostname di produzione sta per passare in una chiamata a strumenti.

È anche, per costruzione, un controllo che devi ricordarti di usare. Per la domanda più ampia su cosa un agente spedisce fuori dalla tua macchina nel normale svolgimento del suo lavoro, vedi [cosa carica il tuo agente](/docs/security/what-your-agent-uploads).

<PromptCard title="Ispeziona cosa ha registrato di te un livello di memoria">
{`# Where the local stores live, and how big they have got
du -sh ~/.claude-mem/ 2>/dev/null
ls -la ~/.claude-mem/

# Which worker port is yours (the formula, not the number in the docs)
python3 -c "import os; print(37700 + (os.getuid() % 100))"

# Read the observation store directly — it is plain SQLite
sqlite3 ~/.claude-mem/claude-mem.db ".tables"
sqlite3 ~/.claude-mem/claude-mem.db \\
  "SELECT type, title, substr(narrative,1,90) FROM observations
   ORDER BY rowid DESC LIMIT 15;"

# Which model actually wrote your memories (the field the cost docs join on)
sqlite3 ~/.claude-mem/claude-mem.db \\
  "SELECT generated_by_model, COUNT(*) FROM observations
   GROUP BY 1 ORDER BY 2 DESC;"

# And your own prompt history, which is stored separately
sqlite3 ~/.claude-mem/claude-mem.db \\
  "SELECT COUNT(*) FROM user_prompts;"`}
</PromptCard>

<Callout type="note" items={["I nomi delle colonne vengono dalla tabella dello schema in docs/architecture-overview.md e dalla ricetta di join in docs/expense-pricing/README.md, che nomina generated_by_model e created_at sulle righe delle osservazioni. Un progetto che rilascia due versioni maggiori in dodici giorni può rinominarle — se una query dà errore, esegui .schema observations e adatta. Lo scopo dell'esercizio non è l'SQL esatto; è che puoi e devi leggere ciò che un livello di memoria ha scritto su di te, perché è un file SQLite locale e nulla te lo impedisce."]} />

## Valutare qualsiasi livello di memoria, non solo questo

Questa categoria continuerà a crescere, e le domande si generalizzano. Falle prima di installare il prossimo.

<Steps items={[
  {title: "Qual è l'unità di memorizzazione?", body: "Una trascrizione grezza, una nota estratta da un modello o un artefatto di conoscenza compilato? L'estrazione significa che il giudizio di un secondo modello si interpone tra ciò che è successo e ciò che ricordi — che di solito è ciò che vuoi, ed è anche un punto in cui gli errori possono diventare permanenti."},
  {title: "Quale modello fa l'estrazione, e di chi è il conto?", body: "Chiedilo esplicitamente. claude-mem ne fa un flag con quattro valori e documenta il suo osservatore ospitato come un modello DeepSeek nel proprio dataset dei costi. Se uno strumento non te lo dice, quella è la tua risposta."},
  {title: "Il recupero viene filtrato prima di essere prelevato?", body: "Un livello di memoria che inietta tutto ciò che ha all'avvio della sessione è una tassa sul contesto, non un risparmio di contesto. Cerca un passo d'indice economico prima di un passo di dettaglio, e verifica quanto costa in token la voce d'indice."},
  {title: "Cosa succede quando fallisce?", body: "Trova il contratto di degradazione. claude-mem ne pubblica uno: gli errori di trasporto escono con 0 e non bloccano mai, gli errori del client escono con 2 e bloccano. Uno strumento senza un contratto dichiarato finirà per bloccare la tua sessione per una ragione che non vedi."},
  {title: "Puoi leggere ed eliminare tu stesso l'archivio?", body: "Un file SQLite locale che puoi interrogare e cancellare con rm è una postura di privacy molto diversa da un indice cloud opaco. Controlla sia il formato locale sia se la sincronizzazione è opt-in o opt-out."},
  {title: "Esiste un controllo di esclusione in banda?", body: "Ti servirà impedire che una cosa specifica venga registrata, a sessione in corso, senza riconfigurare nulla. I tag <private> sono la risposta di claude-mem; uno strumento senza equivalente significa che il tuo unico controllo è 'non usarlo per questo lavoro'."},
  {title: "Cosa installa davvero installarlo?", body: "Runtime globali, un demone in background, un server MCP, hook a ogni chiamata a strumenti. Tutto ragionevole singolarmente; vale la pena contarli prima di accettarli."},
  {title: "Quanto in fretta si muove, e ti serve che lo faccia?", body: "Rilasci veloci significano correzioni veloci e rotture veloci. Se lo distribuisci a un team, fissa una versione e gestisci tu l'aggiornamento, anziché lasciare che ogni sviluppatore stia su una versione maggiore diversa."}
]} />

<Callout type="takeaways" items={["claude-mem non è un archivio di trascrizioni. È un secondo modello in un demone in background che legge ogni chiamata a strumenti e scrive osservazioni strutturate — che è il vero costo e la vera capacità dell'intera classe di strumenti.", "L'osservatore è un modello separato su un provider che selezioni all'installazione (host, OpenRouter, Gemini o Anthropic). Il dataset dei costi del progetto associa il suo id ospitato cmem-observer a deepseek/deepseek-v4-flash dal 2026-08-08, quindi il nome non ti dice dove va il tuo codice.", "Qualcuno deve pagare l'estrazione. Per impostazione predefinita è il tuo account di provider; la proposta da 30 $/mese di CMEM Pro è esplicitamente che l'osservazione ospitata sposta la generazione della memoria fuori dall'abbonamento del tuo agente principale.", "Il richiamo è in tre passi, non uno: un riscontro d'indice da ~50-100 token, poi il contesto della timeline, poi un recupero di dettaglio da ~500-1.000 token solo per gli ID selezionati. 'Filtra a basso costo, recupera a caro prezzo' è lo schema trasferibile e il motivo per cui l'aritmetica dei token funziona.", "Il contratto di degradazione è pubblicato e asimmetrico: i guasti di trasporto escono con 0 e non bloccano mai la sessione, i guasti lato client escono con 2 e la bloccano. Un'installazione aggiornata a metà è quindi una sessione che non parte.", "Il traffico dell'osservatore è circa il 98% di token di input secondo la contabilità del progetto stesso — un processo di lettura, non di scrittura. Valorizzalo di conseguenza.", "Ogni osservazione diventa più documenti Chroma, uno per fatto estratto più la narrazione, ed è per questo che una query su un piccolo dettaglio può far emergere una nota che nominalmente riguarda altro.", "La correzione di v15.0.2 è il bug più istruttivo del progetto: un modello di ragionamento in un ruolo di estrazione ha speso il budget di output in ragionamento e ha lasciato le sessioni senza nulla da emettere. Disattiva il ragionamento su qualsiasi modello che usi come riassuntore.", "Due runtime di gestori di pacchetti (Bun e uv) vengono installati globalmente, un demone si lega a 37700 + (uid % 100) e un server MCP si unisce al tuo agente. Tutto difendibile, tutto da contare come superficie prima di accettarlo.", "L'unico controllo in banda è il tag <private>, che esclude il contenuto del tutto dalla memorizzazione. Tutto il resto si decide all'installazione."]} />

<Flashcards title="Dodici termini dello stack del livello di memoria" cards={[
  {front: "Osservazione", back: "L'unità di memorizzazione di claude-mem: una nota strutturata con tipo, titolo e narrazione, estratta dal modello osservatore dall'uso degli strumenti del tuo agente. Non un estratto di trascrizione."},
  {front: "Osservatore / SDKAgent", back: "La seconda sessione di modello, in esecuzione dentro il demone worker, che legge l'uso degli strumenti in coda e scrive osservazioni e riepiloghi. Il suo provider è un flag di installazione."},
  {front: "Demone worker", back: "Un servizio Express locale gestito dal runtime Bun, sulla porta per utente 37700 + (uid % 100). Contiene il gestore delle sessioni, l'orchestrazione della ricerca, la sincronizzazione Chroma e l'interfaccia."},
  {front: "Rivelazione progressiva / Smart recall", back: "Recupero in tre passi — indice compatto, poi contesto della timeline, poi dettagli completi per gli ID selezionati — con l'agente che ragiona tra un passo e l'altro. Predefinito dalla v15.0.0."},
  {front: "FTS5", back: "L'estensione di ricerca full-text di SQLite, la metà a parole chiave della ricerca ibrida di claude-mem. Gli embedding Chroma forniscono la metà semantica."},
  {front: "Embedding per fatto", back: "Chroma memorizza un documento per la narrazione di un'osservazione più uno per ogni fatto estratto — obs_ID_narrative, obs_ID_fact_0, obs_ID_fact_1 e così via. Un'osservazione diventa più vettori, quindi una query stretta può recuperare una nota dal titolo ampio."},
  {front: "Contratto di degradazione", back: "La regola che associa la classe di guasto al codice di uscita: gli errori di trasporto escono con 0 (non bloccano mai la sessione host), gli errori del client escono con 2 (bloccano, perché segnalano un bug)."},
  {front: "contentSessionId vs memorySessionId", back: "L'id di sessione dell'host, invariante per la sessione, contro quello dell'agente SDK, che cambia a ogni riavvio del worker. La conversione tra i due è portante per le chiavi esterne."},
  {front: "Hash del contenuto", back: "SHA256(memory_session_id + title + narrative) troncato a 16 caratteri esadecimali, usato per deduplicare le ripetizioni che arrivano entro una finestra di 30 secondi."},
  {front: "Tag <private>", back: "L'unico controllo di esclusione in banda: il contenuto al suo interno è escluso del tutto dalla memorizzazione e mai scritto nella memoria di profilo o di progetto."},
  {front: "CMEM Pro", back: "Il livello a pagamento di osservazione ospitata e sincronizzazione cloud: 30 $/mese dopo una prova di 30 giorni, proposto come spostamento della generazione della memoria fuori dall'abbonamento del tuo agente principale."},
  {front: "Open core (ip-boundary)", back: "Il motore, il server, la CLI, gli SDK, gli strumenti MCP e gli adattatori sono Apache-2.0; il richiamo ospitato, la sincronizzazione di team, SSO, RBAC, UI di audit, il motore DLP e le valutazioni gestite sono aree commerciali riservate."},
]} />

<Quiz title="Verificati" questions={[
  {
    q: "La tua sessione di programmazione non riesce ad avviarsi subito dopo un aggiornamento di un plugin. Dato il contratto di degradazione pubblicato di claude-mem, qual è la relazione più probabile?",
    options: [
      "Nessuna: il livello di memoria è progettato per non bloccare mai la sessione host",
      "Il worker di memoria è probabilmente spento, il che blocca l'avvio della sessione",
      "Un'installazione con versioni sfasate produce errori lato client, che il contratto rende deliberatamente bloccanti (exit 2)",
      "L'archivio vettoriale Chroma è corrotto, il che ferma l'hook SessionStart"
    ],
    answer: 2,
    explain: "Il contratto è asimmetrico di proposito: i guasti di trasporto (connessione rifiutata, timeout, 5xx) escono con 0 e non bloccano mai, mentre i 4xx e le eccezioni lato client escono con 2 e bloccano. Un'installazione aggiornata a metà è esattamente il modo per arrivare al ramo bloccante — ed è per questo che l'hook Setup insiste su npx claude-mem repair in caso di discrepanza di versione."
  },
  {
    q: "Quale affermazione sul modello che scrive le osservazioni di claude-mem è corretta?",
    options: [
      "È sempre Claude, dato che lo strumento gira dentro Claude Code",
      "È un modello separato il cui provider è un flag di installazione, e il dataset dei costi del progetto associa il suo id di osservatore ospitato a un modello DeepSeek",
      "È un piccolo modello locale incluso nell'installer, quindi nulla lascia la tua macchina",
      "Non c'è alcun modello: le osservazioni sono prodotte dal parsing deterministico dell'output degli strumenti"
    ],
    answer: 1,
    explain: "Il flag di installazione offre host, OpenRouter, Gemini o Anthropic. docs/expense-pricing/README.md risolve l'id cmem-observer in deepseek/deepseek-v4-flash dal 2026-08-08 in poi. Il nome non determina dove va il contenuto della tua sessione; lo determina il flag."
  },
  {
    q: "Perché il richiamo in tre passi risparmia token anziché spenderli?",
    options: [
      "Perché gli embedding sono quantizzati, quindi ogni recupero costa meno",
      "Perché mette in cache le osservazioni recuperate tra le sessioni",
      "Perché il passo economico (un riscontro d'indice da ~50-100 token) decide la rilevanza prima che il passo costoso (un recupero di dettaglio da ~500-1.000 token) giri solo sulle sopravvissute",
      "Perché il modello di riepilogo comprime il dettaglio prima che arrivi all'agente"
    ],
    answer: 2,
    explain: "Filtra su rappresentazioni economiche, poi paga il dettaglio per ciò che sopravvive. È la stessa forma del leggere una pagina di risultati prima di aprire le schede, o di un indice prima del recupero di una riga — ed è lo schema corretto per qualsiasi recupero tu colleghi a un agente."
  },
  {
    q: "Il rilascio v15.0.2 ha disattivato il ragionamento per impostazione predefinita per le richieste dell'osservatore. Quale guasto ha corretto e qual è la lezione generale?",
    options: [
      "I token di ragionamento rendevano le osservazioni meno accurate; preferisci modelli senza ragionamento per la qualità dell'estrazione",
      "I token di ragionamento riempivano il budget di output, lasciando a una sessione nulla da emettere — quindi disattiva il ragionamento su qualsiasi modello usato come riassuntore con budget limitato",
      "Le tracce di ragionamento venivano memorizzate come osservazioni, facendo trapelare la catena di pensiero nell'archivio di memoria",
      "Le richieste di ragionamento venivano rifiutate dagli endpoint compatibili con OpenAI, facendo andare il worker in crash loop"
    ],
    answer: 1,
    explain: "Le note di rilascio sono esplicite: i token di ragionamento riempivano il budget di output e lasciavano le sessioni con zero output. È una pura conseguenza dell'aver messo un modello di ragionamento in un ruolo di estrazione con output limitato, e si ripresenterà in tutto ciò che costruisci allo stesso modo."
  },
  {
    q: "Devi impedire che una cosa specifica — un hostname di produzione — venga registrata, a sessione in corso, senza riconfigurare nulla. Cosa ti offre claude-mem?",
    options: [
      "Un comando slash /forget che elimina retroattivamente le osservazioni corrispondenti",
      "Il contenuto racchiuso tra tag <private> è escluso del tutto dalla memorizzazione, comprese la memoria di profilo e di progetto",
      "Un glob di esclusione in ~/.claude-mem/settings.json, che si applica dalla sessione successiva",
      "Nulla: l'unico controllo è disattivare il plugin per quella sessione"
    ],
    answer: 1,
    explain: "<private> è l'unico controllo in banda, e l'unico che funziona a sessione in corso. Tutto il resto — scelta del provider, opt-in alla sincronizzazione cloud, ambito delle fonti — si decide all'installazione o nelle impostazioni. È anche, per costruzione, qualcosa che devi ricordarti di usare."
  },
  {
    q: "La documentazione dice che il worker ascolta sulla porta 37700 + (uid % 100), mentre le note di rilascio citano localhost:37777. Cosa devi concludere?",
    options: [
      "La porta è cambiata tra le versioni e 37777 è quella attuale",
      "37777 è la porta calcolata di un utente, non una costante: calcola la tua dal tuo uid",
      "37777 è l'interfaccia e l'API è su un'altra porta",
      "La formula vale solo per le distribuzioni server multiutente"
    ],
    answer: 1,
    explain: "37700 + (uid % 100) è per utente per scelta progettuale, così che due account sulla stessa macchina non collidano. Un numero specifico in un changelog è ciò che ha prodotto l'uid di quell'autore. Calcolalo anziché copiarlo."
  }
]} />

## Fonti e letture di approfondimento

- **thedotmack/claude-mem**: https://github.com/thedotmack/claude-mem — il progetto. Apache-2.0, creato il 31 agosto 2025, 103.252 stelle e ultimo push il 26 ottobre 2026 (verificato tramite la GitHub API in quella data).
- **`docs/architecture-overview.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/architecture-overview.md — la migliore fonte singola di questa pagina. Diagramma a livelli, la tabella degli hook con i timeout, il diagramma del flusso di dati, gli schemi della coda in sospeso e del riavvio del generatore, il contratto di degradazione exit-0/exit-2, l'hash di deduplicazione, i due tipi di ID di sessione, lo schema SQLite e la denominazione dei documenti Chroma.
- **`docs/security.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/security.md — le impostazioni predefinite di autenticazione con chiave API, il prefisso `cmem_` e la memorizzazione solo SHA-256, le due variabili d'ambiente richieste insieme per il bypass su loopback e le note su BullMQ/Redis.
- **`docs/ip-boundary.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/ip-boundary.md — la ripartizione open-core tra componenti Apache-2.0 e aree commerciali riservate.
- **`docs/expense-pricing/README.md`**: https://github.com/thedotmack/claude-mem/blob/main/docs/expense-pricing/README.md — il dataset di contabilità dei costi dell'osservatore, la mappatura `cmem-observer` verso `deepseek/deepseek-v4-flash` dal 2026-08-08 e la forma di lavoro al ~98% di input. È il file che risponde a "quale modello legge il mio codice".
- **Note di rilascio v15.0.0** (Smart memory search predefinita): https://github.com/thedotmack/claude-mem/releases/tag/v15.0.0 — il richiamo in tre passi che diventa il predefinito il 20 ottobre 2026.
- **Note di rilascio v15.0.2** (ragionamento disattivato per le richieste dell'osservatore): https://github.com/thedotmack/claude-mem/releases/tag/v15.0.2 — il bug del budget di output, e la voce più istruttiva del changelog.
- **Note di rilascio v15.2.1**: https://github.com/thedotmack/claude-mem/releases/tag/v15.2.1 — la pubblicazione su npm passata al trusted publishing con OIDC e attestazioni di provenienza, dopo che `NPM_TOKEN` falliva dalla v13.26.1. Da notare per chi verifica la supply chain del pacchetto.
- **cmem.ai**: https://cmem.ai/ — il livello ospitato: 30 $/mese dopo una prova di 30 giorni, l'inquadramento "sposta la generazione della memoria fuori dall'abbonamento del tuo agente principale", le dichiarazioni su archiviazione locale e sincronizzazione cloud, e l'onesta avvertenza che gli effetti sui token dipendono dal tuo carico di lavoro e dal provider.
- **Model Context Protocol** — specifica degli strumenti: https://modelcontextprotocol.io/docs/concepts/tools — come gli strumenti `search`, `timeline` e `get_observations` raggiungono il tuo agente.
- **SQLite FTS5**: https://www.sqlite.org/fts5.html — l'indice full-text dietro il primo passo economico del richiamo.
- **Chroma**: https://docs.trychroma.com/ — l'archivio vettoriale, e il modello di documento per fatto che fa colpire note ampie a query strette.

## Prossimi passi

- [Come funziona davvero la memoria degli agenti](/docs/frontiers/agent-memory-architectures) — la tassonomia in cui si colloca questo strumento: cosa conta come memoria, su quale livello opera ciascun approccio e perché la maggior parte fallisce nel recupero più che nell'archiviazione
- [Hindsight: la memoria degli agenti che impara](/docs/models/hindsight-agent-memory-that-learns) — l'altro estremo dello spazio di progettazione, dove la memoria viene aggiornata dall'esito anziché estratta dalle trascrizioni
- [CLAUDE.md e file di memoria](/docs/claude-code/claude-md) — la base di partenza di prima parte, scritta a mano, con cui ognuno di questi strumenti compete implicitamente, e quella che dovresti sistemare bene prima di aggiungere un demone
- [Cosa carica il tuo agente](/docs/security/what-your-agent-uploads) — la versione più ampia della domanda che questa pagina pone sull'osservatore: cosa lascia la tua macchina mentre un agente svolge un lavoro ordinario
