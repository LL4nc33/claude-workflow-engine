# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
- 7 spezialisierte Agents (architect, ask, debug, devops, orchestrator, researcher, security)
- 5-Phase Workflow (Plan, Shape, Write, Create Tasks, Orchestrate)
- Standards-System mit 3-Layer Context Model
- CLI mit install, status, health, check, resolve, rollback Commands
- GDPR/DSGVO Compliance (lokal-only, EU Data Residency)
- Workflow Configuration (config.yml, orchestration.yml, standards/index.yml)
