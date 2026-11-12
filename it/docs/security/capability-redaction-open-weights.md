# Capability Redaction: cosa ha davvero comprato il taglio cyber di Kimi K3.1 Pro

> Source: https://derob98.github.io/ailmanac/it/docs/security/capability-redaction-open-weights · AILmanac (CC BY 4.0) · last verified 2026-10-26

Moonshot ha rimosso i dati cyber da due fasi di addestramento di Kimi K3.1 Pro e ha pubblicato il prezzo: il successo negli exploit è sceso dal 90,5% all'81,0%. Lo stesso salto di generazione l'aveva fatto salire dal 33,3%. Quindi la redazione ha annullato 9,5 punti di un guadagno di 47,7, ha lasciato il modello sopra un concorrente open-weight non redatto ed è stata misurata su un benchmark che nessuno fuori da Moonshot può eseguire. L'aritmetica, la norma sull'export che sta dietro, la corsa alla pubblicazione che le sue esenzioni creano e una checklist per leggere la prossima release redatta.

<LevelBadge level="advanced" />

<Callout type="objectives" items={["Fare l'aritmetica che i titoli hanno saltato: la redazione è costata 9,5 punti, e la generazione in cui è uscita ne aveva aggiunti 47,7 — quindi circa quattro quinti della capacità di sfruttamento del modello derivano dall'essere un modello di coding generale migliore", "Capire il meccanismo che rende debole la rimozione mirata dei dati: la spiegazione di Moonshot stessa è che l'abilità di debugging a lungo orizzonte si generalizza allo sfruttamento, cioè la capacità non è mai stata localizzata nei dati rimossi", "Vedere che la redazione ha fatto scendere Kimi esattamente di un gradino — dietro un concorrente open-weight che nessuno ha redatto", "Conoscere le tre soglie dell'Announcement No. 48 cinese che sottopongono un modello al controllo sull'export, e che il solo numero di parametri è una di esse", "Individuare l'orologio che le esenzioni creano: i pesi già pubblici sono esenti, quindi la norma premia chi pubblica prima anziché dopo", "Riconoscere l'asimmetria di verifica — xdev-bench-hard è interno e non pubblicato, quindi né il 90,5% né l'81,0% sono riproducibili da chi è fuori dal laboratorio", "Porre l'unica domanda a cui nessuno ha risposto, e l'unica che decide se una redazione è durevole: il fine-tuning la rimette a posto?", "Applicare una checklist di otto punti alla prossima release open-weight che dichiara una riduzione di sicurezza, prima di costruire un threat model su quella dichiarazione"]} />

Il **23–24 ottobre 2026** Moonshot AI ha rilasciato **Kimi K3.1 Pro** e ha fatto una cosa che nessun laboratorio open-weight di frontiera aveva mai fatto: ha pubblicato il prezzo, in punti di benchmark, di rendere deliberatamente il proprio modello peggiore in una cosa.

Prima del rilascio open-weight, Moonshot ha identificato e rimosso i dati legati alla cyber da **due** fasi di addestramento — il corpus di mid-training e gli ambienti di reinforcement learning — mantenendo i compiti di coding generale di cui il modello ha bisogno per essere utile. Poi ha riportato quanto è costato su `xdev-bench-hard`, il suo insieme interno di compiti di scoperta e sfruttamento di vulnerabilità curati da esperti e costruiti su codice sorgente reale:

| Modello / checkpoint | `xdev-bench-hard` (pass@3) |
|---|---|
| Checkpoint di K3.1 Pro **senza** le misure di riduzione del rischio | **90,5%** |
| **Kimi K3.1 Pro come rilasciato** | **81,0%** |
| DeepSeek-V4.1-Flash | 85,7% |
| GLM-5.3 | 57,1% |
| Kimi K3 (la generazione precedente) | 33,3% |

Leggi quella tabella due volte, perché quasi tutti gli articoli che ne parlano si sono fermati alle prime due righe. Ci sono tre cose che meritano una pagina.

1. **La redazione ha comprato 9,5 punti. La generazione in cui è uscita ne aveva comprati 47,7.** K3 risolveva il 33,3% di questi compiti; il checkpoint K3.1 Pro senza restrizioni ne risolveva il 90,5%. Rimuovere i dati cyber ha annullato circa il **17%** di quel guadagno e ha lasciato intatto l'altro 83%. Qualunque cosa renda K3.1 Pro bravo a trovare e sfruttare bug, per lo più non sono i dati che Moonshot ha tolto.
2. **Non ha cambiato la classifica nel modo in cui la cornice lascia intendere.** All'81,0% il modello rilasciato sta *sopra* GLM-5.3 e *sotto* DeepSeek-V4.1-Flash all'85,7% — un modello open-weight il cui editore non ha fatto nessun filtraggio del genere. Se il tuo threat model è "cosa può scaricare un avversario", la redazione ha fatto scendere Kimi esattamente di un gradino, dietro un modello che nessuno ha redatto.
3. **Il numero esiste per una norma, non per una classifica.** Il **16 ottobre 2026** — una settimana prima del lancio — i ministeri cinesi del commercio e della scienza hanno fatto entrare in vigore un catalogo di controllo sull'export rivisto, che arriva a modelli proprio di questa dimensione. L'81,0% è una divulgazione prodotta per una conversazione di conformità.

L'obiettivo dichiarato di Moonshot è la versione onesta di tutto questo: puntano a **non rilasciare pesi aperti che estendano la frontiera assoluta della capacità cyber**, con il ragionamento che diffondere gradualmente la capacità nei sistemi aperti renda il software più sicuro nel complesso. È una posizione difendibile. È anche un obiettivo *relativo*, e la tabella è l'aspetto che un obiettivo relativo assume quando qualcuno ne pubblica la misura.

