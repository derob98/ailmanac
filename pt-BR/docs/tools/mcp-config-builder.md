# Gerador de configuração MCP

> Source: https://derob98.github.io/ailmanac/pt-BR/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

Marque os servidores que quiser e obtenha um .mcp.json pronto para usar.

<LevelBadge level="intermediate" />

O [MCP](/docs/claude-code/mcp) conecta o Claude a ferramentas e dados externos. Escolha os servidores que quiser e copie (ou baixe) um `.mcp.json` inicial. Substitua os marcadores `${...}` por variáveis de ambiente — nunca coloque segredos direto no arquivo.

<McpConfigBuilder />

:::warning[Duas linhas precisam de um nome de pacote seu]
PostgreSQL e Slack geram de propósito um marcador `REPLACE-WITH-A-MAINTAINED-…` em vez de um pacote. Os pacotes `@modelcontextprotocol/server-*` que todo mundo usava para esses dois estão [arquivados e sem manutenção](/docs/templates/mcp-config), sem garantias de segurança, e nenhum deles tem substituto oficial — então escolha um servidor da comunidade que seja mantido, revise-o e cole o nome do pacote dele. Todas as outras linhas são um servidor de referência mantido ou o endpoint do próprio fornecedor.
:::

:::warning[Confie, mas verifique]
Um servidor MCP executa código e pode acessar dados. Conecte apenas servidores em que você confia, dê a eles o mínimo de privilégio e confirme cada pacote em [modelcontextprotocol.io](https://modelcontextprotocol.io). Veja [Revisando código de terceiros](/docs/security/reviewing-third-party-code).
:::

## Próximos passos

- [Servidores MCP no Claude Code](/docs/claude-code/mcp) — o passo a passo completo
- [Configuração MCP e esqueletos de servidor](/docs/templates/mcp-config) — código inicial de servidores
- [Construa e conecte seu primeiro servidor MCP](/docs/walkthroughs/first-mcp-server)
