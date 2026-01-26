---
description: Delegate to quality agent - testing, coverage, quality metrics
allowed-tools: ["Task"]
---

# Quality

Delegate to the **quality** agent for QA work.

**Usage:** `/cwe:quality <task>`

## Examples

- `/cwe:quality check test coverage`
- `/cwe:quality analyze code complexity`
- `/cwe:quality review before release`

## Process

Delegate using the Task tool:

```
subagent_type: quality
prompt: [user's task]
```

The quality agent has:
- READ-ONLY + test commands
- Coverage analysis tools
- Complexity metrics
- Superpowers integration (verification, code-review)
