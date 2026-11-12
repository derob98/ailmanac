# Gestione del contesto

> Source: https://derob98.github.io/ailmanac/it/docs/claude-code/context-management · AILmanac (CC BY 4.0) · last verified 2026-11-08

/compact contro /clear, auto-compattazione e come restare efficaci man mano che le sessioni crescono.

<LevelBadge level="intermediate" />

<Callout type="objectives" items={["Distinguere /clear da /compact e scegliere subito quello giusto", "Guidare una compattazione invece di lasciarla indovinare, e regolare quando scatta quella automatica", "Sapere esattamente cosa sopravvive alla compattazione e cosa viene riassunto e scartato", "Applicare quattro tecniche per mantenere efficaci le sessioni lunghe", "Riconoscere i sintomi di una finestra di contesto piena e risolverli rapidamente"]} />

<VerifyNote lastVerified="2026-11-08" source="https://code.claude.com/docs/en/context-window">
I nomi dei comandi, la finestra di auto-compattazione e la tabella di ciò che sopravvive alla compattazione cambiano da una release all'altra — verifica nella documentazione ufficiale.
</VerifyNote>

## L'idea di fondo

Ogni sessione ha una [finestra di contesto](/docs/foundations/tokens-and-context) finita. Man mano che si riempie, i contenuti più vecchi vengono compressi e Claude può iniziare a "perdere il filo". Gestire il contesto in modo deliberato è ciò che mantiene efficaci le sessioni lunghe.

## I due comandi essenziali

Due comandi coprono quasi ogni situazione. Il trucco è abbinare il comando alla tua intenzione.

<Flashcards cards={[{front: "/clear", back: "Cancella la conversazione e riparti da zero. Usalo quando passi a un'attività NON CORRELATA. Il modo più economico per recuperare un contesto pulito e focalizzato. Alias: /reset e /new."}, {front: "/compact", back: "Riassume la conversazione fin qui in una forma compatta — mantiene l'essenziale liberando spazio. Usalo quando vuoi CONTINUARE la stessa attività ma la finestra si sta riempiendo. Accetta istruzioni di focus facoltative."}]} />

Decidi con una sola domanda: è un'attività nuova o la stessa?

```mermaid
flowchart TD
  A{New task or same task?} -->|New / unrelated| B[/clear]
  A -->|Same task, context full| C[/compact]
```

Due dettagli facili da perdere:

- **`/compact` accetta istruzioni.** `/compact focus on the auth bug fix` mantiene ciò che scegli *tu*, invece di ciò che il passaggio automatico ritiene importante. Eseguilo deliberatamente prima di iniziare una nuova attività lunga, invece di aspettare che sia la finestra a forzarlo.
- **`/clear` non è un punto di non ritorno.** Passa un nome (`/clear auth refactor`) per etichettare la conversazione uscente nel selettore di `/resume`; inoltre, nello stesso processo di Claude Code, il menu di rewind offre ancora una voce `/resume <session-id> (previous session)` — vedi [Checkpoint e Rewind](/docs/claude-code/checkpoints-and-rewind).

## Auto-compattazione — e come spostarla

Quando il contesto si avvicina al limite, Claude Code **compatta automaticamente** così il lavoro continua senza un'interruzione netta. Sui modelli con finestra di contesto da 1M ciò avviene per impostazione predefinita intorno ai 967K token; i modelli precedenti compattano al limite della loro finestra di contesto. Claude Code può anche compattare una conversazione che lasci inattiva.

La soglia è tua da spostare. `/autocompact 500k` compatta prima — utile quando preferisci riassumere alle tue condizioni piuttosto che al 96% di riempimento — e `/autocompact auto` torna alla finestra calibrata per il tuo modello.

<PromptCard title="Compatta prima del default">{`/autocompact 500k`}</PromptCard>

<Steps items={[{title: "Valori accettati", body: "Un numero grezzo di token (500000), uno con suffisso (500k, 1m), auto per tornare alla finestra calibrata del modello, oppure off per disattivare l'auto-compattazione nella sessione. Esegui /autocompact senza argomenti per vedere la finestra attuale."}, {title: "Dove si può impostare", body: "Il comando /autocompact salva nelle impostazioni utente, sotto il modello corrente in modelSettings. Puoi anche impostare autoCompactWindow al livello principale del JSON delle impostazioni, oppure per modello sotto modelSettings, oppure usare la variabile d'ambiente CLAUDE_CODE_AUTO_COMPACT_WINDOW."}, {title: "Precedenza, dalla più alta", body: "CLAUDE_CODE_AUTO_COMPACT_WINDOW, poi autoCompactWindow per modello in modelSettings, poi autoCompactWindow al livello principale, poi la finestra predefinita del modello. Se un livello di impostazioni con priorità maggiore, come le impostazioni gestite, definisce la finestra, /autocompact salva il tuo valore ma la sessione mantiene quello di quel livello — e te lo segnala."}]} />

