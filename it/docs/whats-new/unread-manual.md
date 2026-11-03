# Claude non ha mai visto il 68% della documentazione di Claude Code

> Source: https://derob98.github.io/ailmanac/it/docs/whats-new/unread-manual · AILmanac (CC BY 4.0) · last verified 2026-10-15

Abbiamo riavvolto 15 mesi della documentazione ufficiale di Claude Code, una settimana alla volta. Il 68% di ciò che dice oggi è stato scritto dopo giugno 2026, la data di cutoff dell'addestramento di ogni modello Claude attuale. Ecco cosa si è perso ciascun modello, e un plugin che glielo dice.

import {UnreadHeadline, ModelBars, LearnedSlider, CohortChart, SurvivalChart, NewIdentifiers} from '@site/src/components/DocsDecay';

<VerifyNote lastVerified="2026-10-15" source="https://platform.claude.com/docs/en/about-claude/models/overview">
I cutoff di addestramento provengono dalla pagina di ciascun modello nella documentazione della Claude Platform. La cronologia della documentazione di Claude Code proviene da un mirror della community che copia le pagine ufficiali più volte al giorno. I numeri sono un'istantanea del 15 ottobre 2026; lo script che li produce è linkato qui sotto, quindi chiunque può rieseguirlo.
</VerifyNote>

Ogni modello Claude ha imparato Claude Code dalla documentazione com'era al suo cutoff di addestramento. Poi la documentazione ha continuato a muoversi. Ne abbiamo riavvolto la storia, una settimana alla volta, per misurare quanto le due cose si siano allontanate.

<UnreadHeadline />

I modelli più recenti, Fable 5.1, Opus 5.5, Sonnet 5.5 e Haiku 5.5, hanno un knowledge cutoff affidabile a giugno 2026. Tra la fine di giugno e il 15 ottobre la documentazione è passata da 107 a 164 pagine, e la maggior parte di ciò che dice oggi è stata scritta in quei tre mesi e mezzo. Se si conta in modo più rigoroso, per formulazione esatta anziché per fatti, la quota sale al 72%. Se si escludono gli esempi di codice, è il 70%. Comunque lo si conti, Claude non ha mai visto la maggior parte del proprio manuale.

## Cosa non ha mai visto ciascun modello

Più vecchio è il cutoff, meno della documentazione di oggi un modello può aver letto. Tutti questi modelli sono ancora disponibili tramite la Claude API.

<ModelBars />

Claude Haiku 4.5, con cutoff a febbraio 2025, è precedente a quasi tutto: Claude Code è uscito come research preview proprio quel mese, e quasi tutta la documentazione di oggi è venuta dopo.

## Scegli la settimana in cui hai imparato Claude Code

Lo stesso calcolo vale per le persone. Sposta il cursore sulla settimana in cui hai letto la documentazione, o sulla data del tutorial che stai seguendo.

<LearnedSlider />

## La documentazione viene riscritta, non solo ampliata

La crescita spiega la maggior parte del divario, ma non tutto. Anche le pagine vengono riscritte. Ogni banda qui sotto è il testo scritto in un trimestre; una banda si assottiglia man mano che le sue frasi vengono eliminate o modificate.

<CohortChart />

A luglio 2025 la documentazione aveva 29 pagine. Oggi ne ha 164, e 21 volte più frasi e righe di codice. Della documentazione com'era a luglio 2025, il 30,5% è ancora in piedi; il resto è stato eliminato, o riscritto con un numero, un flag o un nome diverso. Persino la documentazione di giugno 2026, quella che i modelli più recenti hanno visto, ha perso il 26,9% dei suoi fatti in meno di quattro mesi.

## Quanto dura una frase

Segui ogni frase dalla settimana in cui compare a quella in cui scompare, e metà di esse è sparita o riformulata entro 196 giorni. Se una riformulazione conta solo quando cambia un numero, un flag, un percorso o un nome, metà dei fatti è sparita entro 266 giorni: circa nove mesi.

<SurvivalChart />

## Cosa il tuo modello non ha mai sentito nominare

Sono gli identificatori presenti oggi nelle tabelle di riferimento che non c'erano al cutoff di un modello: flag della CLI, slash command, eventi degli hook e variabili d'ambiente. Chiedi a Claude di uno di questi e potrà solo tirare a indovinare.

<NewIdentifiers />

"Documentato dal" non significa "rilasciato dal": alcuni di questi esistevano prima e sono arrivati nella documentazione solo dopo. In ogni caso, il modello non aveva alcuna pagina da cui impararli.

## Dai a Claude l'elenco

