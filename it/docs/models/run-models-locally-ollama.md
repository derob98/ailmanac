# Eseguire modelli AI in locale con Ollama

> Source: https://derob98.github.io/ailmanac/it/docs/models/run-models-locally-ollama · AILmanac (CC BY 4.0) · last verified 2026-10-21

Esegui modelli open-weight (Llama, Mistral, Qwen…) sul tuo computer — privati, offline, gratuiti da usare — con Ollama. Installazione, CLI e chiamate da codice.

<LevelBadge level="intermediate" />

I modelli di frontiera vivono nel cloud, ma un'intera classe di modelli **open-weight** — Llama, Mistral, Qwen, DeepSeek, Gemma — puoi scaricarla ed eseguirla sul tuo portatile o sul tuo server. [Ollama](https://ollama.com/) è il modo più semplice per farlo: un'installazione, un comando e un modello gira in locale. Questa pagina ti porta da zero a un modello in esecuzione, a chiamarlo da codice e a conoscere i compromessi, così da non aspettarti che un modello locale da 7B si comporti come uno di frontiera.

<Callout type="objectives" items={[
  "Sapere PERCHÉ eseguire un modello in locale — e gli onesti compromessi rispetto ai modelli cloud di frontiera",
  "Installare Ollama ed eseguire il tuo primo modello con due comandi",
  "Usare la CLI di base: pull, run, list, ps, rm, stop",
  "Chiamare il tuo modello locale da codice tramite l'API di Ollama compatibile con OpenAI",
  "Capire fabbisogno di RAM, dimensioni dei modelli e quantizzazione, per scegliere un modello che la tua macchina riesca davvero a eseguire",
  "Sapere quando LM Studio (una GUI) è il punto di partenza migliore",
]} />

## Perché eseguire un modello in locale (e quando no)

Eseguire un modello sul tuo hardware ti dà quattro cose:

- **Privacy** — i tuoi prompt e i tuoi dati non lasciano mai la tua macchina. È il motivo per cui i team in ambiti regolamentati o sensibili scelgono i modelli locali. (Vedi il bivio privacy/self-host in [Scegliere un modello](/docs/models/choosing-a-model).)
- **Offline** — niente internet, niente API, nessuna dipendenza da interruzioni di servizio. Il modello è un file sul tuo disco.
- **Costo** — nessuna fattura per token. Una volta scaricato, eseguirlo è "gratis" (paghi in elettricità e hardware, non in spesa API). Se la [spesa in token](/docs/power-user/token-economy) è il tuo vincolo su larga scala, il locale può vincere.
- **Controllo** — fissa una versione esatta, personalizza il comportamento e integra senza limiti di frequenza o sorprese nei termini di servizio.

I compromessi onesti:

- **Divario di capacità.** Un modello che puoi eseguire su un portatile (1B–14B parametri) **non** è nella stessa lega di un modello cloud di frontiera su ragionamento difficile, contesto lungo o compiti agentici. Per molti compiti quotidiani il divario è piccolo; per i più difficili è grande.
- **Hardware.** I modelli più grandi e capaci richiedono più RAM/VRAM di quella che ha una macchina tipica. Spesso scegli il *modello più grande che il tuo hardware riesce a eseguire*, non il migliore che esiste.
- **Lo gestisci tu.** Nessuno scaling gestito, nessun aggiornamento automatico: è il prezzo del controllo.

Uno schema comune e duraturo: **prototipa e scegli** con una piccola valutazione (stesso metodo dei modelli cloud — vedi [Scegliere un modello](/docs/models/choosing-a-model)), usa il locale per lavori privati/offline/economici su larga scala e ricorri a un'API di frontiera quando il compito richiede davvero la capacità in più.

## Installa Ollama ed esegui il tuo primo modello

<Steps items={[
  {title: "Installa Ollama", body: "macOS e Windows: scarica l'installer da ollama.com/download ed eseguilo. Linux: usa lo script di installazione ufficiale (qui sotto). Questo installa il comando ollama e un servizio locale in background."},
  {title: "Esegui un modello", body: "ollama run <model> scarica il modello al primo utilizzo (possono essere diversi GB), poi ti porta in una chat interattiva. La prima esecuzione è lenta perché scarica i pesi; le successive sono istantanee."},
  {title: "Chatta, poi esci", body: "Scrivi un prompt e premi Invio. Per uscire dalla sessione interattiva, scrivi /bye (oppure premi Ctrl+D). Il modello resta in cache sul disco per la volta successiva."},
  {title: "Gestisci ciò che hai scaricato", body: "Usa ollama list per vedere i modelli installati e ollama rm <model> per eliminarne uno e recuperare spazio su disco."},
]} />

