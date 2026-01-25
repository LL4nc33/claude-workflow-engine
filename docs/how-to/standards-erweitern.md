# How-To: Standards erweitern

Dieser Guide zeigt dir, wie du neue Standards für die Claude Workflow Engine erstellst. Standards sind die "HOW"-Schicht im Context Model -- sie definieren Konventionen und Patterns, die Agents bei der Implementation befolgen.

## Ziel

Nach diesem Guide hast du:

- Einen neuen Standard in der passenden Domain erstellt
- Den Standard im Index registriert
- Einen Skill für automatisches Matching konfiguriert
- Den Standard validiert und getestet

## Voraussetzungen

- Claude Workflow Engine ist installiert (siehe [CLI-Installation](cli-installation.md))
- Verständnis des 3-Schichten-Kontextmodells (siehe [Standards-Referenz](../standards.md))
- Ein konkretes Pattern oder eine Konvention die du dokumentieren willst

## Das 3-Schichten-Kontextmodell

```
Layer 1: Standards (HOW)     -> workflow/standards/   <-- hier arbeitest du
Layer 2: Product (WHAT/WHY)  -> workflow/product/
Layer 3: Specs (WHAT NEXT)   -> workflow/specs/
```

Standards werden an Agents injiziert und bestimmen **wie** Code geschrieben wird. Sie sichern Konsistenz über Features und Agents hinweg.

---

## Schritt 1: Domain identifizieren

Standards sind in Domänen organisiert. Wähle die passende:

| Domain | Pfad | Für |
|--------|------|------|
| `global/` | `workflow/standards/global/` | Übergreifende Konventionen |
| `api/` | `workflow/standards/api/` | API-Design-Patterns |
| `database/` | `workflow/standards/database/` | Schema und Migrations |
| `devops/` | `workflow/standards/devops/` | Infrastruktur-Konventionen |
| `frontend/` | `workflow/standards/frontend/` | UI-Component-Patterns |
| `testing/` | `workflow/standards/testing/` | Test-Struktur und Coverage |
| `agents/` | `workflow/standards/agents/` | Agent-Definitions-Standards |

### Neue Domain erstellen

Wenn keine bestehende Domain passt, erstelle eine neue:

```bash
mkdir -p workflow/standards/monitoring/
```

Füge die Domain in `workflow/config.yml` unter `context_model.standards.domains` hinzu:

```yaml
context_model:
  standards:
    domains:
      - global
      - devops
      - agents
      - api
      - database
      - frontend
      - testing
      - monitoring    # Neue Domain
```

---

## Schritt 2: Standard-Datei erstellen

Erstelle eine Markdown-Datei im passenden Domain-Ordner.

### Beispiel: Logging-Standard

Datei: `workflow/standards/api/logging.md`

```markdown
# Logging

## Log Levels

| Level | Verwendung | Beispiel |
|-------|-----------|----------|
| ERROR | Unerwartete Fehler die Intervention brauchen | DB Connection lost |
| WARN | Degraded State, System funktioniert noch | Cache miss, retry |
| INFO | Geschaeftsereignisse, State Changes | User created, order placed |
| DEBUG | Entwickler-Details, nur in Dev aktiv | Request payload, query timing |

## Format

Strukturiertes JSON-Logging:

```json
{
  "timestamp": "2026-01-23T14:30:00.000Z",
  "level": "ERROR",
  "service": "auth-service",
  "message": "Token validation failed",
  "context": {
    "userId": "anonymized-hash",
    "endpoint": "/api/auth/refresh",
    "errorCode": "AUTH_003"
  },
  "traceId": "abc-123-def"
}
```

## Regeln

- Immer strukturiert loggen (kein `console.log("error: " + msg)`)
- Nie PII loggen (keine Emails, Namen, IPs im Klartext)
- User-IDs nur als anonymisierte Hashes
- TraceId für Request-Korrelation in jedem Log-Entry
- ERROR-Level triggert Alert -- sparsam verwenden
- Log-Retention: 30 Tage (DSGVO-konform)

## Anti-Patterns

- `console.log` in Production-Code
- Stack Traces an Client zurückgeben
- Passwort-Felder in Debug-Logs
- Log-Level per Environment statt per Konfiguration
```

### Schreibregeln für gute Standards

Standards werden in AI-Context-Windows injiziert. Jedes Wort kostet Tokens.

**Do:**

