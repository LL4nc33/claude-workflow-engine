# Tipps & Best Practices

Praxiserprobte Empfehlungen für den effektiven Einsatz des Claude Workflow Engine Multi-Agent Systems.

---

## Agent-Auswahl Cheat Sheet

| Situation | Empfohlener Agent | Grund |
|-----------|-------------------|-------|
| System-Architektur planen | `architect` | READ-ONLY Analyse, ADRs, Design-Entscheidungen |
| Bug in Production | `builder` | Voller Zugriff, hypothesengetriebene Investigation |
| Neues Feature implementieren | `builder` (via Main Chat) | Main Chat koordiniert, builder implementiert |
| CI/CD Pipeline aufsetzen | `devops` | Spezialisiert auf Docker, K8s, IaC |
| Code auf Vulnerabilities pruefen | `security` | OWASP-Audits, RESTRICTED Access |
| Codebase verstehen/erklaeren | `explainer` | READ-ONLY, didaktische Erklärungen |
| Technologie evaluieren | `researcher` | Analyse, Vergleiche, Reports |
| Mehrere Tasks koordinieren | Main Chat | Task-Delegation, Parallelisierung |
| Bestehenden Code refactoren | `builder` | Voller Zugriff, minimale Aenderungen |
| API Design Review | `architect` | API-Konventionen, Response-Formate |
| DSGVO-Compliance pruefen | `security` | Datenschutz-Audit, Vulnerability Assessment |
| Performance-Problem analysieren | `builder` | Profiling, Log-Analyse, Zustandsinspektion |
| Documentation schreiben | `researcher` | READ-ONLY Analyse, strukturierte Reports |

**Faustregel:** Wenn du unsicher bist, frage Main Chat -- er delegiert an den richtigen Agent.

---

## Workflow-Abkuerzungen

Nicht jedes Vorhaben braucht alle 5 Phasen. Hier erfaehrst du, wann du abkuerzen kannst.

```
plan-product -> shape-spec -> write-spec -> create-tasks -> orchestrate-tasks
```

| Situation | Ueberspringe | Starte mit |
|-----------|--------------|------------|
| Product existiert bereits | `plan-product` | `shape-spec` |
| Spec ist klar im Kopf | `shape-spec` | `write-spec` |
| Nur 1-2 kleine Tasks | `create-tasks` | Direkte Agent-Delegation |
| Bugfix | Alles | `builder` direkt |
| Prototyping | Standards-Injection | `write-spec` (minimal) |
| Bekanntes Pattern | `shape-spec` ausfuehrlich | Einzeiler-Shape genuegt |

### Beispiele

**Schneller Bugfix:**
```bash
# Direkt zum builder Agent, kein Workflow noetig
claude agents/builder "Fix den TypeError in api/handler.ts Zeile 42"
```

**Feature mit bekanntem Pattern:**
```bash
# shape-spec ist ein Einzeiler
claude /workflow/write-spec
# In der Spec: "CRUD-Endpunkt für Users, analog zu Products-Endpunkt"
```

**Grosses Feature:**
```bash
# Voller Workflow
claude /workflow/plan-product    # Mission & Goals definieren
claude /workflow/shape-spec      # Requirements sammeln
claude /workflow/write-spec      # Technische Spec
claude /workflow/create-tasks    # Tasks aufteilen
claude /workflow/orchestrate-tasks  # Delegieren & ausführen
```

---

## Standards-Design Regeln

### Do

- **Kurz und scanbar** -- Agents lesen Standards im Context Window, jedes Token zaehlt
- **Ein Konzept pro Standard** -- Fokussiert und klar abgegrenzt
- **Code-Beispiele statt langer Erklärungen** -- Zeigen statt beschreiben
- **Opinionated** -- Klare Entscheidungen treffen, keine Optionen auflisten
- **Testbare Regeln** -- Jede Regel muss verifizierbar sein

### Don't

