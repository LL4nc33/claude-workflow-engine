# WE (Workflow Engine) Rebranding & Consolidation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform CWE plugin-dist into "WE" - a unified, English-only workflow engine that combines CWE's spec-driven workflows with superpowers' development skills.

**Architecture:**
- Rename plugin from `cwe` to `we`
- Adapt all 14 superpowers skills into WE (MIT license allows this)
- Translate all existing content to English
- Implement hybrid standards (base in plugin, project-specific via `/we:init`)

**Tech Stack:** Markdown (skills, commands, agents), Shell (hooks), JSON (plugin.json)

---

## Overview

### Current State
- **Plugin name:** `cwe`
- **Skills:** 17 (German, workflow-focused)
- **Commands:** 25 (German)
- **Agents:** 9 (German)
- **Language:** Mixed German/English

### Target State
- **Plugin name:** `we`
- **Skills:** ~30 (17 CWE + 14 superpowers adapted, deduplicated)
- **Commands:** ~27 (25 existing + init + health)
- **Agents:** 9 (English)
- **Language:** English only

### Skill Mapping (Superpowers → WE)

| Superpowers Skill | WE Adaptation | Notes |
|-------------------|---------------|-------|
| using-superpowers | using-we | Entry point, skill discovery |
| writing-plans | planning/writing | Merge with existing `planning` skill |
| executing-plans | planning/executing | New |
| brainstorming | ideation | New |
| test-driven-development | quality/tdd | New |
| systematic-debugging | quality/debugging | New |
| requesting-code-review | quality/review-request | New |
| receiving-code-review | quality/review-response | New |
| verification-before-completion | quality/verification | New |
| subagent-driven-development | orchestration/subagents | Relates to existing orchestrate-tasks |
| dispatching-parallel-agents | orchestration/parallel | New |
| using-git-worktrees | git/worktrees | New |
| finishing-a-development-branch | git/finish-branch | New |
| writing-skills | meta/writing-skills | New |

---

### Task 1: Rename plugin to "we"

**Files:**
- Modify: `plugin-dist/.claude-plugin/plugin.json`
- Modify: `plugin-dist/README.md`

**Step 1: Update plugin.json**

Change `"name": "cwe"` to `"name": "we"`.

Update description to English:
```json
{
  "name": "we",
  "version": "0.4.0",
  "description": "Workflow Engine - Unified AI development system with spec-driven workflows, 9 specialized agents, and integrated development skills",
  ...
}
```

**Step 2: Update README.md**

- Change all `/cwe:*` references to `/we:*`
- Update title to "WE - Workflow Engine"
- Translate German sections to English

**Step 3: Commit**

```bash
git add plugin-dist/.claude-plugin/plugin.json plugin-dist/README.md
git commit -m "feat(we): Rename plugin from cwe to we"
```

---

### Task 2: Create using-we entry skill

**Files:**
- Create: `plugin-dist/skills/using-we/SKILL.md`

**Step 1: Create skill directory**

```bash
mkdir -p plugin-dist/skills/using-we
```

**Step 2: Create SKILL.md**

Adapt from superpowers' `using-superpowers` but for WE context:

```markdown
---
name: using-we
description: Use when starting any conversation - establishes how to find and use WE skills
---

# Using WE (Workflow Engine)

## The Rule

**Check for relevant skills BEFORE any response or action.**

## Available Skill Categories

### Workflow Skills
- `/we:plan-product` - Define product vision
- `/we:shape-spec` - Gather requirements
- `/we:write-spec` - Create technical spec
- `/we:create-tasks` - Break into tasks
- `/we:orchestrate-tasks` - Delegate to agents

### Planning Skills
- `we:planning/writing` - Write implementation plans
- `we:planning/executing` - Execute plans task-by-task

### Quality Skills
- `we:quality/tdd` - Test-driven development
- `we:quality/debugging` - Systematic debugging
- `we:quality/review-request` - Request code review
- `we:quality/verification` - Verify before completion

### Ideation Skills
- `we:ideation` - Brainstorming and exploration

## Agents

9 specialized agents available via Task tool:
- architect, builder, devops, explainer, guide
- innovator, quality, researcher, security

## Quick Start

1. New project? → `/we:init`
2. Have idea? → `/we:quick` (fast 3-step)
3. Complex feature? → `/we:smart-workflow` (guided 5-phase)
```

