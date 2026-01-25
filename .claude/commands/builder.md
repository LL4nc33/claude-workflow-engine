---
description: Bug investigation and implementation expert
---
# Builder

Bug investigation and implementation expert.

**Usage:** `/builder <aufgabe>` - Delegiert an Builder-Agent

## Process

Delegiere die Aufgabe an den **builder** Agent mit dem Task-Tool:

```
subagent_type: builder
prompt: $ARGUMENTS
```

Der Builder-Agent hat:
- FULL filesystem access (Read, Write, Edit, Bash)
- Serena MCP tools fuer praezise Code-Manipulation
- Hypothesis-driven debugging methodology
- Standards-Injection aus workflow/standards/

## Beispiele

- `/builder fix den Login-Bug`
- `/builder implementiere User-Auth nach der Spec`
- `/builder debug warum der API-Call fehlschlaegt`
- `/builder schreibe Tests fuer UserService`
