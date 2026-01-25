# Integrations-Guide

Wie du Claude Workflow Engine in ein bestehendes Projekt integrierst. Dieser Guide behandelt CLI-basierte und manuelle Installation, Konfliktloesung und Deinstallation.

## Bevor du startest

Pruefe, ob in deinem Projekt bereits Folgendes existiert:

- `.claude/` Verzeichnis (Claude Code Konfiguration)
- `.claude/settings.local.json` (Claude Code Berechtigungen)
- `.claude/agents/` (bestehende Agenten)
- `.claude/commands/` (bestehende Slash Commands)
- `CLAUDE.md` (bestehender Projektkontext)
- `workflow/` Verzeichnis (gleichnamiges Verzeichnis für andere Zwecke)

Die CLI erkennt Konflikte automatisch und überschreibt nichts ohne Rueckfrage.

## Methode 1: CLI-Installation (empfohlen)

Die CLI übernimmt Konflikterkennung, Backups und Berechtigungen.

### Schritt 1: CLI bauen

```bash
# Aus dem claude-workflow-engine Repository
cd cli
npm install
npm run build
```

### Schritt 2: Aenderungen vorschau (Dry Run)

Führe immer zuerst einen Dry Run durch:

```bash
node dist/index.js install --dry-run --verbose /pfad/zu/deinem/projekt
```

Die Ausgabe zeigt dir exakt, welche Dateien erstellt, geaendert oder übersprungen werden.

### Schritt 3: Konflikte pruefen

```bash
node dist/index.js check --conflicts /pfad/zu/deinem/projekt
```

Moegliche Konflikttypen:

- **File Conflicts:** Dein Projekt hat bereits Dateien, die die Engine erstellen will
- **Command Conflicts:** Bestehende Slash Commands mit denselben Namen
- **Permission Issues:** Verzeichnisse, in die die CLI nicht schreiben kann

### Schritt 4: Installieren

```bash
# Standard-Installation (lokal)
node dist/index.js install /pfad/zu/deinem/projekt

# Mit einem bestimmten Tech-Profil
node dist/index.js install --profile node /pfad/zu/deinem/projekt

# Force-Installation (überspringt nicht-blockierende Warnungen)
node dist/index.js install --force /pfad/zu/deinem/projekt
```

### Schritt 5: Verifizieren

```bash
node dist/index.js health /pfad/zu/deinem/projekt
```

Ein erfolgreicher Health Check zeigt dir den Status aller installierten Komponenten.

## Methode 2: Manuelle Installation

Falls du volle Kontrolle bevorzugst, kopiere die Dateien manuell.

### Schritt 1: Verzeichnisstruktur erstellen

```bash
cd /pfad/zu/deinem/projekt
mkdir -p .claude/agents
mkdir -p .claude/commands/workflow
mkdir -p .claude/skills/workflow
mkdir -p .claude-plugin
mkdir -p hooks/scripts
mkdir -p workflow/standards/global
mkdir -p workflow/standards/api
mkdir -p workflow/standards/database
mkdir -p workflow/standards/devops
mkdir -p workflow/standards/frontend
mkdir -p workflow/standards/testing
mkdir -p workflow/standards/agents
mkdir -p workflow/product
mkdir -p workflow/specs
```

### Schritt 2: Core-Dateien kopieren

Aus dem claude-workflow-engine Repository:

```bash
# Agenten
cp .claude/agents/*.md /pfad/zu/deinem/projekt/.claude/agents/

# Commands
cp .claude/commands/workflow/*.md /pfad/zu/deinem/projekt/.claude/commands/workflow/

# Skills
cp -r .claude/skills/workflow/* /pfad/zu/deinem/projekt/.claude/skills/workflow/

# Plugin-Manifest
cp .claude-plugin/plugin.json /pfad/zu/deinem/projekt/.claude-plugin/

# Hooks
cp hooks/hooks.json /pfad/zu/deinem/projekt/hooks/
cp hooks/scripts/*.sh /pfad/zu/deinem/projekt/hooks/scripts/
chmod +x /pfad/zu/deinem/projekt/hooks/scripts/*.sh

# Standards
cp -r workflow/standards/* /pfad/zu/deinem/projekt/workflow/standards/

# Konfiguration
cp workflow/config.yml /pfad/zu/deinem/projekt/workflow/
cp workflow/orchestration.yml /pfad/zu/deinem/projekt/workflow/
```