**Step 3: Commit**

```bash
git add plugin-dist/skills/using-we/
git commit -m "feat(we): Add using-we entry skill"
```

---

### Task 3: Adapt planning skills from superpowers

**Files:**
- Modify: `plugin-dist/skills/planning/SKILL.md` (merge with writing-plans)
- Create: `plugin-dist/skills/planning-execution/SKILL.md` (from executing-plans)

**Step 1: Read current planning skill**

Review existing `plugin-dist/skills/planning/SKILL.md` content.

**Step 2: Merge with writing-plans**

Combine WE's planning triggers with superpowers' plan writing methodology.
Keep WE's EnterPlanMode integration.
Add superpowers' bite-sized task structure.

**Step 3: Create planning-execution skill**

Adapt `executing-plans` to work with WE context:
- Reference WE agents instead of generic subagents
- Use `/we:*` commands in examples
- Keep the batch execution + checkpoint pattern

**Step 4: Commit**

```bash
git add plugin-dist/skills/planning/ plugin-dist/skills/planning-execution/
git commit -m "feat(we): Adapt planning skills from superpowers"
```

---

### Task 4: Add ideation skill (from brainstorming)

**Files:**
- Create: `plugin-dist/skills/ideation/SKILL.md`

**Step 1: Create skill**

Adapt superpowers' `brainstorming` skill:
- Rename to `ideation` (clearer purpose)
- Add WE-specific context (reference agents, workflow phases)
- Keep the exploration-before-implementation principle

**Step 2: Commit**

```bash
git add plugin-dist/skills/ideation/
git commit -m "feat(we): Add ideation skill (adapted from brainstorming)"
```

---

### Task 5: Add quality skills (TDD, debugging, reviews, verification)

**Files:**
- Create: `plugin-dist/skills/tdd/SKILL.md`
- Create: `plugin-dist/skills/debugging/SKILL.md`
- Create: `plugin-dist/skills/code-review/SKILL.md`
- Create: `plugin-dist/skills/verification/SKILL.md`

**Step 1: Create TDD skill**

Adapt `test-driven-development` - keep the red-green-refactor discipline.

**Step 2: Create debugging skill**

Adapt `systematic-debugging` - keep hypothesis-driven approach.

**Step 3: Create code-review skill**

Merge `requesting-code-review` and `receiving-code-review` into one skill with two modes.

**Step 4: Create verification skill**

Adapt `verification-before-completion` - keep the "evidence before assertions" principle.

**Step 5: Commit**

```bash
git add plugin-dist/skills/tdd/ plugin-dist/skills/debugging/ plugin-dist/skills/code-review/ plugin-dist/skills/verification/
git commit -m "feat(we): Add quality skills (tdd, debugging, review, verification)"
```

---

### Task 6: Add orchestration skills (subagents, parallel)

**Files:**
- Create: `plugin-dist/skills/subagent-development/SKILL.md`
- Create: `plugin-dist/skills/parallel-agents/SKILL.md`

**Step 1: Create subagent-development skill**

Adapt `subagent-driven-development`:
- Reference WE's 9 agents
- Integrate with `/we:orchestrate-tasks`

**Step 2: Create parallel-agents skill**

Adapt `dispatching-parallel-agents` for WE context.

**Step 3: Commit**

```bash
git add plugin-dist/skills/subagent-development/ plugin-dist/skills/parallel-agents/
git commit -m "feat(we): Add orchestration skills"
```

---

### Task 7: Add git skills (worktrees, finish-branch)

**Files:**
- Create: `plugin-dist/skills/git-worktrees/SKILL.md`
- Create: `plugin-dist/skills/finish-branch/SKILL.md`

**Step 1: Adapt git skills**

Keep the isolation and safety principles from superpowers.

**Step 2: Commit**

```bash
git add plugin-dist/skills/git-worktrees/ plugin-dist/skills/finish-branch/
git commit -m "feat(we): Add git workflow skills"
```

