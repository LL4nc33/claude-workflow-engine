# Use Case: CLI in bestehendes Node.js Projekt integrieren

Die Claude Workflow Engine in ein bestehendes Express.js Projekt integrieren -- mit Konfliktprüfung, sicherem Install und Health Check.

## Szenario

Du hast ein bestehendes Express.js Projekt (REST API für ein E-Commerce Backend), das seit 8 Monaten in Entwicklung ist. Das Projekt hat bereits:

- Eine `.claude/`-Datei (nicht Verzeichnis) mit Claude-Notizen
- Ein `workflow/`-Verzeichnis mit Gulp-Task-Definitionen
- Bestehende `.gitignore`, `package.json`, Tests
- 3 Teammitglieder die aktiv entwickeln

Du willst die Claude Workflow Engine integrieren, ohne bestehende Strukturen zu zerstören.

---

## Durchlauf

### Schritt 1: Vorab-Check auf Konflikte

Bevor du irgendetwas installierst, prüfe auf potenzielle Konflikte:

```bash
workflow check . --type conflicts
```

**Output:**

```
Conflict Check Results:

  [CONFLICT] .claude/ - File exists (not a directory)
    Current: Regular file with text content (2.3 KB)
    Required: Directory for agent definitions
    Resolution: Rename existing file, then create directory

  [CONFLICT] workflow/ - Directory exists with different content
    Current: Contains gulp-tasks/ (3 files)
    Required: Engine structure (config.yml, standards/, product/, specs/)
    Resolution: Merge (engine files alongside existing content)

  [OK] .gitignore - File exists, can be extended
  [OK] package.json - File exists, no conflicts

Conflicts found: 2
Run 'workflow resolve .' for resolution options.
```

Zwei Konflikte gefunden. Schauen wir uns die Lösungsoptionen an:

```bash
workflow resolve .
```

**Output:**

```
Conflict Resolution Options:

1. .claude/ (file -> directory)
   [a] Rename .claude to .claude-notes.md, create .claude/ directory
   [b] Move file content into .claude/notes.md, create directory structure
   [c] Delete existing file, create fresh directory (DESTRUCTIVE)

   Recommended: Option [b]

2. workflow/ (directory merge)
   [a] Merge: Add engine files alongside existing gulp-tasks/
   [b] Namespace: Move existing content to workflow/legacy/
   [c] Relocate: Install engine to .workflow/ instead

   Recommended: Option [a]

Select resolution for each conflict, or use --auto for recommended options.
```

### Schritt 2: Konflikte aufloesen

Wir gehen mit den empfohlenen Optionen:

```bash
workflow resolve . --auto
```

**Output:**

```
Resolving conflicts:

  [1/2] .claude/ - Moving file content to .claude/notes.md
    Created: .claude/
    Moved: .claude (file) -> .claude/notes.md
    Done.

  [2/2] workflow/ - Merging with existing content
    Existing content preserved: workflow/gulp-tasks/ (3 files)
    Engine files will be added alongside.
    Done.

All conflicts resolved. Ready for installation.
```

### Schritt 3: Dry-Run Installation

Bevor die eigentliche Installation laeuft, ein Dry-Run:

```bash
workflow install . --dry-run
```

**Output:**

```
[DRY RUN] Installation Preview:

  .claude/
    notes.md              [EXISTING - preserved from conflict resolution]
    agents/
      architect.md        [NEW]
      explainer.md              [NEW]
      builder.md            [NEW]
      devops.md           [NEW]
      guide.md            [NEW]
      innovator.md        [NEW]
      quality.md          [NEW]
      researcher.md       [NEW]
      security.md         [NEW]
    settings.local.json   [NEW]
    CLAUDE.md             [NEW]

  workflow/
    gulp-tasks/           [EXISTING - 3 files preserved]
    config.yml            [NEW]
    orchestration.yml     [NEW]
    product/              [NEW - empty directory]
    specs/                [NEW - empty directory]
    standards/
      index.yml           [NEW]
      global/             [NEW - 2 files]
      api/                [NEW - 2 files]
      database/           [NEW - 1 file]
      devops/             [NEW - 3 files]
      frontend/           [NEW - 1 file]
      testing/            [NEW - 1 file]
      agents/             [NEW - 1 file]

  .gitignore              [APPEND - adding .local.md entries]

Summary:
  New files: 23
  Preserved files: 4
  Modified files: 1 (.gitignore)
  Deleted files: 0

No data loss detected. Proceed with 'workflow install .' (without --dry-run).
```

