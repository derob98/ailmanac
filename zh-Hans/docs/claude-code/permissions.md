# 权限与权限模式

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/claude-code/permissions · AILmanac (CC BY 4.0) · last verified 2026-08-18

allow/ask/deny 规则与模式——在不牺牲安全的前提下减少确认提示。

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-08-18" source="https://code.claude.com/docs/en/whats-new/2026-w32">
具体的规则语法和模式名称会不断演进——请以 Claude Code 官方的权限与权限模式文档为准。**自 v2.1.283 起：** `auto` 是所有套餐和提供商下交互式终端及 VS Code 会话的内置起始模式（见下文）。
</VerifyNote>

<Callout type="objectives" items={["三种权限裁决（allow / ask / deny）的含义", "权限规则如何将工具与模式匹配", "六种权限模式及各自的适用场景", "为什么 auto 模式现在是交互式会话的起始模式——以及如何退出", "auto 模式如何用安全分类器取代确认提示", "如何建立一份合理的初始 allowlist，在不牺牲安全的前提下减少提示", "项目级与个人权限规则分别存放在哪里"]} />

权限决定了 **Claude Code 无需停下来询问你就能做什么**。调得好，你既能保持流畅又不失控；调得不好，你要么对一切无脑放行，要么被提示淹没。

## 三种裁决

每个可能的操作最终都会得到以下之一：

<Flashcards cards={[{front: "allow", back: "直接执行，不提示。"}, {front: "ask", back: "暂停并询问你——所有未明确允许或拒绝的操作的默认行为。"}, {front: "deny", back: "绝不执行，即使你要求也不行。"}]} />

规则通常将一个工具与一个模式匹配，例如 allow `Bash(npm run test:*)` 或 deny `Read(./.env)`。

<PromptCard title="允许某个工具 + 模式">{`Bash(npm run test:*)`}</PromptCard>

<PromptCard title="拒绝某个工具 + 模式">{`Read(./.env)`}</PromptCard>

## 权限模式

模式决定一次会话的整体姿态。共有六种。常用的几种可用 `Shift+Tab` 循环切换，也可以在设置中指定 `permissions.defaultMode`。

| 模式 | 无需询问即可执行 | 适用场景 |
|---|---|---|
| **`default`**（显示为 **Manual**） | 仅读取 | 日常工作、敏感改动 |
| **`acceptEdits`** | 读取、文件编辑、常见文件系统命令 | 受信任且范围明确的编辑会话 |
| **`plan`** | 读取，以及在 auto 模式可用时由分类器批准的命令；从不编辑你的源代码 | 大型或有风险的任务——参见 [Plan Mode](/docs/claude-code/plan-mode) |
| **`auto`** *（自 v2.1.283 起为交互式会话的起始模式）* | 一切操作，由安全分类器审查 | 提示疲劳才是真正风险的长任务 |
| **`dontAsk`** | 你工作目录中的文件读取以及预先批准的工具；任何会触发提示的操作都会被拒绝 | 锁定的 CI 和脚本 |
| **`bypassPermissions`** | 一切操作，不做任何检查 | 仅限沙箱/容器——**绝不**要在存有机密的机器上使用 |

### auto 模式现在是 Claude Code 的默认模式

自 Claude Code **v2.1.283** 起，`auto` 是**所有套餐和提供商**下交互式终端及 VS Code 会话的内置起始模式。在更早的版本中，自 2026 年 8 月 14 日起，它仅是 Pro、Max 和 Team 套餐新会话的默认模式。Anthropic 给出的理由（来自其对 1,000 多名付费用户的自测）：分类器拦截了 **89%** 的有害操作，而人工审查仅为 **13.6%**——因为习以为常的用户在没读的情况下就接受了约 97% 的人工提示。

两项例外保留了你的意图：

- 如果**你**在用户设置中指定了 `permissions.defaultMode`，它会保持不变，除非你接受一次性的应用内切换提示。
- 如果默认值由**你的组织**管理（Team/Enterprise 托管设置），则不会自动更改。

你随时可以在会话中用 `Shift+Tab` 循环切换模式。这些套餐上已经生效的一项相关变更：auto 模式发起的分类器调用**不再计入你的用量限额**。

