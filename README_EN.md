# Claude Workflow Engine

[![Version](https://img.shields.io/badge/version-0.2.5-blue.svg)](https://github.com/LL4nc33/claude-workflow-engine/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-purple.svg)](https://claude.com/claude-code)

A multi-agent workflow system for Claude Code: 7 specialized agents, a 5-phase development workflow, and a standards system that ensures consistency across projects.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Standards Commands](#standards-commands)
- [CLI Usage](#cli-usage)
- [Privacy](#privacy)
- [Use Cases](#use-cases)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Features

### 7 Specialized Agents

| Agent | Role | Access | When to Use |
|-------|------|--------|-------------|
| **Architect** | System Design, ADRs, API Review | READ-ONLY | "How should I architect X?" |
| **Ask** | Explanations, Tutorials, Code Walkthroughs | READ-ONLY | "How does Y work?" |
| **Debug** | Bug Investigation, Implementation | FULL | "Find and fix this bug" |
| **DevOps** | CI/CD, Docker, Kubernetes, IaC | FULL | "Set up CI/CD for me" |
| **Orchestrator** | Task Delegation, Coordination | TASK-DELEGATION | "Distribute these 10 tasks" |
| **Researcher** | Codebase Analysis, Documentation | READ-ONLY | "What does this code do?" |
| **Security** | OWASP Audits, Vulnerability Assessment | READ-ONLY | "Is this secure?" |

Each agent has clearly defined access rights and specializations. The Orchestrator delegates tasks to the most suitable agent.

### 5-Phase Development Workflow

```bash
/workflow/plan-product        # Phase 1: Define product vision and mission
/workflow/shape-spec          # Phase 2: Gather requirements in a structured manner
/workflow/write-spec          # Phase 3: Create a detailed technical specification
/workflow/create-tasks        # Phase 4: Generate implementable tasks automatically
/workflow/orchestrate-tasks   # Phase 5: Delegate to specialized agents
```

The workflow guides you from initial idea to completed implementation. Each phase builds upon the previous one and produces structured artifacts.

### Standards System

- **11 Standards** across **7 domains** (Global, DevOps, Agents, API, Database, Frontend, Testing)
- **Automatic injection** as Claude Code Skills - relevant standards are loaded based on context
- **Tag-based matching** - standards are automatically applied based on the task at hand
- **Extensible** - add custom standards for project-specific conventions

### CLI Safety System

- **Pre-flight checks** before installation
- **Conflict detection** for existing setups
- **Health monitoring** with auto-fix
- **Rollback support** in case of issues
- **GDPR compliance check** for EU conformity

---

## Quick Start

### Prerequisites

- [Claude Code CLI](https://claude.com/claude-code) installed
- Node.js >= 18 (for CLI features)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine

# 2. Start Claude Code (loads the system automatically)
claude

# 3. Optional: Install CLI safety tools
cd cli
npm install && npm run build
```

### First Workflow: From Idea to Implementation

Start Claude Code and execute the 5 phases in sequence:

```bash
# Phase 1: Plan the product
# Define the mission, vision, and goals of your project
/workflow/plan-product

# Phase 2: Shape the specification
# Gather requirements, references, and constraints
/workflow/shape-spec

# Phase 3: Write the specification
# Create a detailed technical specification
/workflow/write-spec

# Phase 4: Create tasks
# Generate implementable tasks from the specification
/workflow/create-tasks

# Phase 5: Orchestrate tasks
# Delegate tasks to specialized agents
/workflow/orchestrate-tasks
```

Each phase creates files in the `workflow/` directory that serve as context for subsequent phases.

---

## Architecture

### 6-Layer Plugin Architecture

```
+------------------------------------------------------------------+
|  Layer 6: Plugin Packaging (.claude-plugin/plugin.json)          |
|  Bundles all layers into an installable package                  |
+------------------------------------------------------------------+
|  Layer 5: Hooks (hooks/hooks.json)                               |
|  Event-based automation (SessionStart, Pre/PostToolUse)          |
+------------------------------------------------------------------+
|  Layer 4: Agents (.claude/agents/*.md)                           |
|  7 specialized subagents with MCP tool integration               |
+------------------------------------------------------------------+
|  Layer 3: Skills (.claude/skills/workflow/)                       |
|  Context-based knowledge (Standards, MCP, Hooks, Config)         |
+------------------------------------------------------------------+
|  Layer 2: Commands (.claude/commands/workflow/)                   |
|  8 slash commands for the 5-phase workflow                       |
+------------------------------------------------------------------+
|  Layer 1: CLAUDE.md (.claude/CLAUDE.md)                          |
|  Project instructions and system overview                        |
+------------------------------------------------------------------+
```

### Recommended MCP Servers

| Server | Function | Used By |
|--------|----------|---------|
| **Serena** | Semantic code analysis (symbol navigation, refactoring) | architect, researcher, debug, ask |
| **Greptile** | PR management and code review integration | orchestrator, security |

MCP servers are optional - agents automatically fall back to standard tools when servers are unavailable.

### 3-Layer Context Model

```
+------------------------------------------------------------------+
|  Layer 1: Standards (HOW)                                        |
|  Conventions, Patterns, Best Practices                           |
|  -> workflow/standards/                                           |
|  -> 7 domains: global, devops, agents, api, database,            |
|     frontend, testing                                            |
+------------------------------------------------------------------+
|  Layer 2: Product (WHAT / WHY)                                   |
|  Mission, Vision, Architecture Decisions, Roadmap                |
|  -> workflow/product/                                            |
+------------------------------------------------------------------+
|  Layer 3: Specs (WHAT NEXT)                                      |
|  Feature Specifications, Implementation Tasks                    |
|  -> workflow/specs/                                               |
+------------------------------------------------------------------+
```

- **Layer 1 (HOW):** Defines *how* things are built - coding standards, naming conventions, CI/CD patterns
- **Layer 2 (WHAT/WHY):** Defines *what* is being built and *why* - product vision, architecture, roadmap
- **Layer 3 (WHAT NEXT):** Defines *what comes next* - concrete feature specs and tasks

### Agent Hierarchy

```
                    +------------------+
                    |   Orchestrator   |  (Task Delegation)
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |         |         |         |         |
    +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
    |Architect| |  Debug | |DevOps  | |Security| |Researcher|
    +---------+ +--------+ +--------+ +--------+ +----------+
         |
    +----+---+
    |  Ask   |  (Explanations)
    +---------+
```

The Orchestrator analyzes tasks and delegates them to the appropriate specialized agent. Agents with READ-ONLY access can analyze code but not modify it, while FULL-access agents can also implement changes.

---

## Project Structure

```
claude-workflow-engine/
|
|-- .claude-plugin/               # Layer 6: Plugin Packaging
|   +-- plugin.json               # Plugin manifest (v0.2.5)
|
|-- .claude/                      # Claude Code configuration
|   |-- agents/                   # Layer 4: 7 agent definitions
|   |   |-- architect.md          # +Serena MCP tools
|   |   |-- ask.md                # +Serena MCP tools
|   |   |-- debug.md              # +Serena MCP tools
|   |   |-- devops.md
|   |   |-- orchestrator.md       # +Greptile MCP tools
|   |   |-- researcher.md         # +Serena MCP tools
|   |   +-- security.md           # +Greptile MCP tools
|   |-- commands/workflow/         # Layer 2: 8 workflow slash commands
|   +-- skills/workflow/           # Layer 3: Standards + 3 new skills
|       |-- mcp-usage/            # MCP tool catalog
|       |-- hook-patterns/        # Hook reference
|       +-- plugin-config/        # 6-layer configuration
|
|-- hooks/                        # Layer 5: Event-based hooks
|   |-- hooks.json                # Hook definitions
|   +-- scripts/                  # Hook implementations
|       |-- common.sh             # Shared utilities
|       |-- session-start.sh      # SessionStart: Load context
|       |-- pre-write-validate.sh # PreToolUse: Secrets protection
|       +-- post-write-log.sh     # PostToolUse: Change logging
|
|-- workflow/                      # Knowledge layers (3-layer model)
|   |-- config.yml                # Main configuration (v0.2.5)
|   |-- orchestration.yml         # Orchestration settings
|   |-- product/                  # Layer 2: Mission, Roadmap, Architecture
|   |-- standards/                # Layer 1: 11 standards across 7 domains
|   |   +-- index.yml             # Standards registry with tags
|   +-- specs/                    # Layer 3: Feature specifications
|
|-- cli/                          # Safety tools (TypeScript)
|-- docs/                         # Documentation (DE + EN)
+-- LICENSE                       # MIT License
```

---

## Standards Commands

Three additional commands for standards management:

```bash
# Discover standards from the codebase
# Analyzes existing code and suggests new standards
/workflow/discover-standards

# Update the standards index
# Synchronizes index.yml with existing standard files
/workflow/index-standards

# Manually inject standards into context
# For cases where automatic matching is insufficient
/workflow/inject-standards
```

---

## CLI Usage

```bash
# Build CLI tools
cd cli && npm install && npm run build

# Health check - verify system state
node dist/index.js health --verbose

# Compliance check - verify GDPR conformity
node dist/index.js check --gdpr --fix

# Conflict detection - check before integration
node dist/index.js check --conflicts

# Safe installation with backup
node dist/index.js install --backup /path/to/project
```

---

## Privacy

This system is built with data sovereignty as a core principle:

- **Local data storage:** All standards, specs, and product context live in your repository
- **No additional cloud services:** The system makes no API calls beyond Claude Code itself
- **Sensitive data protected:** `.local.md` files are gitignored by default
- **PII detection:** CLI tools can scan for accidentally committed personal data
- **EU-compliant:** Configuration defaults to `eu-central-1` (Frankfurt)

> **Note:** Claude Code itself communicates with the Anthropic API. This system does not add any additional external communication - it organizes the local workflow context that Claude Code uses.

---

## Use Cases

- **Consistent standards** - Code remains uniform even after long breaks
- **Structured feature development** - From idea through specification to implementation
- **Automatic documentation** - Architecture decisions and specifications are maintained alongside code
- **Unified workflows** - Same processes across different projects
- **Knowledge retention** - Context is preserved between sessions
- **Team onboarding** - New team members understand standards and architecture immediately

---

## Documentation

Full documentation is available in English:

| Document | Description |
|----------|-------------|
| [Getting Started](docs/en/getting-started.md) | Introduction and basics |
| [Platform Architecture](docs/en/platform-architecture.md) | 6-layer plugin architecture |
| [Agents Reference](docs/en/agents.md) | All 7 agents in detail |
| [Workflow Guide](docs/en/workflow.md) | 5-phase workflow explained |
| [Standards System](docs/en/standards.md) | Creating and managing standards |
| [CLI Reference](docs/en/cli.md) | Safety tools and commands |
| [Configuration](docs/en/configuration.md) | config.yml and settings |
| [Integration](docs/en/integration.md) | Integrating into existing projects |

---

## Contributing

Contributions are welcome! Especially in these areas:

- **New standards** for additional tech stacks
- **Agent improvements** for better specialization
- **CLI features** for extended safety checks
- **Documentation** - improvements and translations

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Credits

This project builds upon concepts and inspiration from the following projects:

| Project | What We Adopted |
|---------|-----------------|
| [Agent OS](https://github.com/buildermethods/agent-os) | 3-Layer Context Model (Standards/Product/Specs) and Spec-Driven Development |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | Specialized Agent Modes with defined access rights |
| [Claude Code](https://github.com/anthropics/claude-code) | CLI platform as runtime for agent definitions |
| [Context7](https://github.com/upstash/context7) | MCP server concept for context-aware knowledge provision |
