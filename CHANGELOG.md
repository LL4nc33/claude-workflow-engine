# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.0a] - 2026-01-26

### Added

- **Ask Agent**: New READ-ONLY agent for questions and discussions
- **Idea Capture System**: Auto-capture ideas via UserPromptSubmit hook
  - `idea-observer.sh` scans for idea keywords
  - `idea-flush.sh` notifies at session end
  - Ideas stored in TOON format (`~/.claude/cwe/idea-observations.toon`)
- **Interactive Menus**: All 10 agent commands support guided selection
  - Run command without args for drill-down menus
  - Each menu offers "Other" for custom input
- **Automatic Plugin Installation**: `/cwe:init` checks and installs missing plugins
  - Required: superpowers
  - Recommended: serena, feature-dev
  - Optional: frontend-design, code-simplifier, claude-md-management, plugin-dev
- **Full Plugin Integration**: All agents now leverage installed plugin skills
  - builder → superpowers TDD/debugging, frontend-design, code-simplifier, serena
  - architect → superpowers writing-plans/brainstorming, feature-dev code-architect
  - quality → superpowers code-review/verification, feature-dev code-reviewer
  - security → superpowers verification, serena pattern search
  - innovator → superpowers brainstorming
  - guide → claude-md-improver
  - ask/explainer/researcher → serena MCP tools

### Changed

- All agent commands now have `AskUserQuestion` in allowed-tools
- `/cwe:start` has interactive phase-specific menus
- CLAUDE.md rewritten with 5 Core Principles and plugin mapping tables
- Documentation fully updated (HOWTO.md, USECASES.md, README.md)

### Fixed

- Removed duplicate MCP Tools section in ask agent
- Version consistency across all 9 files

## [0.3.1] - 2026-01-26

### Added

- Parallel task orchestration with wave execution
- Agent auto-detection based on task metadata or keywords

### Changed

- Simplified to 12 commands (down from 23)
- Main chat handles orchestration (orchestrator agent removed)

## [0.3.0] - 2026-01-26

### Added

- Plugin structure created in `plugin-dist/`
- Plugin manifest (plugin.json)
- Superpowers integration documented

### Changed

- Migrated from CLI-only to plugin-first architecture

## [0.2.9] - 2026-01-25

### Added

- 9 spezialisierte Agents (vorher 7): guide, innovator, quality neu hinzugefuegt
- NaNo Quality Gate Tracking vollstaendig funktionsfaehig (`nano-observer.sh quality`)
- NaNo Standards Tracking bei Agent-Delegationen
- SessionStart Hook zeigt pending Evolution Candidates
- Direct Agent Commands: /builder, /architect, /devops, /explainer, /guide, /innovator, /quality, /researcher, /security
- Delegation-Enforcement in CLAUDE.md: Self-Check, FALSCH/RICHTIG Beispiele, Todo-List Pflicht
- PreToolUse Hook: Warnung bei Code-Dateien ausserhalb workflow/.claude/ Pfaden

### Changed

- Agent-Umbenennung: ask → explainer, debug → builder
- orchestrator-Agent entfernt (Main Chat uebernimmt Orchestrierung)
- README Credits erweitert: Agent OS, Homunculus, Roo Code
- Architecture-Section im README mit Side-by-Side Layout

### Fixed

- NaNo Config-Parsing funktioniert jetzt mit simplem `key: value` Format
- NaNo Status-Command gibt keine doppelte Ausgabe mehr aus
- Hook-Scripts: `grep` Exit-Codes werden korrekt behandelt mit `set -e`

## [0.2.8] - 2026-01-25

### Added

- Highlights-Sektion in README.md (USPs prominent dargestellt)
- Web-Access-Layer Dokumentation vervollstaendigt
- Convenience Commands (quick, help, undo) in Workflow-Docs dokumentiert
- NaNo Learning Commands in README.md und Workflow-Docs
- ERROR-RECOVERY.md Verlinkung in Plattform-Architektur

### Changed

- Command-Anzahl von 8 auf 23 in allen Haupt-Docs aktualisiert
- Skills-Anzahl von 10 auf 13 korrigiert
- GDPR zu DSGVO in deutschen Dokumenten geaendert
- clone-setup als DEPRECATED markiert, Verweis auf web-setup
- visual-clone.local.md Referenzen auf web-services.local.md aktualisiert

### Deprecated

- `/workflow:clone-setup` - ersetzt durch `/workflow:web-setup`

## [0.2.7] - 2026-01-24

### Added

- NaNo Learning System: Atomic observations, flock-based concurrency, O(1) counters
- Incremental pattern analysis (nur neue Sessions)
- Evolution candidates mit automatischer Erkennung
- NaNo utility commands: status, session, config, reset, toggle
- Learning-report und review-candidates Workflows
- Adaptive Hook-Timeouts (ADR-003)
- Background-Analyse in SessionStart Hook

### Changed

- Hook-System auf flock-basierte Locks umgestellt
- Session-Start Cache-Mechanismus optimiert
- Error-Recovery Dokumentation hinzugefuegt

## [0.2.5] - 2026-01-24

### Added

- Auto-Delegation: Intent-Recognition fuer automatische Agent-Zuweisung
- Smart-Workflow Command: Auto-detects aktuelle Phase
- TOON-Format Integration (~40% Token-Einsparung)
- Selective Standards-Matching in Orchestration

### Changed

- Orchestration.yml um Delegation-Rules erweitert
- CLAUDE.md mit Auto-Delegation und TOON-Dokumentation aktualisiert

## [0.2.0] - 2026-01-24

### Added

- 6-Layer Plugin-Architektur (CLAUDE.md, Commands, Skills, Agents, Hooks, Plugin)
- Hook-System: SessionStart, PreToolUse, PostToolUse, Stop
- MCP-Integration: Serena (Semantic Code Analysis) + Greptile (PR Management)
- Bilinguale Dokumentation (DE + EN)
- Visual-Clone Workflow: CSS/Design-Token Extraktion
- CLI Templates fuer automatisierte Installation
- Plugin-Extension und CLI Standards
- Vollstaendige Umlaut-Korrektur in 46 Dateien

### Changed

- Architektur von flat-file auf 6-Layer Plugin-Struktur migriert
- Standards-System um devops, agents, api, database, frontend, testing erweitert

## [0.1.0] - 2026-01-23

### Added

- Initial release: Claude Workflow Engine
- 9 spezialisierte Agents (architect, builder, devops, explainer, guide, innovator, quality, researcher, security)
- 5-Phase Workflow (Plan, Shape, Write, Create Tasks, Orchestrate)
- Standards-System mit 3-Layer Context Model
- CLI mit install, status, health, check, resolve, rollback Commands
- GDPR/DSGVO Compliance (lokal-only, EU Data Residency)
- Workflow Configuration (config.yml, orchestration.yml, standards/index.yml)
