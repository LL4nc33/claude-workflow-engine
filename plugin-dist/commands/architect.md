---
description: Delegate to architect agent - system design, ADRs, API review
allowed-tools: ["Task"]
---

# Architect

Delegate to the **architect** agent for design work.

**Usage:** `/cwe:architect <task>`

## Examples

- `/cwe:architect design the data model`
- `/cwe:architect review the API structure`
- `/cwe:architect create ADR for auth approach`

## Process

Delegate using the Task tool:

```
subagent_type: architect
prompt: [user's task]
```

The architect agent has:
- READ-ONLY access (analyzes, recommends, doesn't modify)
- Serena MCP tools for code analysis
- Superpowers integration (writing-plans, brainstorming)
