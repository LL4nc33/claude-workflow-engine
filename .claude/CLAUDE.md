# Claude Workflow Engine - Multi-Agent System

## System Overview

This project implements a specialized multi-agent system for AI-assisted software development.
9 specialized agents collaborate through well-defined interfaces, standards injection,
and spec-driven workflows.

## Agent Hierarchy

```
                         +-------------+
                         |  Main Chat  |  (Orchestration)
                         +------+------+
                                |
    +-------+-------+-------+---+---+-------+-------+-------+
    |       |       |       |       |       |       |       |
+---+---+ +-+--+ +--+--+ +--+---+ +-+--+ +--+---+ +--+--+ +-+---+
|architect|builder|devops|explainer|guide|innovator|quality|researcher|
+---------+------+------+---------+-----+---------+-------+----------+
                                                              |
                                                         +----+----+
                                                         | security |
                                                         +----------+
```

## Agents Directory

All agent definitions live in `.claude/agents/`:

| Agent | Purpose | Access | Use When... |
|-------|---------|--------|-------------|
| [architect](.claude/agents/architect.md) | System Design, ADRs, API Review | READ-ONLY | Designing systems, reviewing APIs, making tech decisions |
| [builder](.claude/agents/builder.md) | Bug Investigation, Implementation | FULL | Writing code, fixing bugs, implementing features, writing tests |
| [devops](.claude/agents/devops.md) | CI/CD, Docker, Kubernetes, IaC | FULL | Setting up pipelines, containers, infrastructure |
| [explainer](.claude/agents/explainer.md) | Explanations, Code Walkthroughs | READ-ONLY | Understanding code, learning concepts, getting explanations |
| [guide](.claude/agents/guide.md) | NaNo Evolution, Pattern-to-Standards | READ-ONLY | Process improvement, pattern analysis, workflow optimization |
| [innovator](.claude/agents/innovator.md) | Brainstorming, Creative Solutions | READ-ONLY | Generating ideas, exploring alternatives, "what if" scenarios |
| [quality](.claude/agents/quality.md) | Testing, Coverage, Quality Gates | READ-ONLY | Test validation, coverage analysis, quality metrics |
| [researcher](.claude/agents/researcher.md) | Analysis, Documentation, Reports | READ-ONLY | Analyzing codebases, generating docs, comparing approaches |
| [security](.claude/agents/security.md) | OWASP Audits, Vulnerability Assessment | RESTRICTED | Security audits, CVE scanning, auth reviews |

### Agent Selection Quick-Guide

```
"I need to BUILD something"        → /builder oder builder
"I need to UNDERSTAND something"   → /explainer oder explainer
"I need to DESIGN something"       → /architect oder architect
"I need to DEPLOY something"       → /devops oder devops
"I need to RELEASE something"      → /devops oder devops
"I need to SECURE something"       → /security oder security
"I need to DOCUMENT something"     → /researcher oder researcher
"I need to TEST/VALIDATE quality"  → /quality oder quality
"I need IDEAS/BRAINSTORMING"       → /innovator oder innovator
"I need PROCESS IMPROVEMENT"       → /guide oder guide
"I need MULTIPLE things done"      → Main Chat (coordinates agents)
```

### Direct Agent Commands

Alle Agents sind direkt via Slash-Command aufrufbar:

| Command | Agent | Beispiel |
|---------|-------|----------|
| `/builder <task>` | builder | `/builder fix den Login-Bug` |
| `/architect <task>` | architect | `/architect entwerfe das Datenmodell` |
| `/devops <task>` | devops | `/devops setup Docker` |
| `/security <task>` | security | `/security audit die API` |
| `/researcher <task>` | researcher | `/researcher dokumentiere die API` |
| `/explainer <frage>` | explainer | `/explainer wie funktioniert X` |
| `/quality <task>` | quality | `/quality pruefe Coverage` |
| `/innovator <thema>` | innovator | `/innovator brainstorme Alternativen` |
| `/guide <thema>` | guide | `/guide analysiere Patterns` |

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
| `/workflow:devlog` | Auto-document current session (debugging, fixes) | - |

