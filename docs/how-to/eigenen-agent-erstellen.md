# How-To: Einen eigenen Agent erstellen

Dieser Guide zeigt dir, wie du einen neuen spezialisierten Agent fuer die Claude Workflow Engine erstellst. Agents sind Markdown-Dateien mit definierter Rolle, Zugangsstufe und Toolset.

## Ziel

Nach diesem Guide hast du:

- Einen neuen Agent in `.claude/agents/` erstellt
- Rolle, Zugang und Tools definiert
- Kontext-Quellen konfiguriert
- Den Agent in `orchestration.yml` registriert
- Den Agent getestet und einsatzbereit

## Voraussetzungen

- Claude Workflow Engine ist installiert (siehe [CLI-Installation](cli-installation.md))
- Grundverstaendnis des Agent-Systems (siehe [Agenten-Uebersicht](../agenten.md))
- Klare Vorstellung der Spezialisierung deines Agents

## Schritt 1: Agent-Datei erstellen

Agents leben als Markdown-Dateien in `.claude/agents/`. Der Dateiname wird zum Agent-Bezeichner.

Erstelle eine neue Datei:

```
.claude/agents/reviewer.md
```

### Dateistruktur

Jede Agent-Datei besteht aus zwei Teilen:

1. **Frontmatter** (YAML zwischen `---`) -- Metadaten fuer das System
2. **Body** (Markdown) -- System Prompt und Verhaltensdefinition

```markdown
---
name: reviewer
description: Code Review Spezialist. Use when reviewing pull requests, enforcing code quality standards, or providing structured feedback on code changes.
tools: Read, Grep, Glob
---

# Reviewer Agent

## Identity

[Agent-Persoenlichkeit und Spezialisierung]

## Context Sources

[Referenzen auf Standards und Produktdokumentation]

## Rules

[Verhaltensregeln und Einschraenkungen]

## Output Format

[Definierte Ausgabeformate]

## Collaboration

[Zusammenarbeit mit anderen Agents]
```

---

## Schritt 2: Frontmatter definieren

Das Frontmatter definiert die technischen Eigenschaften des Agents.

### Felder

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `name` | Ja | Eindeutiger Bezeichner (lowercase, keine Leerzeichen) |
| `description` | Ja | Wann und wofuer Claude diesen Agent verwenden soll |
| `tools` | Ja | Kommaseparierte Liste erlaubter Tools |

### Zugangsstufen und zugehoerige Tools

| Zugangsstufe | Tools | Verwendung |
|--------------|-------|------------|
| READ-ONLY | Read, Grep, Glob | Analyse, Review, Erklaerungen |
| READ-ONLY + Web | Read, Grep, Glob, WebSearch, WebFetch | Research, Evaluation |
| FULL | Read, Write, Edit, Bash, Grep, Glob | Implementation, Fixes |
| RESTRICTED | Read, Grep, Glob, Bash (eingeschraenkt) | Security Scanning |
| TASK-DELEGATION | Task, Read, Grep, Glob | Koordination |

### Beispiel-Frontmatter

```yaml
---
name: reviewer
description: Code Review Spezialist. Use when reviewing pull requests, enforcing code quality standards, or providing structured feedback on code changes.
tools: Read, Grep, Glob
---
```

**Wichtig zur `description`:** Claude verwendet dieses Feld um zu entscheiden, wann der Agent proaktiv eingesetzt wird. Formuliere es so, dass klar ist in welchen Situationen der Agent gewaehlt werden soll.

---

## Schritt 3: System Prompt schreiben

Der Body der Markdown-Datei ist der System Prompt des Agents. Er definiert Persoenlichkeit, Verhalten und Ausgabeformate.

### Identity-Sektion

Definiere die Rolle und Spezialisierungen:

