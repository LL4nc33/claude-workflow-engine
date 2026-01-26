---
name: quality-gates
description: >
  Use PROACTIVELY when: completing tasks, before merging, after implementation,
  checking acceptance criteria. Provides quality gate checkpoints.
---

# Quality Gates Skill

Dieses Skill stellt Quality Gate Checklisten fuer kritische Workflow-Uebergaenge bereit.

## 4-Gate Architektur

```
/write-spec → [Gate 1] → /create-tasks → [Gate 2] → /orchestrate-tasks → [Gate 3] → Complete → [Gate 4]
```

## Gate 1: Pre-Implementation

**Trigger:** Nach `/write-spec`, vor `/create-tasks`

**Reviewer:** architect, security

### Checkliste

- [ ] Spec ist architektonisch sinnvoll
- [ ] Abhaengigkeiten sind identifiziert
- [ ] Tech-Stack ist aligned
- [ ] Scope ist realistisch
- [ ] Keine Security-Antipatterns
- [ ] Auth-Modell definiert (falls relevant)
- [ ] Datenfluss GDPR-konform
- [ ] Threat-Model beruecksichtigt

### Bei Failure

1. Pause und Report an User
2. User kann Override bestaetigen
3. Oder: Spec ueberarbeiten

---

## Gate 2: Pre-Execution

**Trigger:** Nach `/create-tasks`, vor `/orchestrate-tasks`

**Reviewer:** architect

### Checkliste

- [ ] Tasks decken alle Spec-Requirements ab
- [ ] Abhaengigkeiten korrekt geordnet
- [ ] Agent-Zuweisungen sind passend
- [ ] Kein Scope-Creep
- [ ] Tasks sind klein genug (1-2 Stunden)
- [ ] Akzeptanzkriterien sind testbar

### Bei Failure

1. Pause und Report an User
2. Tasks ueberarbeiten
3. Oder: User Override

---

## Gate 3: Post-Phase

**Trigger:** Nach jeder Orchestrierungs-Phase

**Checks pro Layer:**

### Data Layer
- [ ] Schema valide
- [ ] Typen konsistent
- [ ] Migrations reversibel

### API Layer
- [ ] Endpoints dokumentiert
- [ ] Error-Handling vorhanden
- [ ] Standards-konform
- [ ] Response-Format korrekt

### Frontend Layer
- [ ] Components typisiert
- [ ] State gemanaged
- [ ] Basis-Accessibility
- [ ] Naming-Conventions befolgt

### Testing Layer
- [ ] Coverage >= 80%
- [ ] Edge-Cases abgedeckt
- [ ] Integration-Tests passing
- [ ] Keine flaky Tests

### Infrastructure Layer
- [ ] IaC valide (terraform validate / docker build --check)
- [ ] Security gescannt
- [ ] EU-Compliance verifiziert
- [ ] Rollback-Path definiert

### Bei Failure

1. Phase wiederholen (max 1x)
2. Dann: Pause und Report

---

## Gate 4: Final Acceptance

**Trigger:** Nach Abschluss aller Orchestrierungs-Phasen

**Reviewer:** security, architect, user

### Security Checks
- [ ] Keine neuen Vulnerabilities
- [ ] Secrets nicht exponiert
- [ ] Dependency CVEs addressed
- [ ] GDPR-Compliance verifiziert

### Architect Checks
- [ ] Implementation matches Spec
- [ ] Keine architektonische Drift
- [ ] Standards befolgt
- [ ] Dokumentation komplett

### User Checks
- [ ] Akzeptanzkriterien erfuellt
- [ ] Manuelles Review abgeschlossen

### Bei Failure

1. Remediation-Tasks erstellen
2. Main Chat koordiniert Fixes
3. Gate erneut durchlaufen

---

## Gate-Status pruefen

### Via SessionStart Hook

Der Hook zeigt pending Gates:
```
Quality Gate 2 (Pre-Execution) pending.
```

### Via State-Marker

Gate-Marker werden gespeichert in `.claude/state/gates/`:
- `gate1_passed`
- `gate2_passed`
- etc.

### Manuelles Pruefen

```
/workflow:quality-gates check
```

## Quick Reference

| Gate | Wann | Wer reviewed | Blockiert? |
|------|------|--------------|------------|
| 1 | Nach write-spec | architect, security | Ja |
| 2 | Nach create-tasks | architect | Ja |
| 3 | Nach jeder Phase | (automatisch) | Ja |
| 4 | Am Ende | security, architect, user | Ja |
