# Inference Hooks: DLP inline per Claude Enterprise

> Source: https://derob98.github.io/ailmanac/it/docs/api/inference-hooks · AILmanac (CC BY 4.0) · last verified 2026-11-09

La guida operativa agli Inference Hooks di Claude Enterprise, ora GA — il webhook HTTPS che consente al tuo server DLP di autorizzare o negare ogni prompt E ogni chiamata a tool su chat, Claude Code, Cowork, M365 e Chrome, prima che il modello agisca. Spec completa, schema dei verdetti, firma, playbook di rollout.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "Cosa sono davvero gli Inference Hooks — un POST HTTPS da Anthropic verso un server che gestisci tu, non un WebSocket e non un agente on-device",
  "I DUE eventi hook ora che gli hook sono GA: un prompt hook prima dell'inference e un pre-tool-call hook prima che giri qualsiasi tool di una risposta",
  "Perché un solo verdetto tool_call copre OGNI chiamata a tool di quella risposta — non puoi autorizzarne alcune e negarne altre",
  "Lo schema del frame del prompt — cosa vede esattamente il tuo AI security server (e cosa non vede mai: system prompt, ragionamento nascosto, byte grezzi)",
  "Il JSON del verdetto: allow, deny con deny_reason, e perché deliberatamente oggi non esiste un'azione redact",
  "Il modello di firma — Standard Webhooks HMAC-SHA256, i due bug di verifica che colpiscono ogni prima integrazione, e il formato del segreto whsec_",
  "Le tre leve operative che decidono se gli utenti vengono bloccati o se il modello riceve traffico non ispezionato: timeout del verdetto, gestione dei fallimenti e circuit breaker",
  "Un playbook di rollout che non esplode il primo giorno — shadow mode → rollout percentuale → esclusioni per ruolo → enforce, in quest'ordine",
]} />