---

### Task 8: Add meta skill (writing-skills)

**Files:**
- Create: `plugin-dist/skills/writing-skills/SKILL.md`

**Step 1: Adapt writing-skills**

For users who want to extend WE with their own skills.

**Step 2: Commit**

```bash
git add plugin-dist/skills/writing-skills/
git commit -m "feat(we): Add meta skill for writing custom skills"
```

---

### Task 9: Translate existing skills to English

**Files:**
- Modify: All 17 existing skills in `plugin-dist/skills/`

**Step 1: Translate each skill**

For each skill:
1. Read current German content
2. Translate to English
3. Keep technical terms consistent
4. Update any `/cwe:*` to `/we:*`

Skills to translate:
- agent-standards, api-standards, auto-delegation, cwe-principles → we-principles
- database-standards, devops-standards, frontend-standards, global-standards
- hook-patterns, mcp-usage, nano-learning, planning (already updated in Task 3)
- plugin-config, quality-gates, testing-standards, visual-clone, web-access

**Step 2: Commit**

```bash
git add plugin-dist/skills/
git commit -m "feat(we): Translate all skills to English"
```

---

### Task 10: Translate commands to English

**Files:**
- Modify: All 25 commands in `plugin-dist/commands/`

**Step 1: Translate each command**

For each command:
1. Update YAML frontmatter (description in English)
2. Translate command content
3. Update `/cwe:*` to `/we:*`

**Step 2: Commit**

```bash
git add plugin-dist/commands/
git commit -m "feat(we): Translate all commands to English"
```

---

### Task 11: Translate agents to English

**Files:**
- Modify: All 9 agents in `plugin-dist/agents/`

**Step 1: Translate each agent**

For each agent:
1. Update YAML frontmatter
2. Translate system prompt
3. Keep technical precision

**Step 2: Commit**

```bash
git add plugin-dist/agents/
git commit -m "feat(we): Translate all agents to English"
```

---

### Task 12: Update hooks to English

**Files:**
- Modify: `plugin-dist/hooks/scripts/session-start.sh`
- Modify: `plugin-dist/hooks/scripts/common.sh`
- Modify: Other hook scripts as needed

**Step 1: Translate hook messages**

Change German messages to English:
- "FIRST-RUN: Neues Projekt erkannt" → "FIRST-RUN: New project detected"
- "Standards-Index nicht gefunden" → "Standards index not found"
- etc.

**Step 2: Update version string**

Change "Workflow Engine v0.2.9" to "WE v0.4.0"

**Step 3: Commit**

```bash
git add plugin-dist/hooks/
git commit -m "feat(we): Translate hook messages to English"
```

---

### Task 13: Create /we:init command

**Files:**
- Create: `plugin-dist/commands/init.md`

**Step 1: Create init command**

```markdown
---
description: Initialize WE in current project - creates workflow structure and project-specific standards
allowed-tools: ["Write", "Bash", "Read"]
---

# /we:init

Initialize Workflow Engine in the current project.

## What it creates

```
workflow/
├── config.yml           # Project configuration
├── product/
│   └── mission.md       # Product vision (template)
├── specs/               # Feature specifications
└── standards/           # Project-specific standards (optional)
```

## Steps

1. Check if workflow/ already exists
2. If exists: Ask to overwrite or skip
3. Create directory structure
4. Copy base templates
5. Create initial config.yml
6. Show next steps

## Templates

### config.yml
```yaml
version: "1.0"
project:
  name: "$PROJECT_NAME"
  type: "default"  # or: node, python, rust
workflow:
  phases: ["plan", "spec", "tasks", "build", "review"]
  quality_gates: true
```

### mission.md
```markdown
# Product Mission

## Vision
[What problem does this solve?]

## Goals
- [ ] Goal 1
- [ ] Goal 2

## Non-Goals
- Not doing X
```

## Usage

```
/we:init
/we:init --type node
/we:init --type python
```
```

**Step 2: Commit**

```bash
git add plugin-dist/commands/init.md
git commit -m "feat(we): Add /we:init command for project setup"
```

---

