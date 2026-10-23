# Claude Opus 5：实战指南

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/models/opus-5-field-guide · AILmanac (CC BY 4.0) · last verified 2026-07-25

Opus 5 于 2026 年 7 月 24 日发布，是 Anthropic 两个月内的第四款模型——定价与 Opus 4.8 相同（$5/$25），但 Frontier-Bench 得分翻了一倍多，ARC-AGI-3 是次优模型的 3 倍，并新增 xhigh/max 努力档位。哪些基准真正重要、会让天真迁移报 400 的两个错误，以及 Opus 5 何时可以在你的技术栈中取代 Fable 5。

<LevelBadge level="intermediate" />

**2026 年 7 月 24 日**，Anthropic 发布了 **Claude Opus 5**（`claude-opus-5`）——继 Sonnet 5（6 月 30 日）和 Fable 5 / Mythos 5（6 月 9 日）之后，两个月内的第四款模型。标题刻意平淡：**定价与 Opus 4.8 相同，每百万 token 输入 $5 / 输出 $25**，同样是 1M 上下文、同样是 128k 输出上限。有意思的是，这些不变的数字现在能买到什么：**Frontier-Bench v0.1 上 44.4%，而 Opus 4.8 为 18.7%**（翻了一倍多），**SWE-bench Verified 96.0%**，以及 **ARC-AGI-3 上 30.16%——约为 GPT-5.6 Sol（7.78%）的三倍、Opus 4.8（1.52%）的二十倍**。Opus 5 现在是 **Claude Max 的默认模型**，也是 Claude Pro 上可用的最强模型。

本页是实战指南：这些数字对你的技术栈究竟意味着什么，会让天真迁移触发 400 错误的两项 API 契约变更，Opus 5 何时可以名正言顺地取代 Fable 5（以及何时不能），还有新的 `xhigh` / `max` 努力档位。

<Callout type="objectives" items={[
  "了解 Opus 5 是什么：1M 上下文、128k 输出、每百万 token 输入 $5 / 输出 $25——与 Opus 4.8 形态相同，但数字明显更好",
  "理解会让天真迁移出错的两个 API 约束：高努力档位下对禁用 thinking 的限制，以及默认开启的 thinking 会吃掉你的 max_tokens 预算",
  "像智能体团队负责人那样解读基准——Frontier-Bench、ARC-AGI-3、SWE-bench Pro、OSWorld 2.0——并知道哪些对你的工作负载有意义",
  "诚实地算价格账：Opus 5 在 max 档位下何时在每个已解决任务的成本上胜过 Fable 5，何时不能",
  "选对努力档位——新的 xhigh 和 max 档位在 Frontier-Bench 和 ARC-AGI-3 上物有所值，其他场景只会浪费 token",
  "在 2026 年 8 月 5 日退役日期之前规划好 Opus 4.1 → Opus 5 的迁移",
]} />

<VerifyNote lastVerified="2026-07-25" source="https://www.anthropic.com/news/claude-opus-5">
发布日期、模型 ID、定价、上下文/输出上限、努力档位和基准数字，已于 2026 年 7 月 25 日对照 Anthropic 发布文章、Claude Platform 模型总览以及 Opus 4.8 → Opus 5 迁移指南核实。Opus 5 **不**适用推出期优惠价——自发布起即为标准的每百万 token 输入 $5 / 输出 $25。快速模式是单独的模型入口，价格为每百万 token $10 / $50，实际耗时约快 2.5 倍。Batch API 享 50% 折扣（$2.50 / $12.50）。提示缓存命中为 $0.50/MTok，5 分钟写入为 $6.25。Opus 4.1（`claude-opus-4-1-20250805`）将于 **2026 年 8 月 5 日**退役——请在此日期前迁移。固定模型之前，请核对 [Current Models & Pricing](/docs/whats-new/models-and-pricing) 表。
</VerifyNote>

## 一段话版本

