# 上下文管理

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/claude-code/context-management · AILmanac (CC BY 4.0) · last verified 2026-11-08

/compact 与 /clear、自动压缩，以及随着会话增长保持高效。

<LevelBadge level="intermediate" />

<Callout type="objectives" items={["区分 /clear 与 /compact，并立刻选对命令", "主动引导一次压缩而不是任由它猜测，并调整自动压缩的触发时机", "准确了解压缩后哪些内容会保留、哪些会被摘要掉", "运用四种技巧让长会话保持敏锐", "识别上下文窗口已满的症状并快速修复"]} />

<VerifyNote lastVerified="2026-11-08" source="https://code.claude.com/docs/en/context-window">
命令名称、自动压缩窗口以及“压缩后保留内容”的对照表会随版本变化——请以官方文档为准。
</VerifyNote>

## 核心思想

每个会话的[上下文窗口](/docs/foundations/tokens-and-context)都是有限的。窗口被填满时，较早的内容会被压缩，Claude 可能开始“跑偏”。有意识地管理上下文，才能让长会话保持敏锐。

## 两个必备命令

两个命令几乎覆盖所有情形。关键是让命令与你的意图相匹配。

<Flashcards cards={[{front: "/clear", back: "清空对话，重新开始。在切换到不相关的任务时使用。这是恢复干净、聚焦的上下文成本最低的方式。别名：/reset 和 /new。"}, {front: "/compact", back: "把到目前为止的对话摘要成紧凑的形式——保留要点，同时释放空间。想继续同一个任务，但窗口快满时使用。可选地接受聚焦指令。"}]} />

用一个问题来决定：是新任务，还是同一个任务？

```mermaid
flowchart TD
  A{New task or same task?} -->|New / unrelated| B[/clear]
  A -->|Same task, context full| C[/compact]
```

两个容易忽略的细节：

- **`/compact` 接受指令。** `/compact focus on the auth bug fix` 会保留*你*选择的内容，而不是自动处理猜测的重点。在开始一个长的新任务之前主动运行它，而不是等窗口逼你去做。
- **`/clear` 并非不可回头。** 传入一个名称（`/clear auth refactor`），可在 `/resume` 选择器中为被清除的对话加上标签；在同一个 Claude Code 进程内，回退菜单仍会提供一个 `/resume <session-id> (previous session)` 条目——参见[检查点与回退](/docs/claude-code/checkpoints-and-rewind)。

## 自动压缩——以及如何调整触发点

当上下文接近上限时，Claude Code 会**自动压缩**，让工作不至于突然中断。在拥有 1M 上下文窗口的模型上，默认约在 967K token 时触发；更早的模型则在其上下文窗口的边界处压缩。Claude Code 也可能压缩你闲置的对话。

阈值可以由你调整。`/autocompact 500k` 会更早压缩——当你更想按自己的节奏做摘要，而不是等到 96% 才压缩时很有用——而 `/autocompact auto` 会恢复为针对你的模型调校过的窗口。

<PromptCard title="比默认更早压缩">{`/autocompact 500k`}</PromptCard>

<Steps items={[{title: "可接受的值", body: "原始 token 数（500000）、带后缀的数值（500k、1m）、auto（恢复为模型调校过的窗口），或 off（在本会话中禁用自动压缩）。不带参数运行 /autocompact 可查看当前窗口。"}, {title: "可以在哪里设置", body: "/autocompact 命令会保存到你的用户设置中 modelSettings 下的当前模型。你也可以在设置 JSON 的顶层设置 autoCompactWindow，或在 modelSettings 下按模型设置，或使用环境变量 CLAUDE_CODE_AUTO_COMPACT_WINDOW。"}, {title: "优先级，由高到低", body: "CLAUDE_CODE_AUTO_COMPACT_WINDOW，然后是 modelSettings 中按模型设置的 autoCompactWindow，然后是顶层 autoCompactWindow，最后是模型的默认窗口。如果优先级更高的设置范围（例如托管设置）指定了窗口，/autocompact 会保存你的值，但会话仍使用该范围的值——并且会告知你。"}]} />

