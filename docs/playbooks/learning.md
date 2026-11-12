# Learning & Studying

> Source: https://derob98.github.io/ailmanac/docs/playbooks/learning · AILmanac (CC BY 4.0)

Socratic tutoring and teach-back — learning with AI, not cheating with it.

<LevelBadge level="all" />

<Callout type="objectives" items={[
  "Run a five-step study session that ends with you able to explain the thing unaided",
  "Tell the five teaching modes apart and know which one to reach for at which point",
  "Use teach-back — the one step most people skip, and the only one that reveals what you don't know",
  "Spot the line between getting guidance and getting the answer key, and stay on the right side of it",
  "Build spaced practice into the workflow so the understanding survives the week",
]} />

AI can be the patient, infinitely-available tutor most of us never had — *if* you use it to **understand**, not to outsource thinking. The difference between learning and cheating is the workflow.

Here is the trap, and it is a comfortable one. An explanation you read feels exactly like an explanation you understood. The feeling arrives first and the gap shows up later, in the exam room or the code review. Every mode below exists to force that gap into the open **while you can still do something about it**.

## Modes that actually teach

- **Explain like I'm new.** "Explain [concept] simply, with one analogy and one example." Then go deeper in layers.
- **Socratic tutoring.** "Don't give me the answer — ask me questions that lead me to it."
- **Teach-back.** Explain it, then *you* restate it; the AI corrects your gaps. This is where real learning sticks.
- **Quiz me.** "Generate 5 questions on [topic], then grade my answers and explain the misses."
- **Study plan.** "I have 2 weeks for [exam]. Build a plan and drill my weak spots."

The modes are not alternatives — they're a sequence. Explanation gets the shape of the idea into your head; teach-back and quizzing find out whether it actually landed.

## A session that teaches, step by step

<Steps items={[
  {title: "Say what you already know — before asking anything", body: "Open with your current understanding, even if it's wrong: 'I think a database index is like a sorted copy of a column, but I don't know why that makes lookups faster.' A tutor that knows your starting point teaches from there. A tutor that doesn't will restate the textbook at you, and the textbook is what already failed."},
  {title: "Ask for one layer, not the whole topic", body: "Request the simple version with one analogy and one example, then stop. Depth beats breadth, and a 2,000-word answer is a document you will skim, not a lesson you will absorb. Go deeper only after the current layer holds."},
  {title: "Switch the tutor into Socratic mode for the hard part", body: "Where you feel the fog, ask it to stop explaining and start asking: 'Don't give me the answer — ask me questions that lead me to it.' Being asked and being told produce the same words and completely different memories."},
  {title: "Teach it back, in your own words, without looking", body: "Close the explanation and write your version from memory. Then hand it over to be corrected, kindly and specifically. The places you go vague are not writing problems — they are exactly the places you don't understand yet, and they're invisible until you try to say them out loud."},
  {title: "Get quizzed, then schedule the return", body: "Ask for five questions, answer them, and have the misses explained. Then put a reminder in your calendar for two or three days out to re-quiz the same material cold. The second pass is where the understanding stops being a feeling and becomes something you own."}
]} />

## Starter prompts

<PromptCard title="Open a tutoring session (Socratic mode)">{`Tutor me on {topic}. Start by asking what I already know, then teach one step at
a time and check my understanding before moving on. Don't just give answers.`}</PromptCard>

<PromptCard title="Teach-back — the step that finds the gaps">{`I'll explain {concept} back to you. Point out anything wrong or missing, kindly
and specifically. Here's my explanation: {your attempt}`}</PromptCard>

<PromptCard title="Quiz me, then explain only the misses">{`Generate 5 questions on {topic}, ranging from recall to application. Ask them one
at a time, wait for my answer, and don't reveal the answer before I reply. At the
end, explain only the ones I got wrong and tell me what to review.`}</PromptCard>

<PromptCard title="Two-week study plan with weak-spot drilling">{`I have 2 weeks before an exam on {topic}. I'm currently weak on {weak areas}.
Build a day-by-day plan that spends most of the time on my weak spots, includes
spaced review of anything I've already covered, and ends with a mock test.`}</PromptCard>

## Use it to learn, not to cheat

