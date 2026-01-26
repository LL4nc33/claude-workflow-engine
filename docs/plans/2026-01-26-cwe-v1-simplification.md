# CWE v0.3.1 Simplification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify CWE plugin-dist to 3 commands, integrate with superpowers, translate to English.

**Architecture:**
- CWE focuses on spec-driven workflows + agents
- Superpowers handles development skills (TDD, debugging, reviews)
- Deep integration: Agents reference superpowers skills in their prompts

**Tech Stack:** Markdown, Shell, JSON

---

## Summary of Decisions

| Aspect | Decision |
|--------|----------|
| Commands | 3: init, start, help |
| Agents | 9, with superpowers references |
| Skills | Standards embedded in plugin |
| Hooks | 2: SessionStart, Stop |
| NaNo | Removed (separate project: homunculus) |
| Language | English only |
| Init output | Full structure + README per folder |

---

### Task 1: Clean up plugin-dist - remove NaNo and old commands

**Files:**
- Delete: `plugin-dist/commands/nano-*.md` (7 files)
- Delete: `plugin-dist/commands/plan-product.md`
- Delete: `plugin-dist/commands/shape-spec.md`
- Delete: `plugin-dist/commands/write-spec.md`
- Delete: `plugin-dist/commands/create-tasks.md`
- Delete: `plugin-dist/commands/orchestrate-tasks.md`
- Delete: `plugin-dist/commands/quick.md`
- Delete: `plugin-dist/commands/smart-workflow.md`
- Delete: `plugin-dist/commands/help.md` (will recreate)
- Delete: `plugin-dist/commands/devlog.md`
- Delete: `plugin-dist/commands/release.md`
- Delete: `plugin-dist/commands/undo.md`
- Delete: `plugin-dist/commands/review-candidates.md`
- Delete: `plugin-dist/commands/learning-report.md`
- Delete: `plugin-dist/commands/clone-setup.md`
- Delete: `plugin-dist/commands/web-setup.md`
- Delete: `plugin-dist/commands/visual-clone.md`
- Delete: `plugin-dist/commands/discover-standards.md`
- Delete: `plugin-dist/commands/index-standards.md`
- Delete: `plugin-dist/commands/inject-standards.md`
- Delete: `plugin-dist/skills/nano-learning/`
- Delete: `plugin-dist/skills/visual-clone/`
- Delete: `plugin-dist/skills/web-access/`
- Delete: `plugin-dist/skills/hook-patterns/`
- Delete: `plugin-dist/skills/plugin-config/`

**Step 1: Remove all commands except what we'll recreate**

```bash
rm -rf plugin-dist/commands/*
```

**Step 2: Remove NaNo and utility skills**

```bash
rm -rf plugin-dist/skills/nano-learning
rm -rf plugin-dist/skills/visual-clone
rm -rf plugin-dist/skills/web-access
rm -rf plugin-dist/skills/hook-patterns
rm -rf plugin-dist/skills/plugin-config
```

**Step 3: Remove NaNo hook scripts**

```bash
rm plugin-dist/hooks/scripts/nano-observer.sh
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(cwe): Remove NaNo, utility commands, prepare for v0.3.1 simplification"
```

---

### Task 2: Create /cwe:init command

**Files:**
- Create: `plugin-dist/commands/init.md`

**Step 1: Create init command**

```markdown
---
description: Initialize CWE in current project - creates workflow structure with documentation
allowed-tools: ["Write", "Bash", "Read", "Glob"]
---

# Initialize CWE Project

Create the workflow structure for spec-driven development.

## Check existing setup

First, check if workflow/ already exists:
- If exists: Ask user if they want to reinitialize
- If not: Proceed with creation

## Create structure

Create the following structure:

```
workflow/
├── README.md              # Overview of workflow system
├── config.yml             # Project configuration
├── product/
│   ├── README.md          # What goes here
│   └── mission.md         # Product vision template
├── specs/
│   └── README.md          # How to write specs
└── standards/
    └── README.md          # Project-specific standards (optional)