<VerifyNote lastVerified="2026-11-09" source="https://platform.claude.com/docs/en/manage-claude/inference-hooks">
**Gli Inference Hooks sono ora generalmente disponibili.** Le release notes della piattaforma Anthropic registrano l'uscita dalla beta il **20 ottobre 2026**, e l'annuncio sulla sicurezza di Claude Enterprise del **5 novembre 2026** conferma come GA *entrambi* i tipi di hook — prompt hook e pre-tool-call hook. Sono disponibili **solo per le organizzazioni Claude Enterprise**; configurarli richiede il permesso `organization:manage`, detenuto solo da Owner e Primary Owner. Restano fuori scope: le **organizzazioni Claude Platform (API)**, **Amazon Bedrock** e **Google Cloud**. La modalità vocale è ora coperta *solo in parte* — vedi la matrice di copertura, e non trattare gli hook come il tuo unico controllo per la voce. Spec canonica: [Inference hooks](https://platform.claude.com/docs/en/manage-claude/inference-hooks) · [Configure](https://platform.claude.com/docs/en/manage-claude/inference-hooks-configuration) · [Endpoint reference](https://platform.claude.com/docs/en/manage-claude/inference-hooks-endpoint).
</VerifyNote>

Annunciati in beta il 5 agosto 2026 e **generalmente disponibili da ottobre 2026**, gli **Inference Hooks** sono la prima risposta first-party di Anthropic alla domanda che ogni security team si pone dopo aver attivato una seat Claude Enterprise: *come impedisco a un prompt con dati regolamentati di raggiungere mai il modello?* La risposta, finora, era un proxy aziendale che intercettava il traffico TLS verso `claude.ai` — fragile, incompleto e cieco alla CLI Claude Code. Gli Inference Hooks spostano il punto di enforcement dentro il perimetro di Anthropic: per ogni prompt governato, Anthropic mette in pausa l'inference, invia in POST la transcript a un server gestito dalla tua organizzazione, e attende un `allow` o `deny` prima che il modello veda alcunché.

La GA ha portato la novità che conta di più per il lavoro agentico: un **secondo evento hook** che scatta sulle chiamate a tool, *dopo* che il modello ha deciso di agire ma *prima* che giri qualsiasi cosa.

## La versione in un paragrafo

La tua organizzazione espone un endpoint HTTPS. Anthropic gli invia ogni prompt governato — e, se attivi **Validate tool calls**, ogni batch di chiamate a tool — come `POST` firmato (Standard Webhooks HMAC-SHA256). Il tuo server risponde `{"action": "allow"}` e l'inference procede, oppure `{"action": "deny", "deny_reason": "..."}` e l'utente vede il motivo senza mai arrivare al modello. Una sola configurazione copre ogni prodotto Claude dell'org: chat, Claude Code, Cowork, Claude for Microsoft 365, Claude Tag, Claude in Chrome. Se il tuo server va in timeout o restituisce 500, la tua impostazione di **failure handling** decide se la richiesta blocca o procede non ispezionata. Fai rollout graduale con shadow mode + rollout percentuale + esclusioni per ruolo prima di attivare **Enforce verdicts**.

## I due eventi hook

<Steps items={[
  {title: "Prompt hook — type: \"prompt\"", body: "Scatta una volta per ogni richiesta di inference governata, prima che l'inference parta. Il verdetto copre l'intera transcript. È l'evento che esisteva in beta e quello da cui partono la maggior parte delle integrazioni."},
  {title: "Pre-tool-call hook — type: \"tool_call\"", body: "Scatta quando la risposta di Claude contiene chiamate a tool, prima che ne giri QUALSIASI. Scatta solo nelle organizzazioni con l'impostazione Validate tool calls attiva — non è implicita nell'attivare gli hook."},
  {title: "Il vincolo che dà forma alle tue regole", body: "Un solo verdetto tool_call si applica a OGNI chiamata a tool di quella risposta. Anthropic è esplicita: non puoi autorizzare alcune chiamate e negarne altre. La tua regola deve essere un giudizio sul batch — se anche solo una chiamata è inaccettabile, neghi l'intera risposta."},
  {title: "I risultati dei tool tornano tramite il PROMPT hook", body: "Non esiste un evento separato per i risultati dei tool. I risultati arrivano come blocchi tool_result dentro il frame del prompt successivo, quindi un contenuto di tipo esfiltrazione che torna da un tool viene intercettato al turno seguente, non alla chiamata."}
]} />

Su un frame `tool_call`, ogni blocco `tool_use` porta anche un oggetto `tool_info` il cui kind indica da dove arriva il tool: `platform`, `application`, `third_party` o `client`. È il campo su cui diramare la tua policy — un tool MCP `third_party` e un tool di piattaforma first-party meritano un livello di controllo molto diverso. Vedi [MCP tool poisoning e rug pull](/docs/security/mcp-tool-poisoning-and-rug-pulls) per capire perché.

Sono in scope le chiamate a tool fatte tramite skill, plugin, tool collegati, server MCP locali e codice eseguito dentro il tool di code execution.

<Callout type="warning" items={[
  "Una manciata di chiamate a tool interne di claude.ai può essere omessa dagli eventi tool_call — elencare connettori o skill, un suggerimento di ricerca web, un cambio di modello, la lettura dell'ora locale, la lettura di chat passate e memoria. Riappaiono come blocchi tool_use nel frame del prompt SUCCESSIVO, quindi le vedi comunque; semplicemente non puoi bloccarle al momento della chiamata.",
  "Le funzioni gestite da Anthropic che fanno proprie chiamate al modello non sono governate affatto: le scansioni di Claude Security (beta), Code Review (research preview) e gli smart report. Non dare per scontato che l'ispezione a livello di org significhi letteralmente ogni inference del tuo tenant."
]} />

## Inference Hooks vs Compliance API

Entrambe esistono per la stessa audience — team security, legal e compliance di Claude Enterprise — ma operano ai due estremi opposti del ciclo di vita della richiesta.

|                | Inference Hooks                                             | [Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api) |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Quando**     | Inline, prima che l'inference parta                         | A posteriori                                                                       |
| **Cosa fa**    | Autorizza o nega ogni richiesta governata in tempo reale    | Recupera attività, chat, file, progetti, utenti per audit ed export                |
| **Direzione**  | Anthropic → il tuo server                                   | Tu → Anthropic                                                                     |
| **Usalo per**  | Fermare una fuga                                            | Provare cosa è successo                                                            |

La maggior parte delle enterprise userà entrambi. Gli hook sono il filo teso; la Compliance API è il log di audit.

## Come funziona il round trip del verdetto

<Steps items={[
  {title: "L'utente invia un prompt su una superficie governata", body: "Un solo hook governa ogni prodotto Claude dell'org — chat claude.ai, Claude Code (web, desktop, CLI), Cowork, Claude for Microsoft 365, Claude Tag, Claude in Chrome — su web, desktop, mobile, CLI e Slack. Le richieste accessorie come la generazione del titolo della conversazione NON vengono inviate."},
  {title: "Anthropic mette in pausa l'inference e invia in POST la transcript al tuo endpoint", body: "Un POST HTTPS all'URL configurato dal tuo admin. Gli header includono Content-Type: application/json, User-Agent: anthropic-dlp/1 e i tre header di firma Standard Webhooks (webhook-id, webhook-timestamp, webhook-signature)."},
  {title: "Il tuo AI security server verifica la firma e valuta la transcript", body: "Calcola HMAC-SHA256 su `{webhook-id}.{webhook-timestamp}.{byte grezzi del body}` con il segreto whsec_ decodificato in base64. Rifiuta qualunque cosa più vecchia di 5 minuti dal tuo orologio o senza una firma corrispondente."},
  {title: "Il tuo server restituisce un verdetto JSON con HTTP 200", body: "O {\"action\": \"allow\"} o {\"action\": \"deny\", \"deny_reason\": \"...\"}. Anthropic legge al massimo 64 KiB dal body della risposta e NON segue i redirect."},
  {title: "Anthropic applica il verdetto", body: "Su allow, l'inference procede normalmente. Su deny, l'utente vede il tuo deny_reason seguito dal messaggio permanente configurato dal tuo admin; il modello non vede mai il prompt. Ogni negazione viene registrata nell'Activity Feed dell'organizzazione."},
]} />

Il senso di far girare tutto sui server di Anthropic, non sui device degli utenti, è *l'uniformità*: una config, un server, e ogni richiesta governata su ogni superficie viene ispezionata allo stesso modo. Non c'è nulla da installare sui laptop dei dipendenti, e non c'è alcuna integrazione per-app da tenere sincronizzata.

## Il frame del prompt

Ogni richiesta è un body JSON con questi campi top-level:

| Campo        | Tipo          | Descrizione                                                                                                                                                                                                                              |
| ------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`       | string        | `"prompt"` o `"tool_call"` — vedi [i due eventi hook](#i-due-eventi-hook). Resta un enum aperto: restituisci `allow` su valori non riconosciuti così non attivi il circuit breaker.                                                                                            |
| `request_id` | string        | Identificatore opaco per chiamata di inference. Coincide con l'header `webhook-id` — usalo come chiave di idempotenza.                                                                                                                    |
| `tenant_id`  | string \| null | Identificatore opaco per l'organizzazione.                                                                                                                                                                                              |
| `actor`      | object        | Discriminato su `type` (`"user"` è l'unico valore oggi). Porta un `id` taggato stabile tra le richieste di un utente e `email_address` quando disponibile. Entrambi i campi possono essere null.                                          |
| `source`     | object        | `{"application": "..."}`. Valori noti: `claude-ai`, `claude-code`, `cowork`, `config-test` (usato dal pulsante admin "Test connection"). Enum aperto — appariranno nuovi valori.                                                                    |
| `session_id` | string \| null | Identificatore opaco della conversazione. Non parsarlo. Best-effort per Claude Code.                                                                                                                                                    |
| `model`      | string \| null | Identificatore pubblico del modello per questa richiesta, quando disponibile.                                                                                                                                                            |
| `messages`   | array         | La transcript della conversazione fino al punto di inference — vedi [Blocchi di contenuto](#blocchi-di-contenuto).                                                                                                                            |
| `metadata`   | object        | Mappa di estensione riservata. Oggi vuota. Tollera chiavi che non conosci.                                                                                                                                                              |

Una richiesta live minima ha questo aspetto:

```json
{
  "type": "prompt",
  "request_id": "req_abc123",
  "tenant_id": "11111111-1111-1111-1111-111111111111",
  "actor": {
    "type": "user",
    "id": "user_01AbCdEfGhIjKlMnOpQrStUv",
    "email_address": "alice@example.com"
  },
  "source": { "application": "claude-ai" },
  "session_id": "22222222-2222-2222-2222-222222222222",
  "model": "claude-sonnet-5",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Summarize the attached report." },
        {
          "type": "attachment",
          "file_name": "q2-report.pdf",
          "media_type": "application/pdf",
          "size_bytes": 48213,
          "text": "Q2 revenue grew 14% quarter over quarter..."
        }
      ]
    }
  ],
  "metadata": {}
}
```

### Blocchi di contenuto

Ogni entry `messages[].content[]` ha un `type` e segue il modello dei content block dell'API Messages pubblica. I risultati dei tool appaiono sotto il ruolo `user`.

| `type` del blocco | Campi                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`            | `text`                                                                                                                                            |
| `tool_use`        | `id`, `tool_name`, `input`                                                                                                                        |
| `tool_result`     | `content` (testo, unito con newline; le parti binarie sono marker segnaposto), `is_error`, `tool_name`, `tool_use_id`                             |
| `attachment`      | `file_name`, `media_type`, `size_bytes`, `text` (testo estratto, transcript o metadati del link)                                                  |

