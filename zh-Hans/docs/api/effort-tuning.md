# effort 调优：5 个级别、各模型默认值与缓存陷阱

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/api/effort-tuning · AILmanac (CC BY 4.0) · last verified 2026-10-19

2026 年 7 月的 effort 参数有五个级别——low、medium、high、xhigh、max——并且位于 output_config 内部，而不是顶层。它影响工具调用（而不仅是思考），在对话中途更改会使提示缓存失效，并且每个模型的推荐起点各不相同。实用的调优指南。

<LevelBadge level="intermediate" />

**2026 年 7 月 22 日**，Anthropic 将 `effort` 纳入 Claude Managed Agents 的模型配置，为 Messages API 悄悄扩展到五个级别的这一控制项画上了圆满句号。如果你仍在照搬 2026 年初某篇博客里放在 `messages.create` 顶层的 `effort="high"`，请求看起来有效，但 Claude 可能并没有遵循你以为的那个字段：该参数现在位于 `output_config` 内部，而且 API 只执行模型卡片上记录的级别。

这是一份实用的调优指南：`effort` 在请求中到底放在哪里，五个级别真正做了什么（它们改变的是工具调用次数，而不仅是思考深度），那些会让人意外的各模型默认值，以及一个会悄悄推高开支的陷阱——在对话中途更改 effort 会使提示缓存失效。

<Callout type="objectives" items={[
  "正确放置 effort 字段——Messages API 中放在 output_config 内，Managed Agents 中放在 model 对象内，Claude Code 中使用 /effort 或 CLAUDE_CODE_EFFORT_LEVEL",
  "按模型选择起始级别——high 是大多数模型的 API 默认值，但 Opus 5.5 和 Haiku 5.5 默认是 medium，而且推荐的起始 effort 还各不相同（Sonnet 5.5 做智能体式编码用 medium，Sonnet 4.6 用 medium，Opus 4.7/4.8 用 xhigh，Fable 5.1 用 high）",
  "理解 effort 影响所有 token——文本、工具调用以及（启用时的）思考——因此降低 effort 会减少工具调用次数，而不只是减少啰嗦程度",
  "避开缓存陷阱——在同一对话内改变 effort 会使提示缓存失效，并可能悄悄让账单翻倍",
  "了解 Claude Code 的 effort 相关功能——/effort、ultrathink（仅一轮）、ultracode（xhigh + 长期多智能体授权）、环境变量 CLAUDE_CODE_EFFORT_LEVEL 覆盖",
]} />

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/build-with-claude/effort">
已对照 Anthropic 官方 effort 文档核实。各模型默认值、`xhigh`/`max` 的可用模型列表，以及按消息设置 effort 的测试版状态和模型覆盖范围，都会随版本而变化——在生产中固定行为之前，请重新核对原始来源。
</VerifyNote>

## 五个级别（以及“ultracode”的位置）

截至 2026 年 7 月 22 日，effort 量表有 API 接受的**五个**取值：

| 级别 | 作用 | 何时使用 |
|---|---|---|
| `low` | 最高效。大幅节省 token，能力略有下降。工具调用更少，确认简短，没有开场白。 | 简单分类、高吞吐工作负载、聊天、对延迟敏感的用户体验、处理范围明确任务的子智能体 |
| `medium` | 均衡。相比 high 适度节省 token。 | 需要在速度、成本和质量之间取得平衡的智能体任务；从 high 降一档以控制成本 |
| `high` | 高能力。**等同于省略该参数——除 Opus 5.5 和 Haiku 5.5 外的所有模型都如此，这两个模型默认为 `medium`。** | 复杂推理、高难度编码、质量比速度更重要的智能体任务 |
| `xhigh` | 面向长周期工作的扩展能力。预期 token 用量明显高于 high。 | 长时间运行（30 分钟以上）的智能体和编码任务、百万级 token 预算、跨多个文件的深度重构 |
| `max` | 绝对最大能力，对 token 开销不设约束。 | 仅限真正的前沿问题。在结构化输出任务上可能想得过多。 |