- **"It depends"-Standards** -- Wenn es keine klare Antwort gibt, ist es kein Standard
- **Allgemeinwissen** -- DRY, SOLID Basics gehoeren nicht in Standards
- **Unreviewed Standards** -- Standards ohne Team-Review fuehren zu Widerstand
- **Zu granulare Standards** -- Eine Datei pro Regel erzeugt Token-Overhead
- **Standards ohne Code-Beispiele** -- Abstrakte Regeln werden unterschiedlich interpretiert

### Guter Standard (Beispiel)

```yaml
# workflow/standards/api/response-format.yml
name: API Response Format
rules:
  - Alle Responses nutzen das Envelope-Pattern
  - Fehler immer mit error.code und error.message
  - Pagination via cursor, nicht offset

example: |
  // Erfolg
  { "data": { ... }, "meta": { "cursor": "abc123" } }

  // Fehler
  { "error": { "code": "NOT_FOUND", "message": "User not found" } }
```

### Schlechter Standard (Beispiel)

```yaml
# Zu vage, nicht testbar, kein Beispiel
name: Code Quality
rules:
  - Code sollte sauber sein
  - Benutze Best Practices
  - Es kommt auf den Kontext an
```

---

## Haeufige Fehler und Loesungen

| Nr. | Fehler | Problem | Loesung |
|-----|--------|---------|---------|
| 1 | Zu viele Standards auf einmal injizieren | Context Window Overflow, Agent verliert Fokus | Max 5 Standards pro Delegation |
| 2 | Agent mit falschen Tools konfigurieren | Fehlschlaege bei Delegation | Agent-Boundaries in Definition pruefen |
| 3 | Specs ohne Acceptance Criteria | Vage Implementation, endlose Iterationen | Jede Spec braucht messbare Kriterien |
| 4 | Product-Phase überspringen | Features ohne Zusammenhang, kein roter Faden | Zumindest Mission und Architecture definieren |
| 5 | Orchestrator für Einzeltasks nutzen | Unnoetigter Overhead | Direkt an den passenden Agent delegieren |
| 6 | Standards nie aktualisieren | Drift zwischen Code und Standards | Quartalsweise Review einplanen |
| 7 | Alle Tasks sequentiell statt parallel | Langsame Ausfuehrung | `parallel: true` in orchestration.yml nutzen |
| 8 | Quality Gates zu streng | Blockierte Workflows, Frustration | Gates nur an kritischen Uebergaengen |
| 9 | Zu grosse Spec-Ordner | Unübersichtlich, schwer zu navigieren | 1 Spec = 1 Feature, nicht 1 Projekt |
| 10 | Agent-Definitionen ohne klare Boundaries | Ueberlappende Verantwortlichkeiten | Access-Level und Scope explizit definieren |

---

## Performance-Tipps

### Context-Window Optimierung

- **Max 5 Standards pro Delegation** -- Mehr fuehrt zu Qualitätsverlust
- **Standards-Granularitaet beachten** -- Kurz aber komplett, keine Roman-Standards
- **Task-Beschreibungen kompakt halten** -- Praezise statt ausfuehrlich
- **Spezialisierte Agents nutzen** -- Bessere Ergebnisse bei weniger Tokens als General-Purpose

### Token-Optimierung

```yaml
# orchestration.yml - Context Optimization
context_optimization:
  max_standards_per_task: 5
  compress_previous_results: true
  include_only_relevant_standards: true
```

### Parallelisierung

```yaml
# orchestration.yml - Parallele Ausfuehrung
tasks:
  - id: api-endpoints
    agent: builder
    parallel_group: "implementation"
  - id: database-migration
    agent: builder
    parallel_group: "implementation"  # Laeuft parallel mit api-endpoints
  - id: integration-tests
    agent: builder
    depends_on: [api-endpoints, database-migration]  # Wartet auf beide
```

### Messbare Verbesserungen

| Optimierung | Token-Ersparnis | Geschwindigkeit |
|-------------|----------------|-----------------|
| Standards auf 5 begrenzen | ~30% weniger Input-Tokens | - |
| Parallele Tasks | - | 2-3x schneller |
| Spezialisierter Agent | ~20% weniger Output-Tokens | Praezisere Ergebnisse |
| Kompakte Task-Beschreibungen | ~15% weniger Input-Tokens | - |