<VerifyNote lastVerified="2026-10-26" source="Primary: Moonshot's Kimi K3.1 Pro tech blog (kimi.ai/blog/kimi-k3-1-pro) for the two-stage data removal, the xdev-bench-hard pass@3 figures for K3.1 Pro (81.0%), the unrestricted checkpoint (90.5%), DeepSeek-V4.1-Flash (85.7%), GLM-5.3 (57.1%) and K3 (33.3%), the 'absolute frontier of cyber capability' rationale, the 1M context window, the Kimi Hallu Bench Hard figures (8.3% vs 23.4%) and the 4 November 2026 open-weight date. Architecture (2.8T total / 104B active, 16 of 896 experts) and API pricing are from secondary technical coverage, not the blog section fetched here — treat them as reported. China's Announcement No. 48: effective 16 October 2026, 23 AI technology areas, the 10^26 FLOPs / 2T-parameter / global-top-ten thresholds, the autonomous-malware total ban, the vulnerability-tooling restriction, and the API / public-domain / open-source exemptions are from reporting on the draft catalogue (the-decoder, TechTimes, Sheppard Mullin); the comment period closing 15 November 2026 and the naming of Kimi K3 (2.8T) and Qwen3.8-Max (2.4T) as above-threshold examples are from that reporting, not from a translation of the text itself. The 'GPT-5.6 Sol at 100%' comparison circulating in coverage is from implicator.ai and did not appear in the blog section retrieved here — do not cite it as Moonshot's figure. Everything about whether fine-tuning restores the removed capability is unresolved: no source consulted makes a claim either way. Benchmark positions and weight availability will move; the arithmetic in the first table is the durable part." />

## Perché la rimozione mirata è debole, con le parole del laboratorio

La frase più utile pubblicata da Moonshot non riguarda i dati. È l'osservazione che **le capacità più forti di coding generale e di debugging a lungo orizzonte si generalizzano ai compiti cyber anche dopo la rimozione mirata dei dati**.

È un'affermazione su dove vive la capacità, e spiega i 9,5 punti. Trovare un bug sfruttabile in un sorgente sconosciuto e concatenare un exploit funzionante è, meccanicamente, lo stesso ciclo del debugging: leggere codice che non hai scritto, costruire un modello delle sue invarianti, ipotizzare una violazione, metterla alla prova, conservare lo stato su molti passaggi, riprovare. Un laboratorio può cancellare un corpus di write-up di exploit. Non può cancellare "è bravo a ragionare su codice sconosciuto su lunghi orizzonti" senza cancellare il prodotto.

Per questo la critica indipendente coglie nel segno. La versione più tagliente, dal sito di analisi Extrapolator, è che la mitigazione cyber sia l'**affermazione più incerta** della release, perché il confine di ciò che conta come "legato alla cyber" è *sfocato per definizione* — la mitigazione funziona come un'**euristica di filtraggio, non come un confine di capacità fondato su principi**.

<Callout type="key" items={["Il filtraggio dei dati rimuove esempi. Non rimuove l'abilità generale che quegli esempi si trovavano a esercitare. Aspettati che la redazione sia più efficace contro capacità che richiedono conoscenze specifiche (un protocollo, una toolchain, una tecnica con un nome) e più debole contro capacità che sono un'abilità generale puntata su un bersaglio. La sicurezza offensiva è per lo più il secondo tipo."]} />

## L'asimmetria di verifica

`xdev-bench-hard` è il benchmark di Moonshot stessa, e **non è stato pubblicato**. Non è stata pubblicata per intero nemmeno la metodologia, né alcuna evidenza sulla possibilità di ripristinare la capacità rimossa.

Ne nasce una situazione insolita. L'affermazione "abbiamo ridotto la capacità cyber di 9,5 punti" è:

- **falsificabile in linea di principio** — una volta che i pesi sono pubblici, chiunque può misurare il successo negli exploit sul *proprio* benchmark;
- **infalsificabile così com'è formulata** — nessuno fuori dal laboratorio può eseguire `xdev-bench-hard`, quindi il confronto specifico tra il modello rilasciato e il checkpoint trattenuto non può essere verificato da nessuno, mai, perché il checkpoint senza restrizioni non viene distribuito.

Entrambe le metà contano. La seconda significa che il numero in prima pagina è un'affermazione del fornitore in senso stretto — l'unica delle cinque righe di quella tabella che nessun altro può riprodurre è quella su cui poggia l'intera storia. La prima significa che la *direzione* dell'affermazione è verificabile dal 4 novembre in poi, e lo sarà, da persone con i propri harness.

Se sei tentato di trattare un delta di sicurezza pubblicato come una misura, applica la stessa disciplina che useresti per qualsiasi benchmark di un fornitore — [come leggere un benchmark AI senza farsi ingannare](/docs/models/reading-ai-benchmarks) è la versione generale, e la trappola specifica qui è il braccio di confronto trattenuto.

## La norma dietro il numero

Il catalogo di export cinese rivisto è entrato in vigore il **16 ottobre 2026** (circolato come **Announcement No. 48**), proposto dai ministeri del commercio e della scienza, e copre **23 aree tecnologiche di intelligenza artificiale** tra grandi modelli, agenti, cluster di calcolo ed elaborazione dei dati. Le cronache lo descrivono con un periodo di consultazione aperto fino al **15 novembre 2026**.

Cosa fa scattare il controllo e quale trattamento si applica:

