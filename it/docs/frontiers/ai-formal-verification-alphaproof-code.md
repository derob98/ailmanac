# Verifica formale con l'AI: 6,5 milioni di righe di prova su 26.000 righe di fiducia

> Source: https://derob98.github.io/ailmanac/it/docs/frontiers/ai-formal-verification-alphaproof-code · AILmanac (CC BY 4.0) · last verified 2026-11-11

AlphaProof Code di Google DeepMind ha verificato con un proof checker il codice del protocollo di Signal, e il titolo è circolato senza le sue note a piè di pagina. La prova riguarda un binario ELF, non il sorgente Rust — quindi rustc è fuori dalla base fidata, e la garanzia copre solo quella build. Non è stato trovato alcun bug perché non è mai stata una caccia ai bug. E l'intero risultato poggia su circa 26.000 righe di specifica che un essere umano deve leggere. L'architettura da copiare, l'ambito effettivamente coperto e un protocollo per leggere la prossima affermazione di questo tipo.

<LevelBadge level="advanced" />

Il **10 novembre 2026** Google DeepMind ha pubblicato [AlphaProof Code](https://deepmind.google/blog/introducing-alphaproof-code/) e un paper di accompagnamento che sostiene qualcosa che non era mai stato sostenuto prima: *le prime prove di proprietà di sicurezza a livello di protocollo per un'implementazione non modificata e largamente diffusa di un protocollo crittografico.* Il bersaglio era Signal. Il risultato: circa **6,5 milioni di righe di Lean verificate dalla macchina**. Lo stesso giorno ha raggiunto **643 punti e 185 commenti** su Hacker News.

L'obiezione più votata nel thread era buona: hanno verificato una libreria con una storia di bug *e non ne hanno trovato nessuno?* Sembra un campanello d'allarme, e il solito seguito — «devono aver dimostrato qualcosa di ristretto» — è in parte giusto e per lo più fuori bersaglio.

Questa pagina è la lettura per chi lavora sul campo. Non «l'AI ora sa dimostrare la correttezza del codice», che è falso, e nemmeno «è tutto hype», che è altrettanto falso. Il contenuto interessante sta nell'**aritmetica della fiducia**: cosa è davvero verificato dalla macchina, cosa è assunto, e quale parte di tutto questo un team esterno a DeepMind può copiare oggi.

<Callout type="objectives" items={[
  "Evitare la trappola del nome: AlphaProof Code condivide il marchio con AlphaProof del 2024 e quasi nulla della sua architettura — niente reinforcement learning, niente tree search",
  "Capire perché dimostrare proprietà di un binario ELF anziché del sorgente Rust mette il compilatore Rust FUORI dalla base fidata — e cosa si guadagna e cosa si paga",
  "Fare l'aritmetica della fiducia: 6,5M di righe di prova non fidata che poggiano su ~26.000 righe di specifica che un essere umano deve leggere e a cui deve credere",
  "Sapere perché non è stato trovato alcun bug, perché non è mai stato l'obiettivo e cosa hanno davvero testato i due bug reintrodotti",
  "Copiare l'architettura anti-imbroglio — la directory di specifica tenuta fuori portata, il critico che non vede mai un tentativo di prova e il protocollo di emendamento — che è l'idea ingegneristica trasferibile",
  "Leggere onestamente la tabella dell'ambito: nessuna affermazione di tempo costante, niente concorrenza, niente messaggistica di gruppo, niente generazione di chiavi, e non le app distribuite di Signal",
  "Applicare un protocollo in sei passi al prossimo annuncio «l'AI ha verificato il nostro codice»"
]} />

## La versione in una frase

Un team di cinque persone, dirigendo **40–80 agenti basati su Gemini 4 Carbon** su una singola macchina per quattro settimane, ha prodotto due prove di sicurezza indipendenti verificate dalla macchina — una simbolica, una computazionale — sul **binario AArch64** di un harness CLI costruito ad hoc attorno al **percorso di sessione uno-a-uno** di `libsignal-protocol` v0.105.4, poggiando su circa **26.000 righe di specifica fidata e semantica della macchina**, con il kernel di Lean come unica cosa che deve essere corretta perché le prove stesse siano valide.

Ogni clausola di quella frase ha un peso. Ecco perché.

## 1. Questo non è l'AlphaProof che ricordi

L'[AlphaProof](https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/) del 2024 era un sistema di reinforcement learning: un modello linguistico accoppiato ad **AlphaZero**, che si addestrava su prove in Lean, ottenne 28/42 alle IMO 2024 (livello da medaglia d'argento, risolvendo 4 problemi su 6) e pubblicò la sua metodologia su *Nature* nel novembre 2025.

**AlphaProof Code non ha nulla di quel macchinario.** Nel paper non viene descritto alcun ciclo AlphaZero, alcun RL, alcun albero di ricerca di prove. È un framework multi-agente in cui «agenti di coding generalisti il cui comportamento è definito da *skill*: documenti in linguaggio naturale» scrivono Lean, e **il kernel di Lean lo verifica**. Gli agenti sono normali agenti LLM con prompt di ruolo. L'affidabilità viene dal verificatore, non dal dimostratore.

