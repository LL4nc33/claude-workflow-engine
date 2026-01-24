# How-To: Ein neues Feature entwickeln

Dieser Guide führt dich durch den kompletten 5-Phasen-Workflow der Claude Workflow Engine -- von der Produktidee bis zur fertigen Implementation. Als Beispiel verwenden wir "User-Authentifizierung implementieren".

## Ziel

Nach diesem Guide hast du:

- Die Produktvision dokumentiert
- Eine technische Spezifikation erstellt
- Tasks aufgeteilt und an spezialisierte Agents delegiert
- Ein vollständig implementiertes Feature mit Tests und Dokumentation

## Voraussetzungen

- Claude Workflow Engine ist installiert (siehe [CLI-Installation](cli-installation.md))
- `workflow health` zeigt keine Fehler
- Du befindest dich im Projektverzeichnis
- Claude Code ist aktiv und erkennt die Slash Commands

## Der 5-Phasen-Workflow im Überblick

```
/workflow/plan-product --> /workflow/shape-spec --> /workflow/write-spec --> /workflow/create-tasks --> /workflow/orchestrate-tasks
```

| Phase | Command | Output |
|-------|---------|--------|
| 1 | `/workflow/plan-product` | `workflow/product/` |
| 2 | `/workflow/shape-spec` | `workflow/specs/{folder}/` |
| 3 | `/workflow/write-spec` | `spec.md` |
| 4 | `/workflow/create-tasks` | `tasks.md`, `orchestration.yml` |
| 5 | `/workflow/orchestrate-tasks` | `progress.md` |

---

## Phase 1: Produktvision definieren

**Command:** `/workflow/plan-product`

Diese Phase definiert das große Bild deines Projekts. Sie muss nur einmal pro Projekt ausgeführt werden (oder wenn sich die Produktrichtung grundlegend ändert).

### Ausführung

```
> /workflow/plan-product
```

### Interaktion mit Claude

```
Claude: Welches Problem löst dieses Produkt?
Du:     Wir brauchen ein sicheres Login-System mit OAuth2 und Session Management
        für unsere SaaS-Plattform.

Claude: Für wen ist dieses Produkt?
Du:     B2B-Kunden die ihre Teams verwalten. Admins erstellen Accounts,
        Mitarbeiter loggen sich ein.

Claude: Was macht deine Lösung einzigartig?
Du:     Multi-Tenant-fähig mit rollenbasiertem Zugriff, GDPR-konform,
        und Social Login für schnelles Onboarding.

Claude: Welchen Tech Stack verwendest du?
Du:     TypeScript, Node.js mit Express, PostgreSQL, React Frontend.
```

### Erzeugte Dateien

```
workflow/product/
  mission.md       # Problem: Sichere Authentifizierung, Zielgruppe: B2B-Teams
  roadmap.md       # MVP: Login + OAuth2, Post-Launch: MFA, SSO
  tech-stack.md    # TypeScript, Node.js, PostgreSQL, React
```

### Erwartete Ausgabe

```
Produktdokumentation erstellt in workflow/product/:
  - mission.md: Problem, Zielnutzer, Alleinstellungsmerkmal
  - roadmap.md: MVP-Features (3), Post-Launch-Features (4)
  - tech-stack.md: 4 Technologien definiert
```

### Hinweis

Wenn du bereits eine Produktvision hast, kannst du diese Phase überspringen und die Dateien manuell in `workflow/product/` anlegen.

---

## Phase 2: Anforderungen sammeln (Shape Spec)

**Command:** `/workflow/shape-spec`

**Voraussetzung:** Phase 1 abgeschlossen (Produktdokumentation existiert).

In dieser Phase sammelst du allen Kontext, der vor dem Schreiben der technischen Spezifikation benötigt wird: Visuals, Code-Referenzen, relevante Standards.

### Ausführung

```
> /workflow/shape-spec
```

### Interaktion mit Claude

