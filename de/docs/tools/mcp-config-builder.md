# MCP-Konfigurations-Builder

> Source: https://derob98.github.io/ailmanac/de/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

Wähle die gewünschten Server aus und erhalte eine sofort nutzbare .mcp.json.

<LevelBadge level="intermediate" />

[MCP](/docs/claude-code/mcp) verbindet Claude mit externen Tools und Daten. Wähle die Server aus, die du willst, und kopiere (oder lade herunter) eine `.mcp.json` als Ausgangspunkt. Ersetze die `${...}`-Platzhalter durch Umgebungsvariablen — schreibe Secrets niemals fest in die Datei.

<McpConfigBuilder />

:::warning[Zwei Zeilen brauchen von dir einen Paketnamen]
PostgreSQL und Slack geben absichtlich einen Platzhalter `REPLACE-WITH-A-MAINTAINED-…` statt eines Pakets aus. Die `@modelcontextprotocol/server-*`-Pakete, die alle dafür benutzt haben, sind [archiviert und werden nicht mehr gepflegt](/docs/templates/mcp-config) und bieten keine Sicherheitsgarantien; für keines von beiden gibt es einen offiziellen Ersatz — wähle also einen gepflegten Community-Server, prüfe ihn und füge seinen Paketnamen ein. Jede andere Zeile ist entweder ein gepflegter Referenzserver oder der Endpunkt des Anbieters selbst.
:::

:::warning[Vertrauen und prüfen]
Ein MCP-Server führt Code aus und kann auf Daten zugreifen. Verbinde nur Server, denen du vertraust, gib ihnen minimale Rechte und prüfe jedes Paket auf [modelcontextprotocol.io](https://modelcontextprotocol.io). Siehe [Code von Drittanbietern prüfen](/docs/security/reviewing-third-party-code).
:::

## Weiter

- [MCP-Server in Claude Code](/docs/claude-code/mcp) — die vollständige Anleitung
- [MCP-Konfiguration & Server-Gerüste](/docs/templates/mcp-config) — Startcode für Server
- [Deinen ersten MCP-Server bauen und anbinden](/docs/walkthroughs/first-mcp-server)
