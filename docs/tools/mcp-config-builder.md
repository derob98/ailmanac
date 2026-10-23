# MCP Config Builder

> Source: https://derob98.github.io/ailmanac/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

Tick the servers you want and get a ready-to-use .mcp.json.

<LevelBadge level="intermediate" />

[MCP](/docs/claude-code/mcp) connects Claude to external tools and data. Pick the servers you want and copy (or download) a starting `.mcp.json`. Replace the `${...}` placeholders with env vars — never hard-code secrets.

<McpConfigBuilder />

:::warning Trust and verify
An MCP server runs code and can access data. Only connect servers you trust, give them least privilege, and confirm each package at [modelcontextprotocol.io](https://modelcontextprotocol.io). See [Reviewing Third-Party Code](/docs/security/reviewing-third-party-code).
:::

## Next

- [MCP Servers in Claude Code](/docs/claude-code/mcp) — the full how-to
- [MCP Config & Server Scaffolds](/docs/templates/mcp-config) — server starter code
- [Build & Wire Your First MCP Server](/docs/walkthroughs/first-mcp-server)
