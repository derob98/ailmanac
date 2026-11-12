# Distribuire un agente di coding a chi non è ingegnere

> Source: https://derob98.github.io/ailmanac/it/docs/playbooks/rolling-out-coding-agents · AILmanac (CC BY 4.0) · last verified 2026-11-09

Goldman Sachs ha dato Claude Code a banker e trader, poi lo ha ritirato quattro mesi dopo. Questa è la guida pratica che la stampa ha saltato: cosa facevano davvero i trader con un agente di coding, perché il costo del rollout è finito sulla coda di review degli ingegneri e non sul budget delle licenze, il problema dei micro-modelli che rende nervose le aziende regolamentate, e i controlli che applicano davvero una policy rispetto a quelli che si limitano a sembrarlo.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={[
  "Distinguere i tre lavori per cui chi non è ingegnere usa davvero un agente di coding — solo uno è programmare, e questo scarto è tutta la storia",
  "Trovare il vero centro di costo di un rollout ampio: non i posti, non i token, ma la coda di review degli ingegneri che ereditano l'output",
  "Capire il problema dei micro-modelli — perché lo script di 40 righe di un trader sulle sue posizioni può essere un modello regolamentato, e cosa dice oggi la guida di vigilanza USA",
  "Smettere di confondere i due divieti bancari AI del 2026: gli strumenti di coding interni e gli agenti di terzi che toccano i conti dei clienti sono problemi diversi con rimedi diversi",
  "Abbinare la superficie al lavoro e non alla persona, usando la scala delle capacità",
  "Distribuire controlli che applicano davvero — e capire perché le impostazioni gestite dal server e l'audit trail predefinito non lo fanno"
]} />

