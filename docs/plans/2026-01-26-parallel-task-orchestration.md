# Parallel Task Orchestration

> **For Claude:** Use superpowers:executing-plans to implement this plan.

**Goal:** Task-weise parallele Delegation statt Batch an einen Agent.

---

## Overview

```
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Task 1  │  │ Task 2  │  │ Task 3  │   Wave 1 (parallel, max 3)
│ builder │  │ devops  │  │ builder │
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┼────────────┘
                  ▼
           ┌─────────────┐
           │   Task 4    │              Wave 2 (blocked by 1-3)
           │   quality   │
           └─────────────┘
```

**Kernprinzip:**
1. Tasks kommen aus TodoWrite (nicht tasks.md)
2. Agent wird pro Task bestimmt (explicit > auto-detect)
3. Max 3 Tasks parallel pro Wave
4. Dependencies via `blockedBy`

---

## Task 1: Add agent field to TaskCreate

Erweitere Task-Erstellung um optionales `agent` Feld in metadata.

**Änderungen:**
- `plugin-dist/commands/start.md` - Bei Task-Erstellung `metadata.agent` setzen wenn erkannt
- `plugin-dist/CLAUDE.md` - Dokumentiere agent-Feld

**Beispiel:**
```javascript
TaskCreate({
  subject: "Implement login API",
  description: "...",
  metadata: { agent: "builder" }  // explicit
})
```

---

## Task 2: Create agent auto-detection logic

Keywords → Agent Mapping für auto-detect fallback.

**Datei:** `plugin-dist/skills/agent-detection/SKILL.md`

**Mapping:**
```
fix|bug|implement|build|feature → builder
test|coverage|quality|validate → quality
deploy|docker|ci|cd|release → devops
security|audit|vulnerability|owasp → security
explain|how|why|what → explainer
design|architecture|adr|api design → architect
document|analyze|research → researcher
brainstorm|idea|alternative → innovator
process|workflow|improve → guide
```

**Fallback:** builder (wenn nichts matcht)

---

## Task 3: Implement wave-based parallel execution

Neue Logik in `/cwe:start` für Build-Phase.

**Algorithmus:**
```
1. TaskList() - alle pending Tasks holen
2. Filter: Tasks ohne blockedBy (oder alle blockedBy completed)
3. Sortiere nach Priorität (metadata.priority falls vorhanden)
4. Nimm max 3 Tasks
5. Für jeden Task parallel:
   - TaskUpdate(status: in_progress)
   - Bestimme Agent (metadata.agent || auto-detect)
   - Task tool mit subagent_type
6. Warte auf alle 3
7. TaskUpdate(status: completed) für erfolgreiche
8. Repeat bis keine pending Tasks mehr
```

**Änderungen:**
- `plugin-dist/commands/start.md` - Wave-Logik für Build-Phase

---

## Task 4: Update CLAUDE.md with orchestration docs

Dokumentiere das neue Verhalten.

**Sektion hinzufügen:**
```markdown
## Parallel Task Orchestration

Tasks werden wave-weise parallel ausgeführt:
- Max 3 Tasks gleichzeitig
- Dependencies via `blockedBy` respektiert
- Agent pro Task: `metadata.agent` > auto-detect > builder

### Agent Auto-Detection
| Keywords | Agent |
|----------|-------|
| fix, bug, implement | builder |
| test, coverage | quality |
| deploy, docker, ci | devops |
| ... | ... |
```

---

## Task 5: Test with example workflow

Manueller Test:

```bash
# 1. Init neues Projekt
/cwe:init

# 2. Tasks erstellen
TaskCreate({ subject: "Setup Docker", metadata: { agent: "devops" } })
TaskCreate({ subject: "Implement API", metadata: { agent: "builder" } })
TaskCreate({ subject: "Write tests", blockedBy: ["2"], metadata: { agent: "quality" } })

# 3. Start - sollte Wave 1 (Task 1+2 parallel), dann Wave 2 (Task 3)
/cwe:start
```

**Erwartetes Verhalten:**
- Task 1 + 2 starten parallel (verschiedene Agents)
- Task 3 wartet bis Task 2 fertig

---

## Summary

| Task | Beschreibung | Dateien |
|------|--------------|---------|
| 1 | Agent-Feld in Tasks | start.md, CLAUDE.md |
| 2 | Auto-Detection Skill | skills/agent-detection/SKILL.md |
| 3 | Wave-Execution Logik | start.md |
| 4 | Dokumentation | CLAUDE.md |
| 5 | Manueller Test | - |

**Ergebnis:** Intelligente parallele Task-Orchestration mit Agent-Spezialisierung.