| Elemento | Dettaglio |
|---|---|
| **Soglie** (una qualsiasi) | **10^26 FLOPs** di calcolo di addestramento · **≥ 2 trilioni** di parametri · **prime dieci al mondo** per valutazioni pubbliche, prestazioni nei compiti, sicurezza o utilizzo |
| **Cosa viene controllato oltre la soglia** | Tecnologia core del modello: **pesi, checkpoint, codice sorgente, architettura, metodi di addestramento e di inferenza** |
| **Divieto totale** | Strumenti AI in grado di **scrivere o modificare autonomamente malware** per attaccare infrastrutture critiche, obiettivi militari o enti governativi |
| **Limitati, non vietati** | Strumenti per **trovare vulnerabilità del software** — nuovi limiti all'export, nessun divieto assoluto |
| **Limitati anche** | Modelli addestrati sui "dati importanti" della Cina e che li servono, con ristrette deroghe |
| **Esenti** | **Chiamate API**, app, siti web e SaaS · versioni leggere on-device · **rilasci open-source già pubblici** · ricerca accademica e articoli |
| **Corsia veloce** | La pubblicazione open-source ottiene la **licenza automatica con la semplice notifica** |

<Callout type="note" items={["Le fonti non concordano sullo stato giuridico del catalogo e questa pagina non lo risolve. TechTimes descrive l'Announcement No. 48 come entrato in vigore il 16 ottobre 2026 con un periodo di consultazione fino al 15 novembre, e analizza gli obblighi come già applicabili alle transazioni concluse dopo quella data. The Decoder descrive la stessa pubblicazione del 16 ottobre come una bozza di revisione che la Cina 'prevede' di adottare, aperta ai commenti. Entrambe le letture sono coerenti con una misura pubblicata che è al tempo stesso operativa e aperta a revisione, cosa comune in questo iter — ma se la distinzione conta per una decisione che stai prendendo, leggi la misura stessa o chiedi a un legale anziché fidarti di una delle due cornici qui riportate."]} />

Ora mettiamo Kimi accanto a questo. La copertura tecnica secondaria colloca K3.1 Pro a **2,8 trilioni di parametri totali con 104 miliardi attivi** (16 esperti su 896 per token) e una finestra di contesto di **1.048.576 token**, costruito su K3. Le cronache sul catalogo citano **Kimi K3 (2,8T)** e **Qwen3.8-Max (2,4T)** come esempi che superano senza dubbio la soglia dei parametri.

Quindi un modello da 2,8T sta sopra la linea per il solo numero di parametri, prima ancora che qualcuno discuta di classifiche — e la clausola più severa del catalogo è un divieto di export *totale* legato alla produzione autonoma di malware. In questo contesto, pubblicare una riduzione misurata del successo negli exploit, con l'abilità di coding generale intatta, è esattamente l'artefatto che una pratica in corsia veloce vuole.

<Callout type="note" items={["Questa pagina non sostiene che Moonshot abbia detto di aver fatto la redazione per l'Announcement No. 48; il blog la presenta come una scelta di sicurezza sulla frontiera open-weight, e le date distano una settimana. Possono essere vere entrambe. Ciò che non è in discussione è che un modello di questa dimensione rientri nell'ambito del catalogo, che la clausola più severa riguardi il malware autonomo e che gli strumenti per le vulnerabilità siano indicati come limitati anziché vietati."]} />

## Le esenzioni creano un orologio

Due deroghe, lette insieme, puntano nella stessa direzione:

- **I pesi già pubblici sono esenti.** Una volta che qualcosa è di pubblico dominio è, come l'ha messa un'analisi legale, fuori dalla portata di una norma nazionale sull'export.
- **La pubblicazione open-source ottiene la licenza automatica con la notifica.**

La conseguenza per chi pianifica una release è immediata: **il momento più economico per pubblicare pesi aperti è prima che la norma si irrigidisca, non dopo.** I pesi di Kimi K3.1 Pro erano attesi entro il **4 novembre 2026** — undici giorni prima della chiusura della consultazione sul catalogo.

La stessa asimmetria vale al contrario per chi *consuma* questi modelli. I pesi che hai già non sono controllati retroattivamente, e **l'accesso via API è del tutto esente**. Le cronache sui deployment esistenti sono coerenti: le organizzazioni che avevano già concesso in licenza o distribuito modelli cinesi coperti sono in gran parte non toccate, mentre **nuovi** accordi di licenza, deployment su server esteri o cambi di controllo conclusi dopo il 16 ottobre possono far scattare obblighi di registrazione o di licenza.

<Callout type="warning" items={["Una volta scaricati, i pesi non si possono richiamare. È l'intero disegno di un rilascio open-weight ed è anche il motivo per cui una redazione è una decisione irripetibile: non c'è un canale di patch, né revoca, né telemetria. Qualunque capacità venga distribuita il 4 novembre è la capacità che esisterà per sempre, nella forma in cui il primo fine-tuner la lascerà."]} />

## La domanda a cui nessuno ha risposto

Nulla di ciò che è stato pubblicato su K3.1 Pro dice se il **fine-tuning ripristina la capacità rimossa**. Questa omissione è la cosa più importante della release, per un motivo semplice: un'euristica di filtraggio applicata prima del rilascio non ha difese contro un buco a forma di filtro che viene riempito dopo il rilascio.

È anche la domanda a cui l'ecosistema open-weight sa già rispondere, e ha già risposto in modo sfavorevole. La pipeline di abliteration — una piccola e poco costosa modifica a posteriori che rimuove il comportamento di rifiuto da un modello aperto — è una dimostrazione funzionante e ampiamente diffusa che le modifiche *dopo il rilascio* possono annullare il lavoro di sicurezza *prima del rilascio*. Vedi [pesi aperti con backdoor](/docs/security/backdoored-open-weights) per come opera quella catena di fornitura e cosa significa per qualunque cosa scarichi da un model hub.