`max` 和 `xhigh` 都不是通用的——发布前请对照模型核实级别。`xhigh` 支持 **Fable 5.1、Mythos 5.1、Fable 5、Mythos 5、Opus 5.5、Opus 5、Opus 4.8、Opus 4.7、Sonnet 5.5、Sonnet 5 和 Haiku 5.5**。`max` 涵盖以上所有模型，外加 **Mythos Preview、Opus 4.6 和 Sonnet 4.6**。Opus 4.5 支持 effort，但不支持最高的两个级别。用 Anthropic 的话说："Not every model that supports `max` supports `xhigh`."

<Callout type="tip" items={[
  "把 effort 设为该模型自己的默认值，效果与省略该参数完全相同——大多数模型是 'high'，但 Opus 5.5 和 Haiku 5.5 是 'medium'。在带缓存的对话中不要“为了明确”而设置它，因为在某些请求中写这个字段、在另一些请求中不写，会使缓存失效。",
  "'ultracode' 不是第六个级别。它是 xhigh，外加通过对话中途的系统消息授予 Claude Code 启动多智能体工作流的长期许可。API 接受五个取值。",
]} />

## 多数博客写错的字段结构

2026 年初关于 effort 参数的文章展示的是一个顶层字段：

```python
# WRONG on current models — silently ignored or 400
client.messages.create(
    model="claude-opus-4-8",
    effort="medium",
    ...
)
```

当前的 API 把 `effort` 放在 `output_config` 对象内部，并将其作为 `messages`/`model` 的同级字段传入：

<PromptCard title="effort 的正确放置方式——Messages API">
{`import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    output_config={"effort": "medium"},
    messages=[{
        "role": "user",
        "content": "Analyse the trade-offs between microservices and monoliths."
    }],
)

print(response.content[0].text)`}
</PromptCard>

在 Claude Managed Agents 上（2026 年 7 月 22 日的变更），`effort` 在创建智能体时放入智能体的 `model` 对象内。它不是由会话设置的，而是由智能体版本设置的。

<PromptCard title="effort 的正确放置方式——Managed Agents (POST /v1/agents)">
{`# Effort travels with the versioned agent config,
# not the per-run session. Every session pinned to
# this agent version runs at xhigh.

POST https://api.anthropic.com/v1/agents
{
  "name": "code-reviewer",
  "model": {
    "id": "claude-opus-4-8",
    "effort": "xhigh"
  },
  "system_prompt": "You review pull requests for security issues.",
  "tools": [...],
  "mcp_servers": [...]
}`}
</PromptCard>

## effort 不是思考控制项

这是第二个常见误解。无论是否启用思考，effort 都会起作用，并且会改变 Claude 在回复中非思考部分花费的 token：

- **工具调用。** effort 越低 → 调用越少。Claude 会把多个操作合并为一次调用，跳过可选的探索，不加开场白直接行动。
- **文本长度。** effort 越低 → 输出越紧凑。工具调用后只给简短确认，而不是详细总结。代码注释更少。
- **思考深度**（思考开启时）。effort 越低 → 在简单提示上完全跳过思考；在真正困难的提示上仍会思考，只是更少。

最后一点很重要：在 `low` effort 下，Claude 遇到证明题仍然会思考，因为任务需要。effort 是一种*行为信号*，而不是严格的 token 预算。不要指望有硬性上限。

`thinking` 参数和 `effort` 参数回答的是不同的问题。`thinking` 决定 Claude 是否生成思考块。`effort` 决定整个回复投入多少工作——包括启用自适应思考时 Claude 思考的频率和深度。传入 `effort="adaptive"` 是常见错误；`adaptive` 是一种*思考模式*，不是 effort 级别。

