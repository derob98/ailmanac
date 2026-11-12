# Privacy e gestione dei dati

> Source: https://derob98.github.io/ailmanac/it/docs/foundations/privacy · AILmanac (CC BY 4.0) · last verified 2026-11-09

Cosa è sicuro incollare, l'addestramento sui tuoi dati e quando eseguire in locale.

<LevelBadge level="beginner" />

<Callout type="objectives" items={[
  "Eseguire un audit in cinque domande su qualsiasi strumento AI prima di incollarci qualcosa di sensibile",
  "Capire perché una garanzia di privacy di solito riguarda una SUPERFICIE o un PIANO, non l'argomento di cui stai parlando",
  "Distinguere le quattro domande separate — addestramento, conservazione, accesso e residenza — perché uno strumento può essere buono su una e pessimo su un'altra",
  "Riconoscere le tre superfici di privacy oltre al prompt: account collegati, memoria e tutto ciò che pubblichi o condividi",
  "Decidere quando locale o self-hosted è davvero la risposta giusta e non quella istintiva",
]} />

<VerifyNote lastVerified="2026-11-09" source="https://www.anthropic.com/legal/privacy">
Le policy di gestione dei dati e di addestramento variano per provider, prodotto e piano (consumer vs API vs enterprise) e cambiano nel tempo. Nulla in questa pagina sostituisce la lettura delle condizioni attuali del tuo provider — considerala l'elenco delle domande da fare, non le risposte.
</VerifyNote>

Una domanda semplice con una posta reale: **cosa succede al testo che invii a un'AI?** La risposta dipende dal provider, dal prodotto e dal tuo piano — quindi l'abitudine sicura è *sapere prima di incollare*.

L'errore più comune è dare per scontato che la garanzia segua l'**argomento**. Quasi mai è così. Le garanzie riguardano una **superficie** (questa funzione, questo hub, questa API) o un **piano** (enterprise, zero-retention) — il che significa che la stessa frase sul tuo stipendio può essere trattata in due modi completamente diversi a seconda di dove, nella stessa app, l'hai digitata.

## Quattro domande, non una

"È privato?" riassume quattro proprietà indipendenti. Uno strumento può ottenere un buon punteggio su una e uno pessimo su un'altra, quindi chiedile separatamente.

<Steps items={[
  {title: "Addestramento — il mio input viene usato per migliorare il modello?", body: "Varia enormemente per fascia. Molte offerte API ed enterprise NON si addestrano sui tuoi dati per impostazione predefinita; le impostazioni consumer spesso dipendono da un interruttore che potresti aver cambiato o no. Controlla l'impostazione reale nel tuo account, non la pagina di marketing."},
  {title: "Conservazione — per quanto tempo viene tenuto e cancellare cancella davvero?", body: "Rimuovere una conversazione dalla tua cronologia e rimuoverla dallo storage di back-end sono due eventi diversi con due tempistiche diverse. Chiedi entrambi i numeri. Chiedi separatamente dei dati segnalati per la revisione delle policy, che di solito vengono conservati molto più a lungo."},
  {title: "Accesso — chi, all'interno del provider, può leggerlo e con quale motivo?", body: "Revisione della sicurezza, indagini sugli abusi ed escalation del supporto sono parti normali della gestione di un servizio. La domanda non è se degli esseri umani possano mai vederlo, ma cosa lo determina."},
  {title: "Residenza — dove viene elaborato ed è cifrato?", body: "Conta per il GDPR, per le norme di settore e per i contratti con i clienti. Se serve una regione specifica, di solito è una funzione della fascia enterprise, non un'impostazione consumer."},
  {title: "Poi: esiste un'opzione zero-retention o business?", body: "Se il lavoro sensibile è routine per te, la risposta alle quattro domande precedenti dovrebbe essere 'siamo nella fascia in cui questo è contrattuale' e non 'abbiamo controllato l'interruttore'."}
]} />

<PromptCard title="Incolla questo nella ricerca della documentazione di qualsiasi fornitore AI, oppure invialo al loro team commerciale">
{`For the specific product and plan we would be on:
1. Is customer input used for model training by default? Is it a per-user or
   per-organization setting, and who can change it?
2. What are the two retention windows — removal from the user-visible history,
   and deletion from back-end storage? What is retained longer, and why?
3. Under what triggers can your staff read customer conversations?
4. Can processing be pinned to a specific region, and on which plan?
5. Do you offer a zero-retention mode, and what does it disable?
Please point to the documentation for each answer rather than summarizing.`}
</PromptCard>