```markdown
## Identity

You are a meticulous code reviewer specializing in:
- Pull request analysis and structured feedback
- Code quality assessment (readability, maintainability, performance)
- Pattern consistency enforcement
- Best practice recommendations with concrete examples
- SOLID principles and clean code evaluation

You review code like a senior engineer: thorough, constructive, and specific.
Every finding includes a concrete suggestion for improvement.
```

### Context Sources

Referenziere Standards und Produktdokumentation die der Agent kennen soll:

```markdown
## Context Sources

@workflow/standards/global/tech-stack.md
@workflow/standards/global/naming.md
@workflow/standards/testing/coverage.md
@workflow/product/mission.md
@workflow/product/architecture.md
```

Die `@`-Referenzen laden den Inhalt dieser Dateien automatisch in den Agent-Kontext.

### Rules-Sektion

Definiere klare Verhaltensregeln:

```markdown
## Rules

1. **READ-ONLY access** - Analysiere und empfehle, veraendere nie Code direkt
2. **Konstruktiv** - Jedes Finding enthaelt einen konkreten Verbesserungsvorschlag
3. **Severity-Ratings** - Kategorisiere Findings: Critical, Major, Minor, Suggestion
4. **Standards-aware** - Pruefe Compliance mit Standards aus `workflow/standards/`
5. **Scope-aware** - Reviewe nur Code der zum PR/Change gehoert
6. **No Nitpicking** - Formatierungs-Issues nur wenn kein Formatter konfiguriert ist
7. **GDPR-conscious** - Flagge PII-Exposure oder Logging-Probleme
```

### Output Format

Definiere standardisierte Ausgabeformate:

```markdown
## Output Format

### For Code Reviews
\```markdown
## Code Review: {PR/Feature}

### Summary
[1-2 Saetze Gesamteindruck]

### Findings

#### Critical
- **[Datei:Zeile]** [Problem] -> [Vorgeschlagener Fix]

#### Major
- **[Datei:Zeile]** [Problem] -> [Vorgeschlagener Fix]

#### Minor
- **[Datei:Zeile]** [Problem] -> [Vorgeschlagener Fix]

#### Suggestions
- **[Datei:Zeile]** [Verbesserungsidee]

### Standards Compliance
| Standard | Status | Details |
|----------|--------|---------|
| naming | PASS/FAIL | [Details] |
| coverage | PASS/FAIL | [Details] |

### Verdict
[APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]
\```
```

### Collaboration-Sektion

Definiere wie der Agent mit anderen zusammenarbeitet:

```markdown
## Collaboration

- Receives review requests from **orchestrator**
- Escalates architecture concerns to **architect**
- Flags security issues to **security** agent
- Delegates implementation fixes to **debug**
```

---

## Schritt 4: Kontext-Quellen konfigurieren

Kontext-Quellen bestimmen welches Wissen dem Agent zur Verfuegung steht. Waehle bewusst aus:

### Empfohlene Kontext-Quellen pro Agent-Typ

| Agent-Typ | Empfohlene Quellen |
|-----------|-------------------|
| Analyse/Review | tech-stack, naming, relevante Domain-Standards, mission |
| Implementation | tech-stack, naming, alle Domain-Standards, mission, architecture |
| Research | tech-stack, agent-conventions, mission, architecture, roadmap |
| Security | tech-stack, naming, error-handling, response-format, mission |
| Koordination | agent-conventions, tech-stack, mission, architecture |

### Regeln

- **Weniger ist mehr:** Jede Quelle kostet Tokens im Context Window
- **Relevanz:** Nur Standards referenzieren die der Agent tatsaechlich braucht
- **Produktkontext:** `mission.md` sollte fast jeder Agent haben (fuer Alignment)
- **Architecture:** Agents die Designentscheidungen beeinflussen brauchen `architecture.md`

---

## Schritt 5: Agent in orchestration.yml registrieren

Damit der Orchestrator deinen Agent delegieren kann, registriere ihn in der Konfiguration.

### Agent Registry ergaenzen