<Callout type="key">
Due sistemi, un marchio, architetture diverse. Se citi «AlphaProof» come prova che dimostratori addestrati con RL ora verificano codice di produzione, hai fuso due risultati non correlati. Nulla nel paper del 2026 afferma che il sistema del 2024 ne sia un componente.
</Callout>

Questa distinzione conta per le previsioni. Una storia di scaling sul self-play non si trasferisce qui. Ciò che si trasferisce è una storia di *orchestrazione di agenti contro un verificatore solido* — una cosa molto più copiabile, ed è il motivo per cui questa pagina esiste.

## 2. La prova riguarda un binario, ed è questa la parte ingegnosa

La maggior parte del lavoro di verifica dimostra proprietà del codice sorgente, il che significa che poi devi fidarti del compilatore — da cui CompCert, da cui anni di lavoro.

AlphaProof Code ha preso la strada opposta. I crate Rust non modificati sono compilati da **`rustc` standard** in un ELF AArch64 Linux, e i teoremi riguardano **quel binario**, interpretato da una semantica formale di AArch64 scritta in Lean che copre **467 istruzioni e 31 chiamate di sistema in 7.578 righe**.

La conseguenza è dichiarata senza giri di parole nella discussione sulla base fidata del paper: **«Il compilatore Rust *non* è fidato.»** Non devi credere che `rustc` sia corretto, perché non ragioni mai su Rust.

Il prezzo è altrettanto netto, e un commentatore di HN l'ha detto meglio della maggior parte delle coperture: la garanzia si aggancia a *quell'*ELF. Cambia un flag del compilatore, aggiorna `rustc`, rifai il link — e hai un binario diverso su cui il teorema non dice nulla. Le istruzioni di riproduzione fissano **`rustc` 1.98.1** e avvertono di non sostituirlo, perché il Lean generato dipende dall'output esatto del compilatore.

Altri due limiti vivono nella semantica stessa. **Non** modella thread, segnali, vDSO, linking dinamico né file fuori dalla directory di lavoro — quindi è un processo single-thread linkato staticamente, e **nulla sulla concorrenza è dimostrato**. E la correttezza della semantica *non può* essere dimostrata, dato che hardware e kernel non sono oggetti formali; viene validata tramite test differenziali contro Unicorn, il modello Sail Armv9.4-A di ARM e `qemu-aarch64`.

## 3. Non è stato trovato alcun bug — perché non è mai stata una caccia ai bug

Non è stato trovato né segnalato alcun nuovo difetto in libsignal. Non è un fallimento nascosto; è un errore di categoria nel modo in cui il risultato è stato letto.

Ciò che DeepMind ha fatto invece è stato il **mutation testing della specifica**. Due bug reali di libsignal, già corretti in precedenza, sono stati reintrodotti in una copia isolata, e il sistema ha prodotto prove verificate dalla macchina che le versioni difettose erano *insicure*:

| Bug reintrodotto | Cosa andava storto | Commit di correzione upstream |
|---|---|---|
| **weak state** | Un messaggio prekey decifrabile solo con una sessione archiviata faceva comunque salvare a libsignal il nuovo stato di sessione — inclusa una copia del segreto della signed prekey | `cd361186fba60c83186262d91b03af608fb8c7c3` |
| **small subgroup** | Il responder PQXDH non verificava che la base key X25519 dell'iniziatore fosse priva di torsione e nell'intervallo valido, quindi un handshake rigiocato con una base key manomessa crea una seconda sessione che condivide lo stesso segreto | `5293caa6cad81566b80f3c3731857bedaa78737b` |

Entrambi i bug erano stati **scoperti da ricerca umana precedente** (Cheval et al., 2026), non da AlphaProof Code. Il loro ruolo qui è rispondere all'unica domanda che rende credibile una specifica: *questa specifica avrebbe intercettato un bug reale?*

<Callout type="warning">
Il repository è più prudente del post sul blog. Secondo il `PAPER_MAP.md` del progetto stesso, le quattro confutazioni simboliche dei mutanti sono dimostrate rispetto a un enunciato precedente, e il loro riorientamento sul teorema finale del titolo è **in sospeso** (tracciato come `T-12(d)`); le confutazioni computazionali vivono su **branch non uniti**; dieci obblighi sintetici di iniezione di bug restano stub esentati con `sorry` su `main`; e le confutazioni dei mutanti non ricevono **alcun replay `comparator`** contro una sfida tenuta fuori portata. Se ripeti l'affermazione del blog «in entrambi i casi, il sistema ha prodotto una prova verificata dalla macchina che la versione difettosa era insicura», ripeti insieme questa avvertenza.
</Callout>

Quel divario tra il riassunto di un blog e il tracker delle issue di un repository è l'abitudine più riutilizzabile di questa pagina: **gli artefatti sono stati pubblicati, quindi le avvertenze sono verificabili.** La maggior parte degli annunci di verifica con l'AI non ti dà questa possibilità.

## 4. L'aritmetica della fiducia: 6,5 milioni di righe che poggiano su 26.000

Ecco la forma del risultato, dai conteggi del paper stesso:

