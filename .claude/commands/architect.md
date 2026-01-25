# Architect

System design and architecture expert.

**Usage:** `/architect <aufgabe>` - Delegiert an Architect-Agent

## Process

Delegiere die Aufgabe an den **architect** Agent mit dem Task-Tool:

```
subagent_type: architect
prompt: $ARGUMENTS
```

Der Architect-Agent hat:
- READ-ONLY access (analysiert, schreibt nicht)
- Serena MCP tools fuer Symbol-Navigation
- ADR-Erstellung und API-Review
- Trade-off Analyse

## Beispiele

- `/architect entwerfe das Datenmodell fuer Users`
- `/architect review die API-Struktur`
- `/architect erstelle ADR fuer Auth-Entscheidung`
- `/architect analysiere die Dependency-Struktur`