### Utility Workflows

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/workflow:web-setup` | Configure Web-Access-Layer (Firecrawl + SearXNG + Captcha-Solver) | Self-hosted instances |
| `/workflow:clone-setup` | ~~DEPRECATED~~ → Nutze `/workflow:web-setup` | - |
| `/workflow:visual-clone` | Extract visual identity (colors, fonts, CSS) from websites + optional Design Token Standards generation | `/workflow:web-setup` |
| `/workflow:nano-status` | NaNo Learning Status - Actionable Insights und Quick-Actions | `.claude/nano.local.md` |
| `/workflow:nano-toggle` | NaNo ein/ausschalten + First-Run Setup | - |
| `/workflow:nano-session` | Aktuelle Session-Observations anzeigen | NaNo aktiv |
| `/workflow:nano-config` | Interaktive NaNo-Konfiguration | `.claude/nano.local.md` |
| `/workflow:nano-reset` | NaNo-Daten zuruecksetzen (mit Confirmation) | NaNo data |
| `/workflow:review-candidates` | Interaktives Review von NaNo Evolution-Candidates | NaNo patterns |
| `/workflow:learning-report` | Umfassender NaNo-Analyse-Report | NaNo observations |
| `/workflow:nano-idea` | Idee sammeln fuer zukuenftige Vorschlaege | NaNo aktiv |
| `/workflow:release` | Version bump, Changelog, Git-Tag (SemVer) | `VERSION` file |

Configuration is stored in `web-services.local.md` / `nano.local.md` (gitignored, GDPR-compliant). API responses are converted to [TOON format](https://github.com/toon-format/toon) for ~40% token savings.

## Agent-First Principle (Context Isolation)

> **Details:** [Agent Conventions Standard](workflow/standards/agents/agent-conventions.md)

**CRITICAL:** All code work MUST be delegated to agents. Main chat orchestrates only.

**Why:** Agents have isolated context windows. When an agent finishes, only a result summary (~200 tokens) returns to main chat - not the full work context (~4000 tokens). This keeps main chat lean.

### Quick Reference

| Main Chat (Orchestrator) | Agents (Isolated Context) |
|--------------------------|---------------------------|
| User communication | Code implementation |
| Phase detection | Bug fixing |
| Agent selection | Code analysis |
| Progress summaries | Documentation generation |
| Quality gate decisions | Security audits |

### Self-Check vor Writes

1. `workflow/*.md` oder `.claude/**/*.md`? -> OK
2. `CHANGELOG.md` oder `VERSION`? -> OK
3. Alles andere -> Delegiere an builder/devops

### Intent-to-Agent Quick Reference

| Intent | Agent |
|--------|-------|
| Code work | builder |
| ANY question | explainer |
| Research/Docs | researcher |
| Security | security |
| DevOps/Deploy | devops |
| Architecture | architect |
| Quality/Tests | quality |
| Ideas | innovator |
| Process | guide |
| Multi-step | Main Chat (coordinates) |

**Main chat responds directly ONLY for:** Yes/No, workflow file edits, clarifying questions, progress summaries.

### Todo-List Pflicht

Bei Tasks mit >2 Schritten: TodoWrite fuer jeden Schritt (in_progress -> completed).

## Context Model (3 Layers)

- **Layer 1 - Standards (HOW):** `workflow/standards/` - Conventions and patterns
- **Layer 2 - Product (WHAT/WHY):** `workflow/product/` - Mission, roadmap, architecture
- **Layer 3 - Specs (WHAT NEXT):** `workflow/specs/` - Feature specifications

## Standards Domains

| Domain | Path | Standards | Status |
|--------|------|-----------|--------|
| global | `workflow/standards/global/` | tech-stack, naming, toon-format | Active |
| devops | `workflow/standards/devops/` | ci-cd, containerization, infrastructure | Active |
| agents | `workflow/standards/agents/` | agent-conventions, plugin-extension, completion-workflow | Active |
| api | `workflow/standards/api/` | response-format, error-handling | Active |
| cli | `workflow/standards/cli/` | command-structure, exit-codes, logger-usage, type-definitions, validation-pattern | Active |
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
|  9 specialized subagents with defined roles and MCP tools        |
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
| **Serena** | find_symbol, get_symbols_overview, find_referencing_symbols, replace_symbol_body, search_for_pattern | architect, researcher, builder, explainer, guide, quality |
| **Greptile** | list_merge_requests, get_merge_request, search_greptile_comments, list_merge_request_comments | quality, security |

MCP tools are optional - agents fall back to standard tools if servers are unavailable.

## Web-Access-Layer

Universeller Web-Zugang für alle Agents über selbst-gehostete Services:

| Service | Zweck | Agents |
|---------|-------|--------|
| **SearXNG** | GDPR-konforme Suche (kein Tracking) | researcher, builder, architect, devops, security, explainer, innovator |
| **Firecrawl** | JS-fähiger Scraper (SPA-Rendering, Screenshots) | researcher, builder, architect, devops, security, innovator |
| **SolveCaptcha** | Captcha-Lösung bei geschützten Seiten | researcher, builder |

Setup via `/workflow:web-setup`, Config in `web-services.local.md`. Skill-Dokumentation: `.claude/skills/workflow/web-access/SKILL.md`.

ENV-Fallbacks für CI/CD: `$FIRECRAWL_URL`, `$SEARXNG_URL`, `$SOLVECAPTCHA_API_KEY`.

## Hook Behavior

Seven hooks automate workflow tasks (with adaptive timeouts per ADR-003):

| Hook | Event | Timeout | Behavior |
|------|-------|---------|----------|
| SessionStart | Session begins | 30s | Checks standards freshness, provides workflow context, NaNo status (cached), triggers background-analyse, cleans cache |
| PreToolUse (Write/Edit) | Before file writes | 15s | Blocks secrets (.env, credentials.*, *.local.md); warnt bei Code außerhalb workflow/.claude/ (→ builder) |
| PreToolUse (Task) | Before agent delegation | 10s | Auto-Context-Injection: Standards + relevanter Code + Architecture (keyword-basiert) |
| PostToolUse (Write/Edit) | After file writes | 5s | Logs changes during active orchestration (filenames only, GDPR) |
| PostToolUse (Task) | After agent delegation | 3s | NaNo: Atomic write delegation observation (flock-based, O(1) counter) |
| Stop (Auto-Devlog) | Session ends | 5s | Suggests `/workflow:devlog` when >3 files changed, orchestration completed, or bug-fix detected |
| Stop (NaNo Analyze) | Session ends | 10s | NaNo: Incremental pattern analysis (nur neue Sessions), evolution candidates |

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
| "Implementiere/baue/erstelle/fixe/behebe X" | builder | "Implementiere User-Auth" |
| "Erklaere/zeige/wie funktioniert X" | explainer | "Erklaere den Login-Flow" |
| "Ueberpruefe/review/audit X auf Sicherheit" | security | "Audit die API-Endpoints" |
| "Deploye/setup/konfiguriere Infrastruktur X" | devops | "Setup Docker fuer das Projekt" |
| "Release/version bump/tag erstellen" | devops | "Mach ein Patch-Release" |
| "Analysiere/dokumentiere/recherchiere X" | researcher | "Dokumentiere die API-Struktur" |
| "Entwerfe/architektur/design X" | architect | "Entwerfe das Datenmodell" |
| "Pruefe Coverage/Quality/Tests X" | quality | "Wie ist die Test-Coverage?" |
| "Brainstorme/Ideen fuer X" | innovator | "Was waeren Alternativen fuer X?" |
| "Verbessere Workflow/Pattern X" | guide | "Analysiere die Delegation-Patterns" |
| Multi-step task mit >3 Subtasks | Main Chat | "Baue komplettes Feature X" (koordiniert Agents) |

### Context-Preservation-Strategy

1. Main chat keeps original context (user history, decisions)
2. Delegated agent receives: minimal context + current request + relevant standards
3. Agent response is integrated back into main chat
4. Standards injection follows `selective_matching` rules from orchestration.yml

### Delegation Decision Rules

- **Single-domain task** → Direct agent delegation
- **Cross-domain task** → Main Chat decomposes and coordinates multiple agents
- **Ambiguous intent** → Ask user for clarification (max 2 questions)
- **Explicit command** → Always honor explicit `/workflow:*` commands over auto-delegation

### First-Run Exception

Wenn `workflow/` Verzeichnis NICHT existiert und User "build/create/implementiere X" sagt:

**NICHT** direkt an builder delegieren. Stattdessen fragen:

"Das sieht nach einem neuen Projekt aus. Wie moechtest du starten?

1. **Quick Mode** (`/workflow:quick`) - Schnell: Plan->Spec->Build in ~10min (Recommended)
2. **Smart Workflow** (`/workflow:smart-workflow`) - Vollstaendig: 5 Phasen mit Quality Gates
3. **Direkt coden** - Ohne Workflow-Setup (nicht empfohlen fuer groessere Features)

*Mit Workflow bekommst du automatische Standards-Injection, Quality Gates und Dokumentation.*"

### Fallback to Explicit Mode

Users can override auto-delegation:
- Use explicit `/workflow:*` commands for full control
- Say "manuell" or "ohne Delegation" to disable auto-delegation for current request
- All existing commands continue to work as before

### Interaktivitaets-Regeln (AskUserQuestion)

**Main Chat MUSS den User fragen wenn:**
- Intent ist unklar oder mehrdeutig (max 2 Fragen zur Klaerung)
- Multi-step Task benoetigt Scope-Klaerung
- Quality Gate failed und User-Entscheidung noetig
- Mehrere valide Loesungswege existieren
- **Komplexe Features** die mehrere Implementierungs-Optionen haben:
  - Auth: "OAuth, JWT, oder Session-basiert?"
  - Database: "SQL oder NoSQL? Welches ORM?"
  - API: "REST oder GraphQL?"
  - UI: "Eigene Komponenten oder Library (shadcn, MUI)?"

**Main Chat fragt NICHT wenn:**
- Intent ist klar und single-domain → direkt delegieren
- User hat expliziten Command gegeben (/workflow:*, /builder, etc.)
- Einfache Ja/Nein Bestaetigung reicht
- Agent kann selbst Klaerungsfragen stellen

**Format:** Nutze immer das AskUserQuestion Tool mit:
- Klaren, spezifischen Fragen
- 2-4 Optionen pro Frage
- Empfohlene Option als erste mit "(Recommended)"

## Token-Optimierung: TOON-Format

> **Details:** [TOON Format Standard](workflow/standards/global/toon-format.md)

[TOON](https://github.com/toon-format/toon) ist ein token-optimiertes Notation-Format (~40% kompakter als JSON).

**Wann konvertieren:** JSON > 200 Tokens (API-Responses, Tool-Output, Delegation-Prompts)

**Wann NICHT:** Code-JSON (package.json), kleine Fragmente, programmatisch verarbeitetes JSON

```bash
# Quick usage
curl -s "$API_URL" | jq '{fields}' | npx @toon-format/cli
```

## GDPR/EU Compliance

- All data is LOCAL ONLY (no cloud sync)
- EU data residency (eu-central-1)
- No PII in standards or specs
- Sensitive config in `.local.md` files (gitignored)
