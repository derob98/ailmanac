# Server MCP in Claude Code

> Source: https://derob98.github.io/ailmanac/it/docs/claude-code/mcp · AILmanac (CC BY 4.0) · last verified 2026-11-10

Collega database, GitHub, browser e altro tramite il Model Context Protocol.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-11-10" source="https://code.claude.com/docs/en/mcp">
I comandi `claude mcp`, gli scope di configurazione e i trasporti evolvono nel tempo — verifica nella documentazione ufficiale di Claude Code MCP e su modelcontextprotocol.io. I quattro trasporti, i percorsi di archiviazione degli scope, la deprecazione di SSE e il comportamento dell'approvazione di progetto qui sotto provengono da quella pagina.
</VerifyNote>

Il **Model Context Protocol (MCP)** è uno standard aperto per collegare l'IA a strumenti e dati esterni. Un **server MCP** espone delle capacità (interrogare un database, aprire una PR su GitHub, pilotare un browser); Claude Code si collega al server e può **chiamare quegli strumenti** durante una sessione. È il modo per estendere Claude oltre il tuo filesystem e la tua shell.

<Callout type="objectives" items={["Spiegare che cos'è un server MCP e come Claude Code ne chiama gli strumenti", "Distinguere i due trasporti: stdio locale e HTTP/SSE remoto", "Aggiungere un server con claude mcp add e leggere il JSON che scrive", "Scegliere lo scope giusto (local, project, user) in base a chi deve vedere un server", "Collegare un vero database a Claude end-to-end", "Evitare le trappole di sicurezza e di configurazione in cui cadono quasi tutti"]} />

## La struttura

```mermaid
flowchart LR
  CC[Claude Code] -- calls tool --> S[MCP server]
  S -- result --> CC
  S --- D[(DB / API / Browser / SaaS)]
```

Dichiari i server che Claude può usare; ogni server pubblica un insieme di strumenti con i relativi schemi; Claude li sceglie e li chiama come qualsiasi altro strumento.

<Flashcards title="Vocabolario MCP" cards={[{front: "Model Context Protocol (MCP)", back: "Uno standard aperto per collegare l'IA a strumenti e dati esterni."}, {front: "Server MCP", back: "Un programma che espone capacità — interrogare un database, aprire una PR su GitHub, pilotare un browser — come strumenti richiamabili."}, {front: "Strumento (tool)", back: "Una capacità che un server MCP pubblica con uno schema; Claude la sceglie e la chiama come qualsiasi altro strumento."}, {front: "Trasporto (transport)", back: "Il modo in cui Claude raggiunge un server: stdio (processo locale), HTTP (ospitato, spesso con OAuth), SSE (deprecato — HTTP vi ricade in automatico) oppure WebSocket ws/wss (persistente, con push, solo autenticazione via header, nessun flag --transport)."}, {front: "Scope", back: "Chi vede un server: local (tu, questo progetto), project (il team, tramite commit) o user (tu, ovunque)."}]} />

## Trasporti

Ci sono quattro modi in cui Claude raggiunge un server. Scegli in base a dove gira il server e a come comunica.

- **stdio** — un processo locale che Claude avvia (ottimo per strumenti e CLI locali). È ciò che significa una voce JSON senza `type`.
- **HTTP** — un server ospitato, spesso con OAuth. La scelta predefinita per tutto ciò che è remoto.
- **SSE** — **deprecato**; usa HTTP dove puoi. Alcuni servizi espongono ancora solo un endpoint SSE e, da Claude Code v2.1.265, `--transport http` prova prima HTTP e passa da solo a SSE, quindi raramente serve indicare `--transport sse` in modo esplicito.
- **WebSocket** (`ws` / `wss`) — una connessione bidirezionale persistente, per un server che invia eventi senza essere interrogato. `--transport` *non* accetta `ws`: aggiungilo con `claude mcp add-json '{"type":"ws","url":"wss://…"}'` oppure scrivilo in `.mcp.json`. Niente OAuth — l'autenticazione avviene solo tramite header.

<Callout type="warning" items={["Una voce JSON con url ma senza type è un errore di configurazione, non un default sensato: Claude Code legge una voce senza type come server stdio, la salta e segnala che ha un \"url\" ma nessun \"type\". Imposta sempre \"type\": \"http\" (oppure \"sse\" / \"ws\") su un server remoto che scrivi a mano."]} />

## Configurare i server

Il percorso più rapido è il comando `claude mcp add`: scrive la configurazione al posto tuo. Segui questa sequenza per passare da zero a un server connesso.

<Steps items={[{title: "Aggiungi un server stdio locale", body: "Esegui claude mcp add — tutto ciò che segue il -- è il comando di avvio che Claude esegue per te."}, {title: "Oppure aggiungi un server HTTP remoto", body: "Passa --transport http e uno scope, poi l'URL del server. I server remoti sono spesso ospitati e usano OAuth."}, {title: "Controlla cosa è connesso", body: "Esegui claude mcp list per vedere i server configurati e il loro stato di connessione."}, {title: "Ispeziona e autenticati", body: "Usa /mcp dentro una sessione per ispezionare gli strumenti di un server e autenticare i server remoti."}]} />

