<div align="center">

# AILmanac

### 一份会告诉你每个页面最后核对日期的 Claude 与 AI 工具指南。

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Italiano](./README.it.md)

**[阅读简体中文站点](https://derob98.github.io/ailmanac/zh-Hans/)**

</div>

---

AI 工具每周都在变化，而大多数教程并不说明自己写于何时。AILmanac 是一份免费、开源的指南，内容涵盖 **Claude**（各个应用、**Claude Code** 与 **API**）以及与之相关的其他模型和智能体。每个页面都标注了难度等级，用平实的语言写成，并注明了依据来源核对的日期。

> [!NOTE]
> AILmanac 是独立项目，与 Anthropic 没有隶属关系，也未获得 Anthropic 的赞助或认可。"Claude" 和 "Anthropic" 是 Anthropic 的商标。如果 AILmanac 与[官方文档](https://docs.anthropic.com)不一致，请以官方文档为准。

## 在 Claude Code 中使用

两条命令即可把这份指南作为插件添加到 Claude Code：

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

之后，在任意会话中：

- **提出问题**：关于 Claude、Claude Code、API 或 MCP 的问题，`ailmanac` 技能会在指南中查找答案，并附上页面链接和核对日期，而不是凭记忆回答。
- **运行 `/ailmanac:claude-md-check`**：它会把你的 `CLAUDE.md` 与它所描述的仓库以及记忆文件的加载方式逐项对照，然后给出具体的修改建议。
- **七个按角色划分的技能包**会在需要时自动加载：开发、研究、数据分析、写作、营销、学习和日常效率。

这些技能只读取本站和本仓库的公开页面，不会把你项目中的任何内容发送给 AILmanac。

## 其他内容

最新数据、近期新增页面、贡献方式和许可证信息请见[英文 README](./README.md)。指南已翻译成十二种语言；尚未翻译的页面会以英文显示。
