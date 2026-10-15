# Come funziona la nostra automazione

> Source: https://derob98.github.io/ailmanac/it/docs/contribute/automation · AILmanac (CC BY 4.0)

Controllo dei link, il watcher delle release e il verificatore della tabella dei modelli, spiegati.

<LevelBadge level="advanced" />

Pagina di trasparenza: ecco i meccanismi che aiutano a mantenere AILmanac aggiornato e di alta qualità con il minimo sforzo da parte dei manutentori. Il principio di fondo: **l'automazione fa emergere il lavoro da approvare per gli esseri umani — non pubblica mai silenziosamente affermazioni non verificate.**

## Il gate di build (attivo)

Ogni modifica viene compilata con `onBrokenLinks: 'throw'`, quindi un link interno morto o un MDX malformato **fa fallire la build prima del merge**. Questo è il controllo più prezioso in assoluto — mantiene la navigazione affidabile.

## Workflow CI

> I file dei workflow risiedono nel branch `ci-workflows` e vengono abilitati una volta che il repo dispone di un token con lo scope `workflow` (vedi il README). Fino ad allora il sito viene distribuito dal branch `gh-pages`.

- **`build-check`** — compila ogni PR (i link rotti causano un fallimento). Un controllo obbligatorio.
- **`deploy`** — compila e pubblica su GitHub Pages a ogni push su `main`.
- **`link-check`** — `lychee` viene eseguito settimanalmente e sulle PR; in caso di link esterni rotti **apre un issue di tracciamento** (etichetta `link-rot`) invece di limitarsi a diventare rosso.

## Automazione della freschezza (pianificata / a fasi)

- **Release watcher** — un job pianificato che interroga la documentazione/changelog di Anthropic **e** le superfici consumer che cambiano più rapidamente (app, voce, mobile, marketplace). A ogni cambiamento apre un issue/PR con le etichette `upstream-change` + `needs-verification` che punta alle pagine probabilmente interessate. È un essere umano a scrivere l'aggiornamento.
- **Verificatore della tabella dei modelli** — confronta `data/models.json` con l'elenco ufficiale dei modelli e apre una PR quando qualcosa va alla deriva. La [tabella dei modelli](/docs/whats-new/models-and-pricing) mostra una data di "ultima verifica".
- **Scansione di obsolescenza** — segnala le pagine volatili il cui `lastVerified` è più vecchio di una certa soglia.

## Perché human-in-the-loop

:::tip Automatizzato e onesto > automatizzato e sbagliato
Un'IA che committa automaticamente "notizie" su un sito di riferimento rischia di pubblicare allucinazioni — l'opposto dell'affidabilità. Per questo la nostra automazione **propone** (issue/PR); gli esseri umani **verificano e fanno il merge**. Vedi [Verifica dei fatti](/docs/contribute/fact-verification).
:::

## Vuoi dare una mano con l'automazione?

Migliorare questi workflow è un'ottima contribuzione avanzata — vedi i `.github/workflows` (nel branch `ci-workflows`) e [Contribuisci](/docs/contribute/contribute-in-10-minutes).

## Avanti

- [Verifica dei fatti e freschezza](/docs/contribute/fact-verification)
- [Questo mese in Claude](/docs/whats-new/this-month)
- [Codice di condotta e governance](/docs/contribute/governance)
