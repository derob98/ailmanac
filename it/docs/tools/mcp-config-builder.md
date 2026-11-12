# Generatore di configurazione MCP

> Source: https://derob98.github.io/ailmanac/it/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

Seleziona i server che vuoi e ottieni un .mcp.json pronto all'uso.

<LevelBadge level="intermediate" />

[MCP](/docs/claude-code/mcp) collega Claude a strumenti e dati esterni. Scegli i server che vuoi e copia (o scarica) un `.mcp.json` di partenza. Sostituisci i segnaposto `${...}` con variabili d'ambiente — non scrivere mai i segreti direttamente nel file.

<McpConfigBuilder />

:::warning[Due righe richiedono un nome di pacchetto da parte tua]
PostgreSQL e Slack producono di proposito un segnaposto `REPLACE-WITH-A-MAINTAINED-…` invece di un pacchetto. I pacchetti `@modelcontextprotocol/server-*` che tutti usavano per questi due sono [archiviati e non più mantenuti](/docs/templates/mcp-config), senza alcuna garanzia di sicurezza, e nessuno dei due ha un sostituto ufficiale — quindi scegli un server della community che sia mantenuto, esaminalo e incolla il nome del suo pacchetto. Ogni altra riga è un server di riferimento mantenuto oppure l'endpoint del fornitore stesso.
:::

:::warning[Fidati, ma verifica]
Un server MCP esegue codice e può accedere ai dati. Collega solo server di cui ti fidi, dai loro il minimo privilegio e controlla ogni pacchetto su [modelcontextprotocol.io](https://modelcontextprotocol.io). Vedi [Esaminare il codice di terze parti](/docs/security/reviewing-third-party-code).
:::

## Passi successivi

- [Server MCP in Claude Code](/docs/claude-code/mcp) — la guida completa
- [Configurazione MCP e scheletri di server](/docs/templates/mcp-config) — codice di partenza per i server
- [Costruisci e collega il tuo primo server MCP](/docs/walkthroughs/first-mcp-server)