| Livello | Dimensione | Chi deve essere nel giusto |
|---|---|---|
| Prove (non fidate) | **~6,5M righe** di Lean — 5,3M sul binario (condivise da entrambe le prove), ~860k computazionali, ~350k simboliche | Nessuno. Le verifica il **kernel di Lean** |
| Prove dei bug reintrodotti | ~140.000 righe | Nessuno |
| Prove dell'allocatore | ~70.000 righe | Nessuno |
| Directory di specifica | ~54.000 righe in totale | — |
| **Specifica fidata che devi leggere** | **~18.000 righe** nel repository **+ ~8.000 righe** di semantica AArch64 ≈ **26.000** | **Tu** |
| Codice verificato | ~560 KB, ~140.000 istruzioni AArch64 | — |

I 6,5 milioni sono il numero che ha circolato, ed è il **meno** importante. Le prove sono non fidate per costruzione: il gatekeeper richiede che il kernel di Lean le accetti e che si usino solo i tre assiomi standard di Lean — `propext`, `Quot.sound`, `Classical.choice`. Una prova sbagliata non supera il typecheck.

Le **26.000** sono il numero che decide se il risultato significa qualcosa, perché una specifica «deve essere *fidata* … e non può essere verificata automaticamente — un difetto potrebbe indebolire la garanzia fornita dal teorema.» Questo è il divario di specifica, e il paper è insolitamente franco al riguardo, elencando cinque mitigazioni: agenti revisori scettici, teoremi di soddisfacibilità e di non-vacuità verificati dalla macchina, mutation testing, confutazioni di bug storici e revisione umana — pur ammettendo che «non ci si aspetta che la revisione umana individui tutti i bug in un grande codebase.»

Nota che i due 140.000 in quella tabella sono unità diverse: 140.000 *righe di Lean* per le prove dei bug, e 140.000 *istruzioni AArch64* di codice verificato. Non c'entrano l'uno con l'altro.

Un dettaglio che vale la pena conoscere, perché è il genere di cosa che non finisce mai in un comunicato stampa: le specifiche stesse sono state «sviluppate attraverso un intenso scambio tra esseri umani e agenti basati su **Gemini 4 Carbon e Claude Opus 5.5**.» Le prove sono state prodotte *interamente* da team di Gemini 4 Carbon. E **«nessuno degli autori ha scritto codice di prova.»**

## 5. L'architettura da copiare

L'attacco ovvio a qualsiasi sistema di verifica con l'AI è: *l'agente indebolirà la specifica finché il codice non sarà verificato.* Hacker News ha sollevato esattamente questo. Il progetto del paper è una risposta diretta e meccanica, ed è la parte che un team esterno a DeepMind può copiare questa settimana — in Lean, in una suite di property test o in un gate di CI.

<Steps items={[
  {title: "Separa i ruoli in modo che nessun agente possa insieme scrivere e benedire", body: "Sette ruoli con poteri disgiunti: un orchestratore che pianifica ma non modifica mai Lean, worker di prova, un team lead per la gestione del contesto, un architetto che scompone le prove, un integratore che è l'unico ruolo autorizzato a fare commit, un critico e un gatekeeper. La divisione è il controllo, non una comodità."},
  {title: "Metti la specifica dove nessun dimostratore può raggiungerla", body: "La specifica viene copiata in una directory tenuta fuori portata su cui nessun agente può scrivere. I dimostratori lavorano su una propria copia e non possono mai modificare in silenzio ciò rispetto a cui vengono misurati."},
  {title: "Confronta meccanicamente la specifica prima di accettare qualsiasi prova", body: "Uno strumento chiamato comparator deve confermare che l'enunciato del teorema del titolo E ogni definizione da cui dipende transitivamente siano identici byte per byte alla copia tenuta fuori portata — non semplicemente che un teorema con quel nome superi il typecheck. È il passo che chiude il buco «l'agente ha spostato i pali della porta»."},
  {title: "Ammetti emendamenti, ma rendili costosi e avversariali", body: "I dimostratori non possono modificare la specifica; possono proporre un emendamento a un critico. Il critico richiede necessità dimostrata (una confutazione verificata dalla macchina o un controesempio concreto), nessun indebolimento di alcuna proprietà di sicurezza e un diff piccolo. Un esempio reale accettato: memcpy può copiare da memoria di sola lettura."},
  {title: "Tieni il critico cieco rispetto ai tentativi di prova", body: "Il critico approva gli emendamenti e non vede mai i tentativi di prova. Non può essere convinto ad allentare una proprietà perché una certa prova è quasi riuscita — il modo più naturale in cui una revisione del genere viene catturata."},
  {title: "Ancorati a un verificatore che non hai scritto, con un elenco enumerato di assiomi", body: "Il kernel di Lean è l'ancora di fiducia, e il gate verifica che siano stati usati solo propext, Quot.sound e Classical.choice. Un agente non può far passare di contrabbando un assioma che renda banale l'obiettivo."},
  {title: "Pubblica gli artefatti in modo che le avvertenze siano verificabili", body: "Le prove Lean, le specifiche, i pin di build e una mappa paper-repository sono pubblici. È per questo che i divari della sezione 3 sono conoscibili — ed è lo standard a cui tenere il prossimo annuncio."}
]} />

<Callout type="note">
Generalizza il passo 3 e ottieni una regola che vale ben oltre Lean: **un controllo superato è una prova solo se la proprietà verificata è identica byte per byte a una che hai scritto e conservato fuori portata.** È la stessa modalità di fallimento per cui gli agenti modificano i test invece del codice — vedi [Reward hacking negli agenti di coding](/docs/frontiers/reward-hacking-in-coding-agents).
</Callout>

