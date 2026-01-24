---
name: plugin-config
description: Plugin-Konfiguration und 6-Schichten-Architektur. Verwende bei plugin configuration, 6-layer, plugin.json, engine setup, installation, Schichten
---

# Plugin-Konfiguration - 6-Schichten-Architektur

## Architektur-Überblick

Die Claude Workflow Engine nutzt alle 6 Erweiterungsschichten von Claude Code:

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging (.claude-plugin/plugin.json)          |
|  Buendelt alle Schichten in ein installierbares Paket            |
+------------------------------------------------------------------+
|  Layer 5: Hooks (hooks/hooks.json)                               |
|  Event-basierte Automatisierung (SessionStart, Pre/PostToolUse)  |
+------------------------------------------------------------------+
|  Layer 4: Agents (.claude/agents/*.md)                           |
|  7 spezialisierte Subagenten mit definierten Rollen              |
+------------------------------------------------------------------+
|  Layer 3: Skills (.claude/skills/workflow/)                       |
|  Kontextbasiertes Wissen (Standards, MCP-Usage, Hooks, Config)   |
+------------------------------------------------------------------+
|  Layer 2: Commands (.claude/commands/workflow/)                   |
|  8 Slash-Commands für den 5-Phasen-Workflow                     |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md (.claude/CLAUDE.md)                          |
|  Projekt-Anweisungen und Systemüberblick                        |
+------------------------------------------------------------------+
```

## Konfigurationsdateien

### Plugin Manifest

**Pfad:** `.claude-plugin/plugin.json`

```json
{
  "name": "claude-workflow-engine",
  "version": "0.2.5",
  "description": "Multi-Agent Workflow System",
  "author": "LL4nc33",
  "license": "MIT",
  "commands": "./.claude/commands",
  "agents": "./.claude/agents",
  "skills": "./.claude/skills",
  "hooks": "./hooks/hooks.json"
}
```

### Workflow-Konfiguration

**Pfad:** `workflow/config.yml`

Zentrale Konfiguration mit:
- Version und Profil-Einstellungen
- 3-Schichten Kontextmodell (Standards, Product, Specs)
- Agent-System Integration
- GDPR/EU Compliance-Einstellungen
- Orchestrierungs-Konfiguration
- Plugin- und MCP-Einstellungen

### Hook-Konfiguration

**Pfad:** `hooks/hooks.json`

Definiert event-basierte Automatisierung:
- SessionStart: Workflow-Kontext laden
- PreToolUse: Secrets-Schutz
- PostToolUse: Aenderungs-Logging

### Standards-Index

**Pfad:** `workflow/standards/index.yml`

Registry aller Standards mit Tags für automatisches Matching.

## Installation in ein neues Projekt

### 1. Repository klonen

```bash
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine
```

### 2. Claude Code starten

```bash
claude
```

Das Plugin wird automatisch erkannt über `.claude-plugin/plugin.json`.

### 3. Empfohlene MCP-Server einrichten

#### Serena (Semantic Code Analysis)

```bash
# .serena/ Konfiguration im Projekt erstellen
# Siehe: https://github.com/serena-ai/serena
```

Serena bietet semantische Code-Navigation:
- Symbol-Suche und -Navigation
- Referenz-Tracking
- Praezise Code-Manipulation

#### Greptile (PR & Code Review)

```bash
# Greptile MCP-Server konfigurieren
# Siehe: https://greptile.com
```

Greptile bietet PR-Integration:
- Pull Request Uebersicht
- Code Review Kommentare
- Pattern-Suche in Reviews

### 4. Ersten Workflow starten

```bash
/workflow/plan-product
```

## Schicht-Abhaengigkeiten

```
Layer 6 (Plugin) ──referenziert──> Layer 5 (Hooks)
                  ──referenziert──> Layer 4 (Agents)
                  ──referenziert──> Layer 3 (Skills)
                  ──referenziert──> Layer 2 (Commands)

Layer 4 (Agents) ──nutzt──> Layer 3 (Skills via MCP-Tools)
                 ──liest──> Layer 1 (CLAUDE.md)

Layer 3 (Skills) ──dokumentiert──> Layer 5 (Hooks)
                 ──dokumentiert──> Layer 4 (Agents)

Layer 1 (CLAUDE.md) ──beschreibt──> Alle Schichten
```

## Erweiterung

### Neuen Agent hinzufuegen

1. Erstelle `.claude/agents/my-agent.md` mit Frontmatter (name, description, tools)
2. Aktualisiere `workflow/config.yml` (agents.available)
3. Aktualisiere `.claude/CLAUDE.md` (Agents-Tabelle)

### Neuen Skill hinzufuegen

1. Erstelle `.claude/skills/workflow/my-skill/SKILL.md` mit Frontmatter
2. Skill wird automatisch per Description-Matching geladen

### Neuen Hook hinzufuegen

1. Erstelle `hooks/scripts/my-hook.sh` (executable)
2. Registriere in `hooks/hooks.json`
3. Dokumentiere in `.claude/skills/workflow/hook-patterns/SKILL.md`

### Neuen Command hinzufuegen

1. Erstelle `.claude/commands/workflow/my-command.md`
2. Command ist als `/workflow/my-command` verfügbar
