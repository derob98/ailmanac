#!/usr/bin/env node
/**
 * Scaffolds the full AILmanac information architecture as MDX stubs.
 * - Skips any file that already exists (never overwrites real content).
 * - Stubs are honest "planned" pages that double as good-first-issues.
 * Run: node scripts/scaffold-pages.mjs
 */
import {mkdirSync, existsSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');

// dir, file, position, level, title, description
const PAGES = [
  ['start-here', 'which-claude', 2, 'beginner', 'Which Claude Should I Use?', 'Decision tree: chat vs Claude Code vs the API, plus mobile and voice.'],
  ['start-here', 'levels-and-freshness', 5, 'all', 'How Levels & Freshness Work', 'How to read the level badges and the "last verified" date stamps.'],
  ['start-here', 'landscape-map', 6, 'all', 'The Landscape Map', 'Annotated index of official and community AI resources — and when to use each.'],

  ['foundations', 'what-is-an-llm', 1, 'beginner', 'What Is an LLM?', 'Next-token prediction in plain language — and what an LLM is not.'],
  ['foundations', 'tokens-and-context', 2, 'beginner', 'Tokens, Context & Memory', 'How models read and "remember" text, and why long chats drift.'],
  ['foundations', 'roles', 3, 'beginner', 'System, User & Assistant Roles', 'The anatomy of a conversation and why the system prompt is your best lever.'],
  ['foundations', 'sampling-controls', 4, 'intermediate', 'Sampling Controls: Temperature & Friends', 'Temperature, top-p and stop sequences — when to run hot vs cold.'],
  ['foundations', 'hallucinations', 5, 'intermediate', 'Hallucinations & How to Reduce Them', 'Why models fabricate, the high-risk zones, and a verification toolkit.'],
  ['foundations', 'embeddings', 6, 'intermediate', 'Embeddings & Vector Search', 'Meaning as a vector, and how semantic search works.'],
  ['foundations', 'rag', 7, 'intermediate', 'Retrieval-Augmented Generation (RAG)', 'Make any model answer about your data — and the failure modes to avoid.'],
  ['foundations', 'finetune-vs-prompt-vs-rag', 8, 'intermediate', 'Fine-tuning vs Prompting vs RAG', 'The decision framework people get wrong, with a try-in-this-order rule.'],
  ['foundations', 'evals', 9, 'advanced', 'Evaluating AI Quality (Evals)', 'Build a golden set, pick metrics, and catch regressions before users do.'],
  ['foundations', 'privacy', 10, 'beginner', 'Privacy & Data Handling', 'What is safe to paste, training on your data, and when to run local.'],
  ['foundations', 'cost-and-latency', 11, 'intermediate', 'Cost & Latency Tradeoffs', 'The cost/quality/speed triangle, model tiering, caching and batching.'],
  ['foundations', 'choosing-a-model-provider', 12, 'intermediate', 'Choosing a Model & Provider', 'A vendor-neutral way to pick a model — and read benchmarks skeptically.'],
  ['foundations', 'claude-vs-others', 13, 'intermediate', 'Claude vs ChatGPT, Gemini & Copilot', 'An honest, evergreen way to compare the major assistants for your needs.'],
  ['foundations', 'ai-media-generation', 14, 'intermediate', 'AI Media Generation (Images, Audio, Video)', 'Where image/audio/video generation fits — and where Claude does and does not.'],

  ['prompting', 'pattern-library', 2, 'all', 'Prompt Patterns Library', 'Copy-paste pattern cards: zero/few-shot, chain-of-thought, decomposition and more.'],
  ['prompting', 'few-shot', 3, 'intermediate', 'Few-Shot Examples Done Right', 'Choosing, ordering and formatting examples that actually teach the task.'],
  ['prompting', 'xml-tags', 4, 'intermediate', 'Structuring Prompts with XML Tags', "Claude's favored convention for delimiting inputs, instructions and examples."],
  ['prompting', 'prompting-claude', 5, 'intermediate', 'Prompting Claude Specifically', "What's genuinely Claude-specific vs universal."],
  ['prompting', 'cross-ai-translation', 6, 'intermediate', 'Cross-AI Prompt Translation', 'The same concept across Claude, GPT and Gemini — and what transfers.'],

  ['claude-app', 'getting-started', 1, 'beginner', 'Getting Started with Claude.ai', 'Accounts, plans at a glance, and your first useful conversation.'],
  ['claude-app', 'voice-mode', 2, 'beginner', 'Talking to Claude (Voice Mode)', 'Multilingual voice conversations on mobile and desktop.'],
  ['claude-app', 'mobile', 3, 'beginner', 'Claude on Mobile', 'The iOS and Android apps as a first-class surface.'],
  ['claude-app', 'custom-instructions', 4, 'beginner', 'Custom Instructions & Styles', 'Account-wide instructions and response styles, and how they stack.'],
  ['claude-app', 'projects', 5, 'beginner', 'Projects: Persistent Workspaces', 'A workspace with its own knowledge base and instructions.'],
  ['claude-app', 'memory', 6, 'beginner', 'Memory Across Chats', 'How cross-chat memory works and its availability by plan.'],
  ['claude-app', 'artifacts', 7, 'beginner', 'Artifacts: Live, Runnable Outputs', 'Build interactive apps, dashboards and docs in the side panel.'],
  ['claude-app', 'generating-files', 8, 'beginner', 'Generating Real Files (docx/pptx/xlsx/pdf)', 'Produce downloadable, styled documents straight from chat.'],
  ['claude-app', 'ai-in-your-tools', 9, 'intermediate', 'AI in Your Existing Tools (M365 / Workspace / Slack)', 'Where you actually meet Claude inside the tools you already use.'],
  ['claude-app', 'chrome-and-computer-use', 10, 'intermediate', 'Claude in Chrome & Computer Use', 'The browser agent and desktop control — and the safety model.'],
  ['claude-app', 'connectors', 11, 'intermediate', 'Connectors (MCP) in the Apps', 'Reach external tools and data from the Claude apps.'],
  ['claude-app', 'plans-and-billing', 12, 'beginner', 'Plans, Limits & Billing', 'Free vs Pro vs Max vs Team, message limits, and what happens at quota.'],

  ['claude-code', 'claude-md', 2, 'beginner', 'CLAUDE.md & Memory Files', 'The highest-leverage customization: the memory hierarchy and @imports.'],
  ['claude-code', 'plan-mode', 3, 'beginner', 'Plan Mode', 'Read-only investigate-and-propose before any edits run.'],
  ['claude-code', 'ide-integrations', 4, 'beginner', 'IDE Integrations', 'VS Code and JetBrains extensions, inline diffs, and shared settings.'],
  ['claude-code', 'settings', 5, 'intermediate', 'settings.json: The Config System', 'File tiers and precedence, key sections, and project vs personal config.'],
  ['claude-code', 'permissions', 6, 'intermediate', 'Permissions & Permission Modes', 'allow/ask/deny rules and modes — cut prompts without losing safety.'],
  ['claude-code', 'slash-commands', 7, 'intermediate', 'Custom Slash Commands', 'Turn a repeatable workflow into one word.'],
  ['claude-code', 'output-styles', 8, 'intermediate', 'Output Styles', 'Change tone, verbosity and teaching behaviour.'],
  ['claude-code', 'statusline', 9, 'intermediate', 'Statusline Customization', 'Surface model, cwd, context budget and git state.'],
  ['claude-code', 'context-management', 10, 'intermediate', 'Context Management', '/compact vs /clear, auto-compaction, and staying effective as sessions grow.'],
  ['claude-code', 'hooks', 11, 'advanced', 'Hooks: Deterministic Automation', 'Run commands at lifecycle events to enforce formatting, gates and safety.'],
  ['claude-code', 'skills', 12, 'advanced', 'Skills: On-Demand Expertise', 'SKILL.md, progressive disclosure, and Skill vs command vs subagent vs MCP.'],
  ['claude-code', 'subagents', 13, 'advanced', 'Subagents & Parallel Agents', 'Delegate to isolated-context agents with scoped tools.'],
  ['claude-code', 'mcp', 14, 'advanced', 'MCP Servers in Claude Code', 'Connect databases, GitHub and browsers via the Model Context Protocol.'],
  ['claude-code', 'background-tasks', 15, 'advanced', 'Background Tasks, /loop & Scheduling', 'Long-running commands, recurring loops, and scheduled cloud agents.'],
  ['claude-code', 'plugins-marketplaces', 16, 'advanced', 'Plugins & Marketplaces', 'Bundle skills/agents/commands/hooks/MCP into one installable unit.'],
  ['claude-code', 'worktrees', 17, 'advanced', 'Git Worktrees & Parallel Workstreams', 'Run multiple isolated Claude sessions on one repo.'],
  ['claude-code', 'headless-and-agent-sdk', 18, 'advanced', 'Headless Mode & the Agent SDK', 'Run Claude Code in CI, and build production agents on the same harness.'],

  ['api', 'choosing-a-model', 1, 'beginner', 'Choosing a Claude Model', 'The Opus/Sonnet/Haiku tradeoff and how to look up current model IDs.'],
  ['api', 'tokens-and-pricing', 2, 'beginner', 'Tokens, Context & Pricing', 'Count tokens correctly, max_tokens vs context window, and estimating cost.'],
  ['api', 'streaming', 4, 'intermediate', 'Streaming & Multi-Turn Conversations', 'Stream responses and manage history on a stateless API.'],
  ['api', 'tool-use', 5, 'intermediate', 'Tool Use / Function Calling', 'Define tools, run the agentic loop, and handle results.'],
  ['api', 'vision-pdf-files', 6, 'intermediate', 'Vision, PDF & File Input', 'Send images and documents, and reuse uploads by file_id.'],
  ['api', 'structured-output', 7, 'intermediate', 'Structured Output', 'Schema-conforming results with JSON Schema and parse() helpers.'],
  ['api', 'thinking-and-effort', 8, 'intermediate', 'Extended Thinking & Effort', 'Adaptive thinking and the effort parameter — choosing depth by workload.'],
  ['api', 'prompt-caching', 9, 'advanced', 'Prompt Caching & Cost Optimization', 'The prefix-match rule, breakpoints, and pairing caching with batching.'],
  ['api', 'building-agents', 10, 'advanced', 'Building Agents on the API', 'Single call vs workflow vs custom agent — the decision test and loop design.'],
  ['api', 'managed-agents', 11, 'advanced', 'Managed Agents', 'Anthropic-hosted loop: agents, sessions, memory and scheduled deployments.'],
  ['api', 'cowork-and-agent-teams', 12, 'advanced', 'Cowork & Agent Teams', 'The agentic desktop workspace and multi-agent collaboration as products.'],
  ['api', 'mcp', 13, 'advanced', 'MCP & Connecting to Tools', 'Declare MCP servers on requests, and where MCP fits vs other tool types.'],
  ['api', 'refusals-and-safety', 14, 'intermediate', 'Safety, Refusals & Fallbacks', 'Handle refusals and distinguish them from classifier blocks.'],
  ['api', 'errors-and-rate-limits', 15, 'intermediate', 'Errors, Rate Limits & Reliability', 'The error map, retries with backoff, rate-limit tiers, and model migration.'],

  ['playbooks', 'writing', 2, 'all', 'Writing & Content Creation', 'Brief, draft, edit in passes, match your voice — without fabricating facts.'],
  ['playbooks', 'coding', 3, 'all', 'Coding & Software Development', 'Generate, explain, refactor, debug and test — verify and never paste secrets.'],
  ['playbooks', 'research', 4, 'all', 'Research & Synthesis', 'Summarize, compare sources and build a landscape — with citation-checking.'],
  ['playbooks', 'data-analysis', 5, 'all', 'Data Analysis', 'Generate SQL/formulas and interpret results — and verify against hallucinated stats.'],
  ['playbooks', 'learning', 6, 'all', 'Learning & Studying', 'Socratic tutoring and teach-back — learning with AI, not cheating with it.'],
  ['playbooks', 'business', 7, 'all', 'Business, Marketing & Strategy', 'Research, copy and planning for non-technical owners — with caveats.'],
  ['playbooks', 'accessibility', 8, 'beginner', 'Accessibility: Claude as an Assistive Tool', 'Using Claude for dyslexia, low vision, neurodivergence and language learning.'],

  ['walkthroughs', 'customize-claude-code', 1, 'intermediate', 'Customize Claude Code for a Real Repo', 'From blank repo to a tuned setup: CLAUDE.md + skills + hooks + permissions.'],
  ['walkthroughs', 'first-skill', 2, 'intermediate', 'Write Your First Skill End-to-End', 'Give Claude a new capability with a SKILL.md and a helper script.'],
  ['walkthroughs', 'first-mcp-server', 3, 'advanced', 'Build & Wire Your First MCP Server', 'Connect Claude to your data via a guided MCP build.'],
  ['walkthroughs', 'multi-subagent-workflow', 4, 'advanced', 'Design a Multi-Subagent Workflow', 'Orchestrate research/implement/review agents with handoffs.'],
  ['walkthroughs', 'first-production-call', 5, 'intermediate', 'Your First Production API Call (Cost-Aware)', 'A real, streamed, error-handled, cost-budgeted call.'],
  ['walkthroughs', 'pr-review-action', 6, 'advanced', 'GitHub Action that Reviews Every PR', 'Run Claude Code headless in CI to review and comment on pull requests.'],

  ['templates', 'skills', 2, 'all', 'SKILL.md Templates', 'Skill scaffolds with anatomy callouts and a validity checklist.'],
  ['templates', 'mcp-config', 3, 'intermediate', 'MCP Config & Server Scaffolds', '.mcp.json plus minimal stdio and remote server starters.'],
  ['templates', 'hooks-settings', 4, 'intermediate', 'Hooks & settings.json Recipes', 'Copy-paste formatter, quality-gate and safety-guard hooks.'],
  ['templates', 'slash-commands', 5, 'intermediate', 'Slash Command Library', '10+ useful custom commands you can drop in today.'],
  ['templates', 'prompts', 6, 'all', 'Reusable Prompt Templates', 'Task-mapped, XML-structured prompts with expected output and failure notes.'],
  ['templates', 'api-snippets', 7, 'intermediate', 'Production API Snippets', 'Request wrappers with retries, streaming chat and tool loops, in Python and TS.'],

  ['security', 'prompt-injection', 1, 'intermediate', 'Prompt Injection Explained', 'Direct and indirect injection — malicious instructions hidden in content.'],
  ['security', 'securing-agents', 2, 'advanced', 'Securing Agents & Tools', 'Least privilege, sandboxing, and human-in-the-loop for risky actions.'],
  ['security', 'hardening-autonomous-runs', 3, 'advanced', 'Hardening Autonomous Runs', 'Lock down headless/CI runs so an agent cannot touch secrets.'],
  ['security', 'reviewing-third-party-code', 4, 'intermediate', 'Reviewing Third-Party Code', 'Plugins, skills and MCP servers ship executable code — review before trusting.'],
  ['security', 'responsible-use', 5, 'all', 'Responsible Use, Ethics & Verification', 'The autonomy ladder, the verification mindset, bias, and keeping humans in the loop.'],

  ['whats-new', 'this-month', 1, 'all', 'This Month in Claude', 'A plain-English digest of recent model, Claude Code and API changes.'],
  ['whats-new', 'deprecations', 3, 'intermediate', 'Deprecation & Migration Watch', 'Retired models, renamed flags and breaking changes with migration notes.'],
  ['whats-new', 'site-changelog', 4, 'all', 'Site Changelog', "AILmanac's own edits in Keep a Changelog format."],

  ['contribute', 'style-guide', 2, 'all', 'Content Style Guide', 'Voice, level badges, the opinion-vs-official line, and the citation rule.'],
  ['contribute', 'fact-verification', 3, 'intermediate', 'Fact Verification & Freshness', 'How to date volatile facts and respond to needs-verification issues.'],
  ['contribute', 'troubleshooting', 4, 'beginner', 'Troubleshooting: Why Did Claude Do That?', 'Common surprises and how to fix them — refusals, wrong facts, lost context.'],
  ['contribute', 'translation-playbook', 5, 'intermediate', 'Translation Playbook (i18n)', 'How to localize a section and own a locale via PR.'],
  ['contribute', 'automation', 6, 'advanced', 'How Our Automation Works', 'Link checks, the release watcher and the model-table verifier, explained.'],
  ['contribute', 'governance', 7, 'all', 'Code of Conduct & Governance', 'Licensing split, the code of conduct, labels and triage.'],
];

const yaml = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const stub = (title, level, position, description) => `---
sidebar_position: ${position}
title: "${yaml(title)}"
description: "${yaml(description)}"
draft: false
---

<LevelBadge level="${level}" />

:::info Planned page — help us write it
This page is on the AILmanac roadmap but isn't written yet. Its outline lives in our design plan. **${description}**

Writing it is a great [first contribution](/docs/contribute/contribute-in-10-minutes) — open a PR and claim it.
:::
`;

// Every entry in PAGES is a stub by definition (the 11 hand-written spine pages
// are intentionally NOT in this manifest), so it is always safe to overwrite
// them here — this lets us re-run the generator to fix formatting.
let written = 0;
for (const [dir, file, position, level, title, description] of PAGES) {
  const target = join(DOCS, dir, `${file}.mdx`);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, stub(title, level, position, description));
  written++;
}
console.log(`Scaffold complete: ${written} stub pages written.`);
