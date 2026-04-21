---
description: Show CWE documentation and available commands
allowed-tools: ["Bash", "Read"]
---

# CWE Help

Display comprehensive help for CWE and all installed plugins. The version and command list are read dynamically from the plugin directory — never hardcode them.

## Step 1: Read Current Version

Run this bash snippet to extract the current plugin version from `plugin.json`:

```bash
VERSION=$(grep -oE '"version"[[:space:]]*:[[:space:]]*"[^"]+"' "${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json" | head -1 | sed -E 's/.*"([^"]+)"$/\1/')
echo "Code Workspace Engine v${VERSION:-?}"
```

Use `${VERSION:-?}` in the header below. If the version read fails, use `?` as a fallback.

## Step 2: Enumerate Commands Dynamically

List every command file from the plugin's `commands/` directory:

```bash
ls "${CLAUDE_PLUGIN_ROOT}"/commands/*.md 2>/dev/null | xargs -I{} basename {} .md | sort
```

Then, for each command name discovered, optionally read the `description:` field from its frontmatter to describe it:

```bash
for f in "${CLAUDE_PLUGIN_ROOT}"/commands/*.md; do
  name=$(basename "$f" .md)
  desc=$(grep -oE '^description:.*$' "$f" | head -1 | sed -E 's/^description:[[:space:]]*//')
  printf '%-20s %s\n' "/cwe:${name}" "${desc}"
done
```

Group the resulting commands by category based on their descriptions. Suggested categories:

- **Setup & Meta:** init, plugins, start, help
- **Agent Commands:** ask, builder, architect, devops, security, researcher, explainer, quality, innovator, guide
- **Media & Content:** image, video, faceswap, headswap, upscale, motion, pdf, transcript, screenshot
- **Research & Docs:** web-research, docs
- **Multi-Terminal:** autopilot, coordinate, check-handoff, handoff, qa-merge
- **Integration:** gitea

Any command not matching a suggested category should be grouped under **Other**. Do not omit any command discovered by the `ls` step.

## Step 3: Render Output

Render output using this template. Substitute `${VERSION}` with the value from Step 1, and populate the command tables from Step 2.

```markdown
# CWE - Code Workspace Engine v${VERSION}

Natural language orchestration for spec-driven development.

## 6 Core Principles

1. **Agent-First** - All work delegated to specialized agents
2. **Auto-Delegation** - Intent recognition maps requests to agents/skills
3. **Spec-Driven** - Features: specs → tasks → implementation
4. **Context Isolation** - Agent work returns only summaries
5. **Plugin Integration** - Agents leverage installed plugin skills
6. **Always Document** - Every change updates memory, CHANGELOG, and docs

## CWE Commands

(Populated dynamically from Step 2 — group by category, one table row per command.)

| Command | Purpose |
|---------|---------|
| `/cwe:<name>` | <description from frontmatter> |
| ... | ... |

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
| "build auth with tests" | delegator + builder + quality |

**Override:** Say "manual" to disable.

## Standards System

Standards loaded automatically via `.claude/rules/` with `paths` frontmatter.
8 domains: global, api, frontend, database, devops, testing, agent, documentation.

- `/cwe:guide discover` — auto-discover patterns → generate rules
- `/cwe:guide index` — regenerate `_index.yml` with keyword detection

## Safety Gate

Pre-commit scanning via PreToolUse hook:
- Scans for secrets, API keys, credentials, PII
- Validates .gitignore completeness
- Blocks dangerous commits with remediation guidance
- Triggers on: `git commit`, `git push`, `git add -A`

## Git Standards

Enforced via PreToolUse hooks:
- **Conventional Commits** — `type(scope): subject` format
- **Branch Naming** — `feature/`, `fix/`, `hotfix/`, `chore/`, `release/`
- Auto-generated release notes from commit history

## Idea Capture

Ideas auto-captured per-project via hooks:
- Keywords: idea, what if, could we, alternative, improvement
- Stored: `~/.claude/cwe/ideas/<project-slug>.jsonl`
- Review: `/cwe:innovator` (default | all | review | develop)

## Memory System

Daily Logs + MEMORY.md index, auto-injected at session start:
- `memory/MEMORY.md` — Curated index (max 200 lines, always loaded)
- `memory/YYYY-MM-DD.md` — Daily logs (today + yesterday injected)
- `memory/decisions.md` — Project ADRs
- `memory/patterns.md` — Recognized work patterns
- `memory/project-context.md` — Tech stack, priorities (auto-seeded)
- Memory via Serena (`write_memory`, `read_memory`, `list_memories`) when available

## Workflow Phases

1. **Plan** - `workflow/product/mission.md`
2. **Spec** - `workflow/specs/<feature>/` (Shape-Spec Interview)
3. **Tasks** - Break into implementable tasks
4. **Build** - Implement with agents (parallel wave execution)
5. **Review** - Quality gates + safety verification

## Quick Start

1. `/cwe:init` - Set up project
2. Edit `workflow/product/mission.md`
3. `/cwe:start` - Begin guided workflow
```

## Rules

- Never hardcode the version — always read it from `plugin.json`.
- Never hardcode the command list — always enumerate via `ls commands/*.md`.
- If a command's frontmatter has no `description`, display the command name only.