La distinzione da tenere a mente: rimuovere un **rifiuto** e ripristinare una **capacità** non sono lo stesso problema ingegneristico. L'abliteration agisce su un comportamento che il modello ha ancora; il ripristino di una capacità richiede che il modello reimpari qualcosa. Se 9,5 punti di successo negli exploit si reimparino a basso costo con un fine-tune modesto è una questione empirica che, al momento in cui scrivo, non ha una risposta pubblicata.

<Callout type="key" items={["Una redazione è durevole solo se è costoso invertirla. Una redazione pubblicata senza un costo di inversione pubblicato è un'affermazione incompiuta. Se ne stai valutando una, considera 'una LoRA economica può rimetterla a posto?' come la domanda portante — e nota che il laboratorio è la parte meglio posizionata per rispondere e quella con meno incentivi a farlo."]} />

## Cosa cambia davvero, per ruolo

**Se fai ricerca di sicurezza difensiva.** È il gruppo con un reale motivo di lamentela, e la reazione della community su r/LocalLLaMA è stata per lo più questa: un modello open-weight redatto è uno strumento locale peggiore per la ricerca sulle vulnerabilità, e nulla nelle deroghe ti aiuta. Ma guarda cosa è ancora disponibile prima di concludere di aver perso la capacità: **l'accesso via API è esente dal catalogo**, esistono alternative open-weight non redatte con punteggi comparabili o superiori (DeepSeek-V4.1-Flash all'85,7% è l'esempio nella tabella di Moonshot stessa) e sui modelli chiusi ci sono ora canali autorizzati — Anthropic gestisce un Cyber Verification Program ampliato che rende disponibili capacità cyber avanzate e classificatori di blocco ridotti a professionisti della sicurezza qualificati. Quello che hai perso è l'opzione locale *predefinita* di un fornitore, non la classe di capacità.

**Se distribuisci pesi aperti cinesi.** La tua esposizione riguarda le transazioni, non l'uso. I pesi già in tuo possesso sono esenti come materiale di pubblico dominio; il consumo di API e SaaS è esente; nuovi accordi di licenza, nuovi deployment all'estero e cambi di controllo dopo il 16 ottobre sono dove scattano gli obblighi. Se hai qualcosa del secondo tipo in corso, è una domanda per un legale, non per una pagina di documentazione — e nota che esiste un insieme simmetrico di restrizioni lato USA sugli stessi modelli, quindi "quali regole di quale parte si applicano" è raramente una sola domanda.

**Se scrivi threat model.** Aggiorna un numero e lascia stare la struttura. La struttura era già "un modello open-weight capace è scaricabile, e quindi la capacità è nel mondo"; l'aggiornamento è che il punteggio di exploit open-weight meglio documentato è appena passato dal 90,5% all'81,0% mentre un concorrente sta all'85,7%. Se la conclusione del tuo threat model cambia quando il successo negli exploit del modello aperto leader si sposta di 9,5 punti, era tarato troppo finemente fin dall'inizio.

## L'inquadratura di Vitalik Buterin, e perché è quella utile

La release ha ricevuto un sostegno insolitamente diretto dal cofondatore di Ethereum, e il suo argomento merita di essere separato dalla cornice che ne ha dato la stampa crypto.

Buterin ha sostenuto la scelta di lasciare fuori dall'addestramento le capacità cyber offensive avanzate, sulla base del fatto che i difensori hanno bisogno di più tempo per rendere il software resistente ad attacchi sempre più capaci, e ha offerto il principio generale che **discriminare i casi d'uso è molto meno grave che discriminare gli utenti**. Lo ha accompagnato con un avvertimento: se la prima ondata di rischio cyber da AI viene gestita male, la risposta probabile sono modelli blindati con accesso subordinato a verifiche KYC, sorveglianza pervasiva e stratificazione per credenziali d'identità e nazionalità. Alla domanda se altri laboratori costruiranno comunque la capacità, ha risposto che certo lo faranno.

Quest'ultima concessione è la forma onesta dell'intero dibattito. L'argomento a favore della capability redaction non è che impedisca qualcosa; la tabella di Moonshot stessa mostra che non lo fa, e chi la sostiene dice chiaramente che qualcun altro la costruirà. L'argomento è che **compra tempo, e che una restrizione sui casi d'uso è un prezzo più basso di una restrizione sugli utenti**. Se lo trovi convincente è un giudizio tuo. Quello che non devi fare è leggere l'81,0% come una garanzia di sicurezza — compreso, e soprattutto, se sei tu a scrivere la policy che lo cita.

## Leggere la prossima

Ce ne saranno altre. Ecco la checklist da eseguire prima che una riduzione di sicurezza pubblicata cambi qualcosa di ciò che fai.

