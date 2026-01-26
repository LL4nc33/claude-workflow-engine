---
description: Kontextbasierte Hilfe basierend auf aktuellem Workflow-Status
interactive: true
---

# Workflow Help

Contextual help command that provides guidance based on your current workflow state.

## Important Guidelines

- **Always use AskUserQuestion tool** when offering actions
- **Detect state first** — Check existing artifacts to determine context
- **Provide actionable guidance** — Not just information, but next steps
- **Keep it concise** — Focus on what's relevant NOW

## Process

### Step 1: Detect Workflow State

Check these locations in order:

1. **Check `workflow/` directory exists**
   - If NO → State: `no-workflow` (First-Run)

2. **Check `workflow/product/mission.md` exists**
   - If NO → State: `no-product` (Needs Plan)

3. **Find active spec folder** (most recent in `workflow/specs/`)
   - If NO specs exist → State: `ready-for-feature`
   - If specs exist → Check spec state

4. **Check spec completeness** (in most recent spec folder):
   - Has `shape.md` but no `spec.md` → State: `shaping`
   - Has `spec.md` but no `tasks.md` → State: `speccing`
   - Has `tasks.md` but no `progress.md` → State: `ready-to-build`
   - Has `progress.md` with incomplete tasks → State: `building`
   - Has `progress.md` with all done → State: `feature-complete`

### Step 2: Present Contextual Help

Based on detected state, show relevant guidance:

---

#### State: `no-workflow` (First-Run)

```
Willkommen zum Workflow-System!

Du hast noch kein workflow/ Verzeichnis. Das System hilft dir bei:
- Strukturierter Feature-Entwicklung
- Automatischer Delegation an spezialisierte Agents
- Standards-Management fuer konsistenten Code

Quick Start:
  /workflow:quick           — Schneller 3-Step (Plan→Spec→Build) fuer MVPs
  /workflow:smart-workflow  — Voller 5-Phase-Workflow (empfohlen fuer groessere Features)
  /workflow:plan-product    — Nur Produkt-Vision definieren

Tipp: Fuer kleine Projekte reicht oft ein einfaches
"Implementiere X" — Auto-Delegation uebernimmt den Rest.
```

---

#### State: `no-product` (Needs Plan)

```
Workflow-Verzeichnis gefunden, aber noch keine Produkt-Definition.

Naechster Schritt:
  Definiere Mission, Tech-Stack und Roadmap.

Optionen:
  /workflow:plan-product    — Interaktive Produkt-Definition
  /workflow:smart-workflow  — Automatisch erkennen und fortfahren

Was wird erstellt:
  workflow/product/mission.md   — Was und warum
  workflow/product/roadmap.md   — Grobe Feature-Planung
  workflow/product/tech-stack.md — Technologie-Entscheidungen
```

---

#### State: `ready-for-feature`

```
Produkt definiert. Bereit fuer das naechste Feature!

Aktuelle Produkt-Info:
  Mission: {erste Zeile aus mission.md}

Naechster Schritt:
  Starte ein neues Feature mit Requirements-Sammlung.

Optionen:
  /workflow:shape-spec      — Neues Feature starten
  /workflow:smart-workflow  — Gefuehrter Workflow

Tipp: Du kannst auch einfach sagen was du bauen willst,
z.B. "Ich moechte User-Authentifizierung hinzufuegen"
```

---

#### State: `shaping`

```
Feature in Arbeit: {spec-folder-name}

Aktueller Stand:
  [x] Shape (requirements.md vorhanden)
  [ ] Spec (technische Details fehlen)
  [ ] Tasks
  [ ] Implementation

Naechster Schritt:
  Schreibe die technische Spezifikation.

Optionen:
  /workflow:write-spec      — Spec aus Shape generieren
  /workflow:smart-workflow  — Automatisch fortfahren

Shape-Inhalt:
  {erste 3 Zeilen aus shape.md}
```

---

#### State: `speccing`

```
Feature in Arbeit: {spec-folder-name}

Aktueller Stand:
  [x] Shape
  [x] Spec (technische Details vorhanden)
  [ ] Tasks (Aufgaben-Breakdown fehlt)
  [ ] Implementation

Naechster Schritt:
  Zerlege die Spec in implementierbare Tasks.

Optionen:
  /workflow:create-tasks    — Tasks aus Spec generieren
  /workflow:smart-workflow  — Automatisch fortfahren

Spec-Zusammenfassung:
  {erste 3 Zeilen aus spec.md}
```