---

## Orchestrierungs-Strategien

### Execution Modes

| Modus | Beschreibung | Anwendungsfall |
|-------|--------------|----------------|
| `automatic` | Alle Tasks werden ohne Intervention ausgefuehrt | Bekannte, sichere Workflows |
| `phase-by-phase` | Pause nach jeder Phase für Review | Neue Features, kritische Aenderungen |
| `manual` | Jeder Task benoetigt explizite Freigabe | Production-Deployments, Security-Fixes |

### Parallele vs. Sequentielle Tasks erkennen

**Parallelisierbar:**
- Unabhaengige API-Endpunkte
- Tests für verschiedene Module
- Frontend-Komponenten ohne gemeinsame Abhängigkeiten
- Documentation und Implementation

**Sequentiell:**
- Database-Migration vor API-Code
- API vor Frontend-Integration
- Implementation vor Tests (wenn Tests die Implementation testen)
- Security-Audit vor Deployment

### Quality Gates sinnvoll einsetzen

```yaml
# Nicht nach jedem Task -- nur an kritischen Uebergaengen
quality_gates:
  - after_phase: "implementation"
    checks: [lint, type-check, unit-tests]
  - after_phase: "integration"
    checks: [integration-tests, security-scan]
  - before_phase: "deployment"
    checks: [all-tests, security-audit, performance-baseline]
```

### Fallback-Agents

```yaml
# Wenn der primaere Agent fehlschlaegt
task:
  agent: devops
  fallback_agent: builder
  retry_count: 2
  escalation: orchestrator
```

---

## Projektstruktur-Tipps

### Reihenfolge beim Aufsetzen

1. **Product-Layer zuerst** -- Mission, Architecture, Tech-Stack definieren
2. **Standards frueh definieren** -- Nicht erst bei Problemen, sondern proaktiv
3. **Spec-Ordner strukturieren** -- Chronologisch oder thematisch, aber konsistent
4. **Agent-Boundaries festlegen** -- Klare Verantwortlichkeiten von Anfang an

### Ordner-Benennung

```
workflow/
  product/
    mission.md
    architecture.md
    roadmap.md
  specs/
    2024-01-auth-system/        # Datum + Feature für chronologische Ordnung
    2024-02-payment-integration/
    2024-03-notification-service/
  standards/
    global/                     # Projektweite Standards
    api/                        # Domain-spezifisch
    frontend/
    team/                       # Team-Standards (separat von Engine-Standards)
```

### Team-Standards separieren

```yaml
# workflow/standards/index.yml
domains:
  global:
    path: workflow/standards/global/
    scope: engine        # Engine-Standards (nicht aendern)
  team:
    path: workflow/standards/team/
    scope: project       # Projekt-spezifische Standards (frei anpassbar)
```

**Warum separieren?**
- Engine-Standards werden mit Updates aktualisiert
- Team-Standards bleiben projektspezifisch
- Kein Merge-Konflikt bei Engine-Upgrades

---

## Weiterführende Dokumentation

- [Workflow Guide](workflow.md) -- Detaillierte Beschreibung aller 5 Phasen
- [Agenten](agenten.md) -- Alle Agents im Detail
- [Standards](standards.md) -- Standards-System erklaert
- [CLI-Referenz](cli.md) -- Alle Befehle und Optionen
- [Konfiguration](konfiguration.md) -- config.yml und orchestration.yml
- [FAQ](faq.md) -- Antworten auf haeufige Fragen

### How-Tos

- [Neues Feature entwickeln](how-to/neues-feature-entwickeln.md)
- [Eigenen Agent erstellen](how-to/eigenen-agent-erstellen.md)
- [Standards erweitern](how-to/standards-erweitern.md)

### Beispiele

- [Use Case: API Feature](beispiele/use-case-api-feature.md)
- [Use Case: Bugfix Workflow](beispiele/use-case-bugfix-workflow.md)