Opus 5 是一次**价格不变的能力提升**，而不是重新定价。每百万 token $5 / $25 与 Opus 4.8 相同，1M token 上下文相同，同步 Messages API 上 128k 最大输出相同，可靠的知识截止日期则推后到 **2026 年 5 月**。变化的是这些 token 能做什么：在 Frontier-Bench v0.1（Anthropic 自家最难的编码智能体评测）上，Opus 5 在 **`xhigh` 档位得分 44.4%**，而 Opus 4.8 为 18.7%——标价相同，得分翻了一倍多。在 ARC-AGI-3 上，新颖问题的求解从 1.52% 跃升到 30.16%。两项契约变更会让天真迁移出错：自适应思考默认开启，并与响应共享你的 `max_tokens` 预算；而在新的 `xhigh` 或 `max` 努力档位下，`thinking: {"type": "disabled"}` 现在会返回 **400**。Opus 5 是 Claude Max 的新默认模型，是 Claude Pro 上可用的最强模型，并可通过 Claude API、Bedrock（`anthropic.claude-opus-5`）、Google Cloud（`claude-opus-5`）、Microsoft Foundry 以及 Claude Platform on AWS 使用。

## 与 Opus 4.8 相比究竟变了什么

Opus 4.8 于 2026 年 4 月发布，是首个具备 1M 上下文窗口且默认开启自适应思考的 Opus。Opus 5 保留了所有这些默认值，因此在网络层面，请求/响应的形态几乎一致。变化了四件事：

- **数字。** Frontier-Bench v0.1 从 18.7% 提升到 44.4%（xhigh）/ 43.3%（max）。SWE-bench Multimodal 从 38.4% 提升到 59.4%。OSWorld 2.0 从 55.7% 提升到 70.57%。Zapier AutomationBench 从 17.0% 提升到 26.0%。ARC-AGI-3 在高努力档位下从 1.52% 提升到 30.16%。
- **新增 `max` 努力档位**，位于 `xhigh` 之上；同时 `thinking: {"type": "disabled"}` 在 `xhigh` 或 `max` 下不再可用（400 错误）。用意是：在这些档位下你明确是在为推理付费，因此悄悄禁用它现在算 bug，而不是偏好。
- **自我验证现在是默认行为**，不再是靠提示词养成的习惯。Anthropic 的迁移指南明确警告你要**删除手写的"检查你的工作"指令**——否则会出现重复验证、白烧 token。这是在 Opus 5 上运行原本跑在 Opus 4.8 上的代码时，第一天最常见的意外。
- **提示缓存不再因对话中途更换工具而失效**（beta）。如果你的智能体循环每一步都会更换工具列表，缓存前缀现在能保留下来；在 Opus 4.8 上你每次都要付一次新的写入费用。

## 会让迁移出错的两个 400 错误

<Steps items={[
  {title: "xhigh 或 max 下使用 thinking: disabled 会返回 400", body: "Opus 4.8 允许在任何努力档位下禁用 thinking。Opus 5 只允许在 high 及以下档位使用 thinking: {\"type\": \"disabled\"}。与 xhigh 或 max 搭配会直接报错。如果你有一个总是禁用 thinking 的封装（有些团队这样做是为了让回答更简短），要么把努力档位降到 high，要么删除 thinking 字段，让自适应思考运行。"},
  {title: "自适应思考会吃掉你的 max_tokens 预算", body: "与迁移到 Sonnet 5 时是同一个陷阱。max_tokens 是对全部输出的硬上限——thinking 块加上响应文本。如果你在 Opus 4.8 上禁用了 thinking，并只按'仅答案'设定了 max_tokens，而在 Opus 5 上没有禁用它，就会看到被截断的回答，stop_reason 为 'max_tokens'。提高 max_tokens，把努力档位降到 medium，或者在 high 及以下明确禁用 thinking。"},
  {title: "手动 extended thinking 仍然是 400", body: "继承自 Opus 4.7——thinking: {type: 'enabled', budget_tokens: N} 会返回 400。请改用 effort。如果你之前在计算每个请求的预算，请把这套逻辑换成努力档位选择器；自适应控制器现在会根据任务难度决定思考多久。"},
  {title: "自我验证是默认行为——删掉你提示词里的验证指令", body: "这不是 400，而是悄无声息的成本回退。Opus 5 会在没有提示的情况下迭代并自我检查。你在 4.6 或 4.8 上添加的任何'现在逐步验证你的答案'之类的脚手架，都会触发第二轮验证，并在困难提示上让 thinking token 大约翻倍。删掉这些指令并重新跑一遍评测。"}
]} />

