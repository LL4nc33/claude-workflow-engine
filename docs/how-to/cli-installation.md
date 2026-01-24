# How-To: CLI installieren und nutzen

Dieser Guide fuehrt dich durch die Installation des Claude Workflow Engine CLI und zeigt die wichtigsten Befehle fuer den taeglichen Einsatz.

## Ziel

Nach diesem Guide hast du:

- Das CLI gebaut und einsatzbereit
- Die Workflow Engine in ein Projekt installiert
- Einen Health Check erfolgreich durchgefuehrt
- Das CLI optional global verfuegbar gemacht

## Voraussetzungen

- **Node.js >= 18** (pruefe mit `node --version`)
- **npm** (wird mit Node.js mitgeliefert)
- Ein Projektverzeichnis in das du die Engine installieren willst
- Terminal-Zugang (Bash, Zsh oder PowerShell)

---

## Schritt 1: Repository klonen und Build ausfuehren

### Repository klonen

```bash
git clone https://github.com/your-org/oidanice-agents.git
cd oidanice-agents
```

### Dependencies installieren

```bash
cd cli
npm install
```

Erwartete Ausgabe:

```
added 42 packages in 3s
```

### Build ausfuehren

```bash
npm run build
```

Erwartete Ausgabe:

```
> workflow-cli@0.2.0 build
> tsc

Successfully compiled to cli/dist/
```

Nach dem Build ist das CLI unter `cli/dist/index.js` verfuegbar.

### Funktionstest

```bash
node cli/dist/index.js --help
```

Erwartete Ausgabe:

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

---

## Schritt 2: Dry-Run (Vorabpruefung)

Bevor du tatsaechlich installierst, pruefe was passieren wuerde:

```bash
node cli/dist/index.js install --dry-run --verbose /path/to/your/project
```

Erwartete Ausgabe:

```
[DRY-RUN] Would create: .claude/agents/architect.md
[DRY-RUN] Would create: .claude/agents/debug.md
[DRY-RUN] Would create: .claude/agents/devops.md
[DRY-RUN] Would create: .claude/agents/orchestrator.md
[DRY-RUN] Would create: .claude/agents/researcher.md
[DRY-RUN] Would create: .claude/agents/security.md
[DRY-RUN] Would create: .claude/agents/ask.md
[DRY-RUN] Would create: workflow/config.yml
[DRY-RUN] Would create: workflow/standards/index.yml
[DRY-RUN] Would create: workflow/standards/global/tech-stack.md
[DRY-RUN] Would create: workflow/standards/global/naming.md
...
[DRY-RUN] 32 files would be created
```

### Was der Dry-Run prueft

- Welche Dateien erstellt werden
- Ob Konflikte mit bestehenden Dateien existieren
- Ob Schreibberechtigungen vorhanden sind
- Ob DSGVO-relevante Patterns beruecksichtigt sind

---

## Schritt 3: Installation in ein Projekt

### Standard-Installation (lokal)

```bash
node cli/dist/index.js install /path/to/your/project
```

Erwartete Ausgabe:

```
Claude Workflow Engine Install

  Mode:    template
  Scope:   local
  Profile: default
  Target:  /path/to/your/project

  Creating directory structure...
  Copying agents, commands, skills...
  Applying standards...
  Merging settings...
  Updating .gitignore...
  Recording installation state...

  [DONE] Installation complete. 32 files created.
  Run "workflow health" to verify.
```

### Mit Node.js-Profil

```bash
node cli/dist/index.js install --profile node /path/to/your/project
```

Profile passen die Standards an den Tech Stack an:

| Profil | Optimiert fuer |
|--------|----------------|
| `default` | Allgemeine Projekte |
| `node` | Node.js / TypeScript |
| `python` | Python-Projekte |
| `rust` | Rust-Projekte |

### Installation erzwingen (bei Warnungen)

```bash
node cli/dist/index.js install --force /path/to/your/project
```

Das `--force`-Flag ueberspringt Warnungen (z.B. bei bestehenden Dateien). Backups werden trotzdem erstellt.

---

## Schritt 4: Health Check nach Installation

Pruefe ob die Installation korrekt ist:

```bash
node cli/dist/index.js health /path/to/your/project
```

Erwartete Ausgabe bei erfolgreicher Installation:

```
Claude Workflow Engine Health Check

Core Files
  [PASS] workflow/config.yml
  [PASS] .claude/CLAUDE.md
  [PASS] .claude/settings.local.json
  [PASS] .gitignore

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
  Passed: 9 | Warnings: 0 | Errors: 0
```

### Bei Problemen: Auto-Fix

```bash
node cli/dist/index.js health --fix /path/to/your/project
```

Auto-Fixes umfassen:

- Fehlende Verzeichnisse erstellen
- Fehlende Permissions in Settings ergaenzen
- DSGVO-Patterns in `.gitignore` hinzufuegen

### Health Report speichern

```bash
node cli/dist/index.js health --report /path/to/your/project
```

Speichert `.workflow-health-report.json` im Projektverzeichnis.

---

## Schritt 5: Installations-Status pruefen

```bash
node cli/dist/index.js status /path/to/your/project
```

Erwartete Ausgabe:

```
Claude Workflow Engine Status

  Version:   0.2.0
  Mode:      template
  Scope:     local
  Profile:   default
  Installed: 2026-01-23T14:30:00Z

  Files tracked: 32
  History events: 1
```

Fuer detaillierte Informationen:

```bash
node cli/dist/index.js status --verbose /path/to/your/project
```

---