### Schritt 3: CLAUDE.md erstellen oder mergen

Falls dein Projekt keine `CLAUDE.md` hat:

```bash
cp .claude/CLAUDE.md /pfad/zu/deinem/projekt/.claude/
```

Falls bereits eine existiert, fuege die Sektionen für Agent Hierarchy, Workflow und Context Model zu deiner bestehenden Datei hinzu. Die Vorlage findest du in `.claude/CLAUDE.md`.

### Schritt 4: Settings mergen

Falls `.claude/settings.local.json` bereits existiert, merge die benoetigten Berechtigungen. Die Engine benoetigt diese Permission Patterns:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Bash(*)",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "Task"
    ]
  }
}
```

Falls die Datei nicht existiert, erstelle sie mit dem obigen Inhalt.

### Schritt 5: .gitignore aktualisieren

Fuege diese Patterns zu deiner `.gitignore` hinzu:

```
# Claude Workflow Engine - sensible Dateien
CLAUDE.local.md
*.local.md
.env*
credentials.*
secrets.*
.workflow-health-report.json
.workflow-state.json
```

## Was in dein Projekt kommt

| Pfad | Zweck | Groesse |
|------|-------|---------|
| `.claude/agents/` | 7 Agent-Definitionsdateien | ~15 KB |
| `.claude/commands/workflow/` | 23 Slash-Command-Dateien | ~50 KB |
| `.claude/skills/workflow/` | 13 Skill-Verzeichnisse (7 Standards + 6 Plugin) | ~20 KB |
| `.claude/CLAUDE.md` | Projektkontext für Claude | ~4 KB |
| `.claude-plugin/plugin.json` | Plugin-Manifest | ~0.5 KB |
| `hooks/` | Hook-Definitionen und Scripts | ~5 KB |
| `workflow/config.yml` | Hauptkonfiguration | ~3 KB |
| `workflow/orchestration.yml` | Delegations-Konfiguration | ~15 KB |
| `workflow/standards/` | 11 Standard-Dateien + Index | ~12 KB |
| `workflow/product/` | Leer (erstellt durch /plan-product) | 0 |
| `workflow/specs/` | Leer (erstellt pro Feature) | 0 |

**Total: ca. 100 KB** an Konfigurations- und Dokumentationsdateien.

## Konflikte loesen

### Bestehende .claude/agents/

Falls du bereits Agenten hast:

- Die Engine fügt ihre 7 Agenten neben deinen bestehenden hinzu
- Namenskollisionen werden erkannt (z.B. wenn du bereits eine `debug.md` hast)
- **Loesung:** Benenne deinen Agenten um oder überspringe die Engine-Version

### Bestehende .claude/commands/

Falls du bereits Slash Commands hast:

- Die Engine verwendet ein `workflow/` Prefix (z.B. `/workflow/plan-product`)
- Kollisionen treten nur auf, wenn du ebenfalls das `workflow/` Prefix verwendest
- **Loesung:** Benenne deine Commands um oder überspringe konfliktierende Engine-Commands

### Bestehende CLAUDE.md

Die `CLAUDE.md` der Engine enthaelt Agent Hierarchy, Workflow-Beschreibung und Context Model Referenz. Optionen:

- **Ersetzen:** Verwende die Engine-Version (deine wird gesichert)
- **Mergen:** Fuege die Engine-Sektionen zu deiner bestehenden Datei hinzu
- **Ueberspringen:** Behalte deine Version, aber Agenten sind für Claude moeglicherweise nicht korrekt dokumentiert

### Bestehende settings.local.json

Die CLI merged Permissions additiv -- deine bestehenden Berechtigungen bleiben erhalten, und die benoetigten Engine-Permissions werden hinzugefügt. Keine Berechtigungen werden entfernt.

### Bestehendes workflow/ Verzeichnis

Falls du ein `workflow/` Verzeichnis für andere Zwecke hast:

- Die CLI warnt über diesen Konflikt
- **Loesung:** Benenne dein Verzeichnis um oder konfiguriere einen anderen Pfad in `config.yml`

## Anpassung nach Installation

### Standards-Pfad aendern

Editiere `workflow/config.yml`:

```yaml
context_model:
  standards:
    path: mein-eigener-standards-pfad/
