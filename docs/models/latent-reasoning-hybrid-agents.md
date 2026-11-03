# Latent Reasoning: Agents That Think Without Words

> Source: https://derob98.github.io/ailmanac/docs/models/latent-reasoning-hybrid-agents · AILmanac (CC BY 4.0) · last verified 2026-10-19

HybridAgent is the first open-weight agent that does most of its thinking as hidden states instead of tokens — 170-183 latent steps per task against ~300 text tokens, 35.5-54.7% fewer tokens, 2.7-3.7x cheaper. The mechanism (a ~10M-parameter adapter), the reason it loops forever if you load it in llama.cpp, and why 'inspectable latent thoughts' is the most contested claim in the paper.

<LevelBadge level="advanced" />

Every reasoning model you have ever used thinks by writing. Extended thinking, `<thinking>` blocks, scratchpads, ReAct traces — the model's deliberation is a stream of tokens, which means you can read it, and it means you pay for every word of it.

**Latent reasoning** asks what happens if you cut out the words. Instead of sampling a token from the final hidden state and feeding the token's embedding back in, you feed the *hidden state itself* back in. No vocabulary projection, no sampling, no text. The model keeps thinking; the thought is now a vector.

This has been a research curiosity since Meta's Coconut in late 2024. On **13 October 2026** it became something you can download: Together AI's [HybridAgent](https://arxiv.org/abs/2610.18861) is the first latent-reasoning *agent* — it thinks in hidden states, calls a Python interpreter and a search engine through text, and ships as MIT-licensed 8B and 14B checkpoints. It hit the Hacker News front page with 396 points and 192 comments, and the comments split almost exactly down the middle between "this is the way" and "you just deleted the only thing we could audit."

Both camps are right about something. This page covers the mechanism, the numbers, the reason several testers got an infinite loop instead of an answer, and the one claim in the paper you should not take at face value.

<Callout type="objectives" items={[
  "Explain latent reasoning in one sentence: feed the hidden state back as the next input embedding instead of projecting it to a token",
  "Read the HybridLink formula and understand why a ~10M-parameter adapter is all that stands between a text model and a latent one",
  "Cite the real split: 170-183 latent steps per instance against ~302 text tokens, where a text-only agent spends ~596",
  "Know why loading these weights in llama.cpp or plain Transformers gives you a looping text model, not a latent agent",
  "Argue both sides of the inspectability claim — including the paper's own causal test showing latent thoughts carry 44.9-51.3% of the accuracy",
  "Place HybridAgent against Coconut and Soft Thinking, and know which of the three needs no training at all"
]} />

<VerifyNote lastVerified="2026-10-19" source="https://arxiv.org/abs/2610.18861">
HybridAgent was submitted on 13 October 2026 and the repository is days old (216 stars, 28 forks at the time of writing). Benchmark numbers, checkpoint names, download counts and the serving story will all move. The **mechanism** — hidden states as the reasoning medium, a small adapter as the bridge, and the monitorability trade it forces — is the durable part. Re-check the repo before you build on any specific command.
</VerifyNote>

## The mechanism: one skipped step

Take a standard decoder. At step `t` it produces a last-layer hidden state `h_t`, projects it through the unembedding matrix to logits over the vocabulary, samples a token, looks that token up in the embedding table, and feeds the embedding in as input `t+1`.

That round trip through the vocabulary is a bottleneck in the literal information-theoretic sense. A hidden state in a modern 8B model is a few thousand floating-point numbers. A token is a choice from ~150,000 options — roughly 17 bits. **Sampling a token throws away almost everything the hidden state contained** and keeps the one discrete symbol a human can read.

Latent reasoning skips the round trip. Feed `h_t` back in directly. The model's next forward pass conditions on the full continuous state rather than on the 17-bit summary of it.

The problem is that `h_t` lives in the *output* space and the model expects something from the *input embedding* space. The distributions do not match, and feeding one into the other naively produces garbage. HybridLink is the fix, and it is almost embarrassingly small:

```
e_{t+1} = h_t + W_2 · σ(W_1 · h_t)
```

A two-layer MLP with a residual connection. The residual is the load-bearing part: it carries `h_t` through unchanged so semantics survive, while the MLP branch nudges it into the input distribution. The paper puts it at roughly `2 · d_h²` parameters — about **10M for a 4B backbone**. Three orders of magnitude smaller than the model it steers.

<Callout type="key" items={[
  "A token is ~17 bits. A hidden state is thousands of floats. Sampling is lossy compression of the model's own thought, performed once per step.",
  "HybridLink is e_{t+1} = h_t + W_2·σ(W_1·h_t) — a residual two-layer MLP, ~10M params for a 4B model. That adapter is the whole bridge.",
  "The residual connection is not decoration. The authors' ablation shows the residual design gives consistent gains across all three downstream benchmarks."
]} />

## What makes it an *agent*, not just a reasoner

Coconut and Soft Thinking both do latent reasoning. Neither can call a tool, because tools are a text interface: you emit a function call, something runs, text comes back. A model mid-latent-thought has no tokens to emit and nowhere to put the result.

HybridAgent solves this with two pieces.

<Steps items={[
  {
    title: "Anchor tokens mark the mode boundary",
    body: "The tokenizer gains <latent> and </latent>. The model emits <latent> in text mode to enter latent mode; HybridLink then loops hidden states back in. Latent mode closes when the nearest-neighbour token to the current (projected) state is </latent> — the model's own geometry decides when it has thought enough. There is no fixed latent budget. Coconut, by contrast, settled on a constant number of latent thoughts because letting a classifier decide performed no better."
  },
  {
    title: "A continuous working memory carries everything across turns",
    body: "Instead of serialising the turn to text and re-encoding it, HybridAgent appends KV entries — M⁽¹⁾ = M⁽⁰⁾ ⊕ [K≤t, V≤t] — so text spans, latent spans and tool outputs accumulate in one cache. Latent thoughts have no text form, so there would be nothing to re-encode: the KV cache IS the transcript. This is why the paper calls the hybrid context 'lossless' across turns."
  },
  {
    title: "Two training stages teach the mode switch",
    body: "HybridSFT teaches the backbone to coordinate with HybridLink on tool-integrated hybrid sequences. Then HybridRL scales it with reward r(τ) = r_correct + r_format + r_tool. Note what is absent: there is NO reward term for using latent mode. The text/latent balance is emergent, not incentivised."
  },
  {
    title: "Tools stay ordinary",
    body: "A sandboxed Python interpreter and a live search engine (Tavily in the paper's setup), capped at 10 calls per trajectory with top-10 snippets per query. Nothing about the tool layer is exotic — the agent drops back to text to call them, exactly as ReAct would."
  }
]} />

The training detail worth stealing is **self-conditioned supervision**. Naive teacher forcing feeds ground-truth latent embeddings during training, so at inference the model meets its own HybridLink outputs for the first time and drifts. The fix is a two-pass scheme: pass one teacher-forces the ground-truth hybrid sequence, pass two replays the identical sequence with the model's *own* generated latent embeddings substituted in. Table 3 reports this worth **30.5% on average** across AIME25/26 and MATH500 over activating HybridLink without it. It is the same exposure-bias problem that scheduled sampling addresses in sequence models, and the same shape of fix.

## The numbers

<Callout type="warning" items={[
  "These are the authors' own numbers on their own harness, days old, with no independent replication. Read them as a claim, not a measurement you can bank.",
  "The headline '10.4% improvement' is an average across 3 model scales and 11 benchmarks against a mix of baselines. Per-benchmark it ranges from +1.8 points to +42.5."
]} />

| Claim | Figure |
| --- | --- |
| Average performance gain | **+10.4%** across 3 scales, 11 benchmarks |
| Token reduction | **35.5-54.7%** |
| Inference speed | **1.8x-2.6x** faster |
| Cost | **2.7x-3.7x** cheaper |
| Text tokens per instance (8B) | **~302**, against a text agent's **~596** |
| Latent steps per instance | **170-183** |

The last two rows are the ones that actually explain the architecture. HybridAgent emits roughly half the text of a text-only agent — and performs 170-183 additional forward passes that produce no text at all. **It is not thinking less. It is thinking in a medium that does not bill by the word.**

That also tells you where the cost saving comes from, and where it does not. A latent step is still a full forward pass: same FLOPs, same latency, same memory traffic as generating a token. The saving is not free computation. It comes from (a) not paying the decode-and-re-embed overhead, (b) a far shorter KV sequence because latent spans are dense rather than spelled out, and (c) fewer total steps to reach an answer. If your bill is dominated by prefill of a large static context, latent reasoning does nothing for you.

Against latent baselines the gaps are large — on GAIA Level 1 the paper reports **+39.8% over Coconut** and **+28.2% over Soft Thinking**, and around +41-42% on WebWalker for both. That is less a vindication of HybridAgent's reasoning than a reminder that Coconut and Soft Thinking were never built to hold a multi-turn tool loop together. Against the *text* baselines the margins are modest and honest: AIME25 39.2% vs ARPO's 37.1%, MATH500 84.6% vs 82.8%, MuSiQue 32.0% vs 28.5%.

## The gotcha that bit everyone on day one

Several people on the launch thread reported the same failure: ask the 8B "who is the pope?" and it loops forever. One tester saw identical looping with the 14B in llama.cpp at both 8-bit and 16-bit, and concluded the problem was llama.cpp rather than the model.

That diagnosis is almost certainly right, and the model card says why in one line: **standard Transformers loading yields a text-only variant**, because the hybrid behaviour lives in `adapter.pt` / `adapter_config.json` — the HybridLink weights — plus the custom generation engine in the repo.

Think through what a generic runtime does with these weights. The tokenizer has `<latent>` and `</latent>`. The fine-tuned backbone has learned to emit `<latent>` and then expect HybridLink to take over. In llama.cpp or plain `AutoModelForCausalLM`, nothing takes over. There is no component that loops hidden states back, and no component that evaluates the nearest-neighbour closing condition. The model enters a mode that does not exist and never finds its way out.

<Callout type="warning" items={[
  "This is an inference-stack-shaped model, not a weights-shaped model. GGUF conversion, vLLM, Ollama and plain Transformers will not reproduce the paper's behaviour — they cannot, because HybridLink is not in the graph.",
  "Infinite generation on a trivial question is the signature of a missing HybridLink, not a broken checkpoint.",
  "The README documents no serving path other than the repo's own batch inference engine. Treat 'can I serve this?' as unanswered, not as yes."
]} />

<PromptCard title="The only path that runs the actual architecture">
{`git clone https://github.com/togethercomputer/HybridAgent.git && cd HybridAgent
conda create -n hybridagent python=3.11 -y && conda activate hybridagent
pip install torch==2.11.0 --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements.txt && pip install -e .
cp .env.example .env   # set TAVILY_API_KEY — the search tool needs it

python -m hybrid_inference.run_batch \\
  --model togethercomputer/HybridAgent-8B-Agentic \\
  --input examples/questions.jsonl \\
  --output outputs/results.jsonl --num_samples 4`}
</PromptCard>

If you want to *see* latent thoughts rather than benchmark them, the repo ships a dedicated viewer that renders a run as an HTML report with pseudo-text thoughts interleaved with tool calls and observations:

<PromptCard title="Render one trajectory's latent thoughts as readable pseudo-text">
{`python -m interpretable_latent_mode \\
  --model togethercomputer/HybridAgent-14B-Agentic \\
  --question "Which of these two papers reports a larger token reduction, and by how much?" \\
  --output report.html`}
</PromptCard>

Training is a different scale of commitment. HybridSFT wants **8-16 GPUs**; HybridRL wants **32 GPUs across 4 nodes**. This is not a fine-tune you run on a workstation.

## The contested claim: are latent thoughts really inspectable?

The paper's strongest rhetorical move is that latent reasoning does not cost you transparency. Every latent step can be read out as pseudo-text, by taking the state HybridLink produced and finding its nearest neighbour in the embedding table by cosine similarity. Figure 2 shows the result is readable and context-specific, and stays semantically aligned with the surrounding text reasoning.

It is a real capability, and it is more than Coconut offered. It is also the weakest link in the argument, for a reason a commenter put precisely: nearest-neighbour decoding **"loses meaning where the model is expressing combinations of tokens in a vector."** The entire premise of latent reasoning is that a hidden state carries more than any single token can. Reading it out *as* a single token necessarily discards the surplus — the exact surplus that made the technique worth doing.

The paper's own experiment makes this concrete and is the most interesting result in it. Table 5 runs causal interventions: corrupt the latent thoughts and accuracy drops **44.9-51.3%**. The latent stream is not a decorative side channel. It is carrying roughly half the model's problem-solving.

So the two claims — *latent thoughts are load-bearing* and *latent thoughts are faithfully readable as single tokens* — are in tension. A readout that compressed a load-bearing vector down to its nearest word and lost nothing would mean the vector never needed to be a vector.

This matters beyond interpretability aesthetics, because reading the chain of thought is currently a live safety control. The 2025 cross-lab position paper **[Chain of Thought Monitorability](https://arxiv.org/abs/2507.11473)** — 41 authors including Yoshua Bengio, Anca Dragan and Dan Hendrycks, from Anthropic, OpenAI, Google DeepMind and others — argues exactly that reasoning models externalise their deliberation in a readable form, that monitoring it is a genuine oversight opportunity, and that the opportunity is **fragile**: architecture changes can remove the monitorable substrate as a side effect of an efficiency decision. Latent reasoning is the textbook instance of that side effect. The informal name for the endpoint is **neuralese** — reasoning with no human-readable trace at all.

The launch thread also surfaced the subtler training-time version, which commenters tagged with Zvi Mowshowitz's phrase "the Most Forbidden Technique": if you *optimise against* a chain-of-thought monitor during RL, you do not remove the bad behaviour, you remove its visibility. Latent reasoning arrives at a similar destination from a different road — not by teaching the model to hide its thinking, but by moving the thinking somewhere there is nothing to hide.

### The part that deserves more attention than it got

The paper's own framing of this, in its Discussion section, is the detail most coverage skipped. Latent thoughts exist only as hidden states, readable through HybridLink — and the argument offered is that this is a *feature*: a deployed provider can run safety assessment on the full reasoning trace while the trace never leaves their infrastructure, so reasoning cannot leak to users the way text thinking can.

Read that twice. It is a coherent position — reasoning traces genuinely are a competitive asset and an exfiltration surface, which is why so many providers summarise rather than expose extended thinking. But the structure it describes is **asymmetric transparency by construction**: the lab holding the adapter can read the thoughts, and nobody else can. For an MIT-licensed checkpoint that ships its own adapter, the asymmetry is moot — you hold the key. For a hosted frontier model built the same way, it would not be.

## Where this sits in the field

<Flashcards cards={[
  { front: "Latent reasoning, in one sentence", back: "Feed the last-layer hidden state back in as the next input embedding instead of projecting it to logits, sampling a token, and re-embedding that token. The thought stays a vector." },
  { front: "Coconut (Meta FAIR, Dec 2024)", back: "Chain of Continuous Thought — the origin point. arXiv 2412.06769. Showed emergent breadth-first-search behaviour and beat CoT on backtracking-heavy logic tasks like ProsQA with fewer thinking tokens. Uses a constant number of latent thoughts; no tool access." },
  { front: "Soft Thinking (May 2025)", back: "arXiv 2505.15778. Training-free: the 'concept token' is the probability-weighted mixture of token embeddings, so you get a continuous state without fine-tuning anything. Adds a Cold Stop mechanism to halt when overconfident. The cheapest way to try latent reasoning." },
  { front: "HybridAgent (Together AI, Oct 2026)", back: "arXiv 2610.18861. First latent-reasoning AGENT: latent thinking plus text tool calls in one generation, a continuous KV working memory across turns, MIT 8B/14B checkpoints on Qwen3-Base, trained with HybridSFT then HybridRL." },
  { front: "HybridLink", back: "e_{t+1} = h_t + W_2·σ(W_1·h_t). A residual two-layer MLP mapping output hidden states into input embedding space. ~2·d_h² params (~10M for a 4B model). Shipped as adapter.pt — without it the checkpoint is a text model that loops." },
  { front: "Anchor tokens", back: "<latent> and </latent>. The model emits <latent> to enter latent mode. Latent mode closes when the nearest-neighbour token to the current state is </latent> — so the model decides its own thinking budget per span." },
  { front: "Continuous working memory", back: "M⁽¹⁾ = M⁽⁰⁾ ⊕ [K≤t, V≤t]. KV entries for text, latent and tool spans accumulate directly, with no serialise-and-re-encode step. Necessary because latent thoughts have no text form to re-encode." },
  { front: "Self-conditioned supervision", back: "Two-pass training: pass one teacher-forces ground-truth latents, pass two replays the same sequence with the model's own generated latents. Closes the exposure gap. Worth 30.5% average over HybridLink activation alone (Table 3)." },
  { front: "HybridRL reward", back: "r(τ) = r_correct + r_format + r_tool. No reward term for latent usage — the text/latent balance emerges rather than being incentivised." },
  { front: "The causal-intervention number", back: "Corrupting latent thoughts costs 44.9-51.3% accuracy (Table 5). Proof the latent stream is load-bearing — and the reason nearest-neighbour readout cannot be lossless." },
  { front: "Neuralese", back: "Informal term for reasoning carried out in continuous latent space or recurrent computation with no human-readable token trace. The endpoint latent reasoning points toward, and the thing CoT-monitorability research worries about." },
  { front: "The llama.cpp symptom", back: "Infinite generation on a trivial question. The backbone emits <latent>, the runtime has no HybridLink to take over, and nothing can satisfy the closing condition. Not a broken checkpoint — a missing component." },
]} />

## Should you care yet?

Honest answer for three different readers.

| If you are… | Then |
| --- | --- |
| **Shipping an agent on an API** | Nothing to do today. There is no hosted latent-reasoning endpoint. The transferable lesson is the diagnosis, not the cure: measure how much of your bill is *deliberation* tokens versus input and action tokens. If deliberation dominates, this line of work is aimed at you. |
| **Running open weights** | Worth an afternoon, on a GPU box, through the repo's own engine — and only the repo's engine. Expect a research artifact: 8B/14B on Qwen3-Base is not frontier-competitive on general chat, and the benchmarks that matter here are agentic search and math. |
| **Doing interpretability or safety work** | This is the most useful thing on the list. A released, MIT-licensed, tool-using latent agent with a shipped readout tool and a published causal-intervention result is a far better object of study than a lab's internal claim about its hidden reasoning. |

The skeptics on the launch thread had one more point worth keeping: continuous chain-of-thought is not new, looped-transformer architectures reach for something similar, and frontier labs may well already run variants of this privately. Nothing about HybridAgent's existence tells you whether any shipping product thinks in latent space. What it does tell you is that **the engineering is no longer hard** — a ~10M-parameter adapter plus two training stages — which is precisely why the monitorability question stops being hypothetical.

<Quiz questions={[
  {
    q: "What does HybridLink actually do?",
    options: [
      "Compresses the KV cache so latent spans take less memory",
      "Maps last-layer hidden states into the input embedding space via a residual two-layer MLP, so a hidden state can be fed back in as the next input",
      "Routes between a small latent model and a large text model depending on task difficulty",
      "Translates latent vectors into natural-language explanations for the user"
    ],
    answer: 1,
    explain: "e_{t+1} = h_t + W_2·σ(W_1·h_t). Output-space states and input-space embeddings have different distributions; HybridLink bridges them, with the residual carrying the semantics through. ~10M parameters for a 4B backbone."
  },
  {
    q: "Why does loading HybridAgent-8B in llama.cpp or plain Transformers produce infinite generation?",
    options: [
      "The checkpoints are corrupted and need re-downloading",
      "The 8-bit quantisation breaks the anchor-token embeddings",
      "HybridLink lives in a separate adapter plus custom generation code, so the backbone emits <latent> and nothing exists to loop hidden states back or evaluate the closing condition",
      "The model requires a Tavily API key before it can generate any text"
    ],
    answer: 2,
    explain: "The model card states plainly that standard Transformers loading yields a text-only variant. The hybrid behaviour is in adapter.pt and the repo's generation engine. The model enters a mode the runtime cannot implement and never exits."
  },
  {
    q: "A text-only agent spends ~596 text tokens on a task; HybridAgent-8B spends ~302. What else is it doing?",
    options: [
      "Nothing — it simply reasons more concisely, which is where the whole saving comes from",
      "170-183 additional latent forward passes that produce no text at all",
      "Caching the previous turn so it can skip re-reasoning",
      "Delegating the remaining reasoning to a larger model"
    ],
    answer: 1,
    explain: "It is not thinking less — it is thinking in a medium that isn't billed by the word. A latent step is still a full forward pass, so the saving comes from skipping decode-and-re-embed, a shorter KV sequence, and fewer total steps, not from free computation."
  },
  {
    q: "Which finding most undercuts the claim that latent thoughts are faithfully inspectable as pseudo-text?",
    options: [
      "The readout only works on the 14B checkpoint",
      "Corrupting latent thoughts costs 44.9-51.3% accuracy, so the vectors carry far more than their nearest single token can represent",
      "The authors never published the readout tool",
      "Latent mode is only used on math benchmarks"
    ],
    answer: 1,
    explain: "The causal intervention proves the latent stream is load-bearing. A nearest-neighbour readout that compressed a load-bearing vector to one word and lost nothing would mean the vector never needed to be continuous in the first place. Both claims can't be fully true at once."
  },
  {
    q: "Which of the three latent-reasoning approaches requires no training at all?",
    options: [
      "Coconut — it only reorders existing CoT traces",
      "HybridAgent — HybridLink is frozen at initialisation",
      "Soft Thinking — the concept token is a probability-weighted mixture of existing token embeddings",
      "All three require supervised fine-tuning"
    ],
    answer: 2,
    explain: "Soft Thinking (arXiv 2505.15778) is explicitly training-free: it builds the continuous state from the model's own output distribution over the vocabulary. Coconut needs curriculum training; HybridAgent needs HybridSFT plus HybridRL on 8-32 GPUs."
  },
  {
    q: "HybridRL's reward is r_correct + r_format + r_tool. What is notable about that list?",
    options: [
      "It penalises latent mode, so the model uses it sparingly",
      "There is no reward term for latent usage at all — the text/latent balance is emergent",
      "It rewards shorter outputs directly, which is where the token reduction comes from",
      "It includes a monitorability term that keeps thoughts readable"
    ],
    answer: 1,
    explain: "No mode-usage reward. The authors let the balance arise from optimising correctness, format and tool use — which also means the token reduction is a side effect of the learned policy rather than something trained for directly."
  }
]} />

## Sources & further reading

- [Hybrid Reasoning Agents (arXiv 2610.18861)](https://arxiv.org/abs/2610.18861) — Zou, Qi, Chen, Bianchi, Zhu, Lu, He, Zou; submitted 13 October 2026. The HybridLink formula, continuous working memory, HybridSFT/HybridRL, the 11 benchmarks, the self-conditioning ablation (Table 3) and the causal interventions (Table 5).
- [togethercomputer/HybridAgent](https://github.com/togethercomputer/HybridAgent) — MIT. Inference engine, SFT and RL pipelines, the `interpretable_latent_mode` viewer, and the GPU requirements (8-16 for SFT, 32 across 4 nodes for RL).
- [togethercomputer/HybridAgent-8B-Agentic](https://huggingface.co/togethercomputer/HybridAgent-8B-Agentic) and [-14B-Agentic](https://huggingface.co/togethercomputer/HybridAgent-14B-Agentic) — the checkpoints, on Qwen3-8B-Base and Qwen3-14B-Base. The model card is where the "standard Transformers loading yields a text-only variant" warning lives.
- [Hugging Face paper page](https://huggingface.co/papers/2610.18861) — linked artifacts, including the `HybridAgent-HybridSFT-v1/-v2` and `HybridAgent-HybridRL` training sets.
- [Training Large Language Models to Reason in a Continuous Latent Space (arXiv 2412.06769)](https://arxiv.org/abs/2412.06769) — Coconut, Meta FAIR. The origin of chain-of-continuous-thought, the emergent-BFS result, and the finding that a learned mode-switch classifier performed no better than a fixed latent budget.
- [Soft Thinking: Unlocking the Reasoning Potential of LLMs in Continuous Concept Space (arXiv 2505.15778)](https://arxiv.org/abs/2505.15778) — the training-free alternative: probability-weighted embedding mixtures as concept tokens, plus Cold Stop.
- [Chain of Thought Monitorability: A New and Fragile Opportunity for AI Safety (arXiv 2507.11473)](https://arxiv.org/abs/2507.11473) — the cross-lab position paper (41 authors; Bengio, Dragan, Hendrycks among them) on why readable reasoning is an oversight opportunity and why architecture choices can quietly destroy it.
- [Hacker News discussion, 19 October 2026](https://news.ycombinator.com/item?id=50145337) — 396 points, 192 comments. Source for the practical failure reports (looping on "who is the pope?", llama.cpp at 8-bit and 16-bit), the nearest-neighbour-readout objection, and the "Most Forbidden Technique" framing.
- AILmanac companions: [Why AI agents burn tokens](/docs/models/why-agents-burn-tokens) · [Reasoning models compared](/docs/models/reasoning-models-compared) · [Reward hacking in coding agents](/docs/frontiers/reward-hacking-in-coding-agents)

## Next

- [Why AI agents burn tokens (and how to cap the bill)](/docs/models/why-agents-burn-tokens) — the problem latent reasoning is attacking, measured on models you can actually call today
- [Diffusion LLMs: the models that don't write left to right](/docs/models/diffusion-llms-parallel-text) — the other current attempt to change the decoding loop itself rather than the model inside it
- [Reward hacking in coding agents](/docs/frontiers/reward-hacking-in-coding-agents) — what goes wrong when you optimise against what you can observe, which is the training-time half of the monitorability problem
