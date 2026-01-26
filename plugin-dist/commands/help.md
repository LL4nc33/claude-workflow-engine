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
| `/cwe:builder` | Delegate to builder (implementation, fixes) |
| `/cwe:architect` | Delegate to architect (design, ADRs) |
| `/cwe:devops` | Delegate to devops (CI/CD, Docker, releases) |
| `/cwe:security` | Delegate to security (audits, OWASP) |
| `/cwe:researcher` | Delegate to researcher (docs, analysis) |
| `/cwe:explainer` | Delegate to explainer (explanations) |
| `/cwe:quality` | Delegate to quality (tests, coverage) |
| `/cwe:innovator` | Delegate to innovator (brainstorming) |
| `/cwe:guide` | Delegate to guide (process improvement) |

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

## Auto-Delegation

Just describe what you need - CWE automatically delegates to the right agent:

| You say... | Agent |
|------------|-------|
| "fix the bug" | builder |
| "explain this code" | explainer |
| "audit security" | security |
| "deploy to production" | devops |
| "brainstorm alternatives" | innovator |

Override with "manual" or use explicit `/cwe:agent` commands.

## Quick Start

1. `/cwe:init` - Set up project
2. Edit `workflow/product/mission.md`
3. `/cwe:start` - Begin guided workflow
```
