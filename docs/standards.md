# Standards

Standards sind die "HOW"-Schicht im 3-Layer Context Model. Sie definieren Konventionen, Patterns und Best Practices, die Agenten bei der Task-Implementierung befolgen. Standards leben in `workflow/standards/` und sind nach Domänen organisiert.

## Das 3-Schichten-Kontextmodell

```
Layer 1: Standards (HOW)     -> workflow/standards/
Layer 2: Product (WHAT/WHY)  -> workflow/product/
Layer 3: Specs (WHAT NEXT)   -> workflow/specs/
```

- **Standards** sichern Konsistenz über Features und Agenten hinweg
- **Product** hält das große Bild sichtbar (Mission, Roadmap, Architektur)
- **Specs** definieren konkrete, umsetzbare Arbeitspakete

## Domänen und Standards

Claude Workflow Engine liefert 11 Standards in 7 Domänen:

| Domaene | Standards | Zweck |
|---------|-----------|-------|
| `global/` | tech-stack, naming | Übergreifende Konventionen |
| `api/` | response-format, error-handling | API-Design-Patterns |
| `database/` | migrations | Schema-Change-Patterns |
| `devops/` | ci-cd, containerization, infrastructure | Infrastruktur-Konventionen |
| `frontend/` | components | UI-Component-Patterns |
| `testing/` | coverage | Test-Struktur und Zielwerte |
| `agents/` | agent-conventions | Agent-Definitions-Standards |

### Verzeichnisstruktur

```
workflow/standards/
  index.yml                    # Registry aller Standards
  global/
    tech-stack.md              # Framework-Versionen, Tooling
    naming.md                  # Datei-/Variablen-/API-Benennung
  api/
    response-format.md         # Response-Envelope, Status-Codes
    error-handling.md          # Error-Codes, Logging, DSGVO
  database/
    migrations.md              # Migration-Benennung, Reversibilitaet
  devops/
    ci-cd.md                   # Pipeline-Patterns
    containerization.md        # Docker-Konventionen
    infrastructure.md          # Terraform/K8s-Patterns
  frontend/
    components.md              # Component-Struktur, Accessibility
  testing/
    coverage.md                # Coverage-Zielwerte, Test-Struktur
  agents/
    agent-conventions.md       # Agent-Permissions, Skill-Formate
```

## Wie Standards genutzt werden

Standards werden auf drei Arten konsumiert:

### 1. Skills-basiertes Auto-Matching

Wenn `standards_as_claude_code_skills: true` in `config.yml` gesetzt ist (Default), werden Standards als Claude Code Skills in `.claude/skills/workflow/` registriert. Claude wendet automatisch relevante Standards basierend auf dem Task-Kontext an -- ohne alle 11 in jeden Prompt zu laden.

Skills-Verzeichnisse:

```
.claude/skills/workflow/
  global-standards/       # Standards-Skill
  api-standards/          # Standards-Skill
  database-standards/     # Standards-Skill
  devops-standards/       # Standards-Skill
  frontend-standards/     # Standards-Skill
  testing-standards/      # Standards-Skill
  agent-standards/        # Standards-Skill
  mcp-usage/              # Plugin-Skill: MCP-Tool-Katalog
  hook-patterns/          # Plugin-Skill: Hook-Referenz
  plugin-config/          # Plugin-Skill: 6-Schichten-Architektur
```

### 2. Inline-Injection während Orchestrierung

Wenn der Orchestrator Tasks delegiert, liest er die relevanten Standards-Dateien und fügt ihren vollständigen Inhalt in den Delegation-Prompt ein. Subagenten können keine Dateireferenzen lesen -- sie brauchen den Text inline.

Welche Standards injiziert werden, haengt vom Task-Typ ab:

| Task-Domaene | Injizierte Standards |
|--------------|---------------------|
| backend | global/tech-stack, global/naming, api/response-format, api/error-handling |
| frontend | global/tech-stack, global/naming, frontend/components |
| database | global/tech-stack, global/naming, database/migrations |
| testing | global/tech-stack, testing/coverage |
| devops | devops/ci-cd, devops/containerization, devops/infrastructure |
| security | global/tech-stack, global/naming |

`global/tech-stack` wird immer injiziert, unabhängig vom Task-Typ.

### 3. Manuelle Injection via Command

Du kannst Standards jederzeit in die aktuelle Konversation injizieren:

```
/workflow/inject-standards                        # Relevante automatisch vorschlagen
/workflow/inject-standards api                    # Alle Standards in api/
/workflow/inject-standards api/response-format    # Spezifischer Standard
```

## Der Standards-Index

`workflow/standards/index.yml` ist die Registry, die jeden Standard auf eine Beschreibung und Tags für Matching abbildet:

```yaml
global:
  tech-stack:
    description: Technology stack definitions, framework versions, and tooling choices
    tags: [technology, framework, tooling, infrastructure-choice]
  naming:
    description: Naming conventions for files, code identifiers, APIs, and git artifacts
    tags: [naming, convention, files, variables, endpoints]

api:
  response-format:
    description: API response envelope structure, pagination, status codes
    tags: [api, response, json, http, rest, status-code]
  error-handling:
    description: Error hierarchy, error codes, logging levels, DSGVO-konforme Fehlerantworten
    tags: [error, exception, logging, error-code, gdpr]
```