<PromptCard title="最小安全迁移——从 Opus 4.8 到 Opus 5">
{`# Before (Opus 4.8) — worked
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=4096,
    extra_body={"effort": "max"},
    thinking={"type": "disabled"},           # allowed on 4.8 at any effort
    system="After answering, verify your work step by step.",
    messages=[...],
)

# After (Opus 5) — three edits
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=16384,                        # thinking now shares this budget
    extra_body={"effort": "max"},
    # thinking={"type": "disabled"}          # 400 at xhigh/max — remove it
    system="Answer the question.",           # drop the verify instruction — Opus 5 self-verifies
    messages=[...],
)`}
</PromptCard>

## 真正重要的基准

Anthropic 在发布当天公布了大量数字。其中三个对真实工作负载起决定作用，一个是营销奖杯，还有两个值得仔细读，因为它们显示了 Opus 5 *并非*最佳选择的地方。

- **Frontier-Bench v0.1——44.4%（xhigh），Opus 4.8 为 18.7%。** 这是 Anthropic 最难的智能体编码评测——需要模型运行工具、迭代并自我纠错的长程任务。同价下 2.4 倍的提升，是迁移最有力的单一理由。
- **SWE-bench Verified——96.0%。** 接近天花板。如果你用 Opus 4.8 或 Fable 5 做 SWE-bench 式的缺陷修复，Opus 5 是直接的升级。但 SWE-bench Verified 如今已是饱和的基准——细小差异不再像以前那样能区分模型。
- **OSWorld 2.0——70.57%，Opus 4.8 为 55.7%。** 计算机使用基准。如果你在运行 Claude for Chrome、Claude Cowork 的浏览器模式，或其他在真实界面上点来点去的东西，这就是该关注的数字。
- **ARC-AGI-3——30.16%（高努力档位），GPT-5.6 Sol 为 7.78%，Opus 4.8 为 1.52%。** 营销奖杯。ARC-AGI-3 测试无法靠记忆应付的新颖问题求解，Opus 5 约为次优模型的 3 倍。如果你的工作负载确有新颖性，这是有意义的信号；如果只是互联网上早已解决问题的变体，意义就小一些。
- **SWE-bench Pro——79.2%，Fable 5 为 80.0%。** 在更难的 SWE-bench Pro 上，Fable 5 仍领先 Opus 5 0.8 个百分点。对多数团队来说不足以证明 Fable 5 两倍价格的合理性，但如果你处于代码复杂度的最高十分位、每一分都很重要，请记下这一点。
- **网络安全漏洞利用——Opus 5 落后于 Mythos 5。** Anthropic 明确表示 Opus 5 *不是*顶级网络安全模型。如果你在做防御性网络安全工作，且你的组织已通过 Anthropic 的验证计划获得验证，Mythos 仍是首选。

## Opus 5 何时取代 Fable 5（何时不能）

这次发布迫使人们思考的有趣问题是：**你究竟什么时候需要 Fable 5 的 $10 / $50 定价？** Anthropic 自己的说法是：Opus 5 以一半成本在 CursorBench 3.2 上达到 Fable 5 峰值的 0.5% 以内，并以"略高于三分之一的成本"匹敌 Fable 5 的 OSWorld 2.0 结果。这是论点的强版本。诚实的版本是：

