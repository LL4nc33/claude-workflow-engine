# CLI-Referenz

Das Claude Workflow Engine CLI (`workflow`) stellt Safety-Tools fuer Installation, Health-Monitoring, Konflikterkennung und DSGVO-Compliance bereit. Es laeuft als Node.js-Applikation und arbeitet vollstaendig lokal.

## Installation

```bash
cd cli
npm install
npm run build
```

Nach dem Build ist das CLI unter `cli/dist/index.js` verfuegbar:

```bash
node cli/dist/index.js --help
```

Ausgabe:

```
Usage: workflow <command> [options] [path]

Commands:
  install     Install the engine into a project
  status      Show installation status
  health      Run health checks
  check       Run conflict/permission/GDPR checks
  resolve     Resolve detected conflicts
  rollback    Rollback to previous backup
  version     Show version
  help        Show help

Options:
  --help, -h     Show help
  --version      Show version number
```

Alternativ kannst du das CLI global verlinken:

```bash
npm link   # Aus dem cli/-Verzeichnis
workflow --help
```

**Voraussetzung:** Node.js >= 18

## Commands

```
workflow <command> [options] [path]
```

| Command | Zweck |
|---------|-------|
| `install` | Engine in ein Projekt installieren |
| `status` | Installationsstatus anzeigen |
| `health` | Health Checks ausfuehren |
| `check` | Konflikte, Permissions und DSGVO pruefen |
| `resolve` | Erkannte Konflikte loesen |
| `rollback` | Backup wiederherstellen |
| `version` | Version anzeigen |
| `help` | Hilfe anzeigen |

Wenn `[path]` weggelassen wird, arbeiten alle Commands im aktuellen Verzeichnis.

---

## workflow install

Installiert die Claude Workflow Engine in ein Zielprojekt.

```bash
workflow install [options] [path]
```

**Optionen:**

| Flag | Beschreibung |
|------|--------------|
| `--global` | Global installieren (gemeinsame Konfiguration) |
| `--local` | Lokal installieren (projektspezifisch, Standard) |
| `--mode <mode>` | `template` oder `integrated` |
| `--profile <profile>` | `default`, `node`, `python` oder `rust` |
| `--dry-run` | Aenderungen nur anzeigen, nichts schreiben |
| `--force`, `-f` | Trotz Warnungen fortfahren |
| `--verbose`, `-v` | Detaillierte Ausgabe |

**Beispiele:**

```bash
# Vorschau was installiert wuerde
workflow install --dry-run --verbose /path/to/project
```

Ausgabe:

```
[DRY-RUN] Would create: .claude/agents/architect.md
[DRY-RUN] Would create: .claude/agents/debug.md
[DRY-RUN] Would create: workflow/config.yml
[DRY-RUN] Would create: workflow/standards/index.yml
...
[DRY-RUN] 32 files would be created
```

```bash
# Mit Node.js-Profil installieren
workflow install --profile node .
```

Ausgabe:

```
Claude Workflow Engine Install

  Mode:    template
  Scope:   local
  Profile: node
  Target:  /path/to/project

  Creating directory structure...
  Copying agents, commands, skills...
  Applying standards...
  Merging settings...
  Updating .gitignore...
  Recording installation state...

  [DONE] Installation complete. 32 files created.
  Run "workflow health" to verify.
```

```bash
# Global mit Force installieren
workflow install --global --force /path/to/project
```

**Was der Command tut:**

1. Fuehrt Preflight-Checks aus (Konflikte, Permissions, DSGVO)
2. Erstellt die Verzeichnisstruktur (`.claude/`, `workflow/`)
3. Kopiert Agents, Commands, Skills, Standards und Konfiguration
4. Merged Settings in `.claude/settings.local.json`
5. Aktualisiert `.gitignore` fuer sensible Dateien
6. Speichert den Installationszustand fuer Health Checks und Rollback

---

## workflow status

Zeigt den aktuellen Installationsstatus an.

```bash
workflow status [options] [path]
```

**Optionen:**

| Flag | Beschreibung |
|------|--------------|
| `--verbose`, `-v` | Detaillierte Dateiliste und History anzeigen |

**Beispiel:**

```bash
workflow status
```

Ausgabe:

