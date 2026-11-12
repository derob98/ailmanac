# Tool Calling Across Providers

> Source: https://derob98.github.io/ailmanac/docs/models/tool-calling-across-providers · AILmanac (CC BY 4.0) · last verified 2026-11-11

Every major provider does function calling, and no two agree on a single field name. The four dialects side by side, the arguments-is-a-string bug that breaks every port, the one provider with no correlation ID at all, and why forcing a tool is the pattern that now fails on Claude's newest models and nowhere else.

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "Read the same tool definition in all four wire dialects — Anthropic, OpenAI Chat Completions, OpenAI Responses, and Gemini — and translate between them without guessing field names",
  "Avoid the single most common porting bug: arguments arrive as a JSON string on some providers and as a parsed object on others",
  "Know which provider gives you no correlation ID at all, and what to do about it",
  "Understand why forcing a tool call is portable everywhere EXCEPT Claude's newest models — the opposite of what most people assume",
  "Tell the three schema dialects apart: raw JSON Schema, OpenAI's strict-mode subset, and Gemini's OpenAPI subset with its own rejection limits",
  "Design a provider adapter that isolates the five things that actually differ, instead of rewriting your agent loop per vendor",
]} />

<VerifyNote lastVerified="2026-11-11" source="https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools">
Every field name and enum value on this page was read off the provider's own current documentation on the date above. Wire formats move — Google has migrated its function-calling docs to a new API and now labels the classic shape "Legacy" — so re-check each vendor before you ship: [Anthropic](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools) · [OpenAI](https://developers.openai.com/api/docs/guides/function-calling) · [Google](https://aistudio.google.com/docs/function-calling) · [Mistral](https://docs.mistral.ai/capabilities/function_calling) · [vLLM](https://docs.vllm.ai/en/latest/features/tool_calling/) · [Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md).
</VerifyNote>

Tool calling is the most portable idea in agent engineering and the least portable *code*. The concept is identical everywhere: you describe some functions with a JSON schema, the model replies asking for one, you run it, you hand back the result, the loop continues. Four providers, one concept — and **not one field name in common** across the round trip.

This page is the translation layer. If you want the Anthropic shape in depth — the three message-shape rules that return a 400, `strict: true`, server tools — that's [Tool Use / Function Calling](/docs/api/tool-use). Here we only care about what changes when you move.

## The same tool, four dialects

One tool, `get_weather`, written four ways. Read the three rows that differ, not the ones that match.

| | Anthropic Messages | OpenAI Chat Completions | OpenAI Responses | Gemini (classic) |
|---|---|---|---|---|
| **Where tools go** | `tools: [...]` | `tools: [...]` | `tools: [...]` | `tools: [{functionDeclarations: [...]}]` |
| **Definition shape** | flat: `name`, `description`, `input_schema` | nested: `{type: "function", function: {...}}` | flat: `{type: "function", name, ...}` | flat, inside `functionDeclarations` |
| **Schema key** | `input_schema` | `parameters` | `parameters` | `parameters` |
| **Model's request** | `tool_use` content block | `tool_calls[]` on the message | `function_call` item | `functionCall` part |
| **Arguments field** | `input` — **an object** | `function.arguments` — **a string** | `arguments` — **a string** | `args` — **an object** |
| **Correlation ID** | `id` | `id` | `call_id` | `id` |
| **Your reply** | `tool_result` block | message with `role: "tool"` | `function_call_output` item | `functionResponse` part |
| **ID field on the reply** | `tool_use_id` | `tool_call_id` | `call_id` | `id` |
| **Result payload** | `content` (string *or* typed blocks) | `content` (string) | `output` (string) | `response` (structured object) |
| **Error signalling** | `is_error: true` on the result | no dedicated field | no dedicated field | no dedicated field |

Mistral follows the OpenAI Chat Completions column exactly — nested `function` object, `tool_calls` with `id`, and a `role: "tool"` reply carrying `name`, `content`, and `tool_call_id`.