```

## File contents

### workflow/README.md
```markdown
# Workflow

This directory contains your project's workflow artifacts.

## Structure

- `config.yml` - Project configuration
- `product/` - Product vision, goals, roadmap
- `specs/` - Feature specifications
- `standards/` - Project-specific coding standards (optional)

## Quick Start

Run `/cwe:start` to begin guided development.

## Learn More

Run `/cwe:help` for full documentation.
```

### workflow/config.yml
```yaml
# CWE Project Configuration
version: "1.0"

project:
  name: "{{PROJECT_NAME}}"

workflow:
  phases:
    - plan      # Define product vision
    - spec      # Write feature specifications
    - tasks     # Break into implementable tasks
    - build     # Implement with agents
    - review    # Quality gates and verification
```

### workflow/product/README.md
```markdown
# Product

Define your product's vision, goals, and constraints here.

## Files

- `mission.md` - Core vision and goals (required)
- `roadmap.md` - Feature roadmap (optional)
- `constraints.md` - Technical/business constraints (optional)
```

### workflow/product/mission.md
```markdown
# Product Mission

## Vision

[What problem does this product solve? Who is it for?]

## Goals

- [ ] Primary goal
- [ ] Secondary goal

## Non-Goals

- What this product will NOT do

## Success Metrics

- How will you measure success?
```

### workflow/specs/README.md
```markdown
# Specifications

Feature specifications live here. Each feature gets its own folder.

## Structure

```
specs/
├── feature-name/
│   ├── spec.md       # Technical specification
│   ├── tasks.md      # Implementation tasks
│   └── progress.md   # Progress tracking
```

## Creating a Spec

Run `/cwe:start` and follow the guided workflow.
```

### workflow/standards/README.md
```markdown
# Project Standards

Add project-specific coding standards here.

CWE includes built-in standards for common patterns. Add files here only for project-specific conventions.

## Built-in Standards (via Skills)

- API design patterns
- Database conventions
- Testing practices
- Frontend components
- Agent conventions

## Adding Custom Standards

Create `your-standard.md` with clear rules and examples.
```

## After creation

Show success message:
```
✓ CWE initialized successfully!

Next steps:
1. Edit workflow/product/mission.md with your product vision
2. Run /cwe:start to begin guided development

Tip: Install 'superpowers' plugin for TDD, debugging, and code review skills.
```
```

**Step 2: Commit**

```bash
git add plugin-dist/commands/init.md
git commit -m "feat(cwe): Add /cwe:init command"
```

---

### Task 3: Create /cwe:start command

**Files:**
- Create: `plugin-dist/commands/start.md`

**Step 1: Create start command**

```markdown
---
description: Guided workflow - detects current phase and shows next steps
allowed-tools: ["Read", "Glob", "AskUserQuestion", "Task"]
---

# CWE Start - Guided Workflow

Detect where the user is in their workflow and guide them to the next step.

## Phase Detection

Check the following in order:

### 1. No workflow/ directory
→ "Project not initialized. Run `/cwe:init` first."

### 2. No mission.md or empty mission.md
→ Phase: **Plan**
→ Guide: "Let's define your product vision."
→ Help user fill out workflow/product/mission.md

### 3. No specs/ folders (or all empty)
→ Phase: **Spec**
→ Guide: "Ready to write your first feature spec?"
→ Ask: "What feature do you want to build?"
→ Create spec folder and guide through spec.md creation

### 4. Spec exists but no tasks.md
→ Phase: **Tasks**
→ Guide: "Let's break this spec into tasks."
→ Read spec.md, create tasks.md with implementation steps

### 5. Tasks exist but not all completed
→ Phase: **Build**
→ Guide: "Ready to implement. Which task should we start?"
→ Show task list, delegate to appropriate agent

### 6. All tasks completed
→ Phase: **Review**
→ Guide: "Implementation complete. Let's review."
→ Suggest code review, verification

## Agent Delegation

When in Build phase, delegate to the right agent:
- Architecture decisions → architect
- Implementation → builder
- Infrastructure/Deploy → devops
- Security concerns → security
- Documentation → researcher
- Questions/Learning → explainer

## Superpowers Integration

Remind user of relevant superpowers skills:
- Planning → "Consider using superpowers:writing-plans for detailed planning"
- Building → "The builder agent uses TDD via superpowers:test-driven-development"
- Debugging → "For bugs, try superpowers:systematic-debugging"
- Review → "Use superpowers:verification-before-completion before marking done"
```

