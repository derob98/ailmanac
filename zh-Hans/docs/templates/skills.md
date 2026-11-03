# 技能包与 SKILL.md 模板

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/templates/skills · AILmanac (CC BY 4.0) · last verified 2026-07-20

按用户类型分类的即用型 Agent Skills，以及如何编写你自己的技能。

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-07-20" source="https://code.claude.com/docs/en/skills">
技能文件的布局以及技能可用的场景（Claude Code、Claude.ai、Cowork、云端会话）会不断演进 —— 请在官方 Skills 文档中确认具体细节。自定义命令现已合并进技能：`.claude/commands/` 下的文件仍然有效，但推荐的形式是技能。
</VerifyNote>

**技能（Skill）** 赋予 Claude 一项专注的专长，当你的请求匹配时它会*按需*加载 —— 这样你就不必每次都重新解释你的需求。AILmanac 自带了一套**即用型技能包**，每种用户类型对应一个。在 [Skills](/docs/claude-code/skills) 页面深入学习这一概念。

## 现成的技能包

它们位于仓库的
[`plugins/ailmanac/skills`](https://github.com/derob98/ailmanac/tree/main/plugins/ailmanac/skills) 文件夹中：

| 技能包 | 适用对象 | 它能做什么 |
|---|---|---|
| `ailmanac` | 任何询问 Claude 或其他 AI 工具的人 | 在本指南中查找答案，并引用该页面及其核实日期 |
| `claude-md-check` | Claude Code 用户 | 对照你的仓库以及记忆文件的加载方式，检查你的 `CLAUDE.md` |
| `writing-content-pro` | 作者、营销人员、创作者 | 简报 → 分轮次起草 → 匹配你的语气 → 二次利用 |
| `developer-workflow` | 开发者 | 上下文优先的编码、审查、测试、清晰的提交 |
| `research-analyst` | 研究员、分析师 | 有来源支撑的综合，恪守引用规范 |
| `data-analyst` | 数据与电子表格用户 | SQL/公式 + 通俗易懂的解读 + 统计合理性检查 |
| `business-marketing` | 创始人、中小企业主 | 定位、文案、客户沟通、轻量规划 |
| `student-learning` | 学生与学习者 | 苏格拉底式辅导 + 复述教学（去学习，而不是照抄） |
| `everyday-productivity` | 所有人 | 邮件、摘要、规划、决策 |

每一个都融入了既定准则：**给出上下文、反复迭代、并核实重要内容。**

## 安装它们（Claude Code）

一次装全部，作为插件：

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

或者从仓库的克隆中复制单个技能包：

```bash
# personal — available in all your projects
mkdir -p ~/.claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro ~/.claude/skills/

# or per-project — shareable with your team via the repo
mkdir -p .claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro .claude/skills/
```

当你的请求匹配技能的 `description` 时，Claude 会自动激活该技能。在 Claude.ai / Cowork 上，创建一个技能并粘贴该技能包的 `SKILL.md`（可用性因套餐而异）。

## 编写你自己的技能 —— 最小化模板

一个技能就是一个包含 `SKILL.md` 的文件夹：YAML frontmatter + 指令。`description` 就是**触发条件** —— 把它写成「Use when…（在……时使用）」。只有 `description` 是必需的；命令名称取自文件夹名。

```markdown
---
description: Use when the user is doing X — be specific about the trigger so Claude knows when to load this and when not to.
---

# My Skill

Short statement of the role/goal.

## Workflow
1. Step one…
2. Step two…

## Rules
- The non-negotiables (accuracy, privacy, output format).

## Default output
What a good response looks like.
```

### 有效性检查清单

- [ ] 文件夹名为 kebab-case —— 它会成为 `/command-name`。
- [ ] `description` 说明了**何时使用它**（触发条件），而不只是它是什么。把最关键的使用场景放在最前面（`description` 与 `when_to_use` 合并后，在技能列表中会被截断为 1,536 个字符）。
- [ ] 指令具体且有边界 —— 一项明确的任务。
- [ ] 不包含任何密钥、凭据或个人/客户数据。
- [ ] 说明了如何处理不确定性（不要编造；要核实）。

## 相关内容

- [Skills：按需调用的专长](/docs/claude-code/skills) —— 完整概念
- [自定义斜杠命令](/docs/claude-code/slash-commands) —— 由你按需触发
- [子智能体](/docs/claude-code/subagents) —— 把整块工作委托出去


## 下一步

- [MCP 配置与服务器脚手架](/docs/templates/mcp-config)
