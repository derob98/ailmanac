# Tool calling tra provider diversi

> Source: https://derob98.github.io/ailmanac/it/docs/models/tool-calling-across-providers · AILmanac (CC BY 4.0) · last verified 2026-11-11

Tutti i principali provider supportano il function calling, e nessuno è d'accordo su un solo nome di campo. I quattro dialetti a confronto, il bug «arguments è una stringa» che rompe ogni porting, l'unico provider senza alcun ID di correlazione, e perché forzare un tool è il pattern che ora fallisce sugli ultimi modelli di Claude e in nessun altro posto.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "Leggere la stessa definizione di tool in tutti e quattro i dialetti di rete — Anthropic, OpenAI Chat Completions, OpenAI Responses e Gemini — e tradurre da uno all'altro senza indovinare i nomi dei campi",
  "Evitare il bug di porting più comune: gli argomenti arrivano come stringa JSON su alcuni provider e come oggetto già analizzato su altri",
  "Sapere quale provider non fornisce alcun ID di correlazione e cosa fare al riguardo",
  "Capire perché forzare una chiamata a un tool è portabile ovunque TRANNE che sugli ultimi modelli di Claude — il contrario di ciò che la maggior parte delle persone presume",
  "Distinguere i tre dialetti di schema: JSON Schema puro, il sottoinsieme strict mode di OpenAI e il sottoinsieme OpenAPI di Gemini con i suoi limiti di rifiuto",
  "Progettare un adapter per i provider che isoli le cinque cose che davvero differiscono, invece di riscrivere il ciclo dell'agente per ogni fornitore",
]} />