```

### Agenten entfernen

Loesche Agent-Dateien aus `.claude/agents/`. Die verbleibenden Agenten funktionieren weiterhin. Der Orchestrator überspringt geloeschte Agenten bei der Delegation.

### CLI-Features deaktivieren

Die CLI ist optional. Falls du sie nicht benoetigst, baue oder starte sie einfach nicht. Die Workflow Commands und Agenten funktionieren unabhaengig davon.

### Tech Stack Standard anpassen

Editiere `workflow/standards/global/tech-stack.md` und passe sie an deine tatsaechlichen Technologie-Entscheidungen an. Dieser Standard wird in jede delegierte Task injiziert.

## Deinstallation

### CLI Rollback

Falls du via CLI installiert hast:

```bash
node cli/dist/index.js rollback /pfad/zu/deinem/projekt
```

Dies stellt die Dateien aus dem Backup wieder her, das waehrend der Installation erstellt wurde.

### Manuelle Entfernung

```bash
# Engine-Agenten entfernen
rm -f .claude/agents/architect.md .claude/agents/ask.md .claude/agents/debug.md \
      .claude/agents/devops.md .claude/agents/orchestrator.md \
      .claude/agents/researcher.md .claude/agents/security.md

# Engine-Commands und Skills entfernen
rm -rf .claude/commands/workflow/
rm -rf .claude/skills/workflow/

# Workflow-Verzeichnis entfernen
rm -rf workflow/

# Falls CLAUDE.md gemerged wurde: Engine-Sektionen manuell entfernen
# Falls settings.local.json gemerged wurde: Engine-Permissions manuell entfernen
```

## Troubleshooting

### "Agent nicht gefunden" nach Installation

- Pruefe, ob `.claude/agents/` die `.md`-Dateien enthaelt
- Pruefe, ob `CLAUDE.md` die Agenten referenziert
- Starte Claude Code neu (`claude` Befehl)

### "Command nicht verfügbar"

- Pruefe, ob `.claude/commands/workflow/` die Command-Dateien enthaelt
- Verifiziere die Dateiberechtigungen (müssen lesbar sein)
- Pruefe `.claude/settings.local.json` auf korrekte Permissions

### "Standards laden nicht"

- Verifiziere, dass `workflow/standards/index.yml` existiert und valides YAML ist
- Führe `/workflow/index-standards` aus, um den Index neu aufzubauen
- Pruefe, ob die Skills in `.claude/skills/workflow/` vorhanden sind

### "DSGVO-Warnungen" nach Installation

```bash
node cli/dist/index.js check --gdpr --fix /pfad/zu/deinem/projekt
```

Dies fügt fehlende Gitignore-Patterns automatisch hinzu und stellt sicher, dass sensible Dateien nicht ins Repository gelangen.

## Siehe auch

- [Erste Schritte](erste-schritte.md) -- Neuinstallation von Grund auf
- [CLI-Referenz](cli.md) -- Alle CLI-Befehle im Detail
- [Konfiguration](konfiguration.md) -- Konfigurationsdateien nach der Installation anpassen
- [Plattform-Architektur](plattform-architektur.md) -- 6-Schichten-Architektur und Hooks
