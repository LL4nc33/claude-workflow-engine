# Plugin-Manifest für Marketplace (0.3.0) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a standalone plugin distribution in `plugin-dist/` with marketplace-compatible manifest structure.

**Architecture:** The `plugin-dist/` folder becomes a self-contained Claude Code plugin that can be installed via `claude plugin install`. It references the existing commands, agents, skills, and hooks from the main project but packages them for marketplace distribution.

**Tech Stack:** JSON (plugin.json), Markdown (commands, agents, skills), Shell (hooks)

---

## Context

**Current State:**
- `.claude-plugin/plugin.json` exists but references paths relative to repo root
- All components exist: 25 commands, 9 agents, 17 skills, 7 hooks
- `plugin-dist/README.md` with roadmap exists

**Target State:**
- `plugin-dist/` is a complete, installable plugin
- Can be tested with `claude --plugin-dir ./plugin-dist`
- Ready for marketplace submission later (0.3.7)

**Key Insight from Docs:**
- `.claude-plugin/` contains ONLY `plugin.json`
- All other dirs (commands/, agents/, skills/, hooks/) at plugin root
- Use `${CLAUDE_PLUGIN_ROOT}` in hooks for portable paths

---

### Task 1: Create plugin-dist directory structure

**Files:**
- Create: `plugin-dist/.claude-plugin/plugin.json`

**Step 1: Create .claude-plugin directory**

Run:
```bash
mkdir -p plugin-dist/.claude-plugin
```

**Step 2: Create marketplace-compatible plugin.json**

Create `plugin-dist/.claude-plugin/plugin.json`:

```json
{
  "name": "claude-workflow-engine",
  "version": "0.3.0",
  "description": "Multi-Agent Workflow System for spec-driven development: 9 specialized agents, smart-workflow, auto-delegation, TOON-optimized context, and quality gates",
  "author": {
    "name": "LL4nc33",
    "url": "https://github.com/LL4nc33"
  },
  "homepage": "https://github.com/LL4nc33/oidanice-agents",
  "repository": "https://github.com/LL4nc33/oidanice-agents",
  "license": "MIT",
  "keywords": [
    "workflow",
    "multi-agent",
    "standards",
    "orchestration",
    "spec-driven",
    "quality-gates",
    "auto-delegation"
  ]
}
```

**Step 3: Verify structure**

Run:
```bash
ls -la plugin-dist/.claude-plugin/
```
Expected: `plugin.json` exists

**Step 4: Commit**

```bash
git add plugin-dist/.claude-plugin/plugin.json
git commit -m "feat(plugin-dist): Create marketplace-compatible plugin.json (0.3.0)"
```

---

### Task 2: Copy commands to plugin-dist

**Files:**
- Create: `plugin-dist/commands/` (copy from `.claude/commands/workflow/`)

**Step 1: Create commands directory**

Run:
```bash
mkdir -p plugin-dist/commands
```

**Step 2: Copy all workflow commands**

Run:
```bash
cp -r .claude/commands/workflow/* plugin-dist/commands/
```

**Step 3: Verify count**

Run:
```bash
ls plugin-dist/commands/*.md | wc -l
```
Expected: 25 files

**Step 4: Commit**

```bash
git add plugin-dist/commands/
git commit -m "feat(plugin-dist): Add 25 workflow commands"
```

---

### Task 3: Copy agents to plugin-dist

**Files:**
- Create: `plugin-dist/agents/` (copy from `.claude/agents/`)

**Step 1: Create agents directory**

Run:
```bash
mkdir -p plugin-dist/agents
```

**Step 2: Copy all agents**

Run:
```bash
cp .claude/agents/*.md plugin-dist/agents/
```

**Step 3: Verify count**

Run:
```bash
ls plugin-dist/agents/*.md | wc -l
```
Expected: 9 files (architect, builder, devops, explainer, guide, innovator, quality, researcher, security)

**Step 4: Commit**

```bash
git add plugin-dist/agents/
git commit -m "feat(plugin-dist): Add 9 specialized agents"
```

---

### Task 4: Copy skills to plugin-dist

**Files:**
- Create: `plugin-dist/skills/` (copy from `.claude/skills/workflow/`)

**Step 1: Create skills directory**

Run:
```bash
mkdir -p plugin-dist/skills
```

**Step 2: Copy all workflow skills**

Run:
```bash
cp -r .claude/skills/workflow/* plugin-dist/skills/
```

**Step 3: Verify structure**

Run:
```bash
find plugin-dist/skills -name "SKILL.md" | wc -l
```
Expected: 17 skills (or count matching current)

**Step 4: Commit**