<PromptCard title="Aggiungi un server stdio locale">{`# A local stdio server (everything after -- is the launch command)
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/code/myproject`}</PromptCard>

<PromptCard title="Aggiungi un server HTTP remoto (condiviso con il progetto)">{`# A remote HTTP server, shared with everyone on the project
claude mcp add --transport http --scope project github https://api.githubcopilot.com/mcp/`}</PromptCard>

In realtà è solo JSON. Un server con scope **project** finisce in un file `.mcp.json` nella radice del repo — fai il commit e i tuoi colleghi ottengono gli stessi strumenti non appena si fidano dello spazio di lavoro:

```json
{
  "mcpServers": {
    "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/" }
  }
}
```

<Callout type="warning" items={["Non cercare i pacchetti @modelcontextprotocol/server-github, -postgres, -slack o -puppeteer che trovi nei vecchi tutorial. Sono archiviati e hanno un avviso di deprecazione npm che dice \"Archived and unmaintained; no security guarantees\". Usa il server del fornitore, dove esiste — quello di GitHub è l'endpoint HTTP qui sopra, e il controllo del browser è passato a @playwright/mcp. Tra i server di riferimento in TypeScript sono ancora mantenuti solo filesystem, memory, everything e sequential-thinking."]} />

### Lo scope decide chi vede il server

| Scope | Salvato in | Si carica in | Usalo per |
|---|---|---|---|
| `local` (predefinito) | `~/.claude.json`, sotto il percorso di questo progetto | solo questo progetto | esperimenti personali, segreti |
| `project` | `.mcp.json` nel repo (con commit) | solo questo progetto, condiviso con il team | strumenti che tutto il team deve condividere |
| `user` | `~/.claude.json` | tutti i tuoi progetti | server che vuoi ovunque |

<Callout type="warning" items={["Lo \"scope local\" di MCP non è la stessa cosa delle impostazioni locali. Un server MCP con scope local vive in ~/.claude.json nella tua home — NON nel file .claude/settings.local.json del progetto. Cercarlo nella cartella del progetto è un vicolo cieco."]} />

Esegui `claude mcp list` per vedere cosa è connesso e `/mcp` dentro una sessione per ispezionare gli strumenti e autenticare i server remoti. Per punti di partenza da copiare e incollare vedi [Configurazione MCP e scaffold di server](/docs/templates/mcp-config).

## Esempio pratico: dai a Claude il tuo database

Supponi di voler far rispondere Claude a domande su un Postgres locale, invece di incollare tu i risultati delle query. Aggiungi il server con scope project, così lo ottengono anche i colleghi.

I database sono il punto in cui il problema dei server archiviati si sente di più: il vecchio `@modelcontextprotocol/server-postgres` non è più mantenuto e non esiste un sostituto ufficiale, quindi il nome del pacchetto è l'unica decisione che devi prendere da solo. Scegli un server della community mantenuto, [rivedilo](/docs/security/reviewing-third-party-code), poi collegalo — la forma è la stessa qualunque tu scelga:

<PromptCard title="Aggiungi un server Postgres con scope project">{`# Replace the package with a maintained Postgres MCP server you have reviewed.
# The connection string is read-only on purpose — see below.
claude mcp add --scope project db -- npx -y <postgres-mcp-server> "postgresql://readonly@localhost/app"`}</PromptCard>

Ora in una sessione puoi fare la domanda in linguaggio naturale e lasciare che sia Claude a eseguire il ciclo di query:

<PromptCard title="Fai una domanda al database">{`How many users signed up last week? Check the DB.`}</PromptCard>

Claude chiama lo strumento di query che il server pubblica, riceve le righe e risponde — niente copia-incolla. Tieni la stringa di connessione in sola lettura, a meno che Claude non debba davvero scrivere. E se ti serviva una sola query, tieni presente che `psql -c '…'` tramite Bash costa una frazione dei token; [La tassa dei token MCP](/docs/claude-code/mcp-token-cost) spiega quando vince l'uno e quando l'altro.

Poiché ha scope project, un collega che scarica il repo ottiene la stessa capacità — ma **non in silenzio e non subito**. Un server in `.mcp.json` con commit resta in `⏸ Pending approval` finché non esegue `claude` nella cartella e accetta la finestra di dialogo di fiducia dello spazio di lavoro. Un repo clonato non può pre-approvare i propri server: `enableAllProjectMcpServers` o `enabledMcpjsonServers` messi nel `.claude/settings.json` del progetto vengono *ignorati* in una cartella non attendibile. Le approvazioni provenienti da `~/.claude/settings.json` a livello utente, dalle impostazioni gestite o passate con `--settings` valgono invece anche lì. È la risposta abituale a «perché il mio collega non vede il server?»

## Fiducia e sicurezza