Il [plugin since-cutoff](https://github.com/derob98/ailmanac/tree/main/plugins/since-cutoff) mette questi elenchi davanti a Claude. All'avvio della sessione, un hook legge quale modello è in esecuzione e aggiunge al suo contesto una breve nota: i flag, i comandi e gli eventi degli hook documentati dopo il cutoff di quel modello, e un'istruzione di controllare la documentazione prima di fidarsi della memoria o di dire che una funzionalità non esiste.

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install since-cutoff@ailmanac
```

L'hook è poche righe di shell POSIX: niente Node, niente rete, circa 400-750 token per sessione. Quando Claude Code non passa il modello all'hook, come nel nostro test headless `-p`, la nota elenca ciò che è cambiato da giugno 2026, il che vale per ogni modello Claude. In quel test la sessione ha ricevuto la nota e Claude l'ha citata parola per parola.

## Cosa farne

- **Non fidarti della memoria di Claude su Claude Code.** Per flag, impostazioni, hook e comandi, fagli leggere la pagina. Claude Code include un agente guida per le domande su sé stesso, e la documentazione pubblica un indice su [code.claude.com/docs/llms.txt](https://code.claude.com/docs/llms.txt).
- **Data i tuoi tutorial.** Una guida di sei mesi fa ha perso più di un terzo dei suoi fatti. Controlla sulla documentazione tutto ciò che è più vecchio prima di copiarne i comandi.
- **Preferisci le pagine che dicono quando sono state verificate.** Ogni pagina di questo sito riporta la data dell'ultima verifica; la [dashboard di freschezza](/docs/whats-new/freshness) le elenca tutte, e [Deprecation & Migration Watch](/docs/whats-new/deprecations) tiene traccia di ciò che è stato rimosso.

## Come l'abbiamo misurato

- **Cronologia.** [web3dev1337/claude-code-docs](https://github.com/web3dev1337/claude-code-docs) è un fork di un noto mirror della documentazione che ha conservato l'intera cronologia delle sincronizzazioni: 3.604 sincronizzazioni tra luglio 2025 e ottobre 2026. Abbiamo preso l'ultima sincronizzazione di ogni settimana, 67 istantanee in tutto.
- **Perimetro.** Ogni pagina di Claude Code tranne il changelog e i digest settimanali, che per loro natura registrano la storia, e le pagine dell'Agent SDK, che nel 2026 sono arrivate da un altro sito di documentazione e altrimenti conterebbero come nuove.
- **Unità.** Ogni pagina è divisa in frasi, righe di tabella e righe di codice, senza link né markup. Una riga che compare contemporaneamente in cinque o più pagine, come un banner o una riga di codice generica, viene scartata. Ne sono rimaste 90.674 unità distinte da seguire.
- **Scomparse.** Un'unità è scomparsa quando manca da due istantanee settimanali consecutive, o dall'ultima, così una pagina che ha fallito una sincronizzazione non viene conteggiata.
- **Fatti.** Una nuova frase che sostituisce una eliminata nella stessa settimana è considerata lo stesso fatto quando almeno il 60% delle parole coincide e ogni numero, flag, percorso e identificatore è identico. In questo modo sono state collegate 7.965 riformulazioni.
- **Cutoff.** Ogni modello è confrontato con l'ultima istantanea settimanale entro l'ultimo giorno del mese del suo cutoff, la lettura più generosa. I cutoff precedenti a luglio 2025 usano la prima istantanea, che contiene già più di quanto quei modelli potessero aver visto: le loro quote sono limiti inferiori.
- **Sopravvivenza.** Stime Kaplan–Meier su tutte le unità nate dopo la prima istantanea, con le unità ancora presenti oggi trattate come censurate.

Il mirror non è ufficiale: se ha perso o rovinato una pagina, i numeri ne risentono. Abbiamo controllato le settimane dei cutoff alla ricerca di pagine sparite per una sincronizzazione e non ne abbiamo trovate. L'analisi confronta testo, non comportamento del prodotto.

## Riproducilo

Lo script e il suo output sono nel repository di questo sito: [scripts/research/docs-decay.mjs](https://github.com/derob98/ailmanac/blob/main/scripts/research/docs-decay.mjs) e [data/research/claude-code-docs-decay.json](https://github.com/derob98/ailmanac/blob/main/data/research/claude-code-docs-decay.json). Servono Node e git, e gira in circa 15 secondi:

```bash
git clone https://github.com/web3dev1337/claude-code-docs
git clone https://github.com/derob98/ailmanac
node ailmanac/scripts/research/docs-decay.mjs claude-code-docs
```
