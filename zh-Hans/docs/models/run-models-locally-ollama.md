# 用 Ollama 在本地运行 AI 模型

> Source: https://derob98.github.io/ailmanac/zh-Hans/docs/models/run-models-locally-ollama · AILmanac (CC BY 4.0) · last verified 2026-10-21

在你自己的机器上运行开放权重模型(Llama、Mistral、Qwen 等)——私密、离线、运行零成本——就用 Ollama。安装、命令行,以及如何通过代码调用。

<LevelBadge level="intermediate" />

前沿模型都在云端,但有一大类**开放权重**模型——Llama、Mistral、Qwen、DeepSeek、Gemma——你可以下载下来,在自己的笔记本或服务器上运行。[Ollama](https://ollama.com/) 是最简单的方式:装一次,敲一条命令,模型就在本地跑起来了。本页带你从零开始跑起一个模型,用代码调用它,并了解其中的取舍,这样你就不会指望一个 7B 的本地模型表现得像前沿模型。

<Callout type="objectives" items={[
  "了解为什么要在本地运行模型——以及与云端前沿模型相比的诚实取舍",
  "安装 Ollama,并用两条命令运行你的第一个模型",
  "使用核心命令行:pull、run、list、ps、rm、stop",
  "通过 Ollama 兼容 OpenAI 的 API,用代码调用你的本地模型",
  "理解内存需求、模型大小和量化,从而选出你的机器真正跑得动的模型",
  "知道什么时候 LM Studio(图形界面)是更好的起点",
]} />

## 为什么要在本地运行模型(以及什么时候不该)

在自己的硬件上运行模型,能给你带来四样东西:

- **隐私** — 你的提示词和数据永远不会离开你的机器。这正是受监管或敏感领域的团队转向本地模型的原因。(参见[如何选择模型](/docs/models/choosing-a-model)中关于隐私/自托管的分叉。)
- **离线** — 不需要网络、不需要 API,也不依赖服务是否宕机。模型就是你磁盘上的一个文件。
- **成本** — 没有按 token 计费的账单。下载完成后,运行它是“免费”的(你付出的是电费和硬件,而不是 API 开销)。如果大规模使用时的瓶颈是 [token 开销](/docs/power-user/token-economy),本地方案可能更划算。
- **掌控** — 固定到某个确切版本、自定义行为,集成时没有速率限制,也不会被服务条款的变化打个措手不及。

诚实的取舍:

- **能力差距。** 你能在笔记本上运行的模型(1B–14B 参数),在高难度推理、长上下文或智能体任务上,与云端前沿模型**不在同一个量级**。对许多日常任务来说差距很小;对最难的任务来说差距很大。
- **硬件。** 更大、更强的模型需要比普通机器更多的内存/显存。你往往是在选*硬件能跑的最大模型*,而不是现存最好的模型。
- **要自己运维。** 没有托管的扩缩容,没有自动升级——这就是掌控的代价。

一个常见而经久的做法:用一个小型评测来**做原型并选型**(方法与云端模型相同——参见[如何选择模型](/docs/models/choosing-a-model)),在私密/离线/大规模下划算的工作上用本地模型,而当任务确实需要额外能力时,再使用前沿 API。

## 安装 Ollama 并运行你的第一个模型

<Steps items={[
  {title: "安装 Ollama", body: "macOS 和 Windows:从 ollama.com/download 下载安装程序并运行。Linux:使用官方安装脚本(见下文)。这会安装 ollama 命令和一个本地后台服务。"},
  {title: "运行一个模型", body: "ollama run <model> 会在首次使用时下载模型(可能有好几 GB),然后进入交互式聊天。首次运行较慢,因为要拉取权重;之后的运行都是即时的。"},
  {title: "聊天,然后退出", body: "输入提示词并按回车。要退出交互会话,输入 /bye(或按 Ctrl+D)。模型会缓存在磁盘上,供下次使用。"},
  {title: "管理你下载的内容", body: "用 ollama list 查看已安装的模型,用 ollama rm <model> 删除某个模型并回收磁盘空间。"},
]} />

Linux 安装(macOS/Windows 改用下载的安装程序):

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

<PromptCard title="拉取并运行一个小模型(很好的第一选择)">{`ollama run gemma4:e2b`}</PromptCard>

这一条命令既会下载 `gemma4:e2b`——Ollama 官方快速入门最先用的模型,一个边缘规模的 Gemma 4 变体,约 2.3B *有效*参数,磁盘占用几 GB——又会启动一个交互式聊天。如果只想下载而暂不聊天,请改用 `ollama pull`。

<VerifyNote lastVerified="2026-10-21" source="https://docs.ollama.com/quickstart">
确切的**模型名称、可用参数规模和标签经常变化**,新版本不断发布。本页使用的名称——`gemma4:e2b`、`qwen3`、`deepseek-r1`、`gemma3`、`mistral`、`llama3.2`——在核查日期都在 Ollama 库中,同时还有 `qwen3.5` 这样的新成员,以及 `gemma4` 更大的 `12b`/`26b`/`31b` 标签。请把任何具体的名称/规模都视为易过期的信息:当前确切的拉取名称和规模,请浏览 <a href="https://ollama.com/library">ollama.com/library</a>。
</VerifyNote>

## 核心命令行

少数几条命令就能覆盖几乎所有需求。运行 `ollama --help` 查看完整列表。

```bash
# Download a model without starting a chat
ollama pull qwen3

# Start an interactive chat (downloads first if needed)
ollama run qwen3

# One-shot: pass the prompt inline, get the answer, exit
ollama run qwen3 "Summarize the CAP theorem in two sentences."

# List models you've downloaded
ollama list

# Show models currently loaded in memory
ollama ps

# Stop a running/loaded model (frees memory)
ollama stop qwen3

# Delete a downloaded model to reclaim disk
ollama rm qwen3
```

在交互式的 `ollama run` 会话中,输入 `/bye` 退出,输入 `/?` 查看会话内的命令。真正提供模型服务的后台服务由 `ollama serve` 启动(桌面应用会自动为你启动它)。

## 用代码调用它(兼容 OpenAI 的 API)

这一部分让本地模型在应用中真正有用。Ollama 后台服务在 **`http://localhost:11434`** 暴露一个本地 HTTP API,默认端口是 **11434**。它既有自己的原生端点(`/api/generate`、`/api/chat`),**也**在 `/v1` 提供**兼容 OpenAI** 的一层——因此大多数为 OpenAI SDK 编写的代码,只要改两行就能对着你的本地模型运行。

用 `curl` 直接发 HTTP 请求(原生端点):

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4:e2b",
  "messages": [
    { "role": "user", "content": "Why is the sky blue?" }
  ],
  "stream": false
}'
```

在 Python 中使用官方 OpenAI SDK——只需把 `base_url` 指向 Ollama,并传入任意非空的 `api_key`(Ollama 要求有这个字段,但会忽略它的值):

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # required by the SDK, ignored by Ollama
)

response = client.chat.completions.create(
    model="gemma4:e2b",
    messages=[
        {"role": "system", "content": "You are a concise assistant."},
        {"role": "user", "content": "Explain gradient descent in two sentences."},
    ],
)

print(response.choices[0].message.content)
```

