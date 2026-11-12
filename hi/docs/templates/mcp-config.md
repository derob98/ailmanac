# MCP कॉन्फ़िग और सर्वर स्कैफ़ोल्ड

> Source: https://derob98.github.io/ailmanac/hi/docs/templates/mcp-config · AILmanac (CC BY 4.0) · last verified 2026-11-10

.mcp.json के साथ-साथ न्यूनतम stdio और रिमोट सर्वर स्टार्टर।

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-10" source="https://modelcontextprotocol.io">
MCP कॉन्फ़िग keys और SDK API बदलते रहते हैं — आधिकारिक MCP दस्तावेज़ और [Claude Code MCP दस्तावेज़](https://code.claude.com/docs/en/mcp) के विरुद्ध पुष्टि करें। कौन-से रेफ़रेंस सर्वर अब भी मेंटेन किए जा रहे हैं, यह भी बदलता रहता है; नीचे दिए गए आर्काइव्ड सेट को npm रजिस्ट्री और [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) से मिलाकर जाँचा गया है।
</VerifyNote>

[MCP](/docs/claude-code/mcp) के ज़रिए Claude को टूल्स से जोड़ने के लिए कॉपी-पेस्ट स्टार्टर। अपनी ज़रूरत के अनुसार छाँटें।

## `.mcp.json` — सर्वर घोषित करें (प्रोजेक्ट-शेयर्ड)

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

रिमोट एंट्री में स्पष्ट `"type"` ज़रूरी है। Claude Code `url` वाली लेकिन `type` के बिना एंट्री को stdio सर्वर मानकर पढ़ता है, उसे छोड़ देता है और आपसे `"type": "http"` (या `"sse"` / `"ws"`) जोड़ने को कहता है।

:::warning[सीक्रेट्स को फ़ाइल से बाहर रखें]
एनवायरनमेंट वेरिएबल (`${INTERNAL_MCP_TOKEN}`) का संदर्भ दें — कमिट की जाने वाली फ़ाइल में टोकन हार्ड-कोड न करें।
:::

:::warning[पुराने रेफ़रेंस सर्वरों में से ज़्यादातर आर्काइव हो चुके हैं]
**GitHub, PostgreSQL, Slack और Puppeteer** के लिए लोग जो `@modelcontextprotocol/server-*` पैकेज अब भी कॉपी करते घूमते हैं, उन पर अब npm का डिप्रिकेशन नोटिस है, जिसमें लिखा है *“Archived and unmaintained; no security guarantees”*, और वे [modelcontextprotocol/servers-archived](https://github.com/modelcontextprotocol/servers-archived) में रखे हैं। अब भी मेंटेन किए जा रहे रेफ़रेंस सर्वर गिने-चुने ही हैं — TypeScript वालों में `server-filesystem`, `server-memory`, `server-everything` और `server-sequential-thinking`।

जहाँ वेंडर का अपना सर्वर उपलब्ध हो, उसे प्राथमिकता दें: GitHub [`api.githubcopilot.com/mcp/`](https://github.com/github/github-mcp-server) देता है, और ब्राउज़र कंट्रोल अब [`@playwright/mcp`](/docs/api/playwright-mcp-deep-guide) पर चला गया है। PostgreSQL और Slack के लिए कोई आधिकारिक विकल्प नहीं है — कोई मेंटेन किया जा रहा कम्युनिटी सर्वर चुनें और [पहले उसकी समीक्षा करें](/docs/security/reviewing-third-party-code)।
:::

## न्यूनतम stdio सर्वर (TypeScript)

एक छोटा-सा सर्वर जो एक टूल उपलब्ध कराता है। हैंडलर को अपने डेटा के अनुसार ढालें।

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

:::note[SDK पैकेज का नाम बदला (MCP TS SDK v2)]
v2 में `@modelcontextprotocol/sdk` को `@modelcontextprotocol/server` और `@modelcontextprotocol/client` में बाँट दिया गया। v1 पैकेज को अब भी बग फ़िक्स मिलते हैं; नए प्रोजेक्ट को v2 इस्तेमाल करना चाहिए।
:::

## न्यूनतम stdio सर्वर (Python)

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

## सर्वर शिप करने से पहले

- **न्यूनतम विशेषाधिकार** — केवल वही डेटा/क्रियाएँ जिनकी इसे ज़रूरत है ([एजेंट्स को सुरक्षित करना](/docs/security/securing-agents))।
- **इनपुट को वैलिडेट करें**; त्रुटियों को परिणाम के रूप में लौटाएँ, क्रैश न करें।
- **थर्ड-पार्टी सर्वर की समीक्षा करें** जोड़ने से पहले ([थर्ड-पार्टी कोड की समीक्षा करना](/docs/security/reviewing-third-party-code))।

## आगे

- [Claude Code में MCP सर्वर](/docs/claude-code/mcp)
- [अपना पहला MCP सर्वर बनाएँ और जोड़ें](/docs/walkthroughs/first-mcp-server)
- [हुक्स और settings.json रेसिपी](/docs/templates/hooks-settings)