- Regel zuerst, Erklärung danach (wenn nötig)
- Code-Beispiele verwenden -- zeigen, nicht erzählen
- Offensichtliches weglassen
- Ein Standard pro Konzept
- Bullet Points statt Absätze
- Tabellen für strukturierte Informationen

**Don't:**

- Lange einleitende Absätze
- Wiederholung von Informationen die der Code zeigt
- Allgemeine Best Practices die jeder kennt
- Mehrere unzusammenhängende Themen in einer Datei

### Richtige Granularität

| Zu grob | Richtig | Zu fein |
|---------|---------|---------|
| `backend.md` (alles) | `response-format.md` | `json-key-casing.md` |
| `quality.md` (alles) | `coverage.md` | `unit-test-naming.md` |
| `infrastructure.md` (alles) | `containerization.md` | `dockerfile-from-line.md` |

Faustregel: Ein Standard sollte 20-80 Zeilen lang sein. Kürzer ist meistens besser.

---

## Schritt 3: Im Index registrieren

Öffne `workflow/standards/index.yml` und füge den neuen Standard hinzu:

```yaml
api:
  response-format:
    description: API response envelope structure, pagination, status codes
    tags: [api, response, json, http, rest, status-code]
  error-handling:
    description: Error hierarchy, error codes, logging levels, DSGVO-konforme Fehlerantworten
    tags: [error, exception, logging, error-code, gdpr]
  logging:                                                          # NEU
    description: Structured JSON logging, log levels, DSGVO-konformes Log-Format
    tags: [logging, log-level, structured, json, tracing, gdpr]
```

### Index-Regeln

- Einträge alphabetisch innerhalb jeder Domain
- Jeder Eintrag braucht `description` und `tags`
- `description`: Ein Satz der den Inhalt zusammenfasst
- `tags`: 4-8 Keywords für intelligentes Matching

### Alternativ: Automatisch indexieren

```
> /workflow/index-standards
```

Dieser Command scannt `workflow/standards/` nach allen `.md`-Dateien und aktualisiert den Index automatisch.

---

## Schritt 4: Skill für Standards-Injection erstellen

Wenn `standards_as_claude_code_skills: true` in `config.yml` gesetzt ist (Default), werden Standards als Claude Code Skills registriert. Damit Claude deinen Standard automatisch anwendet, erstelle einen Skill.

### Skill-Verzeichnis

```
.claude/skills/workflow/{domain}-standards/
```

### Neuen Skill erstellen

Für eine bestehende Domain: Ergänze den bestehenden Skill.
Für eine neue Domain: Erstelle ein neues Verzeichnis.

Beispiel für eine neue Domain `monitoring`:

```bash
mkdir -p .claude/skills/workflow/monitoring-standards/
```

Erstelle `.claude/skills/workflow/monitoring-standards/SKILL.md`:

```markdown
---
name: monitoring-standards
description: Apply monitoring and observability standards when working on logging, metrics, alerting, or tracing code.
---

When working on monitoring, logging, metrics, or observability:

@workflow/standards/monitoring/logging.md
@workflow/standards/monitoring/metrics.md
```

### Bestehenden Skill ergänzen

Für einen Standard in einer bestehenden Domain (z.B. `api/logging.md`), ergänze den bestehenden Skill in `.claude/skills/workflow/api-standards/SKILL.md`:

```markdown
---
name: api-standards
description: Apply API standards when working on endpoints, responses, error handling, or logging.
---

When working on API endpoints, responses, or error handling:

@workflow/standards/api/response-format.md
@workflow/standards/api/error-handling.md
@workflow/standards/api/logging.md
```

---

## Schritt 5: In orchestration.yml referenzieren

Damit der Orchestrator den Standard bei der Delegation injiziert, füge ihn zum Domain-Mapping hinzu.

### Standards Injection Mapping

Öffne `workflow/orchestration.yml` und ergänze unter `standards_injection.domain_mapping`:

```yaml
standards_injection:
  domain_mapping:
    backend:
      - global/naming
      - api/response-format
      - api/error-handling
      - api/logging              # NEU
    # ... weitere Domains ...
```

### Neue Task Group (optional)

Wenn dein Standard eine eigene Task-Kategorie braucht:

```yaml
task_groups:
  monitoring:
    primary_agent: devops
    review_agent: null
    standards: [global/tech-stack, monitoring/logging, monitoring/metrics]
    override_when: {}
```

