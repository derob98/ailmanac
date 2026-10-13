<div align="center">

# AILmanac

### La guida a Claude e agli strumenti AI che ti dice quando ogni pagina è stata controllata l'ultima volta.

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Italiano](./README.it.md)

**[Leggi il sito in italiano](https://derob98.github.io/ailmanac/it/)**

</div>

---

Gli strumenti AI cambiano ogni settimana, e quasi nessuna guida dice quando è stata scritta. AILmanac è una guida libera e aperta a **Claude** (le app, **Claude Code** e l'**API**) e agli altri modelli e agenti che gli stanno intorno. Ogni pagina indica il livello, è scritta in modo semplice e riporta la data in cui è stata verificata sulla fonte.

> [!NOTE]
> AILmanac è un progetto indipendente. Non è affiliato ad Anthropic, né sponsorizzato o approvato da Anthropic. "Claude" e "Anthropic" sono marchi di Anthropic. Se AILmanac e la [documentazione ufficiale](https://docs.anthropic.com) dicono cose diverse, vale la documentazione ufficiale.

## Usalo dentro Claude Code

Due comandi aggiungono la guida a Claude Code come plugin:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

Poi, in qualsiasi sessione:

- **Fai una domanda** su Claude, Claude Code, l'API o MCP. La skill `ailmanac` cerca la risposta nella guida e cita la pagina con la data di verifica, invece di rispondere a memoria.
- **Lancia `/ailmanac:claude-md-check`** in un progetto. Confronta il tuo `CLAUDE.md` con il repository che descrive e con il modo in cui i file di memoria vengono caricati, poi propone le correzioni.
- **Sette pacchetti di skill per ruolo** si attivano quando servono: sviluppo, ricerca, analisi dati, scrittura, marketing, studio e produttività quotidiana.

Le skill leggono solo pagine pubbliche di questo sito. Nulla del tuo progetto viene inviato ad AILmanac.

## Il resto

Numeri aggiornati, pagine aggiunte di recente, come contribuire e licenze sono nel [README in inglese](./README.md). La guida è tradotta in dodici lingue: una pagina non ancora tradotta viene mostrata in inglese.
