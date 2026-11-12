# Configuration MCP et squelettes de serveurs

> Source: https://derob98.github.io/ailmanac/fr/docs/templates/mcp-config · AILmanac (CC BY 4.0) · last verified 2026-11-10

.mcp.json plus des modèles de départ minimaux pour serveurs stdio et distants.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-10" source="https://modelcontextprotocol.io">
Les clés de configuration MCP et les API du SDK évoluent — vérifiez-les dans la documentation officielle de MCP et dans la [documentation MCP de Claude Code](https://code.claude.com/docs/en/mcp). La liste des serveurs de référence encore maintenus change aussi ; l'ensemble archivé ci-dessous a été vérifié sur le registre npm et sur [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers).
</VerifyNote>

Modèles de départ prêts à copier-coller pour connecter Claude à des outils via [MCP](/docs/claude-code/mcp). Réduisez-les à ce dont vous avez besoin.

## `.mcp.json` — déclarer les serveurs (partagé par le projet)

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

Une entrée distante a besoin d'un `"type"` explicite. Claude Code lit une entrée avec `url` mais sans `type` comme un serveur stdio, l'ignore et vous invite à ajouter `"type": "http"` (ou `"sse"` / `"ws"`).

:::warning[Gardez les secrets hors du fichier]
Référencez des variables d'environnement (`${INTERNAL_MCP_TOKEN}`) — n'écrivez pas les jetons en dur dans un fichier versionné.
:::

:::warning[La plupart des anciens serveurs de référence sont archivés]
Les paquets `@modelcontextprotocol/server-*` que l'on copie encore partout pour **GitHub, PostgreSQL, Slack et Puppeteer** portent désormais un avis de dépréciation npm indiquant *« Archived and unmaintained; no security guarantees »* et se trouvent dans [modelcontextprotocol/servers-archived](https://github.com/modelcontextprotocol/servers-archived). Seule une poignée reste des serveurs de référence maintenus — parmi ceux en TypeScript, `server-filesystem`, `server-memory`, `server-everything` et `server-sequential-thinking`.

Préférez le serveur de l'éditeur lorsqu'il existe : GitHub fournit [`api.githubcopilot.com/mcp/`](https://github.com/github/github-mcp-server), et le contrôle du navigateur est passé à [`@playwright/mcp`](/docs/api/playwright-mcp-deep-guide). Pour PostgreSQL et Slack, il n'existe aucun remplaçant officiel — choisissez un serveur communautaire maintenu et [examinez-le d'abord](/docs/security/reviewing-third-party-code).
:::

## Serveur stdio minimal (TypeScript)

Un petit serveur qui expose un seul outil. Adaptez le gestionnaire à vos données.

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

:::note[Renommage du paquet SDK (SDK TS MCP v2)]
`@modelcontextprotocol/sdk` a été scindé en `@modelcontextprotocol/server` et `@modelcontextprotocol/client` dans la v2. Le paquet v1 reçoit toujours des correctifs ; les nouveaux projets devraient utiliser la v2.
:::

## Serveur stdio minimal (Python)

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

## Avant de livrer un serveur

- **Moindre privilège** — uniquement les données et actions dont il a besoin ([Sécuriser les agents](/docs/security/securing-agents)).
- **Validez les entrées** ; renvoyez les erreurs comme résultats, ne plantez pas.
- **Examinez les serveurs tiers** avant de vous y connecter ([Examiner le code tiers](/docs/security/reviewing-third-party-code)).

## Suite

- [Serveurs MCP dans Claude Code](/docs/claude-code/mcp)
- [Construire et brancher votre premier serveur MCP](/docs/walkthroughs/first-mcp-server)
- [Recettes de hooks et settings.json](/docs/templates/hooks-settings)