<Callout type="warning" items={["Un server MCP esegue codice e può leggere dati e compiere azioni — collega solo server di cui ti fidi.", "Dai a ogni server il minimo privilegio di cui ha bisogno.", "Qualsiasi contenuto esterno restituito da un server può contenere prompt injection.", "Rivedi i server di terze parti prima di collegarli."]} />

:::warning[Tratta i server MCP come se installassi software]
Un server MCP esegue codice e può leggere dati e compiere azioni. Collega solo server di cui ti fidi, dai loro il **minimo privilegio** necessario e ricorda che qualsiasi contenuto esterno che restituiscono può contenere [prompt injection](/docs/security/prompt-injection). Rivedi prima i server di terze parti — vedi [Rivedere il codice di terze parti](/docs/security/reviewing-third-party-code).
:::

## MCP anche nelle app

MCP alimenta anche i **Connettori** nelle app di Claude — stesso standard, superficie diversa. Vedi [Connettori (MCP) nelle app](/docs/claude-app/connectors) e, per l'API, [MCP e collegamento agli strumenti](/docs/api/mcp).

## Errori comuni

- **Scope sbagliato.** Un server aggiunto con scope `local` non comparirà ai colleghi; uno che volevi solo per te non dovrebbe essere committato con scope `project`. Scegli con consapevolezza.
- **Troppi server, troppi strumenti.** La tool search è attiva per impostazione predefinita, quindi un server connesso di norma ti costa a ogni turno i *nomi* dei suoi strumenti e le istruzioni del server anziché gli schemi completi — ma resta comunque una tassa per turno, e gli schemi entrano nel contesto nel momento in cui Claude li cerca. Connetti ciò che serve al compito, non l'intero catalogo. Vedi [La tassa dei token MCP](/docs/claude-code/mcp-token-cost) per i numeri reali, le modalità di `ENABLE_TOOL_SEARCH` e il modo in cui l'esecuzione di codice riduce il secondo costo.
- **Connessioni con troppi privilegi.** Dai a un server di database un ruolo in sola lettura, a meno che Claude non debba davvero scrivere. MCP rende reali le capacità — limitale.
- **Dimenticare il rischio di injection.** Tutto ciò che un server restituisce (una pagina web, il corpo di una issue, una riga) è testo non attendibile che può contenere [prompt injection](/docs/security/prompt-injection). Non collegare un server potente con capacità di scrittura accanto a uno non attendibile con capacità di lettura senza pensarci bene.

<Quiz title="Verifica te stesso" questions={[{q: "Quale trasporto è un processo locale che Claude avvia da sé?", options: ["HTTP/SSE remoto", "stdio", "OAuth"], answer: 1, explain: "stdio è un processo locale che Claude avvia — ideale per strumenti e CLI locali. Gli altri tre sono remoti: HTTP (spesso con OAuth), il deprecato SSE e WebSocket."}, {q: "Dove viene scritto un server con scope project e che cosa deve fare un collega?", options: ["Nelle tue impostazioni utente; solo tu lo vedi", "In un .mcp.json nella radice del repo; dopo aver fatto il pull, deve comunque fidarsi dello spazio di lavoro perché il server esca da Pending approval", "In una cache globale nascosta; nessuno può modificarla"], answer: 1, explain: "Lo scope project finisce in un .mcp.json con commit nella radice del repo. Ma un repo clonato non può approvare i propri server — un enableAllProjectMcpServers committato viene ignorato in una cartella non attendibile, quindi il server resta in Pending approval finché il collega non accetta la finestra di fiducia dello spazio di lavoro."}, {q: "Perché tenere in sola lettura la connessione al database quando Claude deve solo leggere?", options: ["Le query girano più veloci", "Minimo privilegio — MCP rende reali le capacità, quindi non concedere l'accesso in scrittura se non è davvero necessario", "La sola lettura è richiesta dal protocollo"], answer: 1, explain: "Dai ai server il minimo privilegio di cui hanno bisogno. MCP rende reali le capacità, quindi un ruolo in sola lettura evita scritture indesiderate."}]} />

<Callout type="takeaways" items={["MCP è uno standard aperto; un server MCP espone strumenti che Claude Code chiama come qualsiasi altro strumento.", "Quattro trasporti: stdio (un processo che Claude avvia), HTTP (il default per il remoto), SSE (deprecato — HTTP passa a SSE da solo) e WebSocket ws/wss (push, autenticazione via header, solo add-json).", "claude mcp add scrive la configurazione per te; sotto il cofano è JSON. Lo scope project vive in un .mcp.json con commit, e la copia di un collega resta in Pending approval finché non si fida dello spazio di lavoro.", "Lo scope controlla la visibilità: local (tu, questo progetto), project (con commit, per il team), user (tu, ovunque).", "Tratta i server come l'installazione di software: fiducia, minimo privilegio e attenzione alla prompt injection in tutto ciò che restituiscono."]} />

## Prossimi passi

- [Costruisci e collega il tuo primo server MCP (guida passo-passo)](/docs/walkthroughs/first-mcp-server)
- [Configurazione MCP e scaffold di server](/docs/templates/mcp-config)
- [Mettere in sicurezza agenti e strumenti](/docs/security/securing-agents)