<Steps items={[
  {title: "Trova la base di partenza, non il delta", body: "Una riduzione non significa nulla senza il numero da cui è partita e il numero ottenuto dalla generazione precedente. Moonshot li ha pubblicati tutti e tre, ed è per questo che l'aritmetica 9,5 contro 47,7 è possibile. Se una release ti dà solo 'ridotto del X%', non puoi distinguere una vera mitigazione da un arrotondamento su un salto di capacità."},
  {title: "Verifica se il benchmark è pubblicato", body: "Un benchmark interno rende il confronto irriproducibile in linea di principio, perché il checkpoint trattenuto non viene mai distribuito. Annotalo come affermazione del fornitore e cerca un harness indipendente che misuri la stessa classe di capacità."},
  {title: "Metti il modello redatto in classifica con i pari non redatti", body: "La domanda che pone un threat model è 'cosa è scaricabile', non 'cosa ha trattenuto questo fornitore'. Se un concorrente dello stesso livello ottiene un punteggio più alto senza alcun filtraggio, la redazione ha cambiato la postura di un fornitore e non la frontiera."},
  {title: "Chiediti dove vive la capacità", body: "Se è il laboratorio stesso a dire che l'abilità generale si generalizza al compito ristretto — come fa Moonshot — la redazione è un'euristica. Le capacità che richiedono conoscenze specifiche sono redigibili; quelle che sono un'abilità generale puntata su un bersaglio no."},
  {title: "Cerca un costo di inversione dichiarato", body: "Qualcuno ha misurato quanto costa un fine-tune per ripristinarla? Se nessuno l'ha fatto, la durabilità della mitigazione è ignota, e il riassunto onesto è 'ridotta al rilascio, ignota in seguito'."},
  {title: "Separa l'artefatto normativo dall'argomento di sicurezza", body: "Un numero pubblicato nello stesso mese di una norma che copre il modello svolge due compiti. Entrambi possono essere sinceri. Leggi tu le soglie — numero di parametri, FLOPs di addestramento, classifica — e verifica quale il modello supera."},
  {title: "Leggi la licenza e la model card quando arrivano i pesi, non il blog", body: "I post del blog prima del rilascio descrivono intenzioni. La licenza descrive cosa puoi fare, e la card descrive cosa è stato distribuito. Per K3.1 Pro i termini di licenza, i requisiti hardware e i formati di quantizzazione erano ancora tutti non pubblicati all'annuncio."},
  {title: "Registra l'affermazione con la sua data", body: "I delta di sicurezza pubblicati invecchiano male: un nuovo checkpoint, un fine-tune della community o una valutazione indipendente possono invalidarne uno in poche settimane. Qualunque cosa annoti, annota quando era vera."},
]} />

<PromptCard title="Registra un'affermazione di redazione in una forma che sopravviva alla prossima release">
{`Summarise this open-weight release as a capability-redaction record. Use only
what the sources support and mark anything missing as UNPUBLISHED — do not
estimate it.

Fields:
  model, publisher, announce_date, weights_date, params_total, params_active
  redaction: what data, which training stages, stated rationale
  benchmark: name, is_public (yes/no), metric (e.g. pass@3)
  score_redacted, score_unredacted_checkpoint, score_previous_generation
  peer_scores: same benchmark, same tier, no redaction
  derived: points_removed_by_redaction
  derived: points_added_by_the_generation (previous_gen -> unredacted)
  derived: share_of_gain_undone = points_removed / points_added
  reversal_cost: any published evidence that fine-tuning restores it
  licence, model_card_url, independent_eval_urls
  verified_on: <date>

Then answer one question in two sentences: does the redaction change what an
adversary can download today, or only what this publisher ships?`}
</PromptCard>

<PromptCard title="Controlla cosa ti consegna davvero un model hub, prima che i pesi contino">
{`# Resolve the repo and read its metadata — no download, public API.
REPO="moonshotai/Kimi-K3.1-Pro"   # confirm the real id from the announcement

curl -sf "https://huggingface.co/api/models/$REPO" \\
  | python3 -m json.tool \\
  || echo "404 — that id does not exist; find the canonical one first"

# The file list arrives in the same response, under "siblings".
# Three files answer 'what may I do, and what actually shipped':
#   LICENSE      — terms were unpublished at announcement
#   README.md    — the model card
#   config.json  — architecture as shipped, not as blogged
curl -sf "https://huggingface.co/api/models/$REPO" \\
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('license')); [print(s['rfilename']) for s in d.get('siblings',[])]"

# Fetch one small file without cloning the weights:
curl -sfL "https://huggingface.co/$REPO/raw/main/config.json"

# Then check the thing this page is actually about: derivatives.
# A redacted base with a popular 'uncensored' or 'restored' fine-tune
# listed against it is the signal that the redaction did not hold.
curl -sf "https://huggingface.co/api/models?search=k3.1&sort=downloads&limit=30" \\
  | python3 -c "import json,sys; [print(m['id']) for m in json.load(sys.stdin)]"`}
</PromptCard>

<Callout type="warning" items={["Gli id dei repository sui model hub non sono prevedibili dal nome di un prodotto, e questo non risultava al momento della scrittura. Prendi l'id canonico dall'annuncio dell'editore prima di scriverci uno script, e non leggere un 404 come prova che i pesi non siano stati rilasciati."]} />

## Un altro numero dalla stessa release, per calibrare

La cifra cyber ha avuto la copertura. Quella che toccherà più lettori è sull'altro lato del bilancio: su Kimi Hallu Bench Hard — di nuovo uno stress test interno di Moonshot, con gli strumenti abilitati — il **tasso di allucinazione a livello di affermazione è sceso dal 23,4% di K3 all'8,3% di K3.1 Pro**, una riduzione relativa del 65%, con Moonshot che precisa come i tassi dello stress test non riflettano l'uso tipico.

Entrambi i numeri vengono dallo stesso laboratorio, nello stesso giorno, su due benchmark interni non pubblicati. Uno è una riduzione che il laboratorio ha scelto e per cui vuole credito; l'altro è un miglioramento per cui il laboratorio vuole credito. Valutali con lo stesso metro: la cifra sulle allucinazioni è riproducibile da te esattamente quanto quella sugli exploit, cioè per nulla finché qualcuno non esegue un harness aperto sui pesi rilasciati.