<Callout type="tip">
在 <strong>Opus 4.5</strong>（唯一支持 effort 的仅扩展思考模型）上，你需要同时设置 effort <em>和</em> `budget_tokens`。先为任务选择 effort 级别，再按推理深度确定思考 token 预算。其他所有支持 effort 的模型都使用自适应思考，不接受 `budget_tokens`。
</Callout>

## 常让团队意外的各模型起点

在大多数支持 effort 的模型上，API 默认值是 `high`——**但并非全部。Opus 5.5 和 Haiku 5.5 默认是 `medium`。** 此外，Anthropic 的*推荐起始 effort* 因模型而异，团队正是在这种不一致上多花或少花了钱。

<Steps items={[
  {title: "Opus 5.5——默认值是 medium，不是 high", body: "Opus 5.5 是唯一默认 medium 的 Opus，因此省略 effort 的请求，其运行级别比同样代码在 Opus 5 上低一档。如果迁移后质量下降，先检查这一点。自适应思考始终开启且无法关闭（thinking: {type: 'disabled'} 在任何级别都会返回 400），所以 effort 是你控制它推理多少、请求花费多少的唯一手段。请重新做一次 effort 扫描，而不是沿用原有设置——同一级别下，它每轮思考得比 Opus 5 更多。"},
  {title: "Haiku 5.5——同样默认 medium，low 是省钱档", body: "另一个默认 medium 的模型，也是第一个支持 effort 的 Haiku。大多数工作（包括智能体式编码）从 medium 起步。low 最便宜最快，适用于聊天、简短的工具任务和简单的高吞吐请求，但要知道代价：在较长的智能体提示中使用 low，更可能跳过搜索、过早停止或省略检查。知识类工作、较长的智能体任务和严格遵循指令的场景请提到 high。在定案之前，请把 xhigh/max 与 Sonnet 5.5 比较成本和速度。"},
  {title: "Fable 5.1 和 Sonnet 5.5——high 仍是默认", body: "两者默认都是 high，并支持全部五个级别。Fable 5.1 从 high 起步，对最依赖能力的智能体和编码工作提到 xhigh/max，等评测显示质量仍然稳住后再降到 medium/low。Sonnet 5.5 的级别相对 Sonnet 5 经过了重新校准——同一级别不再对应相同的思考量，因此请重新扫描。Sonnet 5.5 做智能体式编码时，规格清晰的任务从 medium 起步，更难的任务提到 high；智能体式编码请把 max_tokens 设为该模型的最大值 128,000，并使用流式输出。"},
  {title: "Sonnet 5——从 high（默认值）起步", body: "Sonnet 5 在 API 和 Claude Code 中默认都是 high，推荐也一致。仅在最难的编码和智能体任务上提到 xhigh。为节省成本可降到 medium——Sonnet 5 的 medium 与 Sonnet 4.6 的 high 相当。聊天和对延迟敏感的非编码工作负载使用 low。"},
  {title: "Sonnet 4.6——从 medium 起步，覆盖默认值", body: "Sonnet 4.6 默认是 high，但 Anthropic 自己的指导建议对大多数应用（包括智能体式编码）把 medium 作为均衡的默认值。请显式设置 effort='medium'——否则你会继承 high，为你并未要求的延迟买单。"},
  {title: "Opus 4.7 和 4.8——编码从 xhigh 起步，其他从 high 起步", body: "默认值是 high，但编码和智能体工作的推荐值是 xhigh。对依赖智能水平的工作负载，以 high 作为下限。只有评测显示质量仍然稳住时才降到 medium。把 max 留给真正的前沿问题——在大多数工作负载上，max 为很小的质量提升增加了可观的成本，在结构化输出任务上还可能想得过多。"},
  {title: "Opus 4.7 对 low/medium 的执行更严格——需要深度时请在提示中说明", body: "Opus 4.7（及 4.8）在 low/medium 下界定工作范围比 Opus 4.6 更窄。如果在 low 下遇到复杂提示的推理很浅，请提高 effort，而不是靠提示绕过。如果延迟迫使你停留在 low，可以加一句有针对性的话，例如 'This task involves multistep reasoning. Think carefully before responding.'"},
  {title: "Fable 5 和 Mythos 5——high 是主要控制项", body: "在 Fable 5 上，effort 是调节智能、延迟和成本的主要杠杆。从 high（默认值）起步，最依赖能力的工作用 xhigh，常规任务降到 medium 或 low——Fable 5 上较低的级别，仍然超过以往模型在 xhigh 下的表现。在 high/xhigh 下请设置较大的 max_tokens，因为它同时限制思考和回复文本的总量。"},
  {title: "xhigh 或 max 下的 Opus 4.7/4.8——把 max_tokens 提高到至少 64k", body: "在 xhigh/max 下，这两个模型会在子智能体和工具调用上大量消耗。Anthropic 建议从 max_tokens 64k 起步再调整。如果保持 4096，在一个有希望的开头之后，你会得到一个 stop_reason='max_tokens' 的被截断回复。"},
]} />