### Task 14: Create /we:health command

**Files:**
- Create: `plugin-dist/commands/health.md`

**Step 1: Create health check command**

```markdown
---
description: Check WE installation health and project status
allowed-tools: ["Read", "Bash", "Glob"]
---

# /we:health

Run health checks on WE installation and current project.

## Checks

1. **Plugin Status**
   - Skills loaded
   - Agents available
   - Hooks active

2. **Project Status**
   - workflow/ exists
   - config.yml valid
   - Standards index fresh

3. **Recommendations**
   - Missing components
   - Suggested next steps
```

**Step 2: Commit**

```bash
git add plugin-dist/commands/health.md
git commit -m "feat(we): Add /we:health command"
```

---

### Task 15: Remove obsolete/duplicate skills

**Files:**
- Delete or merge duplicates

**Step 1: Identify duplicates**

After adding superpowers skills, check for overlaps:
- `planning` + `planning-execution` = complete planning workflow
- `auto-delegation` may overlap with orchestration skills
- `quality-gates` may overlap with `verification`

**Step 2: Consolidate**

Keep the best of both, remove redundancy.

**Step 3: Commit**

```bash
git add plugin-dist/skills/
git commit -m "refactor(we): Consolidate duplicate skills"
```

---

### Task 16: Update plugin.json with final counts

**Files:**
- Modify: `plugin-dist/.claude-plugin/plugin.json`

**Step 1: Update metadata**

```json
{
  "name": "we",
  "version": "0.4.0",
  "description": "Workflow Engine - Unified AI development with spec-driven workflows, planning skills, quality practices, and 9 specialized agents",
  "keywords": [
    "workflow",
    "planning",
    "tdd",
    "code-review",
    "agents",
    "spec-driven",
    "quality"
  ]
}
```

**Step 2: Commit**

```bash
git add plugin-dist/.claude-plugin/plugin.json
git commit -m "chore(we): Update plugin metadata for 0.4.0"
```

---

### Task 17: Final verification and tag

**Files:**
- None (verification only)

**Step 1: Count components**

```bash
echo "Skills: $(find plugin-dist/skills -name 'SKILL.md' | wc -l)"
echo "Commands: $(ls plugin-dist/commands/*.md | wc -l)"
echo "Agents: $(ls plugin-dist/agents/*.md | wc -l)"
```

**Step 2: Test plugin**

```bash
export HOME=/tmp/we-test-fresh
mkdir -p $HOME
cd /tmp/test-project && git init
claude --plugin-dir /path/to/plugin-dist
# Test: /we:init, /we:health, /we:help
```

**Step 3: Create release**

```bash
echo "0.4.0" > VERSION
git add VERSION
git commit -m "chore(release): WE 0.4.0 - Unified Workflow Engine"
git tag -a v0.4.0 -m "WE 0.4.0 - Unified Workflow Engine

- Renamed from CWE to WE
- All content in English
- Integrated superpowers skills (planning, TDD, debugging, reviews)
- Added /we:init and /we:health commands
- 30+ skills, 27 commands, 9 agents"
```

---

## Summary

| Task | Description | Commits |
|------|-------------|---------|
| 1 | Rename to "we" | 1 |
| 2 | Create using-we skill | 1 |
| 3 | Adapt planning skills | 1 |
| 4 | Add ideation skill | 1 |
| 5 | Add quality skills (4) | 1 |
| 6 | Add orchestration skills (2) | 1 |
| 7 | Add git skills (2) | 1 |
| 8 | Add meta skill | 1 |
| 9 | Translate skills | 1 |
| 10 | Translate commands | 1 |
| 11 | Translate agents | 1 |
| 12 | Translate hooks | 1 |
| 13 | Create /we:init | 1 |
| 14 | Create /we:health | 1 |
| 15 | Consolidate duplicates | 1 |
| 16 | Update metadata | 1 |
| 17 | Final verification + tag | 1 |

**Total: 17 Tasks, 17 Commits, Release v0.4.0**

---

## Post-Release

- Submit to Claude Marketplace
- Update main repo README pointing to WE
- Consider deprecating CLI in favor of plugin
