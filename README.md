# Claude Workflow Engine

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/LL4nc33/claude-workflow-engine/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-ready-purple.svg)](https://claude.com/claude-code)

A workflow engine for Claude Code with 7 specialized agents, a 5-phase structured workflow, and a standards system that keeps your projects consistent.

## Features

### 7 Specialized Agents
- **Architect:** System Design, ADRs, architectural decisions
- **Ask:** Explanations, tutorials, code walkthroughs
- **Debug:** Implementation, bugfixes, problem solving
- **DevOps:** CI/CD, Docker, Kubernetes, Infrastructure as Code
- **Orchestrator:** Task delegation, project coordination
- **Researcher:** Codebase analysis, documentation
- **Security:** OWASP audits, vulnerability assessment

### 5-Phase Development Workflow
```bash
/workflow/plan-product        # Define product vision and mission
/workflow/shape-spec          # Capture requirements in structured form
/workflow/write-spec          # Create technical specifications
/workflow/create-tasks        # Generate tasks automatically
/workflow/orchestrate-tasks   # Delegate to specialist agents
```

### Standards System
- **11 predefined standards** across 7 domains (Global, DevOps, API, Database, Testing, Frontend, Agents)
- **Automatic standards injection** as Claude Code Skills
- **Context-based application** depending on task type
- **Extensible** for project-specific standards

### CLI Safety System
- **Pre-flight checks** before installation
- **Conflict detection** for existing setups
- **Health monitoring** with auto-fix
- **Rollback support** for problems

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

### First Workflow

```bash
# In Claude Code terminal:
/workflow/plan-product        # Interactive product planning
/workflow/shape-spec          # Shape feature in plan mode
/workflow/write-spec          # Create technical spec
/workflow/create-tasks        # Generate tasks automatically
/workflow/orchestrate-tasks   # Delegate to specialist agents
```

## Architecture

### 3-Layer Context Model

```
Layer 1: Standards (HOW)
  - Global conventions (naming, tech-stack)
  - Domain standards (API, Database, DevOps, Testing, Frontend, Agents)

Layer 2: Product (WHAT and WHY)
  - Mission and vision
  - Architecture decisions
  - Roadmap

Layer 3: Specs (WHAT NEXT)
  - Feature specifications
  - Implementation tasks
```

### Agent Hierarchy

| Agent | Role | When to Use |
|-------|------|-------------|
| **Architect** | System design, ADRs | "How should I architect X?" |
| **Ask** | Explanations, tutorials | "How does Y work?" |
| **Debug** | Implementation, bugfixes | "Fix this bug" or "Implement Z" |
| **DevOps** | CI/CD, Docker, K8s, IaC | "Set up CI/CD for me" |
| **Orchestrator** | Task delegation, coordination | "Distribute these 10 tasks" |
| **Researcher** | Codebase analysis, docs | "What does this code do?" |
| **Security** | OWASP checks, vulnerabilities | "Is this secure?" |

## Project Structure

```
.claude/                 # Claude Code configuration
  agents/                # 7 specialized agent definitions
  commands/workflow/      # 8 workflow slash commands
  skills/workflow/        # 7 standards as skills

workflow/                # Knowledge layer
  config.yml             # Main configuration
  orchestration.yml      # Orchestration settings
  product/               # Product vision and mission
  standards/             # 11 standards in 7 domains
  specs/                 # Feature specifications

cli/                     # Safety tools (TypeScript)
docs/                    # Documentation
```

## Standards Commands

```bash
/workflow/discover-standards   # Discover new standards from codebase
/workflow/index-standards      # Update standards index
/workflow/inject-standards     # Manually inject standards into context
```

## CLI Usage

```bash
# Build CLI tools
cd cli && npm install && npm run build

# Health check
node dist/index.js health --verbose

# Compliance check
node dist/index.js check --gdpr --fix

# Conflict detection before integration
node dist/index.js check --conflicts

# Safe installation with backup
node dist/index.js install --backup /path/to/project
```

## Data Privacy

This system is designed with data sovereignty in mind:

- **Workflow data stays local:** All standards, specs, and product context live in your repository
- **No additional cloud services:** The system itself makes no API calls beyond what Claude Code already does
- **Sensitive config protection:** `.local.md` files are gitignored by default
- **PII detection:** CLI tools can scan for accidentally committed personal data
- **EU-ready:** Configuration defaults to eu-central-1 for optional cloud infrastructure

> **Note:** Claude Code itself communicates with the Anthropic API. This system does not add any additional external communication - it organizes your local workflow context that Claude Code uses.

## Use Cases

- Consistent code standards even after long breaks
- Structured feature development from idea to implementation
- Automatic documentation and architecture decisions
- Unified workflows across projects
- Knowledge retention between sessions

## Contributing

Contributions are welcome! Especially:

- New standards for additional tech stacks
- Agent improvements for better specialization
- CLI features for extended safety checks
- Documentation improvements

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- **[Agent OS](https://github.com/ericflo/agent-os)** - Inspiration for the 3-Layer Context Model
- **[Claude Code](https://claude.com/claude-code)** - Platform for multi-agent workflows
- **[Context7](https://context7.com)** - MCP server for up-to-date documentation context
