---
name: auto-delegation
description: >
  Use PROACTIVELY when user wants to: implement, fix, build, create code,
  explain code, audit security, design architecture, deploy, release,
  test, brainstorm, analyze, document. Maps intent to specialized agents.
---

# Auto-Delegation

## Quick Reference

| Intent | Agent | Trigger Keywords |
|--------|-------|------------------|
| Write/fix code | builder | implement, fix, build, refactor, test |
| Explain | explainer | explain, how, what, why, understand |
| Research/Docs | researcher | analyze, document, research, compare |
| Security | security | audit, vulnerability, scan, gdpr |
| Infrastructure | devops | deploy, docker, ci, k8s, release |
| Design | architect | design, architecture, adr, api |
| Quality | quality | coverage, metrics, flaky, gate |
| Ideas | innovator | brainstorm, ideas, what if |
| Process | guide | workflow, pattern, optimization |

## Decision Logic

```
Request → Explicit /command? → Yes → Execute command
                            → No ↓
         Single-Domain?     → Yes → Delegate to agent
                            → No ↓
         Multi-Step (>3)?   → Yes → Main Chat coordinates
                            → No ↓
         Unclear?           → Yes → Ask max 2 questions
                            → No → Most likely agent
```

## Rules

1. **Never guess** - Ask when unclear
2. **Respect explicit commands** - /builder, /workflow:* etc.
3. **Context isolation** - Agent result is summary, not full context
4. **Override** - "manual", "no delegation" disables auto-delegation

## Examples

```
"Fix login bug" → builder
"How does auth work?" → explainer
"Audit API" → security
"Create release" → devops
"Look at this" → ASK: "Fix, explain, or analyze?"
```

## Context Injection (Automatic)

When delegating, relevant context is automatically included:

| Task Type | Injected Context |
|-----------|------------------|
| **All** | global/tech-stack (always) |
| **auth/login/jwt** | api/error-handling |
| **api/endpoint** | api/response-format, api/error-handling |
| **database/migration** | database/migrations, global/naming |
| **component/ui** | frontend/components |
| **test/coverage** | testing/coverage |
| **docker/deploy** | devops/ci-cd, devops/containerization |

## You Don't Need to Do Anything Manual

Context injection happens automatically based on task keywords.