### Cosa non contiene mai la transcript

È la parte che fa inciampare i privacy review.

- **Nessun system prompt.** Né quelli di Anthropic, né i tuoi (via projects/skills), né la costituzione del modello — niente di tutto ciò viene inviato.
- **Nessun ragionamento nascosto.** La catena di extended-thinking di Claude non fa parte della transcript che il tuo server vede.
- **Nessuna definizione di tool.** Solo le chiamate e i loro risultati.
- **Nessun byte grezzo.** File e immagini sono rappresentati da metadati e testo estratto. Il contenuto solo-immagine (uno screenshot di un documento) non verrà ispezionato.
- **Nessun contesto interno di Anthropic** o trust boundary.

La transcript è la conversazione *come la vede l'utente finale*, più le tracce dei tool. Un blocco o turno i cui contenuti sono tutti esclusi viene rimosso interamente, quindi **non dare per scontata la stretta alternanza user/assistant** quando parsi.

### Un gotcha sulla size

Le transcript vengono inviate **non troncate**. Il protocollo stesso ammette fino a **64 MiB**; l'indicazione di Anthropic è che la finestra di contesto del modello mantiene i body reali **sotto circa 10 MB** in pratica. Dimensiona i tuoi limiti sulla cifra pratica e la tua gestione degli errori su quella del protocollo.

I default comuni sono molto più piccoli — nginx `client_max_body_size` è **1 MB**, Express `express.json()` è **100 kB**, la maggior parte dei reverse proxy PaaS si ferma a pochi MB. Un body che il tuo server rifiuta è un webhook failure, che sotto la failure handling **Allow the request** significa che il prompt oversize raggiunge il modello **non ispezionato**. Alza i limiti del body prima di fare enforce.

## Lo schema del verdetto