- **选 Opus 5**：用于智能体编码、计算机使用、业务自动化、生命科学推理，以及任何每个已解决任务的成本比最后 1-3 个百分点质量更重要的场景。这涵盖 >90% 的生产工作负载。
- **选 Fable 5**：当工作负载属于 (a) 长时间运行的智能体，其*边际*运行确实能从最后那一个百分点中获益（Anthropic 把 Fable 5 定位为"面向长时间运行智能体的下一代智能"），(b) SWE-bench Pro 式的高难度代码任务，且你已测得真实差距，或 (c) 你已处于精度-成本曲线上、两倍成本能买到真实质量的任何工作负载。
- **选 Mythos**：用于防御性网络安全工作，前提是你的组织已通过验证。自 2026 年 10 月 6 日起，入口是向 [Cyber Verification Program](https://support.claude.com/en/articles/14604842) 提交申请——它是仅限邀请的 [Project Glasswing](https://anthropic.com/glasswing) 的继任者——其各档位授予的是 Mythos 5.1。

<PromptCard title="Honest cost-per-solved-task math">
{`# Fable 5 on a hard agentic task
#   ~500k input tokens, ~50k output tokens
#   500 * $10/M + 50 * $50/M = $5.00 + $2.50 = $7.50 per run
#   Fable 5 solve rate: ~46% (Frontier-Bench v0.1, xhigh)
#   Cost per solved task: $7.50 / 0.46 = ~$16.30

# Opus 5 on the same task
#   Same token budget
#   500 * $5/M + 50 * $25/M = $2.50 + $1.25 = $3.75 per run
#   Opus 5 solve rate: ~44.4% (Frontier-Bench v0.1, xhigh)
#   Cost per solved task: $3.75 / 0.444 = ~$8.45

# Opus 5 wins on cost-per-solved-task by ~48% at near-parity quality.
# Break-even: Fable 5 would need to be 2x cheaper per successful run,
# i.e. Opus 5 would have to drop below ~23% solve rate for Fable 5 to win.`}
</PromptCard>

## 新的 max 努力档位——何时物有所值

Opus 5 引入了 `max` 作为位于 `xhigh` 之上的明确档位。自适应思考现在覆盖 `low → medium → high → xhigh → max`，而 `high` 是 Claude API 和 Claude Code 的默认值。发布基准给出两点观察：

- 在 Frontier-Bench v0.1 上，`xhigh` 实际得分 44.4%，而 `max` 为 43.3%——max *并非*严格更好。它每次尝试消耗更多 token，但额外的推理在这项评测上并不总能转化为成绩。
- 在奖励长时间深思的任务上——ARC-AGI-3、新颖的研究问题、高难度数学推理（IMO 2026 金牌水平，42/42）——更高的档位确实物有所值。

实用规则：**默认用 `high`，当你的评测显示可测量的提升时再上到 `xhigh`，只在你已验证推理深度比吞吐量更重要的工作负载上使用 `max`。** 不要设成 `max` 然后碰运气；要测量。

## 生命科学、安全与网络安全立场

值得记下的三个数字：

- **生命科学。** 在有机化学上，Opus 5 比 Opus 4.8 高 10.2 个百分点；在蛋白质预测上高 7.7 个百分点。如果你在为结构生物学、生物信息学或合成路线规划构建智能体，这是真正的跃升，而不是噪声范围内的改进。
- **提示注入抵抗力。** 在 Gray Swan 基准上，攻击者成功率从 Opus 4.8 的 5.5% 降到 **2.0%**。在 Claude Cowork 浏览器环境中，据 Anthropic 的测量，自动模式的防护措施使浏览器提示注入成功率降到 **0%**。对任何发布 Claude-for-Chrome 式智能体的人都很有意义。
- **网络安全分类器。** Opus 5 的网络安全防护介入频率比 Fable 5 **低约 85%**——因为 Opus 5 刻意不是顶级网络安全模型，介入率被调低了。如果你在 Fable 5 上遇到过对合法安全研究提示的误拒，Opus 5 会明显没那么"草木皆兵"。

## 你需要据此规划的退役时间表

- **Opus 4.1（`claude-opus-4-1-20250805`）** 将于 **2026 年 8 月 5 日**退役——距 Opus 5 发布仅十一天。如果任何生产环节仍固定在 Opus 4.1，请本周迁移。
- **Opus 4.5 / 4.6 / 4.7 / 4.8** 在平台总览中仍作为"Legacy models"提供，但预计会遵循标准的 12 个月弃用周期。把 Opus 5 作为任何新项目的迁移目标。
- **Opus 5 的模型 ID 是固定快照**，而不是始终指向最新版的指针。自 4.6 代起，无日期的 ID 格式仍表示"固定快照"。未来的 `claude-opus-5-1` 将是新的 ID，而不是对 `claude-opus-5` 的悄然升级。

## 动手试试——一条命令

<PromptCard title="Run Opus 5 with the recommended defaults">
{`# Python — Claude SDK
from anthropic import Anthropic
client = Anthropic()

response = client.messages.create(
    model="claude-opus-5",
    max_tokens=8192,                    # room for adaptive thinking + response
    extra_body={"effort": "high"},      # default; move to xhigh only if evals justify
    system="You are a senior engineer. Answer directly and iterate until the task is complete.",
    messages=[{"role": "user", "content": "..."}],
)

# Claude Code
claude --model claude-opus-5

# For fast mode (2.5x speed, 2x cost)
# model="claude-opus-5-fast"  # separate model ID, $10/$50 per MTok`}
</PromptCard>

## 速查表

<Flashcards cards={[
  {front: "Opus 5 API 定价", back: "每百万 token 输入 $5、输出 $25——与 Opus 4.8 相同。Batch API 享 50% 折扣（$2.50 / $12.50）。提示缓存命中 $0.50/MTok。"},
  {front: "Opus 5 与 Opus 4.8 在 Frontier-Bench v0.1 上的对比", back: "xhigh 下 Opus 5 为 44.4%，Opus 4.8 为 18.7%。同价下翻了一倍多。"},
  {front: "Opus 5 与 Fable 5 的每个已解决任务成本", back: "Opus 5 以近乎持平的质量、约一半的 token 成本完成任务。要让 Fable 5 在成本上获胜，Opus 5 的解决率需降到约 23% 以下。"},
  {front: "新的努力档位", back: "max——位于 xhigh 之上。在 Frontier-Bench v0.1 上，xhigh（44.4%）实际上胜过 max（43.3%）。只在已验证推理深度重要的场景使用 max。"},
  {front: "自我验证陷阱", back: "Opus 5 默认自我验证。Opus 4.6/4.8 时代提示词里的'逐步验证你的答案'现在会触发重复验证，并在困难提示上让 thinking token 大约翻倍。请删除。"},
  {front: "迁移时的两个 400 错误", back: "(1) xhigh 或 max 下使用 thinking: disabled。(2) 手动设置 thinking 的 budget_tokens 仍是 400（继承自 4.7）。默认开启的自适应思考还会吃掉你的 max_tokens——请提高上限。"},
  {front: "ARC-AGI-3 成绩", back: "高努力档位下 30.16%——约为 GPT-5.6 Sol（7.78%）的 3 倍、Opus 4.8（1.52%）的 20 倍。营销奖杯，但在真正新颖的任务上是有价值的信号。"},
  {front: "Opus 4.1 退役", back: "2026 年 8 月 5 日——在此之前迁移所有固定在 claude-opus-4-1-20250805 的生产环节。"}
]} />

## 检验你的理解

<Quiz questions={[
  {
    q: "你把一个固定了 `model=\"claude-opus-4-8\"`、`effort: \"max\"` 和 `thinking: {\"type\": \"disabled\"}` 的封装迁移到 Opus 5。会发生什么？",
    options: [
      "正常运行——行为相同，数字更好。",
      "返回 400 错误，因为在 Opus 5 上 max 努力档位下不能禁用 thinking。",
      "悄悄忽略禁用标志，并以自适应思考运行。",
      "自动降级到 xhigh 努力档位。"
    ],
    answer: 1,
    explain: "Opus 5 只允许在 high 及以下档位使用 thinking: {\"type\": \"disabled\"}。与 xhigh 或 max 搭配会返回硬性 400。把努力档位降到 high，或删除 thinking 字段，让自适应思考运行。"
  },
  {
    q: "你的 Opus 4.8 提示词以'现在逐步验证你的答案。'结尾。换成 Opus 5 后，你发现困难提示上的 thinking token 成本大约翻倍。为什么？",
    options: [
      "Opus 5 的验证路径有 bug。",
      "Opus 5 的分词器不同，所以验证指令成本更高。",
      "Opus 5 默认自我验证；提示词中的指令触发了第二轮验证。",
      "Opus 5 上自适应思考被禁用了。"
    ],
    answer: 2,
    explain: "Anthropic 的迁移指南明确警告要删除提示词中的验证指令。Opus 5 在没有提示的情况下就会迭代并自我检查，所以旧的脚手架会导致重复验证。删掉该指令并重新跑一遍评测。"
  },
  {
    q: "对于一个看重解决率、且成本是实际约束的生产级智能体编码工作负载，Opus 5 的发布数据最有力地支持哪个模型？",
    options: [
      "Fable 5——它在 SWE-bench Pro 上高出 0.8 个百分点，所以质量占优。",
      "Opus 5——在 Frontier-Bench 和 CursorBench 上质量近乎持平，而标价只有 Fable 5 的一半。",
      "Sonnet 5——最便宜的选项永远是正确的默认值。",
      "Mythos 5——可用的最高档模型。"
    ],
    answer: 1,
    explain: "Opus 5 以一半成本在 CursorBench 3.2 上达到 Fable 5 峰值的 0.5% 以内。在 Frontier-Bench 上，每个已解决任务的成本计算显示 Opus 5 在质量近乎持平的情况下胜出约 48%。只有当最后 1-3 个百分点的质量值得两倍 token 账单时，Fable 5 才会胜出。"
  },
  {
    q: "你在每个请求上都设置 `effort: \"max\"`，期望质量严格好于 `xhigh`。Anthropic 的发布数据表明什么？",
    options: [
      "max 始终严格优于 xhigh——多花的 token 值得。",
      "max 在所有基准上都比 xhigh 差——永远别用。",
      "max 在某些任务（新颖推理、高难度数学）上有帮助，但在 Frontier-Bench v0.1 上，xhigh 实际得分更高（44.4% 对 43.3%）。",
      "max 只适用于计算机使用任务。"
    ],
    answer: 2,
    explain: "max 并非严格更好。在 Frontier-Bench v0.1 上，xhigh 胜过 max。更高的档位在 ARC-AGI-3、IMO 级数学和新颖问题任务上物有所值——先测量，再决定是否默认使用 max。"
  },
  {
    q: "以下哪项是 Opus 5 发布后你必须据以规划的退役日期？",
    options: [
      "Opus 4.5 于 2026 年 8 月 5 日退役。",
      "Opus 4.1（claude-opus-4-1-20250805）于 2026 年 8 月 5 日退役。",
      "Opus 4.8 于 2026 年 12 月 31 日退役。",
      "与 Opus 5 发布相关的当前没有任何弃用。"
    ],
    answer: 1,
    explain: "Opus 4.1 于 2026 年 8 月 5 日退役——在 Opus 5 发布后十一天。任何仍固定在 claude-opus-4-1-20250805 的生产环节都必须在此日期前迁移。"
  }
]} />

## 接下来去哪儿

- [Claude Sonnet 5: The Field Guide](/docs/models/sonnet-5-field-guide) — 均衡档位，也是 Claude Code 的默认模型；从 Sonnet 4.6 迁移有它自己的 400 陷阱
- [Fable 5 & Mythos 5: The Flagship Field Guide](/docs/models/fable-5-mythos-5-flagship) — 顶级档位何时真正值回两倍成本
- [Choosing a Model in 2026](/docs/models/choosing-a-model) — 覆盖整个 Anthropic 产品线的决策树
- [Adaptive Thinking & Effort Tuning](/docs/api/thinking-and-effort) — 努力档位如何对应真实的 token 开销
- [Prompt Caching Economics](/docs/frontiers/prompt-caching-economics) — 把 Opus 5 的标价变成你实际账单的缓存命中计算
- [Current Models & Pricing](/docs/whats-new/models-and-pricing) — 始终最新的表格；固定模型前请查阅

## 来源与延伸阅读

- [Introducing Claude Opus 5 — Anthropic (24 July 2026)](https://www.anthropic.com/news/claude-opus-5) — 发布文章、基准表和安全说明
- [Claude Platform docs — Models overview](https://platform.claude.com/docs/en/models/overview) — 定价表、快照 ID、Bedrock/GCP 标识符、默认努力档位
- [Migration guide — Opus 4.8 to Opus 5](https://platform.claude.com/docs/en/about-claude/models/migration-guide) — 契约变更的官方清单以及自我验证警告
- [MarkTechPost — Opus 5 launch coverage (24 July 2026)](https://www.marktechpost.com/2026/07/24/meet-the-new-claude-opus-5-frontier-class-agentic-coding-and-computer-use-at-unchanged-opus-pricing/) — 逐个基准的拆解，包括 SWE-bench、ARC-AGI-3 和 Chartography 数字
- [Interesting Engineering — Opus 5 coding coverage](https://interestingengineering.com/culture/anthropic-claude-opus-5-coding-performance) — 每任务成本视角
- [TheNextWeb — Opus 5 launch analysis](https://thenextweb.com/news/anthropic-claude-opus-5-launch-frontier-bench-coding) — 发布节奏与 Fable 5 对比
- [BigGo Finance — Opus 5 pricing analysis](https://finance.biggo.com/news/f43fc4c1-53fd-4f49-9e0e-4246307a0391) — 快速模式经济性与提示缓存变化
- [Model deprecations — Anthropic](https://platform.claude.com/docs/en/about-claude/model-deprecations) — Opus 4.1 退役日期与更广泛的生命周期政策


## 下一步

- [Claude Opus 5.5: The Field Guide](/docs/models/opus-5-5-field-guide) — 继任者，2026 年 9 月 22 日发布：$4/$20、缓存读取按 5% 档计费，并在上述变更之外再增加四项破坏性变更
- [Claude Sonnet 5: The Field Guide](/docs/models/sonnet-5-field-guide)
