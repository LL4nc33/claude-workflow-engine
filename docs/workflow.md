# Workflow Guide

Die Claude Workflow Engine verwendet einen 5-Phasen-Workflow, der dich von der Produktidee bis zum implementierten Feature führt. Jede Phase baut auf der vorherigen auf und erzeugt spezifische Artefakte.

```
/plan-product --> /shape-spec --> /write-spec --> /create-tasks --> /orchestrate-tasks
```

## Übersicht

| Phase | Command | Was es tut | Output |
|-------|---------|-----------|--------|
| 1 | `/workflow/plan-product` | Produktvision definieren | `workflow/product/` |
| 2 | `/workflow/shape-spec` | Anforderungen sammeln | `workflow/specs/{folder}/` |
| 3 | `/workflow/write-spec` | Technische Spezifikation | `spec.md` |
| 4 | `/workflow/create-tasks` | Task-Aufteilung | `tasks.md`, `orchestration.yml` |
| 5 | `/workflow/orchestrate-tasks` | Agent-Delegation | `progress.md` |

## Phase 1: Plan Product

**Command:** `/workflow/plan-product`

**Zweck:** Die grundlegende Produktdokumentation erstellen. Diese Phase muss nur einmal pro Projekt ausgeführt werden (oder wenn sich die Produktrichtung ändert).

**Was passiert:**

1. Claude fragt nach dem Problem deines Produkts, den Zielnutzern und dem Alleinstellungsmerkmal
2. Du beschreibst deine MVP-Features und Post-Launch-Pläne
3. Du gibst den Tech Stack an (oder bestätigst den vorgeschlagenen)
4. Drei Dateien werden in `workflow/product/` erstellt

**Output-Dateien:**

| Datei | Inhalt |
|-------|--------|
| `mission.md` | Problem, Zielnutzer, einzigartige Lösung |
| `roadmap.md` | MVP-Features, Post-Launch-Features |
| `tech-stack.md` | Frontend, Backend, Datenbank, weitere Tools |

**Beispiel-Interaktion:**

```
> /workflow/plan-product

Claude: Welches Problem loest dieses Produkt?
Du:     Wir brauchen ein Dashboard zur Echtzeit-Überwachung von IoT-Sensordaten.

Claude: Für wen ist dieses Produkt?
Du:     Operations Engineers in Fertigungsanlagen.

Claude: Was macht deine Lösung einzigartig?
Du:     Prädiktive Alerts basierend auf historischen Mustern, nicht nur Schwellenwerten.
```

**Erwartete Ausgabe:**

```
workflow/product/
  mission.md       # Problem: IoT-Monitoring, Zielgruppe: Ops Engineers
  roadmap.md       # MVP: Dashboard + Alerts, Post-Launch: ML-Modelle
  tech-stack.md    # React, Node.js, TimescaleDB, MQTT
```

**Wann erneut ausführen:** Wenn sich die Produktrichtung grundlegend ändert. Du kannst einzelne Dateien auch manuell aktualisieren.

## Phase 2: Shape Spec

**Command:** `/workflow/shape-spec`

**Voraussetzung:** Phase 1 muss abgeschlossen sein (Produktdokumentation existiert). Du musst dich im Plan Mode befinden.

**Zweck:** Allen Kontext sammeln, der vor dem Schreiben einer technischen Spezifikation benötigt wird. Das ist die "erst denken, dann coden"-Phase.

**Was passiert:**

1. Du beschreibst, was du bauen willst
2. Claude fragt nach Visuals (Mockups, Screenshots, Beispiele)
3. Du verweist auf Reference Implementations in der Codebase
4. Claude identifiziert relevante Standards aus `workflow/standards/`
5. Ein Spec-Ordner wird mit strukturierten Planungsdokumenten erstellt

**Output-Dateien:**

```
workflow/specs/2026-01-23-1430-sensor-dashboard/
  plan.md          # Der vollständige Ausführungsplan
  shape.md         # Scope, Entscheidungen, Kontext
  standards.md     # Vollständiger Inhalt anwendbarer Standards
  references.md    # Verweise auf ähnlichen Code
  visuals/         # Mockups falls bereitgestellt
```