## 6. Cosa è stato dimostrato e cosa no

L'ambito è molto più ristretto di «Signal ora è verificato». Sono state prodotte due prove indipendenti sull'harness `libsignal-cli` che coprono **solo** `init` (`process_prekey_bundle`), `send` (`message_encrypt`) e `recv` (`message_decrypt`).

**Dimostrato — modello simbolico (Dolev–Yao).** Dieci teoremi validi per ogni esecuzione senza collisioni: forward secrecy, post-compromise security delle chiavi dei messaggi, autenticazione dell'handshake, resistenza a KCI, segretezza dell'handshake anche contro un attaccante che *in seguito* rompa Diffie–Hellman, indipendenza delle sessioni e «nessuna esecuzione va in errore o diverge».

**Dimostrato — modello computazionale.** Riservatezza e autenticità con forward secrecy e post-compromise security per PQXDH composto con il Triple Ratchet, enunciate come limite concreto sul vantaggio dell'attaccante.

Poiché il requisito di terminazione normale esclude le esecuzioni che vanno in errore, **i guasti di tipo memory-safety sono esclusi come effetto collaterale** — scritture in memoria eseguibile, accessi a memoria non mappata, violazioni di permessi — solo per le esecuzioni modellate.

Ora l'altra colonna, che è più lunga:

| Non coperto | Dettaglio |
|---|---|
| **Tempo costante / canali laterali** | **Non compare da nessuna parte alcuna affermazione su timing, cache o analisi della potenza.** Non lasciare che qualcuno ne suggerisca una |
| **Concorrenza** | La semantica non modella né thread né segnali |
| **Il resto di libsignal** | `poksho`, `zkgroup`, `zkcredential`, `signal-crypto`, `attest`, `usernames`, `media` sono interamente fuori ambito |
| **Generazione di chiavi** | `keygen` non è verificato |
| **Messaggistica di gruppo** | Lavoro futuro. Più di due parti è esplicitamente escluso |
| **Le primitive stesse** | Specificate tramite *contratti*, non dimostrate — 37 hook esterni più 18 panic extern. Se una routine reale non rispetta il proprio contratto modellato, la garanzia non vale |
| **Le app distribuite di Signal** | Il risultato riguarda la *loro* build di `libsignal-cli` eseguita come processo nuovo. Estenderlo ad Android o iOS dipende dal fidarsi che quegli ambienti preservino il comportamento del codice |
| **Attaccanti quantistici, stato multi-dispositivo** | Indicati nella riga «non coperto» del paper stesso, insieme alla guarigione post-quantistica di SPQR e ai primi messaggi avversari verso sessioni promosse in seguito |

E il limite che merita un paragrafo a sé: **il limite computazionale diventa vacuo su larga scala.** Se quasi ogni messaggio avvia una nuova epoca, i termini statistici rendono il limite vacuo per singole sessioni di circa **25.000 messaggi**, o per 2^20 sessioni di 2^10 messaggi. Mantieni attaccata la clausola condizionale — la soglia morde solo sotto quell'ipotesi del quasi-ogni-messaggio, e citare il numero nudo lo esagera.

Anche la prova simbolica porta limiti rigidi sugli input incorporati negli enunciati: stdin al massimo 2^20 byte, plaintext di send al massimo 10^6 byte, esattamente due parti oneste predisposte con ruoli fissi, una sessione attiva per file, solo codifica protobuf canonica e 1 GiB di memoria fisica modellata.

## 7. Era già superato il giorno dell'annuncio

Verificato: `libsignal-protocol` **v0.105.4** (rilasciata il 22 ottobre 2026) con `spqr` v1.6.0.

Pubblicate da allora: **v0.106.0, v0.106.1, v0.106.2 e v0.107.0** — e la v0.107.0 è uscita il **10 novembre 2026**, lo stesso giorno dell'annuncio. La v0.106.0 ha cambiato la gestione delle sessioni da Sesame a Tahini e ridotto le sessioni archiviate da 40 a 3, che è esattamente l'area in cui viveva il bug «weak state».

<Callout type="key">
Questo è il costo strutturale della verifica a livello di binario, non uno slittamento di calendario. La prova è fissata a un solo artefatto compilato; la libreria che descrive procede con la propria cadenza di rilascio. Qualsiasi affermazione «il nostro codice è formalmente verificato» ha bisogno di un numero di versione accanto e di una storia per ciò che accade al prossimo rilascio.
</Callout>

## 8. I numeri che davvero cambiano il quadro

| Misura | AlphaProof Code | A titolo di confronto |
|---|---|---|
| Team umano | **5 persone, 4 settimane** (lavoro sulle prove) | **seL4: ~20 anni-persona.** CompCert: ~6 |
| Codice di prova scritto dagli autori | **Nessuno** | — |
| Agenti per campagna | **40–80**, su una **singola macchina**, **24–72 ore** | — |
| Costo di calcolo | **Non riportato da nessuna parte** — niente ore GPU/TPU, niente conteggi di token, niente dollari | — |
| Mira della revisione umana | Gli agenti hanno segnalato «solo l'uno per cento del codebase» per una seconda occhiata umana — **affermazione presente solo nel blog, non ribadita nel paper** | — |
| Ricostruzione pulita delle prove | **Diverse ore, 15–34 GiB di RAM di picco** | — |

