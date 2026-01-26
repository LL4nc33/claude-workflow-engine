---
name: auto-delegation
description: >
  Use PROACTIVELY when user wants to: implement, fix, build, create code,
  explain code, audit security, design architecture, deploy, release,
  test, brainstorm, analyze, document. Maps intent to specialized agents.
---

# Auto-Delegation

## Single Source of Truth

Intent-to-Agent Mapping ist definiert in `workflow/orchestration.yml` unter `agent_first.always_delegate`.

## Quick Reference

| Intent | Agent | Trigger |
|--------|-------|---------|
| Code schreiben/fixen | builder | implement, fix, build, refactor, test |
| Erklaeren | explainer | explain, how, what, why, understand |
| Recherche/Docs | researcher | analyze, document, research, compare |
| Security | security | audit, vulnerability, scan, gdpr |
| Infrastructure | devops | deploy, docker, ci, k8s, release |
| Design | architect | design, architecture, adr, api |
| Quality | quality | coverage, metrics, flaky, gate |
| Ideen | innovator | brainstorm, ideas, what if |
| Process | guide | workflow, pattern, optimization |

## Entscheidungslogik

```
Request → Expliziter /command? → Ja → Command ausfuehren
                              → Nein ↓
         Single-Domain?       → Ja → Delegiere an Agent
                              → Nein ↓
         Multi-Step (>3)?     → Ja → Main Chat koordiniert
                              → Nein ↓
         Unklar?              → Ja → Max 2 Fragen stellen
                              → Nein → Wahrscheinlichster Agent
```

## Regeln

1. **Niemals raten** - bei Unklarheit fragen
2. **Explizite Commands respektieren** - /builder, /workflow:* etc.
3. **Context Isolation** - Agent-Ergebnis ist Summary, nicht voller Context
4. **Override** - "manuell", "ohne Delegation" deaktiviert Auto-Delegation

## Beispiele

```
"Fix Login-Bug" → builder
"Wie funktioniert Auth?" → explainer
"Audit API" → security
"Release machen" → devops
"Schau dir das an" → FRAGEN: "Fixen, Erklaeren, oder Analysieren?"
```

## Context-Injection (Automatisch)

Bei jeder Delegation wird automatisch Context injiziert via PreToolUse Hook
(`hooks/scripts/pre-delegation-context.sh`).

### Was wird injiziert?

| Task-Typ | Injected Context |
|----------|------------------|
| **Alle** | global/tech-stack (immer) |
| **auth/login/jwt** | api/error-handling |
| **api/endpoint** | api/response-format, api/error-handling |
| **database/migration** | database/migrations, global/naming |
| **component/ui** | frontend/components |
| **test/coverage** | testing/coverage |
| **docker/deploy** | devops/ci-cd, devops/containerization |

### Code-Scan (bei implement/fix/refactor)

Bei Implementation-Tasks scannt der Hook automatisch nach relevanten Files:
- Sucht in `src/` nach Files die zu Keywords passen
- Zeigt nur Filename + erste Zeile (kein voller Content)
- Max 3 Files

### Architecture-Context (bei design/architect)

Bei Design-Tasks wird `workflow/product/architecture.md` Summary hinzugefuegt:
- Erste ~100 Zeilen (~500 Tokens)
- Context Model, Permission Matrix, Integration Flow

### Du musst NICHTS manuell machen

Der Hook erledigt alles automatisch. Konfiguration liegt in:
- `workflow/orchestration.yml` unter `auto_context`
- `hooks/scripts/pre-delegation-context.sh`