---

#### State: `ready-to-build`

```
Feature bereit: {spec-folder-name}

Aktueller Stand:
  [x] Shape
  [x] Spec
  [x] Tasks ({anzahl} Tasks definiert)
  [ ] Implementation

Naechster Schritt:
  Starte die Orchestration — Tasks werden an Agents delegiert.

Optionen:
  /workflow:orchestrate-tasks  — Ausfuehrung starten
  /workflow:smart-workflow     — Automatisch fortfahren

Task-Uebersicht:
  {task-count} Tasks in {phase-count} Phasen
  Agents: {liste der zugewiesenen agents}
```

---

#### State: `building`

```
Feature in Arbeit: {spec-folder-name}

```
{Progress-Bars aus progress.md kopieren}
```

Aktueller Status:
  {completed}/{total} Tasks abgeschlossen
  Aktuelle Phase: {phase-name}

Optionen:
  Weiter bauen     — Orchestration fortsetzen
  Status Details   — Alle Tasks mit Status anzeigen
  Pause            — Aktuellen Stand speichern

Bei Problemen:
  /workflow:smart-workflow  — Status pruefen und fortfahren
  Oder beschreibe das Problem direkt.
```

---

#### State: `feature-complete`

```
Feature abgeschlossen: {spec-folder-name}

```
Phase 1: ...    ████████████ 100% ✓
Phase 2: ...    ████████████ 100% ✓
Phase 3: ...    ████████████ 100% ✓
...
```

Alle {total} Tasks erledigt!

Naechste Schritte:
  1. Code reviewen
  2. Tests ausfuehren
  3. Release erstellen

Optionen:
  /workflow:release      — Version bump + Changelog
  /workflow:shape-spec   — Naechstes Feature starten
  Neues Feature          — Beschreibe was du als naechstes bauen willst
```

---

### Step 3: Offer Quick Actions

Use AskUserQuestion with context-appropriate options:

```yaml
# For each state, offer 2-4 relevant actions
no-workflow:
  - "Smart Workflow starten"
  - "Mehr ueber das System erfahren"

building:
  - "Weiter bauen"
  - "Status Details anzeigen"
  - "Aktuelles Feature pausieren"
  - "Problem melden"

feature-complete:
  - "Release erstellen"
  - "Naechstes Feature starten"
  - "Code Review anfordern"
```

## Command Reference

Quick reference for all workflow commands:

```
Kern-Workflow (5 Phasen):
  /workflow:plan-product      — Phase 1: Produkt-Vision
  /workflow:shape-spec        — Phase 2: Feature-Requirements
  /workflow:write-spec        — Phase 3: Technische Spec
  /workflow:create-tasks      — Phase 4: Task-Breakdown
  /workflow:orchestrate-tasks — Phase 5: Ausfuehrung

Convenience:
  /workflow:smart-workflow    — Auto-detect + gefuehrter Flow
  /workflow:quick             — Schneller 3-Step fuer MVPs
  /workflow:help              — Diese Hilfe (kontextbasiert)
  /workflow:undo              — Letzte Workflow-Aenderungen rueckgaengig

Standards:
  /workflow:discover-standards — Standards aus Code extrahieren
  /workflow:index-standards    — Standards-Index aktualisieren
  /workflow:inject-standards   — Standards in Prompts einfuegen

NaNo Learning:
  /workflow:nano-status        — Lern-Status anzeigen
  /workflow:nano-toggle        — Learning ein/ausschalten
  /workflow:nano-config        — Einstellungen aendern
  /workflow:nano-session       — Aktuelle Session-Beobachtungen
  /workflow:nano-idea          — Idee fuer Verbesserungen sammeln
  /workflow:nano-reset         — Lern-Daten zuruecksetzen
  /workflow:review-candidates  — Evolution-Candidates reviewen
  /workflow:learning-report    — Umfassender Analyse-Report

Utilities:
  /workflow:release           — Version bump + Changelog
  /workflow:devlog            — Session-Dokumentation erstellen
  /workflow:web-setup         — Web-Services konfigurieren
  /workflow:visual-clone      — Design-Tokens extrahieren
```

## Tips

- **Unsicher?** Nutze `/workflow:smart-workflow` — es erkennt automatisch wo du bist
- **Schnell?** Beschreibe einfach was du willst — Auto-Delegation uebernimmt
- **Problem?** Beschreibe es direkt, der passende Agent wird eingesetzt
