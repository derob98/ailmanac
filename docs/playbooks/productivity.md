# Everyday Productivity

> Source: https://derob98.github.io/ailmanac/docs/playbooks/productivity · AILmanac (CC BY 4.0)

Your first five high-value uses of Claude for daily work — with copy-paste prompts.

<LevelBadge level="beginner" />

Five things almost anyone can use today. Each comes with a starter prompt — paste it, swap the brackets, refine in plain language.

<Callout type="objectives" items={[
  "Draft a reply, a summary, or a plan from a single copy-paste prompt",
  "Recognize the three parts every one of these prompts names: goal, format, constraints",
  "Use follow-ups to steer an output instead of rewriting the prompt from scratch",
  "Get writing that sounds like you, by giving a sample of your own",
  "Know which outputs you must verify before acting on them"
]} />

## 1. Tame your inbox

<PromptCard title="Draft a reply to an email you received">
{`Here's an email I received. Draft a polite, concise reply that [accepts the
meeting but proposes Thursday instead]. Keep it under 80 words.

Email: [paste]`}
</PromptCard>

Follow-ups that help: *"more formal,"* *"add a line thanking them,"* *"give me two versions."*

## 2. Summarise long things

<PromptCard title="Summarise anything, with decisions pulled out separately">
{`Summarise this in 5 bullet points a busy manager could read in 30 seconds,
then list any decisions or action items separately.

Text: [paste]`}
</PromptCard>

Works on articles, meeting notes, threads, and reports. For very long inputs, ask for the summary **first**, then drill in.

## 3. Plan and break down work

<PromptCard title="Turn a vague goal into a plan with risks flagged">
{`I need to [organise a 30-person team offsite] by [October]. Give me a
step-by-step plan with rough timing, and flag the 3 things most likely
to go wrong.`}
</PromptCard>

Great for project plans, checklists, and turning a vague goal into next actions.

## 4. Think it through with you

<PromptCard title="Pressure-test a decision instead of just making it">
{`I'm deciding between [option A] and [option B] for [situation]. Lay out the
trade-offs in a table, then tell me what else I should consider before
deciding.`}
</PromptCard>

Use it as a sparring partner — ask it to argue the opposite case to pressure-test your thinking.

## 5. Draft, then make it yours

<PromptCard title="Get a draft in your own voice">
{`Write a first draft of [a LinkedIn post announcing our new feature].
Match this voice: [paste a paragraph you wrote]. Then suggest a punchier
opening line.`}
</PromptCard>

Giving a sample of *your* writing is the secret to outputs that don't sound generic.

## The two habits that matter

<Steps items={[
  {
    "title": "Give context, then iterate",
    "body": "Every prompt above names the goal, the format, and the constraints — that is the whole recipe. And none of them have to be right first try: say what is off in plain language (\"shorter,\" \"less formal,\" \"two versions\") instead of rewriting the prompt."
  },
  {
    "title": "Verify anything factual",
    "body": "Dates, numbers, names, quotes, and \"facts\" can be confidently wrong. The summary of a document you pasted is low-risk; a market figure the model recalled from memory is not. For anything that matters, check it."
  }
]} />

Those two habits each have a page behind them: [Prompting Basics](/docs/prompting/basics) for naming goal, format, and constraints, and [Hallucinations](/docs/foundations/hallucinations) for knowing which outputs can be confidently wrong.

<Quiz questions={[
  {
    "q": "You paste a 40-page report and want to understand it. What does this page suggest you ask for first?",
    "options": [
      "A detailed section-by-section analysis",
      "The 5-bullet summary, then drill into the parts that matter",
      "A list of every number in the document",
      "A rewrite in simpler language"
    ],
    "answer": 1,
    "explain": "For very long inputs, ask for the summary first and then drill in. It gives you a map before you commit attention to any one section — and it tells you quickly whether the document is even the one you needed."
  },
  {
    "q": "The draft comes back sounding generic and nothing like you. What is the fix this page names?",
    "options": [
      "Ask for a more creative tone",
      "Paste a paragraph of your own writing as a voice sample",
      "Ask for ten versions and pick one",
      "Write a longer description of your personality"
    ],
    "answer": 1,
    "explain": "Giving a sample of your own writing is the single most effective move. A description of a voice (\"friendly but professional\") is interpreted; an actual paragraph of yours is imitated."
  },
  {
    "q": "Which of these outputs most needs verifying before you act on it?",
    "options": [
      "A summary of notes you pasted into the prompt",
      "A reply drafted from an email you pasted",
      "A market statistic the model produced from memory",
      "A table of trade-offs between two options you described"
    ],
    "answer": 2,
    "explain": "Everything grounded in text you supplied can be checked against that text. A number the model recalled with no source is the one that can be confidently wrong — those are the dates, figures, names and quotes to check."
  }
]} />

<Callout type="takeaways" items={[
  "Goal + format + constraints is the whole recipe. All five prompts here are that pattern.",
  "Refine in plain language instead of rewriting — \"shorter,\" \"more formal,\" \"two versions\" all work.",
  "Summarise first, then drill in, whenever the input is long.",
  "A sample of your own writing beats any description of your tone.",
  "Grounded outputs are cheap to check; recalled facts are the ones that bite."
]} />

## Next

- Level up your prompting → [Prompt Patterns Library](/docs/prompting/pattern-library)
- A persistent workspace for a project → [Projects](/docs/claude-app/projects)
- Use AI inside your existing tools → [AI in Your Existing Tools](/docs/claude-app/ai-in-your-tools)