**Step 2: Commit**

```bash
git add plugin-dist/commands/start.md
git commit -m "feat(cwe): Add /cwe:start command with phase detection"
```

---

### Task 4: Create /cwe:help command

**Files:**
- Create: `plugin-dist/commands/help.md`

**Step 1: Create help command**

```markdown
---
description: Show CWE documentation and available commands
allowed-tools: ["Read"]
---

# CWE Help

Display help based on context.

## Output

```markdown
# CWE - Claude Workflow Engine

Spec-driven development with specialized agents.

## Commands

| Command | Description |
|---------|-------------|
| `/cwe:init` | Initialize project with workflow structure |
| `/cwe:start` | Guided workflow - detects phase, shows next steps |
| `/cwe:help` | This help message |

## Workflow Phases

1. **Plan** - Define product vision in `workflow/product/mission.md`
2. **Spec** - Write feature specs in `workflow/specs/<feature>/spec.md`
3. **Tasks** - Break specs into tasks in `tasks.md`
4. **Build** - Implement with specialized agents
5. **Review** - Verify with quality gates

## Agents

| Agent | Use for |
|-------|---------|
| architect | System design, API design, tech decisions |
| builder | Implementation, bug fixes, features |
| devops | CI/CD, Docker, infrastructure |
| quality | Testing, coverage, quality metrics |
| security | Security audits, vulnerabilities |
| researcher | Documentation, analysis |
| explainer | Learning, explanations |
| innovator | Brainstorming, alternatives |
| guide | Process improvement |

## Superpowers Integration

CWE works best with the `superpowers` plugin installed:

| Skill | Use for |
|-------|---------|
| superpowers:writing-plans | Detailed implementation plans |
| superpowers:executing-plans | Execute plans step-by-step |
| superpowers:test-driven-development | TDD workflow |
| superpowers:systematic-debugging | Bug hunting |
| superpowers:verification-before-completion | Pre-commit checks |
| superpowers:brainstorming | Ideation and exploration |

## Quick Start

1. `/cwe:init` - Set up project
2. Edit `workflow/product/mission.md`
3. `/cwe:start` - Begin guided workflow
```
```

**Step 2: Commit**

```bash
git add plugin-dist/commands/help.md
git commit -m "feat(cwe): Add /cwe:help command"
```

---

### Task 5: Update agents with superpowers references

**Files:**
- Modify: `plugin-dist/agents/builder.md`
- Modify: `plugin-dist/agents/architect.md`
- Modify: `plugin-dist/agents/quality.md`
- Modify: `plugin-dist/agents/researcher.md`
- Modify: `plugin-dist/agents/security.md`
- Modify: `plugin-dist/agents/devops.md`
- Modify: `plugin-dist/agents/explainer.md`
- Modify: `plugin-dist/agents/innovator.md`
- Modify: `plugin-dist/agents/guide.md`

**Step 1: Add superpowers references to each agent**

Add to each agent's system prompt a section like:

**builder.md:**
```markdown
## Superpowers Integration

When implementing:
- Use `superpowers:test-driven-development` for TDD workflow
- Use `superpowers:systematic-debugging` for bug investigation
- Use `superpowers:verification-before-completion` before completing tasks
```

**architect.md:**
```markdown
## Superpowers Integration

When planning:
- Use `superpowers:writing-plans` for detailed implementation plans
- Use `superpowers:brainstorming` for exploring alternatives
```

