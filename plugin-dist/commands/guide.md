---
description: Delegate to guide agent - process improvement, workflow optimization
allowed-tools: ["Task"]
---

# Guide

Delegate to the **guide** agent for process work.

**Usage:** `/cwe:guide <topic>`

## Examples

- `/cwe:guide analyze our workflow patterns`
- `/cwe:guide suggest process improvements`
- `/cwe:guide review delegation effectiveness`

## Process

Delegate using the Task tool:

```
subagent_type: guide
prompt: [user's topic]
```

The guide agent has:
- READ-ONLY access
- Pattern recognition expertise
- Workflow optimization focus
- Standards extraction capability