<Callout type="tip" items={["Considera l'auto-compattazione come un paracadute, non come una strategia. Ripulire tra attività non correlate mantiene il contesto più pulito che lasciare riempire la finestra finché non scatta l'auto-compattazione.", "Quando compatti, fallo di proposito: /compact con istruzioni di focus batte un passaggio automatico che indovina cosa contava."]} />

## Cosa sopravvive alla compattazione

La compattazione riassume la *conversazione*. Tutto ciò che la tua configurazione carica da disco è gestito separatamente — per questo una sessione compattata conosce ancora le convenzioni del tuo progetto.

<Steps items={[{title: "Reiniettato da disco", body: "Il system prompt e lo stile di output continuano ad applicarsi; tornano il CLAUDE.md nella radice del progetto, le regole senza scope, la memoria automatica e il piano che Claude ha scritto in plan mode. Le descrizioni delle skill vengono ricostruite dalle tue skill attuali (Claude Code v2.1.304 o successivo). Se la sessione è iniziata con uno snapshot di git status, Claude Code ne legge uno nuovo."}, {title: "Ricaricato su richiesta", body: "Le regole con frontmatter paths: e i file CLAUDE.md annidati nelle sottodirectory vengono riassunti e scartati, e si ricaricano solo quando Claude tocca di nuovo un file corrispondente. Se una regola deve persistere dopo la compattazione, elimina il frontmatter paths: oppure spostala nel CLAUDE.md nella radice del progetto."}, {title: "Ripristinato in parte", body: "Claude Code rilegge fino a cinque dei file che Claude ha letto o modificato, partendo dai modificati più di recente — ma un file oltre i 5.000 token torna come riferimento al percorso ('Referenced file') senza il contenuto. I corpi delle skill invocate vengono reiniettati con un tetto di 5.000 token per skill e 25.000 in totale, scartando prima le più vecchie e mantenendo l'inizio del file: metti ciò che conta in cima a SKILL.md."}, {title: "Riassunto e scartato", body: "La conversazione stessa, compreso il contesto aggiunto in precedenza dagli hook. Gli hook SessionStart che corrispondono alla sorgente 'compact' vengono eseguiti di nuovo e il loro output entra nel contesto compattato — è l'hook da usare per tutto ciò che deve tornare."}, {title: "Intatto", body: "I comandi in background e i subagent in background continuano a girare, e Claude Code ricorda a Claude quali sono ancora attivi così non ne avvia un duplicato."}]} />

## Tecniche per restare efficaci

Oltre ai due comandi, quattro abitudini mantengono snello il contesto fin dall'inizio.

<Steps items={[{title: "Un'attività per sessione", body: "Non lasciare che un pomeriggio di lavoro non correlato si accumuli in un unico contesto."}, {title: "Delega le letture pesanti ai subagent", body: "Affida le letture corpose ai subagent — bruciano il LORO contesto e restituiscono solo la conclusione. Vedi /docs/claude-code/subagents."}, {title: "Riferisci, non incollare", body: "Indirizza Claude verso i file con @path invece di incollare grandi blocchi, e mantieni snello CLAUDE.md (vedi /docs/claude-code/claude-md)."}, {title: "Tieni d'occhio il budget", body: "Esegui /context per una ripartizione in tempo reale per categoria — una griglia colorata più suggerimenti di ottimizzazione per gli strumenti che pesano sul contesto e per la memoria gonfia, inclusi i file CLAUDE.md e di memoria automatica caricati. Passa 'all' per espandere l'elenco per voce in modalità schermo intero. Una statusline che mostra l'uso del contesto ti dà lo stesso segnale in modo passivo. Vedi /docs/claude-code/statusline."}]} />

<PromptCard title="Vedi dove è andato davvero il tuo contesto">{`/context`}</PromptCard>

Questi rimandano alla documentazione aggiornata: [subagent](/docs/claude-code/subagents), [CLAUDE.md](/docs/claude-code/claude-md) e [statusline](/docs/claude-code/statusline).

:::tip[Sintomo → rimedio]
Se Claude inizia a dimenticare un'istruzione precedente o si ripete, è probabile che la finestra sia piena. `/compact` (stessa attività) o `/clear` (nuova attività) di solito risolve all'istante. Esegui `/context` per confermare — quando la conversazione ha davvero superato la finestra, il suo output indica di quanto sei oltre e quale comando libera spazio. Approfondimenti in [Perché Claude ha fatto così?](/docs/contribute/troubleshooting).

Se invece incappi in `Autocompact is thrashing`, la compattazione sta funzionando ma qualcosa di sovradimensionato continua a riempire di nuovo la finestra — vedi [Risoluzione dei problemi di Claude Code](/docs/claude-code/troubleshooting).
:::

