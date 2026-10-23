# DeepInfer: DeepSeek's Own Inference Engine, Read Honestly

> Source: https://derob98.github.io/ailmanac/docs/models/deepinfer-deepseek-inference-engine · AILmanac (CC BY 4.0) · last verified 2026-10-21

On 20 October 2026 DeepSeek open-sourced DeepInfer, the engine behind its production service — 16.3k stars in a day, 2,251 points on Hacker News. This page covers the four things the headlines missed: it is a vLLM fork, not a from-scratch engine; 'NVIDIA SM100' excludes every H100 and every consumer GPU you own; its decode throughput is published under full-acceptance accounting, which counts drafted tokens whether or not they were accepted; and its genuinely important feature — batch-invariant inference — is mutually exclusive with its own speculative decoder.

<LevelBadge level="advanced" />

At 09:08 UTC on **20 October 2026**, a link titled *"DeepInfer: High-performance inference framework for DeepSeek models"* hit Hacker News and settled at **2,251 points and 856 comments** — the biggest AI story on the site that week. The repository, `deepseek-ai/DeepInfer`, had been created four days earlier and collected **16,337 stars and 1,620 forks** by the following morning. Apache 2.0. Written in Python.

The framing everywhere was *"DeepSeek open-sources the engine that runs DeepSeek."* That framing is true and almost useless. The 856-comment thread is a near-perfect demonstration of the gap: it is an extended argument about whether inference is profitable for frontier labs, and contains essentially **no discussion of what the code does**. Nobody in it reports trying to run it.

So this page does the unglamorous part. Four things in DeepInfer's own documentation materially change what you should conclude from the release, and none of them made the coverage:

1. It is a **vLLM fork**, by its own acknowledgments — not a clean-room engine.
2. **"NVIDIA SM100"** rules out every H100 and every consumer card. Most readers cannot run this at all.
3. Its headline decode throughput is computed under **full-acceptance accounting** — it counts speculative draft tokens *regardless of the true acceptance rate*.
4. Its most durable contribution, **batch-invariant inference**, is turned on by a flag that turns *off* DeepInfer's own speculative decoder. Speed and reproducibility are an either/or here.

<Callout type="objectives" items={[
  "Describe accurately what DeepInfer ships and what it explicitly withholds — a KV cache system, prefill/decode disaggregation and DP load balancing are all absent, so this is an engine, not a server",
  "Decode the hardware line: SM100 means datacenter Blackwell, which excludes SM90 (H100/H200) and SM120 (RTX 50-series), and pair that with ~763 GB of FP8 weights to size a real deployment",
  "Explain why temperature 0 was never deterministic — and why the popular 'GPUs plus floating point are random' explanation is wrong",
  "Apply DeepInfer's deterministic-sampling recipe, and recognise the cost: the same flag disables the variable-length MTP path that DSpark rides on",
  "Read the published prefill/decode numbers correctly, including full-acceptance accounting, per-GPU normalisation, and why the profiler traces must never be used to derive steps-per-second",
  "Set the two configuration values that corrupt output or waste capacity when you get them wrong: SWA replay keep-tokens and EPLB redundant experts",
]} />

<VerifyNote lastVerified="2026-10-21" source="https://github.com/deepseek-ai/DeepInfer">
Star counts, the supported-model list (today: DeepSeek-V4.1-Flash only), the pinned dependency versions and the environment-variable names here were read from the repository on 21 October 2026, four days after it was created. A four-day-old repo with 172 open issues and no tagged release will move fast — re-read the README and `examples/README.md` before you commit a deployment to any of it.
</VerifyNote>

## What it is, in one paragraph