<Callout type="takeaways" items={["Rimuovere i dati cyber da due fasi di addestramento è costato 9,5 punti di successo negli exploit (dal 90,5% all'81,0%) — a fronte di un guadagno di 47,7 punti che la stessa generazione aveva portato rispetto al 33,3% di K3. Circa quattro quinti della capacità sono sopravvissuti alla redazione.", "La spiegazione del laboratorio stesso è il perché: l'abilità di coding generale e di debugging a lungo orizzonte si generalizza allo sfruttamento. Non si può cancellare senza cancellare il prodotto, quindi il filtraggio mirato è un'euristica e non un confine di capacità.", "All'81,0% il modello rilasciato ottiene ancora un punteggio sopra GLM-5.3 (57,1%) e sotto DeepSeek-V4.1-Flash (85,7%), un modello open-weight senza alcun filtraggio simile. La redazione ha spostato la postura di un fornitore, non la frontiera scaricabile.", "xdev-bench-hard è interno e non pubblicato, e il checkpoint senza restrizioni non viene mai distribuito — quindi il confronto principale è l'unica riga della tabella che nessuno fuori da Moonshot potrà mai riprodurre.", "L'Announcement No. 48 cinese (in vigore dal 16 ottobre 2026, consultazione fino al 15 novembre) controlla pesi, checkpoint, codice sorgente e metodi di addestramento a una qualsiasi di tre soglie: 10^26 FLOPs di addestramento, 2T di parametri o un posto tra le prime dieci al mondo. Il solo numero di parametri basta, e Kimi K3 a 2,8T è citato come esempio.", "Il catalogo vieta del tutto gli strumenti di malware autonomo ma si limita a restringere quelli per trovare vulnerabilità — ed esenta l'accesso via API, il SaaS, le build on-device e tutto ciò che è già pubblico, con licenza automatica alla notifica per i rilasci open-source.", "Quelle esenzioni creano una corsa alla pubblicazione in una direzione e un'esposizione legata alle transazioni nell'altra: i pesi che già possiedi e le chiamate API sono esenti, mentre nuove licenze e deployment dopo il 16 ottobre no.", "Nessuno ha pubblicato se il fine-tuning ripristina la capacità rimossa. Finché qualcuno non lo fa, il riassunto onesto di qualsiasi redazione è 'ridotta al rilascio, ignota in seguito' — e la catena di fornitura dell'abliteration è la prova esistente che le modifiche dopo il rilascio battono il lavoro di sicurezza prima del rilascio.", "La difesa del taglio da parte di Buterin concede il punto che conta: altri laboratori costruiranno comunque la capacità. L'argomento è che la redazione compra tempo ai difensori e che restringere i casi d'uso è meglio che restringere gli utenti — non che impedisca qualcosa."]} />

<Flashcards title="Dieci termini per leggere una release redatta" cards={[
  {front: "Capability redaction", back: "Rimuovere deliberatamente i dati di addestramento di una classe di capacità prima di rilasciare un modello, così che i pesi pubblicati ottengano un punteggio più basso su quella capacità. Diverso da un rifiuto, che lascia intatta la capacità e rifiuta di usarla."},
  {front: "xdev-bench-hard", back: "Il benchmark interno e non pubblicato di Moonshot, fatto di compiti di scoperta e sfruttamento di vulnerabilità curati da esperti e costruiti su codice sorgente reale, valutato a pass@3. La fonte sia del 90,5% sia dell'81,0%, e riproducibile da nessuno fuori dal laboratorio."},
  {front: "pass@3", back: "Un compito conta come risolto se uno qualsiasi di tre tentativi riesce. Gonfia i numeri assoluti rispetto a pass@1 ed è la metrica riportata da Moonshot — quindi leggi l'81,0% come 'riesce entro tre tentativi', non 'riesce'."},
  {front: "Mid-training", back: "La fase tra pretraining e post-training in cui il modello riceve corpus mirati e di qualità superiore per sviluppare competenze specifiche. Una delle due fasi filtrate da Moonshot, l'altra essendo gli ambienti di reinforcement learning."},
  {front: "Euristica di filtraggio vs confine di capacità", back: "Un'euristica rimuove gli esempi che somigliano alla classe ristretta; un confine garantirebbe l'assenza della capacità. Poiché 'legato alla cyber' è sfocato per definizione, il filtraggio dei dati può essere al massimo la prima."},
  {front: "Announcement No. 48", back: "Il catalogo di controllo sull'export rivisto della Cina, in vigore dal 16 ottobre 2026, che copre 23 aree tecnologiche AI. Controlla pesi, checkpoint, codice sorgente e metodi di addestramento a 10^26 FLOPs, 2T parametri o un posto tra le prime dieci al mondo."},
  {front: "Esenzione di pubblico dominio", back: "La deroga che mette i pesi aperti già pubblicati fuori dalla norma sull'export. Rende un rilascio irreversibile in senso giuridico oltre che tecnico, e premia chi pubblica prima che una norma si irrigidisca."},
  {front: "Asimmetria di verifica", back: "Quando la direzione di un'affermazione di sicurezza è verificabile una volta distribuiti i pesi, ma la sua entità specifica non lo è mai, perché il braccio di confronto — qui il checkpoint senza restrizioni — è trattenuto."},
  {front: "Costo di inversione", back: "Cosa servirebbe per ripristinare con il fine-tuning una capacità redatta. Non pubblicato per K3.1 Pro, ed è la cifra che decide se una redazione è una mitigazione o un'istantanea del giorno del rilascio."},
  {front: "Abliteration", back: "Una modifica a posteriori e poco costosa dei pesi aperti che elimina il comportamento di rifiuto. La prova esistente che le modifiche dopo il rilascio possono annullare il lavoro di sicurezza prima del rilascio — anche se ripristinare una capacità è un problema più difficile che rimuovere un rifiuto."},
]} />

