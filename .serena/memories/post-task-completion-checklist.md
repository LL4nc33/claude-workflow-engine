# Post-Task-Completion Checklist

## Wann anwenden?
Nach jedem abgeschlossenen Task, Feature oder Release - bevor der Task als "fertig" gilt.

## Pflicht-Schritte

### 1. Build & Tests
```bash
npm run build && npm test
```
- Alle Tests muessen bestanden sein (0 Fehler)
- Build darf keine Fehler werfen

### 2. Version-Konsistenz pruefen
Wenn eine Version geaendert wurde (z.B. 0.1.0 → 0.2.0), sicherstellen dass ALLE Stellen aktualisiert sind:

```bash
grep -r "alte-version" --include="*.{ts,json,yml,md}" .
```

Typische Stellen die vergessen werden:
- `package.json` (version)
- `package-lock.json` (regenerieren mit `npm install --package-lock-only`)
- `src/index.ts` (VERSION Konstante)
- `src/lib/state-manager.ts` (CURRENT_VERSION)
- `workflow/config.yml` und `workflow/orchestration.yml`
- Docs und README-Dateien (Beispiel-Outputs mit Versionen)
- CLI Template-Dateien (`cli/templates/base/`)

### 3. Dokumentation synchron halten (DE + EN)
Pruefen ob alle Aenderungen in BEIDEN Sprachen reflektiert sind:

**Root-Level:**
- `README.md` (DE) ↔ `README_EN.md` (EN)

**Docs:**
- `docs/*.md` (DE) ↔ `docs/en/*.md` (EN)
- `docs/how-to/*.md` (DE) ↔ `docs/en/how-to/*.md` (EN)

**CLI Templates (identisch mit Root!):**
- `cli/templates/base/docs/*.md` muss mit `docs/*.md` synchron sein
- `cli/templates/base/docs/en/*.md` muss mit `docs/en/*.md` synchron sein

**Mapping der Dateinamen:**
| Deutsch | Englisch |
|---------|----------|
| agenten.md | agents.md |
| erste-schritte.md | getting-started.md |
| konfiguration.md | configuration.md |
| plattform-architektur.md | platform-architecture.md |
| tipps.md | tips.md |
| faq.md | faq.md |
| cli.md | cli.md |
| integration.md | integration.md |
| standards.md | standards.md |
| workflow.md | workflow.md |

### 4. CLI Template-Sync
Wenn Root-Dateien geaendert wurden, muessen die CLI-Templates identisch aktualisiert werden:

| Root | Template |
|------|----------|
| `.claude/agents/*.md` | `cli/templates/base/.claude-agents/*.md` |
| `.claude/skills/workflow/*/SKILL.md` | `cli/templates/base/.claude-skills/workflow/*/SKILL.md` |
| `.claude/CLAUDE.md` | `cli/templates/base/.claude-CLAUDE.md` |
| `workflow/config.yml` | `cli/templates/base/workflow/config.yml` |
| `workflow/orchestration.yml` | `cli/templates/base/workflow/orchestration.yml` |
| `.claude-plugin/plugin.json` | `cli/templates/base/.claude-plugin/plugin.json` |
| `hooks/*` | `cli/templates/base/hooks/*` |
| `docs/*` | `cli/templates/base/docs/*` |

### 5. Finale Verifikation
```bash
# Keine veralteten Versionen mehr
grep -r "alte-version" --include="*.{ts,json,yml,md}" . | grep -v node_modules | grep -v progress.md

# Build + Tests nochmal
npm run build && npm test
```

## Reihenfolge
1. Code-Aenderungen abschliessen
2. Build & Tests
3. Version-Check
4. Docs-Sync (DE ↔ EN)
5. Template-Sync (Root ↔ CLI)
6. Finale Verifikation
7. Progress/Status aktualisieren
