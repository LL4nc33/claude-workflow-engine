# Plattform-Architektur

Die Claude Workflow Engine nutzt alle 6 Erweiterungsschichten von Claude Code als vollständiges Plugin.

---

## 6-Schichten-Modell

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging                                       |
|  .claude-plugin/plugin.json                                      |
|  Bündelt alle Schichten in ein installierbares Paket            |
+==================================================================+
|  Layer 5: Hooks                                                  |
|  hooks/hooks.json + hooks/scripts/*.sh                           |
|  Event-basierte Automatisierung                                  |
+------------------------------------------------------------------+
|  Layer 4: Agents                                                 |
|  .claude/agents/*.md (7 Agenten)                                 |
|  Spezialisierte Subagenten mit MCP-Tool-Integration              |
+------------------------------------------------------------------+
|  Layer 3: Skills                                                 |
|  .claude/skills/workflow/*/SKILL.md                              |
|  Kontextbasiertes Wissen (Standards + MCP + Hooks + Config)      |
+------------------------------------------------------------------+
|  Layer 2: Commands                                               |
|  .claude/commands/workflow/*.md                                   |
|  8 Slash-Commands für den 5-Phasen-Workflow                     |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md                                              |
|  .claude/CLAUDE.md                                               |
|  Projekt-Anweisungen und Systemüberblick                        |
+------------------------------------------------------------------+
```

---

## Layer 1: CLAUDE.md

**Pfad:** `.claude/CLAUDE.md`

Die Basis-Schicht. Wird bei jeder Session geladen und gibt Claude Code den Projektkontext:
- Agent-Hierarchie und -Verzeichnis
- Workflow-Übersicht (5 Phasen)
- 3-Schichten Kontextmodell (Standards/Product/Specs)
- Standards-Domänen
- Konfigurationsdateien
- MCP-Tool-Übersicht
- Hook-Verhalten
- GDPR/EU Compliance

---

## Layer 2: Commands

**Pfad:** `.claude/commands/workflow/`

8 Slash-Commands für den strukturierten Workflow:

| Command | Phase | Funktion |
|---------|-------|----------|
| `/workflow/plan-product` | 1 | Produktvision definieren |
| `/workflow/shape-spec` | 2 | Anforderungen strukturieren |
| `/workflow/write-spec` | 3 | Technische Spezifikation erstellen |
| `/workflow/create-tasks` | 4 | Tasks generieren |
| `/workflow/orchestrate-tasks` | 5 | An Agenten delegieren |
| `/workflow/discover-standards` | - | Standards aus Code entdecken |
| `/workflow/index-standards` | - | Standards-Index aktualisieren |
| `/workflow/inject-standards` | - | Standards manuell laden |

---

## Layer 3: Skills

**Pfad:** `.claude/skills/workflow/*/SKILL.md`

Skills werden automatisch per Description-Matching geladen. Verfuegbare Skills:

### Standards-Skills (bestehend)
Jeder Standard in `workflow/standards/` wird automatisch als Skill bereitgestellt.

### Neue Plugin-Skills

| Skill | Trigger-Keywords | Inhalt |
|-------|-----------------|--------|
| `mcp-usage` | semantic code analysis, symbol navigation, PR review, MCP | Tool-Katalog und Agent-Matrix |
| `hook-patterns` | hook, automation, PreToolUse, SessionStart | Hook-Referenz und Debugging |
| `plugin-config` | plugin configuration, 6-layer, engine setup | Architektur und Installation |

---

## Layer 4: Agents

**Pfad:** `.claude/agents/*.md`

7 spezialisierte Agenten mit definierten Rollen und Zugriffsrechten:

| Agent | Zugriff | MCP-Tools |
|-------|---------|-----------|
| architect | READ-ONLY | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| ask | READ-ONLY | Serena: get_symbols_overview, find_symbol |
| debug | FULL | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| devops | FULL | - (keine MCP-Abhaengigkeit) |
| orchestrator | TASK-DELEGATION | Greptile: list_merge_requests, get_merge_request |
| researcher | READ-ONLY | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| security | RESTRICTED | Greptile: search_greptile_comments, list_merge_request_comments |

---

## Layer 5: Hooks

**Pfad:** `hooks/hooks.json` + `hooks/scripts/*.sh`

Event-basierte Automatisierung mit Shell-Scripts:

### SessionStart Hook
- **Script:** `hooks/scripts/session-start.sh`
- **Funktion:** Prüft Standards-Aktualitaet, gibt Workflow-Kontext zurück
- **Output:** `additionalContext` mit Engine-Version, Mission-Status, aktiver Spec

### PreToolUse Hook (Write/Edit)
- **Script:** `hooks/scripts/pre-write-validate.sh`
- **Funktion:** Secrets-Schutz - blockiert Schreibzugriffe auf sensitive Dateien
- **Blockiert:** `.env`, `credentials.*`, `secrets.*`, `*.local.md`
- **Output:** `permissionDecision: allow/deny`

### PostToolUse Hook (Write/Edit)
- **Script:** `hooks/scripts/post-write-log.sh`
- **Funktion:** Loggt Dateiname + Zeitstempel bei aktiver Orchestrierung
- **GDPR:** Nur Dateinamen, keine Inhalte; ignoriert `.local.md`

### Shared Utilities
- **Script:** `hooks/scripts/common.sh`
- **Funktionen:** `get_project_root()`, `get_active_spec()`, `json_escape()`, `is_secrets_path()`

---

## Layer 6: Plugin Packaging

**Pfad:** `.claude-plugin/plugin.json`

Das Plugin-Manifest bündelt alle Schichten:

```json
{
  "name": "claude-workflow-engine",
  "version": "0.2.0",
  "commands": "./.claude/commands",
  "agents": "./.claude/agents",
  "skills": "./.claude/skills",
  "hooks": "./hooks/hooks.json"
}
```

---

## MCP-Server Setup

### Serena (Semantic Code Analysis)

Serena bietet Language-Server-basierte Code-Navigation:

1. Serena-Konfiguration im Projekt erstellen (`.serena/`)
2. MCP-Server in Claude Code konfigurieren
3. Agents nutzen automatisch die verfügbaren Tools

**Genutzt von:** architect, researcher, debug, ask

### Greptile (PR & Code Review)

Greptile bietet PR-Management und Review-Integration:

1. Greptile-Account erstellen
2. MCP-Server mit API-Key konfigurieren
3. Agents nutzen automatisch die verfügbaren Tools

**Genutzt von:** orchestrator, security

### Fallback-Verhalten

Wenn ein MCP-Server nicht verfügbar ist, fallen Agents auf Standard-Tools zurück:
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

---

## Schicht-Abhängigkeiten

```
Layer 6 ──referenziert──> Layer 5, 4, 3, 2
Layer 5 ──nutzt──> common.sh (Shared Utilities)
Layer 4 ──nutzt──> Layer 3 (Skills via MCP-Tools)
         ──liest──> Layer 1 (CLAUDE.md)
Layer 3 ──dokumentiert──> Layer 5, 4
Layer 1 ──beschreibt──> Alle Schichten
```

---

## Erweiterung

### Neuen Hook hinzufügen

1. Script erstellen in `hooks/scripts/my-hook.sh`
2. Executable machen: `chmod +x hooks/scripts/my-hook.sh`
3. In `hooks/hooks.json` registrieren
4. In `hook-patterns` Skill dokumentieren

### Neuen Skill hinzufügen

1. Verzeichnis erstellen: `.claude/skills/workflow/my-skill/`
2. `SKILL.md` mit YAML-Frontmatter (name, description) erstellen
3. Description enthaelt Trigger-Keywords

### Neuen Agent hinzufügen

1. `.claude/agents/my-agent.md` mit Frontmatter erstellen
2. `workflow/config.yml` aktualisieren (agents.available)
3. `.claude/CLAUDE.md` aktualisieren (Agents-Tabelle)

---

## Siehe auch

- [Erste Schritte](erste-schritte.md) - Einstieg und Installation
- [Agenten-Referenz](agenten.md) - Alle 7 Agenten im Detail
- [Workflow Guide](workflow.md) - 5-Phasen Workflow
- [Konfiguration](konfiguration.md) - config.yml und Einstellungen
