---
description: Idee sammeln fuer zukuenftige Vorschlaege
interactive: true
allowed_tools:
  - Bash
  - AskUserQuestion
---

# NaNo Idea Collector

Sammle Ideen, Insights und Verbesserungsvorschlaege fuer das Projekt.

## Kategorien

| Kategorie | Fuer... |
|-----------|---------|
| feature | Neue Features, Funktionalitaet |
| optimization | Performance, Token-Sparen, Effizienz |
| pattern | Wiederkehrende Muster, Best Practices |
| tooling | Tools, Scripts, Automation |
| workflow | Workflow-Verbesserungen, Prozesse |
| other | Alles andere |

## Ausfuehrung

1. Falls keine Kategorie angegeben, frage den User:

```
AskUserQuestion: "Welche Kategorie passt am besten?"
Options: feature, optimization, pattern, tooling, workflow, other
```

2. Falls kein Inhalt angegeben, frage:

```
AskUserQuestion: "Was ist deine Idee?"
(Freitext)
```

3. Speichere via:

```bash
$CLAUDE_PROJECT_DIR/hooks/scripts/nano-observer.sh idea <category> "<content>"
```

4. Bestaetigung:

```
Idee gespeichert in workflow/nano/ideas/<category>/
Bei 3+ Ideen in einer Kategorie wird ein Evolution-Candidate generiert.
```

## Beispiele

```
/workflow:nano-idea feature "API Rate-Limiting einbauen"
/workflow:nano-idea optimization "Standards-Cache zwischen Sessions"
/workflow:nano-idea  # Interaktiv
```
