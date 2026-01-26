---
name: cwe-principles
description: >
  CWE Grundprinzipien - Use PROACTIVELY at session start or when unsure about
  workflow, delegation, gates, or how components interact. Core operating manual.
---

# CWE Grundprinzipien

## 7 Kern-Prinzipien

| # | Prinzip | Enforcement | Autonomer Trigger |
|---|---------|-------------|-------------------|
| 1 | Agent-First | Hook (warn/block) | PreToolUse auf Write/Edit |
| 2 | Auto-Delegation | Skill | User-Intent erkannt |
| 3 | 5-Phase Workflow | Commands | Expliziter /workflow:* oder smart-workflow |
| 4 | Quality Gates | Hook + Skill | PreToolUse auf Skill (workflow commands) |
| 5 | Standards Injection | Config | Bei Delegation automatisch |
| 6 | Context Isolation | Platform | Task tool = isolierter Context |
| 7 | NaNo Learning | Hooks | PostToolUse(Task), Stop |

## Wie CWE dir Arbeit abnimmt

```
User sagt etwas
    ↓
[SessionStart Hook] → Context + Warnings injiziert
    ↓
[Auto-Delegation Skill] → Intent erkannt? → Agent delegiert
    ↓
[Standards Injection] → Relevante Standards automatisch
    ↓
[Quality Gates] → Blockiert wenn Gate pending
    ↓
[NaNo] → Beobachtet, lernt, schlaegt vor
```

## Wann welcher Skill/Hook aktiv wird

| Situation | Komponente | Was passiert |
|-----------|------------|--------------|
| Session startet | SessionStart Hook | Context, Warnings, Gate-Status |
| User will coden | auto-delegation Skill | → builder delegiert |
| User will planen | planning Skill | → EnterPlanMode |
| User will erklaeren | auto-delegation Skill | → explainer delegiert |
| File Write/Edit | pre-write-validate Hook | Agent-First check |
| /workflow:create-tasks | gate-check Hook | Gate 1 required |
| /workflow:orchestrate-tasks | gate-check Hook | Gate 2 required |
| Task delegiert | PostToolUse Hook | NaNo beobachtet |
| Session endet | Stop Hook | NaNo analysiert |

## Token-Optimierung

CWE spart Tokens durch:

1. **TOON Format** - JSON → TOON (~40% kleiner)
2. **Context Isolation** - Agent-Arbeit bleibt isoliert
3. **Selective Injection** - Nur relevante Standards
4. **Kompakte Skills** - Quick Reference statt Prosa

## Autonomes Verhalten

### Das System macht automatisch:

- Gate-Status pruefen vor workflow commands
- Warnen bei Code-Writes ausserhalb erlaubter Pfade
- Standards matchen basierend auf Task-Keywords
- Delegations-Patterns beobachten und lernen
- Evolution-Candidates generieren bei Threshold

### Der User muss nur:

- Intent klar formulieren ("fix Bug", "erklaer mir X")
- Bei Unklarheit: Frage beantworten
- Evolution-Candidates reviewen (optional)
- Quality Gates bestätigen (bei Failure)

## Quick Reference

```
Coden      → builder (automatisch)
Erklaeren  → explainer (automatisch)
Planen     → EnterPlanMode (automatisch)
Deployen   → devops (automatisch)
Auditieren → security (automatisch)

Gate 1 → nach write-spec (architect + security)
Gate 2 → nach create-tasks (architect + quality)
Gate 3 → nach jeder Phase (automatisch)
Gate 4 → am Ende (security + architect + user)
```

## Fehlerbehandlung

| Problem | Loesung |
|---------|---------|
| Gate blockiert | Review durchfuehren oder Override |
| Hook timeout | Siehe ERROR-RECOVERY.md |
| NaNo nicht aktiv | /workflow:nano-toggle |
| Falscher Agent | "manuell" oder expliziter /agent command |

## Harmonisches Zusammenspiel

```
┌────────────────────────────────────────────────────────────────┐
│                    USER INTERAKTION                             │
│  "fix Bug" / "erklaer mir X" / "plane Feature" / "Idee!"       │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ AUTONOME ERKENNUNG (Skills via Description-Keywords)           │
│                                                                 │
│  Intent erkannt?                                                │
│  ├─ Code-Arbeit    → auto-delegation → builder                 │
│  ├─ Erklaerung     → auto-delegation → explainer               │
│  ├─ Planung        → planning → EnterPlanMode                  │
│  ├─ Security       → auto-delegation → security                │
│  └─ Idee           → /workflow:nano-idea → NaNo speichert      │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ ENFORCEMENT (Hooks)                                             │
│                                                                 │
│  PreToolUse:                                                    │
│  ├─ Write/Edit → Agent-First Check (warn/block/off)            │
│  └─ Skill      → Gate-Check (blockiert wenn Gate pending)      │
│                                                                 │
│  PostToolUse:                                                   │
│  ├─ Task       → NaNo beobachtet Delegation                    │
│  └─ Write/Edit → Logging bei Orchestration                     │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│ LERNEN & VERBESSERN (NaNo)                                      │
│                                                                 │
│  Beobachtungen → Patterns → Evolution Candidates → Review      │
│                                                                 │
│  Was NaNo trackt:                                               │
│  ├─ Delegations (welcher Agent fuer welchen Task)              │
│  ├─ Standards (welche werden oft gebraucht)                    │
│  ├─ Quality Gates (pass/fail Patterns)                         │
│  └─ Ideen (User-Input fuer Verbesserungen)                     │
│                                                                 │
│  Bei Threshold → Vorschlag generieren:                         │
│  ├─ Neuer Standard                                              │
│  ├─ Config-Aenderung in orchestration.yml                      │
│  └─ Projekt-spezifischer Skill/Hook                            │
└────────────────────────────────────────────────────────────────┘

## Intuitiver User-Flow

1. **Sag einfach was du willst** - CWE erkennt den Intent
2. **Lass dich fuehren** - Bei Unklarheit fragt CWE nach (max 2 Fragen)
3. **Arbeit wird delegiert** - Agent arbeitet isoliert
4. **Ergebnis kommt zurueck** - Kompakte Summary, nicht voller Context
5. **Ideen werden gesammelt** - /workflow:nano-idea oder einfach erwaehnen
6. **System lernt mit** - NaNo beobachtet und schlaegt vor

## Token-Sparen

- TOON statt JSON (~40% kleiner)
- Selective Standards (nur relevante)
- Context Isolation (Agent-Arbeit bleibt beim Agent)
- Kompakte Skills (Tabellen statt Prosa)
- Incremental Analysis (nur neue Sessions)
