---
description: Ask questions about the project, discuss ideas (READ-ONLY)
allowed-tools: ["Task"]
---

# CWE Ask

Answer questions and discuss ideas about the project.

**Usage:** `/cwe:ask <question>`

## Examples

- `/cwe:ask how does the auth flow work?`
- `/cwe:ask what's the purpose of this module?`
- `/cwe:ask I have an idea for feature X - what do you think?`

## Behavior

1. **READ-ONLY** - No code changes
2. Answer questions about codebase, architecture, patterns
3. Discuss ideas without implementing
4. Can delegate to `ask` agent for deep explanations

## Process

Delegate using the Task tool:

```
subagent_type: ask
prompt: [user's question]
```

The ask agent has:
- READ-ONLY access
- Serena MCP tools for code navigation
- Patient, thoughtful responses
- No implementation actions

## Note

Ideas mentioned in conversation are automatically captured by the idea-observer hook.
Use `/cwe:innovator` to review and develop collected ideas.
