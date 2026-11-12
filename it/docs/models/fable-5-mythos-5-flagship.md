# Claude Fable 5 e Mythos 5: la guida pratica ai modelli di punta

> Source: https://derob98.github.io/ailmanac/it/docs/models/fable-5-mythos-5-flagship · AILmanac (CC BY 4.0) · last verified 2026-10-21

Fable 5 è stato il primo modello di punta di classe Mythos di Anthropic — oggi è un modello legacy, superato da Fable 5.1. La sua API rifiuta in-band (HTTP 200, stop_reason: refusal), ha solo il thinking adattivo e non restituisce mai il thinking grezzo. Se usi un modello di fascia alta fissato per nome, questo cambia il modo in cui scrivi le integrazioni. Quando usarlo rispetto a Opus 4.8, il pattern di fallback, i cambiamenti nel prompting.

<LevelBadge level="intermediate" />

Il 9 giugno 2026 Anthropic ha rilasciato **Claude Fable 5** — il suo modello di punta «di classe Mythos», collocato sopra Opus in termini di capacità — insieme a un modello gemello a rilascio limitato, **Claude Mythos 5**. Se scorri solo il post di lancio, ne ricavi l'idea di «modello grande, prezzo più alto». Ma così ti sfugge la vera storia. Fable 5 è il primo modello Anthropic la cui *superficie di integrazione* è sostanzialmente diversa da ogni Claude precedente: rifiuta **in-band**, come un normale HTTP 200 con `stop_reason: "refusal"`, il suo ragionamento grezzo (chain of thought) **non viene mai restituito**, e c'è una primitiva di fatturazione completamente nuova, il **fallback credit**, pensata apposta per i nuovi tentativi su Opus 4.8. Se la tua app fissa un modello di fascia alta, Fable 5 non lo inserisci a sostituzione diretta come facevi con ogni Sonnet precedente. Lo **riconfiguri** attorno a lui.

Questa pagina è la guida pratica: cos'è davvero Fable 5, cosa fa meglio di Opus 4.8, i quattro punti esatti in cui il tuo codice deve cambiare, quando è la scelta giusta rispetto a Opus 4.8 e Sonnet 5, e i cambiamenti di prompting che sbloccano la storia delle «esecuzioni autonome di giorni» del lancio.

<Callout type="objectives" items={[
  "Capire cos'è Fable 5 a livello di modello — contesto da 1M, solo thinking adattivo, posizionamento di classe Mythos",
  "Padroneggiare le quattro modifiche all'API che rompono le migrazioni ingenue a sostituzione diretta da Opus 4.8",
  "Riconoscere un rifiuto in una risposta (è HTTP 200, non un errore) e configurare il fallback lato server o lato client",
  "Sapere quando scegliere Fable 5, Opus 4.8 o Sonnet 5, con una tabella decisionale su cui ragionare alle 3 di notte",
  "Adattare il prompting: brevità, confini, scaffold di memoria e perché gli strumenti send-to-user contano nelle esecuzioni autonome lunghe",
]} />

<VerifyNote lastVerified="2026-10-21" source="https://platform.claude.com/docs/en/models/fable-5/overview">
**Fable 5 è ora un modello legacy** — Anthropic lo indica come «Active (legacy)», con ritiro non prima del 9 giugno 2027, e la sua stessa pagina del modello invita a valutare la migrazione a [Fable 5.1](/docs/models/fable-5-1-field-guide). Tutto ciò che segue descrive ancora correttamente `claude-fable-5`: Fable 5 e Mythos 5 `claude-mythos-5` condividono un contesto da 1M di token, fino a 128K di output massimo, $10 / $50 per MTok (lettura da cache $1) e un knowledge cutoff affidabile a gennaio 2026. Entrambi sono Covered Models che richiedono 30 giorni di conservazione dei dati. Disponibilità generale su Claude API, Amazon Bedrock, Claude Platform on AWS, Google Cloud e Microsoft Foundry dal 9 giugno 2026. Confronta la tabella [Modelli attuali e prezzi](/docs/whats-new/models-and-pricing) prima di fissare un modello.
</VerifyNote>