<VerifyNote lastVerified="2026-11-11" source="https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools">
Ogni nome di campo e valore di enum in questa pagina è stato letto dalla documentazione attuale del provider alla data indicata sopra. I formati di rete cambiano — Google ha migrato la documentazione sul function calling a una nuova API e ora etichetta la forma classica come «Legacy» — quindi ricontrolla ogni fornitore prima di pubblicare: [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) · [OpenAI](https://developers.openai.com/api/docs/guides/function-calling) · [Google](https://aistudio.google.com/docs/function-calling) · [Mistral](https://docs.mistral.ai/capabilities/function_calling) · [vLLM](https://docs.vllm.ai/en/latest/features/tool_calling/) · [Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md).
</VerifyNote>

Il tool calling è l'idea più portabile dell'ingegneria degli agenti e il *codice* meno portabile. Il concetto è identico ovunque: descrivi alcune funzioni con uno schema JSON, il modello risponde chiedendone una, tu la esegui, restituisci il risultato e il ciclo continua. Quattro provider, un solo concetto — e **nemmeno un nome di campo in comune** lungo tutto il giro di andata e ritorno.

Questa pagina è il livello di traduzione. Se vuoi la forma di Anthropic in profondità — le tre regole sulla forma dei messaggi che restituiscono un 400, `strict: true`, i server tool — trovi tutto in [Tool Use / Function Calling](/docs/api/tool-use). Qui ci interessa solo ciò che cambia quando passi da un provider all'altro.

## Lo stesso tool, quattro dialetti

Un solo tool, `get_weather`, scritto in quattro modi. Leggi le tre righe che differiscono, non quelle che coincidono.

| | Anthropic Messages | OpenAI Chat Completions | OpenAI Responses | Gemini (classico) |
|---|---|---|---|---|
| **Dove vanno i tool** | `tools: [...]` | `tools: [...]` | `tools: [...]` | `tools: [{functionDeclarations: [...]}]` |
| **Forma della definizione** | piatta: `name`, `description`, `input_schema` | annidata: `{type: "function", function: {...}}` | piatta: `{type: "function", name, ...}` | piatta, dentro `functionDeclarations` |
| **Chiave dello schema** | `input_schema` | `parameters` | `parameters` | `parameters` |
| **Richiesta del modello** | blocco di contenuto `tool_use` | `tool_calls[]` sul messaggio | elemento `function_call` | parte `functionCall` |
| **Campo degli argomenti** | `input` — **un oggetto** | `function.arguments` — **una stringa** | `arguments` — **una stringa** | `args` — **un oggetto** |
| **ID di correlazione** | `id` | `id` | `call_id` | `id` |
| **La tua risposta** | blocco `tool_result` | messaggio con `role: "tool"` | elemento `function_call_output` | parte `functionResponse` |
| **Campo ID nella risposta** | `tool_use_id` | `tool_call_id` | `call_id` | `id` |
| **Payload del risultato** | `content` (stringa *oppure* blocchi tipizzati) | `content` (stringa) | `output` (stringa) | `response` (oggetto strutturato) |
| **Segnalazione errori** | `is_error: true` sul risultato | nessun campo dedicato | nessun campo dedicato | nessun campo dedicato |

Mistral segue esattamente la colonna di OpenAI Chat Completions — oggetto `function` annidato, `tool_calls` con `id` e una risposta `role: "tool"` che porta `name`, `content` e `tool_call_id`.

:::tip[Le tre righe che costano una giornata]
`input_schema` contro `parameters`, `input` contro `arguments`, e `tool_use_id` contro `tool_call_id` contro `call_id` contro `id`. Tutto il resto di quella tabella è estetica. Queste tre sono il punto in cui un porting produce in silenzio un ciclo che non termina mai.
:::

## Il bug «arguments è una stringa»

È il difetto cross-provider più comune e non si annuncia con un errore di tipo.

<Steps items={[
  {title: "Su Anthropic e Gemini gli argomenti sono già analizzati", body: "Il blocco tool_use di Anthropic porta input come oggetto JSON. La parte functionCall di Gemini porta args come oggetto. Leggi i campi direttamente e vai avanti."},
  {title: "Su OpenAI e Mistral gli argomenti sono una stringa codificata in JSON", body: "Chat Completions ti dà function.arguments e la Responses API ti dà arguments — entrambi sono stringhe che contengono JSON. Devi analizzarle prima dell'uso."},
  {title: "Perché il bug si nasconde", body: "In un linguaggio dinamico, accedere a una chiave di una stringa non genera un errore dove te lo aspetti — produce undefined o solleva un'eccezione in profondità nel tuo handler, e la colpa va al modello che avrebbe «allucinato un argomento sbagliato» quando il payload era perfetto. Il segnale è un tool che funziona su un provider e restituisce valori quasi vuoti su un altro con prompt identici."},
  {title: "La correzione è una riga nell'adapter, non nell'handler", body: "Normalizza al confine: analizza sui provider che inviano una stringa, passa direttamente su quelli che inviano un oggetto, e lascia che ogni handler di tool a valle presuma un oggetto già analizzato. Non spargere mai il parsing tra gli handler — è così che si ottiene un codebase in cui metà dei tool funziona su metà dei provider."},
  {title: "Poi gestisci un errore di parsing come risultato del tool, non come eccezione", body: "JSON malformato in quella stringa è possibile, a meno che tu non stia usando una modalità di decodifica vincolata. Intercettalo e restituisci l'errore al modello come risultato del tool, così può riprovare — mandare in crash il ciclo non insegna nulla al modello."}
]} />

<PromptCard title="Un normalizzatore che riduce tutti e quattro i dialetti a un'unica forma interna">{`// One adapter, four dialects. Every tool handler downstream sees {id, name, args}.
function normalizeToolCalls(providerResponse, provider) {
  switch (provider) {
    case "anthropic":
      // stop_reason === "tool_use"; arguments are ALREADY an object
      return providerResponse.content
        .filter((b) => b.type === "tool_use")
        .map((b) => ({ id: b.id, name: b.name, args: b.input }));

    case "openai-chat":
    case "mistral": {
      const calls = providerResponse.choices[0].message.tool_calls ?? [];
      // .arguments is a STRING — parse it exactly here and nowhere else
      return calls.map((c) => ({
        id: c.id,
        name: c.function.name,
        args: parseOrError(c.function.arguments),
      }));
    }

    case "openai-responses":
      return providerResponse.output
        .filter((i) => i.type === "function_call")
        .map((i) => ({
          id: i.call_id,                      // note: call_id, not id
          name: i.name,
          args: parseOrError(i.arguments),    // also a STRING
        }));

    case "gemini": {
      const parts = providerResponse.candidates[0].content.parts ?? [];
      return parts
        .filter((p) => p.functionCall)
        // Gemini echoes an id you must send back on the functionResponse
        .map((p) => ({ id: p.functionCall.id, name: p.functionCall.name, args: p.functionCall.args }));
    }
  }
}

function parseOrError(s) {
  try { return JSON.parse(s); } catch { return { __parseError: s }; }
}`}</PromptCard>

### Ollama non ha un ID di correlazione

Merita un titolo a parte, perché rompe un presupposto che il tuo adapter quasi certamente incorpora. L'endpoint `/api/chat` di Ollama accetta il campo `tools` in stile OpenAI e restituisce `tool_calls` le cui voci portano un `function` con `name` e `arguments` — ma il messaggio di risultato del tool documentato **non ha il campo `tool_call_id`**. La correlazione avviene per posizione e nome del tool, non tramite un ID.

Questo conta nel momento in cui un modello chiede due tool insieme: senza un ID su cui fare il match non puoi restituire i risultati fuori ordine, e due chiamate allo *stesso* tool con argomenti diversi sono distinguibili solo dalla loro posizione nell'array. Se esegui lo stesso agente sia su un provider ospitato sia su un modello Ollama locale — una configurazione comune per risparmiare, descritta in [Claude più modelli locali](/docs/models/claude-plus-local-models) — fai in modo che il tuo adapter sintetizzi localmente un ID basato sull'indice e preservi rigorosamente l'ordine dell'array. Ollama espone anche un endpoint `/v1` compatibile con OpenAI, che è il bersaglio più semplice se il tuo client è già scritto sulla forma di OpenAI.

## Forzare un tool: la trappola di portabilità che nessuno si aspetta

Ogni provider ha una manopola per «devi chiamare un tool». Per lo più concordano — e poi gli ultimi modelli di Claude rompono il pattern, che è il contrario della solita storia in cui Anthropic è la base portabile.

| Provider | Valori | Forza-un-tool-specifico |
|---|---|---|
| Anthropic | `auto` (predefinito con i tool), `any`, `tool`, `none` | `{"type": "tool", "name": "..."}` |
| OpenAI | `"auto"` (predefinito), `"required"`, `"none"` | `{"type": "function", "name": "..."}`, oppure `allowed_tools` |
| Gemini (classico) | `VALIDATED`, `AUTO`, `ANY`, `NONE` | `ANY` più `allowed_function_names` |
| Mistral | `auto` (predefinito), `any`, `none` | — |

<Callout type="warning" items={[
  "Su Claude Fable 5.2 e 5.1, Mythos 5.2 e 5.1, Opus 5.5 e Sonnet 5.5, i valori any e tool di tool_choice restituiscono un errore 400. La riga apparentemente portabile nel tuo adapter è quella che fallisce, e solo sui modelli più recenti — che sono anche quelli su cui vuoi di più eseguire.",
  "L'indicazione di Anthropic è usare auto insieme allo strict tool use. none funziona ancora ovunque."
]} />

Altre due asimmetrie in quella tabella sono facili da perdere:

- **`VALIDATED` di Gemini è una modalità che gli altri non hanno.** Diventa il predefinito quando sono abilitati anche tool integrati o output strutturati, e vincola l'output a una chiamata di funzione o a testo *con aderenza allo schema* — un'impostazione intermedia tra «decidi liberamente» e «devi chiamare qualcosa».
- **La modalità `ANY` di Gemini ha un tetto alla complessità dello schema.** La documentazione è esplicita: in modalità `ANY` schemi molto grandi o profondamente annidati possono essere rifiutati, perché lo schema viene compilato in una macchina a stati con limiti su stati, ramificazioni e annidamento; superarli produce un `400 INVALID_ARGUMENT`. Uno schema semplicemente prolisso su altri provider può essere *non valido* qui.

Per la storia più approfondita sul perché l'uso forzato dei tool viene ritirato su Claude — e i due lavori non correlati che svolgeva — vedi [Tool Use / Function Calling](/docs/api/tool-use).

## Tre dialetti di schema, non uno

Tutti dicono «JSON Schema». Solo alcuni intendono davvero questo.

<Steps items={[
  {title: "JSON Schema puro — Anthropic, OpenAI (non strict), Mistral, Ollama", body: "Passi un normale oggetto JSON Schema e il modello lo tratta come un'indicazione. Le parole chiave non supportate tendono a essere ignorate invece che rifiutate: un comportamento tollerante al momento della richiesta e poco utile in fase di debug, perché un vincolo scartato in silenzio dal provider è identico a un modello che l'ha ignorato."},
  {title: "OpenAI strict mode — un sottoinsieme deliberatamente ristretto", body: "Impostare strict: true su un tool aggiunge requisiti strutturali: additionalProperties: false su ogni oggetto, OGNI proprietà elencata in required (modella un campo opzionale come unione con null invece di ometterlo) e una radice che sia un oggetto, non un array o un primitivo nudo. La superficie supportata comprende i tipi di base, array con items, object con properties, enum e $ref/$defs per la ricorsione. La documentazione di OpenAI avverte che alcune parole chiave non sono supportate senza pubblicare un elenco esaustivo delle esclusioni, quindi considera non supportata una parola chiave che non conosci finché una richiesta non dimostra il contrario."},
  {title: "Gemini — un sottoinsieme dello schema OpenAPI, non JSON Schema", body: "La documentazione descrive il formato dei parameters come un sottoinsieme dello schema OpenAPI. In pratica è il dialetto che ha più probabilità di rifiutare uno schema portato da altrove, e quello in cui conviene testare con il tuo schema reale e non con uno di prova."},
  {title: "La mossa portabile: scrivi lo schema più semplice che funziona", body: "Oggetti piatti, proprietà primitive ed enum, array poco profondi, required esplicito, additionalProperties: false, nessuna composizione ingegnosa. Uno schema che soddisfa lo strict mode di OpenAI e resta abbastanza superficiale per la modalità ANY di Gemini sarà accettato ovunque — e i modelli seguono comunque più affidabilmente gli schemi semplici, quindi non perdi quasi nulla."}
]} />

Lo `strict: true` di Anthropic è trattato in [Tool Use](/docs/api/tool-use), e il percorso di *risposta* vincolata da schema (diverso dalla chiamata a un tool) in [Structured Output](/docs/api/structured-output).

## Cosa può contenere il risultato

Asimmetrico in un modo che conta per gli agenti multimodali:

- **Anthropic** — `tool_result.content` accetta una semplice stringa *oppure* un array di blocchi di contenuto tipizzati: `text`, `image`, `document`, `search_result`. Un tool può restituire uno screenshot e Claude lo guarderà.
- **Gemini** — `functionResponse.response` è per progetto un oggetto strutturato, non una stringa nuda.
- **OpenAI** — il `content` del messaggio `tool` di Chat Completions e l'`output` di `function_call_output` della Responses API sono documentati come campi stringa, quindi codifichi tu in JSON i dati strutturati.

Il minimo comune denominatore portabile è quindi «una stringa JSON», e il costo di adottarlo è rinunciare alla possibilità di Anthropic di restituire un'immagine da un tool. Se il tuo agente cattura schermate, fa scraping o esegue rendering, non è una perdita da poco — tienila come capacità specifica del provider dietro un feature flag invece di appiattirla.

## Pesi aperti: il parser fa parte del deployment

Eseguire un modello a pesi aperti non eredita gratis il tool calling. La forma di rete è compatibile con OpenAI, ma l'*estrazione* di una chiamata a un tool dal testo grezzo del modello è una questione lato server che devi configurare.

- **vLLM** serve la forma `tools`/`tool_calls` compatibile con OpenAI su `/v1/chat/completions`, ma richiede `--enable-auto-tool-choice` più un `--tool-call-parser` che indichi un parser specifico per il modello (l'insieme incluso comprende `llama3_json`, `mistral`, `hermes`, `granite`, `jamba`, `deepseek_v3`, `pythonic` e altri, e si possono registrare parser personalizzati con `--tool-parser-plugin`).
- Senza un parser caricato, una richiesta con un `tool_choice` nominato restituisce **HTTP 400**. Il primo uso di una scelta nominata paga anche una latenza una tantum di compilazione della macchina a stati.
- L'avvertenza onesta è nella documentazione stessa di vLLM: per alcuni modelli in formato Mistral una chiamata **non è garantita** nemmeno quando la scelta del tool è forzata. Qualsiasi contratto del tuo agente basato su «forzato significa forzato» ha bisogno di un percorso di ripiego qui.

<PromptCard title="Servire un modello a pesi aperti con tool call funzionanti (vLLM)">{`# The two flags are not optional: without them a named tool_choice returns 400.
vllm serve <model-id> \\
  --enable-auto-tool-choice \\
  --tool-call-parser hermes          # must match the model's tool-call format

# Then point any OpenAI-shaped client at it:
#   base_url = "http://localhost:8000/v1"
# Your adapter's "openai-chat" branch works unchanged — but keep a fallback
# for the documented case where a forced call does not arrive.`}</PromptCard>

Vedi [Eseguire modelli in locale con Ollama](/docs/models/run-models-locally-ollama) e [Agenti di coding locali](/docs/models/local-coding-agents) per la configurazione di contorno.

## Google ha spostato la documentazione — e l'API

Abbastanza attuale da meritare un paragrafo a sé, perché cambia su quale forma dovresti scrivere. La documentazione sul function calling di Google è stata migrata: la pagina su `ai.google.dev` ora serve per impostazione predefinita una **nuova Interactions API** e reindirizza ad AI Studio, mentre la forma classica di Generate Content — `functionDeclarations`, `functionCall`, `functionResponse`, `tool_config.function_calling_config.mode` — è **esplicitamente etichettata «Legacy».**

La nuova Interactions API usa una forma di tool piatta più vicina a quella di OpenAI: `{type: "function", name, description, parameters}`, con la richiesta del modello che arriva come `FunctionCallStep` con `name` e `arguments`, e la modalità impostata tramite `tool_choice` dentro `generation_config` con `auto`, `any` e `none`, più `allowed_tools` per limitare quali tool possono essere chiamati.

La lettura strategica: **il settore sta convergendo sulla forma piatta di OpenAI**, e Google si è appena mossa in quella direzione. Questo non fa sparire il problema — la divisione nella codifica degli argomenti e quella nel campo ID sopravvivono alla convergenza — ma significa che una nuova integrazione scritta oggi dovrebbe puntare alla forma piatta, e che la colonna Gemini classico nella tabella sopra è ormai lavoro di manutenzione e non lavoro nuovo.

## La checklist di portabilità

<Steps items={[
  {title: "Metti tutti e quattro i dialetti dietro un unico adapter, oggi", body: "Due funzioni: una che trasforma il tuo elenco interno di tool nella forma di definizione del provider, e una che normalizza la risposta del provider in {id, name, args}. Se i nomi dei provider compaiono in qualsiasi altro punto del codebase, dovrai fare il porting due volte."},
  {title: "Normalizza la codifica degli argomenti una volta sola", body: "Analizza dove il provider invia una stringa, passa direttamente dove invia un oggetto e fai di un errore di parsing un risultato del tool anziché un'eccezione."},
  {title: "Non dare mai per scontato che esista un ID di correlazione", body: "Sintetizza un ID basato sull'indice quando il provider non lo fornisce e preserva rigorosamente l'ordine dell'array, così il match per posizione funziona ancora."},
  {title: "Tratta la scelta forzata del tool come una capacità, non come un'impostazione", body: "Rilevala a runtime. Non è supportata sugli ultimi modelli di Claude, è inaffidabile per alcuni formati di modello sotto vLLM ed è limitata dalla complessità dello schema nella modalità ANY di Gemini. Progetta il prompt in modo che auto scelga il tool giusto e tieni la forzatura come ottimizzazione."},
  {title: "Scrivi un solo schema che soddisfi il dialetto più stretto", body: "Piatto, poco profondo, required esplicito, additionalProperties: false, nessuna parola chiave esotica. Supera lo strict mode di OpenAI, sopravvive al sottoinsieme OpenAPI di Gemini e i modelli lo seguono meglio."},
  {title: "Decidi consapevolmente a cosa rinunci", body: "Restituire un'immagine da un tool, forzare un tool specifico e la modalità VALIDATED di Gemini sono tutte capacità reali che non sopravvivono al minimo comune denominatore. Tienile dietro flag invece di fingere che i provider siano identici."},
  {title: "Testa il ciclo, non la chiamata", body: "Una singola tool call riuscita non dimostra quasi nulla. I bug vivono nel giro di andata e ritorno: il secondo turno, due chiamate insieme, un tool che va in errore e un risultato che non è una semplice stringa."}
]} />

<Flashcards title="Nomi di campo da memorizzare" cards={[
  {front: "Anthropic: chiave dello schema, blocco di richiesta, blocco di risposta", back: "input_schema sul tool; un blocco di contenuto tool_use con id, name e input (un oggetto); un blocco tool_result con tool_use_id, content e is_error opzionale. Lo stop_reason di primo livello è \"tool_use\"."},
  {front: "OpenAI Chat Completions: i tre nomi di campo", back: "parameters sull'oggetto function annidato; tool_calls[] sul messaggio dell'assistente, dove function.arguments è una STRINGA JSON; un messaggio di risposta con role \"tool\" e tool_call_id."},
  {front: "OpenAI Responses: cosa cambia rispetto a Chat Completions", back: "La definizione del tool diventa piatta — {type: \"function\", name, parameters, strict}. La richiesta arriva come elemento function_call e la risposta è un elemento function_call_output, e il campo ID è call_id invece di tool_call_id."},
  {front: "Gemini (classico): i quattro nomi", back: "tools: [{functionDeclarations: [...]}]; una parte functionCall con name, args (un oggetto) e id; una parte functionResponse con name, response (un oggetto strutturato) e l'id corrispondente."},
  {front: "Quali provider inviano gli argomenti come stringa?", back: "OpenAI (entrambe le API) e Mistral inviano una stringa codificata in JSON che devi analizzare. L'input di Anthropic e gli args di Gemini sono già oggetti. È il bug cross-provider più comune e fallisce in silenzio."},
  {front: "Quale provider non ha un ID di correlazione?", back: "Il messaggio di risultato del tool documentato di Ollama non ha tool_call_id — la correlazione è posizionale e per nome del tool. Sintetizza un ID basato sull'indice nel tuo adapter e non riordinare mai i risultati."},
  {front: "Equivalenti di tool_choice", back: "Anthropic auto / any / tool / none; OpenAI \"auto\" / \"required\" / \"none\"; Gemini VALIDATED / AUTO / ANY / NONE; Mistral auto / any / none. La forzatura non è supportata sugli ultimi modelli di Claude, che restituiscono un 400."},
  {front: "I tre dialetti di schema", back: "JSON Schema puro (Anthropic, OpenAI non strict, Mistral, Ollama); il sottoinsieme ristretto dello strict mode di OpenAI (additionalProperties false, ogni proprietà required, radice oggetto); il sottoinsieme dello schema OpenAPI di Gemini — quello che ha più probabilità di rifiutare uno schema portato da altrove."},
  {front: "I due flag obbligatori di vLLM", back: "--enable-auto-tool-choice e --tool-call-parser <name> corrispondente al formato del modello. Senza di essi, un tool_choice nominato restituisce HTTP 400. E per alcuni modelli in formato Mistral la documentazione dice che una chiamata non è garantita nemmeno quando è forzata."},
]} />

<Quiz questions={[
  {
    q: "Il tuo agente funziona su Claude e lo porti su OpenAI. Ora i tool vengono eseguiti ma ricevono campi vuoti, senza alcun errore di tipo. Cosa devi controllare per prima cosa?",
    options: [
      "Se lo schema del tool usa una parola chiave JSON Schema non supportata",
      "Se hai analizzato function.arguments, che OpenAI invia come stringa JSON mentre l'input di Anthropic è già un oggetto",
      "Se tool_choice è impostato su auto",
      "Se il modello supporta le chiamate parallele ai tool"
    ],
    answer: 1,
    explain: "Il tool_use.input di Anthropic e il functionCall.args di Gemini arrivano come oggetti; il function.arguments di OpenAI e l'arguments della Responses API arrivano come stringhe JSON. Accedere a chiavi di una stringa fallisce in silenzio in un linguaggio dinamico, ed è per questo che sembra che il modello invii argomenti sbagliati. Normalizza la codifica una volta sola, al confine dell'adapter."
  },
  {
    q: "Hai scritto un solo adapter e impostato tool_choice per forzare un tool specifico, perché quella riga sembrava identica tra i fornitori. Dove fallisce?",
    options: [
      "Su Gemini, che non ha modo di forzare un tool specifico",
      "Su OpenAI, che ha rimosso required",
      "Sugli ultimi modelli di Claude — any e tool restituiscono un 400",
      "Da nessuna parte; forzare è l'unica impostazione completamente portabile"
    ],
    answer: 2,
    explain: "È l'opposto della solita aspettativa. Su Claude Fable 5.2 e 5.1, Mythos 5.2 e 5.1, Opus 5.5 e Sonnet 5.5, i valori any e tool di tool_choice restituiscono un 400; l'indicazione è usare auto con lo strict tool use. Il required di OpenAI e l'ANY di Gemini funzionano ancora entrambi, e Gemini può persino limitare a tool nominati tramite allowed_function_names."
  },
  {
    q: "Esegui lo stesso agente su un provider ospitato e su un modello Ollama locale. Il modello chiede due tool in un solo turno e i tuoi risultati vengono associati alle chiamate sbagliate. Perché?",
    options: [
      "Ollama non supporta affatto le chiamate parallele ai tool",
      "Il messaggio di risultato del tool di Ollama non ha tool_call_id, quindi la correlazione è posizionale e per nome",
      "Ollama richiede un flag --tool-call-parser",
      "Ollama restituisce gli argomenti come stringa e il tuo parsing li ha riordinati"
    ],
    answer: 1,
    explain: "Il messaggio di risultato del tool documentato di Ollama non porta alcun campo tool_call_id — a differenza del tool_use_id di Anthropic, del tool_call_id / call_id di OpenAI e dell'id di Gemini. Senza un ID su cui fare il match, i risultati non possono essere restituiti fuori ordine, e due chiamate allo stesso tool sono distinguibili solo dalla posizione. Sintetizza un ID basato sull'indice nell'adapter e preserva l'ordine. (Il flag del parser riguarda vLLM, non Ollama.)"
  },
  {
    q: "Uno schema che funziona benissimo su Anthropic viene rifiutato da Gemini in modalità ANY con 400 INVALID_ARGUMENT. Qual è la causa più probabile?",
    options: [
      "Gemini richiede additionalProperties: false su ogni oggetto",
      "Lo schema è troppo grande o troppo annidato — la modalità ANY lo compila in una macchina a stati con dei limiti",
      "Gemini non supporta le proprietà enum",
      "La radice dello schema è un oggetto invece di un array"
    ],
    answer: 1,
    explain: "La documentazione di Gemini afferma che in modalità ANY schemi molto grandi o profondamente annidati possono essere rifiutati, perché lo schema viene compilato in una macchina a stati con limiti su stati, ramificazioni e annidamento. Uno schema semplicemente prolisso altrove può essere non valido qui — il che è l'argomento principale per scrivere lo schema più piatto che faccia il lavoro."
  }
]} />

<Callout type="takeaways" items={[
  "Un concetto, quattro dialetti: le uniche righe che davvero differiscono sono la chiave dello schema (input_schema contro parameters), il campo degli argomenti e il nome dell'ID di correlazione.",
  "Gli argomenti sono una stringa JSON su OpenAI e Mistral, e un oggetto già analizzato su Anthropic e Gemini — normalizza una volta sola, al confine dell'adapter.",
  "Ollama non fornisce un ID di correlazione; sintetizzane uno e non riordinare mai i risultati dei tool.",
  "Forzare una chiamata a un tool è portabile ovunque TRANNE che sugli ultimi modelli di Claude, che restituiscono un 400 su any e tool — rilevalo a runtime invece di darlo per scontato.",
  "Tre dialetti di schema, quindi scrivi per il più stretto: piatto, poco profondo, required esplicito, additionalProperties false, nessuna parola chiave esotica.",
  "I pesi aperti richiedono configurazione lato server — vLLM vuole --enable-auto-tool-choice più un --tool-call-parser corrispondente, e non garantisce una chiamata forzata per ogni formato di modello.",
  "Google ora etichetta come Legacy la forma classica di Gemini e la sua nuova API usa la forma piatta di OpenAI — punta alla forma piatta per qualsiasi cosa nuova.",
]} />

## Prossimi passi

- [Tool Use / Function Calling](/docs/api/tool-use) — la forma di Anthropic in profondità, incluse le tre regole sulla forma dei messaggi che restituiscono un 400
- [Portare i prompt tra modelli](/docs/models/porting-prompts-across-models) — cosa si trasferisce e cosa si rompe al di sopra del formato di rete
- [Prompt Caching tra provider](/docs/models/prompt-caching-across-providers) — l'altro punto in cui un'ottimizzazione dall'aspetto portabile si inverte in silenzio
- [AI Gateway: LiteLLM, OpenRouter, Portkey](/docs/models/ai-gateways-litellm-openrouter-portkey) — quando conviene comprare il livello di adapter invece di scriverlo
