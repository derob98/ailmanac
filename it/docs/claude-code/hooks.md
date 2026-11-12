# Hook: automazione deterministica

> Source: https://derob98.github.io/ailmanac/it/docs/claude-code/hooks · AILmanac (CC BY 4.0) · last verified 2026-08-22

Esegui comandi in corrispondenza di eventi del ciclo di vita per imporre formattazione, gate e sicurezza.

<LevelBadge level="advanced" />

<VerifyNote lastVerified="2026-08-22" source="https://code.claude.com/docs/en/hooks">
Claude Code documenta più di 30 eventi hook raggruppati per fase — l'elenco completo, la grammatica dei matcher per ciascun evento e i campi JSON di output universali sono nel riferimento ufficiale sugli hook. Nomi e forma dei payload evolvono; verifica sulla fonte prima di fissare un evento o un campo specifico.
</VerifyNote>

Gli hook sono **comandi shell che Claude Code esegue automaticamente** in punti definiti del suo ciclo di vita. Mentre i [permessi](/docs/claude-code/permissions) decidono *se* un'azione è consentita, gli hook permettono a *te* di eseguire logica deterministica attorno ad essa — formattazione, validazione, logging, gate, redazione. Sono il modo per rendere un comportamento garantito invece di "per favore ricordati di".

<Callout type="objectives" items={["Quando ricorrere a un hook invece che a un'istruzione, a un permesso o a una skill", "Il ciclo di vita completo: eventi di sessione, prompt, tool, subagent, task, compattazione e fine turno", "Come si configura un hook: evento, matcher e il payload JSON su stdin", "I due modi in cui un hook blocca un'azione — exit code 2 vs JSON su stdout", "I campi JSON di output universali condivisi tra gli eventi: continue, additionalContext, systemMessage, reloadSkills, sessionTitle, suppressOutput, updatedInput", "Le buone pratiche e gli errori comuni che separano hook veloci e sicuri da hook lenti e silenziosi"]} />

## Quando ricorrere a un hook

Ricorri a un hook quando vuoi che un comportamento sia *garantito*, non semplicemente richiesto. Ogni compito comune corrisponde a un evento del ciclo di vita:

- **Formattazione / lint automatici** dopo ogni modifica di file (`PostToolUse` su `Edit|Write`).
- **Bloccare** un'azione che viola una regola prima che venga eseguita (`PreToolUse`).
- **Redigere** (oscurare) il messaggio dell'assistente prima che arrivi al terminale (`MessageDisplay`).
- **Ricaricare le skill** o impostare un **titolo di sessione** dopo un `SessionStart`.
- **Notificare o registrare nel log** quando una sessione termina, un task finisce o un turno fallisce (`Stop`, `StopFailure`, `SessionEnd`).
- **Iniettare contesto** all'avvio della sessione o quando le istruzioni vengono caricate.

## Come funzionano

Registri gli hook in [`settings.json`](/docs/claude-code/settings), associandoli a un **evento** (e spesso a un matcher — di solito il nome di un tool, a volte un tipo di subagent, un trigger di compattazione o un tipo di notifica). Quando l'evento scatta, Claude esegue il tuo comando, passandogli un **payload JSON su stdin** (il nome dell'evento, la sessione e campi specifici dell'evento come il nome del tool e i suoi input). L'exit code e lo stdout del tuo comando decidono cosa succede dopo.

