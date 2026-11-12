# MCP 설정 및 서버 스캐폴드

> Source: https://derob98.github.io/ailmanac/ko/docs/templates/mcp-config · AILmanac (CC BY 4.0) · last verified 2026-11-10

.mcp.json과 최소 stdio 및 원격 서버 스타터.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-10" source="https://modelcontextprotocol.io">
MCP 설정 키와 SDK API는 계속 바뀝니다 — 공식 MCP 문서와 [Claude Code MCP 문서](https://code.claude.com/docs/en/mcp)와 대조해 확인하세요. 어떤 레퍼런스 서버가 아직 유지보수되는지도 바뀝니다. 아래의 보관(archived) 목록은 npm 레지스트리와 [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)에서 확인했습니다.
</VerifyNote>

[MCP](/docs/claude-code/mcp)를 통해 Claude를 도구에 연결하기 위한 복사해 붙여넣는 스타터입니다. 필요한 만큼만 추리세요.

## `.mcp.json` — 서버 선언 (프로젝트 공유)

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

원격 항목에는 명시적인 `"type"`이 필요합니다. Claude Code는 `url`은 있지만 `type`이 없는 항목을 stdio 서버로 읽고 건너뛰며, `"type": "http"`(또는 `"sse"` / `"ws"`)를 추가하라고 알려 줍니다.

:::warning[비밀 값을 파일 밖에 두세요]
환경 변수(`${INTERNAL_MCP_TOKEN}`)를 참조하세요 — 커밋되는 파일에 토큰을 하드코딩하지 마세요.
:::

:::warning[예전 레퍼런스 서버 대부분은 보관(archived)되었습니다]
사람들이 아직도 **GitHub, PostgreSQL, Slack, Puppeteer**용으로 복사해 쓰는 `@modelcontextprotocol/server-*` 패키지에는 이제 “Archived and unmaintained; no security guarantees”라는 npm 지원 중단 안내가 붙어 있으며 [modelcontextprotocol/servers-archived](https://github.com/modelcontextprotocol/servers-archived)에 있습니다. 여전히 유지보수되는 레퍼런스 서버는 소수뿐이며, TypeScript 쪽에서는 `server-filesystem`, `server-memory`, `server-everything`, `server-sequential-thinking`입니다.

공급사가 자체 서버를 제공한다면 그쪽을 우선하세요. GitHub는 [`api.githubcopilot.com/mcp/`](https://github.com/github/github-mcp-server)를 제공하고, 브라우저 제어는 [`@playwright/mcp`](/docs/api/playwright-mcp-deep-guide)로 옮겨 갔습니다. PostgreSQL과 Slack에는 공식 대체재가 없습니다 — 유지보수되는 커뮤니티 서버를 고르고 [먼저 검토하세요](/docs/security/reviewing-third-party-code).
:::

## 최소 stdio 서버 (TypeScript)

도구 하나를 제공하는 아주 작은 서버입니다. 핸들러를 여러분의 데이터에 맞게 바꾸세요.

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

:::note[SDK 패키지 이름 변경 (MCP TS SDK v2)]
`@modelcontextprotocol/sdk`는 v2에서 `@modelcontextprotocol/server`와 `@modelcontextprotocol/client`로 분리되었습니다. v1 패키지도 버그 수정은 계속 받지만, 새 프로젝트는 v2를 사용하세요.
:::

## 최소 stdio 서버 (Python)

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

## 서버를 배포하기 전에

- **최소 권한** — 필요한 데이터/동작만 부여하세요([에이전트 보안](/docs/security/securing-agents)).
- **입력을 검증하세요**. 오류는 결과로 반환하고, 충돌시키지 마세요.
- **서드파티 서버를 검토하세요** 연결하기 전에([서드파티 코드 검토](/docs/security/reviewing-third-party-code)).

## 다음

- [Claude Code의 MCP 서버](/docs/claude-code/mcp)
- [첫 MCP 서버 구축 및 연결](/docs/walkthroughs/first-mcp-server)
- [Hooks 및 settings.json 레시피](/docs/templates/hooks-settings)