因为它兼容 OpenAI,你对托管 API 使用的那些模式同样适用——包括流式输出和[工具调用 / 函数调用](/docs/api/tool-use),它们在本地的工作方式与在云端相同(前提是模型本身确实擅长这件事)。Ollama 的 `/v1` 层涵盖 `/v1/chat/completions`、`/v1/completions`、`/v1/responses`、`/v1/models`(以及 `/v1/models/{model}`)和 `/v1/embeddings`。

## 硬件、模型大小与量化

模型名称后面附带的数字——**1B、7B、8B、70B**——是它的**参数量**(以十亿计)。参数越多,通常意味着能力越强,*同时*也更吃内存。你能运行什么,实际的上限是**内存**(在 GPU 上则是**显存**)。

**量化**是让这一切在普通机器上可行的关键技巧。模型的权重最初以高精度存储(例如 16 位),但可以压缩到约 4 位,质量损失很小,往往几乎察觉不到。Ollama 默认提供的大多数模型都是量化过的——这就是为什么一个有数十亿参数的模型能装进几 GB。一个粗略的经验法则(请对照具体模型的页面核实):

- **约 1B–3B** 模型:在大多数现代笔记本上都能轻松运行(几 GB 内存)。
- **约 7B–8B** 模型:能力与可运行性兼顾的最佳点;预留数 GB 的空闲内存。
- **约 13B–14B** 模型:需要配置相当不错的机器。
- **约 70B 及以上**模型:需要有大量内存的工作站/服务器或强大的 GPU——不是典型笔记本的范围。

一个实用的做法:先从小模型(`gemma4:e2b`)开始,把整个工作流端到端跑通,再逐步*升级*到你的硬件仍能流畅运行的最大模型——而不是现存最大的模型。

<Flashcards title="本地模型词汇表" cards={[
  {front: "权重(Weights)", back: "那些学习得到的数字(参数),它们就是模型本身。在本地运行模型,就是把它的权重文件加载进内存,并用它来计算。"},
  {front: "开放权重模型", back: "权重可以由你下载并自行运行的模型(Llama、Mistral、Qwen、DeepSeek、Gemma)——能在本地运行的前提条件。"},
  {front: "参数(例如 7B)", back: "权重的数量,以十亿计。越高 = 通常能力越强,也越吃内存。决定你的机器能否运行它的主要因素。"},
  {front: "量化", back: "把权重压缩到更低的精度(例如 16 位 → 4 位),让模型能装进少得多的内存,代价是少量质量损失。这就是数十亿参数的模型能装进几 GB 的原因。"},
  {front: "上下文窗口", back: "模型一次能考虑的 token 数(提示词 + 输出)。本地模型可用的上下文往往比前沿模型小,而更大的上下文需要更多内存。"},
  {front: "量化标签(例如 q4)", back: "模型变体上的标签,表示它在精度与体积之间的取舍——位数越低 = 越小越快,位数越高 = 越接近完整质量。"},
]} />

