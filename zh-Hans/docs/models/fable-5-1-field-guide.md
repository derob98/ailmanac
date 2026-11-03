# Claude Fable 5.1：有哪些变化，以及如何迁移

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/models/fable-5-1-field-guide · AILmanac (CC BY 4.0) · last verified 2026-10-21

Anthropic 于 2026 年 9 月 1 日发布 Claude Fable 5.1 和 Mythos 5.1：价格不变，仍为 $10/$50，缓存读取降至 $0.25，API 有三项破坏性变更（强制 tool_choice 报错、单向 thinking 块、仅追加的历史记录）和五项新增 beta 功能。写给所有固定使用 claude-fable-5 或 claude-opus-5 的人的迁移指南。

<LevelBadge level="intermediate" />

**2026 年 9 月 1 日**，Anthropic 发布了 **Claude Fable 5.1**（`claude-fable-5-1`）及其需要通过验证才能使用的孪生模型 **Claude Mythos 5.1**（`claude-mythos-5-1`）。如果只是扫一眼发布信息，你会把它归为"更好的 Fable"然后继续往下走。别这样。这是第一个仅替换模型 ID 就可能在**生产环境返回 400** 的 Claude 小版本：强制 `tool_choice` 被移除，thinking 块现在与产生它们的模型和对话绑定，而修改对话历史在新账户上会被强制作为错误处理。这也是第一个价格表上*最便宜*的那一行最值得关注的版本：缓存读取从 $1 降到 **每 MTok $0.25**，这就是为什么 Anthropic 能在标价 $10 / $50 不变的情况下，宣称典型工作负载成本下降约 25%，高度智能体化的工作负载最多下降 45%。

本页是迁移指南：改了什么、哪里会出问题、你能得到什么，以及一份半天就能跑完的清单。

<Callout type="objectives" items={[
  "了解让 claude-fable-5 → claude-fable-5-1 的替换变成 400 的三项破坏性变更，以及各自的修复方法",
  "使用五项新增功能：按消息设置 effort、限定在单轮的系统消息、进度更新、更便宜的缓存读取、内容溯源",
  "识别无需改代码就会出现的七种行为变化（并行工具调用减少、旁白减少、行文更密集、整文件重写）",
  "对照 Fable 5、Opus 5 和 GPT-5.6 Sol 阅读发布时的基准测试，而不被营销话术带着走",
  "为你的工作负载在 Fable 5.1、Opus 5 和 Fable 5 之间做出选择，然后执行迁移清单",
]} />