**Was shape.md erfasst:**

- Was du baust (Scope)
- Getroffene Entscheidungen während des Shapings
- Visuelle Referenzen
- Untersuchte Code-Referenzen
- Produkt-Alignment-Notizen
- Welche Standards gelten und warum

**Beispiel-Interaktion:**

```
> /workflow/shape-spec

Claude: Was bauen wir?
Du:     Eine Echtzeit-Sensordaten-Chart-Komponente mit 5-Minuten Rolling Window.

Claude: Hast du Visuals als Referenz?
Du:     Schau dir docs/mockups/chart-widget.png an.

Claude: Gibt es ähnlichen Code in dieser Codebase?
Du:     Das Notifications Panel in src/features/notifications/ macht Echtzeit-Updates.

Claude: Basierend auf dem was wir bauen, koennten diese Standards relevant sein:
        1. frontend/components - UI-Komponentenstruktur
        2. api/response-format - API Response Envelope
        Soll ich diese einbeziehen? (ja / anpassen)
Du:     ja
```

**Erwartete Ausgabe:**

```
Spec-Ordner erstellt: workflow/specs/2026-01-23-1430-sensor-dashboard/
  - shape.md: Scope, 3 Entscheidungen, 2 Standards
  - references.md: 1 Code-Referenz (notifications/)
  - standards.md: frontend/components + api/response-format
  - visuals/: 1 Mockup verlinkt
```

## Phase 3: Write Spec

**Command:** `/workflow/write-spec`

**Voraussetzung:** Ein Spec-Ordner muss aus Phase 2 existieren (mit `shape.md`).

**Zweck:** Die geformten Anforderungen in eine eindeutige technische Spezifikation umwandeln, von der Agents implementieren können.

**Was passiert:**

1. Claude liest Shape, References und Standards
2. Du bestätigst oder passt technische Schlüsselentscheidungen an (Data Model, API Design, State Management)
3. Eine vollständige `spec.md` wird generiert

**Output-Datei:** `spec.md` wird dem Spec-Ordner hinzugefügt.

**Spec-Struktur:**

```markdown
# Technical Specification: {Feature Name}

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

**Beispiel-Interaktion:**

```
> /workflow/write-spec

Claude: Ich habe eine Spec gefunden: 2026-01-23-1430-sensor-dashboard/
        Soll ich die technische Spezifikation dafür schreiben?
Du:     ja

Claude: Bevor ich die Spec schreibe, muss ich klären:
        1. Data Model: WebSocket-Stream mit 5-Min Ring Buffer? (ja / Alternative)
        2. API Design: GET /api/sensors/:id/stream via SSE? (ja / Alternative)
Du:     1. ja, 2. WebSocket statt SSE verwenden
```

**Erwartete Ausgabe:**

```
spec.md erstellt in workflow/specs/2026-01-23-1430-sensor-dashboard/
  - 12 Sektionen
  - Data Model: WebSocket + Ring Buffer
  - API: WebSocket-Endpunkt /ws/sensors/:id
  - 3 offene Fragen zur Klärung markiert
```

## Phase 4: Create Tasks

**Command:** `/workflow/create-tasks`

**Voraussetzung:** `spec.md` muss im Spec-Ordner existieren.

**Zweck:** Die Spezifikation in atomare, implementierbare Tasks aufteilen, die an spezialisierte Agents delegiert werden können.

**Was passiert:**

1. Claude analysiert die Spec und identifiziert Task-Gruppen
2. Du bestätigst die Aufteilungsstruktur
3. Jeder Task erhaelt: Beschreibung, Agent-Zuweisung, Abhaengigkeiten, Acceptance Criteria und Dateiliste
4. Eine Ausführungsreihenfolge (Critical Path) wird berechnet
5. Eine spec-spezifische `orchestration.yml` wird für die Delegation generiert

**Output-Dateien:**

| Datei | Zweck |
|-------|-------|
| `tasks.md` | Vollstaendige Task-Liste mit Acceptance Criteria |
| `orchestration.yml` | Maschinenlesbare Delegations-Konfiguration |

**Task-Größen:**

| Größe | Scope |
|---------|-------|
| S | Einzelne Datei, einfache Logik |
| M | 2-4 Dateien, moderate Komplexität |
| L | 5+ Dateien, komplexe Logik |

**Agent-Mapping:**

| Task-Typ | Zugewiesener Agent |
|----------|-------------------|
| backend, frontend, testing, database | debug |
| security | security |
| infrastructure, ci_cd | devops |
| architecture, review | architect |
| documentation | researcher |
| explanation | ask |

**Beispiel-Interaktion:**

```
> /workflow/create-tasks