### Schritt 4: Installation durchfuehren

```bash
workflow install .
```

**Output:**

```
Installing Claude Workflow Engine...

  [1/4] Creating agent definitions...
    Created: .claude/agents/ (9 agents)
    Created: .claude/CLAUDE.md
    Created: .claude/settings.local.json

  [2/4] Setting up workflow structure...
    Created: workflow/config.yml
    Created: workflow/orchestration.yml
    Created: workflow/product/
    Created: workflow/specs/

  [3/4] Installing standards...
    Created: workflow/standards/index.yml
    Created: workflow/standards/global/ (2 standards)
    Created: workflow/standards/api/ (2 standards)
    Created: workflow/standards/database/ (1 standard)
    Created: workflow/standards/devops/ (3 standards)
    Created: workflow/standards/frontend/ (1 standard)
    Created: workflow/standards/testing/ (1 standard)
    Created: workflow/standards/agents/ (1 standard)

  [4/4] Updating .gitignore...
    Added: *.local.md
    Added: .claude/settings.local.json

Installation complete.
  Backup created: .workflow-backup-20240122-153012/
  Run 'workflow health .' to verify.
```

### Schritt 5: Health Check

```bash
workflow health .
```

**Output:**

```
Health Check Results:

  [OK] .claude/agents/ - 9 agent files present and valid
  [OK] .claude/CLAUDE.md - Project instructions present
  [OK] workflow/config.yml - Valid YAML, schema correct
  [OK] workflow/standards/index.yml - 11 standards registered
  [OK] workflow/product/ - Directory exists (empty, run plan-product)
  [OK] workflow/specs/ - Directory exists (empty, run shape-spec)
  [OK] workflow/gulp-tasks/ - Non-engine content preserved
  [OK] .gitignore - Local files excluded from version control

Status: HEALTHY (8/8 checks passed)
```

### Schritt 6: Status prüfen

```bash
workflow status .
```

**Output:**

```
Claude Workflow Engine Status:

  Version: 1.0.0
  Installed: 2024-01-22 15:30:12
  Path: /home/user/projects/ecommerce-api

  Product Phase:
    mission.md:    [NOT CREATED] - Run /workflow/plan-product
    roadmap.md:    [NOT CREATED]
    tech-stack.md: [NOT CREATED]

  Standards: 11 registered, 0 customized
  Specs: 0 features specified
  Agents: 9 available

  Next Step: Run /workflow/plan-product to define your product vision.
```

---

### Schritt 7: Bestehendes Projekt dokumentieren

Da das Projekt bereits existiert, nutze `plan-product` um den Ist-Zustand zu dokumentieren:

```
> /workflow/plan-product

Claude: Welches Problem loest dieses Produkt?
Du:     Wir bauen ein E-Commerce Backend (REST API) für einen
        Online-Marktplatz. Haendler listen Produkte, Kunden
        bestellen, das System verwaltet Bestellungen und Zahlungen.

Claude: Tech Stack?
Du:     Express.js, PostgreSQL mit Sequelize, Redis für Caching,
        Stripe für Payments. Tests mit Jest + Supertest.
```

Die `workflow/product/`-Dateien werden basierend auf dem bestehenden Projekt erstellt.

---

## Umgang mit Sonderfaellen

### Bestehende `.claude/` als Verzeichnis

Wenn bereits ein `.claude/`-Verzeichnis existiert (z.B. von einer frueheren Claude-Code-Nutzung):

```bash
workflow check . --type conflicts
```

```
  [CONFLICT] .claude/ - Directory exists with partial content
    Found: .claude/settings.json (1 file)
    Missing: agents/, CLAUDE.md
    Resolution: Extend existing directory
```

Hier wird die bestehende Struktur erweitert, nicht ersetzt.