<Callout type="tip" items={["把自动压缩当作兜底，而不是策略。在不相关的任务之间清空，比等窗口填满、自动压缩触发更能保持上下文干净。", "要压缩就有意识地压缩：带聚焦指令的 /compact 胜过让自动处理去猜哪些内容重要。"]} />

## 压缩后保留什么

压缩摘要的是*对话*。你的配置从磁盘加载的所有内容会被单独处理——这就是为什么压缩后的会话仍然了解你的项目约定。

<Steps items={[{title: "从磁盘重新注入", body: "系统提示词和输出风格依然生效；项目根目录的 CLAUDE.md、无作用域的规则、自动记忆，以及 Claude 在 plan mode 中写下的计划都会回来。技能描述会根据你当前的技能重新生成（Claude Code v2.1.304 或更高版本）。如果会话以 git status 快照开始，Claude Code 会读取一份新的。"}, {title: "按需重新加载", body: "带 paths: frontmatter 的规则以及子目录中嵌套的 CLAUDE.md 文件会被摘要掉，只有当 Claude 下次接触匹配的文件时才会重新加载。如果某条规则必须在压缩后保留，请去掉 paths: frontmatter，或把它移到项目根目录的 CLAUDE.md 中。"}, {title: "部分恢复", body: "Claude Code 会重新读取 Claude 读过或编辑过的最多五个文件，按最近修改的顺序——但超过 5,000 token 的文件只会以路径引用（'Referenced file'）的形式返回，不含内容。被调用的技能正文会重新注入，上限为每个技能 5,000 token、总计 25,000 token，最旧的先被丢弃，并保留文件开头：把重要内容放在 SKILL.md 靠前的位置。"}, {title: "被摘要掉", body: "对话本身，包括此前由钩子添加的上下文。匹配 'compact' 来源的 SessionStart 钩子会再次运行，它们的输出会加入压缩后的上下文——凡是必须回来的内容，都用这个钩子。"}, {title: "不受影响", body: "后台命令和后台子智能体会继续运行，Claude Code 还会提醒 Claude 哪些仍在运行，避免它重复启动。"}]} />

## 保持高效的技巧

除了这两个命令，还有四个习惯能从一开始就让上下文保持精简。

<Steps items={[{title: "每个会话一个任务", body: "不要让一下午互不相关的工作堆积在同一个上下文里。"}, {title: "把繁重的阅读委派给子智能体", body: "把大量阅读交给子智能体——它们消耗的是它们自己的上下文，只返回结论。参见 /docs/claude-code/subagents。"}, {title: "引用，而非粘贴", body: "用 @path 指向文件，而不是粘贴大段内容，并保持 CLAUDE.md 精简（参见 /docs/claude-code/claude-md）。"}, {title: "留意预算", body: "运行 /context 可查看按类别划分的实时明细——彩色网格，外加针对占用上下文较多的工具和臃肿记忆的优化建议，包括加载了哪些 CLAUDE.md 和自动记忆文件。传入 'all' 可在全屏模式下展开逐项列表。显示上下文用量的状态栏能被动地给你同样的信号。参见 /docs/claude-code/statusline。"}]} />

<PromptCard title="查看你的上下文究竟用在了哪里">{`/context`}</PromptCard>

这些对应最新文档：[子智能体](/docs/claude-code/subagents)、[CLAUDE.md](/docs/claude-code/claude-md)和[状态栏](/docs/claude-code/statusline)。

:::tip[症状 → 修复]
如果 Claude 开始忘记之前的指令或重复自己，窗口很可能已满。`/compact`（同一任务）或 `/clear`（新任务）通常能立刻解决。运行 `/context` 来确认——当对话确实超出了窗口时，输出会指出你超出了多少，以及哪个命令可以释放空间。更多内容见[Claude 为什么这样做？](/docs/contribute/troubleshooting)。

如果你遇到的是 `Autocompact is thrashing`，说明压缩在正常工作，只是有某个体积过大的东西不断把窗口重新填满——参见[Claude Code 故障排查](/docs/claude-code/troubleshooting)。
:::

