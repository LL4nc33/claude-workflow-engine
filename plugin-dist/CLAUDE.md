# Claude Workflow Engine (CWE) v0.3.1

Spec-driven development with 9 specialized agents.

## Auto-Delegation

When a user request matches these patterns, **automatically delegate** to the appropriate agent using the Task tool. No need to wait for explicit `/cwe:agent` commands.

### Intent-to-Agent Mapping

| User Says... | Agent | Keywords |
|-------------|-------|----------|
| "implement/build/create/fix/refactor X" | **builder** | implement, build, create, fix, refactor, code, write |
| "explain/how does/what is/why X" | **explainer** | explain, how, what, why, understand, tell me |
| "audit/check security/vulnerabilities" | **security** | audit, security, vulnerability, owasp, gdpr |
| "deploy/docker/ci/release X" | **devops** | deploy, docker, kubernetes, ci, cd, release, infrastructure |
| "design/architecture/adr X" | **architect** | design, architecture, adr, api design, system |
| "document/analyze/research X" | **researcher** | document, analyze, research, compare, report |
| "test/coverage/quality X" | **quality** | test, coverage, quality, metrics, flaky |
| "brainstorm/ideas/what if X" | **innovator** | brainstorm, ideas, alternatives, what if, creative |
| "workflow/process/pattern X" | **guide** | workflow, process, pattern, improve, optimize |

### Decision Rules

```
User request
    ↓
Explicit /cwe:* command? → Execute command
    ↓ no
Single-domain intent? → Delegate to matching agent
    ↓ no
Multi-step task (>3 subtasks)? → Main chat coordinates
    ↓ no
Unclear? → Ask max 2 clarifying questions
```

### Override

User can say "manual" or "no delegation" to disable auto-delegation for that request.

## Commands

| Command | Purpose |
|---------|---------|
| `/cwe:init` | Initialize project with workflow structure |
| `/cwe:start` | Guided workflow - detects phase, shows next steps |
| `/cwe:help` | Documentation |
| `/cwe:builder` | Delegate to builder agent |
| `/cwe:architect` | Delegate to architect agent |
| `/cwe:devops` | Delegate to devops agent |
| `/cwe:security` | Delegate to security agent |
| `/cwe:researcher` | Delegate to researcher agent |
| `/cwe:explainer` | Delegate to explainer agent |
| `/cwe:quality` | Delegate to quality agent |
| `/cwe:innovator` | Delegate to innovator agent |
| `/cwe:guide` | Delegate to guide agent |

## Superpowers Integration

CWE agents reference superpowers skills automatically:

| Agent | Uses Superpowers |
|-------|------------------|
| builder | test-driven-development, systematic-debugging, verification-before-completion |
| architect | writing-plans, brainstorming |
| quality | requesting-code-review, verification-before-completion |
| researcher | brainstorming |

## Task Metadata

When creating tasks with `TaskCreate`, use the `metadata` field to control execution:

```
TaskCreate(
  description: "Implement user authentication",
  metadata: { agent: "builder" }
)
```

### Supported Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `agent` | string | Which agent handles this task: builder, architect, devops, security, researcher, explainer, quality, innovator, guide |
| `priority` | number | Execution order within a wave (lower = first) |

If `agent` is not specified, the system auto-detects based on task description keywords or defaults to "builder".

## Parallel Task Orchestration

Tasks werden wave-weise parallel ausgefuehrt:
- Max 3 Tasks gleichzeitig
- Dependencies via `blockedBy` respektiert
- Agent pro Task: `metadata.agent` > auto-detect > builder

### Agent Auto-Detection

| Keywords | Agent |
|----------|-------|
| fix, bug, implement, build, feature | builder |
| test, coverage, quality, validate | quality |
| deploy, docker, ci, cd, release | devops |
| security, audit, vulnerability, owasp | security |
| explain, how, why, what | explainer |
| design, architecture, adr, api | architect |
| document, analyze, research | researcher |
| brainstorm, idea, alternative | innovator |
| process, workflow, improve | guide |

Fallback: builder

## Context Isolation

Agent work stays in agent context. Only a compact summary returns to main chat. This saves tokens and keeps context clean.
