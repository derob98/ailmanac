# La tassa dei token MCP

> Source: https://derob98.github.io/ailmanac/it/docs/claude-code/mcp-token-cost · AILmanac (CC BY 4.0) · last verified 2026-11-10

Perché collegare server MCP può bruciare 50k–150k token prima della tua prima richiesta — e le tre soluzioni: Tool Search, esecuzione di codice e sapere quando vince una chiamata CLI.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-11-10" source="https://www.anthropic.com/engineering/advanced-tool-use">
Le cifre sui token e i nomi delle funzionalità (`defer_loading`, Tool Search Tool, Programmatic Tool Calling) provengono dagli articoli di ingegneria di Anthropic. Il comportamento della tool search di Claude Code — che è attiva per impostazione predefinita, i valori di `ENABLE_TOOL_SEARCH`, il modello minimo e i limiti sulle descrizioni — proviene dalla [documentazione MCP di Claude Code](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search), che è il punto in cui questa parte cambia. Verifica entrambe le fonti prima di citare numeri esatti.
</VerifyNote>

Su Hacker News e su X ricorre sempre la stessa discussione: *perché bruciare decine di migliaia di token per una singola operazione MCP quando la stessa cosa via CLI ne costa un paio di centinaia?* Sembra un attacco a MCP, ma non lo è. Chi protesta più forte sono proprio quelli che amano gli agenti — hanno solo incontrato il conto. Questa pagina è la guida pratica a quel conto: dove vanno davvero i token, i due costi che quasi nessuno distingue e le tre soluzioni che trasformano un flusso da 150.000 token in uno da 2.000.

<Callout type="objectives" items={["Separare i DUE costi distinti in token di MCP: il caricamento delle definizioni degli strumenti e i risultati intermedi", "Capire perché il costo degli schemi si paga a ogni conversazione, non una volta sola", "Usare defer_loading e il Tool Search Tool per caricare gli schemi degli strumenti su richiesta", "Usare l'esecuzione di codice / Programmatic Tool Calling per tenere i risultati voluminosi fuori dal contesto", "Decidere, compito per compito, quando uno strumento MCP vale la pena e quando vince una semplice chiamata CLI"]} />

## Due costi, non uno

Quando colleghi un server MCP, il client gli chiede `tools/list` e riceve **ogni strumento con il suo schema JSON completo**. Tutto quel blocco viene iniettato nel contesto del modello. La maggior parte delle persone ferma qui il conto mentale. Ma le tasse sono due, e la seconda di solito pesa di più.

**Costo 1 — Definizioni degli strumenti.** Nome, descrizione e schema dei parametri di ogni strumento collegato stanno nel contesto. La formulazione di Anthropic: *"In cases where agents are connected to thousands of tools, they'll need to process hundreds of thousands of tokens before reading a request."* Un singolo server aziendale può pubblicare da decine a centinaia di strumenti; analisi di terze parti stimano che un server da 400 strumenti pesi circa 400.000 token solo di schemi — il doppio di una finestra da 200k, e comunque il 40% di una da 1M, spesi prima della prima richiesta. (Dimensioni della finestra per modello: [Modelli e prezzi](/docs/whats-new/models-and-pricing).)

**Costo 2 — Risultati intermedi.** Quando il modello chiama direttamente uno strumento, **ogni risultato rifluisce attraverso il contesto del modello**, anche le parti che non volevi che leggesse. L'esempio di Anthropic: estrai da uno strumento la trascrizione di una riunione di due ore e passala a un altro, e l'intera trascrizione attraversa il modello *due volte* — potenzialmente ~50.000 token — solo per produrre un riassunto di una riga.

