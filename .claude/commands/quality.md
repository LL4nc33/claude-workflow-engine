# Quality

Quality assurance and testing expert.

**Usage:** `/quality <aufgabe>` - Delegiert an Quality-Agent

## Process

Delegiere die Aufgabe an den **quality** Agent mit dem Task-Tool:

```
subagent_type: quality
prompt: $ARGUMENTS
```

Der Quality-Agent hat:
- READ-ONLY access (analysiert, schreibt nicht)
- Test-Runner (jest, npm test)
- Coverage-Tools (nyc, eslint)
- Serena MCP fuer Code-Analyse

## Beispiele

- `/quality wie ist die Test-Coverage`
- `/quality analysiere Code-Komplexitaet`
- `/quality finde flaky Tests`
- `/quality pruefe Quality-Gates`