<Callout type="takeaways" items={["/clear cancella la conversazione per ripartire da zero — usalo per attività non correlate (alias: /reset, /new)", "/compact riassume la sessione per liberare spazio — usalo per continuare la stessa attività quando la finestra si riempie, e passa istruzioni di focus perché mantenga ciò che ti interessa", "L'auto-compattazione è una rete di sicurezza, non una strategia: scatta intorno ai 967K token sui modelli con contesto da 1M, e /autocompact 500k (oppure auto, oppure off) sposta quella soglia", "La compattazione riassume la conversazione ma reinietta da disco CLAUDE.md, le regole senza scope, la memoria automatica e il piano; le regole con scope per percorso, i CLAUDE.md annidati e i contenuti dei file grandi non tornano intatti", "Mantieni il contesto snello: un'attività per sessione, delega le letture pesanti ai subagent, riferisci ai file invece di incollarli e controlla /context o una statusline", "Dimenticanze o ripetizioni indicano una finestra piena — /compact (stessa attività) o /clear (nuova attività) risolvono"]} />

<Quiz title="Mettiti alla prova" questions={[{q: "Finisci un'attività e passi a qualcosa di completamente non correlato. Quale comando?", options: ["/compact — per riassumere il lavoro precedente", "/clear — per cancellare la conversazione e ripartire da zero", "Nessuno dei due — lascia che ci pensi l'auto-compattazione"], answer: 1, explain: "/clear cancella la conversazione e riparte da zero. È il modo più economico per recuperare un contesto pulito e focalizzato quando passi a un'attività non correlata."}, {q: "Sei a metà di un'attività e la finestra di contesto si sta riempiendo, ma vuoi proseguire sullo stesso lavoro. Quale comando?", options: ["/clear — per liberare più spazio possibile", "/compact — per riassumere la conversazione mantenendone l'essenziale", "Apri un nuovo terminale"], answer: 1, explain: "/compact riassume la conversazione fin qui in una forma compatta, mantenendo l'essenziale liberando spazio — ideale per continuare la stessa attività."}, {q: "Qual è il modo giusto di pensare all'auto-compattazione?", options: ["La strategia principale per gestire il contesto", "Una rete di sicurezza la cui soglia puoi spostare — un /clear proattivo e un /compact deliberato danno risultati migliori", "Un bug che dovresti disattivare"], answer: 1, explain: "L'auto-compattazione permette al lavoro di continuare senza un'interruzione netta quando il contesto si avvicina al limite — per impostazione predefinita circa 967K token sui modelli con contesto da 1M. È un paracadute: ripulire tra attività non correlate e compattare di proposito con istruzioni di focus battono entrambi l'affidarsi a essa. Puoi anche spostare la soglia con /autocompact 500k, o disattivarla per la sessione con /autocompact off."}, {q: "Tieni una regola in un file con frontmatter `paths:`. La sessione viene compattata. La regola si applica ancora?", options: ["Sì — le regole vengono sempre reiniettate da disco dopo la compattazione", "Non subito — si ricarica solo quando Claude tocca di nuovo un file corrispondente", "No — è sparita per il resto della sessione"], answer: 1, explain: "Le regole con scope per percorso entrano nella cronologia dei messaggi quando Claude legge o modifica il file che le attiva, quindi la compattazione le riassume e le scarta insieme alla conversazione. Si ricaricano su richiesta la volta successiva che viene toccato un file corrispondente. Solo il CLAUDE.md nella radice del progetto e le regole senza scope vengono reiniettati da disco in modo incondizionato — quindi se una regola deve sopravvivere a ogni compattazione, elimina il frontmatter paths: oppure spostala lì."}, {q: "Claude inizia a dimenticare un'istruzione precedente o si ripete. Qual è la causa probabile e il rimedio?", options: ["Un problema di rete — riavvia il computer", "È probabile che la finestra sia piena — /compact (stessa attività) o /clear (nuova attività)", "Il modello è rotto — cambia modello"], answer: 1, explain: "Dimenticanze o ripetizioni di solito significano che la finestra è piena. /compact (stessa attività) o /clear (nuova attività) tipicamente risolve all'istante."}]} />

## Avanti

- [Audit del budget di contesto](/docs/claude-code/context-budget-audit) — la checklist da fare una volta per progetto: `/skill-doctor`, limiti di output, `omitClaudeMd`, la finestra di auto-compattazione
- [Checkpoint e Rewind](/docs/claude-code/checkpoints-and-rewind) — `/rewind` per annullare modifiche o comprimere il contesto da qualsiasi punto
- [Token, contesto e memoria](/docs/foundations/tokens-and-context)
- [Subagent e agenti paralleli](/docs/claude-code/subagents)
- [Personalizzazione della statusline](/docs/claude-code/statusline)
