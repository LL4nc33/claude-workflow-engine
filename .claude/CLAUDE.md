# Claude Workflow Engine - Multi-Agent System

## System Overview

This project implements a specialized multi-agent system for AI-assisted software development.
7 specialized agents collaborate through well-defined interfaces, standards injection,
and spec-driven workflows.

## Agent Hierarchy

```
                    +------------------+
                    |   orchestrator   |  (Task Delegation)
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |         |         |         |         |
    +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
    |architect| |  debug | |devops  | |security| |researcher|
    +---------+ +--------+ +--------+ +--------+ +----------+
         |
    +----+---+
    |  ask   |  (Explanations)
    +---------+
```

## Agents Directory

All agent definitions live in `.claude/agents/`:

| Agent | Purpose | Access | Use When... |
|-------|---------|--------|-------------|
| [architect](.claude/agents/architect.md) | System Design, ADRs, API Review | READ-ONLY | Designing systems, reviewing APIs, making tech decisions |
| [ask](.claude/agents/ask.md) | Explanations, Code Walkthroughs | READ-ONLY | Understanding code, learning concepts, getting explanations |
| [debug](.claude/agents/debug.md) | Bug Investigation, Implementation | FULL | Writing code, fixing bugs, implementing features, writing tests |
| [devops](.claude/agents/devops.md) | CI/CD, Docker, Kubernetes, IaC | FULL | Setting up pipelines, containers, infrastructure |
| [orchestrator](.claude/agents/orchestrator.md) | Task Delegation, Coordination | TASK-DELEGATION | Complex multi-step tasks requiring multiple agents |
| [researcher](.claude/agents/researcher.md) | Analysis, Documentation, Reports | READ-ONLY | Analyzing codebases, generating docs, comparing approaches |
| [security](.claude/agents/security.md) | OWASP Audits, Vulnerability Assessment | RESTRICTED | Security audits, CVE scanning, auth reviews |

### Agent Selection Quick-Guide

```
"I need to BUILD something"        → debug
"I need to UNDERSTAND something"   → ask
"I need to DESIGN something"       → architect
"I need to DEPLOY something"       → devops
"I need to RELEASE something"      → devops
"I need to SECURE something"       → security
"I need to DOCUMENT something"     → researcher
"I need MULTIPLE things done"      → orchestrator
```

## Workflow

### Quick Start: `/workflow:smart-workflow`

The consolidated command auto-detects your current phase and guides you through the complete workflow with minimal interaction.

### Explicit 5-Phase Workflow

For full control, use individual phase commands:

```
/workflow:plan-product --> /workflow:shape-spec --> /workflow:write-spec --> /workflow:create-tasks --> /workflow:orchestrate-tasks
```

1. **Plan Product** - Define mission, goals, constraints (`workflow/product/`)
2. **Shape Spec** - Gather requirements, references (`workflow/specs/{folder}/`)
3. **Write Spec** - Create technical specification
4. **Create Tasks** - Break spec into implementable tasks
5. **Orchestrate Tasks** - Delegate to specialized agents

### Convenience Commands

| Command | Purpose | Shortcut |
|---------|---------|----------|
| `/workflow:smart-workflow` | Auto-detect phase + guided 5-phase workflow | `sw` |
| `/workflow:quick` | Fast 3-step workflow for MVPs (Plan→Spec→Build) | `q` |
| `/workflow:help` | Contextual help based on current state | `h` |
| `/workflow:undo` | Revert recent workflow changes (git-based) | - |

