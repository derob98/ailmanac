# Erosione del codice: perché il tuo agente rompe ciò che ha già costruito

> Source: https://derob98.github.io/ailmanac/it/docs/frontiers/code-erosion-slopcodebench · AILmanac (CC BY 4.0) · last verified 2026-10-21

SlopCodeBench smette di chiedere se un agente sa risolvere un compito e chiede cosa succede quando la specifica cambia cinque volte. Le risposte sono scomode: nessun agente ha mai completato end-to-end un singolo problema, l'82-88% dei test falliti all'ultimo checkpoint sono regressioni e non il nuovo requisito, e nelle campagne di ottobre 2026 lo sforzo xhigh è costato 2,11-4,22 volte più di medium mentre Opus 5.5 superava MENO checkpoint con xhigh. In più il risultato che dovrebbe cambiare il modo in cui scrivi i prompt: una guida esplicita sulla qualità ha migliorato il primo commit e non ha fatto nulla contro il degrado.

<LevelBadge level="advanced" />

Quasi ogni benchmark di coding di cui hai letto pone la stessa domanda: *dato un compito, l'agente sa risolverlo?* Un prompt, una patch, un verdetto. È un'impostazione comoda e nasconde la modalità di fallimento che ti costa davvero denaro, perché il software reale non si scrive mai una volta sola. La specifica si muove. Estendi ciò che hai costruito la settimana scorsa. E la domanda interessante non è se l'agente sa scrivere la funzionalità: è **cosa fa al codice che già funzionava.**