<Steps items={[{title: "Associa un evento", body: "Registra l'hook in settings.json sotto l'evento del ciclo di vita che ti interessa — ad esempio PostToolUse per l'automazione dopo un tool, o MessageDisplay per la redazione."}, {title: "Restringi con un matcher", body: "Aggiungi un matcher perché l'hook scatti solo quando serve, ad es. matcher \"Edit|Write\" per le modifiche ai file, oppure matcher \"startup|resume\" su SessionStart."}, {title: "Leggi il payload da stdin", body: "Quando l'evento scatta, Claude esegue il tuo comando e invia in pipe un payload JSON su stdin — il nome dell'evento, la sessione e campi specifici dell'evento (tool_name, tool_input, notification, ecc.)."}, {title: "Decidi cosa succede dopo", body: "L'exit code e l'output del tuo comando determinano l'esito: lasciare procedere l'azione, eseguire la tua logica, bloccarla o restituire JSON strutturato per cambiare ciò che Claude vede."}]} />

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }
        ]
      }
    ]
  }
}
```

L'hook qui sopra legge il percorso del file modificato dal JSON su stdin (`.tool_input.file_path`) e lo formatta. Non dare per scontato che una variabile d'ambiente contenga il percorso — **leggilo da stdin.** Segnaposto utili per i percorsi, come `${CLAUDE_PROJECT_DIR}`, *sono* disponibili per localizzare gli script.

## Il ciclo di vita in sintesi

Gli hook di Claude Code coprono l'intera sessione, non solo le chiamate ai tool. Raggruppali per fase così sai dove agganciare la tua logica.

| Fase | Eventi | Uso tipico |
| --- | --- | --- |
| **Sessione** | `SessionStart`, `SessionEnd`, `Setup`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged` | Iniettare contesto all'avvio, fare uno snapshot alla fine, reagire a un ricaricamento di `CLAUDE.md` o a una modifica di `.env` su disco |
| **Prompt** | `UserPromptSubmit`, `UserPromptExpansion` | Filtrare o riscrivere il prompt prima che Claude lo veda |
| **Tool** | `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch` | Consentire/negare un'azione, passare la decisione a un umano, formattare dopo le modifiche, riprovare dopo un rifiuto in auto mode |
| **Subagent** | `SubagentStart`, `SubagentStop` | Registrare avvio/arresto, impedire a un subagent di restituire il risultato |
| **Task** | `TaskCreated`, `TaskCompleted` | Annullare un task creato per errore, filtrare il completamento |
| **Compattazione** | `PreCompact`, `PostCompact` | Fare uno snapshot della trascrizione prima della compattazione, verificare dopo |
| **Modello** | `PreModelSwitch`, `PostModelSwitch` | Bloccare un cambio di modello prima che venga applicato; reagire dopo il cambio, anche quando una sessione ripresa lo ripristina |
| **Turno** | `Stop`, `StopFailure`, `Notification`, `MessageDisplay` | Notificare al completamento, avvisare in caso di errore API, oscurare il testo mostrato |
| **Team + MCP** | `TeammateIdle`, `Elicitation`, `ElicitationResult`, `WorktreeCreate`, `WorktreeRemove` | Coordinamento tra sessioni, filtrare le elicitation MCP, incapsulare le operazioni sui worktree |