**quality.md:**
```markdown
## Superpowers Integration

When reviewing:
- Use `superpowers:requesting-code-review` format for reviews
- Use `superpowers:verification-before-completion` for final checks
```

**researcher.md:**
```markdown
## Superpowers Integration

When analyzing:
- Use `superpowers:brainstorming` for exploration
```

**Step 2: Translate all agents to English**

For each agent, translate German content to English.

**Step 3: Commit**

```bash
git add plugin-dist/agents/
git commit -m "feat(cwe): Add superpowers references to agents, translate to English"
```

---

### Task 6: Translate remaining skills to English

**Files:**
- Modify: All skills in `plugin-dist/skills/`

**Step 1: Translate each skill**

Skills to translate:
- agent-standards
- api-standards
- auto-delegation
- cwe-principles
- database-standards
- devops-standards
- frontend-standards
- global-standards
- mcp-usage
- planning
- quality-gates
- testing-standards

**Step 2: Rename cwe-principles to we-principles**

Actually keep as `cwe-principles` since plugin is still `cwe`.

**Step 3: Commit**

```bash
git add plugin-dist/skills/
git commit -m "feat(cwe): Translate all skills to English"
```

---

### Task 7: Simplify hooks to SessionStart + Stop

**Files:**
- Modify: `plugin-dist/hooks/hooks.json`
- Modify: `plugin-dist/hooks/scripts/session-start.sh`
- Modify: `plugin-dist/hooks/scripts/session-stop.sh`
- Delete: `plugin-dist/hooks/scripts/pre-write-validate.sh`
- Delete: `plugin-dist/hooks/scripts/pre-delegation-context.sh`
- Delete: `plugin-dist/hooks/scripts/post-write-log.sh`
- Delete: `plugin-dist/hooks/scripts/gate-check.sh`
- Delete: `plugin-dist/hooks/scripts/engine-sync.sh`

**Step 1: Update hooks.json**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-stop.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Step 2: Simplify session-start.sh**

Output English status message:
```bash
# Simple status check
if [ -d "workflow" ]; then
  echo '{"systemMessage": "CWE ready. Run /cwe:start to continue."}'
else
  echo '{"systemMessage": "CWE: No project initialized. Run /cwe:init to start."}'
fi
```

**Step 3: Create session-stop.sh**

```bash
#!/usr/bin/env bash
# Session end - show summary

echo '{"systemMessage": "Session complete. Run /cwe:start next time to continue where you left off."}'
```

**Step 4: Remove unused hook scripts**

```bash
rm plugin-dist/hooks/scripts/pre-write-validate.sh
rm plugin-dist/hooks/scripts/pre-delegation-context.sh
rm plugin-dist/hooks/scripts/post-write-log.sh
rm plugin-dist/hooks/scripts/gate-check.sh
rm plugin-dist/hooks/scripts/engine-sync.sh
rm plugin-dist/hooks/scripts/nano-observer.sh
```

**Step 5: Commit**

```bash
git add plugin-dist/hooks/
git commit -m "refactor(cwe): Simplify hooks to SessionStart + Stop only"
```

---

### Task 8: Update plugin.json for v0.3.1

**Files:**
- Modify: `plugin-dist/.claude-plugin/plugin.json`

**Step 1: Update metadata**

```json
{
  "name": "cwe",
  "version": "0.3.1",
  "description": "Claude Workflow Engine - Spec-driven development with 9 specialized agents. Works great with superpowers plugin.",
  "author": {
    "name": "LL4nc33",
    "url": "https://github.com/LL4nc33"
  },
  "homepage": "https://github.com/LL4nc33/oidanice-agents",
  "repository": "https://github.com/LL4nc33/oidanice-agents",
  "license": "MIT",
  "keywords": [
    "workflow",
    "agents",
    "spec-driven",
    "development",
    "orchestration"
  ]
}
```

**Step 2: Commit**

