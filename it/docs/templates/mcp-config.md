# Configurazione MCP e scaffold dei server

> Source: https://derob98.github.io/ailmanac/it/docs/templates/mcp-config · AILmanac (CC BY 4.0) · last verified 2026-11-10

.mcp.json più starter minimi per server stdio e remoti.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-10" source="https://modelcontextprotocol.io">
Le chiavi di configurazione MCP e le API degli SDK evolvono — verificale rispetto alla documentazione ufficiale di MCP e alla [documentazione MCP di Claude Code](https://code.claude.com/docs/en/mcp). Cambia anche quali server di riferimento sono ancora mantenuti: l'insieme archiviato qui sotto è stato controllato sul registry npm e su [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers).
</VerifyNote>

Starter pronti da copiare e incollare per connettere Claude ai tool tramite [MCP](/docs/claude-code/mcp). Sfoltisci tenendo solo ciò che ti serve.

## `.mcp.json` — dichiarare i server (condivisi nel progetto)

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "private-api": {
      "type": "http",
      "url": "https://api.internal.example.com/mcp",
      "headers": { "Authorization": "Bearer ${INTERNAL_MCP_TOKEN}" }
    }
  }
}
```

Una voce remota richiede un `"type"` esplicito. Claude Code legge una voce con `url` ma senza `type` come un server stdio, la salta e ti dice di aggiungere `"type": "http"` (oppure `"sse"` / `"ws"`).

:::warning[Tieni i segreti fuori dal file]
Fai riferimento a variabili d'ambiente (`${INTERNAL_MCP_TOKEN}`) — non scrivere i token direttamente in un file di cui fai il commit.
:::

:::warning[Quasi tutti i vecchi server di riferimento sono archiviati]
I pacchetti `@modelcontextprotocol/server-*` che si continuano a copiare per **GitHub, PostgreSQL, Slack e Puppeteer** ora riportano un avviso di deprecazione npm che dice *"Archived and unmaintained; no security guarantees"* e si trovano in [modelcontextprotocol/servers-archived](https://github.com/modelcontextprotocol/servers-archived). Solo una manciata sono ancora server di riferimento mantenuti — tra quelli TypeScript, `server-filesystem`, `server-memory`, `server-everything` e `server-sequential-thinking`.

Preferisci il server del fornitore stesso, quando esiste: GitHub offre [`api.githubcopilot.com/mcp/`](https://github.com/github/github-mcp-server), e il controllo del browser è passato a [`@playwright/mcp`](/docs/api/playwright-mcp-deep-guide). Per PostgreSQL e Slack non esiste un sostituto ufficiale — scegli un server della community mantenuto e [esaminalo prima](/docs/security/reviewing-third-party-code).
:::

## Server stdio minimo (TypeScript)

Un piccolo server che espone un solo tool. Adatta il gestore ai tuoi dati.

```ts
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const server = new McpServer({ name: "echo", version: "1.0.0" });

server.registerTool(
  "echo",
  {
    description: "Echo back the provided text",
    inputSchema: z.object({ text: z.string().describe("Text to echo back") }),
  },
  async ({ text }) => ({ content: [{ type: "text", text: `You said: ${text}` }] }),
);

await server.connect(new StdioServerTransport());
```

:::note[Cambio di nome del pacchetto SDK (SDK TS di MCP v2)]
`@modelcontextprotocol/sdk` è stato diviso in `@modelcontextprotocol/server` e `@modelcontextprotocol/client` nella v2. Il pacchetto v1 riceve ancora correzioni di bug; i nuovi progetti dovrebbero usare la v2.
:::

## Server stdio minimo (Python)

```python
from mcp.server import MCPServer

mcp = MCPServer("echo")

@mcp.tool()
def echo(text: str) -> str:
    """Echo the text back."""
    return f"You said: {text}"

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

## Prima di rilasciare un server

- **Privilegio minimo** — solo i dati/le azioni di cui ha bisogno ([Mettere in sicurezza gli agenti](/docs/security/securing-agents)).
- **Valida gli input**; restituisci gli errori come risultati, non andare in crash.
- **Esamina i server di terze parti** prima di connetterli ([Esaminare il codice di terze parti](/docs/security/reviewing-third-party-code)).

## Prossimi passi

- [Server MCP in Claude Code](/docs/claude-code/mcp)
- [Costruisci e collega il tuo primo server MCP](/docs/walkthroughs/first-mcp-server)
- [Ricette per hook e settings.json](/docs/templates/hooks-settings)
