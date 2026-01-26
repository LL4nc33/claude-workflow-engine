---
description: Delegate to builder agent - implementation, bug fixes, code changes
allowed-tools: ["Task"]
---

# Builder

Delegate to the **builder** agent for implementation work.

**Usage:** `/cwe:builder <task>`

## Examples

- `/cwe:builder fix the login bug`
- `/cwe:builder implement user authentication`
- `/cwe:builder refactor the API handlers`

## Process

Delegate using the Task tool:

```
subagent_type: builder
prompt: [user's task]
```

The builder agent has:
- Full filesystem access (Read, Write, Edit, Bash)
- Serena MCP tools for semantic code manipulation
- Superpowers integration (TDD, debugging, verification)