<VerifyNote lastVerified="2026-09-14" source="https://platform.claude.com/docs/en/models/fable-5-1/whats-new-fable-5-1">
模型 ID、定价、破坏性变更、beta 请求头和行为说明均来自 Anthropic 官方的 "What's new in Claude Fable 5.1"、[模型概览](https://platform.claude.com/docs/en/models/fable-5-1/overview)、[迁移指南](https://platform.claude.com/docs/en/models/fable-5-1/migration-guide)和[定价页面](https://platform.claude.com/docs/en/about-claude/pricing)，全部于 2026 年 9 月 14 日读取。基准测试数字是 Anthropic 在[发布公告](https://www.anthropic.com/claude-fable-and-mythos-5-1)中自行给出的。这里提到的三个 beta 可能会改变形态；上线前请重新核对请求头。下文发布时期的对比是以 Opus 5 为对象，因为那是 2026 年 9 月 1 日需要超越的模型；而“从这里开始”的模型现在是 **Opus 5.5**，依据是 2026 年 10 月 25 日重新读取的[模型概览](https://platform.claude.com/docs/en/models/overview)。最新的模型表见[当前模型与定价](/docs/whats-new/models-and-pricing)。
</VerifyNote>

## 一段话版本

Fable 5.1 是 [Fable 5](/docs/models/fable-5-mythos-5-flagship) 的继任者：同样是高于 Opus 的 Mythos 级别，同样是 1M token 上下文、128K 最大输出、$10 输入 / $50 输出，同样的分词器，同样始终开启的自适应 thinking，同样是在响应体内返回 `stop_reason: "refusal"`，同样要求 30 天数据保留（不支持 ZDR）。Anthropic 自己的建议在精神上没有变：大多数工作**先用当前的 Opus**，把 Fable 5.1 留给"高难度推理和长周期智能体工作，或者在更高 effort 下 Claude Opus 5.5 的评测仍不够用的时候"。发布时这句话点名的是 Opus 5；自 **2026 年 9 月 22 日**起，模型概览点名的是 **Opus 5.5**，它才是今天该对比的模型——Opus 5 现已进入旧版（legacy）。新增的内容是：三项破坏性变更、五项新增功能、便宜了 75% 的缓存读取，以及一组你最好在评测套件告诉你之前就了解的行为变化。

## 三项破坏性变更

这是你不能直接换个 ID 就完事的原因。每一项都是 400，而不是悄无声息的性能下降。

### 1. 强制使用工具会返回错误

`tool_choice: {"type": "any"}` 和 `{"type": "tool", "name": "..."}` 现在会返回 400 `invalid_request_error`：

```text
tool_choice: type "tool" and "any" are not supported for this model.
```

原因很能说明问题：thinking 始终开启，而强制工具调用会跳过它，于是模型会把推演过程放到工具参数里，参数质量随之下降。该检查适用于 Messages API、Message Batches API 和 token 计数端点。`auto`（默认）和 `none` 不变。

**修复方法**只需改两行：保持 `tool_choice` 为 `auto`，在工具上设置 `strict: true`，并在 schema 中加入 `additionalProperties: false`，同时在提示词里*写明*该工具何时适用。Anthropic 的说明是，Fable 5.1"能可靠地遵循明确的工具指令"。如果你真正想要的是符合 schema 的 JSON 而不是工具调用，请改用[结构化输出](/docs/api/structured-output)。

<PromptCard title="强制工具调用 → strict 工具 + 明确指令">
{`# Before (Fable 5) — now a 400 on Fable 5.1
"tool_choice": {"type": "tool", "name": "record_summary"}

# After (Fable 5.1)
"tools": [{
  "name": "record_summary",
  "description": "Record the structured summary of the document.",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": {"summary": {"type": "string"}},
    "required": ["summary"],
    "additionalProperties": false
  }
}],
"tool_choice": {"type": "auto"},
"messages": [{"role": "user",
  "content": "Summarize: The meeting moved to Thursday. Call the record_summary tool with your result."}]`}
</PromptCard>

### 2. thinking 块是单向的

现在每个 thinking 块都会记录是哪个模型产生的，而且保留是单向的：**Fable 5.1 可以读取来自 Opus 5、Fable 5、Mythos 5 以及所有更早 Claude 的 thinking 块；它们都无法读取 Fable 5.1 的。** 迁移*到* Fable 5.1 的对话会保留其推理。迁移*离开*它的对话（路由器、回退到 Opus 5、会话中途为省钱而降级）会丢失 Fable 5.1 各轮的推理。

API 的处理方式是：在目标模型看到之前，**丢弃**它读不了的块。被丢弃的块不计费，也不计入 `input_tokens`。没有 `thinking-binding-controls-2026-08-01` beta 请求头时，丢弃是**静默**的；带上该请求头后，丢弃会在顶层的 `input_transformations` 数组中报告。如果你在模型之间做路由，请发送该请求头并记录这个数组。静默丢失推理，正是那种在 bug 报告里表现为"模型在第 12 步之后变笨了"的问题。

### 3. 修改更早的轮次会使 thinking 块失效

这一条值得读两遍。修改 Fable 5.1 thinking 块**之前**的**任何内容**，包括 `system` 提示词、`tools` 数组或任何更早的消息，都会使之后的所有 thinking 块失效。在强制执行检查的地方，下一次请求会被拒绝，返回 400，消息内容为 `The block is bound to a different conversation`。

截至目前的执行规则：

- **2026 年 8 月 31 日及之后创建的账户：** 强制执行。
- **更早的账户：** API 会记录不匹配，但只有在你自己设置了 `thinking.block_binding.prefix_mismatch_behavior` 时才会采取行动。
- **Mythos 5.1** 完全不做这项检查。
- Claude Code、claude.ai、Managed Agents 和 Agent SDK 会替你保持前缀完整。**只有手工构建的 `messages` 数组有风险。**

Anthropic 自己列出的会使块失效的情形，转述出来其实是一份常见智能体框架习惯的清单：

| 使之后所有 thinking 块失效 | 仍保持有效 |
| --- | --- |
| 编辑、重排或删除较早的轮次，同时保留之后的轮次 | 移除开头的一段 thinking 块，从最旧的开始 |
| 在较早的轮次中注入每次请求的提醒或状态行，然后在下一次请求时移除 | 服务端压缩，或裁剪历史的[上下文编辑](/docs/api/memory-and-context-editing) |
| 在同一对话的多次请求之间重新构建顶层的 `system` 或 `tools` | 移动 `cache_control` 标记 |
| 之后返回*不同字节*的图片或文档 URL（检查按字节进行，所以同一文件的轮换签名 URL 没问题） | 在请求之间更改 `effort` |

所有修复都归结为一条规则：**把对话当作仅追加的。** 每轮提醒改用[限定在单轮的系统消息](#限定在单轮的系统消息beta)（见下文）。工具和指令的变更改用[对话中途的系统消息与工具变更](/docs/api/mid-conversation-system-messages)。裁剪改用服务端压缩。若想继续而不是报错，请发送 `thinking-binding-controls-2026-08-01` 请求头并设置 `prefix_mismatch_behavior: "drop_block"`；之后丢弃会在 `input_transformations` 中报告，`reason` 为 `prefix_binding_mismatch`。

Anthropic 部分地把这视为一项**反蒸馏**措施：发布文章称，新的 API 账户不能再在保留对话记录的同时手动编辑先前的上下文，这堵住了一种公开记录过的蒸馏手法。对你的实际好处是，同样的纪律也能让[提示词缓存](/docs/api/prompt-caching)保持热状态。

## 五项新增功能

### 按消息设置 effort（beta）

现在可以在对话中途更改 `effort`，**而不会使提示词缓存失效**。难的一步调高，例行的步骤调低。发送 `mid-conversation-output-config-2026-07-01` beta 请求头，并插入一条只包含 effort 的系统消息；新的级别从下一个用户轮次开始生效。在 Claude API 和 Google Cloud 上，Fable 5.1、Mythos 5.1 和 Opus 5 均支持。

<PromptCard title="在总结轮次降低 effort，同时不破坏缓存">
{`{
  "model": "claude-fable-5-1",
  "max_tokens": 4096,
  "output_config": {"effort": "high"},
  "messages": [
    {"role": "user", "content": "Plan a migration from SQLite to PostgreSQL in three short steps."},
    {"role": "assistant", "content": "1. Export the SQLite data. 2. Create the PostgreSQL schema. 3. Import the data and verify row counts."},
    {"role": "system", "content": [], "output_config": {"effort": "low"}},
    {"role": "user", "content": "Summarize the plan in one sentence."}
  ]
}
# header: anthropic-beta: mid-conversation-output-config-2026-07-01`}
</PromptCard>

这与 [Thinking 与 Effort](/docs/api/thinking-and-effort) 以及 [Effort 调优](/docs/api/effort-tuning)中的 effort 指导相配合：默认值是 `high`，而"整个会话使用同一级别"现在只是偷懒的选择，不再是唯一的选择。

### 限定在单轮的系统消息（beta）

在 `role: "system"` 的消息上设置 `clear_at: "next_user_message"`，它就只在当前轮次拥有系统提示词的权威，一旦后面出现 `user` 消息便不再渲染。你需要继续原样回传它，因此之前的内容都不变，缓存保持命中，之后的 thinking 块依然有效，而且已清除的消息**不消耗输入 token**。请求头：`mid-conversation-system-clear-at-2026-08-21`。

```json
{
  "role": "system",
  "clear_at": "next_user_message",
  "content": "Results have landed in your inbox. Check it before running more code."
}
```

这是对"注入提醒、下次请求再删除"这一模式的官方替代方案，而破坏性变更 3 现在会惩罚这种模式。

### 工具调用之间的进度更新（beta）

与 Fable 5 一样，Fable 5.1 会在工具调用之间写简短的进度说明，每条都是紧挨在调用之前的一个独立 `thinking` 块。在默认的 `thinking.display: "omitted"` 下，这些内容返回时是**空的**，因此一个很长的智能体轮次在用户看来是静默的。新增：`display: "updates"`（请求头 `thinking-display-updates-2026-08-18`）会以文本形式返回进度说明，而推理保持隐藏。此时任何文本非空的 thinking 块都是一条可以渲染的状态行。`"summarized"` 也会返回它们，并与摘要后的推理混在一起。原始思维链依然不会返回。

### 缓存读取每 MTok $0.25

| | 基础输入 | 5 分钟缓存写入 | 1 小时缓存写入 | **缓存读取** | 输出 |
| --- | --- | --- | --- | --- | --- |
| Fable 5 | $10 | $12.50 | $20 | $1.00 | $50 |
| **Fable 5.1** | $10 | $12.50 | $20 | **$0.25** | $50 |

在 Fable 5.1 和 Mythos 5.1 上，缓存读取是基础输入的 0.025 倍，而其他所有 Claude 模型是 0.1 倍。写入价格和 512 token 的最小可缓存提示词不变；批处理仍是 5 折（$5 / $25）。对于每轮都要重新读取一大段缓存前缀的长智能体循环，发布文章里"最多便宜 45%"就来自这里。横向说明：三天后发布、标价同为 $10 / $50 的 OpenAI GPT-6 Astra，缓存读取收费 **$1.00**，是 Fable 5.1 的四倍；参见 [Astra 指南](/docs/models/openai-astra-preview)。

### 内容溯源

所有 Fable 5.1 和 Mythos 5.1 的文本在所有平台上都带有 Anthropic 的统计型文本水印。Claude 生成的文件（例如通过代码执行）在经由 Files API 获取时，会带有已签名的 [C2PA](https://c2pa.org/) Content Credentials。Anthropic 表示，水印不会增加 token 或隐藏字符，不携带任何关于你或你所在组织的信息，也不需要更改请求。背景：Anthropic 于 2026 年 7 月签署了欧盟 AI 法案（EU AI Act）关于 AI 生成内容透明度的行为准则，并面向监管机构、事实核查人员、研究人员以及需要验证的企业，提供处于私有预览阶段的检测 API。

## 无需改代码就会看到的七种行为变化

Anthropic 公开记录了这些变化，每一项在官方的 [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) 指南中都有提示词层面的修复办法。请在用户发现之前，先在评测里留意它们。

<Flashcards cards={[
  { front: "并行工具调用更不稳定", back: "Fable 5 会批量发出多个调用的地方，Fable 5.1 可能每轮只发出一个工具调用，尤其是在 bash 加编辑器的框架和计算机使用场景中，因为后续读取只是被隐含地需要。质量不变；token、往返次数和实际耗时会上升。修复：在系统提示词里加一行'批量发出相互独立的工具调用'。" },
  { front: "长时间工具运行期间的进度更新减少", back: "工具调用之间面向用户的文本更少，effort 越高越明显。修复：把 thinking.display 设为 \"updates\"（beta），删除任何写着'发现先留到最终回答'的提示词行，并明确要求开头一句话、定期更新和结尾回顾。" },
  { front: "低 effort 时更常凭记忆作答", back: "在 effort: low 下，模型调用搜索/检索工具的次数更少。修复：对需要最新数据的轮次提高 effort（按消息设置 effort 让这件事很便宜），或者加一句要求核实的提示。" },
  { front: "行文更密集", back: "部分输出中句子更长，段落分隔更少。修复：明确说明目标的密度和段落长度。" },
  { front: "聊天中的格式更少", back: "使用粗体、标题和列表比早期的 Claude 更少。你为 Opus 4.x 写的反格式规则，现在可能会压制内容所需要的结构。请检查并放宽它们。" },
  { front: "摘要中未标注的引文", back: "更可能原样复述源文章段落而不将其标为引文。修复：要求它标出逐字引用的部分，或对要发布的任何内容事后检查重合度。" },
  { front: "小改动也整文件重写", back: "更可能重写整个文本文件，而不是做有针对性的编辑。结果相同，但输出 token 和时间更多。修复：指示'优先做有针对性的编辑；绝不要为了改一行而重写整个文件'。" },
]} />

## 与 Fable 5 完全一致的部分

如果你已经正确接入了 Fable 5，以下内容都会原样沿用：

- 自适应 thinking 始终开启。带 `budget_tokens` 的 `thinking: {"type": "enabled"}` 和 `{"type": "disabled"}` 都会返回 400。请省略 `thinking`，或发送 `{"type": "adaptive"}`。
- `thinking.display` 默认为 `"omitted"`；原始思维链永远不会返回。
- 交错 thinking 是自动的，无需 beta 请求头。
- 预填充（prefill）返回 400。非默认的 `temperature`、`top_p`、`top_k` 返回 400。
- 拒绝以 HTTP 200 和 `stop_reason: "refusal"` 加 `stop_details.category` 的形式到达；在任何输出之前就到达的拒绝不会计费。允许的回退目标是 **Opus 5 和 Opus 4.8**，而[回退抵扣](/docs/api/server-side-fallbacks)会退还切换时的提示词缓存成本。完整模式见[拒绝与安全](/docs/api/refusals-and-safety)。
- 30 天保留是强制的；来自没有它的组织或工作区的请求会返回 400。两个模型都属于 Covered Models。
- 一处值得知道的差异：**Fable 5.1 和 Mythos 5.1 都不支持 Priority Tier。** Fable 5 支持。如果你购买了优先容量，这是暂时留在 Fable 5 的一个理由。

## 如实解读发布时的基准测试

数字是 Anthropic 的，测试框架也是 Anthropic 的。与 GPT-5.6 Sol 的对比是 OpenAI 最先会提出异议的，而 OpenAI 自己的 GPT-6 Astra 三天后就发布了，所以请把它当作 9 月 1 日的状况，而不是 9 月 14 日的。

| 基准测试 | Fable 5.1 | Fable 5 | Opus 5 | GPT-5.6 Sol |
| --- | --- | --- | --- | --- |
| Terminal-Bench 4.0 | **55.8%**（Mythos 5.1：60.9%） | 42.0% | 52.3% | 37.3% |
| Terminal-Bench-Science 0.1 | **52.6%** | 24.7% | 29.0% | 22.4% |
| GDPval-AA v2（Elo） | **1853** | 1723 | 1824 | 1711 |
| OSWorld 2.0，partial / strict | **77.9% / 41.7%** | 72.9% / 36.1% | 75.4% / 39.6% | — |
| Humanity's Last Exam，无工具 / 有工具 | **60.9% / 65.0%** | 57.8% / 63.8% | 56.6% / 63.6% | — |
| AutomationBench | **31.4%** | 17.1% | 26.9% | 19.6% |
| CursorBench 3.2.0 | **73.4%** | 70.5% | 70.0% | 67.2% |

三点解读，比任何单独一行都更重要：

1. **从 Fable 5 到 5.1 的提升在长周期智能体工作上最大**（Terminal-Bench-Science 翻了一番，AutomationBench 几乎翻了一番）。这与 Anthropic 自己"当更高 effort 的 Opus 5 仍然不够用时再用它"的定位一致：收益在持续数小时的运行上，而不是聊天。
2. **Opus 5 比标题所暗示的更接近**，在好几行上都是如此（Terminal-Bench 4.0：52.3 对 55.8；GDPval：1824 对 1853），而标价只有一半。Anthropic 一再让你先用 Opus 5，是有原因的。
3. **客户引言谈的是 token，而不仅是准确率。** Cognition、Rogo、Browserbase 和 Block 都提到，在结果相同或更好的情况下 token 更少。结合 $0.25 的缓存读取，"同样的工作 Fable 5.1 比 Fable 5 更便宜"比"Fable 5.1 更聪明"这个说法更站得住脚。

发布文章中的科学案例（在 12 个靶点上命中率约 50% 的蛋白质结合剂，而典型水平为 10–15%；利用 30 年前的 Magellan 雷达数据绘制的 2–3 公里分辨率金星高程图；七个开源基因组学模型上 2.5 倍的提速）是 Anthropic 报告的研究成果，不是基准测试。对研究类工作负载是有趣的信号，但不能作为采购依据。

## Fable 5.1 vs Opus 5 vs Fable 5：如何选择

| 你的情况 | 选择 | 原因 |
| --- | --- | --- |
| 大多数生产工作，对成本敏感 | **Opus 5.5** | Anthropic 自己自 2026 年 9 月 22 日起的默认推荐（在这一位置取代了 Opus 5）；价格只是标价的一小部分；参见[当前模型与定价](/docs/whats-new/models-and-pricing) |
| 持续数小时的自主编码、研究，或文档/电子表格/幻灯片制作，且 `high` effort 的 Opus 5 仍然达不到 | **Fable 5.1** | 最大的提升正出现在这里；缓存读取让长循环比 Fable 5 更便宜 |
| 你依赖 Priority Tier | **Fable 5**（暂时） | Fable 5.1 和 Mythos 5.1 不在 Priority Tier 上 |
| 你强制使用 `tool_choice`，且本迭代无法修改框架 | **Fable 5** | Fable 5.1 会返回 400；先迁移框架，再迁移模型 |
| 你在对话中途于模型之间路由或回退 | 任意，但要**发送 thinking-binding 请求头** | 否则从 Fable 5.1 降级时会静默丢弃它的推理 |
| 合同规定必须零数据保留 | **Opus 5.5**，或任意 Opus | Fable 5.x 和 Mythos 5.x 要求 30 天保留，且不符合 ZDR 资格 |
| 需要更少分类器干预的防御性网络安全或生命科学研究 | **Mythos 5.1**，如果你的组织已通过验证 | 同一模型，不同的安全防护配置；请申请 Cyber Verification Program（三个层级），而不是等待邀请 |

## 迁移清单

Anthropic 提供了一个内置技能，能在 Claude Code 中完成其中大部分工作。先运行它，再核实它看不到的项目。

<PromptCard title="自动完成 ID 替换和参数修复">
{`/claude-api migrate this project to claude-fable-5-1`}
</PromptCard>

<Steps items={[
  { title: "替换 ID 并 grep 强制的 tool_choice", body: "claude-fable-5 → claude-fable-5-1（Bedrock：anthropic.claude-fable-5-1）。然后 grep 类型为 any 或 tool 的 tool_choice。每个命中项都改为 strict: true + additionalProperties: false + 明确的'调用 X 工具'指令，或改用结构化输出。别忘了 token 计数调用：它们同样会校验。" },
  { title: "运行历史编辑检查", body: "如果你的代码自己构建 messages 数组，请带着 thinking-binding-controls-2026-08-01 请求头和 prefix_mismatch_behavior: \"drop_block\" 跑一次真实会话，并记录 input_transformations。每一条 prefix_binding_mismatch 记录都对应一个你在编辑历史的地方。从源头修复：每轮提醒 → 限定在单轮的系统消息；system/tools 变更 → 对话中途的系统消息；裁剪 → 服务端压缩。然后有意识地选定生产环境的 prefix_mismatch_behavior。" },
  { title: "审计路由和回退路径", body: "对话可能从 Fable 5.1 转到 Opus 5、Fable 5 或更早模型的每个位置，都要判断丢失 Fable 5.1 的推理是否可以接受。发送 binding 请求头，让丢弃至少能被报告出来。确认你的回退目标是 Opus 5 或 Opus 4.8（仅有的两个允许项）。" },
  { title: "重新调整 effort，并考虑按消息设置 effort", body: "默认是 high。对于长循环，添加 mid-conversation-output-config-2026-07-01 beta，在例行轮次降低 effort；在需要最新检索的轮次提高它，因为 low effort 更常凭记忆作答。" },
  { title: "加入智能体循环的提示词行", body: "一行要求批量发出相互独立的工具调用；一行要求开头一句话、定期更新和结尾回顾（如果你的 UI 展示进度，就把 thinking.display 设为 updates）；一行要求优先做有针对性的编辑而不是整文件重写。放宽任何为 Opus 4.x 编写的反格式规则。" },
  { title: "重新运行评测并重新检查成本", body: "拒绝、回退、回退抵扣和分词器都没有变化，所以你看到的差异是真实的行为差异。比较前后的缓存读取开销：如果没有下降，说明你的前缀不稳定，第 2 步还没有做完。" },
]} />

## Mythos 5.1：同一个模型，不同的安全防护

Anthropic 表示 Fable 5.1 和 Mythos 5.1 是**同一个底层模型，只是安全防护配置不同**，规格和定价相同。Mythos 5.1 只提供给通过 Anthropic 验证计划验证的组织：面向防御性安全工作的 **Cyber Verification Program**，以及面向生物工作的 Life Sciences Verification Program。在安全防护方面，有两处变化对*所有人*生效：Fable 5.1 现在被允许为防御目的识别软件漏洞（Anthropic 报告每个会话的网络安全防护干预减少约 60%），而渗透测试、漏洞利用生成和二进制漏洞扫描等双重用途任务仍会被重定向到 Opus 模型；并且对于无害的基础生物学和医学问题，生物安全防护的触发减少约 85%。Mythos 5.1 还会跳过 thinking 块的对话绑定检查。如果你没有通过验证，Anthropic 的指示很简单：使用 Fable 5.1。

<VerifyNote lastVerified="2026-10-21" source="https://support.claude.com/en/articles/14604842">
获得验证是一次**申请，而不是邀请**：这在 2026 年 10 月 6 日发生了变化，当天 Project Glasswing 被重组为 Cyber Verification Program 的三个层级：**Defense Access**（组织，以及付费套餐的个人）、**Red Team Access**（仅限组织）和 **Specialized Access**（仅限组织，与美国政府合作审核，现有 Glasswing 成员被归入此层级）。每个层级都提供 Opus 5.5、Sonnet 5.5 和 Mythos 5.1。请通过 `portal.anthropic.com/programs` 的 Verification Portal 申请；决定通常在七个工作日内送达。资格取决于防御是否是你的实际业务："Organizations whose main business falls outside that scope may not be eligible."
</VerifyNote>

注意命名：[Fable 5 指南](/docs/models/fable-5-mythos-5-flagship)把 Mythos 5 解释为"没有安全分类器的 Fable 5"。对于 5.1，Anthropic 的措辞是"不同的安全防护配置"，而且 Mythos 5.1 仍在为 Anthropic 自己的 Claude Security 产品提供支持。把它当作配置不同的部署，而不是不受过滤的版本。

## 快速检测

<Quiz questions={[
  {
    q: "你把一个 Fable 5 集成迁移到 claude-fable-5-1，现在每个 tool_choice 类型为 \"tool\" 的请求都失败了。官方认可的修复方法是什么？",
    options: [
      "添加 thinking-binding-controls beta 请求头",
      "保持 tool_choice 为 auto，在工具上设置 strict: true 并加上 additionalProperties: false，并在提示词里告诉模型何时调用它（或改用结构化输出）",
      "把 thinking 设为 disabled，让强制调用得以进行",
      "降级到 effort: low"
    ],
    answer: 1,
    explain: "Fable 5.1 对 tool_choice any 和 tool 返回 400，因为强制调用会跳过始终开启的 thinking，把推演推进到参数里。Anthropic 的修复是使用 auto 加明确指令的 strict 工具调用，或者结构化输出。在这个模型上禁用 thinking 本身就是 400。"
  },
  {
    q: "路由器为了省钱，把对话从 Fable 5.1 降级到 Opus 5。Fable 5.1 的 thinking 块会怎么样？",
    options: [
      "Opus 5 正常读取它们",
      "请求以 400 失败",
      "API 在 Opus 5 看到之前丢弃它们；除非你发送 thinking-binding-controls-2026-08-01 请求头，否则丢弃是静默的，带上请求头后会在 input_transformations 中报告",
      "它们被转换为文本块"
    ],
    answer: 2,
    explain: "保留是单向的：Fable 5.1 能读取早期模型的 thinking；早期模型无法读取 Fable 5.1 的。读不了的块会被丢弃且不计费，默认是静默的，带上 beta 请求头则会在 input_transformations 中报告。"
  },
  {
    q: "你的智能体循环在每次请求时，都会在上一个用户轮次里注入一行状态提醒，并在下一次请求时移除。在新的 API 账户上，这现在会报错。用什么来替代？",
    options: [
      "带 clear_at: \"next_user_message\" 的限定在单轮的系统消息（beta 请求头 mid-conversation-system-clear-at-2026-08-21）",
      "每次请求都重新构建系统提示词",
      "把提醒放进 tool_choice",
      "切换到 Mythos 5.1"
    ],
    answer: 0,
    explain: "修改 Fable 5.1 thinking 块之前的任何内容，都会使之后的块失效。限定在单轮的系统消息只在一个轮次内具有系统权威，原样保留在历史中，清除后不消耗输入 token，并让缓存和 thinking 块都保持有效。"
  },
  {
    q: "Fable 5.1 保持了 Fable 5 的 $10 / $50 标价。Anthropic 所说的'高度智能体化的工作最多便宜 45%'来自哪里？",
    options: [
      "批处理折扣提高到 75%",
      "缓存读取从每 MTok $1.00 降到 $0.25（基础输入的 0.025 倍而不是 0.1 倍），再加上每个任务使用的 token 更少",
      "更小的分词器",
      "免费的 thinking token"
    ],
    answer: 1,
    explain: "唯一变化的价格项是缓存读取，现在是 Fable 5 费率的四分之一。每轮都要重新读取缓存前缀的长循环，正是这一点被不断放大的地方；Anthropic 的客户也报告每个任务的 token 更少。"
  }
]} />

## 要点回顾

<Callout type="takeaways" items={[
  "只有在你从不强制 tool_choice、从不编辑对话历史、也从不把 thinking 块路由给更旧模型的情况下，Fable 5.1 才能直接替代 Fable 5。替换 ID 之前，先 grep 这三种情况。",
  "把对话当作仅追加：每轮提醒用限定在单轮的系统消息，指令和工具变更用对话中途的消息，裁剪用服务端压缩。这样既能保持 thinking 块有效，又能让缓存保持热状态。",
  "定价的重点是便宜的缓存读取，而不是标价：长智能体循环会变便宜，短对话不会。当前的 Opus——自 2026 年 9 月 22 日起是 Opus 5.5——仍然是 Anthropic 自己说的'从这里开始'，价格只是 Fable 5.1 的一小部分。当前数字见：/docs/whats-new/models-and-pricing。",
  "预期会看到并行工具调用减少、旁白减少、行文更密集和整文件重写；每一项都有一行提示词的修复办法，而 thinking.display: \"updates\" 能恢复可见的进度。",
  "Priority Tier 和 ZDR 是留在 Fable 5，或者改用 Opus 模型的两个合同层面的理由。",
]} />

## 下一步

- [Claude Fable 5 与 Mythos 5：旗舰指南](/docs/models/fable-5-mythos-5-flagship) — 沿用不变的拒绝 / 回退接线方式
- [对话中途的系统消息](/docs/api/mid-conversation-system-messages) — 本次发布所默认的仅追加工具集
- [GPT-6 Astra：面向 Claude 用户的指南](/docs/models/openai-astra-preview) — 三天后以相同标价发布的竞争对手