```bash
git add plugin-dist/skills/
git commit -m "feat(plugin-dist): Add 17 context skills"
```

---

### Task 5: Create hooks configuration for plugin-dist

**Files:**
- Create: `plugin-dist/hooks/hooks.json`
- Create: `plugin-dist/hooks/scripts/` (copy from `hooks/scripts/`)

**Step 1: Create hooks directory structure**

Run:
```bash
mkdir -p plugin-dist/hooks/scripts
```

**Step 2: Copy hook scripts**

Run:
```bash
cp hooks/scripts/*.sh plugin-dist/hooks/scripts/
```

**Step 3: Create portable hooks.json**

The key difference: Use `${CLAUDE_PLUGIN_ROOT}` instead of relative paths.

Create `plugin-dist/hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-write-validate.sh"
          }
        ]
      },
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-delegation-context.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-write-log.sh"
          }
        ]
      },
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-delegation-observe.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-stop.sh"
          },
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/nano-analyze.sh"
          }
        ]
      }
    ]
  }
}
```

**Step 4: Verify scripts are executable**

Run:
```bash
chmod +x plugin-dist/hooks/scripts/*.sh
ls -la plugin-dist/hooks/scripts/
```

**Step 5: Commit**

```bash
git add plugin-dist/hooks/
git commit -m "feat(plugin-dist): Add 7 hooks with portable paths"
```

---

### Task 6: Update hook scripts for portability

**Files:**
- Modify: `plugin-dist/hooks/scripts/common.sh`

**Step 1: Check current common.sh for hardcoded paths**

Read the file and identify any paths that assume repo structure.

**Step 2: Update common.sh to use CLAUDE_PLUGIN_ROOT**

Key changes needed:
- `WORKFLOW_DIR` should derive from `${CLAUDE_PLUGIN_ROOT:-$(dirname "$0")/../..}`
- All paths to workflow/, standards/, etc. need adjustment

The hook scripts in plugin-dist should work standalone without the full repo.

**Step 3: Test common.sh sourcing**

Run:
```bash
CLAUDE_PLUGIN_ROOT="$(pwd)/plugin-dist" bash -c 'source plugin-dist/hooks/scripts/common.sh && echo "WORKFLOW_DIR=$WORKFLOW_DIR"'
```

**Step 4: Commit**

```bash
git add plugin-dist/hooks/scripts/common.sh
git commit -m "fix(plugin-dist): Make hook scripts portable with CLAUDE_PLUGIN_ROOT"
```

---

### Task 7: Test plugin locally

**Files:**
- None (verification only)

**Step 1: Run Claude Code with plugin-dir flag**

Run:
```bash
claude --plugin-dir ./plugin-dist
```

**Step 2: Verify commands are loaded**

In Claude Code, run:
```
/help
```
Expected: See `claude-workflow-engine:*` commands listed

**Step 3: Verify agents are loaded**

Run:
```
/agents
```
Expected: See 9 agents from plugin

**Step 4: Test a simple command**

Run:
```
/claude-workflow-engine:help
```
Expected: Help output from workflow

**Step 5: Document any issues found**

If issues found, create follow-up tasks.

---

### Task 8: Update VERSION and commit release

**Files:**
- Modify: `VERSION`
- Modify: `plugin-dist/.claude-plugin/plugin.json` (if version mismatch)

**Step 1: Update VERSION file**

```
0.3.0
```

**Step 2: Verify plugin.json version matches**

Both should say `0.3.0`.

**Step 3: Final commit**

```bash
git add VERSION plugin-dist/
git commit -m "chore(release): Bump to 0.3.0 - Plugin-Manifest complete"
```

**Step 4: Create tag**

```bash
git tag -a v0.3.0 -m "Release 0.3.0 - Standalone plugin distribution"
```

---

## Summary

| Task | Files | Commits |
|------|-------|---------|
| 1 | plugin-dist/.claude-plugin/plugin.json | 1 |
| 2 | plugin-dist/commands/*.md | 1 |
| 3 | plugin-dist/agents/*.md | 1 |
| 4 | plugin-dist/skills/**/SKILL.md | 1 |
| 5 | plugin-dist/hooks/hooks.json, scripts/*.sh | 1 |
| 6 | plugin-dist/hooks/scripts/common.sh | 1 |
| 7 | - (verification only) | 0 |
| 8 | VERSION | 1 |

**Total: 8 Tasks, 7 Commits, 1 Tag**

---

## Next Steps (0.3.1+)

After 0.3.0 is complete:
- 0.3.1: `/workflow:init` Command (replaces CLI install)
- 0.3.2: Templates einbetten
- 0.3.3: Profile-Auswahl
