---
description: Detect appropriate agent from task text
---

# Agent Auto-Detection

Map task keywords to specialized agents.

## Keyword → Agent Mapping

| Keywords | Agent | Use Case |
|----------|-------|----------|
| fix, bug, implement, build, feature, code | builder | Implementation work |
| test, coverage, quality, validate, assert | quality | Testing and QA |
| deploy, docker, ci, cd, release, kubernetes, terraform | devops | Infrastructure |
| security, audit, vulnerability, owasp, cve | security | Security audits |
| explain, how, why, what, understand | explainer | Learning |
| design, architecture, adr, api, schema | architect | System design |
| document, analyze, research, compare | researcher | Analysis |
| brainstorm, idea, alternative, explore | innovator | Ideation |
| process, workflow, improve, optimize | guide | Process improvement |

## Detection Logic

1. Check `metadata.agent` - if set, use it (explicit)
2. Scan task subject + description for keywords
3. First match wins (order: builder → quality → devops → security → explainer → architect → researcher → innovator → guide)
4. Fallback: `builder`

## Usage

Called automatically by `/cwe:start` during Build phase for each task.