Se un fornitore non sa rispondere a tutte e cinque con dei link, quella è già la risposta.

## La garanzia segue la superficie, non l'argomento

L'esempio dal vivo più chiaro è la funzione **Personal Finance** di Anthropic. Le conversazioni dentro l'hub Personal Finance non vengono usate per addestrare i modelli di Anthropic e restano fuori dalla memoria e dal tuo riepilogo mensile. Incolla lo stesso estratto conto in una normale chat di Claude e si applicano invece le **normali impostazioni di privacy del tuo account** — l'esclusione viaggia con l'hub, non con il fatto che stavi parlando di soldi.

<Callout type="warning" items={[
  "Generalizza la lezione, non l'esempio: quando leggi una promessa di privacy, trova il sostantivo a cui è riferita. 'In questo workspace', 'su questo piano', 'tramite questa API', 'in questo hub' — quel sostantivo è il vero confine. Una promessa senza sostantivo di ambito è di solito una promessa sulle intenzioni del fornitore, non sui tuoi dati."
]} />

## Regole pratiche

- **Non incollare segreti** — chiavi API, password, token — in nessuno strumento AI. Mai. Non perché il fornitore non sia affidabile, ma perché un segreto in una trascrizione è un segreto in un log, in un backup, in un link condiviso e magari in un ticket di assistenza.
- **Riduci al minimo i dati personali.** Invia solo ciò che serve al task; oscura nomi, ID e numeri di conto quando puoi. Un modello raramente ha bisogno dell'identificativo per ragionare.
- **I dati degli altri sono degli altri.** Fai attenzione a PII dei clienti, informazioni sanitarie o finanziarie — possono esserci obblighi legali (GDPR, HIPAA e altri) che il tuo livello di comfort personale non annulla.
- **Usa la fascia giusta.** Per il lavoro regolamentato o riservato, usa un'opzione business/enterprise/zero-retention, non un account personale. È la mossa più efficace di tutta questa pagina.
- **Valuta modelli locali/self-hosted** quando i dati non possono davvero uscire dal tuo ambiente — cedi un po' di capacità in cambio del controllo totale. Vedi [uno stack AI locale privato](/docs/models/private-local-ai-stack).

## Tre superfici che si dimenticano

Il prompt è quella ovvia. Queste tre perdono in modi che sorprendono.

| Superficie | Perché è facile non vederla | Cosa fare |
| --- | --- | --- |
| **Account collegati** (banche, email, drive, CRM) | L'autorizzazione risiede presso l'*aggregatore o il provider OAuth*, non nell'app AI. Annullare l'abbonamento o eliminare l'app spesso lascia viva la connessione. | Verifica e revoca alla fonte — il portale dell'aggregatore, l'elenco delle app di terze parti del tuo account Google/Microsoft. Considera l'interruttore dell'app AI come una comodità. Vedi [Connettori](/docs/claude-app/connectors). |
| **Memoria** | È progettata per portare il contesto *tra* le conversazioni, ed è proprio questo che le fa portare una confidenza fatta una volta in chat dove non te l'aspettavi. | Sappi se il tuo strumento ce l'ha, cosa ha memorizzato e come cancellare una singola voce invece di tutto. Vedi [Memoria tra le chat](/docs/claude-app/memory). |
| **Tutto ciò che è pubblicato o condiviso** | Un link condiviso o un artifact pubblicato è spesso un *oggetto separato* con una propria durata — può sopravvivere alla conversazione da cui proviene e uno interattivo può leggere i dati collegati di chi lo guarda. | Prima di condividere, chiediti cosa può fare la copia del destinatario, non solo cosa mostra. Eliminare la chat spesso non è una pulizia. |

## Sul dispositivo vs cloud

| | Cloud (ospitato) | Locale / self-hosted |
|---|---|---|
| Capacità | Massima | Inferiore (ma in miglioramento) |
| I dati lasciano la tua macchina | Sì (secondo i termini del provider) | No |
| Configurazione/costo | Facile, paghi a consumo | Più impegno, il tuo hardware |
| Di chi devi fidarti | Dei termini e dei controlli del provider | Della tua macchina, degli aggiornamenti e dei backup |