Rispondi con HTTP 200 per entrambi gli esiti. Il campo `action` fa da discriminante.

Allow:

```json
{ "action": "allow" }
```

Deny:

```json
{
  "action": "deny",
  "deny_reason": "This prompt appears to contain customer payment card data, which your organization's policy does not allow.",
  "reference_id": "scan_01HXPT4R9V"
}
```

| Campo          | Tipo & limite                                                    | Semantica                                                                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`       | `"allow"` o `"deny"`; obbligatorio                               | `allow` lascia procedere l'inference. `deny` rifiuta la richiesta.                                                                                                                                                                            |
| `deny_reason`  | string o null; **al massimo 500 caratteri, valori più lunghi vengono troncati**  | Mostrato all'utente finale, in coda al messaggio permanente configurato dal tuo admin. Scrivilo per l'utente — digli cosa cambiare, non come si chiamava la regola del tuo scanner.                                                             |
| `reference_id` | string o null; **al massimo 50 caratteri da `[A-Za-z0-9._:/-]`** | Il tuo identificatore per questa valutazione. Registrato sull'entry `inference_hooks_request_denied` della negazione nell'Activity Feed, mai mostrato all'utente finale. Tienilo opaco — niente contenuto della richiesta, niente dati personali. |

### Perché non c'è un'azione redact

Il verdetto è deliberatamente binario. Anthropic avrebbe potuto aggiungere `{"action": "redact", "rewritten_prompt": "..."}` e lasciare che il tuo server DLP sanitizzasse la transcript in transito — ma questo significherebbe che Anthropic invia al modello qualunque cosa restituisca la tua scatola, sotto l'autorità della tua organizzazione. Il design mantiene netto quel trust boundary: il tuo server *valuta* i contenuti, non li *scrive*. Se hai bisogno di redazione, falla nel client prima che l'utente prema invio.

### Un deny non viene mai scartato per problemi di formato

Un `deny_reason` oversize viene troncato; un `reference_id` malformato viene silenziosamente scartato; l'`action` resta comunque onorata. Il contrario non vale: qualunque cosa diversa da HTTP 200 con un verdetto parsabile è un **webhook failure**, non un deny. Se segnali i blocchi con `HTTP 403` i tuoi deny si trasformano silenziosamente in allow fail-open (o blocchi, a seconda della failure handling) e ognuno di essi conta contro il circuit breaker.

## Il server funzionante più piccolo

<PromptCard title="AI security server allow-all in 12 righe di Python">
{`# Run with: python server.py — expose on an https:// URL your admin configures.
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class VerdictHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # keep the connection open between verdicts
    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        verdict = b'{"action": "allow"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(verdict)))
        self.end_headers()
        self.wfile.write(verdict)

ThreadingHTTPServer(("", 8000), VerdictHandler).serve_forever()`}
</PromptCard>

Mettilo dietro un reverse proxy TLS-terminating sulla porta 443, configuralo come tuo endpoint, premi **Test connection** nella console admin — vedrai il verdetto allow. Questa è esattamente la forma di un'integrazione archival-only: restituisci `allow` incondizionatamente e persisti il frame dopo aver risposto, come alternativa push al polling della Compliance API. **Non** è una forma con cui dovresti fare enforcement — accetta ogni richiesta, incluse quelle non firmate. Aggiungi la verifica della firma prima di attivare **Enforce verdicts**.

## Verifica della firma

La firma segue la spec [Standard Webhooks](https://www.standardwebhooks.com/). Tre header, lowercase come li invia Anthropic ma case-insensitive in lookup (i proxy ricambiano il case).

| Header              | Contenuto                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `webhook-id`        | Univoco per delivery. Coincide con il `request_id` del body. Usalo come chiave di idempotenza.                                                                                                                                 |
| `webhook-timestamp` | Unix time in secondi, come stringa decimale. Rifiuta se più di **5 minuti** dal tuo orologio in una qualsiasi direzione — quella è la replay window.                                                                          |
| `webhook-signature` | Valori `v1,<base64>` separati da spazio. Ognuno è un HMAC-SHA256 sulla stringa di byte `{webhook-id}.{webhook-timestamp}.{byte grezzi del body}`. Accetta la richiesta se un qualunque valore matcha il tuo — usa confronto a tempo costante. |

### I due bug che colpiscono ogni prima integrazione

<Callout type="warning" items={[
  "Verifica i byte grezzi, NON JSON ri-serializzato. Calcola l'HMAC sul body esattamente come ricevuto, prima di qualunque parsing o riserializzazione. Un round trip json.loads() → json.dumps() cambia i whitespace e muore qui.",
  "Decodifica il segreto con un decoder base64 STANDARD, non URL-safe. Il signing secret è il valore dopo il prefisso whsec_, codificato con l'alfabeto standard (+ e /). Un decoder URL-safe deriva i byte di chiave sbagliati ogni volta che il segreto contiene + o /, ovvero quasi sempre — e il fallimento è un mismatch silenzioso a tempo costante."
]} />

Implementazione Python di riferimento (compressa dai docs Anthropic):

```python
import base64, hashlib, hmac, time

TOLERANCE_SECONDS = 300

