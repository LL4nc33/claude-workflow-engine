# Quick Workflow

Schneller 3-Step-Workflow für MVPs und kleine Features. Konsolidiert die 5-Phase-Pipeline zu: **Plan → Spec → Build**

## Wann verwenden

- Kleine Features (< 5 Dateien)
- MVPs und Prototypen
- Wenn du schnell Ergebnisse brauchst
- Solo-Development ohne komplexe Koordination

Für größere Features mit mehreren Agents: `/workflow:smart-workflow`

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Delegate implementation** — Use Task tool with builder agent for coding
- **Keep it lean** — Minimal artifacts, maximal output
- **Skip quality gates** — Quick mode trusts the developer

## Process

### Step 1: Quick Plan (Plan + Shape kombiniert)

Frage den User mit AskUserQuestion:

```
Quick Workflow gestartet!

Was willst du bauen?
- Kurze Beschreibung (1-2 Sätze)
- Wichtigste Anforderung
- Tech-Constraints (falls vorhanden)
```

Erstelle basierend auf Antwort eine kompakte `quick-spec.md`:

```markdown
# Quick Spec: {Feature Name}

**Ziel:** {1-Satz Beschreibung}
**Datum:** {YYYY-MM-DD}

## Was

{2-3 Bullet Points}

## Akzeptanzkriterien

- [ ] {Kriterium 1}
- [ ] {Kriterium 2}
- [ ] {Kriterium 3}

## Dateien

- {datei1.ts} - {purpose}
- {datei2.ts} - {purpose}
```

Speichere unter: `workflow/specs/{YYYYMMDD}-quick-{slug}/quick-spec.md`

### Step 2: Confirm & Delegate

Zeige dem User die Spec und frage:

```
Quick Spec erstellt:

{Feature Name}
- {Kriterium 1}
- {Kriterium 2}
- {Dateien}

Soll ich das jetzt implementieren?
```

Options:
1. "Ja, los!" (recommended)
2. "Spec anpassen"
3. "Abbrechen"

### Step 3: Build (via builder Agent)

**WICHTIG: Delegation an builder Agent!**

Nutze das Task tool um die Implementation zu delegieren:

```
Du implementierst das Feature "{Feature Name}" im Quick-Mode.

## Spec
{Inhalt der quick-spec.md}

## Aufgabe
Implementiere alle Dateien und erfülle die Akzeptanzkriterien.

## Standards
{Inject: global/tech-stack + relevante domain standards}

## Constraints
- Folge bestehenden Projekt-Patterns
- Halte den Code simpel und lesbar
- Schreibe keine Tests (Quick-Mode)
- Flagge Unklarheiten statt zu raten
```

### Step 4: Report

Nach Completion durch den Agent:

```
Quick Build abgeschlossen: {Feature Name}

Erstellte Dateien:
- {file1} ✓
- {file2} ✓

Akzeptanzkriterien:
- [x] {Kriterium 1}
- [x] {Kriterium 2}

Nächste Schritte:
1. Code reviewen
2. Manuell testen
3. Tests hinzufügen (optional: /workflow:smart-workflow für testing phase)
```

Update `quick-spec.md` mit Status: **Completed**

## Comparison: Quick vs Full

| Aspekt | Quick (3-Step) | Full (5-Phase) |
|--------|----------------|----------------|
| Phasen | Plan→Spec→Build | Plan→Shape→Spec→Tasks→Build |
| Artifacts | 1 (quick-spec.md) | 5+ (shape, spec, tasks, progress...) |
| Quality Gates | Keine | 4 Gates |
| Multi-Agent | Nur builder | Alle 9 Agents |
| Zeit | ~10 min | ~30-60 min |
| Ideal für | MVPs, kleine Features | Production Features |

## Templates

### Quick Spec Template

```markdown
# Quick Spec: {Feature Name}

**Ziel:** {One-liner}
**Datum:** {YYYY-MM-DD}
**Status:** In Progress | Completed

## Was

- {Requirement 1}
- {Requirement 2}

## Akzeptanzkriterien

- [ ] {Testable criterion 1}
- [ ] {Testable criterion 2}

## Dateien

| Datei | Zweck |
|-------|-------|
| {path} | {purpose} |

## Notes

{Any additional context}
```

## Tips

- **Zu komplex?** Wechsle zu `/workflow:smart-workflow`
- **Tests nötig?** Nach quick-build: delegiere testing an builder agent
- **Security-relevant?** Nutze full workflow mit security gates
- **Team-Projekt?** Full workflow für bessere Koordination