### Utility Workflows

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/workflow:web-setup` | Configure Web-Access-Layer (Firecrawl + SearXNG + Captcha-Solver) | Self-hosted instances |
| `/workflow:clone-setup` | ~~DEPRECATED~~ → Nutze `/workflow:web-setup` | - |
| `/workflow:visual-clone` | Extract visual identity (colors, fonts, CSS) from websites + optional Design Token Standards generation | `/workflow:web-setup` |
| `/workflow:homunculus-status` | NaNo Learning Status - Actionable Insights und Quick-Actions | `nano.local.md` |
| `/workflow:nano-toggle` | NaNo ein/ausschalten + First-Run Setup | - |
| `/workflow:nano-session` | Aktuelle Session-Observations anzeigen | NaNo aktiv |
| `/workflow:nano-config` | Interaktive NaNo-Konfiguration | `nano.local.md` |
| `/workflow:nano-reset` | NaNo-Daten zuruecksetzen (mit Confirmation) | NaNo data |
| `/workflow:review-candidates` | Interaktives Review von NaNo Evolution-Candidates | NaNo patterns |
| `/workflow:learning-report` | Umfassender NaNo-Analyse-Report | NaNo observations |
| `/workflow:release` | Version bump, Changelog, Git-Tag (SemVer) | `VERSION` file |

Configuration is stored in `web-services.local.md` / `nano.local.md` (gitignored, GDPR-compliant). API responses are converted to [TOON format](https://github.com/toon-format/toon) for ~40% token savings.

## Agent-First Principle (Context Isolation)

**CRITICAL:** All code work MUST be delegated to agents. Main chat orchestrates only.

```
Main Chat (Orchestrator)          Agents (Isolated Context)
========================          ========================
- User communication              - Code implementation
- Phase detection                 - Bug fixing
- Agent selection                 - Code analysis
- Progress summaries              - Documentation generation
- Quality gate decisions          - Security audits
```

**Why:** Agents have isolated context windows. When an agent finishes, only a result summary (~200 tokens) returns to main chat - not the full work context (~4000 tokens). This keeps main chat lean.

**Always delegate:**

| Intent | Agent | Examples |
|--------|-------|----------|
| Code work | debug | implement, fix, refactor, write test |
| Explanations | ask | explain, how does, what is, teach me |
| Research | researcher | analyze, document, find pattern, compare |
| Security | security | audit, vulnerability, scan, gdpr check |
| DevOps | devops | deploy, docker, ci/cd, release, k8s |
| Architecture | architect | design, adr, api review, trade-off |
| Multi-step | orchestrator | build complete feature, end-to-end |
| Exploration | researcher/Explore | scan codebase, find in code, investigate |

**Exceptions** (main chat MAY edit): `workflow/*.md`, `.claude/**/*.md`, `CHANGELOG.md`, `VERSION`

**Read Operations:**
- Small configs (< 200 lines) → Main chat OK
- Large files / multiple files → Delegate to agent (ask/researcher/Explore)
- Code exploration → Always delegate (isolated context)

## Context Model (3 Layers)

- **Layer 1 - Standards (HOW):** `workflow/standards/` - Conventions and patterns
- **Layer 2 - Product (WHAT/WHY):** `workflow/product/` - Mission, roadmap, architecture
- **Layer 3 - Specs (WHAT NEXT):** `workflow/specs/` - Feature specifications

## Standards Domains

| Domain | Path | Standards | Status |
|--------|------|-----------|--------|
| global | `workflow/standards/global/` | tech-stack, naming | Active |
| devops | `workflow/standards/devops/` | ci-cd, containerization, infrastructure | Active |
| agents | `workflow/standards/agents/` | agent-conventions | Active |
| api | `workflow/standards/api/` | response-format, error-handling | Active |
| database | `workflow/standards/database/` | migrations | Active |
| frontend | `workflow/standards/frontend/` | components, design-tokens | Active |
| testing | `workflow/standards/testing/` | coverage | Active |

## Key Configuration Files

- `VERSION` - Single Source of Truth for project version (SemVer)
- `CHANGELOG.md` - Release history (Keep-a-Changelog format, auto-generated)
- `workflow/config.yml` - Main configuration
- `workflow/orchestration.yml` - Task delegation and workflow config
- `workflow/standards/index.yml` - Standards registry
- `web-services.local.md` - Web-Access-Layer Config (Firecrawl, SearXNG, Captcha)
- `.claude/settings.local.json` - Claude Code permissions

## Platform Architecture (6 Layers)

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging (.claude-plugin/plugin.json)          |
|  Bundles all layers into an installable package                  |
+------------------------------------------------------------------+
|  Layer 5: Hooks (hooks/hooks.json)                               |
|  Event-based automation (SessionStart, Pre/PostToolUse)          |
+------------------------------------------------------------------+
|  Layer 4: Agents (.claude/agents/*.md)                           |
|  7 specialized subagents with defined roles and MCP tools        |
+------------------------------------------------------------------+
|  Layer 3: Skills (.claude/skills/workflow/)                       |
|  Context-based knowledge (Standards, MCP-Usage, Hooks, Config)   |
+------------------------------------------------------------------+
|  Layer 2: Commands (.claude/commands/workflow/)                   |
|  23 slash commands (5-phase + convenience + utilities + NaNo)     |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md (.claude/CLAUDE.md)                          |
|  Project instructions and system overview                        |
+------------------------------------------------------------------+
```

## Available MCP Tools

When configured, the following MCP servers extend agent capabilities:

| Server | Tools | Used By |
|--------|-------|---------|
| **Serena** | find_symbol, get_symbols_overview, find_referencing_symbols, replace_symbol_body, search_for_pattern | architect, researcher, debug, ask |
| **Greptile** | list_merge_requests, get_merge_request, search_greptile_comments, list_merge_request_comments | orchestrator, security |

MCP tools are optional - agents fall back to standard tools if servers are unavailable.

## Web-Access-Layer

Universeller Web-Zugang für alle Agents über selbst-gehostete Services:

| Service | Zweck | Agents |
|---------|-------|--------|
| **SearXNG** | GDPR-konforme Suche (kein Tracking) | researcher, debug, architect, devops, security, ask |
| **Firecrawl** | JS-fähiger Scraper (SPA-Rendering, Screenshots) | researcher, debug, architect, devops, security |
| **SolveCaptcha** | Captcha-Lösung bei geschützten Seiten | researcher, debug |

Setup via `/workflow:web-setup`, Config in `web-services.local.md`. Skill-Dokumentation: `.claude/skills/workflow/web-access/SKILL.md`.

ENV-Fallbacks für CI/CD: `$FIRECRAWL_URL`, `$SEARXNG_URL`, `$SOLVECAPTCHA_API_KEY`.

