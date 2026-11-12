# MCP 設定ビルダー

> Source: https://derob98.github.io/ailmanac/ja/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

使いたいサーバーにチェックを入れるだけで、すぐ使える .mcp.json を生成します。

<LevelBadge level="intermediate" />

[MCP](/docs/claude-code/mcp) は Claude を外部のツールやデータにつなぎます。使いたいサーバーを選んで、出発点となる `.mcp.json` をコピー（またはダウンロード）してください。`${...}` のプレースホルダーは環境変数に置き換えます — シークレットを直接書き込まないでください。

<McpConfigBuilder />

:::warning[2 行はパッケージ名を自分で入れる必要があります]
PostgreSQL と Slack は、パッケージの代わりに意図的に `REPLACE-WITH-A-MAINTAINED-…` というプレースホルダーを出力します。この 2 つで誰もが使っていた `@modelcontextprotocol/server-*` パッケージは[アーカイブ済みでメンテナンスされておらず](/docs/templates/mcp-config)、セキュリティの保証もありません。どちらにも公式の代替がないため、メンテナンスされているコミュニティ製サーバーを選び、内容を確認したうえで、そのパッケージ名を貼り付けてください。それ以外の行は、メンテナンスされているリファレンスサーバーか、ベンダー自身のエンドポイントです。
:::

:::warning[信頼しつつ、必ず検証する]
MCP サーバーはコードを実行し、データにアクセスできます。信頼できるサーバーだけを接続し、最小権限を与え、各パッケージを [modelcontextprotocol.io](https://modelcontextprotocol.io) で確認してください。[サードパーティ製コードのレビュー](/docs/security/reviewing-third-party-code)も参照してください。
:::

## 次へ

- [Claude Code の MCP サーバー](/docs/claude-code/mcp) — 詳しい手順
- [MCP 設定とサーバーのひな形](/docs/templates/mcp-config) — サーバーのスターターコード
- [最初の MCP サーバーを作って接続する](/docs/walkthroughs/first-mcp-server)