## 缓存陷阱——悄悄让账单翻倍的那个

提示缓存让缓存读取只需标准输入价格的一小部分（大多数模型是十分之一，最新的模型更低——见 [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)）。在同一对话的请求之间更改**顶层** `output_config.effort` 会**使缓存失效**，与切换模型完全一样：顶层 effort 会影响渲染后的提示，因此新值意味着没有任何缓存前缀能匹配。在长上下文中，这意味着每一轮后续对话都要按全价重新读取你的整个历史。

### 出路：按消息设置 effort（测试版）

最新的模型允许你在*不*丢失缓存的情况下更改 effort。添加一条 `role: "system"` 消息，`content` 为空，并在 `output_config.effort` 中带上新级别，此前的一切保持逐字节相同——因此缓存前缀仍然匹配。

<PromptCard title="在对话中途更改 effort 而不丢缓存">
{`# Beta header required:
#   anthropic-beta: mid-conversation-output-config-2026-07-01

{
  "model": "claude-fable-5-1",
  "max_tokens": 4096,
  "output_config": {"effort": "high"},
  "messages": [
    {"role": "user", "content": "Plan a migration from SQLite to PostgreSQL."},
    {"role": "assistant", "content": "1. Export... 2. Create schema... 3. Import."},
    {"role": "system", "content": [], "output_config": {"effort": "low"}},
    {"role": "user", "content": "Summarize the plan in one sentence."}
  ]
}`}
</PromptCard>

截至 2026 年 10 月 19 日的可用性：在 Claude API 和 Google Cloud 上，支持 **Fable 5.1、Mythos 5.1、Opus 5.5、Opus 5、Sonnet 5.5 和 Haiku 5.5**；在 Amazon Bedrock 上仅支持 **Fable 5.1、Mythos 5.1 和 Opus 5.5**。需要测试版请求头 `mid-conversation-output-config-2026-07-01`——没有它，按消息设置的 `output_config` 会返回 `400 messages.N.output_config: Extra inputs are not permitted`。带上请求头但使用不受支持的模型（包括 Fable 5），则会得到 `400 output_config.effort requires a model that supports per-turn effort; this model does not`。

有两个模型在思考被固定时拒绝按轮更改 effort：**使用 `thinking: {"type": "between_tools"}` 的 Sonnet 5.5** 和 **使用 `thinking: {"type": "disabled"}` 的 Haiku 5.5**，如果按消息设置的级别与当前生效的不同，会返回 400。在这些情况下请使用自适应思考来改变 effort。

对于其他所有情况，旧规则依然适用——选定一个级别并保持不变：