## LM Studio:图形界面的替代方案

如果你不喜欢命令行,**[LM Studio](https://lmstudio.ai/)** 是一款桌面应用(macOS、Windows、Linux),通过图形界面完成同样的工作:浏览并下载开放模型,在内置界面中与它们聊天,并且——和 Ollama 一样——运行一个**兼容 OpenAI 的本地服务器**,让你的代码可以与之通信。对于非开发者或更喜欢点点鼠标而不是终端的人来说,它是更容易上手的入口;当你想要可编写脚本的命令行和轻量的后台服务时,Ollama 往往更胜一筹。两者运行的是同类的开放权重模型,所以本页的概念可以直接迁移。

<Quiz title="自测一下" questions={[
  {q: "与云端前沿模型相比,在本地运行模型最大的诚实取舍是什么?", options: ["本地模型无法通过代码调用", "笔记本规模的本地模型在高难度任务上能力较弱", "本地模型每个 token 的成本更高"], answer: 1, explain: "能力差距才是真正的取舍:小到能在本地运行的模型,在最难的推理/智能体任务上落后于云端前沿模型。通过代码访问和每 token 成本,其实反而是本地的优势。"},
  {q: "哪条命令会(在需要时)下载模型,并且开始与它聊天?", options: ["ollama pull gemma4:e2b", "ollama serve gemma4:e2b", "ollama run gemma4:e2b"], answer: 2, explain: "ollama run 在首次使用时下载,然后打开一个交互式会话。ollama pull 只负责下载;ollama serve 启动后台服务。"},
  {q: "要用 OpenAI SDK 代码调用你的本地模型,需要设置什么?", options: ["一个真正的付费 OpenAI API 密钥", "把 base_url 设为 http://localhost:11434/v1,并使用任意非空的 api_key", "什么都不用——它会自动对接 api.openai.com"], answer: 1, explain: "把 base_url 指向 Ollama 本地的 /v1 端点,并传入任意非空的 api_key(Ollama 要求有这个字段,但会忽略它的值)。"},
  {q: "为什么一个有数十亿参数的模型只需几 GB 内存就能装下?", options: ["参数是从云端流式加载的", "量化把权重压缩到了更低的精度", "Ollama 只加载模型的一部分"], answer: 1, explain: "量化以更低的精度存储权重(例如 4 位而不是 16 位),在少量质量损失的代价下缩小了内存占用。"},
]} />

<Callout type="takeaways" items={[
  "本地 = 隐私 + 离线 + 没有按 token 计费的成本 + 掌控;代价是真实存在的能力差距和硬件限制。",
  "两条命令就能跑起来:安装 Ollama,然后 ollama run gemma4:e2b。",
  "核心命令行:pull(下载)、run(聊天)、list、ps、stop、rm——大部分需求就靠这些。",
  "通过兼容 OpenAI 的端点用代码调用:base_url 设为 http://localhost:11434/v1,api_key 用任意非空值。",
  "参数量 + 量化决定你的机器能否运行某个模型——从小的开始,再升级到能流畅运行的规模。",
  "更喜欢图形界面?LM Studio 用点选的方式完成同样的工作,也提供一个兼容 OpenAI 的本地服务器。",
]} />

## 来源与延伸阅读

- [Ollama](https://ollama.com/) — 官方网站与下载。
- [Ollama 模型库](https://ollama.com/library) — 当前的模型及其确切的拉取名称/规模。
- [Ollama 命令行参考](https://docs.ollama.com/cli) · [Ollama API 文档](https://docs.ollama.com/api) — 命令和端点的权威参考。
- [Ollama 关于 OpenAI 兼容性的博客文章](https://ollama.com/blog/openai-compatibility) — `/v1` 端点与 SDK 用法。
- [GitHub 上的 Ollama](https://github.com/ollama/ollama) — 源代码、议题和详细文档。
- [LM Studio](https://lmstudio.ai/) — 运行本地模型的图形界面替代方案。

## 接下来

- 在给拉取的模型开放工具访问之前 → [带后门的开放权重:被“消除限制”(abliterated)模型的供应链](/docs/security/backdoored-open-weights) — 你拉取的 GGUF 通常是三方信任链中的第 3 环
- 要把大型 Claude 系统提示词迁移到本地模型? → [为什么 35 KB 的系统提示词在本地模型上会失灵](/docs/models/large-system-prompts-on-local-models)
- 量化能比 4 位再低多少? → [三值量化实践:Bonsai 2 27B 仅 5.95 GB](/docs/models/ternary-quantization-bonsai-2-27b) — 每个权重 1.75 位,以及为什么 Ollama 无法加载它
- 为某项任务决定用本地还是云端 → [如何选择模型](/docs/models/choosing-a-model)
- 让工具在本地也能工作 → [工具调用](/docs/api/tool-use)
- 看看运行模型实际要花多少钱 → [Token 经济学](/docs/power-user/token-economy)