Installazione su Linux (macOS/Windows usano invece l'installer scaricato):

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

<PromptCard title="Scarica ed esegui un modello piccolo (buona prima scelta)">{`ollama run gemma4:e2b`}</PromptCard>

Quest'unico comando scarica `gemma4:e2b` — il modello con cui parte la quickstart di Ollama stessa, una variante Gemma 4 di taglia edge con ~2,3B parametri *effettivi* e pochi GB su disco — e avvia una chat interattiva. Per scaricare senza ancora chattare, usa invece `ollama pull`.

<VerifyNote lastVerified="2026-10-21" source="https://docs.ollama.com/quickstart">
**Nomi dei modelli, dimensioni in parametri disponibili e tag cambiano spesso** con l'arrivo di nuove versioni. I nomi usati in questa pagina — `gemma4:e2b`, `qwen3`, `deepseek-r1`, `gemma3`, `mistral`, `llama3.2` — erano nella libreria di Ollama alla data di verifica, insieme a novità come `qwen3.5` e ai tag più grandi `12b`/`26b`/`31b` di `gemma4`. Considera ogni nome/dimensione specifico come deperibile: consulta la libreria attuale su <a href="https://ollama.com/library">ollama.com/library</a> per i nomi di pull e le dimensioni di oggi.
</VerifyNote>

## La CLI di base

Pochi comandi coprono quasi tutto. Esegui `ollama --help` per l'elenco completo.

```bash
# Download a model without starting a chat
ollama pull qwen3

# Start an interactive chat (downloads first if needed)
ollama run qwen3

# One-shot: pass the prompt inline, get the answer, exit
ollama run qwen3 "Summarize the CAP theorem in two sentences."

# List models you've downloaded
ollama list

# Show models currently loaded in memory
ollama ps

# Stop a running/loaded model (frees memory)
ollama stop qwen3

# Delete a downloaded model to reclaim disk
ollama rm qwen3
```

Dentro una sessione interattiva `ollama run`, scrivi `/bye` per uscire e `/?` per vedere i comandi di sessione. Il servizio in background che serve davvero i modelli viene avviato da `ollama serve` (l'app desktop lo avvia per te automaticamente).

## Chiamalo da codice (API compatibile con OpenAI)

È la parte che rende i modelli locali davvero utili nelle app. Il servizio in background di Ollama espone un'API HTTP locale su **`http://localhost:11434`**, sulla porta predefinita **11434**. Ha endpoint nativi propri (`/api/generate`, `/api/chat`) **e** un livello **compatibile con OpenAI** su `/v1` — così la maggior parte del codice scritto per l'SDK di OpenAI funziona con il tuo modello locale cambiando due righe.

HTTP puro con `curl` (endpoint nativo):

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4:e2b",
  "messages": [
    { "role": "user", "content": "Why is the sky blue?" }
  ],
  "stream": false
}'
```

Da Python con l'SDK ufficiale di OpenAI — basta puntare `base_url` a Ollama e passare una `api_key` non vuota qualsiasi (Ollama richiede il campo ma ne ignora il valore):

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # required by the SDK, ignored by Ollama
)

response = client.chat.completions.create(
    model="gemma4:e2b",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "Explain gradient descent in two sentences."},
    ],
)

print(response.choices[0].message.content)
```

Essendo compatibile con OpenAI, gli stessi schemi che useresti con un'API ospitata valgono anche qui — compresi lo streaming e l'[uso di strumenti / function calling](/docs/api/tool-use), che in locale funzionano come nel cloud (a patto che il modello sia effettivamente bravo in questo). Il livello `/v1` di Ollama copre `/v1/chat/completions`, `/v1/completions`, `/v1/responses`, `/v1/models` (e `/v1/models/{model}`) e `/v1/embeddings`.

## Hardware, dimensioni dei modelli e quantizzazione

Il numero che vedi associato a un modello — **1B, 7B, 8B, 70B** — è il suo **numero di parametri** (in miliardi). Più parametri significa in genere più capace *e* più affamato di memoria. Il limite pratico a ciò che puoi eseguire è la **RAM** (e su una GPU, la **VRAM**).

La **quantizzazione** è il trucco chiave che lo rende fattibile su macchine normali. I pesi del modello sono originariamente memorizzati in alta precisione (es. 16 bit), ma possono essere compressi a ~4 bit con un costo in qualità ridotto e spesso appena percepibile. Ollama distribuisce la maggior parte dei modelli già quantizzati — ecco perché un modello con miliardi di parametri può starci in pochi GB. Una regola empirica approssimativa (verifica sulla pagina del modello specifico):

- Modelli **~1B–3B**: girano comodamente sulla maggior parte dei portatili moderni (pochi GB di RAM).
- Modelli **~7B–8B**: il punto ideale tra capacità ed eseguibilità; calcola diversi GB di RAM libera.
- Modelli **~13B–14B**: richiedono una macchina piuttosto ben dotata.
- Modelli **~70B+**: richiedono una workstation/server con molta RAM o una GPU potente — non è territorio da portatile tipico.

Una ricetta pratica: parti da un modello piccolo (`gemma4:e2b`), conferma il flusso end-to-end, poi sali al modello più grande che gira ancora fluido sul tuo hardware — non al più grande che esiste.

<Flashcards title="Vocabolario dei modelli locali" cards={[
  {front: "Pesi (weights)", back: "I numeri appresi (parametri) che SONO il modello. Eseguire un modello in locale significa caricare in memoria il suo file dei pesi e calcolare con esso."},
  {front: "Modello open-weight", back: "Un modello di cui puoi scaricare i pesi ed eseguirli da te (Llama, Mistral, Qwen, DeepSeek, Gemma) — il prerequisito per poter eseguire in locale."},
  {front: "Parametri (es. 7B)", back: "Il numero di pesi, in miliardi. Più alto = in genere più capace e più affamato di memoria. La leva principale su cui si decide se la tua macchina può eseguirlo."},
  {front: "Quantizzazione", back: "Comprimere i pesi a precisione inferiore (es. da 16 bit a 4 bit) perché il modello stia in molta meno RAM, a un piccolo costo in qualità. È il motivo per cui modelli da miliardi di parametri stanno in pochi GB."},
  {front: "Finestra di contesto", back: "Quanti token (prompt + output) il modello può considerare insieme. I modelli locali spesso hanno un contesto utilizzabile più piccolo di quelli di frontiera, e un contesto più grande costa più memoria."},
  {front: "Tag di quantizzazione (es. q4)", back: "Un'etichetta su una variante del modello che indica il compromesso precisione/dimensione — meno bit = più piccolo e veloce, più bit = più vicino alla qualità piena."},
]} />

## LM Studio: un'alternativa con interfaccia grafica

Se la riga di comando non fa per te, **[LM Studio](https://lmstudio.ai/)** è un'app desktop (macOS, Windows, Linux) che fa lo stesso lavoro tramite un'interfaccia grafica: sfogli e scarichi modelli aperti, ci chatti in una UI integrata e — come Ollama — avvia un **server locale compatibile con OpenAI** così il tuo codice può parlargli. È la via d'ingresso più facile per chi non sviluppa o per chi preferisce il punta-e-clicca al terminale; Ollama tende a vincere quando vuoi una CLI scriptabile e un servizio leggero in background. Entrambi eseguono lo stesso tipo di modelli open-weight, quindi i concetti di questa pagina si trasferiscono direttamente.

<Quiz title="Verifica te stesso" questions={[
  {q: "Qual è il singolo compromesso onesto più grande dell'eseguire un modello in locale rispetto a un modello cloud di frontiera?", options: ["I modelli locali non si possono chiamare da codice", "Un modello locale da portatile è meno capace nei compiti difficili", "I modelli locali costano di più per token"], answer: 1, explain: "Il divario di capacità è il vero compromesso: i modelli abbastanza piccoli da girare in locale restano indietro rispetto a quelli cloud di frontiera nei compiti più difficili di ragionamento/agentici. L'accesso da codice e il costo per token sono in realtà vantaggi del locale."},
  {q: "Quale comando scarica un modello (se serve) E inizia a chattare con esso?", options: ["ollama pull gemma4:e2b", "ollama serve gemma4:e2b", "ollama run gemma4:e2b"], answer: 2, explain: "ollama run scarica al primo utilizzo, poi apre una sessione interattiva. ollama pull si limita a scaricare; ollama serve avvia il servizio in background."},
  {q: "Per chiamare il tuo modello locale da codice con l'SDK di OpenAI, cosa imposti?", options: ["Una vera chiave API OpenAI a pagamento", "base_url su http://localhost:11434/v1 e una api_key qualsiasi non vuota", "Niente — funziona automaticamente contro api.openai.com"], answer: 1, explain: "Punta base_url all'endpoint locale /v1 di Ollama e passa una api_key non vuota qualsiasi (Ollama richiede il campo ma ne ignora il valore)."},
  {q: "Perché un modello con miliardi di parametri può stare in pochi GB di RAM?", options: ["I parametri vengono trasmessi in streaming dal cloud", "La quantizzazione comprime i pesi a precisione inferiore", "Ollama carica solo una parte del modello"], answer: 1, explain: "La quantizzazione memorizza i pesi a precisione inferiore (es. 4 bit invece di 16), riducendo l'ingombro in memoria con un piccolo costo in qualità."},
]} />

<Callout type="takeaways" items={[
  "Locale = privacy + offline + nessun costo per token + controllo; il compromesso è un reale divario di capacità e i limiti dell'hardware.",
  "Bastano due comandi: installa Ollama, poi ollama run gemma4:e2b.",
  "CLI di base: pull (scarica), run (chatta), list, ps, stop, rm — è quasi tutto.",
  "Chiamalo da codice tramite l'endpoint compatibile con OpenAI: base_url http://localhost:11434/v1, qualsiasi api_key non vuota.",
  "Numero di parametri + quantizzazione decidono se la tua macchina può eseguire un modello — parti piccolo, poi sali a ciò che gira fluido.",
  "Preferisci una GUI? LM Studio fa lo stesso lavoro con il punta-e-clicca ed espone anch'esso un server locale compatibile con OpenAI.",
]} />

## Fonti e approfondimenti

- [Ollama](https://ollama.com/) — sito ufficiale e download.
- [Libreria dei modelli Ollama](https://ollama.com/library) — modelli attuali e relativi nomi/dimensioni di pull esatti.
- [Riferimento CLI di Ollama](https://docs.ollama.com/cli) · [Documentazione API di Ollama](https://docs.ollama.com/api) — riferimento autorevole di comandi ed endpoint.
- [Articolo del blog di Ollama sulla compatibilità con OpenAI](https://ollama.com/blog/openai-compatibility) — l'endpoint `/v1` e l'uso con gli SDK.
- [Ollama su GitHub](https://github.com/ollama/ollama) — codice sorgente, issue e documentazione dettagliata.
- [LM Studio](https://lmstudio.ai/) — alternativa con GUI per eseguire modelli locali.

## Prossimo passo

- Prima di dare accesso agli strumenti a un modello scaricato → [Pesi open con backdoor: la supply chain dei modelli «abliterated»](/docs/security/backdoored-open-weights) — il GGUF che scarichi è di solito il terzo anello di una catena di fiducia a tre parti
- Stai spostando un grosso prompt di sistema di Claude su un modello locale? → [Perché un prompt di sistema da 35 KB si rompe su un modello locale](/docs/models/large-system-prompts-on-local-models)
- Quanto sotto i 4 bit può spingersi la quantizzazione? → [Quantizzazione ternaria in pratica: Bonsai 2 27B in 5,95 GB](/docs/models/ternary-quantization-bonsai-2-27b) — 1,75 bit per peso, e perché Ollama non riesce a caricarlo
- Decidi locale o cloud per un compito → [Scegliere un modello](/docs/models/choosing-a-model)
- Fai funzionare gli strumenti anche in locale → [Uso degli strumenti](/docs/api/tool-use)
- Guarda quanto costa davvero eseguire i modelli → [Economia dei token](/docs/power-user/token-economy)