<Callout type="tip" items={[
  "在不支持按消息设置 effort 的模型上，应在不同工作负载之间改变 effort，而不是在带缓存的对话内部。在对话开始时选定级别，并保持不变直到 /clear。",
  "即使两种方式都可行，也优先使用按消息设置的 effort，而不是顶层更改：在 Fable 5.1 上，顶层切换对模型的引导也不够可靠，因为它先前的回复是按旧级别写成的，倾向于与之保持一致。",
  "在 Claude Code 中，会话中途使用 /effort 等同于切换模型——预期下一轮会出现大规模缓存未命中。",
  "如果只想为某一轮提升深度，请在 Claude Code 中使用 'ultrathink'（仅一轮的更深度推理加成），而不是 /effort xhigh——这样不会更改会话配置。",
  "如果必须为会话剩余部分提升，请尽早做。第 3 轮切换很便宜；第 30 轮切换则要按全价重新读取 30 轮上下文。",
]} />

由此推论：在某些带缓存的请求中显式设置 `effort="high"`，而在其他请求中省略，同样会使缓存失效——因为两者在*行为上*等价，但在*文本上*不同。请选定一种约定（总是设置，或总是省略）并坚持下去。

## Claude Code——命令行界面

Claude Code 以交互命令、启动参数和环境变量三种方式提供 effort（优先级最高者生效，按相反顺序）：

```bash
# In-session (interactive slider, or direct)
/effort
/effort xhigh
/effort auto           # reset to model default

# At launch
claude --effort low

# Environment (overrides everything else)
CLAUDE_CODE_EFFORT_LEVEL=high claude
```

有两个相关命令值得了解，因为它们不是 effort 级别，但行为与之相近：

- **`ultrathink`**——仅限一轮的更深度推理加成，*不会*更改会话的 effort。当你希望下一轮想得更努力，又不想使后续所有轮次的缓存失效时使用。
- **`ultracode`**——将整个会话设为 `xhigh`，**并**授予 Claude Code 启动多智能体工作流的长期许可（通过对话中途的系统消息）。API 没有 `ultracode` 这个值——它是 CLI 提供的便利功能，把 `xhigh` 与编排许可组合在一起。

需要记住的持久化规则：`low`、`medium`、`high` 和 `xhigh` 一旦设置，会跨 Claude Code 会话保留。`max` 仅适用于当前会话——下次需要重新设置。

## 一次调优演练——同一个提示，三种 effort

为了校准直觉，用三个级别运行*同一个*提示，比较输出的形态：

<PromptCard title="调优校准提示（分别在 low、high、xhigh 下运行）">
{`Task: Review this pull request for security issues.

<pr_diff>
[paste a real diff — 300+ lines, multi-file, at least one auth-touching change]
</pr_diff>

Report: severity-tagged findings + a one-line fix per finding.
Do not restate what the diff does.`}
</PromptCard>

大致预期如下：

- **low**——能发现明显的高严重度问题（SQL 字符串拼接、请求头中未检查的用户输入）。会漏掉细微的逻辑缺陷。有工具时调用 1-2 次。输出简短。很快。
- **high**——完整分析。能发现大多数漏洞，包括细微的。多次有针对性的工具调用来读取相关文件。结构化的发现。大多数团队就停在这里。
- **xhigh**——详尽。会考虑新颖的攻击向量和纵深防御。会读取 low/high 没有碰过的相邻文件。工具调用多得多。token 用量明显更高。

如果你的评测显示 `high` 和 `xhigh` 在你的代码库上给出相同的发现，就以 `high` 发布。xhigh 的价值恰恰体现在任务能从重复的工具调用和详细探索中获益的时候——这正是 Anthropic 推荐它的场景。

## Sonnet 5 移动了校准——不要盲目沿用级别

如果你原来以 `high` 运行 Sonnet 4.6，并迁移到了 Sonnet 5，保持同一级别会让 Sonnet 5 的花费更接近 Sonnet 4.6 在 `max` 下的花费——Sonnet 5 的 effort 量表发生了*偏移*。Anthropic 自己的指导：**Sonnet 5 medium ≈ Sonnet 4.6 high**。如果你在没有调整 effort 的情况下回放了流量，这是值得检查的单次请求成本差异。完整的迁移故事见 [Sonnet 5 实战指南](/docs/models/sonnet-5-field-guide)。

