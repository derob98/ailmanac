# MCP 設定とサーバーのひな形

> Source: https://derob98.github.io/ailmanac/ja/docs/templates/mcp-config · AILmanac (CC BY 4.0) · last verified 2026-11-10

.mcp.json に加えて、最小構成の stdio・リモートサーバースターター。

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-10" source="https://modelcontextprotocol.io">
MCP の設定キーと SDK の API は進化します。公式の MCP ドキュメントと [Claude Code の MCP ドキュメント](https://code.claude.com/docs/en/mcp)で確認してください。どのリファレンスサーバーがまだメンテナンスされているかも変わります。以下のアーカイブ済みの一覧は、npm レジストリと [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) で確認したものです。
</VerifyNote>

[MCP](/docs/claude-code/mcp) を通じて Claude をツールに接続するための、コピー＆ペースト用スターターです。必要なものだけ残してください。

## `.mcp.json` — サーバーを宣言する（プロジェクト共有）

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

リモートのエントリには明示的な `"type"` が必要です。Claude Code は `url` があって `type` がないエントリを stdio サーバーとして読み取り、それをスキップして、`"type": "http"`（または `"sse"` / `"ws"`）を追加するよう伝えます。

:::warning[シークレットをファイルに含めない]
環境変数（`${INTERNAL_MCP_TOKEN}`）を参照してください。コミットするファイルにトークンを直接書き込まないでください。
:::

:::warning[古いリファレンスサーバーの大半はアーカイブ済み]
今でも広くコピーされている、**GitHub、PostgreSQL、Slack、Puppeteer** 向けの `@modelcontextprotocol/server-*` パッケージには、*"Archived and unmaintained; no security guarantees"* という npm の非推奨通知が付いており、[modelcontextprotocol/servers-archived](https://github.com/modelcontextprotocol/servers-archived) に置かれています。メンテナンスされているリファレンスサーバーはごくわずかで、TypeScript 製では `server-filesystem`、`server-memory`、`server-everything`、`server-sequential-thinking` です。

ベンダー自身のサーバーがあるならそちらを選んでください。GitHub は [`api.githubcopilot.com/mcp/`](https://github.com/github/github-mcp-server) を提供しており、ブラウザ制御は [`@playwright/mcp`](/docs/api/playwright-mcp-deep-guide) に移りました。PostgreSQL と Slack には公式の代替がありません。メンテナンスされているコミュニティ製サーバーを選び、[まず精査してください](/docs/security/reviewing-third-party-code)。
:::

## 最小の stdio サーバー（TypeScript）

1 つのツールを公開する小さなサーバーです。ハンドラーをあなたのデータに合わせて調整してください。

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

:::note[SDK パッケージ名の変更（MCP TS SDK v2）]
`@modelcontextprotocol/sdk` は v2 で `@modelcontextprotocol/server` と `@modelcontextprotocol/client` に分割されました。v1 パッケージにもバグ修正は入りますが、新規プロジェクトでは v2 を使ってください。
:::

## 最小の stdio サーバー（Python）

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

## サーバーを出荷する前に

- **最小権限** — 必要なデータ・操作だけに（[エージェントのセキュリティ確保](/docs/security/securing-agents)）。
- **入力を検証する**。エラーは結果として返し、クラッシュさせないでください。
- **サードパーティ製サーバーを精査する**。接続する前に確認してください（[サードパーティコードのレビュー](/docs/security/reviewing-third-party-code)）。

## 次のステップ

- [Claude Code における MCP サーバー](/docs/claude-code/mcp)
- [はじめての MCP サーバーを構築して接続する](/docs/walkthroughs/first-mcp-server)
- [フックと settings.json のレシピ](/docs/templates/hooks-settings)
