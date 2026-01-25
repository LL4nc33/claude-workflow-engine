---
name: nano-learning
description: NaNo Learning System - projektbasiertes Pattern-Lernsystem. Verwende bei learning, pattern, evolution, observation, nano, standards-improvement
---

# NaNo Learning System

Projektbasiertes Lernsystem das Entwicklungspatterns automatisch erkennt
und in Standards/Workflows ueberfuehrt. Benannt nach Nala & Nino.

**Credits:** Basiert auf [Homunculus](https://github.com/humanplane/homunculus) by humanplane.
Adaptiert von personal-learning zu project-learning.

## Architektur

```
Observation (Hook Events) → Pattern Recognition → Evolution Candidates → Manual Promotion
```

### Dateienstruktur

```
workflow/nano/
├── observations/          # Session-scoped TOON files
│   └── session-{id}.toon
├── patterns/              # Erkannte wiederkehrende Muster
│   ├── delegation-patterns.md
│   ├── quality-patterns.md
│   └── standards-usage.md
├── evolution/             # Standards-Evolution
│   ├── candidates/        # Pending manual review
│   └── evolution-log.md   # Promotion-Historie
└── config/
    └── pattern-rules.yml  # Erkennungsregeln
```

## Hook-Integration

| Event | Trigger | Was wird beobachtet | Performance |
|-------|---------|---------------------|-------------|
| PostToolUse (Task) | Agent-Delegation | agent_type, task_group | flock-atomic, O(1) counter |
| Stop | Session-Ende | Incremental Pattern-Analyse | Nur neue Sessions |
| SessionStart | Session-Start | Background-Analyse, Candidate-Notification | Non-blocking, cached |

## Konfiguration

In `.claude/nano.local.md` (gitignored):

```yaml
---
enabled: true
observation_level: medium     # minimal, medium, comprehensive
pattern_detection_threshold: 3
auto_evolution: false         # manual review required
max_session_observations: 1000
cleanup_after_days: 30
---
```

## Commands

| Command | Funktion |
|---------|----------|
| `/workflow:homunculus-status` | Actionable Status mit Insights und Quick-Actions |
| `/workflow:nano-toggle` | Ein/Ausschalten + First-Run Setup |
| `/workflow:nano-session` | Aktuelle Session-Observations anzeigen |
| `/workflow:nano-config` | Interaktive Konfiguration (Level, Threshold, Focus) |
| `/workflow:nano-reset` | Daten zuruecksetzen (mit Confirmation) |
| `/workflow:review-candidates` | Interaktives Review von Evolution-Candidates |
| `/workflow:learning-report` | Umfassender Analyse-Report |

## TOON Observation Format

Session-Dateien nutzen TOON fuer Token-Effizienz:

```
session: 20250124-143022
started: 2025-01-24T14:30:22+01:00
level: medium
count: 3
observations:
  2025-01-24T14:30:45+01:00 | delegation | agent=builder,task_group=implementation
  2025-01-24T14:31:12+01:00 | delegation | agent=architect,task_group=architecture
  2025-01-24T14:35:00+01:00 | quality | gate=gate_1,result=pass
```

## Pattern Detection

Patterns werden erkannt wenn:
- Gleiche agent-task_group Kombination >= `pattern_detection_threshold` mal auftritt
- Quality Gate Failures sich wiederholen
- Standards-Injektionen mit bestimmten Outcomes korrelieren

## Evolution Workflow

1. Pattern ueberschreitet Threshold → Candidate wird generiert
2. User reviewt via `/workflow:review-candidates`
3. Bei Approval → Aenderung in `orchestration.yml` oder neuer Standard
4. Logging in `evolution-log.md` fuer Auditierbarkeit

## Integration mit Smart-Workflow

Der Smart-Workflow zeigt optional den Learning-Status an,
wenn NaNo aktiviert ist. Dies erfolgt ueber die
`get_learning_status` Funktion in `common.sh`.

## GDPR Compliance

- Alle Daten lokal (kein Cloud-Sync)
- Automatic Cleanup nach `cleanup_after_days`
- Keine Code-Fragmente gespeichert
- Keine PII in Observations
- `.local.md` Config ist gitignored