<VerifyNote lastVerified="2026-11-09" source="https://techstrong.ai/agentic-ai/goldman-sachs-cuts-bankers-traders-off-from-ai-coding-tools-over-risk-concerns/">
I dettagli su Goldman Sachs riportati qui sotto (date, numeri, chi ha mantenuto l'accesso) provengono dall'articolo di Bloomberg del 2 novembre 2026, dai suoi approfondimenti e da un portavoce dell'azienda citato per nome. Le policy di accesso cambiano in silenzio e senza annunci: considera il caso Goldman un esempio svolto i cui dettagli possono essere cambiati, non una descrizione aggiornata di quell'azienda. I meccanismi e la superficie di controllo sono la parte duratura di questa pagina.
</VerifyNote>

## Cosa è successo, in un paragrafo

A luglio 2026 il CIO di Goldman Sachs, Marco Argenti, ha elogiato pubblicamente il «vibe coding» che si stava diffondendo tra il personale non tecnico dell'azienda: persone che non erano ingegneri costruivano cose con strumenti di AI e passavano le loro creazioni a uno dei circa 12.000 ingegneri dell'azienda perché le finissero. A ottobre 2026 una direttiva interna ha invertito la rotta. Claude Code e GitHub Copilot restano ora agli ingegneri e agli «strats» — la popolazione ibrida trading/quant/ingegneria — e sono stati ritirati a banker e trader. Un portavoce l'ha presentata come la fine di una sperimentazione: dopo aver valutato «una serie di fattori tra cui produttività e gestione del rischio», l'azienda ha messo gli strumenti nelle mani di chi è più adatto a usarli nel lungo periodo. Bloomberg ha dato la notizia il 2 novembre; il thread su Hacker News ha superato i 780 punti.

La copertura l'ha trattata soprattutto come un verdetto sull'AI. È più utile come caso di studio sul design di un rollout, perché il modo in cui fallisce è quello che quasi ogni organizzazione incontrerà estendendo un agente di coding oltre l'ingegneria, e che quasi nessuna prezza in anticipo.

## I tre lavori, di cui solo uno è programmare

Si parte da ciò che facevano, secondo le cronache, gli utenti a cui è stato tolto l'accesso. Nei resoconti ricorrono tre lavori:

| Per cosa lo usavano i trader | È programmare? | Cos'è davvero |
|---|---|---|
| Seguire come operavano i clienti | No | Analisi dati su flussi sensibili |
| Simulare variazioni dei mercati e delle proprie posizioni | No | Modellazione quantitativa |
| Redigere testi e visual | No | Generazione di documenti e asset |

Nessuno dei tre è ingegneria del software. L'agente di coding era il veicolo, non il lavoro. È la cosa più importante da portarsi via dall'episodio, ed è proprio ciò che la cornice «le banche temono l'AI» oscura.

Succede perché un agente di coding da terminale è, per caso, lo strumento di analisi generalista più capace che la maggior parte delle aziende abbia distribuito. Raggiunge un database, scrive il Python, lo esegue e produce il grafico — in un unico ciclo, senza ticket. Se il percorso di analisi autorizzato richiede una richiesta dati e due settimane di coda, l'agente di coding vince sempre per merito. Le persone non lo usavano a sproposito. Aggiravano un collo di bottiglia interno, che è ciò che fanno le persone capaci.

La conseguenza è che **non stai decidendo se chi non è ingegnere può programmare. Stai decidendo se si possono costruire analisi senza versionamento e senza review su dati di produzione, da persone il cui output nessuno a valle ha accettato di mantenere.** Posta così, molti dibattiti sul rollout si risolvono da soli.

## Il centro di costo che nessuno mette a budget: la coda di review

Rileggi la descrizione di luglio: il personale non tecnico costruiva cose e le passava a uno dei 12.000 ingegneri «per migliorarle».

Quel passaggio è la vera economia unitaria del rollout, ed è invisibile nel business case. Il costo dei posti è visibile. Il costo dei token è visibile, e per quello esistono i [tetti di spesa rigidi](/docs/models/hard-spend-caps). Le ore di ingegneria necessarie per rivedere, rendere robusti, prendere in carico e mantenere un flusso di prototipi costruiti da persone che non sanno leggere il codice non sono visibili a chi ha approvato i posti, perché cadono sul trimestre di un altro team.

L'aritmetica è impietosa. Supponi che 2.000 non ingegneri producano ciascuno un artefatto degno di essere inoltrato al mese — un tasso prudente per una popolazione entusiasta. Sono 2.000 elementi al mese che arrivano a un'organizzazione di ingegneria che non li aveva pianificati. A quattro ore ciascuno per rivedere, rendere robusto e prendere in carico, fanno 8.000 ore-ingegnere al mese, cioè circa 50 ingegneri a tempo pieno assorbiti dall'intake. Su 12.000 ingegneri è sostenibile; come sorpresa no, e non compra nulla che compaia nella roadmap di ingegneria.

Tre proprietà rendono questa coda peggiore di un normale backlog:

<Steps items={[
  {title: "In pratica non si può rifiutare", body: "L'artefatto funziona già per chi l'ha fatto, che spesso è più senior di chi lo rivede e lo ha già mostrato al proprio desk. «No» diventa un atto politico e non una decisione di triage. I backlog che non puoi rifiutare non sono backlog, sono obblighi."},
  {title: "L'autore non può correggere i rilievi della review", body: "La review normale è una conversazione tra due persone che sanno entrambe leggere il diff. Qui ogni rilievo si trasforma in lavoro di ingegneria e non in rilavorazione dell'autore. Chi rivede non riduce il proprio carico rivedendo bene — lo aumenta."},
  {title: "La proprietà non si trasferisce, si accumula", body: "Una volta che un ingegnere ci mette le mani, diventa suo. L'autore originale continua a chiedere modifiche e a dipenderne, ma la reperibilità, gli aggiornamenti delle dipendenze e gli incidenti restano al team che ha «aiutato». Ogni prototipo inoltrato è una passività permanente senza un budget di manutenzione associato."}
]} />

Se porti a casa una sola azione da questa pagina, sia questa: **prima di allargare l'accesso, chiedi all'organizzazione di ingegneria che erediterà l'output di concordare per iscritto un tasso di intake, con una via per rifiutare.** Un rollout che non sa rispondere a «chi mantiene ciò che queste persone costruiscono, e cosa succede quando dicono di no» non è un rollout, è una discussione rimandata.

## Il problema dei micro-modelli

Per le aziende dei settori regolamentati c'è un secondo problema, più acuto, ed è quello che ha più probabilità di far chiudere un rollout all'improvviso.

Un trader che chiede a un agente di «simulare come si muove il mio book se la curva si irripidisce di 50bp» non ha scritto uno script. Ha costruito un modello — nel senso preciso e portante in cui lo usano le autorità di vigilanza finanziaria. La storica guida di vigilanza USA definisce un modello come un metodo, sistema o approccio quantitativo che applica teorie statistiche, economiche, finanziarie o matematiche per trasformare dati in input in stime quantitative. Uno script di simulazione delle posizioni scritto in un pomeriggio rientra comodamente in quella definizione. Così come un helper di instradamento delle approvazioni che applica criteri ponderati per segnalare una transazione con una controparte, o un controllo di idoneità che assegna un punteggio per stabilire se un cliente ha diritto a un'offerta.

I modelli in questo senso dovrebbero vivere in un inventario dei modelli, con documentazione, validazione indipendente e storico delle modifiche. La pratica del model risk management è nata per un mondo in cui i modelli erano pochi, costosi e distinti — prodotti da team quant identificabili con un ciclo di rilascio abbastanza lento da permettere alla funzione di validazione di starci dietro.

Un agente di coding in mano a 2.000 non ingegneri ribalta ognuna di queste assunzioni. Gli artefatti sono economici, numerosi, non documentati, non versionati e prodotti da persone che non sanno che la parola «modello» ora vale anche per loro. È il **problema dei micro-modelli**: logica decisionale che soddisfa la definizione regolamentare di modello, creata più in fretta di quanto qualunque funzione di validazione riesca a inventariare, da autori che non si sono mai posti la domanda. Il vuoto di governance non è che l'output sia scadente. È che nessuno sa enumerare ciò che esiste.

Anche il terreno della vigilanza si è spostato nel 2026, il che conta per chiunque citi articolo e comma. Il **17 aprile 2026** la Federal Reserve ha emesso la **SR 26-2, «Revised Guidance on Model Risk Management»**, che sostituisce la **SR 11-7** (4 aprile 2011) e la **SR 21-8** (9 aprile 2021). Se la tua policy interna, la presentazione di compliance di un fornitore o un post di blog su cui ti appoggi cita ancora la SR 11-7 come vigente, è superata da oltre sei mesi.

<VerifyNote lastVerified="2026-11-09" source="https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm">
L'esistenza della SR 26-2, la sua data e le lettere che sostituisce sono confermate dall'indice delle SR letter della Federal Reserve. Diversi approfondimenti secondari avanzano affermazioni specifiche su come la SR 26-2 tratti l'AI generativa e agentica nel proprio ambito; non siamo riusciti a confermarle sulla lettera originale e le abbiamo volutamente omesse. Leggi tu stesso la lettera e il suo allegato prima di costruire un controllo su un'affermazione di ambito, e fai lo stesso fare a un legale — nulla qui è consulenza legale o di compliance.
</VerifyNote>

## Due divieti diversi, di solito confusi

Cerca la copertura sulle restrizioni AI delle banche nel 2026 e troverai due storie fuse in una. Non sono lo stesso problema e non hanno lo stesso rimedio.

| | Agenti di coding interni | Agenti di terzi sui conti dei clienti |
|---|---|---|
| Esempio | Goldman Sachs limita Claude Code e Copilot agli ingegneri | JPMorgan, Bank of America e Citi limitano l'accesso degli agenti AI esterni ai conti dei clienti |
| Chi agisce | I tuoi dipendenti, dentro il tuo perimetro | Software che agisce per conto di un cliente, fuori dal tuo perimetro |
| Il timore | Logica non rivista, barriere sui dati, verificabilità del codice scritto da macchine | Transazioni non autorizzate e accesso con credenziali su scala — i «rogue agents» di Jamie Dimon, di cui «potrebbero essercene migliaia» |
| Controllo tipico | Limitazione degli accessi, policy gestita, gate di review | Limitazione in sola lettura al confine dell'API — Muse di Meta, per esempio, può leggere il saldo di un conto Chase ma non spostare denaro |
| Dove approfondire | Questa pagina | [Proteggere gli agenti](/docs/security/securing-agents) · [Pagamenti degli agenti e x402](/docs/models/agent-payments-x402-and-agentcore) |

Il CEO di Bank of America ha detto che l'azienda ha assunto 1.000 collaboratori esterni per correggere il software dalle vulnerabilità esposte agli agenti — è la seconda colonna, non la prima. Se lo citi in un memo interno sul dare Claude Code ai tuoi analisti, hai citato la cosa sbagliata, e la prima persona che se ne accorge ti costerà credibilità.

Un'altra informazione di contesto da tenere presente, perché va contro la lettura facile: Goldman Sachs è lead-left underwriter dell'IPO di Anthropic, con l'S-1 depositato il 26 ottobre 2026 e il roadshow atteso nella settimana del 9 novembre 2026. Un'azienda che restringe l'accesso interno a un prodotto mentre ne cura la quotazione non è una contraddizione. È la prova che la decisione riguardava **l'ambito del dispiegamento** e non un verdetto sullo strumento — ed è esattamente come dovresti leggere qualunque restrizione simile, compresa la tua.

## La scala delle capacità: abbina la superficie al lavoro

L'istinto, dopo aver letto quanto sopra, è limitare per qualifica. È quello che ha fatto Goldman, e per un'azienda con 12.000 ingegneri e un ispettore di vigilanza è uno strumento rozzo ma difendibile. Per tutti gli altri è di solito la prima mossa sbagliata, perché toglie la capacità senza togliere la domanda — e la domanda inevasa di analisi AI non evapora, si sposta su un account personale su un portatile personale dove non hai alcuna telemetria.

Limita invece per lavoro. Gran parte di ciò che i non ingegneri vogliono da un agente di coding è disponibile su una superficie che non genera code di review né micro-modelli.

| Il lavoro | Superficie giusta | Perché è quella giusta |
|---|---|---|
| Analizzare un dataset, fare un grafico | App Claude con caricamento file e il suo strumento di analisi | Effimero, nessun repo, nessun artefatto da mantenere. Vedi [Analisi dei dati](/docs/playbooks/data-analysis) |
| Redigere documenti, presentazioni, visual | App Claude, Projects | Non ha mai richiesto un agente di coding. Vedi [Business e strategia](/docs/playbooks/business) |
| Interrogare sistemi autorizzati | Server MCP in sola lettura gestito da te | Controlli tu lo schema, l'ambito e il log. Vedi [Proteggere i server MCP](/docs/security/securing-mcp-servers) |
| Riusare un'analisi ricorrente | Una skill o un prompt salvato costruito una volta dall'ingegneria | Trasforma 200 micro-modelli ad hoc in un unico artefatto rivisto. Vedi [Skills](/docs/claude-code/skills) |
| Prototipare qualcosa che deve diventare software vero | Agente di coding, con un percorso di intake dichiarato | È l'unico gradino che genera legittimamente lavoro di review — quindi rendi esplicita la coda |
| Operare su dati di produzione o denaro | Niente in self-service | Vedi [La scala della fiducia](/docs/frontiers/the-trust-ladder) |

La scala ha una proprietà da notare: il gradino più alto è l'unico che produce un obbligo di manutenzione, e i cinque sotto assorbono la maggior parte della domanda reale. Le aziende che saltano la scala e distribuiscono un agente di coding come offerta AI generalista pagano prezzi da review di ingegneria per un lavoro che una superficie di chat gestisce gratis.

## Controlli che applicano, e controlli che si limitano a sembrarlo

Se un agente di coding lo distribuisci davvero a una popolazione ampia, la distinzione qui sotto è quella che sfugge nei piani di rollout — anche a chi ha letto la documentazione.

<Steps items={[
  {title: "Le impostazioni gestite applicano. Le impostazioni gestite dal server sono una comodità.", body: "Un managed-settings.json distribuito dal tuo strumento di gestione dei dispositivi sta in cima alla pila di precedenza e non si può sovrascrivere in locale. Le impostazioni servite dalla tua organizzazione claude.ai raggiungono solo le sessioni che si sono già autenticate nella tua organizzazione — quindi non arrivano mai alla macchina che ha fatto login con un account personale, che è proprio quella che ti preoccupava. La documentazione di Anthropic stessa dice di trattare un elenco gestito dal server come una comodità per le macchine che non puoi raggiungere con la gestione dei dispositivi, non come un'applicazione forzata. Pianifica di conseguenza: l'MDM è il controllo, la copia lato server è il ripiego."},
  {title: "forceLoginOrgUUID è ciò che chiude la falla dell'account personale", body: "Senza, uno sviluppatore può accedere con un account claude.ai personale e la tua organizzazione non vede nulla: niente telemetria, niente policy, niente audit trail, e i tuoi dati escono da un account consumer. Impostare forceLoginMethod e forceLoginOrgUUID nelle impostazioni gestite fa sì che Claude Code rifiuti un login appartenente a qualunque organizzazione non elencata, e che all'avvio termini se la credenziale in uso ne appartiene a una. È la chiave a più alta leva del file."},
  {title: "allowedProviders decide attraverso quali servizi la macchina può raggiungere Claude", body: "Questione separata da quale account si usa. Elenca i percorsi consentiti — l'API Anthropic, Amazon Bedrock, un gateway — e rifiuta all'avvio una sessione configurata per qualcos'altro, o alla richiesta successiva se cambia a metà sessione. Richiede Claude Code v2.1.285 o successivo. È la chiave che impedisce al traffico di deviare in silenzio attraverso un proxy non approvato; vedi i [proxy AI del mercato grigio](/docs/security/gray-market-ai-proxies) per capire perché conta."},
  {title: "Le credenziali d'ambiente sono rifiutate, non solo sconsigliate", body: "Con queste chiavi, Claude Code blocca le sessioni che si autenticano con ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN o apiKeyHelper — anche quando sono le impostazioni gestite stesse a fornirle — perché l'appartenenza all'organizzazione non è verificabile per una credenziale d'ambiente. Utile saperlo prima di scoprirlo come ticket di supporto da ogni job di CI che possiedi."},
  {title: "I permessi sono un gate per repo, non per popolazione", body: "Le regole allow e deny sono lo strumento giusto per ciò che un agente può fare in un dato progetto. Sono lo strumento sbagliato per stabilire chi può eseguire un agente. Non lasciare che una deny list ben scritta sostituisca una decisione di accesso. Vedi Permessi e la pila di precedenza in Impostazioni."}
]} />

<PromptCard title="managed-settings.json — la base di applicazione, distribuita via MDM">{`{
  "forceLoginMethod": "claudeai",
  "forceLoginOrgUUID": ["00000000-0000-0000-0000-000000000000"],
  "allowedProviders": ["anthropic", "bedrock"],
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.internal.example.com:4317",
    "OTEL_LOG_TOOL_DETAILS": "1"
  }
}`}</PromptCard>

Sostituisci l'UUID con l'ID della tua organizzazione dalle impostazioni di amministrazione, e l'endpoint con il tuo collector. Fissare le variabili di telemetria nel blocco `env` gestito conta: una destinazione impostata lì è bloccata, e Claude Code rimuove all'avvio le variabili in conflitto impostate dagli sviluppatori. Una destinazione che uno sviluppatore può cambiare non è un audit trail.

## La trappola dell'audit trail che ti metterà in imbarazzo in una review

Questa vale il prezzo del biglietto, perché è il divario tra ciò che dichiarano i piani di rollout e ciò che contengono i dati.

Claude Code esporta un insieme davvero utile di metriche OpenTelemetry — `claude_code.session.count`, `claude_code.lines_of_code.count`, `claude_code.commit.count`, `claude_code.pull_request.count`, `claude_code.cost.usage`, `claude_code.code_edit_tool.decision`, `claude_code.active_time.total` — con attributi tra cui `user.email`, `user.account_uuid` e `organization.id`. L'attribuzione dei costi per utente e il tempo attivo per utente sono disponibili di serie. Per il quadro completo vedi il [tracing OpenTelemetry](/docs/api/opentelemetry-tracing) e le [analisi di utilizzo e costi](/docs/api/usage-cost-analytics).

Ma **metriche ed eventi sono oscurati per impostazione predefinita**, e l'oscuramento è più aggressivo di quanto la maggior parte delle persone si aspetti:

- I nomi dei server e degli strumenti MCP compaiono come `"custom"` o `"mcp"` — senza nome dello strumento — a meno che non sia impostato `OTEL_LOG_TOOL_DETAILS=1`. Un'organizzazione che crede di avere traccia di quali sistemi interni hanno toccato i suoi agenti ha, di default, una traccia che dice `mcp`.
- Il contenuto dei prompt, le risposte dell'assistente e i system prompt richiedono `OTEL_LOG_USER_PROMPTS=1`.
- L'output degli strumenti — letture di file, output dei comandi — richiede `OTEL_LOG_TOOL_CONTENT=1`.
- Anche i comandi Bash e i percorsi dei file stanno dietro `OTEL_LOG_TOOL_DETAILS=1`.
- **Non esiste una dashboard di amministrazione integrata.** Esporti verso il tuo backend di osservabilità e costruisci tu la vista. Mettilo a budget; è il passaggio che in silenzio non succede.

Il default è quello giusto — protegge i dipendenti da una sorveglianza casuale, e `claude_code.safety_event` registra comunque controlli e blocchi dei permessi senza esporre il contenuto. Ma significa che la frase «abbiamo piena verificabilità» è falsa su un'installazione predefinita, e il momento più economico per scoprirlo è adesso e non durante un'ispezione. Attivare i flag è una decisione con un vero peso sulla privacy: di' alle persone cosa registri, concorda un periodo di conservazione e tieni spenti i flag sul contenuto a meno che un obbligo preciso non li richieda. Vedi [cosa carica il tuo agente](/docs/security/what-your-agent-uploads) per la vista lato dipendente della stessa questione.

## Cinque domande a cui rispondere prima di allargare l'accesso

Non un modello di maturità. Cinque domande la cui mancanza di risposta prevede un'inversione di rotta quattro mesi dopo.

<Steps items={[
  {title: "Quali dei tre lavori chiedono davvero le persone?", body: "Chiedilo a dieci di loro. Se le risposte sono analisi, redazione e interrogazione — e di solito lo sono — un agente di coding è il gradino sbagliato della scala e puoi saltare gran parte di questa pagina."},
  {title: "Chi ha accettato di ereditare l'output, a che ritmo, con quale diritto di rifiuto?", body: "Per iscritto, dal responsabile di ingegneria sul cui team ricade. Se nessuno ha accettato, hai messo a budget i posti e non il costo."},
  {title: "Riesci a enumerare ciò che viene costruito?", body: "Se gli artefatti vivono sui portatili, la risposta è no, e in un contesto regolamentato un no è un rilievo. Un repo o workspace autorizzato per popolazione è il minimo che rende possibile l'enumerazione."},
  {title: "La policy è applicata via MDM o solo pubblicata?", body: "Un managed-settings.json distribuito con forceLoginOrgUUID, oppure una pagina wiki. Solo una delle due sopravvive a un utente determinato con un account personale."},
  {title: "Cosa contiene davvero la tua telemetria?", body: "Non ciò che offre l'elenco delle metriche — ciò che il tuo collector ha ricevuto la settimana scorsa. Interrogalo prima di dichiararlo. Se i nomi degli strumenti MCP tornano come 'mcp', sai quale flag non hai impostato."}
]} />

<Flashcards title="Vocabolario del rollout" cards={[
  {front: "Problema dei micro-modelli", back: "Logica decisionale che soddisfa la definizione regolamentare di modello — metodo statistico o finanziario che trasforma input in stime quantitative — creata più in fretta di quanto qualunque funzione di validazione riesca a inventariare, da autori che non sanno che la parola si applica a loro."},
  {front: "SR 26-2", back: "«Revised Guidance on Model Risk Management» della Federal Reserve, 17 aprile 2026. Sostituisce la SR 11-7 (2011) e la SR 21-8 (2021). Le policy che citano ancora la SR 11-7 come vigente sono superate."},
  {front: "forceLoginOrgUUID", back: "Chiave delle impostazioni gestite che fa rifiutare a Claude Code i login claude.ai fuori dalle tue organizzazioni elencate e lo fa terminare all'avvio se la credenziale attiva ne appartiene a una. Chiude la falla di telemetria dell'account personale."},
  {front: "allowedProviders", back: "Elenco, nelle impostazioni gestite, dei servizi attraverso cui una macchina può raggiungere Claude (anthropic, bedrock, customEndpoint, …). Rifiuta all'avvio gli altri provider. Claude Code v2.1.285+."},
  {front: "Impostazioni gestite dal server", back: "Impostazioni servite dalla tua organizzazione claude.ai. Raggiungono solo le sessioni già autenticate in essa — una comodità per le macchine irraggiungibili, esplicitamente non un meccanismo di applicazione."},
  {front: "OTEL_LOG_TOOL_DETAILS", back: "Flag che rivela comandi Bash, percorsi di file e nomi di server e strumenti MCP nella telemetria. Senza, compaiono come 'custom' o 'mcp' — senza nomi di strumenti."},
  {front: "La coda di review", back: "Il vero centro di costo di un rollout ampio di agenti di coding: ore di ingegneri per rivedere, rendere robusti e prendere in carico prototipi costruiti da persone che non sanno leggere il codice. Non rifiutabile, non rimandabile indietro, in accumulo permanente."},
  {front: "Scala delle capacità", back: "Limita per lavoro, non per qualifica. Superficie di chat, MCP in sola lettura, skill condivise e prompt autorizzati assorbono la maggior parte della domanda; solo il gradino del prototipo crea un obbligo di manutenzione."}
]} />

<Quiz title="Verifica te stesso" questions={[
  {
    q: "Per cosa usavano gli agenti di coding, secondo le cronache, i trader e i banker di Goldman?",
    options: [
      "Per rilasciare sistemi di trading di produzione senza review",
      "Per seguire i flussi dei clienti, simulare variazioni di mercato e di posizioni, e redigere testi e visual",
      "Per scrivere strumenti di compliance interni per il team di model risk",
      "Per addestrare modelli proprietari sui dati dei clienti"
    ],
    answer: 1,
    explain: "Tutti e tre i lavori riportati — analisi dei flussi dei clienti, simulazione delle posizioni e redazione di contenuti — sono lavoro di analisi e documentazione, non ingegneria del software. L'agente di coding era il veicolo, ed è per questo che «i non ingegneri devono programmare?» è la cornice sbagliata della decisione."
  },
  {
    q: "In un rollout ampio a chi non è ingegnere, quale costo viene più spesso lasciato fuori dal business case?",
    options: [
      "Il costo di licenza per posto",
      "La spesa in token durante le lunghe esecuzioni dell'agente",
      "Le ore degli ingegneri per rivedere, rendere robusti e prendere in carico gli artefatti che i non ingegneri inoltrano",
      "Gli strumenti di gestione dei dispositivi per distribuire le impostazioni gestite"
    ],
    answer: 2,
    explain: "Posti e token sono visibili e si possono limitare. La coda di review cade sul trimestre di un altro team, non si rifiuta facilmente perché l'artefatto funziona già per un autore senior, e trasforma ogni rilievo di review in lavoro di ingegneria e non in rilavorazione dell'autore."
  },
  {
    q: "Pubblichi una policy per Claude Code come impostazioni gestite dal server dalla tua organizzazione claude.ai. Qual è la lacuna?",
    options: [
      "Nessuna — le impostazioni gestite dal server stanno in cima alla pila di precedenza",
      "Raggiungono solo le sessioni già autenticate nella tua organizzazione, quindi mancano la macchina con accesso tramite account personale",
      "Vengono sovrascritte dal file di impostazioni committato di qualunque progetto",
      "Si applicano solo alle sessioni cloud e mai alla CLI da terminale"
    ],
    answer: 1,
    explain: "Uno sviluppatore riceve le impostazioni gestite dal server solo dopo essersi autenticato nella tua organizzazione — quindi non raggiungono mai la macchina non gestita, con accesso personale, che era il vero rischio. La documentazione di Anthropic definisce un elenco gestito dal server una comodità per le macchine che non puoi raggiungere con la gestione dei dispositivi, non un'applicazione forzata. Per quello distribuisci via MDM un managed-settings.json con forceLoginOrgUUID."
  },
  {
    q: "In un'installazione predefinita con la telemetria attiva, come appaiono nei log i nomi dei server e degli strumenti MCP?",
    options: [
      "Nomi completi di server e strumento, sempre",
      "Solo il nome del server, con il nome dello strumento in hash",
      "'custom' o 'mcp', senza nome dello strumento, finché non si imposta OTEL_LOG_TOOL_DETAILS=1",
      "Non sono mai esportabili in nessuna configurazione"
    ],
    answer: 2,
    explain: "Metriche ed eventi sono oscurati per impostazione predefinita. I nomi dei server e degli strumenti MCP vengono registrati come 'custom' o 'mcp' a meno di OTEL_LOG_TOOL_DETAILS=1. Quindi un'organizzazione che crede di poter mostrare quali sistemi interni hanno toccato i suoi agenti ha, di default, un log che dice 'mcp' — meglio scoprirlo prima di un audit che durante."
  },
  {
    q: "Quale guida di vigilanza USA sul model risk management è in vigore a fine 2026?",
    options: [
      "SR 11-7, emessa il 4 aprile 2011",
      "SR 21-8, emessa il 9 aprile 2021",
      "SR 26-2, emessa il 17 aprile 2026, che sostituisce sia la SR 11-7 sia la SR 21-8",
      "Non esiste alcuna guida di vigilanza sul model risk management"
    ],
    answer: 2,
    explain: "La SR 26-2, «Revised Guidance on Model Risk Management», datata 17 aprile 2026, sostituisce la SR 11-7 (2011) e la SR 21-8 (2021). Parecchio materiale dei fornitori e molte policy interne citano ancora la SR 11-7 come vigente. Leggi la lettera e il suo allegato invece di un riassunto, e per la compliance rivolgiti a un legale."
  },
  {
    q: "Perché limitare un agente di coding solo per qualifica è spesso la prima mossa sbagliata?",
    options: [
      "Perché le qualifiche non sono disponibili nella telemetria di Claude Code",
      "Perché toglie la capacità senza togliere la domanda, che si sposta su account personali dove non hai alcuna telemetria",
      "Perché le impostazioni gestite non possono esprimere regole basate sul ruolo",
      "Perché i regolatori richiedono parità di accesso agli strumenti tra le popolazioni"
    ],
    answer: 1,
    explain: "La domanda inevasa di analisi AI non evapora — si sposta su un account personale su un portatile personale, che è strettamente peggio sia per la governance sia per la verificabilità. Limita invece per lavoro: una superficie di chat, MCP in sola lettura e skill condivise assorbono la maggior parte della domanda reale senza generare code di review né micro-modelli."
  }
]} />

<Callout type="takeaways" items={[
  "I tre lavori che i non ingegneri portano a un agente di coding — analisi, modellazione, redazione — non sono programmazione. Decidi su quei lavori, non sulle qualifiche.",
  "Un agente di coding vince spesso per merito perché il percorso di analisi autorizzato è lento. Sistema il collo di bottiglia o l'aggiramento continua dopo qualunque divieto.",
  "Il vero costo del rollout è la coda di review degli ingegneri: non rifiutabile, non rimandabile indietro, in accumulo permanente. Ottieni per iscritto un tasso di intake e un diritto di rifiuto prima di allargare l'accesso.",
  "Problema dei micro-modelli: la logica ad hoc su posizioni e idoneità può soddisfare la definizione di modello della vigilanza. Il vuoto non è la qualità, è che nessuno sa enumerare ciò che esiste.",
  "La SR 26-2 (17 aprile 2026) sostituisce la SR 11-7 e la SR 21-8. Aggiorna ogni policy che cita ancora la SR 11-7 come vigente — e verifica le affermazioni di ambito sulla lettera originale.",
  "Strumenti di coding interni e agenti di terzi sui conti dei clienti sono due storie bancarie diverse del 2026. Non citare una come prova sull'altra.",
  "Le impostazioni gestite via MDM applicano; quelle gestite dal server sono esplicitamente una comodità. forceLoginOrgUUID è la chiave che chiude la falla dell'account personale; allowedProviders fissa il percorso.",
  "La telemetria è oscurata per impostazione predefinita — i nomi degli strumenti MCP compaiono come 'mcp'. Interroga il tuo collector prima di dichiarare la verificabilità, e tratta i flag sul contenuto come una decisione sulla privacy, non come una casella da spuntare."
]} />

## Fonti e letture di approfondimento

- [Techstrong.ai: Goldman Sachs cuts bankers, traders off from AI coding tools over risk concerns](https://techstrong.ai/agentic-ai/goldman-sachs-cuts-bankers-traders-off-from-ai-coding-tools-over-risk-concerns/) — l'articolo del 2 novembre 2026 sullo scoop di Bloomberg: l'inversione da luglio a ottobre, la citazione del portavoce, la cifra dei 12.000 ingegneri e le preoccupazioni di governance citate.
- [PYMNTS: Goldman Sachs bars bankers from employing some AI tools](https://www.pymnts.com/news/artificial-intelligence/2026/goldman-sachs-bars-bankers-from-employing-some-ai-tools/) — conferma indipendente, e il dettaglio di Argenti «passed on their creations to one of the firm's 12,000 engineers to enhance» su cui si regge la sezione sulla coda di review.
- [Federal Reserve: SR letters index](https://www.federalreserve.gov/supervisionreg/srletters/srletters.htm) e [SR 26-2, Revised Guidance on Model Risk Management](https://www.federalreserve.gov/supervisionreg/srletters/sr2602.htm) — la fonte primaria per la data del 17 aprile 2026 e per le lettere sostituite. Leggi l'allegato per la definizione di modello e il linguaggio sull'ambito.
- [Axios: Unvetted AI agents are accessing U.S. bank accounts](https://www.axios.com/2026/10/22/ai-agents-banks-unauthorized-accounts-access) — l'altra storia bancaria AI del 2026, quella sugli agenti di terzi al confine del conto cliente.
- [Claude Code: monitoring usage](https://code.claude.com/docs/en/monitoring-usage) — l'elenco autorevole di metriche, eventi e attributi, i flag `OTEL_LOG_*` e cosa rivela esattamente ciascuno, e l'affermazione che non esiste una dashboard di amministrazione integrata.
- [Claude Code: authentication and IAM](https://code.claude.com/docs/en/iam) — `forceLoginMethod`, `forceLoginOrgUUID`, `allowedProviders`, l'elenco di precedenza delle credenziali e le regole sulle credenziali d'ambiente bloccate.
- [Claude Code: managed settings](https://code.claude.com/docs/en/managed-settings) e [server-managed settings](https://code.claude.com/docs/en/server-managed-settings) — la pila di precedenza, e la caratterizzazione esplicita di «comodità, non applicazione» per gli elenchi gestiti dal server.
- Pagine correlate di AILmanac: [Impostazioni e precedenza](/docs/claude-code/settings) · [Permessi](/docs/claude-code/permissions) · [CI/CD per codice scritto dagli agenti](/docs/playbooks/ci-for-agent-written-code) · [Tetti di spesa rigidi](/docs/models/hard-spend-caps)

## Prossimi passi

- [CI/CD per codice scritto dagli agenti](/docs/playbooks/ci-for-agent-written-code) — la metà a valle del problema della coda di review: quando gli artefatti arrivano davvero alla tua pipeline, la merge queue si rompe prima del budget dei runner, e c'è un'aritmetica per questo.
- [La scala della fiducia](/docs/frontiers/the-trust-ladder) — la versione generale della scala delle capacità qui sopra: quanta autonomia concedere a un agente, graduata su ciò che sei in grado di verificare.
- [Valutare gli agenti](/docs/playbooks/evaluating-agents) — come decidere se il rollout sta producendo valore davvero, prima che qualcun altro decida che non lo sta facendo.