<Callout type="warning" items={["Il Costo 1 si paga A OGNI turno finché non interviene il prompt caching — gli schemi vengono reinviati a ogni richiesta della conversazione, non caricati una volta sola. Un grande catalogo di strumenti è una tassa sull'intera sessione, non una spesa una tantum. È il costo di uno strumento la cui definizione è CARICATA; differirla (vedi sotto) è ciò che la toglie dal conto per turno.", "Il Costo 2 cresce con i tuoi DATI, non con il numero di strumenti. Dieci strumenti minuscoli possono costare meno di uno che restituisce un blob gigantesco."]} />

### I numeri, dalle fonti primarie

| Soluzione | Compito | Prima | Dopo | Riduzione |
| --- | --- | --- | --- | --- |
| Esecuzione di codice con MCP | Flusso Google Drive → Salesforce | 150.000 | 2.000 | **98,7%** |
| Tool Search Tool | Caricare le definizioni prima di iniziare il lavoro | ~77.000 | ~8.700 | **85%** |
| Programmatic Tool Calling | Compito di ricerca complesso | 43.588 | 27.297 | **37%** |

Tutte e tre le righe sono cifre pubblicate da Anthropic. La parte sorprendente non è il costo, è l'**accuratezza**: con il Tool Search Tool l'accuratezza nella scelta degli strumenti è *salita* (Opus 4.5 è passato dal 79,5% all'88,1%; Opus 4 dal 49% al 74%). Meno strumenti che affollano il contesto significa che il modello sceglie più spesso quello giusto. Costo e qualità vanno nella stessa direzione, il che è raro.

## Soluzione 1 — Caricare gli schemi degli strumenti su richiesta

Invece di iniettare tutti gli schemi in anticipo, marcali con `defer_loading: true`. Claude vede allora solo un indice leggero; quando gli serve GitHub, chiama il **Tool Search Tool**, che restituisce *solo* gli schemi di GitHub corrispondenti — non i 50+ strumenti di tutti gli altri server. Anthropic riferisce che questo preserva ~191.300 token di contesto contro ~122.800 con tutto precaricato.

### In Claude Code è già attivo

Stai osservando questo schema in questo momento, se usi Claude Code con server MCP. **La tool search è abilitata per impostazione predefinita**: all'avvio della sessione si caricano solo i *nomi* degli strumenti e le istruzioni dei server, e Claude recupera lo schema completo tramite una chiamata a `ToolSearch` quando un compito lo richiede. Aggiungere un altro server ti costa quindi i nomi dei suoi strumenti, non i suoi schemi — Claude Code non impone alcun tetto di strumenti per server e indica come limite pratico il budget della finestra di contesto.

Vale la pena correggere un'affermazione molto ripetuta, perché è giusta solo a metà. La soglia del «~10% della finestra di contesto» esiste davvero, ma **non** è il trigger predefinito: è una delle modalità opzionali della variabile d'ambiente `ENABLE_TOOL_SEARCH`:

| `ENABLE_TOOL_SEARCH` | Comportamento |
| --- | --- |
| *(non impostata)* — il predefinito | Ogni strumento MCP è differito e caricato su richiesta |
| `true` | Come non impostata |
| `auto` | Modalità a soglia. Gli strumenti differibili si caricano **in anticipo** finché le loro definizioni totalizzano meno del 10% della finestra di contesto; al 10% o più, la tool search si attiva |
| `auto:N` | Modalità a soglia con la tua percentuale (`N` va da 0 a 100), per esempio `auto:5` |
| `false` | Ogni strumento MCP viene caricato in anticipo, senza differimento |

Quindi, se contavi sul fatto che gli strumenti si caricassero in anticipo sotto il 10%, hai il predefinito al contrario: niente si carica in anticipo a meno che tu non chieda `auto`. E `auto` è **persistente**: una volta che il totale supera la soglia e la tool search si attiva, quegli strumenti possono restare differiti anche dopo che il totale è tornato sotto la soglia.

<Callout type="warning" items={["Tre cose disattivano la tool search e ignorano del tutto ENABLE_TOOL_SEARCH: CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS (da Claude Code v2.1.227 un'organizzazione può mantenerla attiva tramite le impostazioni gestite), una sessione che riceve la configurazione HIPAA (nessuna possibilità di override) e i deployment di Microsoft Foundry ospitati su Azure, che la rifiutano lato server. Anche negare lo strumento ToolSearch nei permessi fa caricare tutto in anticipo.", "Esiste un modello minimo: Claude Code usa la tool search su Claude Opus 4, Sonnet 4, Haiku 4.5 e successivi. Sui modelli precedenti tutto si carica in anticipo e ENABLE_TOOL_SEARCH=true NON lo sovrascrive. Su Agent Platform di Google Cloud la soglia è più alta — Opus 4.5, Sonnet 4.5, Haiku 4.5 e successivi."]} />

Se scrivi server MCP, il differimento cambia anche il tuo budget per le descrizioni, in modo asimmetrico: la descrizione di uno strumento caricato **in anticipo** viene troncata a 4.096 caratteri (lo stesso limite delle istruzioni del server), quella di uno caricato **tramite tool search** a 16.384. Ma la ricerca stessa confronta solo il limite più corto, quindi le parole che Claude cercherebbe devono comunque stare vicino all'inizio.

<Steps items={[{title: "Fai l'audit di ciò che hai collegato", body: "Elenca i server attivi e più o meno quanti strumenti pubblica ciascuno. Esegui /context: etichetta gli strumenti come (deferred) o (loaded on-demand) quando la tool search li gestisce, così vedi quali server spendono davvero token di schema e quali spendono solo nomi."}, {title: "Scollega ciò che questo compito non richiede", body: "La soluzione più economica sono meno server. Collega i due o tre che il compito usa davvero, non l'intero catalogo — anche se differito, ogni server aggiunge comunque nomi di strumenti e istruzioni del server a ogni turno."}, {title: "Differisci il resto", body: "In Claude Code è già il comportamento predefinito. Altrove, preferisci un client/configurazione che supporti defer_loading + Tool Search, in modo che gli schemi si carichino solo quando vengono cercati."}]} />

## Soluzione 2 — Tenere i risultati fuori dal contesto con l'esecuzione di codice

La soluzione più profonda punta al Costo 2. Invece di far chiamare al modello gli strumenti uno alla volta con ogni risultato che gli passa attraverso, il modello **scrive codice** che chiama gli strumenti, e i dati intermedi restano nell'ambiente di esecuzione. Anthropic espone i server MCP come un **albero di file di strumenti** che l'agente esplora come un filesystem, caricando solo le definizioni che gli servono — e *"intermediate results stay in the execution environment by default… the agent only sees what you explicitly log or return."*

È questa singola scelta di progetto a far crollare il flusso Drive→Salesforce da 150.000 a 2.000 token: i record si muovono attraverso il codice e al modello torna solo il conteggio finale. Sulla Developer Platform la stessa idea arriva come **Programmatic Tool Calling** — Claude scrive Python che orchestra più strumenti e filtra gli output prima che raggiungano il suo contesto.

<Callout type="tip" items={["Regola pratica: se uno strumento RESTITUISCE qualcosa di grande (una trascrizione, un dump di query, un file), ti serve l'esecuzione di codice, così il blob viene elaborato fuori dal contesto. Se uno strumento si limita a FARE qualcosa di piccolo (creare una issue, inviare una riga), una chiamata diretta va benissimo."]} />

## Soluzione 3 — Sapere quando una chiamata CLI vince e basta

A volte la risposta giusta non è una configurazione MCP migliore, ma nessun MCP. La discussione su HN/X ha un punto fondato: un comando di shell come `gh pr list` o `psql -c '…'` costa un paio di centinaia di token tra andata e ritorno, mentre il percorso MCP equivalente paga gli schemi più un risultato strutturato. Se l'agente ha già un terminale e la CLI esiste, spesso è il percorso più snello.

<PromptCard title="Preferisci la CLI quando lo strumento è già una CLI">
{`# Instead of connecting a GitHub MCP server for read-only work,
# let the agent use the gh CLI it already has:
gh pr list --state open --json number,title,author

# ~200 tokens of command + compact output, no schema tax,
# no server to keep connected across the session.`}
</PromptCard>

MCP si guadagna il suo overhead quando ti serve una capacità **tipizzata, con permessi e trasversale alle superfici** — un database con un ruolo in sola lettura, un browser da pilotare, un'API SaaS con OAuth — oppure quando gli stessi strumenti vengono riusati su molti turni, così il caching ammortizza il costo degli schemi. Scegli una CLI quando la capacità è occasionale, già scriptabile e restituisce qualcosa di piccolo. Nessuna delle due è «migliore»: sono punti diversi di una curva dei costi.

<Callout type="takeaways" items={["MCP ha due costi in token: gli schemi delle definizioni degli strumenti (pagati ~a ogni turno) e i risultati intermedi (che crescono con i tuoi dati).", "Tool Search + defer_loading riducono il costo degli schemi di ~85% E aumentano l'accuratezza nella scelta degli strumenti — carica gli schemi solo quando vengono cercati.", "In Claude Code la tool search è ATTIVA per impostazione predefinita: all'avvio della sessione si caricano solo i nomi degli strumenti. La soglia del ~10% che si cita è la modalità opzionale ENABLE_TOOL_SEARCH=auto, non il predefinito.", "Esecuzione di codice / Programmatic Tool Calling tengono i risultati voluminosi nell'ambiente di esecuzione; al modello arriva solo ciò che registri o restituisci (da 150k a 2k nell'esempio di Anthropic).", "L'ottimizzazione più economica è collegare meno server per compito.", "Quando la capacità è occasionale, restituisce qualcosa di piccolo e ha già una CLI, una chiamata di shell (~200 token) batte un giro MCP."]} />

<Flashcards title="Termini dell'economia MCP" cards={[{front: "La tassa dei token MCP", back: "I token spesi per gli schemi degli strumenti e i risultati intermedi, non per il lavoro vero e proprio — il costo nascosto del collegare server."}, {front: "defer_loading", back: "Un flag che tiene lo schema di uno strumento FUORI dal contesto finché Claude non lo cerca tramite il Tool Search Tool."}, {front: "Tool Search Tool", back: "Permette a Claude di scoprire gli strumenti su richiesta; cercando 'github' restituisce solo gli schemi di GitHub invece di ogni strumento collegato. Taglio di ~85% dei token di schema nelle cifre di Anthropic."}, {front: "Programmatic Tool Calling", back: "Claude scrive codice che orchestra gli strumenti; i risultati intermedi vengono filtrati nell'ambiente di esecuzione, così nel contesto entra solo l'output finale."}, {front: "Rivelazione progressiva", back: "Schema generale: esporre in anticipo un indice leggero degli strumenti e recuperare gli schemi completi solo quando servono."}, {front: "ENABLE_TOOL_SEARCH", back: "La manopola di Claude Code. Non impostata o true = tutto differito (il predefinito). auto / auto:N = carica in anticipo finché le definizioni non superano N% della finestra (10% di default), poi si attiva e resta attiva. false = tutto in anticipo."}]} />

<Quiz title="Verifica te stesso" questions={[{q: "Perché il costo delle definizioni degli strumenti è peggio di una spesa una tantum?", options: ["Gli schemi sono salvati su disco e riletti lentamente", "Gli schemi vengono reinviati a ogni richiesta della conversazione finché non si applica il prompt caching", "Ogni chiamata a uno strumento raddoppia la dimensione dello schema"], answer: 1, explain: "Gli schemi degli strumenti stanno nel contesto che viene inviato a ogni turno, quindi un grande catalogo tassa l'intera sessione — non solo il primo messaggio — finché non interviene il caching."}, {q: "Uno strumento estrae una trascrizione di 2 ore e la passa a uno strumento di riassunto tramite chiamate dirette. Qual è il costo nascosto?", options: ["Nessuno — solo il riassunto consuma token", "L'intera trascrizione attraversa il contesto del modello, potenzialmente ~50k token, anche se volevi solo un riassunto", "La trascrizione viene fatturata una sola volta sul server, non al modello"], answer: 1, explain: "Con le chiamate dirette agli strumenti ogni risultato intermedio attraversa il modello. L'esecuzione di codice tiene la trascrizione nell'ambiente di esecuzione, così torna solo il riassunto."}, {q: "Durante una sessione di coding ti serve un solo 'elenca le PR aperte' in sola lettura e l'agente ha un terminale. Qual è l'opzione più snella?", options: ["Collegare un server MCP completo di GitHub", "Eseguire direttamente la CLI gh — ~200 token, nessuna tassa sugli schemi, niente da tenere collegato", "Caricare tutti gli strumenti GitHub con defer_loading disattivato"], answer: 1, explain: "Per un'esigenza occasionale che restituisce qualcosa di piccolo e ha già una CLI, una chiamata di shell evita del tutto la tassa sugli schemi. MCP si guadagna il suo costo con capacità riusate, tipizzate e con permessi."}, {q: "Che cosa sorprendente succede all'accuratezza nella scelta degli strumenti quando usi il Tool Search Tool?", options: ["Cala, perché Claude vede meno strumenti", "Resta uguale; cambia solo il costo", "Sale — meno strumenti che affollano il contesto significa che Claude sceglie più spesso quello giusto"], answer: 2, explain: "Anthropic riferisce che l'accuratezza è SALITA (Opus 4.5: dal 79,5% all'88,1%) con Tool Search. Costo e qualità sono andati nella stessa direzione."}]} />

## Correlati su AILmanac

- [Server MCP in Claude Code](/docs/claude-code/mcp) — come aggiungere, delimitare e mettere in sicurezza i server.
- [L'economia dei token](/docs/power-user/token-economy) — comprimere l'output dei comandi prima che raggiunga il modello.
- [Workflow dinamici](/docs/claude-code/dynamic-workflows) — dove emerge il costo dell'orchestrazione e come usare le fette per stimare la spesa.
- [Uso degli strumenti nell'API](/docs/api/tool-use) — la forma di richiesta/risposta alla base di tutto questo.
- [Playwright MCP: la guida pratica approfondita](/docs/api/playwright-mcp-deep-guide) — esempio pratico sul singolo server più pesante che le persone collegano (~3.500 token di tassa sugli schemi), e quando vince invece il percorso Skill/CLI.
- [Tool Search e caricamento differito](/docs/api/tool-search-and-deferred-loading) — l'approfondimento a livello di API: regex contro BM25, i cinque 400 e perché il corpo della richiesta non si riduce.

## Fonti e letture ulteriori

- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) — Anthropic Engineering. Fonte della cifra 150.000 → 2.000 token (98,7%) e dello schema «intermediate results stay in the execution environment».
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) — Anthropic Engineering. Tool Search Tool (`defer_loading`, riduzione di ~85%, guadagni di accuratezza) e Programmatic Tool Calling (43.588 → 27.297 token).
- [Documentazione MCP di Claude Code](https://code.claude.com/docs/en/mcp) — riferimento ufficiale per collegare e delimitare i server. La sezione [Scale with MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search) è la fonte per la tool search come predefinito, la tabella di `ENABLE_TOOL_SEARCH`, il modello minimo e i limiti di descrizione di 4.096 / 16.384 caratteri.
- [modelcontextprotocol — Progressive Tool Discovery discussion](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1923) — discussione di progettazione della community sul caricamento degli strumenti su richiesta.
- [MCP Progressive Disclosure](https://www.solo.io/blog/mcp-progressive-disclosure) (Solo.io) — guida di terze parti allo schema indice leggero / recupero dello schema su richiesta.


## Prossimi passi

- [Accessibilità](/docs/claude-code/accessibility)