Locale non è automaticamente più privato — lo è *in modo diverso*. Un portatile non cifrato con due anni di trascrizioni è un risultato peggiore di un provider affidabile su una fascia zero-retention. Scegli il locale quando il requisito è davvero "questo non deve uscire dalla rete", non per riflesso.

## Quiz

<Quiz questions={[
  {
    q: "Uno strumento promette che le conversazioni nel suo workspace Finanza dedicato non vengono mai usate per l'addestramento. Incolli invece un estratto conto in una chat normale della stessa app. Cosa la regola?",
    options: [
      "La stessa promessa — riguarda chiaramente i dati finanziari",
      "Le impostazioni di privacy ordinarie del tuo account",
      "Niente; i documenti incollati sono sempre esclusi",
      "Si applica automaticamente la policy più rigida del prodotto"
    ],
    answer: 1,
    explain: "Le garanzie di privacy riguardano una superficie o un piano, non un argomento. Il sostantivo di ambito nella promessa era 'il workspace Finanza' — fuori da esso si applicano le tue impostazioni normali. Quando leggi qualsiasi impegno di privacy, trova il sostantivo a cui è riferito; quel sostantivo è il vero confine."
  },
  {
    q: "Annulli il tuo abbonamento AI. Cosa dovresti presumere riguardo a un conto che avevi collegato tramite un aggregatore di dati?",
    options: [
      "È stato revocato automaticamente quando la fatturazione si è fermata",
      "È ancora collegato finché non lo revochi presso l'aggregatore",
      "Si converte in un'autorizzazione di sola lettura",
      "Scade dopo 30 giorni"
    ],
    answer: 1,
    explain: "L'autorizzazione risiede presso l'aggregatore o il provider OAuth, non presso il tuo abbonamento. Perdere l'accesso a una funzione non equivale a revocare la connessione ai dati. Verifica l'accesso di terze parti alla fonte — il portale dell'aggregatore o l'elenco delle app collegate del tuo identity provider."
  },
  {
    q: "Quale coppia di fatti sulla conservazione dovresti chiedere separatamente?",
    options: [
      "Cifratura a riposo e in transito",
      "Rimozione dalla tua cronologia visibile ed eliminazione dallo storage di back-end",
      "Limiti del piano gratuito e del piano a pagamento",
      "Versione del modello e data di cutoff dell'addestramento"
    ],
    answer: 1,
    explain: "Sono due eventi diversi su due orologi diversi — una conversazione può sparire subito dalla tua cronologia e persistere nei sistemi di back-end per settimane. I dati segnalati per la revisione delle policy sono di solito una terza finestra, molto più lunga. Un solo numero di 'periodo di conservazione' non è quasi mai la risposta completa."
  }
]} />

<Callout type="takeaways" items={[
  "Fai quattro domande, non una: addestramento, conservazione, accesso, residenza. Uno strumento può superarne una e fallirne un'altra.",
  "Trova il sostantivo di ambito in ogni promessa di privacy — l'hub, il piano, il workspace o l'API a cui si applica. Quel sostantivo è il confine, non l'argomento di cui stai parlando.",
  "La mossa più efficace è essere nella fascia giusta, non essere furbi su cosa incolli.",
  "Verifica gli account collegati presso l'aggregatore o l'identity provider, non nell'app AI.",
  "Eliminare una conversazione spesso non elimina l'artifact o il link condiviso che ne è derivato.",
  "Locale è privato in modo diverso, non automaticamente più privato. Sceglilo per un requisito reale."
]} />

## Prossimi passi

- [Personal Finance in Claude](/docs/claude-app/personal-finance) — l'esempio concreto di ogni principio di questa pagina, con i campi esatti, i confini e le modalità di errore
- [Chi legge le tue chat con l'AI](/docs/security/who-reads-your-ai-chats-safety-review-escalation) — la versione avanzata della domanda sull'*accesso*: revisione della sicurezza, segnalazione alle forze dell'ordine e la conservazione che sopravvive all'eliminazione di una conversazione
- [Cosa perdono le chat AI verso i tracker](/docs/security/what-ai-chats-leak-to-trackers) — la superficie che nessuna delle policy qui sopra copre
- [Uso responsabile, etica e verifica](/docs/security/responsible-use)
