# أوامر شرطة مائلة مخصصة

> Source: https://derob98.github.io/ailmanac/ar/docs/claude-code/slash-commands · AILmanac (CC BY 4.0) · last verified 2026-11-11

حوّل سير عمل متكرر إلى كلمة واحدة.

<LevelBadge level="intermediate" />

<VerifyNote lastVerified="2026-11-11" source="https://code.claude.com/docs/en/skills">
قد تتغير مواقع ملفات الأوامر وخيارات frontmatter — تأكد منها في وثائق skills الرسمية (أصبحت الأوامر المخصصة موجودة هناك الآن).
</VerifyNote>

الأمر المخصص بالشرطة المائلة يجمع مطالبة (prompt) تعيد كتابتها باستمرار في `/كلمة` واحدة. عرّفه مرة واحدة، وأعد استخدامه إلى الأبد (وشاركه مع فريقك).

<Callout type="info" items={["اندمجت الأوامر المخصصة مع Skills. الملف في .claude/commands/deploy.md والمهارة في .claude/skills/deploy/SKILL.md كلاهما ينشئ /deploy ويعمل بالطريقة نفسها — وتستمر ملفات .claude/commands/ الحالية في العمل. تضيف Skills مجلدًا للملفات المساندة، وfrontmatter للتحكم في الاستدعاء، وتحميلًا تلقائيًا عند الصلة. لأي شيء يتجاوز مطالبة من ملف واحد، فضّل Skill."]} />

<Callout type="objectives" items={["شرح ما هو الأمر المخصص بالشرطة المائلة ولماذا هو أفضل من إعادة كتابة المطالبة", "إنشاء أمر بوضع ملف Markdown في المجلد الصحيح", "التمييز بين أوامر المشروع والأوامر الشخصية من خلال موقعها", "استخدام اللبنات الأساسية: $ARGUMENTS، ومخرجات bash المضمّنة، والإشارة إلى الملفات، وfrontmatter", "الاختيار بين أمر الشرطة المائلة والمهارة والوكيل الفرعي لمهمة معينة"]} />

## كيف تعمل

الأمر ما هو إلا ملف Markdown. ضعه في مجلد الأوامر ليصبح اسم الملف هو الأمر. ومحتوى الملف هو المطالبة التي ينفذها Claude عند استدعائه.

*موقع* الملف يحدد نطاقه:

<Steps items={[{title: "أمر المشروع (قابل للمشاركة)", body: "احفظه في .claude/commands/changelog.md ← /changelog. يعيش في المستودع، فيحصل عليه الفريق كله."}, {title: "أمر شخصي (كل المشاريع)", body: "احفظه في ~/.claude/commands/changelog.md ← /changelog. يرافقك في كل مشروع على جهازك."}, {title: "استدعِه", body: "اكتب /كلمة في Claude Code. يصبح محتوى الملف هو المطالبة التي ينفذها Claude."}]} />

<Callout type="tip" items={["اسم الملف — لا frontmatter — هو ما يصبح اسم الأمر: changelog.md هو /changelog. يقبل ملف الأمر نفس frontmatter الخاص بالمهارة باستثناء name وpaths، لذا لا يمكنك إعادة تسمية الأمر من داخل الملف.", "المجلد الفرعي يضيف مساحة اسم إلى الأمر باستخدام النقطتين: .claude/commands/frontend/component.md هو /frontend:component وليس /component."]} />

## مثال بسيط

هذا ملف أمر كامل. يحتوي frontmatter على `description`، وكل ما تحته هو المطالبة.

<PromptCard title="commit.md — صياغة Conventional Commit">{`---
description: Draft a Conventional Commit message from the staged diff
---

Look at the staged changes with \`git diff --cached\` and write a single
Conventional Commit message (feat/fix/docs/refactor/chore). Output only the
message, no preamble.`}</PromptCard>

احفظه باسم `commit.md` وسيفعل `/commit` ذلك في كل مرة. (الاسم هو اسم الملف — فالمحتوى نفسه إذا حُفظ باسم `changelog.md` يصبح `/changelog`.)

## اللبنات الأساسية المفيدة

أربعة مكوّنات تحوّل مطالبة ثابتة إلى أمر مرن:

| اللبنة الأساسية | ماذا تفعل |
| --- | --- |
| **`$ARGUMENTS`** | تحقن كل ما كتبه المستخدم بعد الأمر. `/review src/auth.ts` ← يصل المسار إلى مطالبتك. |
| **`$ARGUMENTS[N]` / `$N`** | وسيط واحد حسب فهرس **يبدأ من 0**. `$ARGUMENTS[0]` واختصارها `$0` هو الوسيط *الأول* — لذا فإن `$1` هو **الثاني** وليس الأول كما في سكربت الشِّل. |
| **تشغيل bash وتضمين المخرجات** | يمكن أن تتضمن الأوامر مخرجات الشِّل (مثل الفرق الحالي diff) ليعمل Claude على الحالة الحية. |
| **الإشارة إلى الملفات** | أشر إلى ملفات لتضمين محتواها. |
| **Frontmatter** | `description` (تظهر في القائمة)، و`argument-hint`، و`allowed-tools`، و`disallowed-tools`، و`disable-model-invocation`. |