Regeln für den Index:

- Eintraege alphabetisch innerhalb jeder Domaene
- Jeder Eintrag braucht `description` und `tags`
- Tags ermöglichen `/inject-standards` das Vorschlagen relevanter Standards ohne alle Dateien zu lesen

## Standards verwalten

### Standards aus der Codebase entdecken

```
/workflow/discover-standards
```

Dieser Command:

1. Analysiert deine Codebase nach Patterns (ungewöhnlich, opinionated, tribal, konsistent)
2. Praesentiert Ergebnisse und laesst dich wählen, welche dokumentiert werden
3. Fragt nach dem "Warum" für jedes Pattern
4. Erstellt knappe Standards-Dateien
5. Aktualisiert den Index

**Beispiel-Interaktion:**

```
Claude: Ich habe deinen API-Code analysiert und diese Patterns gefunden:
        1. Response Envelope - Alle Responses nutzen { success, data, error }
        2. Error Codes - Custom Codes wie AUTH_001, DB_002
        3. Pagination - Cursor-basiert mit konsistenten Param-Namen

        Welche möchtest du dokumentieren?
Du:     Ja, alle davon

Claude: Fuer das Response-Envelope-Pattern:
        - Welches Problem löst das?
        - Gibt es Ausnahmen?
Du:     Frontend weiß immer wo die Daten sind. Keine Ausnahmen.

Claude: Hier ist der Entwurf für api/response-format.md:
        [Entwurfsinhalt]
        Diese Datei erstellen?
```

### Index neu bauen

```
/workflow/index-standards
```

Scannt `workflow/standards/` nach allen `.md`-Dateien, vergleicht mit dem bestehenden Index, fügt neue Eintraege hinzu und entfernt veraltete. Führe das aus nachdem du Standards-Dateien manuell erstellt oder gelöscht hast.

### Standards in den Kontext injizieren

```
/workflow/inject-standards
```

Drei Modi abhängig vom Kontext:

1. **Konversation** -- Liest Standards-Inhalt in den aktuellen Chat
2. **Skill-Erstellung** -- Gibt `@file`-Referenzen oder vollständigen Inhalt für Skills aus
3. **Planung** -- Gibt Referenzen oder Inhalt für Specs aus

## Gute Standards schreiben

Standards werden in AI-Context-Windows injiziert. Jedes Wort kostet Tokens. Schreibe sie scanbar:

**Do:**

```markdown
# Error Responses

Verwende Error-Codes: `AUTH_001`, `DB_001`, `VAL_001`

{ "success": false, "error": { "code": "AUTH_001", "message": "..." } }

- Immer Code und Message inkludieren
- Vollen Error serverseitig loggen, sichere Message an Client zurueckgeben
```

**Don't:**

```markdown
# Error Handling Guidelines

Wenn in unserer Applikation ein Error auftritt, haben wir ein konsistentes
Pattern etabliert wie Errors formatiert und an den Client zurueckgegeben
werden sollen. Das hilft die Konsistenz über unsere API zu wahren und
macht es einfacher für Frontend-Entwickler Errors angemessen zu
behandeln...
[geht noch 3 Absaetze weiter]
```

Regeln für knappe Standards:

- Regel zuerst, Erklaerung danach (wenn noetig)
- Code-Beispiele verwenden -- zeigen, nicht erzaehlen
- Offensichtliches weglassen (nicht dokumentieren was der Code klarmacht)
- Ein Standard pro Konzept
- Bullet Points statt Absaetze

## Eigene Standards erstellen

Um einen neuen Standard manuell hinzuzufügen:

1. **Datei erstellen** im passenden Domänen-Ordner:
   ```
   workflow/standards/api/authentication.md
   ```

2. **Inhalt schreiben** (siehe Richtlinien oben)

3. **Index aktualisieren:**
   ```
   /workflow/index-standards
   ```

4. **Skill-Discovery:** Bei Skills-basiertem Matching wird der Standard automatisch entdeckt. Fuer explizite Kontrolle fuege ihn zum relevanten Skill in `.claude/skills/workflow/` hinzu.

## Standards in der Orchestrierung

Waehrend `/workflow/orchestrate-tasks` folgt die Standards-Injection diesen Regeln aus `orchestration.yml`:

- **Methode:** `inline` (vollständigen Inhalt einfuegen, keine Dateireferenzen)
- **Immer injiziert:** `global/tech-stack`
- **Max pro Task:** 5 Standards (um Context-Overflow zu vermeiden)
- **Cache:** Orchestrator cached Reads innerhalb einer Session

Der Orchestrator mappt Task-Domänen auf Standards via `standards_injection.domain_mapping` in `orchestration.yml`. Siehe [Konfiguration](konfiguration.md) für Details.

## Siehe auch

- [Workflow-Guide](workflow.md) -- Wie Standards während Spec-Shaping auftauchen
- [Agenten](agenten.md) -- Welche Standards jeder Agent als Kontext erhält
- [Konfiguration](konfiguration.md) -- standards_injection-Settings in orchestration.yml
- [Integration](integration.md) -- Wie Standards bei der Integration in bestehende Projekte funktionieren
- [Plattform-Architektur](plattform-architektur.md) -- Skills im 6-Schichten-Modell