:::tip[The three rows that cost people a day]
`input_schema` vs `parameters`, `input` vs `arguments`, and `tool_use_id` vs `tool_call_id` vs `call_id` vs `id`. Everything else in that table is cosmetic. These three are where a port silently produces a loop that never terminates.
:::

## The arguments-is-a-string bug

This is the single most common cross-provider defect, and it does not announce itself with a type error.

<Steps items={[
  {title: "On Anthropic and Gemini, arguments are already parsed", body: "Anthropic's tool_use block carries input as a JSON object. Gemini's functionCall part carries args as an object. You read the fields directly and move on."},
  {title: "On OpenAI and Mistral, arguments are a JSON-encoded string", body: "Chat Completions gives you function.arguments, and the Responses API gives you arguments — both are strings containing JSON. You must parse them before use."},
  {title: "Why the bug hides", body: "In a dynamic language, reaching for a key on a string does not throw where you'd expect — it yields undefined or raises deep inside your handler, and the model is blamed for 'hallucinating a bad argument' when the payload was perfect. The tell is a tool that works on one provider and returns empty-ish values on another with identical prompts."},
  {title: "The fix is one line in the adapter, not in the handler", body: "Normalize at the boundary: parse on providers that send a string, pass through on those that send an object, and let every tool handler downstream assume a parsed object. Never spread the parse across handlers — that's how you get a codebase where half the tools work on half the providers."},
  {title: "Then handle a parse failure as a tool result, not an exception", body: "Malformed JSON in that string is possible unless you are using a constrained-decoding mode. Catch it and hand the error back to the model as a tool result so it can retry — crashing the loop teaches the model nothing."}
]} />

<PromptCard title="A normalizer that collapses all four dialects into one internal shape">{`// One adapter, four dialects. Every tool handler downstream sees {id, name, args}.
function normalizeToolCalls(providerResponse, provider) {
  switch (provider) {
    case "anthropic":
      // stop_reason === "tool_use"; arguments are ALREADY an object
      return providerResponse.content
        .filter((b) => b.type === "tool_use")
        .map((b) => ({ id: b.id, name: b.name, args: b.input }));

    case "openai-chat":
    case "mistral": {
      const calls = providerResponse.choices[0].message.tool_calls ?? [];
      // .arguments is a STRING — parse it exactly here and nowhere else
      return calls.map((c) => ({
        id: c.id,
        name: c.function.name,
        args: parseOrError(c.function.arguments),
      }));
    }

    case "openai-responses":
      return providerResponse.output
        .filter((i) => i.type === "function_call")
        .map((i) => ({
          id: i.call_id,                      // note: call_id, not id
          name: i.name,
          args: parseOrError(i.arguments),    // also a STRING
        }));

    case "gemini": {
      const parts = providerResponse.candidates[0].content.parts ?? [];
      return parts
        .filter((p) => p.functionCall)
        // Gemini echoes an id you must send back on the functionResponse
        .map((p) => ({ id: p.functionCall.id, name: p.functionCall.name, args: p.functionCall.args }));
    }
  }
}

function parseOrError(s) {
  try { return JSON.parse(s); } catch { return { __parseError: s }; }
}`}</PromptCard>

### Ollama has no correlation ID

Worth its own heading, because it breaks an assumption your adapter almost certainly encodes. Ollama's `/api/chat` accepts the OpenAI-style `tools` field and returns `tool_calls` whose entries carry a `function` with `name` and `arguments` — but the documented tool-result message has **no `tool_call_id` field**. Correlation is by position and tool name rather than by an ID.

That matters the moment a model asks for two tools at once: with no ID to match on, you cannot hand results back out of order, and two calls to the *same* tool with different arguments are distinguishable only by their position in the array. If you run the same agent against both a hosted provider and a local Ollama model — a common cost-saving setup described in [Claude plus local models](/docs/models/claude-plus-local-models) — make your adapter synthesize an index-based ID locally and preserve array order strictly. Ollama also exposes an OpenAI-compatible `/v1` endpoint, which is the easier target if your client is already written against the OpenAI shape.