:::warning[For graded work, get guidance — not the answer key]
If you paste homework and copy the output, you didn't learn it (and may break your school's rules). Ask for hints, checks, and explanations that get *you* to the answer. Own the result.
:::

- **Verify facts** — tutors can be confidently wrong; cross-check key claims ([Hallucinations](/docs/foundations/hallucinations)).
- **One concept at a time** — depth beats breadth.
- **Spaced practice** — come back and re-quiz; that's what makes it stick.

## Bonus: accessible learning

For dyslexia, language learning, or focus differences, AI can rephrase, simplify, translate, and pace patiently — see [Accessibility](/docs/playbooks/accessibility).

<Flashcards cards={[
  {front: "Explain like I'm new", back: "Ask for the simple version with one analogy and one example, then go deeper in layers. Gets the shape of an idea into your head — but on its own proves nothing about whether you understood it."},
  {front: "Socratic tutoring", back: "\"Don't give me the answer — ask me questions that lead me to it.\" Best for the part of a topic where you feel fog rather than confusion, because being asked and being told produce very different memories."},
  {front: "Teach-back", back: "You restate the concept from memory and the AI corrects your gaps. The step most people skip and the only one that reliably reveals what you don't know, because vagueness in your own explanation maps directly onto holes in your understanding."},
  {front: "Quiz me", back: "\"Generate 5 questions on the topic, then grade my answers and explain the misses.\" Turns passive recognition into active recall — and the misses are the study list you'd never have written yourself."},
  {front: "Spaced practice", back: "Returning to the same material days later and re-quizzing cold. The second pass is what converts a feeling of understanding into something durable."},
  {front: "The fluency trap", back: "A clear explanation you read feels identical to one you understood. The gap only surfaces when you're asked to produce the idea yourself — which is why the workflow ends in teach-back and quizzing, not in reading."}
]} />

<Quiz questions={[
  {
    q: "You've just read a crisp AI explanation of a concept and it made complete sense. What does that tell you about whether you've learned it?",
    options: [
      "You've learned it — clarity is the whole point",
      "Very little; a clear explanation you read feels the same as one you understood",
      "Nothing until you've read at least two different explanations",
      "You've learned it as long as you can repeat the analogy"
    ],
    answer: 1,
    explain: "This is the fluency trap. The feeling of understanding arrives when the explanation is clear, not when the knowledge is yours — and the gap stays hidden until something forces you to produce the idea unaided. That's why the session ends in teach-back and quizzing rather than in reading."
  },
  {
    q: "You're stuck in the foggy middle of a topic — you can follow each sentence but can't put it together. Which mode fits best?",
    options: [
      "Explain like I'm new, one more time",
      "Socratic tutoring — have it ask you questions instead of explaining",
      "Study plan, so you can come back to it later",
      "Quiz me, to see how bad it is"
    ],
    answer: 1,
    explain: "Re-reading an explanation you can already follow adds nothing; the sentences were never the problem. Asking the tutor to stop explaining and start asking questions makes you do the assembling, which is the part that wasn't happening."
  },
  {
    q: "A graded assignment is due tonight and you're out of time. Which request stays on the right side of the line?",
    options: [
      "\"Write the answer so I can study the structure, I'll rephrase it\"",
      "\"Ask me questions about my draft and point out where my reasoning breaks\"",
      "\"Give me the answer key and I'll check my work against it\"",
      "\"Do question 3 and I'll do the rest myself\""
    ],
    answer: 1,
    explain: "Hints, checks, and explanations that get you to the answer are guidance. A finished answer you rephrase is the answer key with extra steps — you didn't learn it, and it may break your school's rules. Own the result."
  }
]} />

<Callout type="takeaways" items={[
  "The workflow is the difference between learning and cheating — not the topic, and not the tool",
  "Open by stating what you already know; a tutor without your starting point just restates the textbook that already failed you",
  "One layer at a time, then teach it back from memory — the places you go vague are the places you don't understand",
  "End every session by scheduling the cold re-quiz, two or three days out",
  "For graded work ask for hints and checks, never the finished answer — and verify the facts, because a confident tutor can still be wrong",
]} />

## Next

- [Student & Learning skill pack](/docs/templates/skills)
- [What Is an LLM?](/docs/foundations/what-is-an-llm)
- [Accessibility: Claude as an Assistive Tool](/docs/playbooks/accessibility)
