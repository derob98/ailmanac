# Tracing OpenTelemetry di prima parte: due percorsi, una sola traccia

> Source: https://derob98.github.io/ailmanac/it/docs/api/opentelemetry-tracing · AILmanac (CC BY 4.0) · last verified 2026-10-19

Da ottobre 2026 la Claude API e il Claude SDK emettono da soli span OpenTelemetry, senza strumentazione scritta a mano. Ma i due percorsi si sovrappongono, e sommarli entrambi raddoppia i tuoi numeri sui token. Questa pagina copre la configurazione di ciascuno, l'unica regola che mantiene onesti i conteggi dei token, il flag di traceparent che cancella in silenzio le tue tracce e le regole di consegna che disattivano una destinazione dopo 24 ore.

<LevelBadge level="advanced" />

Per gran parte del 2026, tracciare una chiamata alla Claude API significava scrivere lo span a mano: aprire uno span, chiamare `messages.create`, copiare `usage` sugli attributi, chiudere lo span. [Agent observability](/docs/api/agent-observability) è la pagina su come farlo bene, ed è ancora la pagina su cosa *significano* i nomi.

Questa pagina riguarda la parte che è cambiata. L'API e l'SDK ora emettono quegli span da soli, in beta, e ne emettono parecchi più di quelli che scrivevi a mano: uno span per ogni richiesta al modello *dentro* una singola richiesta API, uno span per ogni server tool eseguito dall'API per te, uno span per ogni compattazione, uno span per ogni turno di Managed Agents. Sono cose che accadono dal lato di Anthropic, che la strumentazione manuale per costruzione non può vedere.

Ci sono due percorsi indipendenti per attivare tutto questo, e l'errore di comprensione più costoso è che **si sovrappongono**. Se li abiliti entrambi senza leggere un paragrafo della documentazione, ogni richiesta Messages compare due volte, con lo stesso nome di span, e le tue dashboard sui token raddoppiano.

<Callout type="objectives" items={[
  "Scegliere tra tracing SDK, tracing API o entrambi, sapendo con precisione cosa può e cosa non può vedere ciascuno",
  "Configurare ogni percorso: un tracer provider nel tuo codice, una destinazione nella Console o tramite l'Admin API",
  "Sommare correttamente i token tra span sovrapposti: l'unica regola che evita il doppio conteggio",
  "Scegliere deliberatamente una modalità di contenuto e sapere cosa sovrascrive la tua scelta (HIPAA/FERPA/K-12, zero data retention)",
  "Collegare gli span dell'API alle tracce della tua applicazione con traceparent, evitando il flag sampled che li cancella",
  "Sopravvivere alle regole di consegna: at-least-once, best-effort e disattivazione automatica dopo 24 ore di errori"
]} />

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry">
L'export OpenTelemetry per la Claude API e l'SDK è stato lanciato in beta il **14 ottobre 2026**. Anthropic dichiara esplicitamente che nomi degli span, attributi, opzioni dell'SDK e variabili d'ambiente possono cambiare durante la beta, e consiglia di fissare la versione dell'SDK. Considera ogni nome di questa pagina come superficie beta e ricontrollalo prima di una migrazione.
</VerifyNote>

## I due percorsi

Non sono due modi di fare la stessa cosa. Vedono metà diverse dell'esecuzione.

| Cosa ottieni | Tracing SDK | Tracing API |
| --- | --- | --- |
| Richieste Messages API e Sessions API | sì | sì |
| Utilizzo dei token | sì | sì |
| Ogni richiesta al modello *dentro* una richiesta API | — | sì |
| Turni di Managed Agents | — | sì |
| Server tool e tool del connettore MCP, eseguiti dall'API | — | sì |
| I tuoi client tool, eseguiti dal tool runner | sì | — |
| Tool in una sandbox self-hosted | sì | — |
| Altre richieste, come gli upload di file | sì | — |
| Come lo configuri | codice | Console o Admin API |
| Chi può configurarlo | qualsiasi sviluppatore | un **admin** |
| Quali client copre | solo i client che usano l'SDK | qualsiasi client, curl incluso |

La divisione segue una sola linea: **l'SDK vede ciò che fa il tuo processo, l'API vede ciò che fa il lato di Anthropic.** Un server tool come la ricerca web gira dentro la richiesta API: il tuo processo non lo osserva mai, quindi solo il tracing API produce quello span. La tua funzione `get_weather` gira nel tuo processo: solo il tracing SDK produce quello.

Per questo "entrambi" è la risposta reale per la maggior parte delle configurazioni in produzione, e per questo la regola di sovrapposizione qui sotto non è un caso limite.

```mermaid
flowchart TD
  APP["your span: answer_question<br/>(your code)"] --> TR["anthropic.messages.tool_runner<br/>SDK · INTERNAL"]
  TR --> C1["anthropic.messages.create<br/>SDK · CLIENT"]
  C1 --> S1["anthropic.messages.create<br/>API · SERVER"]
  S1 --> M1["anthropic.model_request<br/>API · INTERNAL"]
  S1 --> W1["anthropic.tool_use web_search<br/>API · INTERNAL"]
  S1 --> M2["anthropic.model_request<br/>API · INTERNAL"]
  TR --> CT["anthropic.custom_tool_use get_weather<br/>SDK · INTERNAL"]
  TR --> C2["anthropic.messages.create<br/>SDK · CLIENT"]
  C2 --> S2["anthropic.messages.create<br/>API · SERVER"]
```