Claude: Ich analysiere die Spec "Sensor Dashboard"...
        Vorgeschlagene Aufteilung: 12 Tasks in 4 Gruppen.
        Soll ich die Details zeigen? (ja / anpassen)
Du:     ja

Claude: Phase 1 - Foundation:
          Task 1.1: DB-Schema (S, debug)
          Task 1.2: TypeScript Types (S, debug)
        Phase 2 - Backend:
          Task 2.1: WebSocket Handler (M, debug)
          Task 2.2: API Endpoint (M, debug)
        Phase 3 - Frontend:
          Task 3.1: Chart-Komponente (M, debug)
          Task 3.2: State Management (M, debug)
        Phase 4 - Quality:
          Task 4.1: Unit Tests (M, debug)
          Task 4.2: Integration Tests (M, debug)
          Task 4.3: Security Review (S, security)
        Phase 5 - Docs:
          Task 5.1: API-Dokumentation (S, researcher)
        Passt das? (ja / anpassen)
Du:     ja
```

**Erwartete Ausgabe:**

```
Task-Aufteilung abgeschlossen:
  - 12 Tasks in 4 Gruppen
  - 5 Ausführungsphasen
  - Geschaetzter Aufwand: M

Phase 1: Task 1.1 (Schema), Task 1.2 (Types)
Phase 2: Task 2.1 (WebSocket Handler), Task 2.2 (API Endpoint)
Phase 3: Task 3.1 (Chart-Komponente), Task 3.2 (State Management)
Phase 4: Task 4.1 (Unit Tests), Task 4.2 (Integration Tests)
Phase 5: Task 5.1 (Dokumentation)
```

## Phase 5: Orchestrate Tasks

**Command:** `/workflow/orchestrate-tasks`

**Voraussetzung:** `tasks.md` und `orchestration.yml` müssen im Spec-Ordner existieren.

**Zweck:** Tasks an spezialisierte Agents delegieren, Fortschritt tracken und Quality Gates durchsetzen.

**Was passiert:**

1. Du wählst einen Ausführungsmodus
2. Tasks werden phasenweise an die zustaendigen Agents delegiert
3. Jede Delegation enthaelt: Task-Beschreibung, relevante Standards (inline injiziert), Spec-Kontext und Acceptance Criteria
4. Nach jedem Task wird der Output gegen die Acceptance Criteria verifiziert
5. Quality Gates laufen bei Phasenübergängen
6. Fortschritt wird in `progress.md` getrackt

**Ausführungsmodi:**

| Modus | Verhalten |
|-------|-----------|
| automatic | Alle Phasen ausführen, nur bei Fehlern pausieren |
| phase-by-phase | Nach jeder Phase bestätigen (Standard) |
| task-by-task | Nach jedem einzelnen Task bestätigen |
| selective | Bestimmte Tasks zur Ausführung auswählen |

**Quality Gates:**

Die Orchestration erzwingt 4 Quality Gates:

1. **Pre-Implementation** (nach write-spec): Architect + Security prüfen die Spec
2. **Pre-Execution** (nach create-tasks): Architect verifiziert Task-Abdeckung
3. **Post-Phase** (nach jeder Phase): Phasenspezifische Checks (Schema valide, Tests bestehen, etc.)
4. **Final Acceptance** (nach allen Phasen): Security Scan + Architecture Review + User Sign-off

Gate-Ergebnisse: `PASS` (weiter), `WARN` (loggen und fortfahren), `BLOCK` (stoppen und berichten).

**Fehlerbehandlung:**

Wenn ein Task fehlschlägt:
1. Retry mit zusätzlichem Kontext (bis zu 2 Retries)
2. Retry mit umformulierten Instruktionen
3. Eskalation an den User mit Diagnostik

**Beispiel-Interaktion:**

```
> /workflow/orchestrate-tasks