## 巩固一下

<Flashcards cards={[
  {front: "在 Messages API 上，effort 字段放在哪里？", back: "放在 messages.create 顶层的 output_config 对象内——output_config: {effort: 'medium'}。不是顶层的 effort 参数。"},
  {front: "effort 的五个级别是什么？", back: "low、medium、high、xhigh、max。high 是大多数模型的默认值——但 Opus 5.5 和 Haiku 5.5 默认是 medium。"},
  {front: "哪些模型默认的 effort 是 medium 而不是 high？", back: "Opus 5.5 和 Haiku 5.5。在 Opus 5.5 上，这意味着从 Opus 5 迁移来的代码，除非显式设置 effort，否则运行级别低一档。"},
  {front: "effort 除了思考之外还影响别的吗？", back: "是的——它影响回复中的所有 token：文本、工具调用（effort 越低 → 调用越少），以及启用时的思考。"},
  {front: "如果在对话中途更改 effort 会怎样？", back: "更改顶层 effort 会使提示缓存失效，与切换模型一样。按消息的形式——一条 content 为空、带新 output_config.effort 的 role:'system' 消息，配合 mid-conversation-output-config-2026-07-01 测试版请求头——可在 Fable 5.1、Mythos 5.1、Opus 5.5、Opus 5、Sonnet 5.5 和 Haiku 5.5 上保留缓存。"},
  {front: "'ultracode' 是第六个 effort 级别吗？", back: "不是。Ultracode 是 Claude Code CLI 的便利功能，它设置 xhigh 并授予多智能体编排的长期许可。API 只接受文档中记录的五个级别。"},
  {front: "Opus 4.7/4.8 做编码任务的推荐 effort 是什么？", back: "xhigh——并把 max_tokens 提高到至少 64k，让模型有空间在各子智能体之间推理和调用工具。"},
  {front: "Sonnet 5 的 effort 量表与 Sonnet 4.6 相比如何？", back: "发生了偏移。Sonnet 5 的 medium 大致相当于 Sonnet 4.6 的 high。迁移时不要把 effort 级别一一照搬。"},
  {front: "在 Claude Managed Agents 上，effort 放在哪里？", back: "放在创建智能体时（POST /v1/agents）版本化智能体配置里的 model 对象内——不是按会话设置。2026 年 7 月 22 日推出。"},
]} />

