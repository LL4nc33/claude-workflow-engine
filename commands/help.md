---
description: Show CWE documentation and available commands
allowed-tools: ["Read"]
---

# CWE Help

Display comprehensive help for CWE and all installed plugins.

## Output

```markdown
# CWE - Claude Workflow Engine v0.4.1

Natural language orchestration for spec-driven development.

## Core Principles

1. **Agent-First** - All work delegated to specialized agents
2. **Auto-Delegation** - Intent recognition maps requests to agents/skills
3. **Spec-Driven** - Features: specs → tasks → implementation
4. **Context Isolation** - Agent work returns only summaries
5. **Plugin Integration** - Agents leverage installed plugin skills

## CWE Commands

| Command | Purpose |
|---------|---------|
| `/cwe:init` | Initialize project + install missing plugins |
| `/cwe:start` | Guided workflow (phase detection) |
| `/cwe:help` | This help |
| `/cwe:ask` | Questions, discussions (READ-ONLY) |
| `/cwe:builder` | Implementation, fixes |
| `/cwe:architect` | Design, ADRs, spec shaping |
| `/cwe:devops` | CI/CD, Docker, releases |
| `/cwe:security` | Audits, OWASP |
| `/cwe:researcher` | Docs, analysis |
| `/cwe:explainer` | Explanations |
| `/cwe:quality` | Tests, coverage |
| `/cwe:innovator` | Brainstorming, idea backlog (4 modes) |
| `/cwe:guide` | Process improvement, standards discovery |

## Auto-Delegation

Just say what you need:

| You Say | Routes To |
|---------|-----------|
| "fix the bug" | builder + systematic-debugging |
| "build a UI component" | builder + frontend-design |
| "explain this code" | explainer + serena |
| "what if we..." | innovator + brainstorming |
| "review my changes" | quality + code-reviewer |
| "plan the refactoring" | architect + writing-plans |
| "simplify this function" | code-simplifier |
| "create a new feature" | /feature-dev |

**Override:** Say "manual" to disable.

## Standards System

Standards loaded automatically via `.claude/rules/` with `paths` frontmatter.
7 domains: global, api, frontend, database, devops, testing, agent.

- `/cwe:guide discover` — auto-discover patterns → generate rules
- `/cwe:guide index` — regenerate `_index.yml` with keyword detection

## Idea Capture

Ideas auto-captured per-project via hooks:
- Keywords: idea, what if, could we, alternative, improvement
- Stored: `~/.claude/cwe/ideas/<project-slug>.jsonl`
- Review: `/cwe:innovator` (default | all | review | develop)

## Memory System

Hub-and-Spoke: MEMORY.md as index, detail files on-demand.
- `memory/ideas.md` — curated idea backlog
- `memory/sessions.md` — session continuity log
- `memory/decisions.md` — project ADRs
- `memory/patterns.md` — recognized work patterns

## Workflow Phases

1. **Plan** - `workflow/product/mission.md`
2. **Spec** - `workflow/specs/<feature>/`
3. **Tasks** - Break into tasks
4. **Build** - Implement with agents
5. **Review** - Quality verification

## Quick Start

1. `/cwe:init` - Set up project
2. Edit `workflow/product/mission.md`
3. `/cwe:start` - Begin guided workflow
```