```
Claude: Was bauen wir?
Du:     User-Authentifizierung mit Email/Password und Google OAuth2.
        Session Management via JWT mit Refresh Tokens.

Claude: Hast du Visuals als Referenz?
Du:     Nein, keine Mockups vorhanden.

Claude: Gibt es ähnlichen Code in dieser Codebase?
Du:     Das User-Model in src/models/user.ts hat bereits ein Schema.
        Die Middleware in src/middleware/auth.ts hat einen Placeholder.

Claude: Basierend auf dem was wir bauen, könnten diese Standards relevant sein:
        1. api/response-format - API Response Envelope
        2. api/error-handling - Error Codes und GDPR-konforme Responses
        3. database/migrations - Schema-Änderungen
        4. testing/coverage - Test-Anforderungen
        Soll ich diese einbeziehen?
Du:     Ja, alle davon.
```

### Erzeugte Dateien

```
workflow/specs/2026-01-23-1430-user-auth/
  shape.md         # Scope, Entscheidungen, Kontext
  references.md    # Code-Referenzen (user.ts, auth.ts)
  standards.md     # 4 relevante Standards (Volltext)
  plan.md          # Ausführungsplan
```

### Erwartete Ausgabe

```
Spec-Ordner erstellt: workflow/specs/2026-01-23-1430-user-auth/
  - shape.md: Scope definiert, 2 Code-Referenzen, 4 Standards
  - references.md: user.ts, auth.ts analysiert
  - standards.md: api/response-format, api/error-handling,
                  database/migrations, testing/coverage
```

---

## Phase 3: Technische Spezifikation erstellen

**Command:** `/workflow/write-spec`

**Voraussetzung:** Spec-Ordner aus Phase 2 existiert (mit `shape.md`).

Claude wandelt die gesammelten Anforderungen in eine vollständige technische Spezifikation um.

### Ausführung

```
> /workflow/write-spec
```

### Interaktion mit Claude

```
Claude: Ich habe eine Spec gefunden: 2026-01-23-1430-user-auth/
        Soll ich die technische Spezifikation dafür schreiben?
Du:     Ja.

Claude: Bevor ich die Spec schreibe, muss ich klären:
        1. Data Model: users-Tabelle mit email, password_hash, oauth_provider?
        2. API Design: POST /api/auth/login, POST /api/auth/register,
           POST /api/auth/refresh, DELETE /api/auth/logout?
        3. Token-Strategie: JWT Access (15min) + Refresh Token (7d)?
Du:     1. Ja, plus role und tenant_id Spalten.
        2. Ja, genau so.
        3. Access Token 30min, Refresh Token 30d.
```

### Erzeugte Datei

Die `spec.md` wird dem Spec-Ordner hinzugefügt mit folgender Struktur:

```markdown
# Technical Specification: User Authentication

## Overview
## Summary
## Technical Design
  ### Data Model
  ### API / Interface Design
  ### Implementation Details
  ### State Management
  ### Error Handling
## Standards Compliance
## Dependencies
## Testing Strategy
## Security Considerations
## Performance Considerations
## Migration / Rollout
## Open Questions
```

### Erwartete Ausgabe

```
spec.md erstellt in workflow/specs/2026-01-23-1430-user-auth/
  - 12 Sektionen
  - Data Model: users + sessions + oauth_tokens
  - API: 4 Endpunkte definiert
  - Testing: Unit + Integration + E2E vorgesehen
  - 2 offene Fragen markiert
```

### Quality Gate 1: Pre-Implementation

Nach dem Schreiben der Spec wird automatisch ein Quality Gate ausgeführt:

- **Architect** prüft: Architektonisch sinnvoll? Dependencies identifiziert? Tech Stack aligned?
- **Security** prüft: Keine Security-Antipatterns? Auth-Modell definiert? GDPR-konform?

```
Quality Gate 1 (Pre-Implementation): PASS
  - Architect: PASS (4/4 Checks)
  - Security: PASS (4/4 Checks)
```

---

## Phase 4: Tasks aufteilen

**Command:** `/workflow/create-tasks`

**Voraussetzung:** `spec.md` existiert im Spec-Ordner.

Die Spezifikation wird in atomare, implementierbare Tasks aufgeteilt und den passenden Agents zugewiesen.

### Ausführung

```
> /workflow/create-tasks
```

### Interaktion mit Claude