## Hook Behavior

Five hooks automate workflow tasks (with adaptive timeouts per ADR-003):

| Hook | Event | Timeout | Behavior |
|------|-------|---------|----------|
| SessionStart | Session begins | 30s | Checks standards freshness, provides workflow context, NaNo status (cached), triggers background-analyse, cleans cache |
| PreToolUse (Write/Edit) | Before file writes | 15s | Blocks writes to .env, credentials.*, secrets.*, *.local.md |
| PostToolUse (Write/Edit) | After file writes | 5s | Logs changes during active orchestration (filenames only, GDPR) |
| PostToolUse (Task) | After agent delegation | 3s | NaNo: Atomic write delegation observation (flock-based, O(1) counter) |
| Stop | Session ends | 10s | NaNo: Incremental pattern analysis (nur neue Sessions), evolution candidates |

Error Recovery: See `workflow/ERROR-RECOVERY.md` for troubleshooting hook timeouts and other failures.

## Recommended MCP Servers

- **Serena** - Semantic code analysis via Language Server (symbol navigation, refactoring)
- **Greptile** - PR management and code review integration

Setup is documented in `docs/plattform-architektur.md`.

## Auto-Delegation (Intent-Recognition)

When a user request matches one of these patterns, automatically delegate to the appropriate specialized agent using the Task tool. This provides zero-command UX while preserving context isolation.

### Intent-to-Agent Mapping

| User Intent Pattern | Agent | Example |
|--------------------| ------|---------|
| "Implementiere/baue/erstelle/fixe/behebe X" | debug | "Implementiere User-Auth" |
| "Erklaere/zeige/wie funktioniert X" | ask | "Erklaere den Login-Flow" |
| "Ueberpruefe/review/audit X auf Sicherheit" | security | "Audit die API-Endpoints" |
| "Deploye/setup/konfiguriere Infrastruktur X" | devops | "Setup Docker fuer das Projekt" |
| "Release/version bump/tag erstellen" | devops | "Mach ein Patch-Release" |
| "Analysiere/dokumentiere/recherchiere X" | researcher | "Dokumentiere die API-Struktur" |
| "Entwerfe/architektur/design X" | architect | "Entwerfe das Datenmodell" |
| Multi-step task mit >3 Subtasks | orchestrator | "Baue komplettes Feature X" |

### Context-Preservation-Strategy

1. Main chat keeps original context (user history, decisions)
2. Delegated agent receives: minimal context + current request + relevant standards
3. Agent response is integrated back into main chat
4. Standards injection follows `selective_matching` rules from orchestration.yml

### Delegation Decision Rules

- **Single-domain task** → Direct agent delegation
- **Cross-domain task** → orchestrator for decomposition
- **Ambiguous intent** → Ask user for clarification (max 2 questions)
- **Explicit command** → Always honor explicit `/workflow:*` commands over auto-delegation

### Fallback to Explicit Mode

Users can override auto-delegation:
- Use explicit `/workflow:*` commands for full control
- Say "manuell" or "ohne Delegation" to disable auto-delegation for current request
- All existing commands continue to work as before

## Token-Optimierung: TOON-Format

[TOON](https://github.com/toon-format/toon) ist ein token-optimiertes Notation-Format (~40% kompakter als JSON).
Wende TOON-Konvertierung automatisch an, um Context-Budget zu schonen:

### Wann konvertieren

| Situation | Aktion |
|-----------|--------|
| JSON-Response > 200 Tokens (Tool-Output, API, File-Read) | Zusammenfassung/Weitergabe in TOON |
| JSON in Delegation-Prompts an Subagents | Vor Injection zu TOON konvertieren |
| Externe API-Responses in Workflows | Pipe durch `npx @toon-format/cli` |
| JSON < 200 Tokens oder Code-relevantes JSON | Behalten wie es ist |

### TOON-Konvertierungsregeln

```
JSON Array of Objects → TOON Table
[{"name":"A","val":1},{"name":"B","val":2}]
→ [2]{name,val}:
    A,1
    B,2

JSON Object → TOON Key-Value
{"title":"X","count":5,"active":true}
→ title: X
  count: 5
  active: true

Nested JSON → TOON Indented
{"user":{"name":"A","roles":["admin","dev"]}}
→ user:
    name: A
    roles[2]: admin, dev
```

### Wo NICHT konvertieren

- JSON das als Code geschrieben/editiert wird (package.json, tsconfig.json etc.)
- JSON in Code-Beispielen die der User sehen soll
- Kleine JSON-Fragmente (< 200 Tokens)
- JSON das programmatisch weiterverarbeitet wird

### Workflow-Integration

Jeder Workflow der externe APIs aufruft sollte JSON-Responses durch TOON pipen:
```bash
curl -s "$API_URL" | jq '{relevant_fields}' | npx @toon-format/cli
```

## GDPR/EU Compliance

- All data is LOCAL ONLY (no cloud sync)
- EU data residency (eu-central-1)
- No PII in standards or specs
- Sensitive config in `.local.md` files (gitignored)
