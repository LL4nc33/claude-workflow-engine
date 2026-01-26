---
description: Delegate to explainer agent - explanations, code walkthroughs, learning
allowed-tools: ["Task"]
---

# Explainer

Delegate to the **explainer** agent for explanations.

**Usage:** `/cwe:explainer <question>`

## Examples

- `/cwe:explainer how does the auth flow work?`
- `/cwe:explainer explain this function`
- `/cwe:explainer what does this error mean?`

## Process

Delegate using the Task tool:

```
subagent_type: explainer
prompt: [user's question]
```

The explainer agent has:
- READ-ONLY access
- Serena MCP tools for code navigation
- Patient, educational approach
- Progressive disclosure (summary first, then details)
