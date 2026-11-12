# MCP कॉन्फ़िग बिल्डर

> Source: https://derob98.github.io/ailmanac/hi/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

अपनी पसंद के सर्वर चुनें और इस्तेमाल के लिए तैयार .mcp.json पाएँ।

<LevelBadge level="intermediate" />

[MCP](/docs/claude-code/mcp) Claude को बाहरी टूल और डेटा से जोड़ता है। अपनी पसंद के सर्वर चुनें और शुरुआती `.mcp.json` कॉपी (या डाउनलोड) करें। `${...}` प्लेसहोल्डर को एनवायरनमेंट वेरिएबल से बदलें — सीक्रेट कभी सीधे फ़ाइल में न लिखें।

<McpConfigBuilder />

:::warning[दो पंक्तियों में पैकेज का नाम आपको खुद भरना होगा]
PostgreSQL और Slack जानबूझकर पैकेज की जगह `REPLACE-WITH-A-MAINTAINED-…` प्लेसहोल्डर देते हैं। इन दोनों के लिए सब जिन `@modelcontextprotocol/server-*` पैकेजों का इस्तेमाल करते थे, वे [आर्काइव हो चुके हैं और अब मेंटेन नहीं होते](/docs/templates/mcp-config); उनकी कोई सुरक्षा गारंटी नहीं है और किसी का भी आधिकारिक विकल्प नहीं है — इसलिए कोई मेंटेन होता हुआ कम्युनिटी सर्वर चुनें, उसकी समीक्षा करें और उसके पैकेज का नाम यहाँ चिपकाएँ। बाकी हर पंक्ति या तो मेंटेन किया जा रहा रेफ़रेंस सर्वर है या वेंडर का अपना एंडपॉइंट।
:::

:::warning[भरोसा करें, पर जाँचें]
MCP सर्वर कोड चलाता है और डेटा तक पहुँच सकता है। सिर्फ़ उन्हीं सर्वरों को जोड़ें जिन पर आपको भरोसा है, उन्हें न्यूनतम अधिकार दें, और हर पैकेज को [modelcontextprotocol.io](https://modelcontextprotocol.io) पर जाँचें। देखें [थर्ड-पार्टी कोड की समीक्षा](/docs/security/reviewing-third-party-code)।
:::

## आगे

- [Claude Code में MCP सर्वर](/docs/claude-code/mcp) — पूरी गाइड
- [MCP कॉन्फ़िग और सर्वर स्कैफ़ोल्ड](/docs/templates/mcp-config) — सर्वर का शुरुआती कोड
- [अपना पहला MCP सर्वर बनाएँ और जोड़ें](/docs/walkthroughs/first-mcp-server)
