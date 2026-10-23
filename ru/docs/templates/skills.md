# Наборы навыков и шаблоны SKILL.md

> Source: https://derob98.github.io/ailmanac/ru/docs/templates/skills · AILmanac (CC BY 4.0) · last verified 2026-07-20

Готовые к использованию Agent Skills по типам пользователей, плюс как написать свой собственный.

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-07-20" source="https://code.claude.com/docs/en/skills">
Структура файла навыка и места, где навыки можно использовать (Claude Code, Claude.ai, Cowork, облачные сессии), меняются — уточняйте детали в официальной документации по Skills. Пользовательские команды теперь объединены с навыками: файлы в `.claude/commands/` по-прежнему работают, но рекомендуемая форма — навыки.
</VerifyNote>

**Навык** даёт Claude сфокусированную экспертизу, которую он загружает *по требованию*, когда ваш запрос
подходит — так что вам не нужно объяснять свои потребности заново каждый раз. AILmanac поставляет набор
**готовых к использованию наборов навыков**, по одному на каждый тип пользователя. Изучите концепцию подробнее на
странице [Skills](/docs/claude-code/skills).

## Готовые наборы

Они лежат в папке
[`plugins/ailmanac/skills`](https://github.com/derob98/ailmanac/tree/main/plugins/ailmanac/skills) репозитория:

| Набор | Для кого | Что делает |
|---|---|---|
| `ailmanac` | Все, кто задаёт вопросы о Claude и других ИИ-инструментах | Ищет ответ в этом руководстве и цитирует страницу с датой её проверки |
| `claude-md-check` | Пользователи Claude Code | Сверяет ваш `CLAUDE.md` с репозиторием и с тем, как загружаются файлы памяти |
| `writing-content-pro` | Авторы, маркетологи, креаторы | Бриф → черновик в несколько проходов → попадание в ваш голос → переупаковка |
| `developer-workflow` | Разработчики | Кодинг с приоритетом контекста, ревью, тесты, понятные коммиты |
| `research-analyst` | Исследователи, аналитики | Синтез с опорой на источники и дисциплиной цитирования |
| `data-analyst` | Пользователи данных и таблиц | SQL/формулы + чтение простым языком + проверка статистической вменяемости |
| `business-marketing` | Основатели, владельцы малого бизнеса | Позиционирование, тексты, коммуникации с клиентами, лёгкое планирование |
| `student-learning` | Студенты и учащиеся | Сократическое обучение + объяснение усвоенного (учитесь, а не просто копируйте) |
| `everyday-productivity` | Все | Почта, резюме, планирование, решения |

В каждый заложены домашние правила: **давайте контекст, итерируйте и проверяйте то, что важно.**

## Установка (Claude Code)

Все сразу, как плагин:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

Или скопируйте один набор из клона репозитория:

```bash
# personal — available in all your projects
mkdir -p ~/.claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro ~/.claude/skills/

# or per-project — shareable with your team via the repo
mkdir -p .claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro .claude/skills/
```

Claude активирует навык автоматически, когда ваш запрос совпадает с его
`description`. В Claude.ai / Cowork создайте навык и вставьте `SKILL.md`
набора (доступность зависит от плана).

## Напишите свой собственный — минимальный шаблон

Навык — это папка с файлом `SKILL.md`: YAML-фронтматтер + инструкции. `description` —
это **триггер** — пишите его как «Use when…». Обязательно только поле `description`;
имя команды берётся из имени папки.

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

### Чек-лист валидности

- [ ] Папка названа в kebab-case — это имя станет `/command-name`.
- [ ] `description` говорит, **когда его использовать** (триггер), а не только что это такое. Главный сценарий ставьте первым (объединённые `description` + `when_to_use` обрезаются до 1 536 символов в списке навыков).
- [ ] Инструкции конкретны и ограничены — одна чёткая задача.
- [ ] Нет секретов, учётных данных или личных/клиентских данных.
- [ ] Указано, как обрабатывать неопределённость (не выдумывать; проверять).

## Связанное

- [Навыки: экспертиза по требованию](/docs/claude-code/skills) — полная концепция
- [Пользовательские слэш-команды](/docs/claude-code/slash-commands) — их вы запускаете по требованию
- [Субагенты](/docs/claude-code/subagents) — делегирование целых блоков работы


## Дальше

- [Конфигурация MCP и заготовки серверов](/docs/templates/mcp-config)