## La versione in un paragrafo

Fable 5 è un modello di punta di **classe Mythos**: una fascia che Anthropic posiziona **sopra** Opus. `claude-fable-5` è disponibile in generale sull'API e su ogni grande cloud; `claude-mythos-5` è esattamente lo stesso modello **senza** i classificatori di sicurezza, offerto solo a partner approvati all'interno di Project Glasswing. Condividono prezzi ($10 in / $50 out per MTok), contesto (1M di token), tetto di output (128K) e knowledge cutoff. Se i classificatori di Fable 5 rifiutano una richiesta, ricevi un HTTP 200 riuscito con `stop_reason: "refusal"`, e ci si aspetta che tu abbia predisposto un percorso di fallback verso Opus 4.8. Questa è l'intera forma del rilascio.

## Perché non è semplicemente «Opus 4.8 + di più»

Anthropic presenta Fable 5 come il modello da puntare su problemi che altrimenti richiederebbero a una persona **ore, giorni o settimane**. Con parole loro, provarlo solo su carichi più semplici *sottostima la gamma delle sue capacità*. Le differenze concrete rispetto a Opus 4.8:

- **Autonomia a lungo orizzonte.** Esecuzioni di più giorni, orientate a un obiettivo, con forte ritenzione delle istruzioni. Fable 5 sostiene un output produttivo su periodi estesi in cui i modelli precedenti andavano alla deriva.
- **Correttezza al primo colpo su problemi difficili e ben specificati.** I primi tester hanno riferito implementazioni in un solo passaggio di sistemi che prima richiedevano giorni di iterazione.
- **Visione.** Accuratezza sostanzialmente più alta su immagini tecniche dense, web app e screenshot dettagliati — spesso usando **meno** token di output.
- **Revisione del codice e debugging.** Il recall nella ricerca di bug è nettamente più alto (fuori dagli ambiti di cybersicurezza coperti dai classificatori).
- **Delega.** Molto più affidabile nell'avviare e sostenere subagent paralleli, e migliore nel comunicare con agenti pari di lunga durata.
- **Ambiguità.** Più bravo a ricevere richieste complesse e su più fronti e a decidere cosa fare dopo senza una specifica passo-passo.

Lo scambio che fai è su costo (5× il prezzo di output di Sonnet 5), latenza (le singole richieste possono durare molti **minuti** con impostazioni di effort più alte) e un diverso contratto di integrazione. È in quel contratto che si concentra la maggior parte del lavoro di migrazione.

## Le quattro modifiche all'API che rompono la migrazione a sostituzione diretta

Se fissavi Opus 4.8 e sostituisci la stringa con `claude-fable-5`, quattro cose si comportano in modo diverso. Se ne manchi una, la tua app va in crash, perde output in silenzio o non gestisce i rifiuti con eleganza.