راجع [الوثائق الرسمية](https://code.claude.com/docs/en/skills) للاطلاع على الصيغة الدقيقة للوسائط (arguments) وbash ومراجع الملفات.

## أوامر تستحق السرقة

توجد مجموعة بداية في [مكتبة أوامر الشرطة المائلة](/docs/templates/slash-commands): رسالة الإيداع (commit)، ووصف طلب السحب (PR)، ومراجعة الكود، وسجل التغييرات (changelog)، وبناء هيكل مكوّن (scaffold-a-component).

## الأمر مقابل المهارة مقابل الوكيل الفرعي

ثلاث طرق لتغليف العمل — والفرق في *من يطلقها* و*مدى عزل تشغيلها*:

- **أمر الشرطة المائلة** — *أنت* تطلق سير عمل معروفًا عند الطلب.
- **[المهارة](/docs/claude-code/skills)** — يحمّل Claude الخبرة *تلقائيًا* عند الصلة.
- **[الوكيل الفرعي](/docs/claude-code/subagents)** — فوّض جزءًا من العمل إلى وكيل معزول.

<Flashcards cards={[{front: "أمر الشرطة المائلة", back: "تطلق أنت سير عمل معروفًا عند الطلب بكتابة /كلمة."}, {front: "المهارة", back: "يحمّل Claude الخبرة تلقائيًا عند الصلة — أنت لا تستدعيها."}, {front: "الوكيل الفرعي", back: "يفوّض جزءًا من العمل إلى وكيل معزول."}, {front: ".claude/commands/x.md", back: "أمر مشروع /x — يعيش في المستودع ويمكن مشاركته مع الفريق."}, {front: "~/.claude/commands/x.md", back: "أمر شخصي /x — يرافقك في كل المشاريع."}, {front: "$ARGUMENTS", back: "يحقن في المطالبة ما كتبه المستخدم بعد الأمر."}]} />

<Quiz title="اختبر نفسك" questions={[{q: "أين تحفظ أمر الشرطة المائلة ليحصل عليه فريقك كله في المستودع؟", options: [".claude/commands/", "~/.claude/commands/", "في أي مكان في جذر المستودع"], answer: 0, explain: ".claude/commands/changelog.md ← /changelog هو أمر مشروع — يعيش في المستودع وقابل للمشاركة. أما مسار ~/.claude/ فهو شخصي، لكل مشاريعك."}, {q: "ما الذي يحدد اسم أمر الشرطة المائلة؟", options: ["الوصف description في frontmatter", "اسم ملف Markdown والمجلد الفرعي الذي يوجد فيه", "أول عنوان في المحتوى"], answer: 1, explain: "اسم الملف يصبح الأمر: changelog.md ← /changelog. لا يستطيع ملف الأمر إعادة تسمية نفسه — فهو يقبل نفس frontmatter الخاص بالمهارة باستثناء name وpaths. والمجلد الفرعي يضيف إلى الاسم بادئة بنقطتين، لذا فإن commands/frontend/component.md هو /frontend:component."}, {q: "ماذا يفعل $ARGUMENTS في الأمر؟", options: ["يسرد كل الأوامر المتاحة", "يحقن في المطالبة ما كتبه المستخدم بعد الأمر", "يشغّل سكربت bash"], answer: 1, explain: "يحقن $ARGUMENTS ما كتبه المستخدم بعد الأمر — فمثلًا /review src/auth.ts يضع المسار في مطالبتك."}, {q: "أي خيار من خيارات التغليف يحمّله Claude تلقائيًا عند الصلة بدلًا من أن تطلقه أنت؟", options: ["أمر الشرطة المائلة", "المهارة", "الوكيل الفرعي"], answer: 1, explain: "المهارة تحمّل الخبرة تلقائيًا عند الصلة. أما أمر الشرطة المائلة فتطلقه أنت عند الطلب؛ والوكيل الفرعي يفوّض العمل إلى وكيل معزول."}]} />

## التالي

- [المهارات: خبرة عند الطلب](/docs/claude-code/skills)
- [الخطافات (Hooks): أتمتة حتمية](/docs/claude-code/hooks)
- [مكتبة أوامر الشرطة المائلة](/docs/templates/slash-commands)