```
Claude: Ich analysiere die Spec "User Authentication"...
        Vorgeschlagene Aufteilung: 10 Tasks in 5 Phasen.

        Phase 1 - Data Layer:
          Task 1.1: DB-Schema und Migration (S, debug)
          Task 1.2: TypeScript Types und Interfaces (S, debug)
        Phase 2 - Backend:
          Task 2.1: Auth Service mit bcrypt (M, debug)
          Task 2.2: JWT Token Management (M, debug)
          Task 2.3: OAuth2 Google Integration (M, debug)
          Task 2.4: Auth Middleware (S, debug)
        Phase 3 - API:
          Task 3.1: Auth Endpoints (M, debug)
        Phase 4 - Quality:
          Task 4.1: Unit Tests (M, debug)
          Task 4.2: Integration Tests (M, debug)
          Task 4.3: Security Review (S, security)
        Phase 5 - Docs:
          Task 5.1: API-Dokumentation (S, researcher)

        Passt das?
Du:     Ja, genau so.
```

### Erzeugte Dateien

```
workflow/specs/2026-01-23-1430-user-auth/
  tasks.md            # Vollständige Task-Liste mit Acceptance Criteria
  orchestration.yml   # Maschinenlesbare Delegations-Konfiguration
```

### Beispiel aus tasks.md

```markdown
## Task 2.1: Auth Service

**Agent:** debug
**Größe:** M (2-4 Dateien)
**Abhängigkeiten:** Task 1.1, Task 1.2

**Beschreibung:**
Implementiere den AuthService mit register(), login(), logout() Methoden.
Verwende bcrypt für Password Hashing mit Cost Factor 12.

**Acceptance Criteria:**
- [ ] register() erstellt User mit gehashtem Passwort
- [ ] login() validiert Credentials und gibt Token-Paar zurück
- [ ] logout() invalidiert Refresh Token
- [ ] Alle Methoden werfen typisierte Fehler (AUTH_001 bis AUTH_005)

**Dateien:**
- src/services/auth.service.ts (erstellen)
- src/types/auth.types.ts (erweitern)
```

### Quality Gate 2: Pre-Execution

```
Quality Gate 2 (Pre-Execution): PASS
  - Architect: PASS - Tasks decken Spec-Anforderungen ab,
    Dependencies korrekt geordnet
```

---

## Phase 5: Tasks an Agents delegieren

**Command:** `/workflow/orchestrate-tasks`

**Voraussetzung:** `tasks.md` und `orchestration.yml` existieren im Spec-Ordner.

Der Orchestrator delegiert Tasks phasenweise an die zuständigen Agents und trackt den Fortschritt.

### Ausführung

```
> /workflow/orchestrate-tasks
```

### Interaktion mit Claude

```
Claude: Spec gefunden: 2026-01-23-1430-user-auth/
        10 Tasks in 5 Phasen bereit.
        Ausführungsmodus? (automatic / phase-by-phase / task-by-task / selective)
Du:     phase-by-phase

Claude: Starte Phase 1 - Data Layer...
        > Task 1.1: DB-Schema wird an debug-Agent delegiert...
          Standards injiziert: global/tech-stack, global/naming, database/migrations
        > Task 1.1: PASS - Migration erstellt, Schema valide
        > Task 1.2: TypeScript Types wird an debug-Agent delegiert...
        > Task 1.2: PASS - Interfaces generiert, konsistent mit Schema
        Phase 1 abgeschlossen. Quality Gate: PASS
        Weiter mit Phase 2?
Du:     Ja.

Claude: Starte Phase 2 - Backend...
        > Task 2.1: Auth Service wird an debug-Agent delegiert...
          Standards injiziert: global/tech-stack, global/naming,
                               api/response-format, api/error-handling
        > Task 2.1: PASS - AuthService implementiert, 5 Error Codes definiert
        > Task 2.2: JWT Token Management wird an debug-Agent delegiert...
        > Task 2.2: PASS - Token-Generierung und -Validierung implementiert
        > Task 2.3: OAuth2 Integration wird an debug-Agent delegiert...
        > Task 2.3: PASS - Google OAuth2 Flow implementiert
        > Task 2.4: Auth Middleware wird an debug-Agent delegiert...
        > Task 2.4: PASS - Middleware schützt Routen, prüft Token-Validität
        Phase 2 abgeschlossen. Quality Gate: PASS
        Weiter mit Phase 3?
Du:     Ja.
```