```bash
git add plugin-dist/.claude-plugin/plugin.json
git commit -m "chore(cwe): Update plugin.json for v0.3.1"
```

---

### Task 9: Update README.md

**Files:**
- Modify: `plugin-dist/README.md`

**Step 1: Rewrite README for v0.3.1**

```markdown
# CWE - Claude Workflow Engine

Spec-driven development with specialized agents.

## Installation

```bash
claude --plugin-dir /path/to/plugin-dist
# Or when published:
claude plugin install cwe
```

## Quick Start

```bash
/cwe:init     # Initialize project
/cwe:start    # Guided workflow
/cwe:help     # Documentation
```

## What is CWE?

CWE provides:
- **3 Commands** for guided spec-driven development
- **9 Specialized Agents** (architect, builder, devops, quality, security, researcher, explainer, innovator, guide)
- **Standards Skills** embedded for consistent code quality

## Workflow Phases

1. **Plan** - Define product vision
2. **Spec** - Write feature specifications
3. **Tasks** - Break into implementable tasks
4. **Build** - Implement with agents
5. **Review** - Quality verification

## Superpowers Integration

CWE works best with [superpowers](https://github.com/obra/superpowers) plugin:

```bash
claude plugin install superpowers
```

CWE agents automatically reference superpowers skills:
- builder → TDD, debugging
- architect → writing-plans
- quality → verification, code-review

## Fresh Install Test

```bash
export HOME=/tmp/fresh-cwe-test
mkdir -p $HOME
cd /path/to/test-project && git init
claude --plugin-dir /path/to/plugin-dist
```
```

**Step 2: Commit**

```bash
git add plugin-dist/README.md
git commit -m "docs(cwe): Update README for v0.3.1"
```

---

### Task 10: Final verification and release

**Files:**
- Modify: `VERSION`

**Step 1: Verify counts**

```bash
echo "Commands: $(ls plugin-dist/commands/*.md 2>/dev/null | wc -l)"  # Should be 3
echo "Agents: $(ls plugin-dist/agents/*.md 2>/dev/null | wc -l)"      # Should be 9
echo "Skills: $(find plugin-dist/skills -name 'SKILL.md' 2>/dev/null | wc -l)"
echo "Hook scripts: $(ls plugin-dist/hooks/scripts/*.sh 2>/dev/null | wc -l)"  # Should be 2-3
```

**Step 2: Test plugin**

```bash
export HOME=/tmp/cwe-v1-test
mkdir -p $HOME
mkdir /tmp/test-cwe-project && cd /tmp/test-cwe-project && git init
claude --plugin-dir /path/to/plugin-dist

# Test:
# /cwe:init
# /cwe:start
# /cwe:help
```

**Step 3: Create release**

```bash
echo "0.3.1" > VERSION
git add VERSION
git commit -m "chore(release): CWE v0.3.1"
git tag -a v0.3.1 -m "CWE v0.3.1 - Simplified Workflow Engine

- 3 Commands: init, start, help
- 9 Agents with superpowers integration
- English only
- Works with superpowers plugin for TDD, debugging, reviews"
```

---

## Summary

| Task | Description | Commits |
|------|-------------|---------|
| 1 | Remove NaNo, old commands | 1 |
| 2 | Create /cwe:init | 1 |
| 3 | Create /cwe:start | 1 |
| 4 | Create /cwe:help | 1 |
| 5 | Update agents with superpowers | 1 |
| 6 | Translate skills | 1 |
| 7 | Simplify hooks | 1 |
| 8 | Update plugin.json | 1 |
| 9 | Update README | 1 |
| 10 | Verify + release | 1 |

**Total: 10 Tasks, 10 Commits, Release v0.3.1**

---

## Version History Note

This release continues the 0.3.x series. The switch from CLI-based to plugin-based distribution is documented here:

- **0.2.9a** - Last CLI-focused version
- **0.3.0** - Plugin structure created (plugin-dist/)
- **0.3.1** - Simplified to 3 commands, superpowers integration, English only