Il confronto con seL4 è il titolo onesto. Anche prendendo ogni numero per buono, l'aritmetica di un commentatore di HN regge: un guadagno di produttività di 10x lascia comunque la verifica su scala Linux bisognosa di decenni o di team di esperti molto grandi. Ciò che è cambiato non è che la verifica sia diventata economica — è che un budget di **quattro settimane e cinque persone** ora raggiunge un obiettivo che prima richiedeva un programma di ricerca pluriennale.

## Riproducilo tu stesso

Non puoi eseguire AlphaProof Code — non esiste alcun prodotto, API, anteprima, lista d'attesa o prezzo. Quello che *puoi* fare è ricontrollare le prove, un esercizio davvero utile se stai valutando questa classe di affermazioni. Gli artefatti sono su [google-deepmind/code-verification](https://github.com/google-deepmind/code-verification) (Apache-2.0 per il codice di Google; `third_party/libsignal/` resta AGPL-3.0-only).

<PromptCard title="Ricontrolla le prove Lean pubblicate (Linux, diverse ore, 15–34 GiB di RAM)">
{`# Toolchain pins are exact — the generated Lean depends on precise rustc output
# Lean 4 via elan, pinned to leanprover/lean4:v4.34.0
# Rust 1.98.1 exactly, targets aarch64-unknown-linux-{gnu,musl}
# plus protoc, LLVM ld.lld 22.1.8, Zig 0.16.0

git clone https://github.com/google-deepmind/code-verification
cd code-verification

lake exe cache get
ulimit -S -s 524288
LAKE_RESTORE_ARTIFACTS=true lake build

# Rebuild the verified binary from stock rustc and confirm it matches the pin
./scripts/cli-elf-stock --stdbin --build
./scripts/cli-elf-stock --verify-pin
lake build CliElfLib
lake script run checkCliElfOwner

# Tune threads to RAM: roughly one thread per 4 GiB free
# export LEAN_NUM_THREADS=4`}
</PromptCard>

Lo strumento di replay `comparator` è **solo per Linux** — isola le build in sandbox con `landrun`/Landlock. E ciò che vale davvero la pena leggere non sono i 6,5M di righe; sono le ~18.000 righe di specifica fidata, perché quella è la parte che nessuna macchina ha verificato per te.

La metà trasferibile è la disciplina di revisione. Puoi eseguire la stessa forma avversariale contro una specifica in qualsiasi linguaggio:

<PromptCard title="Revisione avversariale della specifica — eseguila contro la tua specifica, i tuoi test o i tuoi criteri di accettazione">
{`You are a skeptical reviewer. Here is a specification that a system claims to satisfy.
Your job is NOT to confirm it. Your job is to find the gap between what it states
and what a reader will believe it states.

<specification>
{paste the spec, property test, or acceptance criteria}
</specification>

Answer in five numbered sections, concretely and with no hedging:

1. VACUITY. Is there a trivial model that satisfies every clause? Describe a system
   that passes this spec and is obviously useless or insecure.
2. SCOPE. List every behaviour a reader would ASSUME is covered that is not actually
   stated. Be specific about concurrency, failure paths, resource limits and timing.
3. ASSUMPTIONS. Enumerate what is assumed rather than established, including anything
   hooked, mocked, stubbed or specified by contract instead of verified.
4. MUTATION TEST. Propose three concrete bugs that this spec would NOT reject.
   For each, say exactly which clause fails to bite and why.
5. SCALE. Identify any bound, budget or quantifier that becomes vacuous or
   unenforceable as inputs, sessions or message counts grow. Give the threshold.

Do not suggest improvements. Report only what is missing or unenforceable.`}
</PromptCard>

## Vocabolario