## Forcing a tool: the portability trap nobody expects

Every provider has a knob for "you must call a tool." They mostly agree — and then Claude's newest models break the pattern, which is the reverse of the usual story where Anthropic is the portable baseline.

| Provider | Values | Force-a-specific-tool |
|---|---|---|
| Anthropic | `auto` (default with tools), `any`, `tool`, `none` | `{"type": "tool", "name": "..."}` |
| OpenAI | `"auto"` (default), `"required"`, `"none"` | `{"type": "function", "name": "..."}`, or `allowed_tools` |
| Gemini (classic) | `VALIDATED`, `AUTO`, `ANY`, `NONE` | `ANY` plus `allowed_function_names` |
| Mistral | `auto` (default), `any`, `none` | — |

<Callout type="warning" items={[
  "On Claude Fable 5.2 and 5.1, Mythos 5.2 and 5.1, Opus 5.5 and Sonnet 5.5, tool_choice values any and tool return a 400 error. The portable-looking line in your adapter is the one that fails, and only on the newest models — which is also where you most want to run.",
  "Anthropic's guidance is to use auto together with strict tool use instead. none still works everywhere."
]} />

Two more asymmetries in that table are easy to miss:

- **Gemini's `VALIDATED` is a mode the others don't have.** It becomes the default when built-in tools or structured outputs are also enabled, and it constrains output to a function call or text *with schema adherence* — a middle setting between "decide freely" and "you must call something."
- **Gemini's `ANY` mode has a schema complexity ceiling.** The docs are explicit that in `ANY` mode very large or deeply nested schemas may be rejected, because the schema is compiled into a state machine with limits on states, branching, and nesting; exceeding them yields a `400 INVALID_ARGUMENT`. A schema that is merely verbose on other providers can be *invalid* here.

For the deeper story on why forced tool use is being retired on Claude — and the two unrelated jobs it was doing — see [Tool Use / Function Calling](/docs/api/tool-use).

## Three schema dialects, not one

Everyone says "JSON Schema." Only some of them mean it.

<Steps items={[
  {title: "Raw JSON Schema — Anthropic, OpenAI (non-strict), Mistral, Ollama", body: "You pass an ordinary JSON Schema object and the model treats it as guidance. Unsupported keywords tend to be ignored rather than rejected, which is forgiving at request time and unhelpful at debug time: a constraint the provider silently dropped looks identical to a model that ignored it."},
  {title: "OpenAI strict mode — a deliberately narrowed subset", body: "Setting strict: true on a tool adds structural requirements: additionalProperties: false on every object, EVERY property listed in required (model an optional field as a union with null instead of omitting it), and a root that is an object rather than a bare array or primitive. The supported surface covers basic types, array with items, object with properties, enum, and $ref/$defs for recursion. OpenAI's docs note that some keywords are unsupported without publishing an exhaustive exclusion list, so treat an unfamiliar keyword as unsupported until a request proves otherwise."},
  {title: "Gemini — a subset of the OpenAPI schema, not JSON Schema", body: "The docs describe the parameters format as a subset of the OpenAPI schema. Practically, this is the dialect most likely to reject a schema you ported from somewhere else, and the one where you should test with your real schema rather than a toy one."},
  {title: "The portable move: write the simplest schema that works", body: "Flat objects, primitive and enum properties, shallow arrays, explicit required, additionalProperties: false, no clever composition. A schema that satisfies OpenAI strict mode and stays shallow enough for Gemini ANY mode will be accepted everywhere — and models follow simple schemas more reliably anyway, so you lose almost nothing."}
]} />

Anthropic's own `strict: true` is covered in [Tool Use](/docs/api/tool-use), and the schema-constrained *response* path (as opposed to a tool call) in [Structured Output](/docs/api/structured-output).

## What the result may contain

Asymmetric in a way that matters for multimodal agents:

