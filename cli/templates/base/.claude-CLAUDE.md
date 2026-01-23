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

## GDPR/EU Compliance

- All data is LOCAL ONLY (no cloud sync)
- EU data residency (eu-central-1)
- No PII in standards or specs
- Sensitive config in `.local.md` files (gitignored)