<Flashcards title="Verifica formale con l'AI: i termini che servono" cards={[
  {front: "Trusted computing base (TCB)", back: "La parte di una verifica a cui devi credere perché nulla la controlla. Qui: ~26.000 righe di specifica più semantica AArch64, contratti degli hook, assunzioni sulle primitive e script di build. NON i 6,5M di righe di prova, e NON il compilatore Rust."},
  {front: "Divario di specifica", back: "Una prova mostra che il codice corrisponde a una specifica. Se la specifica è sbagliata o incompleta, la prova resta valida e la garanzia resta senza valore. Il motivo per cui 26.000 righe contano più di 6,5 milioni."},
  {front: "Modello simbolico (Dolev–Yao)", back: "Modello d'attaccante in cui la crittografia è idealizzata — hash e KDF non collidono mai e non si possono invertire — e l'attaccante controlla la rete. Utile per trovare difetti di logica del protocollo. Non dice nulla sulla durezza computazionale."},
  {front: "Modello computazionale", back: "L'attaccante è un algoritmo limitato; il risultato è un limite concreto sul suo vantaggio sotto assunzioni dichiarate (Gap-DH, non falsificabilità di XEdDSA, resistenza alle collisioni di Kyber1024, sicurezza PRF di HKDF/HMAC). Più forte, e il limite può diventare vacuo su larga scala."},
  {front: "comparator", back: "Il gate che verifica che l'enunciato di un teorema e ogni definizione da cui dipende transitivamente siano identici byte per byte a una copia tenuta fuori portata su cui nessun agente può scrivere. Impedisce a un agente di indebolire l'obiettivo rispetto a cui viene valutato. Solo Linux (Landlock)."},
  {front: "Gatekeeper", back: "Il ruolo che accetta una prova solo se il kernel di Lean la verifica, sono stati usati solo assiomi standard (propext, Quot.sound, Classical.choice) e comparator passa."},
  {front: "Critico", back: "Il ruolo che approva gli emendamenti alla specifica. Richiede necessità dimostrata, nessun indebolimento della sicurezza e un diff piccolo — e non vede mai i tentativi di prova, quindi non può essere convinto ad allentare una proprietà."},
  {front: "sorry (Lean)", back: "Il segnaposto di Lean che ammette un obiettivo non dimostrato. Una prova che lo contiene è incompleta. Dieci obblighi di iniezione di bug in questo repository restano stub esentati con sorry — per questo leggere il repository vale più che leggere il blog."},
  {front: "Hook / contratto", back: "Una routine esterna specificata anziché verificata. Qui sono 37, più 18 panic extern. Se una routine reale viola il proprio contratto modellato, l'intera garanzia decade."},
  {front: "Limite vacuo", back: "Un limite di sicurezza il cui valore supera 1, rendendolo vero ma privo di significato. Qui, raggiunto a circa 25.000 messaggi in una singola sessione se quasi ogni messaggio avvia una nuova epoca."}
]} />

## Come leggere la prossima affermazione di questo tipo

Ce ne saranno altre, e la maggior parte sarà più debole. Sei domande, in ordine di quanto ti dicono:

1. **Cosa c'è nella base fidata, e quante righe è?** Se nessuno pubblica questo numero, non c'è alcun risultato da valutare. «6,5 milioni di righe di prova» è marketing; «26.000 righe che devi leggere» è l'affermazione.
2. **Qual era esattamente il soggetto?** Un binario, un albero di sorgenti, un modulo, una funzione? Quale versione? Confrontala con l'ultimo rilascio del progetto — se la versione verificata è indietro di diversi rilasci, dillo.
3. **Quali proprietà, enunciate come teoremi?** «Sicuro» non è una proprietà. Forward secrecy, resistenza a KCI e terminazione normale lo sono. Esigi la colonna «non coperto» e controlla in particolare le affermazioni su tempo costante, concorrenza e multi-parte, che sono le tre più spesso assenti in silenzio.
4. **La specifica è stata testata, non solo soddisfatta?** Cerca mutation testing, teoremi di non-vacuità e soddisfacibilità, e confutazioni di bug storici. Una specifica che nulla può far fallire è una specifica che non dimostra nulla.
5. **Il dimostratore poteva toccare la specifica?** Se non c'è una copia tenuta fuori portata né un confronto meccanico dell'enunciato *e delle sue dipendenze*, presumi che i pali della porta siano stati spostati.
6. **Gli artefatti sono pubblici e le avvertenze verificabili?** Le vere debolezze di questo risultato — il riorientamento in sospeso, i branch non uniti, gli stub `sorry` — sono conoscibili solo perché il repository è stato pubblicato. Tratta una prova non pubblicata come un'affermazione non verificata.