- **Anthropic** — `tool_result.content` takes a plain string *or* an array of typed content blocks: `text`, `image`, `document`, `search_result`. A tool can hand back a screenshot and Claude will look at it.
- **Gemini** — `functionResponse.response` is a structured object by design, not a bare string.
- **OpenAI** — the Chat Completions `tool` message `content` and the Responses API `function_call_output.output` are documented as string fields, so you JSON-encode structured data yourself.

The portable lowest common denominator is therefore "a JSON string," and the cost of adopting it is giving up Anthropic's ability to return an image from a tool. If your agent screenshots, scrapes, or renders, that's not a small loss — keep it as a provider-specific capability behind a feature flag rather than flattening it away.

## Open weights: the parser is part of the deployment

Running an open-weight model doesn't inherit tool calling for free. The wire shape is OpenAI-compatible, but the *extraction* of a tool call from the model's raw text is a server-side concern you have to configure.

- **vLLM** serves the OpenAI-compatible `tools`/`tool_calls` shape on `/v1/chat/completions`, but requires `--enable-auto-tool-choice` plus a `--tool-call-parser` naming a model-specific parser (the shipped set includes `llama3_json`, `mistral`, `hermes`, `granite`, `jamba`, `deepseek_v3`, `pythonic` and more, and custom parsers can be registered with `--tool-parser-plugin`).
- Without a loaded parser, a request with a named `tool_choice` returns **HTTP 400**. The first use of a named choice also pays a one-off state-machine compile latency.
- The honest caveat is in vLLM's own docs: for some Mistral-format models, a call **is not guaranteed** even when tool choice is forced. Any contract your agent builds on "forced means forced" needs a fallback path here.

<PromptCard title="Serving an open-weight model with working tool calls (vLLM)">{`# The two flags are not optional: without them a named tool_choice returns 400.
vllm serve <model-id> \\
  --enable-auto-tool-choice \\
  --tool-call-parser hermes          # must match the model's tool-call format

# Then point any OpenAI-shaped client at it:
#   base_url = "http://localhost:8000/v1"
# Your adapter's "openai-chat" branch works unchanged — but keep a fallback
# for the documented case where a forced call does not arrive.`}</PromptCard>

See [Run models locally with Ollama](/docs/models/run-models-locally-ollama) and [Local coding agents](/docs/models/local-coding-agents) for the surrounding setup.

## Google moved the docs — and the API

Timely enough to call out on its own, because it changes which shape you should be writing against. Google's function-calling documentation migrated: the page at `ai.google.dev` now serves a **new Interactions API** by default and redirects to AI Studio, while the classic Generate Content shape — `functionDeclarations`, `functionCall`, `functionResponse`, `tool_config.function_calling_config.mode` — is **explicitly labeled "Legacy."**

The new Interactions API uses a flat tool shape closer to OpenAI's: `{type: "function", name, description, parameters}`, with the model's request arriving as a `FunctionCallStep` carrying `name` and `arguments`, and the mode set through `tool_choice` inside `generation_config` using `auto`, `any`, and `none`, plus `allowed_tools` to restrict which tools may be called.

The strategic read: **the industry is converging on OpenAI's flat shape**, and Google just moved toward it. That doesn't make the problem go away — the argument-encoding split and the ID-field split survive the convergence — but it does mean a new integration written today should target the flat shape, and that the classic Gemini column in the table above is now maintenance work rather than new work.

## The portability checklist

