# Claude Workflow Engine (CWE) v0.4.0a

Natural language orchestration for spec-driven development.

## 5 Core Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Agent-First** | All work delegated to specialized agents |
| 2 | **Auto-Delegation** | Intent recognition maps requests to agents/skills |
| 3 | **Spec-Driven** | Features: specs → tasks → implementation |
| 4 | **Context Isolation** | Agent work returns only compact summaries |
| 5 | **Plugin Integration** | Agents leverage installed plugin skills |

---

## Auto-Delegation

Just say what you need. CWE routes to the right agent or skill.

### Intent → Agent

| Keywords | Agent |
|----------|-------|
| implement, build, create, fix, code | **builder** |
| explain, how does, what is, why | **explainer** |
| question, discuss, think about | **ask** |
| audit, security, vulnerability, owasp | **security** |
| deploy, docker, ci, cd, release | **devops** |
| design, architecture, adr, api | **architect** |
| document, analyze, research | **researcher** |
| test, coverage, quality, validate | **quality** |
| brainstorm, idea, what if, alternative | **innovator** |
| workflow, process, pattern, improve | **guide** |

### Intent → Plugin Skill

| Keywords | Skill | Plugin |
|----------|-------|--------|
| UI, frontend, component, page | `frontend-design` | frontend-design |
| simplify, cleanup, refactor | `code-simplifier` | code-simplifier |
| debug, investigate bug | `systematic-debugging` | superpowers |
| write plan, planning | `writing-plans` | superpowers |
| review code | `requesting-code-review` | superpowers |
| TDD, test first | `test-driven-development` | superpowers |
| update CLAUDE.md | `claude-md-improver` | claude-md-management |
| create plugin, hook, command | plugin-dev skills | plugin-dev |
| develop feature | `/feature-dev` | feature-dev |

### Decision Flow

```
User request
    ↓
Explicit command? → Execute command
    ↓ no
Plugin skill matches? → Invoke skill
    ↓ no
CWE agent matches? → Delegate to agent
    ↓ no
Multi-step task? → Orchestrate with subagents
    ↓ no
Unclear? → Ask (max 2 questions)
```

**Override:** Say "manual" to disable auto-delegation.

---

## Commands

### CWE Core

| Command | Purpose |
|---------|---------|
| `/cwe:init` | Initialize project with workflow structure |
| `/cwe:start` | Guided workflow - detects phase, shows next steps |
| `/cwe:help` | Documentation |

### CWE Agents

| Command | Agent | Purpose |
|---------|-------|---------|
| `/cwe:ask` | ask | Questions, discussions (READ-ONLY) |
| `/cwe:builder` | builder | Implementation, fixes |
| `/cwe:architect` | architect | Design, ADRs |
| `/cwe:devops` | devops | CI/CD, Docker |
| `/cwe:security` | security | Audits, OWASP |
| `/cwe:researcher` | researcher | Docs, analysis |
| `/cwe:explainer` | explainer | Explanations |
| `/cwe:quality` | quality | Tests, coverage |
| `/cwe:innovator` | innovator | Brainstorming, idea backlog |
| `/cwe:guide` | guide | Process improvement |

### Plugin Commands

| Command | Plugin | Purpose |
|---------|--------|---------|
| `/feature-dev` | feature-dev | 7-phase feature development |
| `/create-plugin` | plugin-dev | Plugin creation workflow |
| `/revise-claude-md` | claude-md-management | Update CLAUDE.md |
| `/brainstorm` | superpowers | Creative ideation |
| `/write-plan` | superpowers | Implementation planning |
| `/execute-plan` | superpowers | Execute written plans |

---

## Installed Plugins

### superpowers (v4.1.1)

| Skill | Use When |
|-------|----------|
| `brainstorming` | Before creative work |
| `test-driven-development` | Implementing features |
| `systematic-debugging` | Bugs, test failures |
| `verification-before-completion` | Before claiming done |
| `requesting-code-review` | After major features |
| `receiving-code-review` | Processing feedback |
| `writing-plans` | Multi-step tasks |
| `executing-plans` | Running plans |
| `using-git-worktrees` | Feature isolation |
| `subagent-driven-development` | Parallel tasks |
| `dispatching-parallel-agents` | 2+ independent tasks |
| `finishing-a-development-branch` | Merging work |

### serena (MCP)

Semantic code analysis via LSP.

| Tool | Purpose |
|------|---------|
| `find_symbol` | Locate classes, methods |
| `find_referencing_symbols` | Find all references |
| `get_symbols_overview` | File structure |
| `replace_symbol_body` | Edit definitions |
| `search_for_pattern` | Regex search |

### feature-dev

| Component | Purpose |
|-----------|---------|
| `/feature-dev` | 7-phase guided workflow |
| `code-explorer` | Trace code, understand abstractions |
| `code-architect` | Design approaches |
| `code-reviewer` | Review for correctness |

### frontend-design

| Skill | Purpose |
|-------|---------|
| `frontend-design` | Production-grade UI, avoiding generic AI aesthetics |

### code-simplifier

| Agent | Purpose |
|-------|---------|
| `code-simplifier` | Simplify code, preserve functionality |

### claude-md-management

| Component | Purpose |
|-----------|---------|
| `/revise-claude-md` | Update CLAUDE.md with learnings |
| `claude-md-improver` | Audit and improve CLAUDE.md |

### plugin-dev

| Skills | Topic |
|--------|-------|
| `command-development` | Slash commands |
| `skill-development` | Creating skills |
| `hook-development` | Event automation |
| `plugin-structure` | Directory layout |
| `agent-development` | Agent prompts |
| `mcp-integration` | MCP servers |

---

## Agent-Plugin Mapping

CWE agents invoke plugin skills automatically:

| Agent | Invokes |
|-------|---------|
| **builder** | superpowers:test-driven-development, superpowers:systematic-debugging, superpowers:verification-before-completion, frontend-design (UI), code-simplifier (refactor) |
| **architect** | superpowers:writing-plans, superpowers:brainstorming, feature-dev:code-architect |
| **quality** | superpowers:requesting-code-review, superpowers:verification-before-completion, feature-dev:code-reviewer |
| **security** | superpowers:verification-before-completion, serena (pattern search) |
| **devops** | superpowers:verification-before-completion, superpowers:writing-plans |
| **researcher** | superpowers:brainstorming, feature-dev:code-explorer |
| **explainer** | serena (symbols), feature-dev:code-explorer |
| **innovator** | superpowers:brainstorming |
| **guide** | claude-md-improver |
| **ask** | serena (symbols) |

---

## Task Orchestration

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `agent` | string | CWE agent or plugin agent |
| `skill` | string | Specific skill to invoke |
| `priority` | number | Execution order (lower = first) |

### Parallel Execution

- Max 3 tasks simultaneously
- Dependencies via `blockedBy`
- Agent detection: `metadata.agent` > keywords > builder

---

## Idea Capture System

Auto-captured via hooks:

1. **UserPromptSubmit** scans for idea keywords
2. Stored in `~/.claude/cwe/idea-observations.toon`
3. **Stop** hook notifies at session end
4. `/cwe:innovator` reviews and develops ideas

**Keywords:** idea, what if, could we, maybe, alternative, improvement

---

## Quick Reference

```
"Fix the login bug"           → builder + systematic-debugging
"Build a user profile page"   → builder + frontend-design
"Explain how auth works"      → explainer + serena
"What if we used GraphQL?"    → innovator + brainstorming
"Review my changes"           → quality + code-reviewer
"Plan the refactoring"        → architect + writing-plans
"Simplify this function"      → code-simplifier
"Create a new feature"        → /feature-dev workflow
```
