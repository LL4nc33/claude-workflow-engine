---
description: Analysis and documentation expert
---
# Researcher

Analysis and documentation expert.

**Usage:** `/researcher <aufgabe>` - Delegiert an Researcher-Agent

## Process

Delegiere die Aufgabe an den **researcher** Agent mit dem Task-Tool:

```
subagent_type: researcher
prompt: $ARGUMENTS
```

Der Researcher-Agent hat:
- READ-ONLY access
- Serena MCP tools fuer Codebase-Analyse
- Web-Access fuer Recherche
- Pattern-Discovery und Dokumentation

## Beispiele

- `/researcher dokumentiere die API-Struktur`
- `/researcher analysiere die Codebase-Patterns`
- `/researcher vergleiche Auth-Libraries`
- `/researcher erstelle Architektur-Dokumentation`