```
Claude Workflow Engine Status

  Version:   0.2.0
  Mode:      template
  Scope:     local
  Profile:   node
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
  History events: 3
```

```bash
workflow status --verbose
```

Ausgabe:

```
Claude Workflow Engine Status

  Version:   0.2.0
  Mode:      template
  Scope:     local
  Profile:   node
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
    .claude/CLAUDE.md
    .claude/agents/architect.md
    .claude/agents/debug.md
    ...

  History events: 3
    2026-01-23T14:30:00Z  install  success
    2026-01-22T10:15:00Z  health   fix-applied
    2026-01-20T09:00:00Z  install  success
```

---

## workflow health

Fuehrt Health Checks auf einer bestehenden Installation aus.

```bash
workflow health [options] [path]
```

**Optionen:**

| Flag | Beschreibung |
|------|--------------|
| `--fix` | Erkannte Probleme automatisch beheben |
| `--report` | Health-Report als JSON-Datei speichern |
| `--verbose`, `-v` | Detaillierte Ausgabe |

**Ausgefuehrte Checks:**

| Kategorie | Was geprueft wird |
|-----------|-------------------|
| Core Files | `config.yml`, `CLAUDE.md`, `settings.local.json`, `.gitignore` |
| Installation State | State-Datei existiert, keine fehlgeschlagenen Events |
| File Integrity | Alle getrackten Dateien existieren und Checksummen stimmen |
| Settings | Erforderliche Permissions in `settings.local.json` vorhanden |
| DSGVO | Gitignore-Patterns, keine PII in Standards/Specs |
| Directory Structure | `workflow/`, `workflow/standards/`, `.claude/agents/`, etc. |

**Beispiel:**

```bash
workflow health
```

Ausgabe:

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [WARN] Missing: .gitignore

Installation State
  [PASS] Installed: v0.2.0 (2026-01-23T14:30:00Z)

File Integrity
  [PASS] 32 files intact

Settings
  [PASS] All required permissions present

DSGVO/GDPR
  [PASS] DSGVO/GDPR compliant

Directory Structure
  [PASS] workflow/
  [PASS] workflow/standards/
  [PASS] .claude/agents/

Summary
  Overall Status: HEALTHY
  Passed: 8 | Warnings: 1 | Errors: 0
```

**Mit `--fix`:**

```bash
workflow health --fix
```

Ausgabe:

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [FIXED] Created: .gitignore

Summary
  Overall Status: HEALTHY
  Passed: 8 | Fixed: 1 | Errors: 0
```

Auto-Fixes umfassen:
- Fehlende Verzeichnisse erstellen
- Fehlende Permissions in Settings ergaenzen
- DSGVO Auto-Fix (Gitignore-Patterns hinzufuegen)

**Mit `--report`:**

```bash
workflow health --report
```

Speichert `.workflow-health-report.json` im Zielverzeichnis.

---

## workflow check

Fuehrt spezifische Checks aus, ohne die vollstaendige Health-Suite.

```bash
workflow check [options] [path]
```

**Optionen:**

| Flag | Beschreibung |
|------|--------------|
| `--conflicts` | Datei- und Command-Konflikte pruefen |
| `--permissions` | Dateisystem-Berechtigungen pruefen |
| `--gdpr` | DSGVO-Compliance pruefen |
| `--fix` | Automatisch beheben wo moeglich |
| `--verbose`, `-v` | Detaillierte Ausgabe |

Wenn kein spezifischer Check angegeben wird, werden alle drei ausgefuehrt.

### Konflikterkennung (`--conflicts`)

Prueft auf:
- **Dateikonflikte:** Engine-Dateien die bereits im Ziel existieren (mit anderem Inhalt)
- **Command-Konflikte:** Slash-Commands die mit bestehenden Commands kollidieren
- **Permission-Konflikte:** Dateien/Verzeichnisse die nicht beschreibbar sind

```bash
workflow check --conflicts /path/to/project
```

Ausgabe:

```
Conflict Detection
  [WARN] 2 file conflict(s):
    [MODIFIED] .claude/settings.local.json
    [EXISTING] workflow/config.yml
  [FAIL] 1 command conflict(s):
    /plan-product (existing: .claude/commands/plan-product.md)
```

### Permission-Check (`--permissions`)

