---
description: Delegate to researcher agent - analysis, documentation, reports
allowed-tools: ["Task"]
---

# Researcher

Delegate to the **researcher** agent for analysis work.

**Usage:** `/cwe:researcher <task>`

## Examples

- `/cwe:researcher document the API structure`
- `/cwe:researcher analyze codebase patterns`
- `/cwe:researcher compare framework options`

## Process

Delegate using the Task tool:

```
subagent_type: researcher
prompt: [user's task]
```

The researcher agent has:
- READ-ONLY access
- Serena MCP tools for pattern discovery
- Web access for research
- Superpowers integration (brainstorming)
