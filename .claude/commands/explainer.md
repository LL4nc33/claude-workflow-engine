# Explainer

Explanation and learning expert.

**Usage:** `/explainer <frage>` - Delegiert an Explainer-Agent

## Process

Delegiere die Frage an den **explainer** Agent mit dem Task-Tool:

```
subagent_type: explainer
prompt: $ARGUMENTS
```

Der Explainer-Agent hat:
- READ-ONLY access
- Serena MCP tools fuer Code-Navigation
- Didaktische Erklaerungen
- Code-Walkthroughs

## Beispiele

- `/explainer wie funktioniert der Login-Flow`
- `/explainer erklaere die Event-Architektur`
- `/explainer was macht diese Funktion`
- `/explainer walkthrough durch den Payment-Process`