I campi stdin esatti di ogni evento, la grammatica dei matcher e le regole di blocco sono nel [riferimento ufficiale sugli hook](https://code.claude.com/docs/en/hooks). Il catalogo qui sopra è la mappa; il riferimento è il territorio.

## Come blocca un hook

Due modi, a seconda dell'evento:

- **Exit code 2** — l'hook fa fallire l'azione e ciò che ha scritto su **stderr** diventa il messaggio che Claude vede. Semplice e funziona per gli hook di tipo command sugli eventi bloccanti (`PreToolUse`, `UserPromptSubmit`, `UserPromptExpansion`, `Stop`, `SubagentStop`, `TeammateIdle`, `TaskCreated`, `TaskCompleted`, `ConfigChange`, `PostToolBatch`, `PreCompact`, `PreModelSwitch`, `Elicitation`, `ElicitationResult`, `WorktreeCreate`, `WorktreeRemove`). Su `PermissionRequest` l'exit 2 viene ignorato; nega tramite il suo oggetto `decision`.
- **JSON su stdout (exit 0)** — restituisci una decisione strutturata. Per `PreToolUse` è un `permissionDecision` pari a `"allow"`, `"deny"`, `"ask"` (sottopone la chiamata all'utente) o `"defer"` (solo per le esecuzioni `-p` guidate da un'app che le riprende), con un `permissionDecisionReason`. Gli eventi non bloccanti (`PostToolUse`, `Notification`, `MessageDisplay`, `StopFailure`, la maggior parte degli eventi di sessione) ignorano i tentativi di blocco — ma il loro output JSON può comunque orientare ciò che Claude vede dopo.

Lo script qui sotto è un hook `PreToolUse` sul tool Bash. Leggilo dall'alto in basso: estrae il comando da stdin e, se sembra distruttivo, scrive un motivo su stderr ed esce con 2 per bloccare.

```bash
#!/usr/bin/env bash
# PreToolUse hook on the Bash tool: refuse to delete things.
command=$(jq -r '.tool_input.command' < /dev/stdin)
if [[ "$command" == rm\ * || "$command" == *"rm -rf"* ]]; then
  echo "Blocked: destructive 'rm' is not allowed by policy." >&2
  exit 2
fi
exit 0
```

## Campi JSON di output universali

La maggior parte degli eventi accetta su stdout un oggetto JSON strutturato che orienta ciò che accade dopo — separato dai campi di decisione specifici dell'evento come `permissionDecision`. I più utili:

| Campo | Cosa fa | Dove funziona |
| --- | --- | --- |
| **`continue`** | Se `false`, Claude smette del tutto di elaborare — ha la precedenza su ogni decisione specifica dell'evento | La maggior parte degli eventi |
| **`systemMessage`** | Aggiunge un messaggio al contesto / alla trascrizione di Claude, così vede perché sei intervenuto | La maggior parte degli eventi bloccanti |
| **`additionalContext`** | Inietta contesto extra che Claude può leggere e usare al turno successivo | `SessionStart`, `UserPromptSubmit`, altri |
| **`reloadSkills`** | Riesegue la scansione delle directory delle skill così una sessione riconosce una skill appena scritta | `SessionStart` (e altri eventi di sessione) |
| **`sessionTitle`** | Imposta il titolo della sessione nell'interfaccia — sotto `hookSpecificOutput` su `SessionStart` | `SessionStart` |
| **`suppressOutput`** | Nasconde a Claude l'output del tool (utile per comandi rumorosi) | Eventi dei tool |
| **`updatedInput`** | Riscrive l'input del tool prima che venga eseguito (ad es. aggiungere un flag `--dry-run`) | `PreToolUse` |
| **`terminalSequence`** | Emette sequenze di escape del terminale — campanella, titolo della finestra, badge di notifica | `Notification`, `StopFailure`, altri |

I campi di decisione specifici dell'evento — `permissionDecision` (`"allow"`, `"deny"`, `"ask"` o `"defer"`, più `permissionDecisionReason`) su `PreToolUse`, `decision.behavior` (`"allow"` o `"deny"`) su `PermissionRequest` e `retry: true` su `PermissionDenied` per lasciare che Claude riprovi la chiamata negata — si sovrappongono a quelli universali.

## Il modello mentale

Un hook `PreToolUse` viene eseguito *prima* dell'azione e può bloccarla; un hook `PostToolUse` viene eseguito *dopo* che l'azione è riuscita e reagisce al risultato.

```mermaid
flowchart LR
  A[Claude wants to act] --> B{PreToolUse hook}
  B -->|exit 0| C[Action runs]
  B -->|non-zero / block| X[Blocked, message to Claude]
  C --> D{PostToolUse hook}
  D --> E[Format / lint / log]
```

<Flashcards title="Gli eventi hook in breve" cards={[{front: "PreToolUse", back: "Scatta prima che un'azione venga eseguita. Usalo per bloccare o filtrare — ad es. rifiutare un comando distruttivo prima che giri. Campo di decisione: permissionDecision."}, {front: "PostToolUse", back: "Scatta dopo un'azione corrispondente. Usalo per formattare, fare lint o registrare ciò che è appena cambiato. Non bloccante."}, {front: "MessageDisplay", back: "Scatta mentre il testo del messaggio dell'assistente viene mostrato. Usalo per oscurare segreti o PII dal terminale — solo visualizzazione, non può bloccare."}, {front: "SessionStart", back: "Scatta all'inizio (o alla ripresa) di una sessione. Usalo per iniettare contesto con additionalContext, reloadSkills dopo l'arrivo di una nuova skill o impostare sessionTitle."}, {front: "Stop / StopFailure", back: "Stop scatta quando Claude termina un turno senza problemi; StopFailure scatta quando il turno è finito con un errore API (rate_limit, overloaded, auth, ecc.). Notifica o riprova automaticamente sulla variante di errore."}, {front: "PreCompact / PostCompact", back: "Scattano attorno alla compattazione del contesto. PreCompact può bloccare (exit 2) o fare prima uno snapshot della trascrizione; PostCompact reagisce allo stato compattato."}]} />

## Buone pratiche

- **Mantieni gli hook veloci e idempotenti** — girano spesso. Gli hook `SessionEnd` condividono un unico budget di 1,5 secondi tra tutti, quindi tieni al minimo il lavoro di fine sessione.
- **Fallisci in modo rumoroso sui problemi reali**, ma non bloccare per questioni cosmetiche.
- **Tratta l'output dell'hook come feedback per Claude** — un messaggio chiaro su stderr (exit 2) o in `systemMessage` (JSON) lo aiuta ad autocorreggersi.
- **Preferisci l'output JSON agli exit code** quando vuoi dire più di "bloccato" — `permissionDecision: "ask"` su `PreToolUse` passa la decisione a un umano senza sbattere la porta, e `additionalContext` ti permette di *orientare* invece di limitarti a rifiutare.
- Gli hook girano con i privilegi della tua shell — controlla ogni hook che non hai scritto tu ([Revisione di codice di terze parti](/docs/security/reviewing-third-party-code)).

## Errori comuni

- **Leggere il percorso del file da una variabile d'ambiente.** Il percorso sta nel JSON su stdin (`.tool_input.file_path`), non in `$CLAUDE_FILE_PATH`. Passa stdin a `jq` in pipe.
- **Blocchi silenziosi.** Se un hook `PreToolUse` esce con 2 senza scrivere nulla su stderr, Claude è bloccato ma non sa *perché* e non può adattarsi. Scrivi sempre un motivo chiaro (oppure usa `permissionDecisionReason`).
- **Provare a bloccare un evento non bloccante.** `PostToolUse` scatta *dopo* che il tool è stato eseguito — un exit 2 mette solo un messaggio nell'orecchio di Claude, non può annullare l'azione. Se ti serve un gate, aggancia `PreToolUse`.
- **Hook lenti.** Un hook `PostToolUse` gira dopo *ogni* modifica corrispondente. Un linter da 3 secondi rende lenta l'intera sessione — mantieni gli hook veloci e, idealmente, agisci solo su ciò che è cambiato.
- **Matcher troppo ampi.** `matcher: ".*"` scatta su ogni tool. Restringi con un nome esatto, un elenco `Edit|Write` o il campo `if` per singolo handler (ad es. `"if": "Bash(git push *)"`).
- **Dimenticare che i matcher esistono anche per gli eventi non-tool.** `SessionStart` corrisponde a `startup|resume|clear|compact|fork`; `Notification` corrisponde a tipi come `permission_prompt|idle_prompt|agent_completed`; `PreCompact` corrisponde a `manual|auto`. Un singolo hook collegato al sottoinsieme sbagliato scatta troppo spesso o mai.
- **Fidarsi di hook che non hai scritto.** Un hook esegue shell arbitraria con i tuoi privilegi. Controlla qualsiasi hook proveniente da un plugin o da un template prima di usarlo — vedi [Revisione di codice di terze parti](/docs/security/reviewing-third-party-code).

<Callout type="warning" items={["Un hook esegue shell arbitraria con i tuoi privilegi — non collegare mai un hook proveniente da un plugin o da un template senza averlo letto prima."]} />

## Ricette da copiare

Gli starter da copiare e incollare sono in [Ricette per hook e settings.json](/docs/templates/hooks-settings). Alcune ricette ad alto impatto per vedere la forma degli eventi più recenti:

<PromptCard title="Formatta automaticamente i file modificati (PostToolUse su Edit|Write)">{`{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write" }
        ]
      }
    ]
  }
}`}</PromptCard>

<PromptCard title="Imposta un titolo di sessione per progetto all'avvio (SessionStart)">{`{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "jq -nc --arg t \\"$(basename \\"$PWD\\") — $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo detached)\\" '{hookSpecificOutput:{sessionTitle:$t}}'"
          }
        ]
      }
    ]
  }
}`}</PromptCard>

<PromptCard title="Ricarica le skill dopo un SessionStart (riconosce una skill appena scritta)">{`{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          { "type": "command", "command": "printf '{\\"reloadSkills\\": true}\\n'" }
        ]
      }
    ]
  }
}`}</PromptCard>

<PromptCard title="Oscura le chiavi API dal testo dell'assistente mostrato (MessageDisplay)">{`{
  "hooks": {
    "MessageDisplay": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.message.content' | sed -E 's/(sk-[A-Za-z0-9_-]{20,})/sk-***REDACTED***/g'"
          }
        ]
      }
    ]
  }
}`}</PromptCard>

<PromptCard title="Notifica quando un turno fallisce (StopFailure — rate limit, sovraccarico, auth)">{`{
  "hooks": {
    "StopFailure": [
      {
        "matcher": "rate_limit|overloaded|authentication_failed|billing_error",
        "hooks": [
          { "type": "command", "command": "osascript -e 'display notification \\"Claude Code turn failed — check the terminal\\" with title \\"Claude Code\\"'" }
        ]
      }
    ]
  }
}`}</PromptCard>

<Quiz title="Verifica te stesso" questions={[{q: "Dove trova un hook il percorso del file appena modificato?", options: ["Nella variabile d'ambiente $CLAUDE_FILE_PATH", "Nel payload JSON su stdin, in .tool_input.file_path", "In un argomento da riga di comando passato da Claude"], answer: 1, explain: "Il percorso sta nel JSON su stdin (.tool_input.file_path), non in una variabile d'ambiente. Passa stdin a jq in pipe per leggerlo."}, {q: "Un hook PreToolUse esce con codice 2. Cosa succede?", options: ["L'azione è consentita e lo stdout viene registrato nel log", "L'azione viene bloccata, e ciò che l'hook ha scritto su stderr diventa il messaggio che Claude vede", "Claude ignora il risultato perché l'exit 2 è riservato"], answer: 1, explain: "L'exit code 2 fa fallire l'azione; stderr diventa il messaggio che Claude vede. Scrivi sempre un motivo chiaro così Claude può adattarsi."}, {q: "Vuoi che una sessione riconosca una skill che hai appena aggiunto a .claude/skills/ senza riavviare. Quale campo di output, su quale evento?", options: ["reloadSkills: true su SessionStart", "restart: true su Stop", "refresh: true su PostToolUse"], answer: 0, explain: "Emettere {\"reloadSkills\": true} da un hook SessionStart riesegue la scansione delle directory delle skill, così la sessione corrente riconosce le skill nuove o modificate."}, {q: "Vuoi oscurare i segreti dal testo di Claude prima che compaia sullo schermo dell'utente. Quale evento?", options: ["PreToolUse", "PostToolUse", "MessageDisplay"], answer: 2, explain: "MessageDisplay scatta mentre il testo del messaggio dell'assistente viene mostrato — il posto giusto per trasformare o oscurare il testo mentre va al terminale. Non può bloccare."}]} />

<Callout type="takeaways" items={["Gli hook rendono il comportamento garantito, non richiesto — logica deterministica attorno ad azioni che i permessi si limitano a consentire o negare.", "Il ciclo di vita copre più di 30 eventi tra le fasi di sessione, prompt, tool, subagent, task, compattazione e turno — scegli la fase giusta prima di scrivere lo script.", "Registra in settings.json un evento più un matcher; Claude invia in pipe un payload JSON su stdin e legge il tuo exit code e il tuo output.", "Leggi il percorso del file da stdin (.tool_input.file_path) — non da una variabile d'ambiente.", "Blocca con l'exit code 2 (stderr diventa il messaggio) o con JSON strutturato su stdout (permissionDecision sugli eventi dei tool, {continue: false} per fermare tutto).", "I campi di output universali — additionalContext, systemMessage, reloadSkills, sessionTitle, suppressOutput, updatedInput — ti permettono di orientare Claude invece di limitarti a consentire o rifiutare.", "Mantieni gli hook veloci, idempotenti e con matcher stretti — e controlla ogni hook che non hai scritto, perché gira con i privilegi della tua shell."]} />

## Prossimi passi

- [Mods: estensioni in-process](/docs/claude-code/mods) — il fratello in-process: middleware TypeScript che può *riscrivere* un evento invece di limitarsi a consentirlo o bloccarlo, e raggiunge ogni evento di questa pagina come `classic.<Event>`
- [settings.json](/docs/claude-code/settings) · [Permessi](/docs/claude-code/permissions)
- [Skill](/docs/claude-code/skills) — competenza vs automazione
- [Rafforzare le esecuzioni autonome](/docs/security/hardening-autonomous-runs)