<Callout type="takeaways" items={["/clear 清空对话以重新开始——用于不相关的任务（别名：/reset、/new）", "/compact 摘要会话以释放空间——窗口变满时用它继续同一任务，并传入聚焦指令，让它保留你关心的内容", "自动压缩是安全网，不是策略：在 1M 上下文模型上约在 967K token 触发，/autocompact 500k（或 auto、off）可移动这条线", "压缩会摘要对话，但会从磁盘重新注入 CLAUDE.md、无作用域的规则、自动记忆和计划；按路径限定作用域的规则、嵌套的 CLAUDE.md 文件以及大文件内容不会完整回来", "保持上下文精简：每个会话一个任务、把繁重阅读委派给子智能体、引用文件而不是粘贴，并查看 /context 或状态栏", "遗忘或重复意味着窗口已满——/compact（同一任务）或 /clear（新任务）即可解决"]} />

<Quiz title="自我检测" questions={[{q: "你完成了一个任务，转而处理完全不相关的事情。该用哪个命令？", options: ["/compact——总结之前的工作", "/clear——清空对话并重新开始", "都不用——交给自动压缩处理"], answer: 1, explain: "/clear 会清空对话并重新开始。切换到不相关的任务时，这是恢复干净、聚焦的上下文成本最低的方式。"}, {q: "你正做到一半，上下文窗口快满了，但想继续同一项工作。该用哪个命令？", options: ["/clear——释放最多空间", "/compact——在保留要点的同时摘要对话", "打开一个新终端"], answer: 1, explain: "/compact 会把到目前为止的对话摘要成紧凑的形式，保留要点的同时释放空间——非常适合继续同一个任务。"}, {q: "应当如何看待自动压缩？", options: ["管理上下文的主要策略", "一张阈值可调的安全网——主动 /clear 和有意识的 /compact 效果更好", "一个应该禁用的 bug"], answer: 1, explain: "当上下文接近上限时，自动压缩让工作不至于突然中断——在 1M 上下文模型上默认约在 967K token。它只是兜底：在不相关的任务之间清空，以及带聚焦指令有意识地压缩，都比依赖它更好。你也可以用 /autocompact 500k 移动这条线，或用 /autocompact off 在本会话中关闭它。"}, {q: "你把一条规则放在带有 `paths:` frontmatter 的文件中。会话发生了压缩。这条规则还生效吗？", options: ["生效——压缩后规则总会从磁盘重新注入", "不会立刻生效——只有当 Claude 下次接触匹配的文件时才会重新加载", "不生效——在会话剩余时间里它都消失了"], answer: 1, explain: "按路径限定作用域的规则在 Claude 读取或编辑其触发文件时加载进消息历史，因此压缩会把它们与对话一起摘要掉。下次接触匹配的文件时，它们会按需重新加载。只有项目根目录的 CLAUDE.md 和无作用域的规则会无条件地从磁盘重新注入——所以如果某条规则必须熬过每一次压缩，请去掉 paths: frontmatter 或把它移到那里。"}, {q: "Claude 开始忘记之前的指令或重复自己。可能的原因和修复方法是什么？", options: ["网络问题——重启电脑", "窗口很可能已满——/compact（同一任务）或 /clear（新任务）", "模型坏了——换一个模型"], answer: 1, explain: "遗忘或重复通常意味着窗口已满。/compact（同一任务）或 /clear（新任务）通常能立刻解决。"}]} />

## 下一步

- [上下文预算审计](/docs/claude-code/context-budget-audit)——每个项目做一次的检查清单：`/skill-doctor`、输出上限、`omitClaudeMd`、自动压缩窗口
- [检查点与回退](/docs/claude-code/checkpoints-and-rewind)——用 `/rewind` 撤销编辑，或从任意位置压缩上下文
- [Token、上下文与记忆](/docs/foundations/tokens-and-context)
- [子智能体与并行智能体](/docs/claude-code/subagents)
- [状态栏定制](/docs/claude-code/statusline)