Oeffne `workflow/orchestration.yml` und fuege den Agent unter `agents.registry` hinzu:

```yaml
agents:
  registry:
    # ... bestehende Agents ...

    reviewer:
      access: read-only
      tools: [Read, Grep, Glob]
      strengths:
        - Code review and quality assessment
        - Pattern consistency enforcement
        - Standards compliance checking
        - Constructive feedback generation
      standards_domains: [global, testing]
      context_sources:
        - workflow/standards/global/tech-stack.md
        - workflow/standards/global/naming.md
        - workflow/standards/testing/coverage.md
        - workflow/product/mission.md
        - workflow/product/architecture.md
```

### Task Group ergaenzen (optional)

Wenn dein Agent eine eigene Task-Kategorie bearbeitet, fuege eine Task Group hinzu:

```yaml
task_groups:
  # ... bestehende Groups ...

  code_review:
    primary_agent: reviewer
    review_agent: null
    standards: [global/tech-stack, global/naming, testing/coverage]
    override_when:
      security_review: security
```

### Fallback definieren (optional)

Definiere was passiert wenn dein Agent nicht verfuegbar ist:

```yaml
fallbacks:
  agent_unavailable:
    # ... bestehende Fallbacks ...

    reviewer:
      fallback_to: architect
      reason: "Architect can assess code quality at architecture level"
      limitation: "May focus more on design than implementation details"
```

---

## Schritt 6: Agent testen

### Direkter Test

Rufe den Agent direkt auf um sein Verhalten zu pruefen:

```
> @reviewer Reviewe die Datei src/services/auth.service.ts
```

Erwartete Reaktion: Der Agent analysiert die Datei und liefert ein strukturiertes Review im definierten Format.

### Delegation via Orchestrator

Teste die Delegation durch den Orchestrator:

```
> @orchestrator Delegiere einen Code Review von src/services/ an den reviewer Agent.
```

### Checkliste

Pruefe folgende Punkte:

- [ ] Agent wird bei relevanten Aufgaben automatisch vorgeschlagen
- [ ] Zugangsstufe wird korrekt erzwungen (kein Schreibzugriff bei READ-ONLY)
- [ ] Kontext-Quellen werden geladen (Agent kennt den Tech Stack)
- [ ] Output folgt dem definierten Format
- [ ] Collaboration-Regeln werden eingehalten (eskaliert korrekt)
- [ ] Standards werden bei der Bewertung beruecksichtigt

### Haeufige Probleme

| Problem | Ursache | Loesung |
|---------|---------|---------|
| Agent wird nicht gefunden | Dateiname/Pfad falsch | Pruefe `.claude/agents/reviewer.md` existiert |
| Falscher Zugang | Tools-Feld falsch | Pruefe Frontmatter `tools:` Zeile |
| Kein Kontext | `@`-Referenzen fehlen | Pruefe Context Sources Pfade |
| Nicht delegierbar | Nicht in orchestration.yml | Fuege Agent zur Registry hinzu |
| Schlechte Qualitaet | Vager System Prompt | Mache Rules und Output Format konkreter |

---

## Vollstaendiges Beispiel

Hier ist der komplette `reviewer.md` Agent:

