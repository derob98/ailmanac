# MCP 配置与服务器脚手架

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/templates/mcp-config · AILmanac (CC BY 4.0) · last verified 2026-11-10

.mcp.json 以及最小化的 stdio 和远程服务器起步模板。

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-10" source="https://modelcontextprotocol.io">
MCP 配置键和 SDK API 会不断演进 —— 请对照官方 MCP 文档和 [Claude Code MCP 文档](https://code.claude.com/docs/en/mcp)进行确认。哪些参考服务器仍在维护也会变化；下文列出的已归档服务器已对照 npm 注册表和 [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) 核实。
</VerifyNote>

通过 [MCP](/docs/claude-code/mcp) 将 Claude 连接到各种工具的可复制粘贴起步模板。请裁剪到你需要的部分。

## `.mcp.json` —— 声明服务器（项目共享）

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

远程条目需要显式的 `"type"`。Claude Code 会把有 `url` 但没有 `type` 的条目当作 stdio 服务器读取并跳过，同时提示你添加 `"type": "http"`（或 `"sse"` / `"ws"`）。

:::warning[不要把密钥放进文件]
请引用环境变量（`${INTERNAL_MCP_TOKEN}`）—— 不要把令牌硬编码到会提交的文件中。
:::

:::warning[大多数旧的参考服务器已被归档]
人们仍在到处复制的、用于 **GitHub、PostgreSQL、Slack 和 Puppeteer** 的 `@modelcontextprotocol/server-*` 包，现在带有 npm 弃用提示，内容为 *“Archived and unmaintained; no security guarantees”*，并存放在 [modelcontextprotocol/servers-archived](https://github.com/modelcontextprotocol/servers-archived)。仍在维护的参考服务器只剩少数 —— TypeScript 版本中有 `server-filesystem`、`server-memory`、`server-everything` 和 `server-sequential-thinking`。

有厂商官方服务器时优先使用官方的：GitHub 提供 [`api.githubcopilot.com/mcp/`](https://github.com/github/github-mcp-server)，浏览器控制已迁移到 [`@playwright/mcp`](/docs/api/playwright-mcp-deep-guide)。PostgreSQL 和 Slack 没有官方替代品 —— 请选择仍在维护的社区服务器，并[先审查它](/docs/security/reviewing-third-party-code)。
:::

## 最小化 stdio 服务器（TypeScript）

一个只暴露一个工具的小型服务器。请根据你的数据调整处理函数。

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

:::note[SDK 包重命名（MCP TS SDK v2）]
在 v2 中，`@modelcontextprotocol/sdk` 被拆分为 `@modelcontextprotocol/server` 和 `@modelcontextprotocol/client`。v1 包仍会获得缺陷修复；新项目应使用 v2。
:::

## 最小化 stdio 服务器（Python）

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

## 上线服务器之前

- **最小权限** —— 只给它所需的数据/操作权限（[保护智能体安全](/docs/security/securing-agents)）。
- **校验输入**；将错误作为结果返回，不要让程序崩溃。
- **审查第三方服务器**后再连接（[审查第三方代码](/docs/security/reviewing-third-party-code)）。

## 下一步

- [Claude Code 中的 MCP 服务器](/docs/claude-code/mcp)
- [构建并接入你的第一个 MCP 服务器](/docs/walkthroughs/first-mcp-server)
- [Hooks 与 settings.json 配方](/docs/templates/hooks-settings)