### Erzeugte Datei: progress.md

```markdown
# Progress: User Authentication

**Started:** 2026-01-23T14:45:00Z
**Last Updated:** 2026-01-23T15:30:00Z
**Mode:** phase-by-phase
**Health:** HEALTHY

## Status

| Task | Title | Agent | Status | Duration |
|------|-------|-------|--------|----------|
| 1.1 | DB-Schema | debug | PASS | 45s |
| 1.2 | TypeScript Types | debug | PASS | 30s |
| 2.1 | Auth Service | debug | PASS | 120s |
| 2.2 | JWT Management | debug | PASS | 90s |
| 2.3 | OAuth2 Google | debug | PASS | 150s |
| 2.4 | Auth Middleware | debug | PASS | 60s |
| 3.1 | Auth Endpoints | debug | PASS | 100s |
| 4.1 | Unit Tests | debug | PASS | 180s |
| 4.2 | Integration Tests | debug | PASS | 200s |
| 4.3 | Security Review | security | PASS | 90s |
| 5.1 | API-Dokumentation | researcher | PASS | 60s |

## Quality Gates

| Gate | Status |
|------|--------|
| Gate 1: Pre-Implementation | PASS |
| Gate 2: Pre-Execution | PASS |
| Gate 3: Post-Phase (5/5) | PASS |
| Gate 4: Final Acceptance | PASS |
```

### Quality Gate 4: Final Acceptance

Am Ende laufen automatisch die finalen Checks:

- **Security Agent:** Keine neuen Vulnerabilities, Secrets nicht exponiert, GDPR-konform
- **Architect Agent:** Implementation passt zur Spec, keine Architectural Drift
- **User:** Acceptance Criteria erfüllt

---

## Ergebnis

Nach Abschluss aller 5 Phasen hast du:

| Artefakt | Pfad |
|----------|------|
| Produktvision | `workflow/product/mission.md`, `roadmap.md`, `tech-stack.md` |
| Spezifikation | `workflow/specs/2026-01-23-1430-user-auth/spec.md` |
| Task-Aufteilung | `workflow/specs/2026-01-23-1430-user-auth/tasks.md` |
| Fortschritts-Log | `workflow/specs/2026-01-23-1430-user-auth/progress.md` |
| Implementation | `src/services/`, `src/middleware/`, `src/routes/` |
| Tests | `tests/unit/auth/`, `tests/integration/auth/` |
| API-Doku | `docs/api/auth.md` |

## Nächste Schritte

- **Weiteres Feature?** Starte wieder bei Phase 2 (`/workflow/shape-spec`) -- die Produktvision bleibt bestehen.
- **Standards anpassen?** Siehe [Standards erweitern](standards-erweitern.md).
- **Eigene Agents?** Siehe [Eigenen Agent erstellen](eigenen-agent-erstellen.md).
- **Phasen überspringen?** Du kannst jederzeit bei einer späteren Phase einsteigen, solange die Voraussetzungen erfüllt sind.

## Tipps

- Verwende beim ersten Mal den `phase-by-phase`-Modus um den Flow zu verstehen
- Phase 2 (shape-spec) ist die wertvollste Phase zur Vermeidung von Scope Creep
- Die `progress.md` dient als Audit Trail -- prüfe sie wenn etwas schiefgeht
- Jede Phase ist idempotent: erneutes Ausführen überschreibt vorherige Ergebnisse
- Standards werden als Volltext in Delegations-Prompts injiziert (Agents können keine Datei-Referenzen lesen)

## Siehe auch

- [Workflow-Referenz](../workflow.md) -- Detaillierte Beschreibung jeder Phase
- [Agenten-Übersicht](../agenten.md) -- Welcher Agent welchen Task-Typ bearbeitet
- [Standards](../standards.md) -- Wie Standards während der Orchestration injiziert werden
- [CLI-Referenz](../cli.md) -- Alle CLI-Commands