<Steps items={[
  {title: "Put all four dialects behind one adapter, today", body: "Two functions: one that renders your internal tool list into the provider's definition shape, and one that normalizes the provider's response into {id, name, args}. If provider names appear anywhere else in your codebase, you will port twice."},
  {title: "Normalize argument encoding exactly once", body: "Parse where the provider sends a string, pass through where it sends an object, and make a parse failure a tool result rather than an exception."},
  {title: "Never assume a correlation ID exists", body: "Synthesize an index-based ID when the provider doesn't supply one, and preserve array order strictly so positional matching still works."},
  {title: "Treat forced tool choice as a capability, not a setting", body: "Feature-detect it. It is unsupported on Claude's newest models, unreliable for some model formats under vLLM, and schema-complexity-limited in Gemini's ANY mode. Design the prompt so auto picks the right tool, and keep forcing as an optimization."},
  {title: "Write one schema that satisfies the narrowest dialect", body: "Flat, shallow, explicit required, additionalProperties: false, no exotic keywords. It passes OpenAI strict mode, survives Gemini's OpenAPI subset, and models follow it better."},
  {title: "Decide consciously what you give up", body: "Returning an image from a tool, forcing a specific tool, and Gemini's VALIDATED mode are all real capabilities that do not survive the lowest common denominator. Keep them behind flags rather than pretending the providers are identical."},
  {title: "Test the loop, not the call", body: "A single successful tool call proves almost nothing. The bugs live in the round trip: the second turn, two calls at once, a tool that errors, and a result that isn't a plain string."}
]} />

<Flashcards title="Field names worth memorizing" cards={[
  {front: "Anthropic: schema key, request block, reply block", back: "input_schema on the tool; a tool_use content block with id, name, and input (an object); a tool_result block with tool_use_id, content, and optional is_error. Top-level stop_reason is \"tool_use\"."},
  {front: "OpenAI Chat Completions: the three field names", back: "parameters on the nested function object; tool_calls[] on the assistant message, where function.arguments is a JSON STRING; a reply message with role \"tool\" and tool_call_id."},
  {front: "OpenAI Responses: what changes from Chat Completions", back: "The tool definition goes flat — {type: \"function\", name, parameters, strict}. The request arrives as a function_call item and the reply is a function_call_output item, and the ID field is call_id rather than tool_call_id."},
  {front: "Gemini (classic): the four names", back: "tools: [{functionDeclarations: [...]}]; a functionCall part with name, args (an object), and id; a functionResponse part with name, response (a structured object), and the matching id."},
  {front: "Which providers send arguments as a string?", back: "OpenAI (both APIs) and Mistral send a JSON-encoded string you must parse. Anthropic's input and Gemini's args are already objects. This is the most common cross-provider bug, and it fails silently."},
  {front: "Which provider has no correlation ID?", back: "Ollama's documented tool-result message has no tool_call_id — correlation is positional and by tool name. Synthesize an index-based ID in your adapter and never reorder results."},
  {front: "tool_choice equivalents", back: "Anthropic auto / any / tool / none; OpenAI \"auto\" / \"required\" / \"none\"; Gemini VALIDATED / AUTO / ANY / NONE; Mistral auto / any / none. Forcing is unsupported on Claude's newest models, which return a 400."},
  {front: "The three schema dialects", back: "Raw JSON Schema (Anthropic, OpenAI non-strict, Mistral, Ollama); OpenAI strict mode's narrowed subset (additionalProperties false, every property required, object root); Gemini's subset of the OpenAPI schema — the one most likely to reject a ported schema."},
  {front: "vLLM's two mandatory flags", back: "--enable-auto-tool-choice and --tool-call-parser <name> matching the model's format. Without them, a named tool_choice returns HTTP 400. And for some Mistral-format models the docs say a call is not guaranteed even when forced."},
]} />

