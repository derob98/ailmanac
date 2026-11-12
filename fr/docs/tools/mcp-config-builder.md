# Générateur de configuration MCP

> Source: https://derob98.github.io/ailmanac/fr/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

Cochez les serveurs souhaités et obtenez un .mcp.json prêt à l'emploi.

<LevelBadge level="intermediate" />

[MCP](/docs/claude-code/mcp) relie Claude à des outils et à des données externes. Choisissez les serveurs voulus, puis copiez (ou téléchargez) un `.mcp.json` de départ. Remplacez les espaces réservés `${...}` par des variables d'environnement — n'écrivez jamais de secrets en dur.

<McpConfigBuilder />

:::warning[Deux lignes demandent un nom de paquet de votre part]
PostgreSQL et Slack produisent volontairement un espace réservé `REPLACE-WITH-A-MAINTAINED-…` au lieu d'un paquet. Les paquets `@modelcontextprotocol/server-*` que tout le monde utilisait pour ces deux services sont [archivés et non maintenus](/docs/templates/mcp-config), sans aucune garantie de sécurité, et aucun n'a de remplaçant officiel — choisissez donc un serveur communautaire maintenu, examinez-le et collez le nom de son paquet. Toutes les autres lignes sont soit un serveur de référence maintenu, soit le point d'accès propre au fournisseur.
:::

:::warning[Faire confiance, mais vérifier]
Un serveur MCP exécute du code et peut accéder à des données. Ne connectez que des serveurs de confiance, accordez-leur le moindre privilège et vérifiez chaque paquet sur [modelcontextprotocol.io](https://modelcontextprotocol.io). Voir [Examiner du code tiers](/docs/security/reviewing-third-party-code).
:::

## Suite

- [Serveurs MCP dans Claude Code](/docs/claude-code/mcp) — le guide complet
- [Configuration MCP et squelettes de serveur](/docs/templates/mcp-config) — code de départ pour les serveurs
- [Construire et brancher votre premier serveur MCP](/docs/walkthroughs/first-mcp-server)