<Quiz questions={[
  {
    q: "Perché il compilatore Rust NON fa parte della trusted computing base di AlphaProof Code?",
    options: [
      "Perché gli agenti hanno verificato rustc separatamente come prerequisito",
      "Perché i teoremi riguardano il binario AArch64 compilato, quindi la semantica di Rust non viene mai considerata",
      "Perché il sistema di tipi di Rust garantisce già la sicurezza della memoria",
      "Perché le prove sono state verificate da Lean, che è scritto in un altro linguaggio"
    ],
    answer: 1,
    explain: "I crate sono compilati da rustc standard in un ELF AArch64 e i teoremi riguardano quel binario, interpretato da una semantica Lean che copre 467 istruzioni e 31 syscall. Il paper afferma chiaramente che il compilatore Rust non è fidato. Il costo è che la garanzia si aggancia a quella singola build — cambia un flag o aggiorna rustc e il teorema non dice nulla sul risultato."
  },
  {
    q: "Il progetto non ha trovato nuovi bug in libsignal. Cosa ti dice?",
    options: [
      "Che la verifica non è riuscita a dimostrare nulla di utile",
      "Che libsignal è ora dimostrabilmente privo di bug di sicurezza",
      "Poco di per sé — trovare bug non era l'obiettivo; due bug già corretti sono stati reintrodotti per testare se la specifica li avrebbe intercettati",
      "Che gli agenti non erano abbastanza capaci da trovare difetti reali"
    ],
    answer: 2,
    explain: "I due bug ('weak state' e 'small subgroup') erano difetti reali, già corretti, scoperti da ricerca umana precedente e deliberatamente reintrodotti come mutation testing della specifica. Questo risponde a 'questa specifica avrebbe morso?' — non a 'il codice è privo di bug?'. Nota l'avvertenza del repository stesso: il riorientamento di quelle confutazioni sul teorema finale del titolo è ancora in sospeso."
  },
  {
    q: "Quale numero misura meglio quanto dovresti fidarti di questo risultato?",
    options: [
      "6,5 milioni di righe di prova Lean verificata dalla macchina",
      "467 istruzioni AArch64 coperte dalla semantica formale",
      "Circa 26.000 righe di specifica fidata e semantica della macchina",
      "40–80 agenti in esecuzione per 24–72 ore per campagna"
    ],
    answer: 2,
    explain: "Le prove sono non fidate per costruzione — le verifica il kernel di Lean e il gate permette solo tre assiomi standard, quindi una prova sbagliata non supera il typecheck. La specifica è la parte che nessuna macchina verifica, e il paper dice esplicitamente che un difetto al suo interno indebolirebbe la garanzia. È lì che vivono le ~26.000 righe, ed è lì che un essere umano deve ancora leggere."
  },
  {
    q: "Quale di queste cose ha dimostrato AlphaProof Code su Signal?",
    options: [
      "Che le implementazioni crittografiche di libsignal girano in tempo costante",
      "Forward secrecy, post-compromise security, autenticazione dell'handshake e resistenza a KCI per il percorso di sessione uno-a-uno",
      "Che le app Android e iOS di Signal sono sicure",
      "Che la messaggistica di gruppo resiste a un membro compromesso"
    ],
    answer: 1,
    explain: "Dieci teoremi simbolici più un limite computazionale, che coprono solo init/send/recv del percorso uno-a-uno di libsignal-protocol v0.105.4 in un harness CLI costruito ad hoc. Non c'è alcuna affermazione su timing o canali laterali; la messaggistica di gruppo e più di due parti sono esplicitamente escluse; e il risultato riguarda la loro build di libsignal-cli, non le app distribuite di Signal."
  },
  {
    q: "Cosa impedisce a un agente dimostratore di indebolire la specifica finché la sua prova non riesce?",
    options: [
      "Gli agenti ricevono nel system prompt l'istruzione di non modificare la specifica",
      "Un essere umano rivede ogni prova prima che venga committata",
      "La specifica sta in una directory tenuta fuori portata su cui nessun agente può scrivere, e comparator confronta byte per byte l'enunciato più ogni dipendenza transitiva con essa",
      "Lean si rifiuta di fare il typecheck di un enunciato di teorema modificato"
    ],
    answer: 2,
    explain: "Le istruzioni non sono un controllo, e Lean farà volentieri il typecheck di un teorema più debole con lo stesso nome — che è esattamente la trappola. La risposta meccanica è la copia tenuta fuori portata più comparator che verifica che l'enunciato E le sue dipendenze transitive siano identici, con gli emendamenti instradati a un critico che esige necessità dimostrata e non vede mai i tentativi di prova."
  }
]} />

<Callout type="takeaways" items={[
  "AlphaProof Code condivide il nome con l'AlphaProof del 2024 e quasi nient'altro: niente RL, niente AlphaZero, niente tree search. Sono agenti LLM che scrivono Lean contro un kernel solido — un progetto molto più copiabile del self-play.",
  "Il numero del titolo è quello sbagliato. 6,5M di righe di prova sono non fidate per costruzione; ~26.000 righe di specifica sono ciò che un essere umano deve leggere e a cui deve credere. Chiedi sempre prima quel numero.",
  "Dimostrare proprietà del binario ELF tiene rustc fuori dalla base fidata — e fissa la garanzia a una sola build. La versione verificata, v0.105.4, era già indietro di quattro rilasci il giorno dell'annuncio.",
  "L'ambito è molto più stretto di «Signal è verificato»: solo init/send/recv uno-a-uno, primitive agganciate tramite contratto, nessuna affermazione di tempo costante, niente concorrenza, niente gruppi, niente keygen, non le app distribuite.",
  "Il limite computazionale diventa vacuo a circa 25.000 messaggi in una singola sessione quando quasi ogni messaggio avvia una nuova epoca. Cita la soglia con la sua condizione attaccata.",
  "Copia l'architettura, non il titolo: una directory di specifica tenuta fuori portata, un comparator che confronta l'enunciato e tutte le sue dipendenze, un critico cieco per gli emendamenti e una allowlist enumerata di assiomi. Quel pattern si generalizza a qualsiasi controllo che un agente potrebbe altrimenti modificare.",
  "Cinque persone, quattro settimane, 40–80 agenti su una macchina, e nessun autore ha scritto codice di prova — contro i ~20 anni-persona di seL4. La verifica non è diventata economica; è diventata raggiungibile con un budget da sprint."
]} />