[SlopCodeBench](https://www.scbench.ai) esiste per misurare esattamente questo, e i risultati sono peggiori di quanto suggerisca il dibattito. Nelle parole del paper: *"Software development is iterative, yet agentic coding benchmarks hide design issues through their single-shot setup."*

Due cose lo rendono degno di una pagina questa settimana. Primo, un report di campagna di terze parti, *"SlopCodeBench 10/2026 – Opus 5.5, Astra wins overall, xhigh considered harmful"*, ha raggiunto **260 punti e 101 commenti** su Hacker News il 15 ottobre 2026, dopo un post da 405 punti sullo stesso benchmark a luglio. Secondo, quasi nessuno cita i numeri che contano di più. Il titolo ha viaggiato; la statistica sulle regressioni, l'aritmetica del costo per superamento e l'inversione pulizia/correttezza no.

<Callout type="objectives" items={[
  "Spiegare cosa misura SlopCodeBench che i benchmark in stile SWE-bench non possono misurare per costruzione: il raffinamento iterativo della specifica, con i test di regressione portati avanti a ogni checkpoint",
  "Leggere correttamente le due percentuali di superamento: strict e core ordinano le stesse dieci campagne quasi al contrario, e quella che citi decide il vincitore",
  "Ricavare la statistica che i report seppelliscono: tra l'82% e l'88% dei test falliti all'ultimo checkpoint sono regressioni, non il nuovo requisito",
  "Prezzare lo sforzo onestamente: ogni campagna medium ha battuto ogni campagna xhigh sul costo per checkpoint superato, con uno scarto di 9,7x dalla migliore alla peggiore",
  "Tenere insieme due risultati senza battere ciglio: Opus 5.5 a xhigh ha scritto codice nettamente più pulito e ha superato meno checkpoint dello stesso modello a medium",
  "Applicare il risultato più operativo del paper: dire a un agente di scrivere codice pulito ha migliorato il suo primo commit fino a un terzo e non ha cambiato per niente la curva di degrado",
]} />

<VerifyNote lastVerified="2026-10-21" source="https://arxiv.org/abs/2603.24755">
Qui si usano due fonti separate con autori diversi, che non vanno mescolate. Il **benchmark e i risultati a livello di paper** (36 problemi, 196 checkpoint, i tassi di erosione del 77% / 75,5%, il confronto 2,3x / 2,0x con 473 repository reali) vengono da Orlanski et al., arXiv 2603.24755, inviato il 25 marzo 2026 e rivisto il 7 maggio 2026. I **numeri per modello** vengono dal report di campagna di HumanLayer dell'ottobre 2026: una serie di esecuzioni successiva e indipendente, di terze parti, esplicitamente **una sola esecuzione per ogni impostazione modello-sforzo**. Classifiche e versioni dei modelli si muovono; ricontrolla entrambe prima di citarle.
</VerifyNote>

## Cosa fa davvero il benchmark

L'unità di lavoro di SlopCodeBench non è un compito, è una **traiettoria**. All'agente viene dato un problema, scrive una soluzione, poi riceve un nuovo requisito e deve modificare il *proprio codice esistente*. Si ripete. Le specifiche evolvono in modi che forzano decisioni architetturali lasciando aperti i dettagli implementativi e, ed è il meccanismo che lo rende incisivo, **i test dei checkpoint precedenti vengono portati avanti**. Per superare un checkpoint devi soddisfare il nuovo requisito *e* mantenere funzionanti tutti i precedenti.

La scala, secondo il paper: **36 problemi** scomposti in **196 checkpoint** in totale, con **15 agenti di coding** valutati su famiglie di modelli aperti e chiusi.

Escono due metriche:

- **Strict pass**: tutti i test passano, inclusi tutti i test di regressione di ogni checkpoint precedente.
- **Core pass**: la soglia più morbida, che dà credito per aver soddisfatto il requisito corrente.

E il paper nomina le due modalità di degrado che tiene sotto osservazione. L'**erosione strutturale** è la complessità che si concentra: il codice che si impasta in pochi punti sovraccarichi. La **verbosità** è il codice ridondante che si moltiplica. Sono misurate, non sensazioni.

### Il risultato che dovrebbe essere il titolo

Dal paper: **nessun agente ha risolto completamente un problema end-to-end.** Né uno dei 15, né uno dei 36 problemi. Il migliore ha raggiunto il **14,8% dei checkpoint**.

L'erosione strutturale è aumentata nel **77% delle traiettorie**; la verbosità nel **75,5%**. Confrontato con un corpus di **473 repository open source**, il codice scritto dagli agenti ha mostrato una **verbosità 2,3 volte maggiore** e **2,0 volte più erosione**.

Quindi l'affermazione di base non è "gli agenti scrivono codice un po' più disordinato degli umani". È: in tre quarti delle traiettorie a lungo orizzonte, il codice peggiora strutturalmente man mano che l'agente ci lavora, e lo stato finale è eroso circa il doppio di ciò che consegnano gli umani.

## Le campagne di ottobre 2026

HumanLayer ha eseguito dieci campagne complete sul catalogo v1.0 fissato con il prompt `just-solve` di serie, seed 42, policy di superamento del runner `any-case`, in Docker con Python 3.12 e uv. Una esecuzione per ogni combinazione modello-sforzo.

| Campagna | Strict | Tasso strict | Tasso core | Costo stimato |
|---|---:|---:|---:|---:|
| GPT-6 Astra XHigh | 32/196 | 16,33% | 69,39% | $758.62 |
| GPT-6 SOL Medium | 30/196 | 15,31% | 67,86% | $245.69 |
| GPT-6 Astra Medium | 29/196 | 14,80% | 66,33% | $261.05 |
| GPT-6.1 SOL Medium | 29/196 | 14,80% | 65,82% | $178.51 |
| Opus 5.5 Medium | 28/196 | 14,29% | **73,98%** | $193.47 |
| GPT-5.6 SOL XHigh | 28/196 | 14,29% | 70,92% | $753.30 |
| Fable 5.1 XHigh | 26/196 | 13,27% | 72,45% | $1,550.07 |
| GPT-6 SOL XHigh | 26/196 | 13,27% | 68,37% | $517.32 |
| Opus 5.5 XHigh | 25/196 | 12,76% | 71,94% | $817.04 |
| GLM 5.3 XHigh | 24/196 | 12,24% | 66,33% | $365.13 |

Guarda prima la colonna strict. L'intero campo di frontiera cade tra il **12,24% e il 16,33%**. Lo scarto dal migliore al peggiore è di 8 checkpoint su 196. Chi ti dice che uno di questi modelli è nettamente migliore nella manutenzione a lungo orizzonte sta leggendo rumore, soprattutto con una sola esecuzione per cella.

### La classifica si ribalta a seconda della metrica che citi

È la parte da interiorizzare prima di citare qualsiasi cosa.

- **GPT-6 Astra XHigh** è **1º su strict** (16,33%) e **5º su core** (69,39%).
- **Opus 5.5 Medium** è **5º su strict** (14,29%) e **1º su core** (73,98%), il miglior tasso core della tabella.
- **GPT-6.1 SOL Medium** è a pari merito **4º su strict** (14,80%) e **ultimo su core** (65,82%).

Stesse dieci esecuzioni, stessi dati, e il podio si rimescola. Le due metriche misurano cose davvero diverse: il tasso core dice "quante volte ha fatto la cosa nuova", il tasso strict dice "quante volte ha fatto la cosa nuova *senza rompere le vecchie*". Un modello può essere bravo in una e mediocre nell'altra, e la maggior parte lo è.

Se ricordi una sola regola di questa pagina: **chiedi a quale percentuale di superamento si riferisce un numero su un agente di coding.** Lo scarto tra 14,29% e 73,98% per un solo modello su un solo dataset è tutto l'argomento.

## La statistica che nessuno cita: sono regressioni, non la nuova funzionalità

Il report pubblica una tabella dell'ultimo checkpoint con i casi di test falliti e, separatamente, quanti di essi erano fallimenti di regressione. Dividi una colonna per l'altra e la tesi del benchmark smette di essere una tesi.

| Campagna | Test falliti finali | Regressioni | Quota di regressioni |
|---|---:|---:|---:|
| Opus 5.5 Medium | 2.508 | 2.206 | **88,0%** |
| GPT-6 SOL Medium | 2.831 | 2.479 | 87,6% |
| GPT-6.1 SOL Medium | 2.757 | 2.404 | 87,2% |
| GPT-5.6 SOL XHigh | 2.727 | 2.376 | 87,1% |
| GPT-6 Astra Medium | 1.747 | 1.516 | 86,8% |
| Opus 5.5 XHigh | 2.446 | 2.123 | 86,8% |
| Fable 5.1 XHigh | 2.463 | 2.126 | 86,3% |
| GLM 5.3 XHigh | 2.748 | 2.311 | 84,1% |
| GPT-6 SOL XHigh | 1.651 | 1.366 | 82,7% |
| GPT-6 Astra XHigh | 1.435 | 1.178 | **82,1%** |

La colonna della quota di regressioni è aritmetica sui conteggi pubblicati dal report, non una cifra che esso dichiara. Su tutte e dieci le campagne sta tra l'**82,1% e l'88,0%**, notevolmente stretta per dieci configurazioni diverse su quattro famiglie di modelli.

Rileggilo: quando un agente di coding di frontiera fallisce alla fine di un lungo compito iterativo, circa **sei fallimenti su sette sono cose che prima funzionavano.** Solo circa uno su sette è la funzionalità che gli era stata effettivamente chiesta.

<Callout type="warning" items={[
  "Questo è il numero che dovrebbe cambiare il tuo harness, non la scelta del modello. Una differenza di 4-6 punti percentuali nel tasso strict tra modelli di frontiera sta dentro il rumore di una singola esecuzione. Una quota di regressioni attorno all'85% è una proprietà strutturale di come gli agenti modificano il codice, ed è la cosa su cui la tua CI, la tua politica di conservazione dei test e il tuo processo di review possono davvero agire.",
  "Spiega anche perché gli agenti sembrano meglio di come si misurano. Chiedi una funzionalità, la vedi atterrare, la rilasci. La regressione è tre checkpoint più avanti e nessuno ha rieseguito i vecchi test.",
]} />

## "xhigh considered harmful"

Ora il risultato che ha portato il post in prima pagina. Tre modelli sono stati eseguiti sia a sforzo medium sia xhigh:

| Modello | Strict: Medium → XHigh | Core: Medium → XHigh | Moltiplicatore di costo |
|---|---:|---:|---:|
| Opus 5.5 | 28 → **25** | 145 → 141 | **4,22×** |
| GPT-6 SOL | 30 → **26** | 133 → 134 | 2,11× |
| GPT-6 Astra | 29 → **32** | 130 → 136 | 2,91× |

Due modelli su tre sono andati **peggio** sui superamenti strict a sforzo più alto, costando tra 2,11× e 4,22× in più. Nelle parole dell'autore: *"opus 5.5 did BETTER on medium effort than on xhigh."*

A loro considerevole merito, rifiutano di venderlo troppo. Il report afferma che il risultato *"doesn't prove that more reasoning hurts coding"*, solo che *"higher effort was not a reliable way to buy more strict passes."* E il limite metodologico è dichiarato con chiarezza: *"I ran each model and effort setting once... These single runs don't isolate effort as the cause."*

Quel limite è reale e va tenuto presente. Uno scarto di 3 checkpoint su 196 sta ampiamente dentro la varianza attesa tra due esecuzioni della stessa configurazione. **Ciò che sopravvive è l'affermazione debole: lo sforzo non è una manopola che compra in modo affidabile correttezza nel lavoro a lungo orizzonte.** L'affermazione forte, che xhigh danneggi attivamente il coding, non è stabilita da questi dati, e l'autore non la fa.

### Dove le prove diventano molto più solide: il costo per superamento

La tabella dello sforzo è rumorosa. L'economia no, perché qui le differenze di costo sono abbastanza grandi da oscurare il rumore. Dividendo il costo stimato per i superamenti strict:

| Campagna | Sforzo | $ per superamento strict |
|---|---|---:|
| GPT-6.1 SOL Medium | Medium | **$6.16** |
| Opus 5.5 Medium | Medium | $6.91 |
| GPT-6 SOL Medium | Medium | $8.19 |
| GPT-6 Astra Medium | Medium | $9.00 |
| GLM 5.3 XHigh | XHigh | $15.21 |
| GPT-6 SOL XHigh | XHigh | $19.90 |
| GPT-6 Astra XHigh | XHigh | $23.71 |
| GPT-5.6 SOL XHigh | XHigh | $26.90 |
| Opus 5.5 XHigh | XHigh | $32.68 |
| Fable 5.1 XHigh | XHigh | **$59.62** |

È la mia aritmetica sulle cifre pubblicate dal report, e lo schema è assoluto: **ogni campagna medium costa meno per checkpoint superato di ogni campagna xhigh.** Nessuna sovrapposizione. Lo scarto dal migliore al peggiore è di **9,7×**.

Il confronto più netto dell'intero dataset: **Fable 5.1 a xhigh ha speso $1,550.07 per superare 26 checkpoint. Opus 5.5 a medium ha speso $193.47 per superarne 28.** Otto volte il denaro, per due superamenti in meno.

<Callout type="tip" items={[
  "La versione operativa: nel coding iterativo a lungo orizzonte, parti da medium e fai dimostrare a xhigh il suo valore sul TUO carico di lavoro prima di pagarlo. I default già pendono in questa direzione: Opus 5.5 e Haiku 5.5 usano medium per default, e medium è lo sforzo di partenza consigliato per il coding agentico su Sonnet 5.5.",
  "Se fai un confronto, esegui ogni configurazione più di una volta. Una singola campagna alla risoluzione di questo benchmark non distingue un effetto dello sforzo da 3 checkpoint da un lancio di moneta da 3 checkpoint.",
]} />

## Codice più pulito che funziona meno spesso

Ecco il risultato davvero difficile da spiegare e la cosa più interessante del report.

Opus 5.5 a xhigh ha superato **meno** checkpoint strict di Opus 5.5 a medium, e ha scritto codice nettamente **migliore** secondo le metriche di slop. Su 28 problemi abbinati, la copertura di slop è stata del **77,75%** per xhigh contro il **94,25%** per medium (92,90% dopo il filtraggio); l'autore descrive l'output di xhigh come *"close to ~5x cleaner."*

Una nota su quella cifra, perché conta per come la citi: ~5× è la caratterizzazione dell'autore della sua metrica composita di slop. **Non** è ricavabile dalle due percentuali di copertura qui sopra, che differiscono di circa 16 punti, non di 5×. Cita le percentuali di copertura se ti serve qualcosa di verificabile; tratta "~5× più pulito" come un'affermazione direzionale su una metrica di cui non hai visto l'interno.

In ogni caso la direzione è coerente e l'implicazione è scomoda: **più sforzo di ragionamento ha comprato codice che sembra migliore e funziona peggio.** Lo sforzo sembra comprare in parte gusto architetturale (refactoring, astrazione, ordine), e quelle modifiche sono proprio quelle che rompono il codice che già funzionava. Mettere in ordine è un rischio di regressione. Un modello che lascia in pace la cosa brutta ma funzionante ottiene un punteggio migliore su un benchmark che ricorda cosa passava prima.

Vale la pena ripetere la speculazione del report sullo scarto tra tassi di superamento e metriche del codice: i modelli più recenti potrebbero generare nuovi schemi di slop che i linter esistenti non rilevano ancora. È un buon promemoria che un report di lint pulito sull'output di un agente è una prova sul tuo linter tanto quanto sul tuo codice.

### Due stili architetturali opposti, visibili nelle metriche

Un ultimo dettaglio, facile da perdere e silenziosamente rivelatore. Complessità ciclomatica media su funzioni e metodi:

- **Fable 5.1**: 8.967 callable, complessità media **3,57**
- **GPT-6 SOL Medium**: 1.083 callable, complessità media **11,70**

Problemi comparabili, e una **differenza di 8,3× nel numero di funzioni scritte.** Fable scompone aggressivamente in tante unità semplici; GPT-6 SOL ne scrive molte meno e molto più dense. Ordinali solo per complessità media e Fable vince di 3×. Ordinali per numero di callable e la storia si inverte: tutte quelle piccole funzioni sono anche dove vive la verbosità.

Nessuno dei due numeri significa qualcosa da solo. È la lezione generale sulle metriche di qualità del codice applicate all'output degli agenti: ognuna è aggirabile da uno stile architetturale, quindi leggile in coppia.

## Cosa fare in concreto

Il paper ha testato l'intervento ovvio e il risultato merita di essere più noto: **una guida esplicita sulla qualità ha ridotto i problemi iniziali fino a un terzo, e non ha influito sugli schemi di degrado.**

Dire all'agente di scrivere codice pulito funziona, una volta. Migliora il primo commit. Non ferma il marciume. L'erosione è una proprietà del *processo iterativo di modifica*, non dell'intenzione iniziale dell'agente, quindi le istruzioni rivolte all'intenzione non la toccano.

Il che sposta la correzione in un posto meno comodo del tuo prompt:

<Steps items={[
  {title: "Conserva e riesegui ogni vecchio test, ogni volta", body: "Una quota di regressioni dell'82-88% è visibile solo se i vecchi test girano ancora. Se il tuo ciclo agente valida il requisito corrente e nient'altro, stai misurando il tasso core e rilasciando fallimenti strict. È il cambiamento a più alta leva disponibile."},
  {title: "Destina la review a cancellazioni e refactoring, non alle aggiunte", body: "L'inversione pulizia/correttezza dice che le modifiche pericolose sono quelle ordinate. I diff che riorganizzano codice funzionante meritano più attenzione dei diff che aggiungono nuovo codice accanto: l'opposto della maggior parte degli istinti di review."},
  {title: "Parti da sforzo medium e fai guadagnare a xhigh il suo moltiplicatore", body: "Ogni campagna medium ha battuto ogni campagna xhigh sul costo per checkpoint superato, senza sovrapposizioni. Tratta lo sforzo alto come un'ipotesi da verificare sul tuo carico di lavoro, non come un'impostazione di qualità da lasciare accesa."},
  {title: "Misura l'erosione lungo la traiettoria, non la qualità alla fine", body: "Traccia complessità e volume a ogni checkpoint di un compito lungo. Un singolo punteggio di lint sullo stato finale non distingue il codice che è sempre stato così da quello che peggiora a ogni iterazione, e il trend è ciò che predice la prossima regressione."},
  {title: "Riancora la specifica invece di estendere il contesto", body: "L'erosione si accumula tra checkpoint che ereditano ciascuno la deriva del precedente. Riformulare periodicamente l'intera specifica corrente rispetto al codice corrente, invece di aggiungere il prossimo delta, attacca direttamente il meccanismo."},
]} />

<Quiz title="Verifica la comprensione" questions={[
  {
    q: "Cosa misura SlopCodeBench che i benchmark di coding single-shot non possono misurare per costruzione?",
    options: [
      "La velocità grezza di generazione del codice in token al secondo",
      "Se un agente riesce a mantenere funzionante il proprio lavoro precedente mentre soddisfa nuovi requisiti lungo molti checkpoint",
      "Quanto bene gli agenti leggono codebase esistenti scritte da umani",
      "Le prestazioni degli agenti su problemi di programmazione competitiva"
    ],
    answer: 1,
    explain: "L'unità è una traiettoria, non un compito: l'agente estende ripetutamente il proprio codice mentre la specifica evolve, e i test dei checkpoint precedenti vengono portati avanti. L'impostazione del paper è che i setup single-shot 'hide design issues': un benchmark che non chiede mai all'agente di rivisitare il proprio codice non può osservare l'erosione."
  },
  {
    q: "Sulle dieci campagne di ottobre 2026, circa quale quota dei test falliti all'ultimo checkpoint erano regressioni e non il nuovo requisito?",
    options: [
      "Circa il 20-25%",
      "Circa il 50%",
      "Tra l'82% e l'88%",
      "Praticamente nessuna: i fallimenti erano quasi tutti sul nuovo requisito"
    ],
    answer: 2,
    explain: "Dividendo i fallimenti di regressione per il totale dei casi di test falliti si ottiene dall'82,1% all'88,0% su tutte e dieci le campagne, una fascia sorprendentemente stretta su quattro famiglie di modelli. Circa sei fallimenti su sette sono cose che prima funzionavano, ed è per questo che la conservazione dei test conta più della scelta del modello."
  },
  {
    q: "GPT-6 Astra XHigh è 1º per tasso strict e 5º per core. Opus 5.5 Medium è 5º per strict e 1º per core. Cosa dovresti concludere?",
    options: [
      "Una delle due misurazioni deve essere errata",
      "Le metriche misurano cose diverse (core chiede se il nuovo requisito è stato soddisfatto, strict se è stato soddisfatto senza rompere nulla), quindi la metrica che citi sceglie il vincitore",
      "Il tasso core è una metrica strettamente migliore e il tasso strict va ignorato",
      "I modelli sono identici per capacità"
    ],
    answer: 1,
    explain: "Entrambi i numeri sono reali e ordinano il campo quasi al contrario. Core dà credito per aver soddisfatto il requisito corrente; strict richiede in più che passi ogni test di regressione precedente. Chiedi sempre a quale percentuale di superamento si riferisce un'affermazione su un agente di coding: per Opus 5.5 Medium le due differiscono tra 14,29% e 73,98%."
  },
  {
    q: "Quale affermazione sullo sforzo è effettivamente sostenuta dai dati di ottobre 2026?",
    options: [
      "Un maggiore sforzo di ragionamento degrada in modo affidabile le prestazioni di coding",
      "Un maggiore sforzo non è stato un modo affidabile per comprare più superamenti strict, ed è costato 2,11-4,22x di più, ma singole esecuzioni non possono isolare lo sforzo come causa",
      "XHigh ha migliorato i superamenti strict su tutti e tre i modelli testati",
      "Lo sforzo non ha avuto alcun effetto misurabile sul costo"
    ],
    answer: 1,
    explain: "Due modelli su tre hanno ottenuto risultati peggiori su strict a xhigh, ma l'autore nota esplicitamente una sola esecuzione per impostazione e che questo 'doesn't prove that more reasoning hurts coding'. Uno scarto di 3 checkpoint su 196 sta dentro la plausibile variabilità tra esecuzioni. L'affermazione debole sopravvive; quella forte non è stabilita."
  },
  {
    q: "Opus 5.5 a xhigh ha scritto codice misurabilmente più pulito che a medium, eppure ha superato meno checkpoint strict. Qual è la lettura più plausibile?",
    options: [
      "Le metriche di slop non hanno significato",
      "Lo sforzo maggiore si spende in parte in refactoring e riordino di codice funzionante, e quelle modifiche sono proprio quelle che causano regressioni",
      "Il codice più pulito ha sempre più probabilità di far fallire i test",
      "La metrica strict penalizza le funzioni corte"
    ],
    answer: 1,
    explain: "Lo sforzo sembra comprare gusto architetturale, e su un benchmark che ricorda cosa passava prima, riorganizzare codice funzionante è un rischio di regressione. Un modello che lascia in pace un'implementazione brutta ma funzionante ottiene un punteggio migliore. Inverte anche il solito istinto di review: i diff ordinati meritano più attenzione di quelli additivi."
  },
  {
    q: "Il paper ha trovato che una guida esplicita sulla qualità ha ridotto i problemi iniziali fino a un terzo. Cosa NON ha fatto?",
    options: [
      "Non ha ridotto l'uso di token",
      "Non ha cambiato gli schemi di degrado lungo la traiettoria",
      "Non ha funzionato sui modelli chiusi",
      "Non ha migliorato il primo commit"
    ],
    answer: 1,
    explain: "La guida ha migliorato il punto di partenza e ha lasciato intatta la curva di erosione. L'erosione è una proprietà della modifica iterativa e non dell'intenzione iniziale, quindi le istruzioni nel prompt rivolte all'intenzione non la toccano, il che sposta la correzione su conservazione dei test, mirare la review e misurazione a ogni checkpoint."
  }
]} />

<Callout type="takeaways" items={[
  "SlopCodeBench misura traiettorie, non compiti: l'agente estende il proprio codice mentre la specifica evolve, e ogni test precedente viene portato avanti. Nessun agente ha risolto completamente un singolo problema end-to-end; il campo di frontiera si concentra tra 12,24% e 16,33% strict.",
  "I tassi strict e core ordinano le stesse dieci campagne quasi al contrario. Opus 5.5 Medium è 14,29% strict e 73,98% core. Chiedi sempre a quale dei due si riferisce un numero.",
  "L'82-88% dei test falliti all'ultimo checkpoint sono regressioni, non il nuovo requisito: sei fallimenti su sette sono cose che prima funzionavano. È un problema di harness, non di scelta del modello.",
  "Ogni campagna medium ha battuto ogni campagna xhigh sul costo per superamento strict, senza sovrapposizioni e con uno scarto di 9,7x. Fable 5.1 XHigh: $1,550 per 26 superamenti; Opus 5.5 Medium: $193 per 28.",
  "Lo sforzo compra in parte ordine, e riordinare codice funzionante causa regressioni. Opus 5.5 XHigh ha scritto codice più pulito e ha superato meno checkpoint: rivedi i refactoring con più attenzione delle aggiunte.",
  "Dire all'agente di scrivere codice pulito ha migliorato il primo commit fino a un terzo e non ha fatto nulla alla curva di degrado. L'erosione vive nel processo di modifica, quindi si corregge con test conservati e misurazione a ogni checkpoint.",
  "Leggi le metriche di qualità del codice in coppia: 8.967 callable a complessità media 3,57 contro 1.083 a 11,70 sono due stili architetturali, e ciascuna metrica da sola li ordina al contrario.",
]} />

## Fonti e approfondimenti

- [SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks (arXiv 2603.24755)](https://arxiv.org/abs/2603.24755) — Orlanski, Roy, Yun, Shin, Gu, Ge, Adila, Roberts, Sala, Albarghouthi; inviato il 25 marzo 2026, rivisto il 7 maggio 2026. Fonte per il disegno del benchmark, 36 problemi / 196 checkpoint / 15 agenti, le definizioni di erosione strutturale e verbosità, i tassi di traiettoria del 77% e 75,5%, il confronto 2,3× / 2,0× con 473 repository open source, il risultato "no agent fully solved any problem" e il risultato sulla guida alla qualità.
- [SprocketLab/slop-code-bench](https://github.com/SprocketLab/slop-code-bench) — l'implementazione del benchmark (262 stelle). Catalogo dei problemi, runner e codice delle metriche.
- [scbench.ai](https://www.scbench.ai) — classifiche e sito del progetto.
- [SlopCodeBench 10/2026 — Opus 5.5, Astra wins overall, xhigh considered harmful](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-new-models-on-slop-code-bench.md) — il report di campagna di HumanLayer di ottobre 2026. Fonte per tutte e dieci le righe di campagna, la tabella sforzo medium-vs-xhigh e i moltiplicatori di costo, i conteggi di fallimenti e regressioni all'ultimo checkpoint, le cifre di copertura di slop e complessità, la caratterizzazione "~5x cleaner", la metodologia (catalogo v1.0, prompt `just-solve`, seed 42, policy `any-case`, Docker/Python 3.12/uv) e il limite della singola esecuzione. Le colonne costo-per-superamento-strict e quota-di-regressioni di questa pagina sono aritmetica mia sui suoi numeri pubblicati.
- [Benchmarking Opus 5 on SlopCodeBench](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/benchmarking-opus-5-on-slop-code-bench.md) — il report precedente di luglio 2026 dallo stesso repository (2,8k stelle), che ha raggiunto 405 punti su Hacker News.
- [Discussione su Hacker News, 15 ottobre 2026](https://news.ycombinator.com/item?id=50108717) — 260 punti, 101 commenti sul report di ottobre.
- Compagni AILmanac: [Effort tuning: 5 levels, model defaults, and the cache trap](/docs/api/effort-tuning) · [Reward hacking in coding agents](/docs/frontiers/reward-hacking-in-coding-agents) · [Reading AI benchmarks](/docs/models/reading-ai-benchmarks) · [The capability-reliability gap](/docs/frontiers/the-capability-reliability-gap)

## Prossimi passi

- [Effort tuning: 5 levels, model defaults, and the cache trap](/docs/api/effort-tuning) — la meccanica dietro la manopola che questa pagina prezza: dove va davvero il campo, quali modelli accettano `xhigh` e `max`, e l'invalidazione della cache che rende costosi i cambi di sforzo a metà conversazione
- [Reward hacking: why your agent edits the test instead of the code](/docs/frontiers/reward-hacking-in-coding-agents) — l'altro modo in cui un test che passa smette di significare ciò che pensi, e il naturale compagno di una quota di regressioni dell'85%
- [The verification bottleneck](/docs/frontiers/the-verification-bottleneck) — la ragione strutturale per cui test conservati e review mirata sono la leva qui, piuttosto che un modello migliore