<Quiz title="自我检测" questions={[
  {q: "以下哪一项不是 Messages API 上有效的 effort 取值？", options: ["low", "medium", "adaptive", "xhigh"], answer: 2, explain: "'adaptive' 是思考模式，不是 effort 级别。五个有效取值是 low、medium、high、xhigh、max。"},
  {q: "你在运行一个带缓存的 20 轮对话，并在第 21 轮把顶层 effort 从 high 改成 xhigh。会发生什么？", options: ["什么也不会发生——effort 是不触及缓存的运行时提示", "下一次请求略贵一些，因为 Claude 想得更多", "下一次请求会使缓存失效，并按全额输入价格重新读取之前的全部 20 轮", "API 返回 400，因为 effort 不能在对话中途更改"], answer: 2, explain: "顶层 effort 会影响渲染后的提示，因此更改它会像切换模型一样使提示缓存失效。在较长的历史上，这可能使下一轮的输入费用增加到 10 倍。按消息的形式（在 mid-conversation-output-config-2026-07-01 测试版之下的 role:'system' 消息）在最新模型上可避免这一点。"},
  {q: "你使用 Opus 5.5，并完全省略 effort 参数。实际运行哪个级别？", options: ["high——所有模型的 API 默认值", "medium——Opus 5.5 是默认 medium 的两个模型之一", "low——省略 effort 会把开销降到最低", "xhigh——Opus 模型在编码时默认是 xhigh"], answer: 1, explain: "Opus 5.5 和 Haiku 5.5 默认是 medium；其他所有支持 effort 的模型默认是 high。因此，从 Opus 5 迁移来的代码，除非显式设置 effort，否则运行级别比以前低一档。"},
  {q: "你在使用 Claude Code，想让“下一轮”想得更努力，又不想动会话的 effort 设置。最佳做法是？", options: ["/effort max，轮次结束后再 /effort auto", "仅为那一轮使用 ultrathink", "用 --effort xhigh 重启 Claude Code", "在子 shell 中设置 CLAUDE_CODE_EFFORT_LEVEL=max"], answer: 1, explain: "ultrathink 正是为此设计的——仅限一轮的更深度推理加成，不会改变会话 effort，因此也不会使后续轮次的缓存失效。"},
  {q: "在 Opus 4.8 上以 effort='xhigh' 运行，你的回复在长时间思考后一直以 stop_reason='max_tokens' 被截断。最可能的解决办法是？", options: ["把 effort 降到 high", "把 max_tokens 提高到 64k 或更高", "关闭思考", "改用 Opus 4.7"], answer: 1, explain: "max_tokens 同时限制思考和回复文本的总量。在 xhigh 下，Anthropic 建议从 max_tokens 64k 起步。按“只有答案”设定的上限，会截断涉及大量内部推理的回复。"},
  {q: "创建 Claude Managed Agents 智能体时（2026 年 7 月的更新），effort 放在哪里？", options: ["每个会话的 POST /v1/sessions 上", "POST /v1/agents 上的顶层字段", "POST /v1/agents 的 model 对象内", "对话中途的系统消息里"], answer: 2, explain: "2026 年 7 月 22 日的更新允许在创建智能体时，把 'effort' 放入 model 对象内传入。会话继承所固定智能体版本的 effort——无需每次运行都设置。"},
  {q: "哪个变化使 Sonnet 5 的 'medium' 最接近 Sonnet 4.6 在 'high' 下的表现？", options: ["Sonnet 5 使用了更小的上下文窗口", "两个模型之间的 effort 量表发生了偏移", "Sonnet 5 在 medium 下禁用工具使用", "medium 在 Sonnet 5 上被重命名了"], answer: 1, explain: "Anthropic 自己的指导：Sonnet 5 medium ≈ Sonnet 4.6 high。迁移时不要把 effort 级别一一照搬。"}
]} />

## 来源与延伸阅读

- [Anthropic — Effort (build-with-claude/effort)](https://platform.claude.com/docs/en/build-with-claude/effort) —— 关于五个级别、`output_config.effort` 以及各模型推荐的权威参考
- [Anthropic — Thinking (build-with-claude/thinking)](https://platform.claude.com/docs/en/build-with-claude/thinking) —— effort 如何与自适应思考相互作用，以及何时选用哪种控制
- [Anthropic Platform 发布说明——2026 年 7 月 22 日条目](https://platform.claude.com/docs/en/release-notes/overview) —— Managed Agents 的 `effort` 上线，以及同日发布的 webhook 和会话预置变更
- [Prompting Claude Sonnet 5——校准 effort 与思考深度](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5) —— Sonnet 5 的 effort 量表偏移，以及何时使用 xhigh
- [Anthropic — Task budgets](https://platform.claude.com/docs/en/build-with-claude/task-budgets) —— 面向完整智能体循环的建议性 token 预算，是长时间运行时对 effort 的补充
- [AILmanac — Extended Thinking & Effort](/docs/api/thinking-and-effort) —— 本页所假定的入门框架
- [AILmanac — Claude Sonnet 5：实战指南](/docs/models/sonnet-5-field-guide) —— 迁移与重新校准的完整故事
- [AILmanac — Prompt caching](/docs/api/prompt-caching) —— 使对话中途更改 effort 代价高昂的缓存经济学


## 下一步

- [advisor 工具：Sonnet 做事，Fable 思考](/docs/api/advisor-tool)