Leggi con attenzione questa forma, perché contiene la trappola. `anthropic.messages.create` compare **quattro volte** per una conversazione di due richieste: due dall'SDK (kind `CLIENT`) e due dall'API (kind `SERVER`), con ogni span API figlio del suo span SDK. Non sono duplicati nel senso di una riconsegna: sono due osservazioni legittime della stessa richiesta, dai due capi.

## Configurare il tracing SDK

Gli span dell'SDK non richiedono permessi né accesso alla Console. L'SDK usa il tracer provider che la tua applicazione ha già registrato, quindi non c'è alcun exporter specifico di Anthropic da collegare.

<Steps items={[
  {
    "title": "Aggiorna l'SDK",
    "body": "Gli span sono inclusi negli attuali SDK Python, TypeScript, C#, Go, Java, PHP e Ruby. Su Java il minimo è `anthropic-java` 2.73.0. Fissa la versione: la nota beta dice che una nuova release dell'SDK può rinominare uno span, un attributo, un'opzione o una variabile d'ambiente."
  },
  {
    "title": "Registra un tracer provider prima della prima chiamata",
    "body": "È la ragione più comune per cui non si vede alcuno span. L'SDK legge il provider registrato globalmente nel momento in cui effettua una chiamata; registralo all'avvio del processo, non in modo pigro. Parti da un exporter su console per confermare che gli span esistano, poi passa a OTLP."
  },
  {
    "title": "Chiama l'SDK dall'interno di uno dei tuoi span",
    "body": "Niente si annida in automatico. Se vuoi che lo span SDK (e lo span API sotto di esso) compaiano sotto il tuo span `handle_request`, apri il tuo span e chiama l'SDK al suo interno. Altrimenti gli span SDK sono span radice e la traccia non ti dice nulla su quale funzionalità o utente abbia innescato la chiamata."
  },
  {
    "title": "Decidi la modalità di contenuto e il conversation ID",
    "body": "Il default è solo metadati. Imposta `traces.content_mode` su `content` (o `ANTHROPIC_OPEN_TELEMETRY_TRACES_CONTENT_MODE=content`) per includere prompt e risposte. Imposta `conversation_id` per raggruppare una conversazione a più chiamate sotto un unico `gen_ai.conversation.id`."
  }
]} />

<PromptCard title="Tracing SDK minimo funzionante — prima l'exporter su console (Python)">
{`from anthropic import Anthropic
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor

# Register BEFORE the first traced call. Swap ConsoleSpanExporter for an
# OTLP exporter once you can see spans in the terminal.
provider = TracerProvider()
provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(provider)

# Record prompts and responses, and label this conversation.
client = Anthropic(open_telemetry={"traces": {"content_mode": "content"}})

tracer = trace.get_tracer("my-service")
with tracer.start_as_current_span("answer_question"):
    message = client.with_options(
        open_telemetry={**client.open_telemetry, "conversation_id": "conv_42"}
    ).messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello, Claude"}],
    )`}
</PromptCard>

### Le opzioni dell'SDK da conoscere

| Opzione (grafia Python) | Variabile d'ambiente | Default |
| --- | --- | --- |
| `traces.content_mode` | `ANTHROPIC_OPEN_TELEMETRY_TRACES_CONTENT_MODE` | `metadata_only` |
| `traces.max_content_bytes` | `ANTHROPIC_OPEN_TELEMETRY_TRACES_MAX_CONTENT_BYTES` | 0.75 MB |
| `conversation_id` | — | nessuno |
| `tracer_provider` | — | il provider globale registrato |
| `propagation` | `ANTHROPIC_OPEN_TELEMETRY_PROPAGATION` | attiva |
| `open_telemetry` (interruttore di spegnimento) | `ANTHROPIC_OPEN_TELEMETRY` | attivo |

Due comportamenti ti faranno perdere un'ora ciascuno se li incontri senza saperlo:

- **Passare `open_telemetry` al client sovrascrive nel loro insieme le variabili d'ambiente**, chiavi annidate incluse. Ogni chiave che ometti dall'oggetto torna in silenzio al default della tabella anche se la sua variabile è impostata. Costruisci l'oggetto a partire da quello esistente, non da zero.
- **In TypeScript con `@opentelemetry/instrumentation-undici`**, che `@opentelemetry/auto-instrumentations-node` include, imposta `propagation: false`. Un bug di quel pacchetto aggiunge un *secondo* header `traceparent` a ogni richiesta, rendendo invalido il contesto della traccia e rompendo il collegamento in silenzio.

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk">
I nomi delle opzioni, i nomi delle variabili d'ambiente, il requisito minimo di `opentelemetry-api` 1.57.0 per Java e l'avviso sul doppio header di undici provengono dalla pagina ufficiale di configurazione dell'SDK. Le grafie per linguaggio differiscono (TypeScript/Java/PHP usano camelCase, C# PascalCase, Go usa funzioni `option.With…()`); controlla la pagina per il tuo.
</VerifyNote>