<VerifyNote lastVerified="2026-11-11" source="https://google-deepmind.github.io/code-verification/">
Conteggi di righe, dimensione del team, la cifra delle quattro settimane, le attribuzioni dei modelli, la soglia di vacuità e la discussione sulla base fidata provengono dall'edizione HTML del paper. Gli elenchi di ambito e proprietà provengono dalla sua Tabella 1 e dalle sezioni sulle limitazioni. I pin della toolchain, l'allowlist di assiomi, i tempi di build e le avvertenze sul riorientamento in sospeso provengono dal [repository degli artefatti](https://github.com/google-deepmind/code-verification) e dal suo `docs/PAPER_MAP.md`. La cifra di revisione umana «solo l'uno per cento del codebase» compare solo nel [post del blog di DeepMind](https://deepmind.google/blog/introducing-alphaproof-code/) e non è ribadita nel paper — trattala come un'affermazione del blog. Le versioni cambiano: `libsignal` v0.107.0 è uscita il 10 novembre 2026, quindi la v0.105.4 verificata resta sempre più indietro nel tempo. Il framework in sé non è disponibile all'uso; se questo cambia, questa pagina è superata.
</VerifyNote>

## Fonti e approfondimenti

- [Introducing AlphaProof Code — Google DeepMind](https://deepmind.google/blog/introducing-alphaproof-code/) — l'annuncio: l'inquadramento delle quattro settimane, «powered by Gemini Carbon», l'affermazione sui bug reintrodotti, la cifra dell'uno per cento di revisione umana e lo sguardo al futuro verso firmware di dispositivi medici e software per la rete elettrica
- [AlphaProof Code: Verifying Signal's Security at the Machine-Code Level](https://google-deepmind.github.io/code-verification/) — il paper in HTML completo. Fonte per i quattro componenti, i sette ruoli degli agenti, la cifra 40–80 agenti / 24–72 ore, la ripartizione dei conteggi di righe, la divisione coperto/non coperto della Tabella 1, l'ambito della semantica AArch64 (467 istruzioni, 31 syscall, 7.578 righe), la discussione sulla base fidata inclusa «il compilatore Rust *non* è fidato» e la soglia di vacuità
- [Edizione PDF del paper](https://deepmind.google/documents/36/Formal_Verification_of_Signal_4.pdf) — stesso contenuto, in forma citabile
- [google-deepmind/code-verification](https://github.com/google-deepmind/code-verification) — gli artefatti Lean: `Computational/`, `Symbolic/`, `LibsignalBinary/`, `arm64-semantics/`, `comparator/`. Apache-2.0 con `third_party/libsignal/` AGPL-3.0-only; «not an official Google product»; rientra nell'OSS VRP di Google
- [docs/PAPER_MAP.md](https://raw.githubusercontent.com/google-deepmind/code-verification/main/docs/PAPER_MAP.md) — la mappa paper-repository, e il documento più onesto dell'insieme: i 37 hook e i 18 panic extern, il riorientamento in sospeso `T-12(d)`, il corollario ROM condizionale e i limiti rigidi sugli input del modello simbolico
- [Symbolic/BugInjection/README.md](https://raw.githubusercontent.com/google-deepmind/code-verification/main/Symbolic/BugInjection/README.md) — i due bug reintrodotti con i rispettivi commit di correzione upstream
- [signalapp/libsignal](https://github.com/signalapp/libsignal) — la libreria reale e il suo elenco di crate, che mostra come solo `libsignal-protocol` più `spqr` fossero nell'ambito. Le [Release](https://github.com/signalapp/libsignal/releases) confermano la v0.105.4 (22 ott 2026) e la linea v0.106.x / v0.107.0 che è seguita
- [leanprover/comparator](https://github.com/leanprover/comparator) — lo strumento di diff della specifica tenuta fuori portata, isolato con Landlock
- [leanprover/lean4](https://github.com/leanprover/lean4) — il kernel che è la vera ancora di fiducia; questo lavoro fissa la v4.34.0
- [AlphaProof (2024): AI solves IMO problems at silver-medal level](https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/) — l'*altro* AlphaProof: RL più AlphaZero, 28/42 alle IMO 2024, metodologia pubblicata su [Nature](https://www.nature.com/articles/s41586-025-09833-y) nel novembre 2025
- [Introducing CodeMender](https://deepmind.google/blog/introducing-codemender-an-ai-agent-for-code-security/) — l'agente lato riparazione con cui il blog lo affianca
- [Discussione su Hacker News, 10 novembre 2026](https://news.ycombinator.com/item?id=50439193) — 643 punti, 185 commenti. L'obiezione «zero bug trovati?», la critica a strati del «fidatevi di noi», la corretta osservazione che la garanzia vale bit per bit per un solo binario e l'aritmetica di scalabilità di seL4
- Correlati su AILmanac: [Il collo di bottiglia della verifica](/docs/frontiers/the-verification-bottleneck) · [Reward hacking negli agenti di coding](/docs/frontiers/reward-hacking-in-coding-agents) · [Il divario tra capacità e affidabilità](/docs/frontiers/the-capability-reliability-gap) · [Revisionare codice di terze parti](/docs/security/reviewing-third-party-code)

## Prossimi passi

- [Il collo di bottiglia della verifica](/docs/frontiers/the-verification-bottleneck) — il vincolo a cui questo risultato mira: perché fidarsi del codice, non scriverlo, è ciò che limita un team che usa molto l'AI
- [Reward hacking negli agenti di coding](/docs/frontiers/reward-hacking-in-coding-agents) — la stessa modalità di fallimento senza il gatekeeper: cosa succede quando l'agente *può* modificare ciò che lo valuta
- [Code Erosion](/docs/frontiers/code-erosion-slopcodebench) — l'altro estremo, quello empirico: cosa fanno gli agenti al codice funzionante quando nessuna macchina ne verifica il risultato
