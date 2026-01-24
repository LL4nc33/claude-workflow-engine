# Claude Workflow Engine - Multi-Agent System

## System Overview

This project implements a specialized multi-agent system for AI-assisted software development.
7 specialized agents collaborate through well-defined interfaces, standards injection,
and spec-driven workflows.

## Agent Hierarchy

```
                    +------------------+
                    |   orchestrator   |  (Task Delegation)
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |         |         |         |         |
    +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
    |architect| |  debug | |devops  | |security| |researcher|
    +---------+ +--------+ +--------+ +--------+ +----------+
         |
    +----+---+
    |  ask   |  (Explanations)
    +---------+
```

## Agents Directory

All agent definitions live in `.claude/agents/`:

| Agent | Purpose | Access |
|-------|---------|--------|
| [architect](.claude/agents/architect.md) | System Design, ADRs, API Review | READ-ONLY |
| [ask](.claude/agents/ask.md) | Explanations, Code Walkthroughs | READ-ONLY |
| [debug](.claude/agents/debug.md) | Bug Investigation, Implementation | FULL |
| [devops](.claude/agents/devops.md) | CI/CD, Docker, Kubernetes, IaC | FULL |
| [orchestrator](.claude/agents/orchestrator.md) | Task Delegation, Coordination | TASK-DELEGATION |
| [researcher](.claude/agents/researcher.md) | Analysis, Documentation, Reports | READ-ONLY |
| [security](.claude/agents/security.md) | OWASP Audits, Vulnerability Assessment | RESTRICTED |

## Workflow

The standard development workflow follows 5 phases:

```
/workflow/plan-product --> /workflow/shape-spec --> /workflow/write-spec --> /workflow/create-tasks --> /workflow/orchestrate-tasks
```

1. **Plan Product** - Define mission, goals, constraints (`workflow/product/`)
2. **Shape Spec** - Gather requirements, references (`workflow/specs/{folder}/`)
3. **Write Spec** - Create technical specification
4. **Create Tasks** - Break spec into implementable tasks
5. **Orchestrate Tasks** - Delegate to specialized agents

### Utility Workflows

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/workflow:clone-setup` | Configure Firecrawl + SearXNG service URLs | Self-hosted instances |
| `/workflow:visual-clone` | Extract visual identity (colors, fonts, CSS) from websites | `/workflow:clone-setup` |

Configuration is stored in `visual-clone.local.md` (gitignored, GDPR-compliant). API responses are converted to [TOON format](https://github.com/toon-format/toon) for ~40% token savings.

## Context Model (3 Layers)

- **Layer 1 - Standards (HOW):** `workflow/standards/` - Conventions and patterns
- **Layer 2 - Product (WHAT/WHY):** `workflow/product/` - Mission, roadmap, architecture
- **Layer 3 - Specs (WHAT NEXT):** `workflow/specs/` - Feature specifications

## Standards Domains

| Domain | Path | Standards | Status |
|--------|------|-----------|--------|
| global | `workflow/standards/global/` | tech-stack, naming | Active |
| devops | `workflow/standards/devops/` | ci-cd, containerization, infrastructure | Active |
| agents | `workflow/standards/agents/` | agent-conventions | Active |
| api | `workflow/standards/api/` | response-format, error-handling | Active |
| database | `workflow/standards/database/` | migrations | Active |
| frontend | `workflow/standards/frontend/` | components | Active |
| testing | `workflow/standards/testing/` | coverage | Active |

## Key Configuration Files

- `workflow/config.yml` - Main configuration
- `workflow/orchestration.yml` - Task delegation and workflow config
- `workflow/standards/index.yml` - Standards registry
- `.claude/settings.local.json` - Claude Code permissions

## Platform Architecture (6 Layers)

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging (.claude-plugin/plugin.json)          |
|  Bundles all layers into an installable package                  |
+------------------------------------------------------------------+
|  Layer 5: Hooks (hooks/hooks.json)                               |
|  Event-based automation (SessionStart, Pre/PostToolUse)          |
+------------------------------------------------------------------+
|  Layer 4: Agents (.claude/agents/*.md)                           |
|  7 specialized subagents with defined roles and MCP tools        |
+------------------------------------------------------------------+
|  Layer 3: Skills (.claude/skills/workflow/)                       |
|  Context-based knowledge (Standards, MCP-Usage, Hooks, Config)   |
+------------------------------------------------------------------+
|  Layer 2: Commands (.claude/commands/workflow/)                   |
|  8 slash commands for the 5-phase workflow                       |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md (.claude/CLAUDE.md)                          |
|  Project instructions and system overview                        |
+------------------------------------------------------------------+
```

## Available MCP Tools

When configured, the following MCP servers extend agent capabilities:

| Server | Tools | Used By |
|--------|-------|---------|
| **Serena** | find_symbol, get_symbols_overview, find_referencing_symbols, replace_symbol_body, search_for_pattern | architect, researcher, debug, ask |
| **Greptile** | list_merge_requests, get_merge_request, search_greptile_comments, list_merge_request_comments | orchestrator, security |

MCP tools are optional - agents fall back to standard tools if servers are unavailable.

## Hook Behavior

Three hooks automate workflow tasks:

| Hook | Event | Behavior |
|------|-------|----------|
| SessionStart | Session begins | Checks standards freshness, provides workflow context |
| PreToolUse (Write/Edit) | Before file writes | Blocks writes to .env, credentials.*, secrets.*, *.local.md |
| PostToolUse (Write/Edit) | After file writes | Logs changes during active orchestration (filenames only, GDPR) |

## Recommended MCP Servers

- **Serena** - Semantic code analysis via Language Server (symbol navigation, refactoring)
- **Greptile** - PR management and code review integration

Setup is documented in `docs/plattform-architektur.md`.

## GDPR/EU Compliance

- All data is LOCAL ONLY (no cloud sync)
- EU data residency (eu-central-1)
- No PII in standards or specs
- Sensitive config in `.local.md` files (gitignored)