## Schritt 6: Globale Installation mit npm link

Damit du `workflow` ueberall im Terminal nutzen kannst, ohne den vollen Pfad anzugeben:

```bash
cd cli
npm link
```

Erwartete Ausgabe:

```
/usr/local/lib/node_modules/workflow-cli -> /path/to/oidanice-agents/cli
/usr/local/bin/workflow -> /usr/local/lib/node_modules/workflow-cli/dist/index.js
```

Danach kannst du von ueberall aufrufen:

```bash
workflow --help
workflow install /path/to/project
workflow health /path/to/project
workflow status
```

### Link entfernen

```bash
cd cli
npm unlink
```

---

## Schritt 7: Weitere nuetzliche Commands

### Konflikte pruefen

```bash
workflow check /path/to/project
```

Prueft auf Datei-Konflikte, Permission-Probleme und DSGVO-Compliance.

### Konflikte loesen

```bash
workflow resolve --auto-fix /path/to/project
```

Erstellt Backups und loest Konflikte automatisch.

### Rollback

```bash
workflow rollback /path/to/project
```

Stellt das letzte Backup wieder her (z.B. nach einer fehlgeschlagenen Installation).

### Version pruefen

```bash
workflow version
```

Ausgabe:

```
workflow v0.2.0
```

---

## Troubleshooting

### Problem: "command not found: workflow"

**Ursache:** `npm link` wurde nicht ausgefuehrt oder der PATH stimmt nicht.

**Loesung:**

```bash
# Pruefe ob npm globales bin-Verzeichnis im PATH ist
npm config get prefix
# Ausgabe z.B.: /usr/local

# Pruefe ob /usr/local/bin im PATH ist
echo $PATH | tr ':' '\n' | grep -q "/usr/local/bin" && echo "OK" || echo "FEHLT"

# Alternative: Direkt ausfuehren
node /path/to/oidanice-agents/cli/dist/index.js --help
```

### Problem: "Cannot find module" beim Build

**Ursache:** Dependencies nicht installiert.

**Loesung:**

```bash
cd cli
rm -rf node_modules
npm install
npm run build
```

### Problem: "Permission denied" bei Installation

**Ursache:** Keine Schreibrechte im Zielverzeichnis.

**Loesung:**

```bash
# Berechtigungen pruefen
workflow check --permissions /path/to/project

# Berechtigungen setzen (Linux/macOS)
chmod -R u+w /path/to/project/.claude /path/to/project/workflow
```

### Problem: "ENOENT: no such file or directory"

**Ursache:** Das Zielverzeichnis existiert nicht.

**Loesung:**

```bash
# Verzeichnis erstellen
mkdir -p /path/to/project

# Dann installieren
workflow install /path/to/project
```

### Problem: Health Check zeigt Fehler

**Ursache:** Installation ist unvollstaendig oder Dateien wurden manuell geloescht.

**Loesung:**

```bash
# Auto-Fix versuchen
workflow health --fix /path/to/project

# Wenn das nicht hilft: Neuinstallation
workflow install --force /path/to/project
```

### Problem: Konflikte bei Re-Installation

**Ursache:** Bestehende Dateien die sich von den Engine-Dateien unterscheiden.

**Loesung:**

```bash
# Konflikte anzeigen
workflow check --conflicts /path/to/project

# Automatisch loesen (erstellt Backups)
workflow resolve --auto-fix /path/to/project

# Oder: Rollback und neu installieren
workflow rollback /path/to/project
workflow install --force /path/to/project
```

### Problem: Node.js Version zu alt

**Ursache:** Node.js < 18.

**Loesung:**

```bash
# Version pruefen
node --version

# Update via nvm (empfohlen)
nvm install 18
nvm use 18

# Oder via Package Manager
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (Homebrew):
brew install node@18
```

---

## Ergebnis

Du hast jetzt:

- Das CLI erfolgreich gebaut
- Die Workflow Engine in ein Projekt installiert
- Einen Health Check ohne Fehler durchgefuehrt
- (Optional) Das CLI global verfuegbar gemacht

## Naechste Schritte

- **Erstes Feature entwickeln:** Siehe [Neues Feature entwickeln](neues-feature-entwickeln.md)
- **Standards anpassen:** Siehe [Standards erweitern](standards-erweitern.md)
- **Eigene Agents:** Siehe [Eigenen Agent erstellen](eigenen-agent-erstellen.md)
- **Workflow starten:** Fuehre `/workflow/plan-product` in Claude Code aus

## Zusammenfassung der wichtigsten Commands

| Command | Zweck |
|---------|-------|
| `workflow install [path]` | Engine in Projekt installieren |
| `workflow install --dry-run [path]` | Vorschau ohne Aenderungen |
| `workflow status [path]` | Installationsstatus anzeigen |
| `workflow health [path]` | Health Checks ausfuehren |
| `workflow health --fix [path]` | Probleme automatisch beheben |
| `workflow check [path]` | Konflikte/Permissions/DSGVO pruefen |
| `workflow resolve --auto-fix [path]` | Konflikte loesen |
| `workflow rollback [path]` | Backup wiederherstellen |
| `workflow version` | Version anzeigen |

## Siehe auch

- [CLI-Referenz](../cli.md) -- Vollstaendige Command-Dokumentation
- [Konfiguration](../konfiguration.md) -- Dateien die das CLI erstellt
- [Erste Schritte](../erste-schritte.md) -- Ersteinrichtung des Projekts
- [Workflow-Guide](../workflow.md) -- Nach der Installation: der 5-Phasen-Workflow