### Max Standards beachten

Die Konfiguration erlaubt maximal 5 Standards pro Task (Token-Optimierung):

```yaml
standards_injection:
  optimization:
    max_standards_per_task: 5
```

Wenn du mehr als 5 Standards in einer Domain hast, priorisiere die wichtigsten.

---

## Schritt 6: Standard validieren und testen

### Health Check

Führe nach Änderungen einen Health Check aus:

```bash
workflow health
```

### Standards-Injection testen

Teste ob der Standard korrekt injiziert wird:

```
> /workflow/inject-standards api/logging
```

Erwartete Ausgabe: Der vollständige Inhalt von `workflow/standards/api/logging.md` wird in den aktuellen Kontext geladen.

### Delegation testen

Erstelle einen Test-Task und prüfe ob der Standard ankommt:

```
> @orchestrator Delegiere einen Backend-Task an debug: "Implementiere einen
  Health-Check-Endpoint mit strukturiertem Logging."
```

Prüfe in der Delegation ob `api/logging` im Standards-Block enthalten ist.

### Checkliste

- [ ] Standard-Datei existiert in `workflow/standards/{domain}/{name}.md`
- [ ] Format ist knapp und scanbar (Regeln, Code-Beispiele, Anti-Patterns)
- [ ] Index-Eintrag in `workflow/standards/index.yml` vorhanden
- [ ] Tags sind aussagekräftig (4-8 Keywords)
- [ ] Skill referenziert den Standard (bei Skills-basiertem Matching)
- [ ] Domain-Mapping in `orchestration.yml` aktualisiert
- [ ] Health Check zeigt keine Fehler
- [ ] Standard wird bei relevanten Tasks injiziert

---

## Bestehende Standards aus Code entdecken

Wenn du bestehende Patterns in deiner Codebase formalisieren willst:

```
> /workflow/discover-standards
```

### Interaktion

```
Claude: Ich habe deinen Code analysiert und diese Patterns gefunden:
        1. Structured Logging - Alle Services nutzen winston mit JSON-Format
        2. Request Correlation - TraceId wird über X-Request-ID Header propagiert
        3. Error Wrapping - Alle Services wrappen Errors in AppError-Klasse

        Welche möchtest du dokumentieren?
Du:     Alle drei.

Claude: Für Structured Logging:
        - Welches Problem löst das?
        - Gibt es Ausnahmen?
Du:     Konsistente Log-Aggregation in CloudWatch. Keine Ausnahmen.

Claude: Standard-Entwurf erstellt: api/logging.md
        Diese Datei erstellen?
Du:     Ja.
```

---

## Ergebnis

Du hast jetzt:

- Einen neuen Standard in `workflow/standards/{domain}/{name}.md`
- Den Standard im Index unter `workflow/standards/index.yml` registriert
- Einen Skill für automatisches Context-Matching konfiguriert
- Den Standard in der Orchestration-Konfiguration referenziert
- Validiert dass der Standard korrekt injiziert wird

## Nächste Schritte

- **Weitere Standards:** Wiederhole den Prozess für andere Patterns in deiner Codebase
- **Standards entdecken:** Nutze `/workflow/discover-standards` um implizite Patterns zu formalisieren
- **Team-Alignment:** Stelle sicher dass das Team die Standards kennt und akzeptiert
- **Iteration:** Beobachte ob Agents die Standards korrekt anwenden und passe sie an

## Best Practices für gute Standards

1. **Aus der Praxis:** Dokumentiere was bereits funktioniert, nicht was theoretisch ideal wäre
2. **Minimal:** Nur das Wichtigste -- Agents können General Knowledge selbst anwenden
3. **Opinionated:** Standards die "es kommt darauf an" sagen helfen niemandem
4. **Aktuell halten:** Veraltete Standards sind schlimmer als keine Standards
5. **Team-Konsens:** Standards die niemand befolgt sind Dokumentationsmüll
6. **Testbar:** Jede Regel sollte mit einem Check verifizierbar sein

## Siehe auch

- [Standards-Referenz](../standards.md) -- Vollständige Standards-Dokumentation
- [Agenten-Übersicht](../agenten.md) -- Welche Standards jeder Agent erhält
- [Workflow-Guide](../workflow.md) -- Wie Standards im Spec-Shaping auftauchen
- [CLI-Referenz](../cli.md) -- Health Checks und Index-Rebuild