### Bestehende `workflow/` mit gleichnamigen Dateien

Wenn dein Projekt zufaellig eine `workflow/config.yml` hat (z.B. für GitHub Actions):

```
  [CONFLICT] workflow/config.yml - File exists with different schema
    Current: GitHub Actions workflow config
    Required: Claude Workflow Engine config
    Resolution options:
      [a] Rename existing to workflow/config.github.yml
      [b] Install engine config as workflow/engine-config.yml
      [c] Relocate engine to .workflow/
```

### DSGVO/Datenschutz-Check

Fuer Projekte im EU-Raum, prüfe die DSGVO-Konformitaet:

```bash
workflow check . --type gdpr
```

```
GDPR/DSGVO Check Results:

  [OK] No PII detected in standards files
  [OK] .local.md files in .gitignore
  [OK] settings.local.json in .gitignore
  [OK] No external data transmission configured
  [WARN] workflow/config.yml: No data_residency field set
    Recommendation: Add 'data_residency: eu-central-1' to config.yml

Status: PASS (4 OK, 1 Warning)
```

### Berechtigungen prüfen

```bash
workflow check . --type permissions
```

```
Permission Check Results:

  [OK] .claude/ - Read/Write accessible
  [OK] workflow/ - Read/Write accessible
  [OK] .gitignore - Writable
  [WARN] workflow/gulp-tasks/ - Contains executable files
    Note: Engine will not modify these files

Status: PASS (3 OK, 1 Warning)
```

---

## Rollback bei Problemen

Falls etwas schiefgeht, kannst du die Installation rueckgaengig machen:

```bash
workflow rollback .
```

```
Rollback Options:

  Backup found: .workflow-backup-20240122-153012/
  Created: 2024-01-22 15:30:12 (2 hours ago)

  This will:
    - Remove all engine-created files (23 files)
    - Restore .claude from .claude/notes.md back to .claude (file)
    - Restore original .gitignore
    - Preserve workflow/gulp-tasks/ (was not modified)

  Proceed? [y/N]
```

---

## Ergebnis

| Schritt | Command | Was passiert |
|---------|---------|--------------|
| Konflikt-Check | `workflow check . --type conflicts` | 2 Konflikte erkannt |
| Aufloesung | `workflow resolve . --auto` | Konflikte sicher aufgeloest |
| Dry-Run | `workflow install . --dry-run` | Vorschau ohne Aenderungen |
| Installation | `workflow install .` | Engine installiert, Backup erstellt |
| Verifikation | `workflow health .` | 8/8 Checks bestanden |
| Status | `workflow status .` | Naechste Schritte angezeigt |

**Wichtig:** Zu keinem Zeitpunkt wurden bestehende Dateien geloescht oder überschrieben. Die Engine arbeitet additiv und erstellt bei jeder Installation ein Backup.

---

## Variationen

### Monorepo mit mehreren Packages

Bei Monorepos installierst du die Engine im Root:

```bash
workflow install /path/to/monorepo
```

Die Standards gelten dann für alle Packages. Spezifische Overrides kannst du über Domain-Erweiterungen in den Standards definieren.

### Projekt ohne Node.js

Die Claude Workflow Engine braucht Node.js nur für das CLI selbst. Das Zielprojekt kann in jeder Sprache sein (Python, Go, Rust). Die Standards und Agents werden entsprechend angepasst:

```bash
# Python-Projekt
workflow install /path/to/python-project
# -> Standards werden für Python-Konventionen konfiguriert
```

### CI/CD-Integration

Nach der Installation kannst du den Health-Check in deine Pipeline einbauen:

```yaml
# .github/workflows/ci.yml
- name: Workflow Engine Health Check
  run: workflow health . --exit-code
  # Exit Code 1 bei fehlgeschlagenen Checks
```

---

## Verwandte Dokumentation

- [CLI-Referenz](../cli.md) -- Alle Befehle im Detail
- [Konfiguration](../konfiguration.md) -- config.yml Optionen
- [Standards anpassen](../standards.md) -- Eigene Standards definieren
- [Erste Schritte](../erste-schritte.md) -- Einfuehrung für neue Nutzer