Claude: Spec gefunden: 2026-01-23-1430-sensor-dashboard/
        12 Tasks in 5 Phasen bereit.
        Ausführungsmodus? (automatic / phase-by-phase / task-by-task / selective)
Du:     phase-by-phase

Claude: Starte Phase 1 - Foundation...
        > Task 1.1: DB-Schema wird an debug-Agent delegiert...
        > Task 1.1: PASS - Schema erstellt, Migration lauffaehig
        > Task 1.2: TypeScript Types wird an debug-Agent delegiert...
        > Task 1.2: PASS - Types generiert, konsistent mit Schema
        Phase 1 abgeschlossen. Quality Gate: PASS
        Weiter mit Phase 2? (ja / stopp / details)
Du:     ja
```

**Hook-Verhalten während der Orchestrierung:**

- **PreToolUse Hook:** Jeder Write/Edit-Aufruf wird gegen Secrets-Patterns geprüft. Schreibzugriffe auf `.env`, `credentials.*`, `secrets.*` und `*.local.md` werden automatisch blockiert.
- **PostToolUse Hook:** Bei aktiver Orchestrierung (Spec mit `in-progress` Status) werden alle Dateiänderungen in `delegation.log` protokolliert (nur Dateiname + Zeitstempel, GDPR-konform).

**Output-Datei:** `progress.md` im Spec-Ordner, wird kontinuierlich aktualisiert.

**Erwartete Ausgabe (progress.md):**

```markdown
# Progress: Sensor Dashboard

## Status: In Ausführung (Phase 2/5)

| Task | Agent | Status | Dauer |
|------|-------|--------|-------|
| 1.1 Schema | debug | PASS | 45s |
| 1.2 Types | debug | PASS | 30s |
| 2.1 WebSocket | debug | IN_PROGRESS | - |
| 2.2 API | debug | PENDING | - |
```

## Phasen überspringen

Du musst nicht jede Phase jedes Mal ausführen:

- **Produktvision existiert bereits?** Überspringe Phase 1.
- **Du weisst genau was du bauen willst?** Starte bei Phase 3 (erstelle manuell eine Spec).
- **Willst du manuell implementieren?** Höre nach Phase 4 auf und wähle Tasks selbst aus.
- **Brauchst du nur einen Agent?** Überspringe die Orchestration komplett und delegiere direkt.

## Tipps

- Führe die Phasen beim ersten Mal der Reihe nach aus, um den gesamten Flow zu verstehen
- Phase 2 (shape-spec) ist am wertvollsten zur Vermeidung von Scope Creep
- Verwende den `phase-by-phase`-Modus bis du dem Workflow vertraust
- Standards werden als Volltext in Delegations-Prompts injiziert (Agents können keine Datei-Referenzen lesen)
- Die progress.md dient als Audit Trail -- pruefe sie wenn etwas schiefgeht
- Jede Phase ist idempotent: erneutes Ausführen überschreibt vorherige Ergebnisse
- Bei großen Features lohnt es sich, die Task-Aufteilung manuell zu prüfen bevor du orchestrierst

## Siehe auch

- [Agenten](agenten.md) - Welcher Agent welchen Task-Typ bearbeitet
- [Standards](standards.md) - Wie Standards während der Orchestration injiziert werden
- [Konfiguration](konfiguration.md) - Ausführungsmodi und Quality Gates anpassen
- [Plattform-Architektur](plattform-architektur.md) - Hook-Verhalten und Event-basierte Automatisierung
