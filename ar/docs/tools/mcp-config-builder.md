# منشئ إعدادات MCP

> Source: https://derob98.github.io/ailmanac/ar/docs/tools/mcp-config-builder · AILmanac (CC BY 4.0)

حدّد الخوادم التي تريدها واحصل على ملف .mcp.json جاهز للاستخدام.

<LevelBadge level="intermediate" />

يربط [MCP](/docs/claude-code/mcp) نموذج Claude بأدوات وبيانات خارجية. اختر الخوادم التي تريدها، ثم انسخ (أو نزّل) ملف `.mcp.json` كنقطة بداية. استبدل العناصر النائبة `${...}` بمتغيرات بيئة — ولا تكتب الأسرار داخل الملف مباشرةً أبدًا.

<McpConfigBuilder />

:::warning[صفّان يحتاجان منك إلى اسم الحزمة]
يُخرج كلٌّ من PostgreSQL وSlack عنصرًا نائبًا هو `REPLACE-WITH-A-MAINTAINED-…` بدلًا من اسم حزمة، وذلك عن قصد. فحزم `@modelcontextprotocol/server-*` التي اعتاد الجميع استخدامها لهذين الخادمين [مؤرشفة وغير مُصانة](/docs/templates/mcp-config) ولا تقدّم أي ضمانات أمنية، وليس لأيٍّ منهما بديل رسمي — لذا اختر خادمًا مجتمعيًا مُصانًا، وراجِعه، ثم الصق اسم حزمته. أما كل صف آخر فهو إما خادم مرجعي مُصان أو نقطة الوصول الخاصة بالمزوّد نفسه.
:::

:::warning[ثق، لكن تحقّق]
يشغّل خادم MCP شيفرة برمجية وقد يصل إلى البيانات. اربط فقط الخوادم التي تثق بها، وامنحها أقل قدر من الصلاحيات، وتأكد من كل حزمة على [modelcontextprotocol.io](https://modelcontextprotocol.io). راجع [مراجعة الشيفرة البرمجية من جهات خارجية](/docs/security/reviewing-third-party-code).
:::

## الخطوة التالية

- [خوادم MCP في Claude Code](/docs/claude-code/mcp) — الدليل الكامل
- [إعدادات MCP وهياكل الخوادم](/docs/templates/mcp-config) — شيفرة البداية للخوادم
- [ابنِ أول خادم MCP لك واربطه](/docs/walkthroughs/first-mcp-server)