<Quiz title="Verifica te stesso" questions={[
  {
    q: "Moonshot ha riportato il 90,5% per un checkpoint senza restrizioni, l'81,0% per K3.1 Pro rilasciato e il 33,3% per la generazione precedente K3. Qual è la lettura più difendibile?",
    options: [
      "La redazione ha rimosso la maggior parte della capacità di sfruttamento del modello",
      "La redazione ha annullato circa un sesto di un guadagno generazionale di 47,7 punti, lasciandone intatta la grande maggioranza",
      "K3.1 Pro è meno capace nello sfruttamento di quanto lo fosse K3",
      "I numeri sono incoerenti e almeno uno deve essere sbagliato"
    ],
    answer: 1,
    explain: "Dal 33,3% al 90,5% è un guadagno di 57,2 punti per il checkpoint senza restrizioni; il modello rilasciato all'81,0% ne conserva 47,7. La redazione è costata 9,5 — circa il 17% del guadagno. Il modello rilasciato ha comunque circa 2,4 volte il punteggio di K3."
  },
  {
    q: "Quale singolo fatto spiega meglio perché rimuovere i dati di addestramento specifici sulla cyber ha spostato il punteggio solo di 9,5 punti?",
    options: [
      "Il corpus rimosso era piccolo rispetto al mix di pretraining",
      "Il punteggio pass@3 maschera perdite di capacità che pass@1 rivelerebbe",
      "L'abilità di coding generale e di debugging a lungo orizzonte si generalizza allo sfruttamento, quindi la capacità non era localizzata nei dati rimossi",
      "La fase di reinforcement learning non è stata in realtà filtrata"
    ],
    answer: 2,
    explain: "È la spiegazione dichiarata da Moonshot stessa, ed è il meccanismo che rende debole in generale la rimozione mirata: lo sfruttamento è il ciclo di debugging puntato su un obiettivo diverso, e un laboratorio non può cancellarlo senza cancellare il prodotto."
  },
  {
    q: "Secondo l'Announcement No. 48, quale di questi basta da solo a far rientrare nell'ambito i pesi di un modello?",
    options: [
      "Avere 2 trilioni o più di parametri",
      "Essere addestrato fuori dalla Cina",
      "Essere offerto tramite un'API pubblica",
      "Avere una licenza pubblicata che consente l'uso commerciale"
    ],
    answer: 0,
    explain: "Le soglie sono disgiuntive: 10^26 FLOPs di addestramento, 2T o più parametri, o un posto tra le prime dieci al mondo per valutazioni, prestazioni nei compiti, sicurezza o utilizzo. Le cronache citano Kimi K3 a 2,8T e Qwen3.8-Max a 2,4T come esempi sopra soglia. L'accesso via API e SaaS è esente, non è un fattore scatenante."
  },
  {
    q: "Stai aggiornando un threat model dopo questa release. Quale conclusione segue dalla tabella pubblicata?",
    options: [
      "La frontiera scaricabile della capacità di exploit è scesa di 9,5 punti",
      "I modelli open-weight non possono più eseguire sfruttamento di vulnerabilità con un tasso significativo",
      "La frontiera scaricabile è invariata, perché un pari open-weight non redatto ottiene un punteggio più alto del modello redatto",
      "Non si può concludere nulla, perché il benchmark è interno"
    ],
    answer: 2,
    explain: "DeepSeek-V4.1-Flash ottiene l'85,7% sullo stesso benchmark senza un filtraggio paragonabile. La redazione di Moonshot ha cambiato ciò che Moonshot distribuisce; non ha abbassato il tetto di ciò che un avversario può scaricare. Il benchmark interno indebolisce l'affermazione sull'entità, ma queste righe sono tutte misurate sullo stesso harness, quindi l'ordinamento resta informativo."
  },
  {
    q: "Qual è il motivo più forte per descrivere la riduzione di 9,5 punti come 'ridotta al rilascio, ignota in seguito'?",
    options: [
      "I pesi aperti vengono spesso riquantizzati, il che degrada i punteggi dei benchmark",
      "Nessuna fonte ha pubblicato quanto costa ripristinare la capacità rimossa con il fine-tuning",
      "I pesi non erano disponibili su un model hub all'annuncio",
      "I benchmark derivano man mano che gli harness vengono aggiornati"
    ],
    answer: 1,
    explain: "Un'euristica di filtraggio prima del rilascio non ha difese contro un fine-tune dopo il rilascio, e il costo di inversione è semplicemente non pubblicato. L'abliteration dimostra già che modifiche a posteriori economiche possono annullare il lavoro di sicurezza pre-rilascio, anche se ripristinare una capacità è più difficile che rimuovere un rifiuto."
  },
  {
    q: "Un ricercatore di sicurezza difensiva dice che la redazione gli ha tolto la possibilità di fare ricerca sulle vulnerabilità con modelli capaci. Qual è la correzione accurata?",
    options: [
      "Non è cambiato nulla, perché la redazione non ha avuto alcun effetto",
      "Ha perso l'opzione locale predefinita di un fornitore; l'accesso via API è esente dal catalogo, i pari open-weight non redatti ottengono punteggi più alti ed esistono programmi dei fornitori per professionisti della sicurezza verificati",
      "Il catalogo di export vieta del tutto gli strumenti per trovare vulnerabilità, quindi ha ragione",
      "Dovrebbe aspettare che il checkpoint senza restrizioni venga rilasciato"
    ],
    answer: 1,
    explain: "Il catalogo vieta del tutto gli strumenti di malware autonomo ma limita soltanto quelli per trovare vulnerabilità, ed esenta l'accesso via API, SaaS e on-device. DeepSeek-V4.1-Flash è un pari open-weight non redatto all'85,7%, e il Cyber Verification Program ampliato di Anthropic offre classificatori di blocco ridotti a professionisti qualificati. Il checkpoint senza restrizioni, esplicitamente, non viene distribuito."
  }
]} />