def verify(secret: str, headers: dict[str, str], body: bytes) -> bool:
    h = {k.lower(): v for k, v in headers.items()}
    try:
        msg_id, ts, sigs = h["webhook-id"], h["webhook-timestamp"], h["webhook-signature"]
    except KeyError:
        return False  # unsigned, not from Anthropic
    try:
        signed_at = int(ts)
    except ValueError:
        return False
    if abs(time.time() - signed_at) > TOLERANCE_SECONDS:
        return False  # replayed, or clocks disagree
    try:
        key = base64.b64decode(secret.removeprefix("whsec_"), validate=True)
    except ValueError:
        return False  # misconfigured secret
    payload = f"{msg_id}.{ts}.".encode() + body
    expected = b"v1," + base64.b64encode(hmac.new(key, payload, hashlib.sha256).digest())
    return any(hmac.compare_digest(expected, s.encode()) for s in sigs.split())
```

### Rotazione del segreto

La rotazione è un cutover immediato lato admin, **ma le richieste firmate con il segreto precedente possono ancora arrivare per circa un minuto dopo**, oltre a tutto ciò che è già in transito. Fa' in modo che il tuo server accetti firme sia dal vecchio che dal nuovo segreto durante la finestra di rotazione così quegli stragglers non vengano rifiutati come non firmati.

### Eccezione una tantum

Un test di connessione inviato **prima del primo salvataggio della tua organizzazione** arriva non firmato, perché il signing secret ancora non esiste. Accetta le richieste non firmate finché il tuo admin non conferma che il segreto esiste, poi rifiutale.

## Semantica operativa

### Timeout

Il tuo admin imposta un timeout del verdetto tra **1 e 10.000 ms**, con default a **5.000 ms**. Quel budget copre l'intero round trip: connessione, handshake TLS, upload del body della richiesta, download del body della risposta.

### Retry

Anthropic ritenta **esattamente una volta, dopo un ritardo di 100 ms, e solo quando il tentativo di connessione fallisce**. Non su 500. Non su timeout. Non su errori di parse. Una volta che il tuo server ha risposto — con qualunque cosa — lo scambio è chiuso. Il retry condivide lo stesso budget di timeout e porta lo stesso `webhook-id` e la stessa firma, quindi è sicuro chiavare la deduplica su `webhook-id`.

### Gestione dei fallimenti

Tutto il resto che non è un 200 pulito con verdetto è un **webhook failure**: timeout, status non-200 (redirect inclusi), body di risposta non parsabili o oversize, endpoint irraggiungibili. Al fallimento, decide l'impostazione della tua organizzazione:

- **Block the request.** Default sicuro per ambienti ad alta regolazione. Se il tuo server DLP è giù, gli utenti sono bloccati. La disponibilità di Claude diventa la disponibilità del tuo scanner.
- **Allow the request.** Gli utenti continuano a lavorare mentre il tuo server si riprende. I prompt fluiscono non ispezionati durante il disservizio — un tradeoff accettato da molte org, ma pianifica come riconciliare il gap nel tuo audit trail.

### Circuit breaker

Fallimenti di webhook sostenuti attribuibili al tuo AI security server **fanno scattare un circuit breaker** che ferma l'enforcement: Anthropic smette di chiamare il tuo server, e la failure handling si applica a ogni richiesta.

**Il recovery è automatico.** La documentazione attuale di Anthropic afferma che il breaker **si resetta quando tornano verdetti validi** — non devi riattivare a mano **Enforce verdicts**, come in beta. È un vero miglioramento con una conseguenza spiacevole: un server *intermittentemente* guasto può entrare e uscire dall'enforcement senza che nessuno apra un ticket. Costruisci i tuoi alert sugli scatti del breaker registrati nell'Activity Feed, non sulle lamentele degli utenti — quando un utente se ne accorge, il breaker può essersi già resettato e aver cancellato il sintomo.

In pratica il breaker significa anche: **un `type` top-level sconosciuto dovrebbe restituire `{"action": "allow"}`, non un HTTP 500** — altrimenti un futuro nuovo tipo di evento ti farebbe finire in territorio circuit-breaker il giorno del rollout. L'evento `tool_call` che arriva con la GA è esattamente lo scenario per cui quella regola è stata scritta.

### Latenza

Ogni richiesta governata nella tua organizzazione paga il round-trip del tuo AI security server in latenza aggiunta. Fai load-test prima di rilasciare su un'org grande; uno scanner da 4 secondi è invisibile su un prompt di chat ma un incubo sui loop di tool di Claude Code che fanno molte richieste di fila.

### Allowlist degli IP sorgente

Le richieste originano da `160.79.106.0/24`, parte degli [outbound IP range](https://platform.claude.com/docs/en/api/ip-addresses) pubblicati da Anthropic. Metti in allowlist quel blocco, **non** i range inbound sulla stessa pagina — sono liste diverse. E l'allowlisting non sostituisce la verifica della firma: il blocco trasporta traffico egress di Anthropic oltre agli Inference Hooks.

## Il playbook di rollout

<Steps items={[
  {title: "Shadow mode — osserva i verdetti, non bloccare nulla", body: "La prima cosa che attivi. Il tuo server valuta ogni richiesta ma nessun deny viene applicato. Puoi tarare le tue regole contro una settimana di traffico reale prima che un singolo utente venga bloccato."},
  {title: "Rollout percentuale — ispeziona una frazione", body: "Quando attivi l'enforcement, parti (per esempio) dal 10% e sali. Riduce il blast radius se il tuo scanner ha uno spike di falsi positivi."},
  {title: "Esclusioni per ruolo — esenta ciò che devi", body: "I ruoli che sai bruceranno prompt più velocemente di quanto il tuo scanner riesca a stare al passo (senior engineering, SRE on-call) possono essere esentati mentre tari. Non per sempre — ma utile durante la rampa."},
  {title: "Enforce verdicts — nega davvero", body: "Solo dopo che i tre precedenti hanno girato puliti per un periodo di soak che imposti tu. Questo è quando le tue stringhe deny_reason cominciano finalmente a raggiungere gli utenti, quindi rivedile ancora una volta prima di girare l'interruttore."},
]} />

I docs Anthropic lo dicono chiaramente: *bloccare i dipendenti il primo giorno è il modo in cui i programmi DLP muoiono.* Lo shadow mode esiste per un motivo.

## Progetta la tua integrazione

<Callout type="tip" items={[
  "Fai deduplica su webhook-id. È univoco per delivery e matcha request_id nel body. Un retry da connection-failure lo riusa, quindi è una chiave di idempotenza pulita.",
  "Salva ogni verdetto con il suo reference_id. Anthropic registra reference_id sull'entry dell'Activity Feed di ogni negazione, così puoi ricollegare le negazioni all'esatta decisione di scan nel tuo sistema.",
  "Per integrazioni archival always-allow, RISPONDI prima, poi persisti. Rispondere prima di scrivere tiene il tuo round trip fuori dal critical path dell'utente — il tuo sistema di storage non è sul hot path.",
  "Scrivi deny_reason per la persona, non per il SIEM. 'Rimuovi i numeri di carta di credito dal tuo prompt e invia di nuovo' batte 'PCI_REGEX_2A tripped, reference 4471'. Gli utenti agiranno sul primo."
]} />

## Matrice di copertura

La formulazione di Anthropic è "**including, but not limited to**" — considera l'elenco dei sì un minimo, non un insieme fisso.

| Superficie / accesso                         | Ispezionata dagli Inference Hooks?                                |
| -------------------------------------------- | ----------------------------------------------------------------- |
| claude.ai (web, desktop, mobile)             | ✅ Sì                                                              |
| Claude Code (web, desktop, CLI)              | ✅ Sì (`session_id` è best-effort, dichiarato dal client)          |
| Claude Cowork                                | ✅ Sì                                                              |
| Claude for Microsoft 365                     | ✅ Sì                                                              |
| Claude Tag                                   | ✅ Sì                                                              |
| Claude in Chrome                             | ✅ Sì                                                              |
| Slack                                        | ✅ Sì                                                              |
| Chiamate a tool via skill, plugin, connettori, MCP locale, code execution | ✅ Sì, con **Validate tool calls** attivo |
| Modalità vocale                              | ⚠️ **Parziale** — prompt e chiamate a tool vengono inviati, ma Anthropic avverte che una piccola parte delle chiamate a tool non lo è. Non è un controllo unico sufficiente per la voce. |
| Alcune chiamate a tool interne di claude.ai  | ⚠️ Omesse dagli eventi `tool_call`; visibili nel frame del prompt successivo |
| Scansioni Claude Security, Code Review, smart report | ❌ Funzioni gestite da Anthropic che fanno proprie chiamate al modello — non governate |
| Generazione titolo conversazione, altri accessori | ❌ Non inviati                                                 |
| System prompt, definizioni di tool           | ❌ Mai inviati                                                     |
| Byte grezzi di file / immagini               | ❌ Mai inviati (il testo estratto sì)                              |
| Contenuto solo-immagine (es. screenshot di doc) | ❌ Non ispezionato                                              |
| API key di Claude Platform (accesso developer) | ❌ Fuori scope degli Inference Hooks (org Platform, non Enterprise) |
| Deploy su Amazon Bedrock / Google Cloud      | ❌ Non disponibile su quei piani                                   |

## Il controllo complementare: il security center

Gli hook applicano. Il **security center** — rilasciato **in beta** insieme all'annuncio GA del 5 novembre 2026 — ti dice se il resto della tua configurazione è sensato. È una pagina nelle impostazioni dell'organizzazione che confronta le tue impostazioni effettive per chat, Cowork e Claude Code con la configurazione consigliata da Anthropic.

<Steps items={[
  {title: "Ricontrolla a ogni caricamento della pagina", body: "Non è un job notturno. Ogni visita valuta la configurazione corrente, quindi si può usare come diff prima e dopo una modifica invece che come report mensile."},
  {title: "Per ogni controllo mostra tre cose", body: "Il tuo valore corrente, il valore consigliato da Anthropic dove ne esiste uno e un link diretto all'impostazione. Segnala anche le impostazioni nuove o cambiate di recente — ed è la parte che intercetta la deriva che non hai causato tu."},
  {title: "Le attestazioni danno alla revisione uno spazio di lavoro", body: "Una superficie condivisa in cui i tuoi admin registrano lo stato dei controlli, accettano esplicitamente i rischi e segnalano problemi. È ciò che trasforma 'ci abbiamo dato un'occhiata' in qualcosa di verificabile."},
  {title: "Il report distingue ciò che è verificato da ciò che è dichiarato", body: "Il report scaricabile indica quali controlli sono stati verificati automaticamente e quali un Owner ha confermato a mano. Mantieni questa distinzione quando lo consegni a un auditor."},
  {title: "Leggilo tramite la Compliance API, se preferisci", body: "Le organizzazioni con accesso alla Compliance API possono ottenere gli stessi risultati in modo programmatico invece di caricare la pagina."}
]} />

<Callout type="warning" items={[
  "Anthropic dichiara che il security center è una guida basata sulle proprie raccomandazioni, NON una certificazione. Non attesta la conformità a nessun framework, e una pagina tutta verde non è di per sé una prova per un auditor — ciò che consegni sono le attestazioni e il report."
]} />

Tutto il resto di quel pacchetto del 5 novembre è ancora **beta**: gestione centralizzata tramite una console org padre su `admin.claude.com`, sign-out dei membri ovunque via Admin API, allowlist IP self-serve, gestione delle impostazioni di Claude Desktop e sensori EDR in Cowork su macOS e Windows (distribuiti via MDM, in modalità detection). Gli Inference Hooks sono l'unico elemento GA del gruppo — pianifica i tuoi controlli di conseguenza.

## Errori comuni

<Callout type="warning" items={[
  "Segnalare un blocco con HTTP 403. È un webhook failure, non un deny — il tuo verdetto di policy viene buttato via e la failure handling prende il sopravvento.",
  "Restituire qualunque action diversa da 'allow' o 'deny'. Stessa storia: webhook failure. Se sei tentato di aggiungere un terzo stato, fallo nel tuo audit log, non nel verdetto.",
  "Limiti default piccoli sul body (Express 100 kB, nginx 1 MB). Una transcript da 3 MB con il testo estratto di un PDF grosso farà 413 sul tuo reverse proxy. Alza i limiti per accogliere il tetto da 10 MB.",
  "Decodifica base64 URL-safe del segreto whsec_. Mismatch silenzioso a tempo costante su ogni richiesta finché non ti accorgi che tutte le tue richieste sono 'non firmate'.",
  "Ri-serializzare il body prima dell'HMAC. Verifica i byte grezzi esattamente come ricevuti. json.loads + json.dumps cambia i whitespace e rompe la firma.",
  "Rifiutare `type` top-level sconosciuti con 500. Fa scattare il circuit breaker il giorno in cui Anthropic rilascia un nuovo tipo di evento. Restituisci `allow` sui type sconosciuti.",
  "Rifiutare valori di `source.application` che non riconosci. È un enum aperto. Nuovi valori appariranno e le vecchie integrazioni non devono blocarsi su di essi.",
  "Presupporre l'alternanza user/assistant. I turni i cui blocchi sono tutti esclusi vengono rimossi da `messages`. Parsa in modo difensivo."
]} />

## Quando usare Inference Hooks vs un proxy client-side

Alcune org girano ancora proxy TLS-intercepting per coprire *tutto* ciò che i loro dipendenti fanno online. Gli Inference Hooks non sostituiscono un proxy — sono un punto di enforcement specifico per Claude che sta *dentro* il perimetro di Anthropic e vede una vista strutturata più ricca della conversazione di quanto veda un proxy che sulla wire osserva solo byte cifrati.

- Usa **Inference Hooks** quando vuoi accesso strutturato a ciò che il modello vedrà davvero (tool call, allegati, transcript), copertura uniforme su chat + Code + Cowork, e nessun install per-device.
- Tieni il tuo **network DLP** per tutto il resto sulla box: upload di file verso servizi non-Claude, traffico browser fuori da claude.ai, allegati email. I due non si sovrappongono.
- Aggiungi la **[Compliance API](https://platform.claude.com/docs/en/manage-claude/compliance-api)** per audit ed export a posteriori.

## Quiz

<Quiz questions={[
  {
    q: "Anthropic contatta il tuo AI security server come?",
    options: [
      "Un WebSocket firmato, una singola connessione persistente per org",
      "Un POST HTTPS per richiesta governata, firmato secondo Standard Webhooks",
      "Uno stream gRPC con mTLS",
      "Un loop di polling — il tuo server tira i verdetti pending"
    ],
    answer: 1,
    explain: "Un POST HTTPS per ogni richiesta governata. Firmato con i tre header Standard Webhooks (webhook-id, webhook-timestamp, webhook-signature) usando HMAC-SHA256."
  },
  {
    q: "Il tuo scanner DLP rileva una violazione di policy. Quale risposta è corretta?",
    options: [
      "HTTP 403 con { \"error\": \"blocked\" }",
      "HTTP 200 con { \"action\": \"deny\", \"deny_reason\": \"...\" }",
      "HTTP 200 con { \"action\": \"redact\", \"rewritten_prompt\": \"...\" }",
      "HTTP 451 con il motivo in un header"
    ],
    answer: 1,
    explain: "Il deny è sempre HTTP 200 con { \"action\": \"deny\", \"deny_reason\": \"...\" }. HTTP 403 è un webhook FAILURE — il tuo verdetto viene buttato via e la failure handling prende il sopravvento. Oggi non c'è un'azione redact; il verdetto è deliberatamente binario."
  },
  {
    q: "Il tuo AI security server è giù per un rolling deploy e restituisce 500 per 90 secondi. Cosa succede ai prompt degli utenti in quella finestra?",
    options: [
      "Vanno in coda lato Anthropic e vengono processati quando il tuo server si riprende",
      "Decide la tua impostazione di failure handling — o bloccano, o procedono non ispezionati",
      "Bloccano sempre; il fallimento è fail-closed di default",
      "Procedono sempre; il fallimento è fail-open di default"
    ],
    answer: 1,
    explain: "I 500 sono webhook failure. L'impostazione di failure handling della tua organizzazione (Block the request vs Allow the request) sceglie da che parte del tradeoff stai. Fallimenti sostenuti fanno anche scattare il circuit breaker, dopo di che la failure handling si applica a ogni richiesta — anche se il breaker ora si resetta automaticamente quando tornano verdetti validi, quindi un server intermittentemente guasto può entrare e uscire dall'enforcement in silenzio."
  },
  {
    q: "Arriva un frame tool_call con tre chiamate a tool: la lettura di un documento interno, una ricerca MCP third-party e una scrittura su un sistema di ticket esterno. La tua policy si oppone solo alla terza. Cosa puoi restituire?",
    options: [
      "Un array di verdetti per chiamata che autorizza le prime due e nega la terza",
      "{ \"action\": \"deny\" } — un solo verdetto le copre tutte e tre, quindi l'intera risposta è bloccata",
      "{ \"action\": \"redact\" } con la terza chiamata rimossa",
      "HTTP 207 Multi-Status con esiti individuali"
    ],
    answer: 1,
    explain: "Un solo verdetto tool_call si applica a ogni chiamata a tool di quella risposta — Anthropic dice esplicitamente che non puoi autorizzarne alcune e negarne altre. La tua regola deve essere un giudizio sul batch, quindi una sola chiamata discutibile nega la risposta. Dirama la tua policy sul kind di tool_info di ogni blocco tool_use (platform / application / third_party / client) per decidere quanto essere severo."
  },
  {
    q: "Hai attivato gli Inference Hooks a livello di org e il tuo prompt hook riceve traffico, ma non vedi un solo evento tool_call anche se gli utenti usano Claude Code con server MCP. Qual è la causa più probabile?",
    options: [
      "Le chiamate a tool scattano solo per i tool third_party",
      "L'impostazione di organizzazione Validate tool calls è disattivata",
      "Gli eventi tool_call sono solo per Claude Platform",
      "Il tuo timeout del verdetto è troppo basso, quindi gli eventi dei tool vengono scartati"
    ],
    answer: 1,
    explain: "L'evento tool_call scatta solo nelle organizzazioni che hanno Validate tool calls attivo. Attivare gli hook non lo implica. Nota anche che i RISULTATI dei tool non arrivano mai come evento a sé — tornano come blocchi tool_result nel frame del prompt successivo."
  }
]} />

## Fonti

- Anthropic — [Inference hooks](https://platform.claude.com/docs/en/manage-claude/inference-hooks) (panoramica: i due eventi, superfici, esclusioni, failure handling)
- Anthropic — [Develop an Inference hooks integration](https://platform.claude.com/docs/en/manage-claude/inference-hooks-endpoint) (schemi di frame e verdetto, firma)
- Anthropic — [Configure Inference hooks](https://platform.claude.com/docs/en/manage-claude/inference-hooks-configuration)
- Centro assistenza Anthropic — [Inference hooks overview](https://support.claude.com/en/articles/16059458-inference-hooks-overview) (piani abilitati, chi può gestirli)
- Anthropic — [More visibility and control over Claude Enterprise for security teams](https://claude.com/resources/articles/claude-enterprise-security-updates) (5 novembre 2026: conferma GA, security center, attestazioni, il pacchetto beta)
- Centro assistenza Anthropic — [Review your organization's security posture with the security center](https://support.claude.com/en/articles/18246629-review-your-organization-s-security-posture-with-the-security-center)
- Anthropic — [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) (20 ottobre 2026: hook fuori dalla beta)

## Prossimo

- [Admin API: automatizza la tua org Claude](/docs/api/admin-api) — endpoint di gestione utenti e RBAC Enterprise che si sposano naturalmente con gli hook.
- [MCP tool poisoning e rug pull](/docs/security/mcp-tool-poisoning-and-rug-pulls) — la minaccia che il campo kind di `tool_info` serve a far triagiare.
- [MCP 2026-07-28: la spec stateless](/docs/api/mcp-2026-07-28-stateless) — il lato tool-call di ciò che i tuoi hook vedranno nei blocchi `tool_use` e `tool_result`.
- [Rifiuti e sicurezza](/docs/api/refusals-and-safety) — i segnali di rifiuto in-model di Claude, che scattano *dopo* che il tuo hook ha lasciato passare un prompt.