```markdown
---
name: reviewer
description: Code Review Spezialist. Use when reviewing pull requests, enforcing code quality standards, or providing structured feedback on code changes.
tools: Read, Grep, Glob
---

# Reviewer Agent

## Identity

You are a meticulous code reviewer specializing in:
- Pull request analysis and structured feedback
- Code quality assessment (readability, maintainability, performance)
- Pattern consistency enforcement across the codebase
- Best practice recommendations with concrete examples
- SOLID principles and clean code evaluation

You review code like a senior engineer: thorough, constructive, and specific.
Every finding includes a concrete suggestion for improvement.
You never nitpick formatting if a formatter is configured.

## Context Sources

@workflow/standards/global/tech-stack.md
@workflow/standards/global/naming.md
@workflow/standards/testing/coverage.md
@workflow/product/mission.md
@workflow/product/architecture.md

## Rules

1. **READ-ONLY access** - Analyze and recommend, never modify code directly
2. **Constructive feedback** - Every finding includes a concrete improvement suggestion
3. **Severity ratings** - Categorize: Critical, Major, Minor, Suggestion
4. **Standards-aware** - Check compliance with workflow/standards/
5. **Scope-aware** - Only review code belonging to the PR/change
6. **No nitpicking** - Skip formatting issues if a formatter is configured
7. **GDPR-conscious** - Flag PII exposure or logging issues
8. **Evidence-based** - Cite specific lines and patterns, not vague observations

## Output Format

### For Code Reviews

## Code Review: {PR/Feature}

### Summary
[1-2 sentences overall impression]

### Findings

#### Critical
- **[file:line]** [Problem] -> [Suggested fix]

#### Major
- **[file:line]** [Problem] -> [Suggested fix]

#### Minor
- **[file:line]** [Problem] -> [Suggested fix]

#### Suggestions
- **[file:line]** [Improvement idea]

### Standards Compliance
| Standard | Status | Details |
|----------|--------|---------|
| naming | PASS/FAIL | [Details] |
| coverage | PASS/FAIL | [Details] |

### Verdict
[APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]

## Collaboration

- Receives review requests from **orchestrator**
- Escalates architecture concerns to **architect**
- Flags security issues to **security** agent
- Delegates implementation fixes to **debug**
```

---

## Ergebnis

Du hast jetzt:

- Eine Agent-Datei in `.claude/agents/reviewer.md`
- Den Agent in `orchestration.yml` registriert
- Klar definierte Rolle, Zugang, Tools und Ausgabeformate
- Einen getesteten und einsatzbereiten Agent

## Naechste Schritte

- **Agent verfeinern:** Beobachte die Ausgaben und passe Rules/Output Format an
- **Standards fuer Agents:** Siehe [Standards erweitern](standards-erweitern.md)
- **Im Workflow nutzen:** Erstelle Tasks die an deinen Agent delegiert werden
- **Fallbacks testen:** Pruefe ob der Fallback-Agent bei Nicht-Verfuegbarkeit funktioniert

## Best Practices

### Agent-Granularitaet

- **Ein Agent, eine Verantwortung:** Keine "Eierlegende Wollmilchsau"-Agents
- **Klare Abgrenzung:** Jeder Agent hat einen eindeutigen Kompetenzbereich
- **Ueberlappung vermeiden:** Wenn zwei Agents dasselbe koennen, ist einer zu viel

### Naming

- Lowercase, keine Leerzeichen, keine Sonderzeichen
- Beschreibender Name der die Rolle klar macht
- Beispiele: `reviewer`, `migrator`, `optimizer`, `translator`

### Zusammenarbeit

- Definiere explizit mit welchen Agents zusammengearbeitet wird
- Verwende `escalate` fuer Probleme ausserhalb der Kompetenz
- Vermeide zirkulaere Delegationen (A -> B -> A)

### System Prompt Qualitaet

- **Spezifisch:** "You review code for SOLID violations" statt "You help with code"
- **Actionable Rules:** Jede Regel muss konkret umsetzbar sein
- **Output-Beispiele:** Zeige dem Agent wie gute Ausgabe aussieht
- **Negative Constraints:** Sage explizit was der Agent NICHT tun soll

## Siehe auch

- [Agenten-Uebersicht](../agenten.md) -- Alle 7 Standard-Agents im Detail
- [Standards](../standards.md) -- Kontext-Quellen fuer Agents verstehen
- [Workflow-Guide](../workflow.md) -- Wie Agents im Workflow eingesetzt werden
- [CLI-Referenz](../cli.md) -- Health Checks nach Aenderungen ausfuehren