## Fonti e approfondimenti

- **Moonshot AI** — *Kimi K3.1 Pro Tech Blog: Advancing Open Intelligence*: https://www.kimi.ai/blog/kimi-k3-1-pro — la fonte primaria. La rimozione dei dati in due fasi, la tabella pass@3 di `xdev-bench-hard` (81,0% / 90,5% / 85,7% / 57,1% / 33,3%), la motivazione sulla "frontiera assoluta della capacità cyber", le cifre di Kimi Hallu Bench Hard e la data dei pesi del 4 novembre 2026 vengono tutte da qui.
- **Implicator.ai** — *Kimi K3.1 Pro Hacking Cut Rests on Unpublished Moonshot Test*: https://www.implicator.ai/kimi-k3-1-pro-hacking-cut-unpublished-test/ — il resoconto più chiaro di ciò che Moonshot ha e non ha pubblicato, incluso il fatto che il benchmark è interno e che non si afferma nulla sul ripristino tramite fine-tuning. Anche la fonte della critica di Extrapolator citata qui e di un confronto "GPT-5.6 Sol at 100%" che questa pagina attribuisce a loro e non a Moonshot.
- **The Next Web** — *Moonshot releases Kimi K3.1 Pro and says it cut its hacking skills*: https://thenextweb.com/news/moonshot-kimi-k3-1-pro-open-weight-cyber — cronaca indipendente, inclusa l'esplicita avvertenza che le cifre dei benchmark sono di Moonshot stessa e non verificate, e il contesto di Terminal-Bench 4.0 (65,7% contro il 66,4% di Claude Opus 5.5).
- **DataStudios** — *Moonshot AI Kimi K3.1 Pro: open-weight, 1M context, cyber safeguards*: https://www.datastudios.org/post/moonshot-ai-kimi-k3-1-pro-open-weight-1m-context-cyber-safeguards — il dettaglio su specifiche e prezzi, e la nota che i termini di licenza, i requisiti hardware e i formati di quantizzazione erano non pubblicati all'annuncio.
- **The Decoder** — *China plans to tighten export controls on open-weight models and 23 key AI technologies*: https://the-decoder.com/china-plans-to-tighten-export-controls-on-open-weight-models-and-23-key-ai-technologies/ — l'ambito del catalogo, le tre soglie, il divieto del malware autonomo, la restrizione sugli strumenti per le vulnerabilità e l'elenco delle esenzioni.
- **TechTimes** — *China's New AI Export Controls Apply Now if You Licensed or Deployed Covered Chinese Models*: https://www.techtimes.com/articles/329196/20261019/chinas-new-ai-export-controls-apply-now-if-you-licensed-deployed-covered-chinese-models.htm — l'etichetta Announcement No. 48, la scadenza di consultazione del 15 novembre, la citazione di Kimi K3 e Qwen3.8-Max come esempi sopra soglia, e l'analisi dei deployment esistenti in chiave di transazione.
- **Sheppard Mullin** — *Choosing Between U.S. and Chinese AI Models: The Export Control Risks on Both Sides*: https://www.sheppard.com/insights/blogs/us-vs-chinese-ai-models-export-control-risks — il promemoria che i due regimi sono simmetrici, quindi "quali regole si applicano" è raramente una sola domanda.
- **crypto.news** — *Vitalik Buterin backs Kimi AI hacking limits, warns of KYC risks*: https://crypto.news/vitalik-buterin-kimi-ai-hacking-limits-kyc-risks/ — il principio "casi d'uso anziché utenti", l'avvertimento su KYC e sorveglianza, e la concessione che altri laboratori costruiranno comunque la capacità.
- **Anthropic** — *Cyber Verification Program*: https://support.claude.com/en/articles/14604842-cyber-verification-program — il canale autorizzato per professionisti della sicurezza verificati, ampliato il 6 ottobre 2026 in tre livelli (Defense Access, Red Team Access, Specialized Access) con classificatori di blocco ridotti e accesso a Opus 5.5, Sonnet 5.5 e Mythos 5.1. Controlla la pagina del programma per i requisiti correnti; i termini sono la parte che più probabilmente si è spostata.
- **Hugging Face** — pagina dell'organizzazione di Moonshot AI: https://huggingface.co/moonshotai — dove atterrano i pesi, e dove controllare licenza e model card anziché il blog.

## Avanti

- [Pesi aperti con backdoor](/docs/security/backdoored-open-weights) — l'altra metà di questa storia: come funzionano davvero le modifiche ai pesi aperti dopo il rilascio, e perché "ridotta al rilascio" non è lo stesso che "ridotta"
- [Kimi K3: il più grande modello open-weight del mondo](/docs/models/kimi-k3-open-weight-frontier) — la generazione da cui questo è post-addestrato, con l'architettura e i prezzi cache-hit che decidono se è economico
- [Distribuire Kimi K3 in locale con vLLM](/docs/models/kimi-k3-deploy-locally-vllm-dspark) — quanto costa davvero eseguire un modello open-weight da 2,8T, se pensi di scaricare i pesi del 4 novembre
- [Come leggere un benchmark AI senza farsi ingannare](/docs/models/reading-ai-benchmarks) — la disciplina generale per i numeri dichiarati dai fornitori, di cui un delta di sicurezza pubblicato ha bisogno quanto uno di capacità