<Quiz questions={[
  {
    q: "Your agent works on Claude and you port it to OpenAI. Tools now run but receive empty fields, with no type errors anywhere. What is the first thing to check?",
    options: [
      "Whether the tool schema uses an unsupported JSON Schema keyword",
      "Whether you parsed function.arguments, which OpenAI sends as a JSON string while Anthropic's input is already an object",
      "Whether tool_choice is set to auto",
      "Whether the model supports parallel tool calls"
    ],
    answer: 1,
    explain: "Anthropic's tool_use.input and Gemini's functionCall.args arrive as objects; OpenAI's function.arguments and the Responses API's arguments arrive as JSON strings. Reaching for keys on a string fails quietly in a dynamic language, which is why this looks like the model sending bad arguments. Normalize encoding once, at the adapter boundary."
  },
  {
    q: "You wrote one adapter and set tool_choice to force a specific tool, because that line looked identical across vendors. Where does it fail?",
    options: [
      "On Gemini, which has no way to force a specific tool",
      "On OpenAI, which removed required",
      "On Claude's newest models — any and tool return a 400",
      "Nowhere; forcing is the one fully portable setting"
    ],
    answer: 2,
    explain: "This is the reverse of the usual expectation. On Claude Fable 5.2 and 5.1, Mythos 5.2 and 5.1, Opus 5.5 and Sonnet 5.5, tool_choice values any and tool return a 400; the guidance is to use auto with strict tool use instead. OpenAI's required and Gemini's ANY both still work, and Gemini can even restrict to named tools via allowed_function_names."
  },
  {
    q: "You run the same agent against a hosted provider and a local Ollama model. The model asks for two tools in one turn and your results get attached to the wrong calls. Why?",
    options: [
      "Ollama does not support parallel tool calls at all",
      "Ollama's tool-result message has no tool_call_id, so correlation is positional and by name",
      "Ollama requires a --tool-call-parser flag",
      "Ollama returns arguments as a string and your parse reordered them"
    ],
    answer: 1,
    explain: "Ollama's documented tool-result message carries no tool_call_id field — unlike Anthropic's tool_use_id, OpenAI's tool_call_id / call_id, and Gemini's id. With no ID to match on, results cannot be returned out of order, and two calls to the same tool are distinguishable only by position. Synthesize an index-based ID in the adapter and preserve order. (The parser flag is a vLLM concern, not Ollama's.)"
  },
  {
    q: "A schema that works fine on Anthropic is rejected with 400 INVALID_ARGUMENT by Gemini in ANY mode. What is the most likely cause?",
    options: [
      "Gemini requires additionalProperties: false on every object",
      "The schema is too large or deeply nested — ANY mode compiles it into a state machine with limits",
      "Gemini does not support enum properties",
      "The root of the schema is an object rather than an array"
    ],
    answer: 1,
    explain: "Gemini's docs state that in ANY mode very large or deeply nested schemas may be rejected, because the schema is compiled into a state machine with limits on states, branching, and nesting. A schema that is merely verbose elsewhere can be invalid here — which is the main argument for writing the flattest schema that does the job."
  }
]} />

<Callout type="takeaways" items={[
  "One concept, four dialects: the only rows that really differ are the schema key (input_schema vs parameters), the arguments field, and the correlation-ID name.",
  "Arguments are a JSON string on OpenAI and Mistral, and a parsed object on Anthropic and Gemini — normalize exactly once, at the adapter boundary.",
  "Ollama supplies no correlation ID; synthesize one and never reorder tool results.",
  "Forcing a tool call is portable everywhere EXCEPT Claude's newest models, which return a 400 on any and tool — feature-detect it instead of assuming it.",
  "Three schema dialects, so write for the narrowest: flat, shallow, explicit required, additionalProperties false, no exotic keywords.",
  "Open weights need server-side configuration — vLLM wants --enable-auto-tool-choice plus a matching --tool-call-parser, and does not guarantee a forced call for every model format.",
  "Google now labels the classic Gemini shape Legacy and its new API uses OpenAI's flat shape — target the flat shape for anything new.",
]} />

## Next

- [Tool Use / Function Calling](/docs/api/tool-use) — the Anthropic shape in depth, including the three message-shape rules that return a 400
- [Porting Prompts Across Models](/docs/models/porting-prompts-across-models) — what transfers and what breaks above the wire format
- [Prompt Caching Across Providers](/docs/models/prompt-caching-across-providers) — the other place a portable-looking optimization quietly inverts
- [AI Gateways: LiteLLM, OpenRouter, Portkey](/docs/models/ai-gateways-litellm-openrouter-portkey) — when to buy the adapter layer instead of writing it