Prueft Schreibzugriff auf Zielverzeichnisse und Settings-Dateien:

```bash
workflow check --permissions
```

Ausgabe:

```
Permission Check
  [PASS] /path/to/project/.claude/ (writable)
  [PASS] /path/to/project/workflow/ (writable)
  [PASS] /path/to/project/.gitignore (writable)
```

### DSGVO-Check (`--gdpr`)

Prueft auf:
- Sensible Datei-Patterns in `.gitignore` (`.env`, `*.local.md`, Credentials)
- PII in Standards- oder Spec-Dateien
- Korrekte Data-Residency-Konfiguration

```bash
workflow check --gdpr --fix
```

Ausgabe:

```
DSGVO/GDPR Check
  [FIXED] Added .gitignore patterns: .env, *.local.md, credentials.*
  [PASS] No PII detected in standards/specs
  [PASS] Data residency: eu-central-1
```

Das `--fix`-Flag fuegt fehlende Gitignore-Patterns automatisch hinzu.

---

## workflow resolve

Loest Konflikte die von `workflow check --conflicts` erkannt wurden.

```bash
workflow resolve [options] [path]
```

**Optionen:**

| Flag | Beschreibung |
|------|--------------|
| `--auto-fix` | Konflikte automatisch loesen (erstellt Backups) |
| `--verbose`, `-v` | Detaillierte Ausgabe |

**Beispiel:**

```bash
workflow resolve --auto-fix /path/to/project
```

Ausgabe:

```
Claude Workflow Engine Resolve

  Resolving 2 file conflict(s)...
    [BACKUP] .claude/settings.local.json -> .claude/settings.local.json.bak
    [MERGED] .claude/settings.local.json
    [BACKUP] workflow/config.yml -> workflow/config.yml.bak
    [REPLACED] workflow/config.yml

  [DONE] 2 conflicts resolved.
  Run "workflow health" to verify.
```

**Resolution-Strategien:**

- Erstellt Backups von konfliktbehafteten Dateien vor dem Ueberschreiben
- Merged Settings anstatt sie zu ersetzen
- Meldet Command-Konflikte die manuell geloest werden muessen

---

## workflow rollback

Stellt das letzte Backup wieder her, das bei Install- oder Update-Operationen erstellt wurde.

```bash
workflow rollback [path]
```

**Beispiel:**

```bash
workflow rollback /path/to/project
```

Ausgabe:

```
Claude Workflow Engine Rollback

  Available backups: 3
    2026-01-23T14:30:00Z
    2026-01-22T10:15:00Z
    2026-01-20T09:00:00Z

  Rolling back to most recent backup...
  [DONE] Rollback complete.
  Run "workflow health" to verify the rollback.
```

---

## workflow version

Zeigt die aktuelle Version des CLI an.

```bash
workflow version
```

Ausgabe:

```
workflow v0.2.0
```

---

## workflow help

Zeigt die Hilfe-Uebersicht an.

```bash
workflow help
```

Ausgabe:

```
Usage: workflow <command> [options] [path]

Commands:
  install     Install the engine into a project
  status      Show installation status
  health      Run health checks
  check       Run conflict/permission/GDPR checks
  resolve     Resolve detected conflicts
  rollback    Rollback to previous backup
  version     Show version
  help        Show help

Options:
  --help, -h     Show help
  --version      Show version number

Run "workflow <command> --help" for details on a specific command.
```

---

## Exit-Codes

| Code | Bedeutung |
|------|-----------|
| 0 | Erfolg (bzw. Installation gesund) |
| 1 | Fehler (bzw. Health Check fehlgeschlagen) |

## Datenschutz

Das CLI arbeitet vollstaendig lokal. Es:

- Fuehrt keine Netzwerk-Requests aus
- Speichert keine Daten ausserhalb des Projektverzeichnisses
- Erzeugt keine Telemetrie oder Analytics
- Schreibt ausschliesslich in den Zielpfad (plus `.workflow-health-report.json` bei `--report`)

## Siehe auch

- [Erste Schritte](erste-schritte.md) -- Ersteinrichtung
- [Integration](integration.md) -- CLI-Integration in bestehende Projekte
- [Konfiguration](konfiguration.md) -- Dateien die das CLI erstellt und verwaltet