DeepInfer is the **offline inference** path of DeepSeek's production stack, extracted and published. It runs exactly one model family — `DeepSeek-V4.1-Flash` — on two hardware targets, with DeepSeek's own kernel libraries wired in: [FlashMLA](https://github.com/deepseek-ai/FlashMLA) for multi-head latent attention, [DeepGEMM](https://github.com/deepseek-ai/DeepGEMM) for matrix multiply, [DeepEP](https://github.com/deepseek-ai/DeepEP) for expert-parallel communication, [DeepSelect](https://github.com/deepseek-ai/DeepSelect) for sparse-attention and sampler top-k, and [TileKernels](https://github.com/deepseek-ai/TileKernels) plus in-tree TileLang kernels for the rest. Those five repos are not new — FlashMLA, DeepGEMM and DeepEP all date to February 2025 and carry 13.1k, 9.1k and 10.3k stars respectively; DeepSelect is from September 2026 and has 510. DeepInfer is the thing that was always missing: the **scheduler and runtime** that assembles them.

### The lineage nobody quoted

Straight from the acknowledgments: DeepInfer "was originally built primarily on **vLLM**, with additional inspiration from **SGLang** and **TensorRT-LLM**."

That is worth sitting with. The dominant reading of this release was *a frontier lab rejected the open-source serving stack and built its own.* The opposite is closer to true: DeepSeek took vLLM, specialised it hard for one architecture on one class of accelerator, and gave the result back under the same permissive terms. If you already run vLLM, DeepInfer is a statement about what a vLLM derivative looks like when you delete all generality — not a competitor you must evaluate.

### Three pieces it deliberately withholds

The README has a section most summaries skipped, titled "Required for a complete inference service (not included in this release)":

- a **KV cache system**
- **VE/prefill/decode disaggregation** (DeepSeek notes most of the engine-side functionality is implemented, but the orchestration is not)
- **load balancing across data-parallel replicas**, for both prefill and decode

There is no OpenAI-compatible HTTP server here to point your client at. Every example is `python examples/offline_inference.py`. If your mental model was "swap vLLM out, swap DeepInfer in, same endpoint" — three of the hardest pieces of a serving platform are the ones you would be writing yourself.

<Callout type="warning" items={[
  "\"Offline inference\" is doing real work in that sentence. DeepInfer is a batch engine with the serving layer removed, which is exactly the shape you want for evals and for RL rollouts — and exactly the wrong shape for a production API without months of platform work.",
]} />

## The hardware line, decoded

The README lists two targets: **NVIDIA SM100 GPUs** and **Huawei Ascend 950 NPUs**. One line, and it quietly excludes almost everyone.

`SM100` is CUDA compute capability **10.0** — *datacenter* Blackwell, the B100/B200 class. It is not:

| Your hardware | Arch | Listed? |
|---|---|---|
| H100 / H200 | SM90 (Hopper) | **No** |
| RTX 5090 / 50-series | SM120 (consumer Blackwell, cc 12.0) | **No** |
| B200 / B100 | SM100 | Yes |
| Ascend 950 | CANN 9.2 | Yes |

And the two Blackwells are not interchangeable: there is no binary compatibility between `sm_100` and `sm_120`, because datacenter Blackwell kernels use the `tcgen05` instruction and TMEM — dedicated tensor memory that consumer Blackwell does not have at all. A kernel written for SM100 does not "run slower" on an RTX 5090; it does not run.

The pinned dependency list says the same thing in a different dialect. `requirements-nvidia.txt` is three lines: `torch==2.13.0+cu132`, `flash-attn-4==4.0.0b34`, and the dev requirements — and `build.sh` then force-reinstalls `nvidia-nccl-cu13==2.32.3` over whatever came with Torch. A beta FlashAttention-4 build, CUDA 13.2, and a hand-patched NCCL. This is a stack pinned to the exact machines in DeepSeek's own racks.

### Now add the weights

DeepInfer's default checkpoint is `deepseek-ai/DeepSeek-V4.1-Flash-1017` — MIT-licensed, FP8, published **17 October 2026**, spread over 48 safetensors shards. Hugging Face reports roughly **763 billion parameters** for it. At FP8 that is on the order of **763 GB of weights before any KV cache**, which is why the examples are written as `--ep 8` and the decode benchmark runs on 64 GPUs.

Eight 80 GB cards (640 GB) cannot hold it. You are looking at eight B200-class GPUs as a floor, inside a single scale-up domain, plus the three platform components DeepSeek didn't ship.

<Callout type="tip" items={[
  "This is the practical answer to \"should I switch?\" for 99% of readers: you can't, and that's fine. The transferable value of this release is the three ideas below, each of which applies to the engine you actually run.",
  "If you want DeepSeek V4.1-Flash on hardware you own, the serving paths in our V4.1-Flash field guide (vLLM, SGLang, hosted API) still apply — and the -1017 checkpoint is a later revision than the September launch weights, so re-check its card rather than assuming parity.",
]} />

## Batch invariance: why temperature 0 was never deterministic

This is the part of DeepInfer worth your attention even if you never run it.

Set `temperature=0`, send the same prompt twice, get two different answers. Everyone has seen it. The explanation you have probably read — including [in our own sampling-controls lesson](/docs/foundations/sampling-controls), which this page sharpens — is "batching and floating-point non-determinism on the server side." That is the right neighbourhood and the wrong mechanism, and the distinction is what makes the bug fixable.

### The wrong half of the explanation

"GPUs are parallel and floating-point addition isn't associative, so results wobble" implies the wobble is *inherent*. It isn't. Run the identical matrix multiplication on the identical data on the identical GPU as many times as you like and you get **bitwise identical** results every time. The kernel is deterministic. Concurrency is not the culprit.

### The actual mechanism

The culprit is **batch invariance** — or rather its absence. A GPU kernel picks its reduction strategy based on the shape of the work it's given. Multiply a single row (batch of 1) and the accumulation happens in one order; multiply that same row as part of a 32-row batch and the kernel splits the reduction differently, so the floating-point additions land in a different order, so the result differs in the last bits. Each run is deterministic. The *shape* is not.

Then comes the part that makes it feel haunted: **your batch size is decided by other people's traffic.** A shared inference server batches your request with whatever else arrived in the same window. You changed nothing; the load did; your numerics moved. The forward pass is deterministic and your experience of it is not.

In transformers, three reduction-based operations need fixing: **RMSNorm, matrix multiply, and attention**. The recipe is to keep each reduction inside one core where possible, refuse split reductions whose shape depends on batch size, and use a single kernel configuration even when that leaves performance on the table.

### The number that should bother you

Thinking Machines Lab measured this on `Qwen3-235B-A22B-Instruct-2507`: the same prompt ("Tell me about Richard Feynman"), temperature 0, 1,000 tokens, **1,000 runs**.

Result: **80 unique completions.** The most frequent appeared 78 times. And the shape of the divergence is the instructive bit — all 1,000 completions are *identical for the first 102 tokens*, then split at token 103, where 992 runs say "Queens, New York" and 8 say "New York City."

That is why equality assertions in LLM test suites are so treacherous. A short smoke test passes a thousand times and tells you nothing; the divergence was waiting at token 103.

Fixing it is not free. On Qwen-8B over 1,000 sequences, Thinking Machines measured vLLM's default at **26 s**, a naive deterministic build at **55 s**, and **42 s** once the attention kernel was improved — so roughly **1.6× slower** for bitwise reproducibility.

<VerifyNote lastVerified="2026-10-21" source="https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/">
The 80-completions result, the token-103 divergence and the 26 s / 55 s / 42 s figures are Thinking Machines Lab's measurements on their hardware and kernels, not DeepInfer's. DeepSeek publishes no comparable before/after cost for its own batch-invariant path. Treat ~1.6× as the order of magnitude to budget for, not a number to quote about DeepInfer.
</VerifyNote>

### Why anyone pays 1.6× for it

Four reasons, in rough order of how much money they represent:

- **On-policy RL stops being a lie.** If your sampler and your trainer compute different numerics, your "on-policy" reinforcement learning is quietly off-policy. Thinking Machines showed that without deterministic inference you need off-policy correction to avoid reward collapse; with bitwise-identical results you get true on-policy RL and zero KL divergence between the sampling and training policies. For anyone doing RL on a large model, this is the headline, not a footnote.
- **Regression tests can assert equality.** DeepInfer leans on this hard: `tests/models/offline_decode_ppl.json` stores per-platform perplexity baselines that are compared **exactly, sample by sample**. That test design is only possible on a deterministic engine.
- **Debugging an agent run becomes tractable.** A failure you can replay bit-for-bit is a bug; one you can't is a ghost story.
- **Audit and compliance.** "Same input, same output, provably" is a requirement in some regulated settings and an impossibility without this.

### The recipe — and its price

<Steps items={[
  {title: "Turn on batch invariance", body: "Set DEEPINFER_BATCH_INVARIANT=1. This holds each token's result bitwise identical regardless of what else shares its batch. NVIDIA only — the Ascend path does not offer it."},
  {title: "Turn off the variable-length MTP path", body: "Set DEEPINFER_ENABLE_MTP_VARLEN=0. This is the same flag you set to 1 to enable DSpark speculative decoding, so by DeepSeek's own documentation the two features are mutually exclusive."},
  {title: "Pin the sampler seed per sequence", body: "Pass a fixed seq_seed in SamplingParams. Identical input tokens plus identical sampling parameters then produce identical outputs."},
  {title: "Decide which you actually need, per workload", body: "Determinism for evals, regression baselines and RL rollouts; DSpark for throughput on everything else. Running one cluster in each mode is a legitimate design, and cheaper than pretending one config serves both."},
]} />

<PromptCard title="DeepInfer: deterministic sampling (environment)">{`# Deterministic sampling — NVIDIA only.
# Note that MTP_VARLEN=0 is the same switch that disables DSpark,
# so this configuration is deliberately the slow one.
export DEEPINFER_ACCELERATOR=nvidia
export DEEPINFER_BATCH_INVARIANT=1
export DEEPINFER_ENABLE_MTP_VARLEN=0

# ...and pass a fixed seq_seed in SamplingParams, e.g.
#   SamplingParams(temperature=0.0, seq_seed=42)

python examples/offline_inference.py --ep 8`}</PromptCard>

<PromptCard title="DeepInfer: DSpark speculative decoding (the other mode)">{`# Throughput mode: draft tokens plus confidence-scheduled verification.
# DEEPINFER_USE_NEXTN_DECODE sets the maximum draft length (default 5).
export DEEPINFER_ACCELERATOR=nvidia
export DEEPINFER_ENABLE_MTP_VARLEN=1
export DEEPINFER_USE_NEXTN_DECODE=5

# Explicitly disable speculative decoding instead:
#   export DEEPINFER_USE_NEXTN_DECODE=0

python examples/benchmark.py`}</PromptCard>

The second mode is where DeepInfer's cleverest idea lives. Plain speculative decoding drafts *n* tokens and verifies them all. **Confidence-scheduled verification** uses the model's own confidence estimates to decide how much verification budget to spend — cheap where the draft is obviously right, expensive where it isn't. That is a scheduling idea, not a kernel idea, and it transfers to any engine with a draft path.

## Reading DeepInfer's own benchmark numbers

DeepSeek publishes two Pareto curves — prefill throughput vs latency, decode throughput vs per-user speed — rather than a headline tokens-per-second figure. That restraint is admirable and it means **there is no single number to quote.** It also means the methodology, documented in `examples/README.md`, is where the truth lives. Three things in it change how you read the charts.

### 1. Decode throughput assumes every draft token was accepted

This is the big one. The published decode throughput is computed as:

```text
decode_throughput = avg_SPS × decode_num_requests × (1 + nextn) / cp
```

and the documentation states plainly that this is "under the **full-acceptance accounting** — `1 + nextn` tokens per request per step, **regardless of the true acceptance rate**."

`nextn` defaults to 5. So each request is credited with 6 tokens per decode step whether the speculative decoder's 5 drafts survived verification or not. With the default 64 requests, "the 64 requests of one decode step account for 384 tokens in total" — 64 × 6.

Real acceptance rates for multi-token prediction are well under 100%. So the decode throughput on that chart is an **upper bound that no real workload reaches**, and the gap between the chart and your reality is exactly your rejection rate. Nothing here is dishonest — it is written down in the repo — but it is not what a reader glancing at a Pareto curve assumes, and nobody in 856 Hacker News comments mentioned it.

### 2. The numbers are per-GPU, at a scale you don't have

Prefill was measured on **4 SM100 GPUs**, decode on **64**, "each within one scale-up domain" — i.e. inside a single NVLink fabric, not across an Ethernet cluster. Both throughput figures are then divided by the device count to give tokens/s/**GPU**.

Per-GPU normalisation is the right way to publish this, and it is also the easiest thing in the world to misread. A per-GPU decode number obtained with 64 GPUs sharing one fabric does not survive being multiplied back up on your 8-GPU node, because the expert-parallel communication pattern that made it possible was the fabric.

### 3. The profiler traces are not throughput data

A detail I have not seen anywhere else, and a genuinely useful warning for anyone profiling their own engine. From the docs: step times inside a `PROFILE=1` trace include profiler overhead of "**up to nearly 50% inflation at bsz=1**", and even after the profiler exits there is a residual slowdown of **~7–11%** — which is why no measurement is allowed to be scheduled after the profiler section. The explicit instruction is to use traces for inspecting kernel composition and **never** to derive steps-per-second.

The harness goes further than most: it drops any measurement interval that collides with a MoE load-balancer statistics flush (an expert-parallel `all_gather` with a dozen milliseconds of jitter), and it runs the measurement window twice — once with logging on to capture load-balancer values, once silently for the actual numbers.

<Callout type="tip" items={[
  "Steal the two-stage eval design regardless of engine. DeepInfer's eval harness separates generation from scoring: generation writes raw outputs to disk, scoring reads them back. You can re-judge with a different grader without paying for inference again — and on a deterministic engine you can prove the outputs didn't move.",
]} />

### What the eval harness actually measures

Worth knowing before you cite any accuracy number from this repo. It covers three benchmarks, all reported as Pass@1: **AIME 2026** (30 tasks × 32 samples, mean accuracy), **HLE** (2,500 questions — 2,158 text and 342 image — single sample), and **GPQA Diamond** (198 tasks × 8 samples). The scripts deliberately **do not download the datasets**; you must fetch each one yourself and convert it to JSONL, and HLE is gated on Hugging Face. A benchmark harness that refuses to auto-download its own test sets is a small sign of seriousness about contamination.

## Two config values that bite

**SWA bounded replay.** DeepInfer reduces decoder prefill work by replaying only a bounded suffix of context, configured with `DEEPINFER_YOCO_PREFILL_TRUNCATION_MODE=compact` and `DEEPINFER_YOCO_PREFILL_KEEP_TOKENS=140` for V4.1's defaults. The constraint is the interesting part: the retained suffix **must cover the sliding-window-attention window plus the maximum backtracking length**. That oddly specific `140` is not a tuning preference, it is a floor derived from the architecture. Lower it to save memory and you are not trading quality for speed — you are truncating context the model still needs.

**EPLB redundant experts.** Expert-parallel load balancing is configured through `DEEPINFER_OVERRIDE_NUM_EXTRA_EXPERTS`, default **32**. This is only a *lower bound*: the engine rounds `num_routed_experts + num_extra_experts` up until it divides evenly by `ep_size`, rounding the backbone and DFlash separately. So the value you set is frequently not the value in effect — and the records written to disk and the plots use the rounded figure that actually took effect. If you are comparing two runs, compare the logged value, not your environment.

## If you can't run it, take these three things

- **Ask what accounting a throughput number uses.** "Tokens per second" with a speculative decoder in the loop is ambiguous until someone tells you whether rejected drafts are counted. Ask it of every engine, including the one you run.
- **Stop asserting equality on LLM output unless you've earned determinism.** Temperature 0 is near-deterministic, not deterministic, and the failure mode is a divergence a hundred tokens in that your smoke test never reaches. Either make the engine batch-invariant and assert bitwise, or test with evals and distributions. The middle ground is a flaky suite that teaches your team to ignore red.
- **"Open-sourced the engine" rarely means "open-sourced the service."** Read for the *absences* — cache system, disaggregation, load balancing. The gap between a published engine and a running service is where all the platform work lives, and the README that tells you honestly which pieces are missing is doing you a favour.

<Flashcards title="DeepInfer: the vocabulary" cards={[
  {front: "Batch invariance", back: "The property that a given token's output is bitwise identical regardless of its position in a batch, or what else shares the batch. Its absence is the real reason temperature 0 isn't reproducible. In DeepInfer: DEEPINFER_BATCH_INVARIANT=1, NVIDIA only."},
  {front: "Full-acceptance accounting", back: "How DeepInfer's published decode throughput is computed: each request is credited (1 + nextn) tokens per step — 6 by default — regardless of the true speculative acceptance rate. An upper bound, not an achievable figure."},
  {front: "DSpark + confidence-scheduled verification", back: "DeepInfer's speculative decoder. Drafts tokens, then uses the model's own confidence estimates to decide how much verification budget to spend on them. Enabled with DEEPINFER_ENABLE_MTP_VARLEN=1; draft length via DEEPINFER_USE_NEXTN_DECODE (default 5)."},
  {front: "SWA bounded replay", back: "Cuts decoder prefill work by replaying only a bounded suffix of context. The retained suffix must cover the sliding-window-attention window plus the maximum backtracking length — hence the specific DEEPINFER_YOCO_PREFILL_KEEP_TOKENS=140 default for V4.1."},
  {front: "EPLB", back: "Expert-parallel load balancing for MoE. Adds redundant copies of hot experts so traffic spreads evenly. DEEPINFER_OVERRIDE_NUM_EXTRA_EXPERTS (default 32) is a lower bound — the engine rounds up to divide evenly by ep_size."},
  {front: "SM100", back: "CUDA compute capability 10.0: datacenter Blackwell (B100/B200). Not SM90 (H100/H200) and not SM120 (RTX 50-series) — SM100 kernels need tcgen05 and TMEM, which consumer Blackwell lacks entirely, so they are not binary compatible."},
  {front: "FlashMLA / DeepGEMM / DeepEP / DeepSelect", back: "DeepSeek's kernel libraries, all open since well before DeepInfer: multi-head latent attention, GEMM, expert-parallel communication, and top-k for sparse attention and samplers. DeepInfer is the runtime that finally schedules them."},
  {front: "Attention DP / balanced CP / MoE EP", back: "DeepInfer's three-way parallelism: data parallelism over attention, balanced context parallelism for long sequences, expert parallelism for the MoE layers. ep_size = WORLD_SIZE × visible devices, and --cp must divide ep_size."},
  {front: "What DeepInfer does NOT ship", back: "A KV cache system, VE/prefill/decode disaggregation orchestration, and load balancing across data-parallel replicas. There is no OpenAI-compatible server — it is an offline batch engine."},
]} />

<Quiz title="Check yourself" questions={[
  {
    q: "Why does temperature 0 fail to produce identical outputs on a shared inference server?",
    options: [
      "GPU parallelism makes floating-point arithmetic genuinely random",
      "Kernels change their reduction order based on batch shape, and your batch size depends on other users' traffic",
      "Temperature 0 still samples from the top-k distribution",
      "Model weights are updated continuously during serving"
    ],
    answer: 1,
    explain: "Running the same matmul on the same data gives bitwise identical results every time — the kernel is deterministic. What varies is the shape of the batch it's handed, which changes how the reduction is split and therefore the floating-point accumulation order. Since co-tenant traffic sets your batch size, your numerics move even though you changed nothing."
  },
  {
    q: "DeepInfer's published decode throughput is computed as avg_SPS × decode_num_requests × (1 + nextn) / cp. What does that imply?",
    options: [
      "It is measured after rejected draft tokens are subtracted",
      "It credits (1 + nextn) tokens per request per step regardless of the real acceptance rate, so it is an upper bound",
      "It only applies when speculative decoding is disabled",
      "It understates throughput because nextn defaults to 0"
    ],
    answer: 1,
    explain: "The docs call this 'full-acceptance accounting' and state it holds 'regardless of the true acceptance rate'. With nextn defaulting to 5, each request is credited 6 tokens per step whether or not the 5 drafts survived verification — so the chart is a ceiling, and your shortfall equals your rejection rate."
  },
  {
    q: "You have an 8× H100 node and want to serve DeepSeek-V4.1-Flash with DeepInfer. What is the problem?",
    options: [
      "Nothing — H100 is supported, you just need CUDA 13",
      "H100 is SM90 and the README lists SM100 (datacenter Blackwell) only; separately, ~763 GB of FP8 weights will not fit in 640 GB",
      "DeepInfer requires Ascend NPUs for the MoE layers",
      "Only the batch-invariant path works on H100"
    ],
    answer: 1,
    explain: "Two independent blockers. SM100 is compute capability 10.0 — datacenter Blackwell — and SM90 Hopper isn't listed. And the default -1017 checkpoint is roughly 763B parameters at FP8, which exceeds 8 × 80 GB before you allocate any KV cache at all."
  },
  {
    q: "What does the deterministic-sampling recipe cost you?",
    options: [
      "Nothing — it is a pure win with no trade-off",
      "Structured outputs stop working",
      "DEEPINFER_ENABLE_MTP_VARLEN=0 is the same flag that enables DSpark, so you give up speculative decoding",
      "It restricts you to a batch size of 1"
    ],
    answer: 2,
    explain: "The README enables DSpark with DEEPINFER_ENABLE_MTP_VARLEN=1 and requires DEEPINFER_ENABLE_MTP_VARLEN=0 for deterministic sampling. By its own documentation the two are mutually exclusive — reproducibility and the speculative speedup are an either/or, which is a reason to run separate configurations for evals and for serving."
  },
  {
    q: "Which claim about DeepInfer's origins is accurate?",
    options: [
      "It is a clean-room engine written from scratch to replace vLLM",
      "It is a fork of SGLang with TensorRT-LLM kernels",
      "By its own acknowledgments it was built primarily on vLLM, with inspiration from SGLang and TensorRT-LLM",
      "It is a Python binding layer over TensorRT-LLM"
    ],
    answer: 2,
    explain: "The acknowledgments say it 'was originally built primarily on vLLM, with additional inspiration from SGLang and TensorRT-LLM'. The widely repeated 'DeepSeek built its own engine instead of using open source' framing inverts what actually happened: they specialised an open-source engine and released the result under Apache 2.0."
  },
  {
    q: "Why does DeepInfer's eval harness separate generation from scoring?",
    options: [
      "To let you re-score existing outputs with a different judge without paying for inference again",
      "Because scoring requires a GPU and generation does not",
      "To hide the raw model outputs from the grader",
      "Because Pass@1 can only be computed offline"
    ],
    answer: 0,
    explain: "Generation writes raw outputs to disk; scoring reads them back. That makes re-judging cheap and repeatable — and on a batch-invariant engine you can additionally prove the generations themselves didn't drift, which is what makes the exact sample-by-sample perplexity baselines in the test suite viable."
  }
]} />

<Callout type="takeaways" items={[
  "DeepInfer is a hard-specialised vLLM derivative for one model on datacenter Blackwell or Ascend 950 — not a general engine and not a drop-in server. Most readers cannot run it, and that is the honest answer to \"should I switch?\"",
  "It withholds the KV cache system, prefill/decode disaggregation and DP load balancing by design. Read releases for what is absent, not just what is announced.",
  "Batch invariance, not floating-point randomness, is why temperature 0 drifts: kernels pick reduction orders by batch shape, and co-tenant traffic picks your batch shape. 1,000 temperature-0 runs produced 80 unique completions, identical for 102 tokens and then not.",
  "Reproducibility costs roughly 1.6× throughput in published measurements, and in DeepInfer it also costs you DSpark — the enabling flag for one disables the other. Run separate configs for evals/RL and for serving.",
  "Full-acceptance accounting means the published decode throughput counts drafted tokens whether or not they were accepted. Ask every engine which accounting its tokens-per-second uses.",
  "DEEPINFER_YOCO_PREFILL_KEEP_TOKENS=140 is an architectural floor, not a tuning dial; DEEPINFER_OVERRIDE_NUM_EXTRA_EXPERTS=32 is a lower bound the engine rounds up. Log the effective values before comparing runs.",
]} />

## Sources & further reading

- [deepseek-ai/DeepInfer](https://github.com/deepseek-ai/DeepInfer) — Apache 2.0, created 16 October 2026, 16,337 stars / 1,620 forks / 172 open issues as of 21 October 2026. Primary source for the feature list, the environment variables, the "not included in this release" section, the hardware targets, the pinned `requirements-nvidia.txt`, and the vLLM/SGLang/TensorRT-LLM acknowledgment.
- [DeepInfer `examples/README.md`](https://github.com/deepseek-ai/DeepInfer/blob/main/examples/README.md) — the methodology that matters: full-acceptance decode accounting, the three steady-state metrics, profiler-overhead warnings (~50% at bsz=1, 7–11% residual), MoE load-balancer flush exclusion, `ep_size` derivation, and the `DEEPINFER_OVERRIDE_NUM_EXTRA_EXPERTS` rounding rule.
- [DeepInfer `eval/README.md`](https://github.com/deepseek-ai/DeepInfer/blob/main/eval/README.md) — AIME 2026 / HLE / GPQA Diamond task and sample counts, Pass@1 definitions, the two-stage generation-then-scoring design, and the deliberate refusal to auto-download datasets.
- [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/) — Thinking Machines Lab. Source for the 1,000-run / 80-completion experiment on Qwen3-235B-A22B-Instruct-2507, the token-103 divergence, the "concurrency + floating point" rebuttal, the RMSNorm/matmul/attention recipe, the 26 s → 55 s → 42 s cost, and the on-policy RL argument.
- [deepseek-ai/DeepSeek-V4.1-Flash-1017](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017) — MIT, FP8, published 17 October 2026, 48 safetensors shards, ~763B parameters. DeepInfer's default checkpoint.
- DeepSeek kernel libraries, all verified live: [FlashMLA](https://github.com/deepseek-ai/FlashMLA) (13.1k stars, Feb 2025) · [DeepGEMM](https://github.com/deepseek-ai/DeepGEMM) (9.1k, Feb 2025) · [DeepEP](https://github.com/deepseek-ai/DeepEP) (10.3k, Feb 2025) · [TileKernels](https://github.com/deepseek-ai/TileKernels) (2.0k, Apr 2026) · [DeepSelect](https://github.com/deepseek-ai/DeepSelect) (510, Sep 2026)
- [NVIDIA Blackwell Compatibility Guide](https://docs.nvidia.com/cuda/blackwell-compatibility-guide/) and the [SM100 vs SM120 reference](https://0xsero.github.io/blackwell-gpu-wiki/blackwell/sm100-vs-sm120/) — compute capability 10.0 vs 12.0, `tcgen05`/TMEM, and the absence of binary compatibility between the two Blackwells.
- [Hacker News discussion, 20 October 2026](https://news.ycombinator.com/item?id=50163277) — 2,251 points, 856 comments. Cited here as evidence of the information gap: the thread is an argument about inference-economics profitability and contains no substantive discussion of the implementation.
- [vLLM](https://github.com/vllm-project/vllm) · [SGLang](https://github.com/sgl-project/sglang) · [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM) — the upstream projects named in the acknowledgments.
- AILmanac companions: [DeepSeek-V4.1-Flash field guide](/docs/models/deepseek-v4-1-flash-open-weight-1m) · [Sampling controls](/docs/foundations/sampling-controls) · [DwarfStar and overfit inference engines](/docs/models/ds4-overfit-inference-engines)

## Next

- [DeepSeek-V4.1-Flash: the model DeepInfer runs](/docs/models/deepseek-v4-1-flash-open-weight-1m) — the architecture, the effort dial, the pricing, and the serving paths available to people without a Blackwell rack
- [DwarfStar (ds4) and the rise of overfit inference engines](/docs/models/ds4-overfit-inference-engines) — the same specialise-hard-and-delete-generality bet, aimed at a single machine instead of a datacenter
- [Reading AI benchmarks](/docs/models/reading-ai-benchmarks) — the general skill behind the full-acceptance-accounting section: finding the sentence in the methodology that reframes the chart