<PromptCard title="提前启用（8 月 14 日之前）——将 auto 设为默认">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "auto"
  }
}`}</PromptCard>

<PromptCard title="8 月 14 日之后继续沿用旧的提示行为">{`~/.claude/settings.json
{
  "permissions": {
    "defaultMode": "default"
  }
}`}</PromptCard>

### auto 模式究竟如何运作

`auto` 介于“凡事都提示”与“关闭安全机制”之间。它不再询问你，而是由一个独立的**分类器模型**在每个操作执行前进行审查，并拦截任何超出你所要求范围的操作、触及它不认识的基础设施的操作，或看起来由 Claude 刚读到的恶意内容驱动的操作。明确的 `ask` 规则仍会停下来询问你。

它会拦截 `curl | bash`、force push、生产环境部署和迁移、对未解析变量执行 `rm -rf`、篡改对话记录、会丢弃未提交工作的破坏性 git 命令，以及将机密发送到外部端点等操作——同时让日常工作（本地编辑、安装已声明的依赖、只读 HTTP、推送到你自己的分支）直接通过。如果同一操作被反复拦截，auto 模式会暂停，并把提示的决定权交还给你。

auto 模式并非安全保证——它减少提示，但并不免除审查敏感操作的必要。可用性取决于你的套餐、模型，以及（在 Team/Enterprise 上）管理员的开关。如果你要真正无人值守地运行（cron、云端会话、CI），请搭配 [Hardening Autonomous Runs](/docs/security/hardening-autonomous-runs) 使用——auto 仍然不是 `bypassPermissions`。

<Callout type="warning" items={["bypassPermissions 只属于沙箱。在你的真实机器上关闭所有提示运行，正是代理最终碰到不该碰的东西的原因。请把它留给一次性环境——如果你真正想要的是减少提示，请改用 auto 模式。参见 /docs/security/hardening-autonomous-runs 上的 Hardening Autonomous Runs。"]} />

## 一份合理的初始 allowlist

目标：预先允许安全且重复的操作；将破坏性操作保持在 **ask** 或 **deny**。

<Steps items={[{title: "允许安全且重复的操作", body: "读取文件、运行你的测试/lint/构建命令、git status/diff。"}, {title: "中等风险的先询问", body: "安装依赖、在项目之外写入文件、网络调用。"}, {title: "拒绝破坏性操作", body: "读取机密文件（.env、密钥文件）、force-push、rm -rf。"}]} />

将项目规则存放在 [`settings.json`](/docs/claude-code/settings)（共享），将个人覆盖存放在 `settings.local.json`。

<Callout type="tip" items={["让它从你的提示中学习：把同一条安全命令批准几次，你就会清楚该往 allowlist 里加什么——把反复出现的提示变成一次性规则。"]} />

<Callout type="takeaways" items={["三种裁决：allow（不提示）、ask（默认——暂停并确认）、deny（绝不）。", "规则将工具与模式匹配，例如 Bash(npm run test:*) 或 Read(./.env)。", "六种模式决定会话姿态：default（Manual）、acceptEdits、plan、auto、dontAsk、bypassPermissions。", "自 v2.1.283 起，auto 是所有套餐下交互式终端和 VS Code 会话的起始模式；你自己设置的 defaultMode 保持不变，组织托管的默认值不受影响。", "auto 模式用安全分类器审查每个操作，而不是提示你——这是应对提示疲劳的工具，而不是 bypassPermissions。", "建立 allowlist：安全且重复的用 allow，中等风险的用 ask，破坏性的用 deny。", "共享规则放在 settings.json；个人覆盖放在 settings.local.json。"]} />

<Quiz title="自测" questions={[{q: "对于一个既没有明确允许也没有明确拒绝的操作，默认的 'ask' 裁决会怎么做？", options: ["静默执行", "暂停并请你确认", "永久拦截"], answer: 1, explain: "ask 是所有未明确允许或拒绝的操作的默认行为——它会暂停并询问你。"}, {q: "哪种权限模式只有在沙箱或容器中才安全，绝不能在存有机密的机器上使用？", options: ["plan", "acceptEdits", "bypassPermissions"], answer: 2, explain: "bypassPermissions 会完全跳过提示和安全检查；请把它留给一次性环境——绝不要用在存有机密的机器上。"}, {q: "你希望在一个长任务中大幅减少权限提示，但仍想保留安全网。应该用哪种模式？", options: ["bypassPermissions——跳过所有提示", "auto——分类器审查每个操作并拦截有风险的操作", "dontAsk——从不打断你"], answer: 1, explain: "auto 模式用分类器取代提示，拦截 curl | bash、force push 和生产部署等升级操作。bypassPermissions 去掉了安全网；dontAsk 只是直接拒绝所有未预先批准的操作。"}, {q: "共享的项目权限规则与个人覆盖应分别存放在哪里？", options: ["都放在 settings.local.json", "项目规则放在 settings.json；个人覆盖放在 settings.local.json", "项目规则放在 settings.local.json；个人覆盖放在 settings.json"], answer: 1, explain: "项目规则放在 settings.json（共享）；个人覆盖放在 settings.local.json。"}, {q: "在一份合理的初始 allowlist 中，下列哪一项应当放进 'deny' 列表？", options: ["git status / diff", "rm -rf 和读取 .env", "运行你的测试/lint/构建命令"], answer: 1, explain: "拒绝破坏性操作：读取机密文件（.env、密钥文件）、force-push 和 rm -rf。"}, {q: "2026 年 8 月 14 日，如果你已在用户设置中将 permissions.defaultMode 设为 'default'，Pro 套餐上会发生什么？", options: ["自动被覆盖为 'auto'", "保持 'default'，除非你接受一次性的应用内切换提示", "auto 模式仍会悄悄应用到每个新会话"], answer: 1, explain: "你在用户设置中自行指定的 defaultMode 会被保留；Claude Code 会提供一次性切换提示，但不会覆盖你的选择。组织托管的默认值同样不受影响。"}]} />

## 下一步

- [settings.json：配置系统](/docs/claude-code/settings)
- [Hooks](/docs/claude-code/hooks)——在 allow/deny 之外确定性地强制执行规则
- [Sandbox Credential Masking](/docs/claude-code/sandbox-credential-masking)——让 `gh`、`npm` 和 `aws` 完成认证，而沙箱中的命令始终拿不到真实机密
- [安全与负责任使用](/docs/security/responsible-use)
