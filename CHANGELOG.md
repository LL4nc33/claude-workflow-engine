# Changelog

All notable changes to the Claude Workflow Engine (CWE) will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — v0.4.1 (Native Alignment Release)

### Changed — Native Alignment (Phase 1-3)
- CLAUDE.md radical slim-down (~230 → ~72 lines)
- Standards migration from Skills to `.claude/rules/` with `paths` frontmatter (YAML list format)
- Agent frontmatter modernization (`skills:`, `memory: project` fields)
- 10 redundant skills deleted (7 standards + cwe-principles + planning + mcp-usage)
- Rules paths format fixed: comma-separated string → YAML list (per Claude Code docs)

### Changed — Memory & Idea System (Phase 4)
- Idea system v2: project-scoped via `$CLAUDE_PROJECT_DIR`, JSONL format
- idea-observer.sh: writes to `~/.claude/cwe/ideas/<project-slug>.jsonl`
- idea-flush.sh: counts only current project's ideas
- session-start.sh: reads memory/sessions.md for resume context, shows idea count
- session-stop.sh: logs sessions to memory/sessions.md, keeps last 50
- Migration: old `.toon` → per-project JSONL on first run
- Memory templates: MEMORY.md, ideas.md, sessions.md, decisions.md, patterns.md, project-context.md
- commands/innovator.md: 4 modes (default/all/review/develop)
- plugin.json: version bumped to 0.4.1

### Planned — Project Lifecycle Management

### Planned — Project Lifecycle Management
- Standardized `docs/` structure (README, ARCHITECTURE, API, SETUP, decisions/)
- `VERSION` file as Single Source of Truth for all version references
- `CHANGELOG.md` auto-maintenance with Keep-a-Changelog format
- `DEVLOG.md` chronological developer journal
- Auto-README with GitHub HTML + custom SVG banner generation
- Auto-generated tech stack badges and architecture diagrams

### Planned — Safety & Git Standards
- Pre-commit safety gate (secrets, PII, .gitignore validation)
- Conventional Commits enforcement via PreToolUse hook
- Branch naming convention enforcement (feature/, fix/, hotfix/, etc.)
- Auto-generated release notes from conventional commits

### Planned — Project Health Intelligence
- Health dashboard (coverage, complexity, debt, dependency status)
- Dependency health monitoring (outdated, vulnerable, license issues)
- CODEOWNERS auto-generation from git history
- License compatibility checking

---

## [0.4.0a] — 2025-02-13

### Changed
- **Skill overlap resolved:** `auto-delegation` and `agent-detection` now have sharp scope boundaries
  - `auto-delegation` = interactive user-request routing (natural language)
  - `agent-detection` = build-phase task-to-agent assignment (structured tasks)
- **Keyword tables synchronized** across auto-delegation, agent-detection, and CLAUDE.md
  - "test" consistently routes to **quality** agent (was inconsistent: builder in auto-delegation, quality in agent-detection)
  - Unified canonical keyword list for all 10 agents
- **Greptile references removed** — security agent and mcp-usage skill no longer reference unavailable Greptile MCP
  - Security agent now uses Serena tools (`search_for_pattern`, `find_symbol`) instead
  - `mcp-usage` skill simplified to Serena-only
  - Agent-Tool Matrix updated (added ask + security Serena tools)
- **Version consistency fixed** — `session-start.sh` updated from v0.3.1 to v0.4.0a

### Added
- `CHANGELOG.md` — this file
- `ROADMAP.md` — v0.4.1 planning and design decisions
- `_backup/` — pre-change backup of modified files

---

## [0.4.0a] — Initial Plugin Release

### Added
- Full plugin structure (`.claude-plugin/plugin.json`)
- 10 specialized agents: ask, architect, builder, devops, explainer, guide, innovator, quality, researcher, security
- 13 commands: 3 core (init, start, help) + 10 agent commands
- 13 skills: auto-delegation, agent-detection, quality-gates, planning, cwe-principles, mcp-usage, and 7 domain standards
- Plugin integration: superpowers, serena, feature-dev, frontend-design, code-simplifier, claude-md-management, plugin-dev
- Idea capture system via UserPromptSubmit hook
- Session hooks (start, stop, idea-flush)
- Interactive menus via AskUserQuestion in all commands
- Wave execution algorithm for parallel task orchestration

---

## [0.3.1] — Pre-Plugin Version

### Changed
- Simplified to 12 commands, auto-delegation, superpowers integration

---

## [0.3.0] — Plugin Structure Created

### Added
- Initial plugin directory structure

---

## [0.2.9a] — Last CLI-Focused Version

### Changed
- Final version before plugin migration