<Steps items={[
  {title: "I rifiuti arrivano in-band come HTTP 200", body: "Quando i classificatori di Fable 5 rifiutano una richiesta, non ricevi un errore HTTP: ricevi una normale risposta di tipo message con content: [] e stop_reason: \"refusal\". stop_details ti dice quale categoria è scattata (cyber, bio, frontier_llm o reasoning_extraction). NON ti viene addebitato un rifiuto che arriva prima di qualsiasi output; i token di input compaiono in usage ma non vengono addebitati, e la richiesta non conta ai fini dei limiti di frequenza. Ramifica direttamente su stop_reason — mai su stop_details o su content."},
  {title: "Il thinking adattivo è l'unica modalità di thinking", body: "L'extended thinking con budget di token non esiste più. thinking: {\"type\": \"disabled\"} non è supportato. Usa il parametro effort (low / medium / high / xhigh) per controllare la profondità del ragionamento. Se hai codice che calcola dinamicamente un budget di thinking, eliminalo e imposta effort."},
  {title: "Il contenuto grezzo del thinking non viene mai restituito", body: "thinking.display ha come predefinito \"omitted\" (campo thinking vuoto) oppure puoi richiedere \"summarized\" (un riassunto leggibile del ragionamento). La chain of thought grezza non è disponibile. Se la tua app mostra il ragionamento agli utenti finali, passa ai blocchi riassunti — e tieni presente che i prompt che chiedono al modello di riprodurre il proprio ragionamento nel testo della risposta possono far scattare la categoria di rifiuto reasoning_extraction."},
  {title: "Il fallback è una primitiva di prima classe", body: "Anthropic fornisce un parametro fallbacks (beta: server-side-fallback-2026-06-01) che permette di indicare fino a tre modelli di riserva in una singola richiesta. Quando Fable 5 rifiuta, l'API riprova sul modello successivo nella stessa richiesta e ricevi una sola risposta. Ogni SDK include anche un BetaRefusalFallbackMiddleware che fa lo stesso lato client, oltre a un sistema di fallback credit che rimborsa il costo di prompt cache del cambio di modello. Scegli lato server OPPURE lato client, non entrambi sulla stessa richiesta."},
]} />

## Riconoscere un rifiuto

Un rifiuto è un messaggio riuscito, non un'eccezione. Questa è la forma esatta della risposta su cui ramificare:

```json
{
  "id": "msg_01XFUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "model": "claude-fable-5",
  "content": [],
  "stop_reason": "refusal",
  "stop_details": {
    "type": "refusal",
    "category": "cyber",
    "explanation": "This request was declined because it could enable cyber harm."
  },
  "usage": { "input_tokens": 412, "output_tokens": 0 }
}
```

`stop_details.explanation` è leggibile da una persona ma **non stabile** — mostralo, non farne il parsing. `stop_details` stesso è `null` per ogni stop reason diverso da `"refusal"`. Le quattro categorie documentate:

| `category`               | Cosa significa                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `"cyber"`                | Potrebbe abilitare danni informatici (malware, exploit). Può scattare anche per lavoro di cybersicurezza legittimo.               |
| `"bio"`                  | Potrebbe abilitare danni biologici. Può scattare anche per lavoro benefico nelle scienze della vita.                              |
| `"frontier_llm"`         | Potrebbe aiutare lo sviluppo di modelli di IA concorrenti (limitato dai termini commerciali di Anthropic). Può scattare per lavoro ML legittimo. |
| `"reasoning_extraction"` | Chiede al modello di riprodurre il proprio ragionamento interno come testo di risposta. Usa invece l'output del thinking adattivo. |

<Callout type="warning" items={[
  "Un rifiuto è HTTP 200. Un monitoraggio basato sul conteggio dei 5xx NON lo vedrà MAI — emetti un evento dedicato per ogni rifiuto e imposta un alert sullo scarto tra rifiuti e risposte servite dal fallback.",
  "Un rifiuto a metà stream VIENE fatturato: token di input più l'eventuale output parziale già trasmesso, alle tariffe normali. Solo i rifiuti prima di qualsiasi output sono gratuiti.",
  "Riprovare sullo STESSO modello di solito produce un altro rifiuto. Punta il nuovo tentativo su un modello di fallback (Opus 4.8 è la coppia suggerita da Anthropic).",
]} />

## Configurare il fallback — scegli un solo percorso

### Lato server (il più semplice, un solo round trip)

<PromptCard title="Server-side fallback with the Messages API">
{`curl --fail-with-body -sS https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: server-side-fallback-2026-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-fable-5",
    "max_tokens": 1024,
    "fallbacks": [{"model": "claude-opus-4-8"}],
    "messages": [{"role": "user", "content": "Hello, Claude"}]
  }'`}
</PromptCard>

