# claude CLI：真正会改变结果的标志

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/claude-code/cli-flags · AILmanac (CC BY 4.0) · last verified 2026-10-07

对 Claude Code 命令行的一次有主见的巡览——无人值守运行的五标志约定、已记录系统提示词的陷阱，以及 --bare、--safe-mode 和 --restricted 的区别。

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-10-07" source="https://code.claude.com/docs/en/cli-reference">
下文的所有命令、标志、默认值和版本下限均来自官方 [CLI 参考](https://code.claude.com/docs/en/cli-reference)，阅读日期为 2026-10-07。标志会在不同版本之间出现和变化，而且参考文档明确指出 `claude --help` **并未列出所有标志**——因此 `--help` 里没有的标志，不一定在你的构建里不存在。请以参考文档为准，而不是帮助文本，并用 `claude -v` 检查你的版本。
</VerifyNote>

大多数人只学会命令行的三样东西——`claude`、`claude -c` 和 `claude -p`——然后就停下了。如果你只是坐在它面前使用，停在这里完全合理。可一旦你把 Claude Code 放进脚本、CI 任务、后台队列或同事手里，这些标志就不再只是便利，而是决定一次运行花一美元还是卡住一小时的关键。

本页不是参考表格的第二份拷贝。它讲的是**学习这套界面的顺序**、真正会改变结果的标志，以及让人实实在在浪费过时间的四个陷阱。

<Callout type="objectives" items={["你可以启动的六种会话，以及哪个标志选择哪一种","让无人值守运行有边界、可应答、可解析的五标志约定","为什么修改 --append-system-prompt 后再运行 --continue 看起来毫无作用——已记录提示词规则","--bare、--safe-mode 和 --restricted 有何区别，何时该用哪个","从 shell 驱动后台会话：agents、attach、logs、respawn、rm、daemon","人们容易混淆的标志对：--tools、--allowedTools 与 --disallowedTools"]} />

## 从问题开始：这是哪一种会话？

其他所有决定都由此而来。Claude Code 可以启动六种本质不同的东西，而选择其中一种的标志，通常是你最先输入的内容。

| 你想要 | 标志 | 你得到 |
| --- | --- | --- |
| 一场你全程观看的对话 | *（无）* | 在当前终端中的交互式会话 |
| 一个答案，然后退出 | `-p` / `--print` | 非交互式运行，输出到 stdout |
| 能在当前终端关闭后继续的工作 | `--bg` / `--background` | 一个后台会话；打印其 ID 以及如何管理它 |
| 一个隔离的分支用来试验 | `-w` / `--worktree` | 位于 `<repo>/.claude/worktrees/<name>` 的 git worktree |
| 在 Anthropic 的机器上工作 | `--cloud` | 一个云会话，或排入现有云会话的后续任务 |
| 用手机驱动当前会话 | `--rc` / `--remote-control` | 一个同时可从 claude.ai 或 Claude 应用控制的交互式会话 |

其中两个不能组合：`--bg` 和 `-p` 互斥，因为一个立即返回，另一个要等待答案。如果你想在后台运行的是 shell 命令而不是 Claude 会话，请将 `--bg` 与 `--exec` 搭配使用：

<PromptCard title="Run the test suite as a background job, not a Claude session">
{`claude --bg --exec 'pytest -x'`}
</PromptCard>

另外，`--bg` 在启动前会检查该目录的工作区信任状态——因此在不受信任的仓库里启动后台会话，会在一开始就失败，而不是做到一半才失败。

## 无人值守运行的五标志约定

这是本页价值最高的内容。无人值守的 `claude -p` 运行有三种出错方式，是交互式会话根本不会遇到的：它可能在没人应答的权限提示上**停滞**，可能**循环**得远超你的预期，也可能在你的脚本需要数据时**输出散文**。五个标志把这三种情况都堵住了。

<Steps items={[
  {title: "以非交互方式运行 — -p", body: "`claude -p \"query\"` 打印答案后退出。下面的一切都只适用于 print 模式，所以这个标志是其余各项的入口。"},
  {title: "决定谁来应答权限提示 — --permission-prompts", body: "默认值是 `host`，它会把提示发送给 Agent SDK 宿主或 `--permission-prompt-tool`。当没有人能应答时（比如 cron 任务或 CI 步骤），传入 `--permission-prompts none`：运行不再咨询或等待宿主，任何会弹出提示的操作都会被拒绝，除非有 `PermissionRequest` 钩子允许，并且会告知 Claude 不要重试。完全没有宿主的 `-p` 运行本来就会拒绝这些请求；此时该标志主要是阻止重试。需要 v2.1.259 或更高版本。再搭配范围狭窄的 `--allowedTools` 规则，让拒绝成为少数情况而不是常态。"},
  {title: "为循环设界 — --max-turns", body: "默认没有轮数限制。`--max-turns 3` 在达到上限时以错误退出。把它当作防止失控代理循环的绊线，而不是预算。"},
  {title: "为开销设界 — --max-budget-usd", body: "`--max-budget-usd 5.00` 会在客户端成本估算达到上限时停止。子代理的花费计入其中；一旦达到上限，再启动子代理会失败并提示 `Budget limit reached`，正在运行的后台子代理也会被停止。上限的强制执行需要 v2.1.217 或更高版本。"},
  {title: "让输出可解析 — --output-format 或 --json-schema", body: "`--output-format json` 给你一个结构化的外层包装。`--json-schema '<schema>'` 更进一步：Claude Code 会依据你的 JSON Schema 校验最终答案，并在 schema 无效时提前报错，所以你的脚本再也不用对散文写正则了。"}
]} />

<PromptCard title="A CI step that cannot hang, cannot loop forever, and cannot overspend">
{`claude -p "Review the staged diff and list bugs" \\
  --permission-prompts none \\
  --allowedTools "Read" "Bash(git diff *)" \\
  --max-turns 6 \\
  --max-budget-usd 2.00 \\
  --output-format json`}
</PromptCard>

<Callout type="warning" title="--max-budget-usd 是估算，不是你的账单" items={["Claude Code 是用它自己的客户端成本估算来对照上限的，这可能与你实际被计费的金额不同。","当你用 --continue 或 --resume 回到一段对话时，从先前运行恢复的总额不计入上限——所以在 2 美元上限下连续三次恢复运行，总花费可能超过 2 美元。","把它当作单次运行的断路器。如果需要对整个账户或项目设置真正的上限，请参阅 Hard Spend Caps。"]} />

关于在没有人在场的情况下放手让运行继续的完整做法——允许什么、屏蔽什么、记录什么——请参阅[加固自主运行](/docs/security/hardening-autonomous-runs)和[无头模式与 Agent SDK](/docs/claude-code/headless-and-agent-sdk)。关于服务商层面的上限，请参阅 [Hard Spend Caps](/docs/models/hard-spend-caps)。

## 系统提示词家族，以及其中的陷阱

有五个标志影响系统提示词。四个设置其文本；第五个决定对话是否保留它起初所用的文本。

| 标志 | 作用 |
| --- | --- |
| `--system-prompt` | 用你的文本替换整个默认提示词 |
| `--system-prompt-file` | 用某个文件的内容替换它 |
| `--append-system-prompt` | 把你的文本追加到默认提示词后 |
| `--append-system-prompt-file` | 把某个文件的内容追加到默认提示词后 |
| `--system-prompt-snapshot` | `off` 在每次请求时重建提示词；`on`（默认）复用已记录的那一份 |

在*追加*与*替换*之间做选择，是在选择身份。追加会保留 Claude Code 默认的工具指引、安全说明和编码约定，并把你的规则叠加其上——适合每次运行的指令、输出格式或项目上下文。替换则会丢弃**所有**这些，包括工具指引，所以只有当这个场景确实不是编码助手时才适合：比如无人看管的流水线里的非编码代理。一旦替换，任务仍然需要的一切都由你负责。

你可以组合使用。把追加标志和替换标志一起传入，会先替换默认提示词，再追加你的文本。从 v2.1.283 起，你还可以把一个标志与它自己的文件形式一起传入——`--append-system-prompt` *以及* `--append-system-prompt-file`——Claude Code 会同时使用两者，无论你以什么顺序输入，文件内容都排在前面。

<Callout type="warning" title="陷阱：恢复的对话会沿用它诞生时的提示词" items={["Claude Code 在一段对话的第一次请求时构建一次系统提示词，并把它记录在会话中。","在对话被压缩之前，之后的每次请求都使用这份已记录的提示词——包括 --resume 或 --continue 之后。","所以你编辑了 --append-system-prompt 的文本，重新运行 claude --continue，却什么都没变。标志没有坏；只是这段对话仍在使用那份记录。","新文本会在对话压缩之后，或在全新的对话中生效。","若要在多次 --continue 运行之间迭代措辞，请传入 --system-prompt-snapshot off，这样每次请求都会重建提示词。需要 v2.1.257 或更高版本。"]} />

在混合了稳定指令与每次运行上下文的替换提示词中，还有一个值得了解的技巧。在两者之间放一行只含 `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` 的内容：Claude Code 会在第一个这样的行处切分并将其移除，因此上半部分保持缓存，下半部分则随运行变化。需要 v2.1.275 或更高版本。这为何会影响你的账单，见 [Prompt Caching](/docs/api/prompt-caching)。

对于多用户的脚本化工作负载，`--exclude-dynamic-system-prompt-sections` 会把每个用户的上下文（比如自动记忆的位置）从系统提示词移到第一条用户消息中——这样不同机器上的同一任务可以共享同一个缓存前缀。它只作用于默认提示词，当你设置 `--system-prompt` 或 `--system-prompt-file` 时会被忽略。

## 三个“关闭东西”的标志，它们并不相同

人们会混用它们，然后纳闷症状为什么没变。它们解决的是三个不同的问题。

| | `--bare` | `--safe-mode` | `--restricted` |
| --- | --- | --- | --- |
| 它解决的问题 | 启动对脚本化调用来说太慢 | 我的配置坏了，却不知道是哪一部分 | 评测框架不得触碰这台共享机器 |
| CLAUDE.md、技能、命令、子代理、插件、MCP、自动记忆 | 不会被发现 | 不会被加载 | 只加载托管设置和 `--settings` |
| 内置工具 | Bash、文件读取、文件编辑 | 正常工作 | 运行命令/代码的工具和 WebFetch 会被**移除**，除非在 `--tools` 中逐个点名 |
| 文件访问 | 正常 | 正常 | 限制在工作目录内 |
| `bypassPermissions` | 允许 | 允许 | **拒绝** |
| 托管策略 | 生效 | 仍然生效，包括策略钩子和状态栏 | 生效 |
| 副作用 | 设置 `CLAUDE_CODE_SIMPLE` | 设置 `CLAUDE_CODE_SAFE_MODE` | 拒绝创建云会话 |

把这张表读作意图的递进：`--bare` 关乎**速度**，`--safe-mode` 关乎**诊断**，`--restricted` 关乎**隔离**。一个有用的细节：通过 `--add-dir` 传入的目录里的技能，在 `--bare` 下仍会加载，这就是在其余全被剥离的运行中恰好保留一项能力的办法。

当某处出了问题而你分不清是 Claude Code 还是你自己的配置时，`--safe-mode` 是首选——包括你想弄清是否某个自定义项触发了自动模型回退的时候。把它与 `claude doctor` 搭配使用，后者无需启动会话就会打印只读的安装与设置诊断信息。（会话内的 `/doctor` 命令是另一回事：它还可以应用修复。）更多从症状出发的排查见[排查 Claude Code 问题](/docs/claude-code/troubleshooting)。`--restricted` 需要 v2.1.248 或更高版本。

## 从 shell 驱动后台会话

一旦你用 `--bg` 启动会话，终端就成了控制面板。整个生命周期都有对应的命令，而且都不需要打开交互式界面。

<Steps items={[
  {title: "查看正在运行什么 — claude agents", body: "打开代理视图，用于监控和调度并行的后台会话。用于脚本时，`--json` 以 JSON 数组形式打印活动会话，`--json --all` 还包括已完成的会话。`--cwd <path>` 将范围缩小到在该目录下启动的会话。打开视图本身需要交互式终端；JSON 形式则不需要。"},
  {title: "查看某一个的内部 — claude logs", body: "`claude logs <id|name>` 打印后台会话最近的输出。从 v2.1.290 起，你可以传入某个运行中会话名称的一部分来代替 ID——所以 `claude logs auth` 通常就够了。"},
  {title: "接管它 — claude attach", body: "`claude attach <id|name>` 把一个后台会话带到当前终端。部分名称匹配同样需要 v2.1.290 或更高版本。"},
  {title: "重启它 — claude respawn", body: "`claude respawn <id>` 重启一个会话（无论运行中还是已停止），对话保持完整。`--all` 重启所有运行中的会话——升级 Claude Code 二进制文件之后该做的操作。"},
  {title: "停止并清理 — claude stop、claude rm", body: "`claude stop <id>`（也可用 `claude kill`）停止一个会话。`claude rm <id>` 把它从列表中移除；转录内容仍保留在你的机器上，仍可通过 `claude --resume` 访问。如果因该会话的 worktree 而拒绝移除，拒绝信息会打印出接下来该传入的确切标志——`--discard-unpushed`（v2.1.260+）或 `--force-remove-worktree`（v2.1.268+）。"},
  {title: "当整个系统卡住时 — claude daemon", body: "后台会话由一个监督进程托管。`claude daemon status` 打印其状态、版本、套接字目录和 worker 数量，并在其未运行时以 1 退出。`claude daemon logs` 跟踪 `~/.claude/daemon.log`。`claude daemon stop --any --keep-workers` 重启监督进程，同时让会话保持存活，等下一个监督进程来重新连接。"}
]} />

与此相对、从会话内部看的另一面——工作如何转入后台，以及转入后会保留什么——见[后台任务、/loop 与调度](/docs/claude-code/background-tasks)。

## 人们容易搞错的标志对

<Callout type="warning" title="值得预先澄清的六个混淆" items={["--tools 限制存在哪些内置工具。--allowedTools 指定哪些调用可跳过权限提示。--disallowedTools 拒绝调用。这是三件不同的事，传错一个是“为什么它还在问我”最常见的原因。","--tools 完全不影响 MCP 工具。若要把它们也移除，请加上 --disallowedTools \"mcp__*\"。","--disallowedTools 中的裸名称会把该工具从 Claude 的上下文中移除；而像 Bash(rm *) 这样带范围的规则会让工具保持可用，只拒绝匹配的调用。","--dangerously-skip-permissions 会在 bypassPermissions 模式下启动。--allow-dangerously-skip-permissions 只是把该模式加入 Shift+Tab 循环，这样你可以先在 plan 模式启动，之后再切换。你真正想要的几乎总是第二个。","--add-dir 授予文件访问权限，但 Claude Code 不会从这些目录中发现大部分 .claude/ 配置。添加一个目录并不等于采纳它的配置。","--desktop 不接受提示词，也不接受除 --verbose 和 --debug 系列之外的其他标志，因为桌面应用会自己启动会话。需要 v2.1.285 或更高版本。"]} />

还有一个小小的体验细节：如果你把子命令敲错，Claude Code 会给出最接近的匹配建议并退出，而不会启动会话——`claude udpate` 会打印 `Did you mean claude update?`，而不是打开一段你并不想要的对话。

## 自我检测

<Quiz questions={[
  {
    q: "你的夜间任务在一个 Agent SDK 应用里运行 `claude -p`，该应用的 `canUseTool` 回调会询问真人，结果夜里一直挂起直到超时。最可能缺少哪个标志？",
    options: [
      "--max-turns，因为代理在循环",
      "--permission-prompts none，因为没有人在场应答权限提示",
      "--output-format json，因为解析器被阻塞了",
      "--bare，因为启动很慢"
    ],
    answer: 1,
    explain: "在 print 模式下，权限提示默认发往宿主——这里是你的 SDK 回调，运行会等待它的答复。`--permission-prompts none` 让运行不再咨询宿主：任何会弹出提示的操作都会被拒绝，除非有 PermissionRequest 钩子允许，并且会告知 Claude 不要重试，因此任务得以结束。完全没有宿主的普通 `-p` 运行本来就会拒绝这些请求。`--max-turns` 限制的是循环，那是另一种症状。"
  },
  {
    q: "你调整了 --append-system-prompt 的文本，重新运行 `claude --continue`，行为却没有变化。为什么？",
    options: [
      "追加标志只在 -p 下有效",
      "对话会复用其第一次请求时记录的系统提示词，直到被压缩",
      "--continue 会悄悄丢弃所有系统提示词标志",
      "文本被追加了，但被放在了用户消息之后"
    ],
    answer: 1,
    explain: "Claude Code 在对话的第一次请求时构建一次提示词并记录下来。之后的请求——包括 --continue 或 --resume 之后——都会复用这份记录，直到对话被压缩。迭代期间传入 --system-prompt-snapshot off，可让每次请求都重建。"
  },
  {
    q: "某个自定义项正在破坏你的会话，而你不知道是哪一个。哪个标志可以在让工具和权限照常工作的同时将其隔离出来？",
    options: [
      "--bare",
      "--restricted",
      "--safe-mode",
      "--disable-slash-commands"
    ],
    answer: 2,
    explain: "--safe-mode 会禁用自定义项——CLAUDE.md、技能、插件、钩子、MCP 服务器、命令、代理、输出样式、状态栏、自动记忆——而身份验证、模型选择、内置工具和权限仍照常工作。--bare 用于启动速度，--restricted 用于共享机器上的隔离。"
  }
]} />

<Flashcards cards={[
  {front: "--bg vs -p", back: "互斥。--bg 立即返回并给出会话 ID；-p 等待并打印答案。将 --bg 与 --exec 搭配，可在后台运行 shell 命令而不是 Claude 会话。"},
  {front: "--max-budget-usd", back: "print 模式的上限，对照的是 Claude Code 的客户端成本估算，而不是你的账单。子代理花费计入；由 --continue/--resume 恢复的总额不计入。v2.1.217+。"},
  {front: "--system-prompt-snapshot off", back: "在每次请求时重建系统提示词，而不是复用对话第一次请求时记录的那份。v2.1.257+。"},
  {front: "__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__", back: "只含该标记的一行会切分替换系统提示词，使上半部分保持缓存，下半部分随每次运行变化。v2.1.275+。"},
  {front: "--tools vs --allowedTools", back: "--tools 决定存在哪些内置工具。--allowedTools 决定哪些调用无需权限提示即可运行。两者都不影响 MCP 工具。"},
  {front: "claude doctor vs /doctor", back: "`claude doctor` 无需启动会话即可打印只读的安装与设置诊断。会话内的 `/doctor` 命令还可以应用修复。"},
  {front: "claude respawn --all", back: "重启所有运行中的后台会话，对话保持完整——升级 Claude Code 二进制文件之后该做的操作。"},
  {front: "--add-dir", back: "授予对另一个目录的文件读取/编辑权限。它不会让 Claude Code 从那里发现大部分 .claude/ 配置。"}
]} />

<Callout type="takeaways" items={["先选会话类型——决定类型的那个标志会约束你之后能传的所有其他标志。","无人值守运行需要五个标志，而不是一个：-p、--permission-prompts none、--max-turns、--max-budget-usd，以及结构化的输出格式。","把 --max-budget-usd 当作单次运行的断路器，而不是账单上限。它是客户端估算，恢复的总额会漏过它。","对话在第一次请求时记录其系统提示词。如果提示词的修改似乎被忽略，原因就在于此——迭代时使用 --system-prompt-snapshot off。","--bare 是速度，--safe-mode 是诊断，--restricted 是隔离。选错一个会浪费一个下午。","--help 在设计上就不完整。CLI 参考才是事实来源，版本下限也很重要——在怪罪某个标志之前，先检查 claude -v。"]} />

## 下一步

- [无头模式与 Agent SDK](/docs/claude-code/headless-and-agent-sdk) — 当一次性的 `-p` 调用不够用时，该构建什么
- [settings.json：配置系统](/docs/claude-code/settings) — 你总在重复输入的那些标志的持久归宿
- [排查 Claude Code 问题](/docs/claude-code/troubleshooting) — 从症状出发的排查，从 `--safe-mode` 开始