## Configurare il tracing API

Il tracing API non richiede alcuna modifica al codice. Registri una *destinazione* (l'endpoint OTLP della tua piattaforma di osservabilità più le credenziali) e l'API vi invia gli span.

Cosa ti serve prima di iniziare:

- **Il ruolo admin** nell'organizzazione della Console. Il ruolo developer può vedere le destinazioni ma non crearle né modificarle.
- **Un endpoint OTLP/HTTP che accetti protobuf, via HTTPS, sulla porta 443.** È il requisito che colpisce chi fa self-hosting: un OpenTelemetry Collector standard ascolta OTLP/HTTP sulla **porta 4318**, quindi serve un load balancer, un reverse proxy o un receiver riconfigurato davanti. Non c'è un'opzione gRPC e non c'è una porta diversa dalla 443.
- **Le credenziali per quell'endpoint**, che vanno negli header della richiesta. La Console non mostrerà più i valori dopo il salvataggio.

<PromptCard title="Crea una destinazione di telemetria con l'Admin API (curl)">
{`curl --fail-with-body -sS "https://api.anthropic.com/v1/organizations/telemetry_destinations" \\
  -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: telemetry-destinations-2026-08-11" \\
  -H "content-type: application/json" \\
  -d '{
    "endpoint_url": "https://gateway.example.com/otlp",
    "headers": {"authorization": "Bearer YOUR_OBSERVABILITY_API_KEY"},
    "traces": {"content_mode": "metadata_only"},
    "workspaces": {"type": "all"}
  }'`}
</PromptCard>

Nota la forma dell'URL dell'endpoint: fornisci l'URL OTLP **di base** e lascia che l'API aggiunga da sola `/v1/traces`. Un prefisso di percorso è ammesso. Se la tua piattaforma riceve le tracce altrove, imposta l'URL opzionale dell'endpoint delle tracce, che però deve condividere lo stesso host.

Tre impostazioni meritano una decisione deliberata invece di un default:

- **Workspace**: `all`, `selected` o `all except`. `all` include i workspace creati in seguito, che di solito è ciò che vuoi e a volte esattamente ciò che non vuoi. Una destinazione riceve solo gli span del workspace in cui la richiesta o la sessione è effettivamente girata.
- **Modalità di contenuto**: trattata sotto.
- **Dimensione massima del contenuto**: si applica solo in modalità contenuto completo. Scegliendo un partner elencato nella Console viene precompilato un valore che quella piattaforma accetta; con **Custom** sei da solo.

Poi verifica, in quest'ordine: invia uno span di prova dal menu della destinazione e conferma che arrivi uno span `anthropic.test`; invia una richiesta reale nel workspace scelto; controlla che la colonna **Delivery** indichi **Healthy**; filtra la tua piattaforma su `service.name` = `claude-platform`. Concedi circa un minuto a ogni passaggio: sia le modifiche alla destinazione sia la colonna di stato hanno un ritardo di circa tanto.

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry/api">
Il requisito del ruolo admin, il requisito di endpoint OTLP/HTTP-protobuf-HTTPS-443, l'header beta `telemetry-destinations-2026-08-11`, lo span di verifica `anthropic.test` e il valore `claude-platform` di `service.name` provengono dalla pagina ufficiale di configurazione dell'API. Le destinazioni si possono gestire anche con la CLI `ant`.
</VerifyNote>

## Modalità di contenuto e cosa sovrascrive la tua scelta

Ogni destinazione e ogni client SDK ha una di due modalità di contenuto.

- **Solo metadati** (`metadata_only`): il default. ID, tempi, stato, conteggi dei token e testo che hai scelto tu: nomi degli agenti, nomi e descrizioni dei tool, nomi dei server MCP.
- **Contenuto completo** (`content`): tutto quanto sopra più prompt e risposte del modello. Nel riferimento degli span questi attributi portano un badge `Content`: `gen_ai.system_instructions`, `gen_ai.input.messages`, `gen_ai.output.messages`, `gen_ai.tool.call.arguments`, `anthropic.tool_result.content`.

Il contenuto completo è ciò che rende le tracce utili per ciò che i team vogliono davvero: leggere una conversazione fallita o [costruire eval](/docs/playbooks/evaluating-agents) a partire dal traffico reale. È anche ciò che sposta i tuoi prompt e gli input dei tuoi utenti in un secondo sistema, sotto le regole di conservazione e di accesso di quel fornitore invece delle tue. Lo stesso ragionamento di [cosa carica il tuo agente](/docs/security/what-your-agent-uploads): abilitarlo concede al tuo fornitore di osservabilità più o meno il livello di fiducia che hanno i dati della tua applicazione.

Vale la pena memorizzare due sovrascritture, perché entrambe producono ticket di supporto confusi:

- **Una restrizione HIPAA, FERPA o K-12 sul trattamento dei dati con Anthropic forza le destinazioni a solo metadati**, qualunque cosa dica la destinazione. Gli span SDK *non* sono influenzati: il tuo processo può comunque emettere contenuto. Il sintomo è quindi "il contenuto completo è attivo, la Console concorda, e i prompt compaiono solo sugli span CLIENT".
- **Zero data retention è compatibile con il contenuto completo.** Per le richieste Messages API l'API tiene il contenuto esportato solo in memoria fino alla consegna. Managed Agents non è comunque idoneo a ZDR, e la sua conservazione non cambia usando OpenTelemetry.

### Limiti del contenuto e troncamento

Ogni span contiene per default fino a **0.75 MB** di contenuto, scelto per contenere una finestra di contesto da 200k token di testo inglese restando sotto il limite di 1 MB per richiesta comune a piattaforme di osservabilità e proxy. Una finestra completa da 1M di token richiede circa **4 MB**.

Quando il contenuto supera il limite, lo span viene accorciato e `anthropic.content.truncated` è impostato a `true`. L'ordine di rimozione è specificato e conta per chi costruisce eval dalle tracce:

- Gli **span di richiesta** eliminano prima il system prompt, poi i messaggi più vecchi.
- Gli **span di tool** eliminano i blocchi dalla fine del risultato.
- **Immagini e documenti** compaiono solo come tipo, mai come byte.

Quindi una pipeline ingenua "riproduci ogni traccia come caso di eval" ti passerà in silenzio conversazioni senza system prompt, a meno che tu non filtri su `anthropic.content.truncated`. Fai di quel filtro la prima riga della pipeline, non una scoperta successiva.

## L'unica regola: conta ogni token una volta

Questa è la sezione da leggere due volte. Gli attributi di utilizzo dei token compaiono su più span per richiesta, per progetto, perché ogni span riporta *il proprio passo*. Sommare tutto ciò che ricevi sovrastima; sommare il livello sbagliato sottostima.

<Steps items={[
  {
    "title": "Scegli esattamente una sola fonte per richiesta",
    "body": "Se una richiesta Messages ha sia uno span SDK sia uno span API, somma gli span API. Entrambi si chiamano `anthropic.messages.create`, quindi non puoi filtrare per nome: distinguili dal kind dello span: lo span SDK è CLIENT, il suo span API figlio è SERVER. Funziona anche filtrare su `service.name` = `claude-platform`."
  },
  {
    "title": "Dentro gli span API di una richiesta Messages, somma un livello, non due",
    "body": "O gli span `anthropic.messages.create` o i loro figli `anthropic.model_request`, mai entrambi. Una richiesta con tre richieste al modello riporta il totale sul padre e le parti sui figli."
  },
  {
    "title": "Aggiungi i token di compattazione, da un solo posto",
    "body": "I totali `gen_ai.usage.*` escludono la compattazione. Sugli span SDK, aggiungi `anthropic.usage.compaction.input_tokens` e `anthropic.usage.compaction.output_tokens`. Sugli span API, aggiungi invece gli span figli `anthropic.compaction`, e poi NON aggiungere anche gli attributi `anthropic.usage.compaction.*` del padre, perché contengono gli stessi token."
  },
  {
    "title": "Per Managed Agents, somma richieste al modello e valutazioni dell'esito",
    "body": "Somma gli span `anthropic.model_request` più gli span `anthropic.session.outcome_evaluation`. Gli span di turno sono contenitori; i token stanno sotto di essi. Una valutazione dell'esito è spesa reale che si dimentica facilmente, perché nessuna tua richiesta al modello l'ha prodotta."
  },
  {
    "title": "Deduplica per trace ID e span ID",
    "body": "La consegna è at-least-once, quindi lo stesso span può arrivare due volte. Se la tua piattaforma non deduplica, devi farlo tu. È un problema diverso dalla sovrapposizione CLIENT/SERVER e richiede una correzione a parte."
  }
]} />

Un'ultima cosa che non è una regola di conteggio ma ti evita un numero sbagliato: `gen_ai.usage.input_tokens` **include già** letture e scritture di cache. Sommarci sopra `gen_ai.usage.cache_read.input_tokens` conta due volte i token più economici che hai. Vedi [prompt caching](/docs/api/prompt-caching) per quanto costano quei token l'uno rispetto all'altro.

:::warning[Le tracce non sono un registro di fatturazione]
Anthropic dichiara chiaramente che gli span esportati non sono garantiti come registro completo dell'utilizzo. La consegna è best effort, quindi uno span può andare perso; e un chiamante può sopprimere del tutto gli span di una richiesta disattivando il flag sampled nel suo `traceparent`. Per la contabilità per chiave (individuare una chiave compromessa, riconciliare una fattura) usa la Usage API, che conta anche le richieste che non hanno prodotto alcuno span. Le tracce servono per il debug e per l'*attribuzione* dei costi; non sono il libro mastro.
:::

## Collegare gli span API alle tue tracce

Per default gli span API vivono in tracce proprie: tecnicamente corretto e quasi inutile, perché non puoi capire quale funzionalità o utente abbia causato la chiamata.

L'API legge l'header W3C `traceparent` di ogni richiesta. Con l'SDK lo ottieni gratis, purché tu abbia chiamato l'SDK dentro un tuo span e registrato il propagatore W3C trace context. (Se la tua applicazione ha standardizzato B3 o un altro propagatore, aggiungi W3C accanto: l'SDK scrive gli header con *il tuo* propagatore.) Con qualsiasi altro client, inietta tu stesso il contesto dello span attivo negli header prima dell'invio.

Poi c'è il flag che sorprende tutti:

:::warning[Il flag sampled è un interruttore per gli span, non un suggerimento]
Se il flag sampled nel `traceparent` in ingresso è disattivato, l'API **non emette alcuno span per quella richiesta né per quelli sotto di essa**. Il head sampling nella tua applicazione decide quindi se la telemetria lato Anthropic esista del tutto. Un servizio con campionamento all'1% che abilita il tracing API ottiene l'1% degli span di richieste al modello e di server tool, e concluderà che la funzione è rotta. Campiona in coda nel tuo collector, oppure forza il flag sampled sui percorsi che ti servono tracciati.
:::

La propagazione va un salto oltre ciò che la maggior parte si aspetta. Quando la Messages API chiama il tuo server MCP attraverso il [connettore MCP](/docs/api/mcp), passa un `traceparent` W3C in `params._meta`, così un server che lo legge può agganciare i propri span sotto quelli dell'API. In una richiesta `tools/call` quel genitore è lo span `anthropic.mcp_tool_use`; negli altri messaggi è `anthropic.messages.create`. Una richiesta non tracciata non invia alcun `traceparent`. Sul lato client il quadro è più frammentato: il pacchetto Python `mcp` dalla versione 2.0 e il pacchetto C# `ModelContextProtocol` inoltrano il contesto della traccia in `_meta`; gli SDK MCP per TypeScript, Go, Java, Ruby e PHP non lo fanno da soli.

## Regole di consegna, e come muore una destinazione

L'export lato API è un push dall'infrastruttura di Anthropic al tuo endpoint, quindi ha semantiche di errore proprie, più vicine a un webhook che a un exporter OTLP nel tuo processo.

| Proprietà | Comportamento |
| --- | --- |
| Duplicazione | At least once. Deduplica per trace ID + span ID. |
| Perdita | Best effort. Uno span perso non viene mai rinviato. |
| Compressione | La prima richiesta di ogni consegna è compressa con gzip con `Content-Encoding: gzip`. Su un `400` o `415`, gli stessi span vengono rinviati subito, non compressi. |
| Retry | Retry limitati dopo un timeout, un errore di connessione/TLS/DNS, o un `408`, `429` o `5xx`. Gli altri errori non vengono ritentati. |
| Timeout | Handshake TLS entro 5 s, header di risposta entro 5 s, 10 s in totale per consegna, incluso il rinvio non compresso. |
| User agent | `User-Agent: Claude-Platform`. Utile per una regola di allowlist. |

E tre modi in cui l'API **disattiva** una destinazione del tutto, fermando l'export finché una persona non la riabilita:

1. L'endpoint restituisce un redirect `3xx`. I redirect non vengono seguiti: punta la destinazione all'URL finale.
2. L'hostname dell'endpoint si risolve in un indirizzo IP non pubblico. Non esiste un tunnel verso la tua VPC; esponi un collector pubblico o usa una piattaforma gestita.
3. Ogni consegna fallisce per 24 ore.

Il terzo è il rischio operativo. Una chiave API di osservabilità ruotata e che nessuno nota diventa una destinazione **Failing** per un giorno e poi **Disabled**, e la riabilitazione è un clic manuale nella Console (con il filtro workspace impostato su **All**), non un recupero automatico. Se imposti un allarme su una sola cosa di questa pagina, fallo sullo stato Delivery.

### Limiti per organizzazione

| Limite | Valore |
| --- | --- |
| Destinazioni, incluse quelle disattivate | 10 |
| Workspace selezionati per una destinazione | 1,000 |
| Header di richiesta per destinazione | 20 |
| Lunghezza del nome dell'header | 128 byte |
| Lunghezza del valore dell'header | 4,096 byte |
| Tutti i nomi e valori degli header insieme | 16,384 byte |
| Lunghezza dell'URL dell'endpoint | 2,048 caratteri |

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry/api">
Le semantiche di consegna, i valori di timeout, le tre condizioni di disattivazione automatica e la tabella dei limiti provengono dalle sezioni "Delivery and health" e "Limits" della pagina ufficiale di configurazione dell'API. Superficie beta: ricontrolla prima di costruire un SLO su questi numeri.
</VerifyNote>

## Leggere una sessione di Managed Agents

Le sessioni rompono l'assunzione di una sola traccia, e la soluzione è una chiave di raggruppamento, non un trace ID.

Gli span di una sessione possono finire in **più tracce**: una richiesta successiva inviata da una nuova traccia radice ne avvia una nuova; e con l'orchestrazione multiagente una sessione ha più thread. Quindi:

- **Un thread, come trascrizione**: raggruppa per `gen_ai.conversation.id` (l'ID del thread di sessione), ordina per ora di inizio.
- **Un'intera sessione, tutti i thread**: raggruppa per `anthropic.session.id`, attraverso le tracce.

Vale la pena interiorizzare le forme degli span perché non corrispondono alle convenzioni GenAI generiche per cui potresti avere già dashboard. `anthropic.session.turn` porta `gen_ai.operation.name` = `invoke_agent` e copre lo stato `running` di un thread; un turno avviato da una richiesta è figlio dello span di quella richiesta, mentre un turno che parte perché un altro thread ha risposto non ha alcun genitore. In modalità contenuto completo lo span del turno contiene il contenuto del thread: `gen_ai.system_instructions` solo al primo turno di un thread, `gen_ai.input.messages`, `gen_ai.output.messages`. I thread advisor sono volutamente più sottili: `gen_ai.agent.name` è `anthropic.advisor`, e gli attributi di istruzioni e input sono assenti.

Quattro casi **non** producono alcuno span di tool API, e ognuno ha fatto pensare a qualcuno che il suo tracing fosse rotto: un tool che esegue la tua applicazione (quello span lo emette il tool runner dell'SDK); un tool in una sandbox self-hosted (lo emette l'environment worker dell'SDK, raggruppato sotto `anthropic.environment.work`); un tool multiagente o advisor; e un uso di tool negato dalla policy di permessi `auto` o da un evento `user.tool_confirmation`. Le chiamate negate non lasciano uno span di tool: se stai verificando cosa un agente ha *tentato* di fare, leggi gli eventi di sessione, non la traccia.

## Errori comuni

- **Sommare ogni span `anthropic.messages.create` che ricevi.** Due osservazioni legittime per richiesta, stesso nome. Filtra prima per span kind o `service.name`. È l'errore che produce un costo plausibile, sbagliato, esattamente raddoppiato.
- **Aspettarsi span al tuo normale tasso di campionamento.** Un `traceparent` con sampled disattivato sopprime completamente gli span API. Il head sampling nel tuo servizio è head sampling della telemetria di Anthropic.
- **Puntare una destinazione a un Collector nudo.** OTLP/HTTP sulla 4318 non è un endpoint HTTPS sulla 443. Metti un proxy davanti, altrimenti la destinazione non consegna mai.
- **Trattare il contenuto completo come un flag di logging.** Sposta prompt e input degli utenti nel tuo fornitore di osservabilità. Decidilo con chi si occupa della gestione dei dati, e sappi che una restrizione HIPAA/FERPA/K-12 lo sovrascrive in silenzio solo per gli span API.
- **Costruire eval dalle tracce senza controllare `anthropic.content.truncated`.** Il troncamento elimina prima il system prompt. Al tuo corpus di eval mancherà proprio la parte che ha determinato il comportamento.
- **Lasciare una destinazione `Failing` dov'è.** 24 ore di errori la disattivano, e la riabilitazione è manuale. Metti l'allarme sullo stato Delivery, non sul volume di span: il volume di span sembra a posto fino al momento in cui è zero.
- **Scrivere questi nomi di attributo a mano in quaranta pannelli.** Gli span seguono le convenzioni GenAI a uno specifico commit (`e57c543b`, 24 settembre 2026) di un repository senza release taggate, e la nota beta si riserva di rinominare. L'abitudine del livello di mapping da [agent observability](/docs/api/agent-observability) qui vale ancora di più.

## Dove vanno gli span

Funziona qualsiasi piattaforma che accetti OTLP. Anthropic documenta guide di integrazione con Arize AI, Braintrust, Databricks, Datadog, Grafana Cloud, Honeycomb, Langfuse, LangSmith, New Relic, PostHog, Sentry e Splunk; scegliere un fornitore elencato nella Console chiede le credenziali proprie di quella piattaforma e precompila una dimensione del contenuto che accetta, invece di chiedere un endpoint grezzo e degli header.

Per Claude Code, l'Agent SDK e Cowork, questo è un sistema diverso con interruttori diversi (`CLAUDE_CODE_ENABLE_TELEMETRY` e simili), trattato in [agent observability](/docs/api/agent-observability). Abilitare qui le destinazioni non fa nulla per loro, e viceversa.

<Quiz questions={[
  {
    "q": "Abiliti sia il tracing SDK sia il tracing API, poi sommi gen_ai.usage.input_tokens su ogni span anthropic.messages.create. Cosa succede?",
    "options": [
      "Niente: lo span API sostituisce lo span SDK",
      "Ogni richiesta è contata due volte, perché sia l'SDK (CLIENT) sia l'API (SERVER) emettono uno span con quel nome",
      "Solo le richieste in streaming sono contate due volte",
      "La somma è corretta ma manca le letture di cache"
    ],
    "answer": 1,
    "explain": "Una richiesta ha uno span CLIENT dall'SDK e uno span SERVER dall'API, entrambi chiamati anthropic.messages.create, con lo span API figlio dello span SDK. Scegli una sola fonte (la documentazione consiglia gli span API) e filtra per span kind o per service.name = claude-platform."
  },
  {
    "q": "Il tuo servizio fa head sampling dell'1% delle tracce e hai appena aggiunto una destinazione di telemetria. Perché arrivano quasi nessuno span di richieste al modello?",
    "options": [
      "Le destinazioni impiegano 24 ore a scaldarsi",
      "Gli span di richieste al modello vengono emessi solo in modalità contenuto completo",
      "Un traceparent con il flag sampled disattivato sopprime lo span della richiesta e ogni span sotto di esso",
      "L'SDK va aggiornato prima che compaiano gli span API"
    ],
    "answer": 2,
    "explain": "L'API rispetta il flag sampled nel traceparent in ingresso: se è disattivato, non emette alcuno span per la richiesta né per i suoi figli. La tua decisione di campionamento è anche quella di Anthropic. Campiona in coda nel tuo collector, oppure forza il flag sui percorsi che ti servono tracciati."
  },
  {
    "q": "Una destinazione risulta Failing da un giorno perché la chiave API di osservabilità è stata ruotata. Cosa succede dopo?",
    "options": [
      "L'API continua a ritentare all'infinito e si riprende quando la chiave viene corretta",
      "La destinazione viene disattivata dopo 24 ore di consegne fallite e va riabilitata manualmente",
      "Gli span vengono messi in buffer e riprodotti quando la consegna riesce",
      "L'API passa automaticamente a una seconda destinazione"
    ],
    "answer": 1,
    "explain": "Se tutte le consegne falliscono per 24 ore la destinazione viene disattivata, come accade con un redirect 3xx e con un hostname che si risolve in un IP non pubblico. Gli span persi non vengono mai rinviati, e la riabilitazione è un'azione manuale nella Console con il filtro workspace su All. Metti l'allarme sullo stato Delivery."
  }
]} />

<Flashcards cards={[
  { "front": "Tracing SDK vs tracing API: cosa vede solo ciascuno", "back": "Solo SDK: i tuoi client tool via tool runner, i tool in sandbox self-hosted, le richieste non Messages come gli upload di file. Solo API: ogni richiesta al modello dentro una richiesta API, i turni di Managed Agents, i server tool e i tool del connettore MCP, le compattazioni. Entrambi: richieste Messages e Sessions, utilizzo dei token." },
  { "front": "Distinguere gli span sovrapposti", "back": "Lo span SDK e lo span API di una richiesta hanno lo stesso nome anthropic.messages.create. SDK = kind CLIENT, service.name è la tua app. API = kind SERVER, service.name è claude-platform, ed è figlio dello span SDK." },
  { "front": "Regola di conteggio dei token", "back": "Una fonte per richiesta (preferisci gli span API). Dentro gli span API di una richiesta Messages, somma anthropic.messages.create OPPURE anthropic.model_request, mai entrambi. Aggiungi la compattazione da un solo posto. Per Managed Agents, somma anthropic.model_request + anthropic.session.outcome_evaluation. Deduplica per trace ID + span ID." },
  { "front": "gen_ai.usage.input_tokens include i token di cache?", "back": "Sì: letture e scritture di cache ci sono già dentro. Sommarci sopra gen_ai.usage.cache_read.input_tokens conta due volte." },
  { "front": "Modalità di contenuto", "back": "metadata_only (default): ID, tempi, stato, conteggi dei token, nomi/descrizioni scelti da te. content: aggiunge prompt e risposte: gen_ai.system_instructions, gen_ai.input.messages, gen_ai.output.messages, gen_ai.tool.call.arguments, anthropic.tool_result.content." },
  { "front": "Cosa sovrascrive il contenuto completo", "back": "Una restrizione HIPAA, FERPA o K-12 sul trattamento dei dati forza le destinazioni a solo metadati; gli span SDK non sono influenzati. Zero data retention è compatibile con il contenuto completo: per le richieste Messages l'API tiene il contenuto esportato solo in memoria fino alla consegna." },
  { "front": "Limite di contenuto e ordine di troncamento", "back": "0.75 MB per span di default (~200k token di inglese); una finestra da 1M di token richiede ~4 MB. Oltre il limite, anthropic.content.truncated = true. Gli span di richiesta eliminano prima il system prompt e poi i messaggi più vecchi; gli span di tool eliminano i blocchi dalla fine; immagini e documenti compaiono solo come tipo." },
  { "front": "Requisito dell'endpoint per una destinazione", "back": "OTLP/HTTP che accetta protobuf, HTTPS, porta 443, hostname e non IP. Un Collector di default ascolta sulla 4318: metti davanti un proxy o un load balancer. Fornisci l'URL OTLP di base; l'API aggiunge /v1/traces." },
  { "front": "Il flag sampled", "back": "Se il flag sampled nel traceparent della richiesta è disattivato, l'API non emette alcuno span per la richiesta né per i suoi figli. Il head sampling nella tua app rimuove in silenzio la telemetria lato Anthropic." },
  { "front": "Tre modi in cui una destinazione viene disattivata", "back": "Un redirect 3xx dall'endpoint; un hostname che si risolve in un IP non pubblico; tutte le consegne che falliscono per 24 ore. La riabilitazione è manuale, nella Console con il filtro workspace su All." },
  { "front": "Raggruppare una sessione di Managed Agents", "back": "Un thread come trascrizione: raggruppa per gen_ai.conversation.id (l'ID del thread), ordina per ora di inizio. Un'intera sessione tra tracce e thread: raggruppa per anthropic.session.id." },
  { "front": "Quando l'API non emette uno span di tool", "back": "Un tool eseguito dalla tua app (lo emette il tool runner dell'SDK); un tool in una sandbox self-hosted (environment worker dell'SDK, sotto anthropic.environment.work); tool multiagente e advisor; un uso di tool negato dalla policy di permessi auto o da user.tool_confirmation. I tentativi negati sono negli eventi di sessione, non nelle tracce." },
  { "front": "Header beta per l'API delle destinazioni di telemetria", "back": "anthropic-beta: telemetry-destinations-2026-08-11, su POST /v1/organizations/telemetry_destinations con una chiave admin. Disponibile anche tramite la CLI ant e la Console." },
  { "front": "Quale revisione semconv seguono questi span", "back": "Le convenzioni OpenTelemetry GenAI al commit e57c543b, 24 settembre 2026, in un repository senza release taggate. Più attributi specifici di Anthropic sotto il prefisso anthropic.*." }
]} />

<Callout type="takeaways" items={[
  "Due percorsi, due metà dell'esecuzione: l'SDK vede il tuo processo, l'API vede il lato di Anthropic. La maggior parte delle configurazioni in produzione le vuole entrambe.",
  "Entrambi i percorsi emettono anthropic.messages.create per la stessa richiesta. Scegli una sola fonte per span kind prima di sommare qualsiasi cosa.",
  "Dentro gli span API somma un livello (messages.create o model_request, mai entrambi) e aggiungi la compattazione da un solo posto.",
  "Gli span servono per debug e attribuzione, non per la fatturazione: la consegna è best effort e un traceparent con sampled disattivato cancella del tutto una richiesta. Usa la Usage API per il libro mastro.",
  "Il flag sampled è un interruttore, non un suggerimento. Un servizio con campionamento all'1% ottiene l'1% degli span lato Anthropic.",
  "Il contenuto completo sposta i tuoi prompt nel tuo fornitore di osservabilità. Una restrizione HIPAA/FERPA/K-12 lo sovrascrive solo per gli span API: un sintomo molto confuso se non lo si conosce.",
  "Controlla anthropic.content.truncated prima di costruire eval dalle tracce: il troncamento elimina prima il system prompt.",
  "Metti un allarme sullo stato Delivery di una destinazione. 24 ore di errori la disattivano, e il ripristino è un clic manuale."
]} />

## Prossimi passi

- [Agent observability](/docs/api/agent-observability) — cosa significano i nomi `gen_ai.*`, perché nessuno è stabile e gli interruttori di telemetria di Claude Code che questa pagina non copre
- [Cache diagnostics](/docs/api/cache-diagnostics) — quando gli span mostrano una lettura di cache inattesa, i campi per richiesta che ne spiegano il motivo
- [Managed agents](/docs/api/managed-agents) — le sessioni, i turni e i thread i cui span questa pagina insegna a raggruppare

## Fonti e approfondimenti

- [OpenTelemetry for the Claude API](https://platform.claude.com/docs/en/manage-claude/opentelemetry) — la matrice di copertura, le modalità di contenuto, i limiti di contenuto e l'ordine di troncamento, tracce d'esempio, il raggruppamento delle sessioni e le regole di conteggio dei token
- [Set up OpenTelemetry with the Claude API](https://platform.claude.com/docs/en/manage-claude/opentelemetry/api) — campi della destinazione, Admin API e CLI `ant`, ambito dei workspace, collegamento via `traceparent`, semantiche di consegna e stato, limiti e tabelle di risoluzione dei problemi
- [Use OpenTelemetry with the Claude SDK](https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk) — installazione per linguaggio, registrazione del tracer provider, tabella completa delle opzioni con variabili d'ambiente, tracing dello stream, sandbox self-hosted e insidie della propagazione
- [OpenTelemetry span reference](https://platform.claude.com/docs/en/api/opentelemetry/spans) — ogni span, i suoi genitori e figli, e ogni attributo con il suo badge `Content`
- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) — la voce del lancio beta del 14 ottobre 2026
- Correlati: [Prompt caching](/docs/api/prompt-caching) · [Compaction](/docs/api/compaction) · [Admin API](/docs/api/admin-api) · [Hard spend caps](/docs/models/hard-spend-caps) · [What your agent uploads](/docs/security/what-your-agent-uploads) · [Evaluating agents](/docs/playbooks/evaluating-agents)