Le voci vengono provate in ordine, devono essere distinte, ciascuna deve essere uno degli `allowed_fallback_models` consentiti per il modello richiesto (pubblicati sulla Models API quando è impostato l'header beta) e non può essere il modello richiesto stesso. Ogni voce può sovrascrivere `max_tokens` e `thinking` solo per quel tentativo.

La risposta contiene un blocco di contenuto `fallback` che segna ogni passaggio tra modelli — `{"type": "fallback", "from": {"model": ...}, "to": {"model": ...}}` — e un array `usage.iterations` che registra ogni tentativo. Un modello che ha rifiutato compare come una normale iterazione `message`; il modello che ha risposto compare come iterazione `fallback_message`.

Disponibile su Claude API e Claude Platform on AWS. **Non** disponibile su Amazon Bedrock, Google Cloud, Microsoft Foundry né sulla Message Batches API — su queste usa il middleware dell'SDK.

### Lato client (funziona ovunque, una sola configurazione)

Ogni SDK Anthropic include `BetaRefusalFallbackMiddleware` (Python/TypeScript/Go/Java/PHP/Ruby/C#). Configuralo una volta sul client e condividi un `BetaFallbackState` per tutta la conversazione, così i turni successivi restano fissati sul modello che ha accettato:

```python
from anthropic import Anthropic, BetaFallbackState, BetaRefusalFallbackMiddleware

client = Anthropic(
    middleware=[BetaRefusalFallbackMiddleware([{"model": "claude-opus-4-8"}])],
)
state = BetaFallbackState()  # share across the conversation

with state:
    message = client.beta.messages.create(
        model="claude-fable-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello, Claude"}],
    )
print(f"served by: {message.model}")
```

Il middleware inserisce inoltre ogni richiesta in `fallback-credit-2026-06-01`, quindi il costo di prompt cache del nuovo tentativo viene rimborsato automaticamente.

### Nuovo tentativo manuale (HTTP puro, logica personalizzata)

Rileva `stop_reason == "refusal"`, rinvia il corpo *invariato* con `model` impostato su un modello di fallback (per ottenere il fallback credit serve una corrispondenza esatta) e — per le conversazioni a più turni — continua a usare il modello di fallback per i turni successivi invece di tornare indietro.

## Errori comuni nel collegare il fallback

- **Fissa il budget dei tentativi per richiesta, non per sessione.** Un solo turno può produrre più rifiuti (l'agente e i sub-agent chiamano ciascuno l'API).
- **Dai alle chiamate dei sub-agent i loro `fallbacks`.** Il parametro non si propaga nelle chiamate al modello fatte dall'interno dell'esecuzione di uno strumento.
- **Configura il fallback su ogni percorso di richiesta** — gestori di retry, recupero errori, worker in background. Un gestore che riemette la richiesta senza fallback perde la protezione proprio sulle richieste che ne hanno più probabilmente bisogno.
- **Rendi il fallback una proprietà della richiesta, non uno stato ambientale.** Un flag condiviso o una configurazione in cache possono andare fuori sincrono e lasciare in silenzio una richiesta non protetta.
- **Emetti un segnale per ogni rifiuto E per ogni risposta servita dal fallback.** Metti un alert sullo scarto tra i due: uno scarto crescente significa che anche i fallback vengono rifiutati.
- **Non dare all'header beta altro nome che `server-side-fallback-2026-06-01`.** Qualsiasi altra data restituisce un errore 400.

## Quando scegliere Fable 5, Opus 4.8 o Sonnet 5

Il modello giusto dipende da ciò che valorizzi: capacità pura, costo per token o come si comporta l'API quando le cose vanno storte.

| Se ti serve…                                                            | Scegli               | Perché                                                                                                     |
| ----------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| I problemi in assoluto più difficili — esecuzioni autonome di più giorni, primo colpo su specifiche ambigue, compiti di visione densa       | **Claude Fable 5**   | Capacità di classe Mythos; sostiene il lavoro a lungo orizzonte; migliore ritenzione delle istruzioni in contesti sterminati. |
| Ragionamento di fascia alta con **zero data retention** o senza il contratto dei rifiuti    | **Claude Opus 4.8**  | Idoneo a ZDR; superficie API classica (gli errori sono errori); il bersaglio naturale del fallback per Fable 5.             |
| Il cavallo di battaglia: qualità bilanciata, contesto da 1M, abbastanza economico da usarlo ovunque         | **Claude Sonnet 5**  | Predefinito di Claude Code su Pro e Team Standard (Opus 5 è il predefinito su Max, Team Premium, Enterprise e API); spesso a un soffio dalla qualità di Opus a una frazione del costo. Vedi la [guida a Sonnet 5](/docs/models/sonnet-5-field-guide) per le insidie di migrazione. |
| Lavoro di cybersicurezza o scienze della vita che i classificatori di Fable bloccano per progetto       | **Opus 4.8**         | Fable 5 *non è pensato* esplicitamente per il lavoro offensivo cyber o bio/laboratorio — scegli il modello, non combattere il classificatore. |
| Retrieval, classificazione, sub-agent economici con budget di latenza stretti                | **Haiku 4.5**        | La fascia più veloce ed economica; usalo come foglie del tuo albero di agenti.                                            |

<Callout type="tip" items={[
  "Fable 5 costa 5× il prezzo di output di Sonnet 5. Sui carichi che Sonnet 5 gestisce bene, restare su Sonnet non è un compromesso: è la risposta giusta.",
  "Se la tua integrazione non può usare la zero data retention sulla fascia alta, resta su Opus 4.8 come primario. Fable 5 prevede 30 giorni di conservazione obbligatoria.",
  "Anthropic raccomanda esplicitamente di partire dall'estremo alto del tuo intervallo di difficoltà quando provi Fable 5. Se esegui contro di lui solo la tua attuale suite di regressione, non vedrai ciò che sblocca.",
]} />

## I cambiamenti di prompting che si sentono davvero

Il rispetto delle istruzioni di Fable 5 è abbastanza forte da farti abbandonare le lunghe guide di stile elencate punto per punto e scrivere una sola frase per comportamento. Tre frammenti di prompt dalla guida di Anthropic valgono la pena di essere copiati alla lettera:

<PromptCard title="Keep Fable 5 from overplanning on ambiguous tasks">
{`When you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue in user-facing messages. If you are weighing a choice, give a recommendation, not an exhaustive survey. This does not apply to thinking blocks.`}
</PromptCard>

<PromptCard title="Ground progress claims during long autonomous runs">
{`Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.`}
</PromptCard>

<PromptCard title="Autonomous-pipeline reminder — kill 'shall I…?' checkpoints">
{`You are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking "Want me to…?" or "Shall I…?" will block the work. For reversible actions that follow from the original request, proceed without asking. Before ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ("I'll…", "let me know when…"), do that work now with tool calls. End your turn only when the task is complete or you are blocked on input only the user can provide.`}
</PromptCard>

Due cambiamenti minori ma importanti:

- **L'effort è la tua leva principale.** Usa `high` come predefinito; `xhigh` sul lavoro più difficile e sensibile alla capacità; scendi a `medium` / `low` per scambiare qualità con velocità. Un effort più basso su Fable 5 spesso supera comunque le prestazioni `xhigh` dei modelli precedenti — non lasciare latenza sul tavolo se il compito è di routine.
- **Rifattorizza skill e prompt preesistenti.** Le skill tarate su Opus 4.8 sono spesso *troppo prescrittive* per Fable 5 e possono peggiorare l'output. Anthropic raccomanda esplicitamente di rivedere le vecchie istruzioni e, di frequente, di rimuoverle, lasciando lavorare i default di Fable 5. Controlla il linguaggio del tipo «mostra il tuo ragionamento»: può far scattare la categoria di rifiuto `reasoning_extraction` e aumentare i fallback.

## Modalità di errore rare che vale la pena nominare

Due comportamenti compaiono nelle sessioni lunghe e disorientano chi integra per la prima volta:

- **Dichiarazioni di intenzione solo testuali.** Nel profondo di un'esecuzione lunga, Fable 5 può occasionalmente chiudere un turno con «Ora eseguo X» senza emettere la chiamata allo strumento, oppure chiedere il permesso quando ha già abbastanza contesto. La soluzione è una semplice risposta «vai pure», oppure aggiungere il promemoria di sistema per pipeline autonome qui sopra.
- **Ansia da budget di contesto.** Nelle sessioni molto lunghe, Fable 5 può suggerire di aprire una nuova sessione o di tagliare il proprio lavoro. Succede più spesso quando l'harness mostra al modello un *conto alla rovescia dei token rimasti*. Se puoi, non mostrarlo; se devi, aggiungi `You have ample context remaining. Do not stop, summarize, or suggest a new session on account of context limits. Continue the work.`

## Strumenti send-to-user per agenti asincroni

Per gli agenti di lunga durata la cui UX dipende dal consegnare contenuti alla lettera a metà compito, definisci uno strumento lato client `send_to_user`. Gli input degli strumenti non vengono mai riassunti, quindi tutto ciò che instradi attraverso di esso arriva integro all'utente. Mostrare direttamente nella tua UI l'input della chiamata allo strumento e restituire una semplice conferma di ricezione dà al modello un canale per consegne parziali che non chiude il suo turno.

```json
{
  "name": "send_to_user",
  "description": "Display a message directly to the user. Use this for progress updates, partial results, or content the user must see exactly as written before the task finishes.",
  "input_schema": {
    "type": "object",
    "properties": {
      "message": {"type": "string", "description": "The content to display to the user."}
    },
    "required": ["message"]
  }
}
```

Abbina lo strumento a un richiamo di una riga nel prompt di sistema: *"Between tool calls, when you have content the user must read verbatim (a partial deliverable, a direct answer to their question), call the send_to_user tool with that content."* Senza il richiamo, Fable 5 lo chiama raramente.

## Insidia sulla conservazione dei dati

Sia Fable 5 sia Mythos 5 sono designati **Covered Models** con **30 giorni di conservazione dei dati**, quindi **non sono disponibili con zero data retention a meno che Anthropic non lo autorizzi espressamente**. Una richiesta a Fable 5 da parte di un'organizzazione la cui configurazione di conservazione non soddisfa questo requisito restituisce un `400 invalid_request_error`.

C'è un solo modo documentato per aggirarlo: un'organizzazione con un accordo ZDR può **attivare la conservazione a 30 giorni per un singolo workspace** (non il Default Workspace, che segue sempre l'impostazione dell'organizzazione) e raggiungere da lì i Covered Models, mentre tutti gli altri workspace mantengono la ZDR. Se non è accettabile — settore regolamentato, obbligo contrattuale, cliente enterprise — Fable 5 non è una sostituzione diretta, quindi fissa Opus 4.8 come fascia alta. Consulta la [pagina ufficiale sui requisiti di conservazione dei dati specifici per modello](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention#model-specific-data-retention-requirements) prima di instradare traffico di produzione.

## Mythos 5 — il gemello che probabilmente non puoi usare

`claude-mythos-5` è lo stesso modello sottostante di Fable 5 con una diversa **configurazione delle salvaguardie**, distribuito solo a organizzazioni verificate. Al lancio significava **Project Glasswing** — il programma congiunto con partner cyber governativi e aziendali, solo su invito, più alcuni ricercatori di biologia selezionati.

<VerifyNote lastVerified="2026-10-21" source="https://support.claude.com/en/articles/14604842">
**La via d'accesso è cambiata il 6 ottobre 2026 e non è più solo su invito.** Glasswing è stato ristrutturato nel **Cyber Verification Program**, a cui i team di sicurezza *fanno domanda* tramite il Verification Portal su `portal.anthropic.com/programs`; le decisioni arrivano in genere entro sette giorni lavorativi e i membri Glasswing esistenti sono stati spostati al livello più alto. Ci sono tre livelli — **Defense Access** (organizzazioni e singoli su piani a pagamento), **Red Team Access** (solo organizzazioni) e **Specialized Access** (solo organizzazioni, valutato in collaborazione con il governo degli Stati Uniti) — e ciascuno concede Opus 5.5, Sonnet 5.5 e **Mythos 5.1**, non il Mythos 5 legacy. L'idoneità dipende dal fatto che la difesa sia davvero la tua attività: «Le organizzazioni la cui attività principale non rientra in questo ambito potrebbero non essere idonee.»
</VerifyNote>

Il compromesso è reale: meno interventi dei classificatori significa che la responsabilità per la sicurezza a valle passa all'applicazione chiamante. Anthropic precisa esplicitamente che i clienti senza accesso a Mythos possono usare Fable per le stesse capacità, meno i compiti di frontiera cyber e bio che il classificatore rifiuta.

## Verifica rapida — i concetti sono entrati?

<Quiz questions={[
  {
    q: "La tua app chiama Fable 5 e riceve un messaggio con content: [] e stop_reason: \"refusal\". Quale stato HTTP hai ricevuto?",
    options: ["400 Bad Request", "403 Forbidden", "200 OK", "422 Unprocessable Entity"],
    answer: 2,
    explain: "Un rifiuto è una risposta RIUSCITA. HTTP 200. Ramificare sui codici 5xx o 4xx non vedrà mai un rifiuto: si ramifica su stop_reason dentro il corpo JSON."
  },
  {
    q: "Vuoi continuare a usare i budget di extended thinking del tuo percorso di codice su Opus 4.8 quando migri a Fable 5. Cosa fai?",
    options: ["Imposti thinking: {\"type\": \"disabled\"} e poi calcoli tu il budget", "Niente — il parametro del budget di thinking funziona allo stesso modo", "Riscrivi il percorso di codice per usare invece il parametro effort", "Torni a Opus 4.8 per quella richiesta"],
    answer: 2,
    explain: "Il thinking adattivo è l'UNICA modalità di thinking su Fable 5 e Mythos 5. thinking: {\"type\": \"disabled\"} non è supportato. Usa effort (low / medium / high / xhigh) come controllo."
  },
  {
    q: "Quale di queste cose Fable 5 NON ti restituirà?",
    options: ["Un blocco di thinking riassunto", "Un rifiuto con stop_details.category == \"bio\"", "Il testo grezzo della chain of thought usata per arrivare a una risposta", "Un blocco di contenuto fallback dopo un rifiuto a metà stream"],
    answer: 2,
    explain: "La chain of thought grezza non viene mai restituita su Fable 5 o Mythos 5. thinking.display supporta solo \"summarized\" o \"omitted\"."
  },
  {
    q: "Una singola richiesta ha fallbacks: [{\"model\": \"claude-opus-4-8\"}]. Fable 5 rifiuta PRIMA di qualsiasi output. Cosa ti viene fatturato?",
    options: ["Token di input di Fable 5 più token di input + output di Opus 4.8", "Solo i token di input + output di Opus 4.8", "Niente — i rifiuti prima dell'output sono sempre gratuiti", "Entrambi i modelli a tariffa piena"],
    answer: 1,
    explain: "Paghi il modello che serve effettivamente la richiesta. Un tentativo che ha rifiutato prima di produrre output non costa nulla e non consuma limiti di frequenza. Viene fatturata solo l'iterazione di Opus 4.8."
  }
]} />

## Promemoria dei termini

<Flashcards cards={[
  {front: "Mythos-class", back: "La fascia di posizionamento di Anthropic per i suoi modelli più capaci, collocata SOPRA Opus. Fable 5 e Mythos 5 sono i primi due."},
  {front: "stop_reason: \"refusal\"", back: "La risposta HTTP 200 riuscita che Fable 5 restituisce quando un classificatore di sicurezza rifiuta la richiesta. Ramifica direttamente su questo valore — mai su stop_details o su content."},
  {front: "Parametro fallbacks", back: "Parametro beta (server-side-fallback-2026-06-01) che indica fino a 3 modelli di fallback in una singola richiesta. In caso di rifiuto, l'API riprova sul modello successivo e restituisce una sola risposta."},
  {front: "Iterazione fallback_message", back: "La voce in usage.iterations che indica quale modello ha effettivamente servito la risposta dopo un fallback. La sua presenza, unita a stop_reason != \"refusal\", ti dice che il fallback è stato eseguito e ha risposto."},
  {front: "Fallback credit", back: "Funzione di fatturazione beta (fallback-credit-2026-06-01) che rimborsa il costo di prompt cache quando un nuovo tentativo cambia modello, così non paghi per riscrivere la cache. Applicata automaticamente dal fallback lato server e dal middleware dell'SDK."},
  {front: "Thinking adattivo", back: "L'unica modalità di thinking su Fable 5 e Mythos 5. Imposta il parametro effort (low / medium / high / xhigh) per controllare la profondità. thinking: {\"type\": \"disabled\"} viene rifiutato."},
  {front: "Rifiuto reasoning_extraction", back: "Una specifica categoria di rifiuto che scatta con prompt che chiedono al modello di riprodurre il proprio ragionamento interno nel testo della risposta. Causa comune di fallback inattesi — controlla skill e prompt di sistema per il linguaggio «mostra il tuo ragionamento»."},
  {front: "Project Glasswing", back: "Il programma su invito attraverso cui Anthropic ha originariamente distribuito Mythos 5. Ristrutturato il 6 ottobre 2026 nel Cyber Verification Program, i cui tre livelli (Defense / Red Team / Specialized Access) richiedono una domanda da parte dei team di sicurezza — quindi l'accesso a Mythos non è più solo su invito, e ciò che i livelli concedono è Mythos 5.1."}
]} />

## Punti chiave

<Callout type="takeaways" items={[
  "Fable 5 è un modello di punta di classe Mythos a $10/$50 per MTok con contesto da 1M — sceglilo per esecuzioni autonome di più giorni, visione densa e primo colpo su specifiche difficili; resta su Sonnet 5 per tutto il resto.",
  "Le quattro modifiche all'API per cui migrare: rifiuti in-band come HTTP 200, solo thinking adattivo, nessun contenuto grezzo del thinking e fallback come primitiva di prima classe.",
  "Scegli il fallback lato server per semplicità su Claude API / AWS; scegli il middleware dell'SDK ovunque altro; entrambi applicano il fallback credit al posto tuo in automatico.",
  "La conservazione dei dati a 30 giorni è obbligatoria — Fable 5 NON è idoneo a ZDR. Se hai un requisito ZDR, fissa Opus 4.8.",
  "Riscrivi i prompt prescrittivi dell'era Opus 4.8 come frasi singole; controlla il linguaggio «mostra il tuo ragionamento»; usa effort come leva principale tra qualità e latenza.",
]} />

## Prossimo passo

- [Claude Fable 5.1: cosa è cambiato e come migrare](/docs/models/fable-5-1-field-guide) — il successore del 1° settembre 2026; tre modifiche incompatibili in aggiunta a tutto ciò che trovi qui
- [Scegliere un modello](/docs/models/choosing-a-model)
- [Modelli di ragionamento a confronto](/docs/models/reasoning-models-compared)
- [Portare i prompt tra modelli](/docs/models/porting-prompts-across-models)
- [Modelli attuali e prezzi](/docs/whats-new/models-and-pricing)
- [Questo mese in Claude](/docs/whats-new/this-month)
