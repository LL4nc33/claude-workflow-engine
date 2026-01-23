# Getting Started

## What is Claude Workflow Engine?

Claude Workflow Engine is a multi-agent system that extends Claude Code with structured workflows, specialized AI agents, and a standards-based context model. It turns "just ask Claude" into a repeatable, spec-driven development process.

**What it gives you:**

- 7 specialized agents (architect, debug, security, devops, etc.)
- A 5-phase workflow from idea to implementation
- Standards that automatically apply to delegated tasks
- CLI safety tools for installation and health monitoring

## Prerequisites

- **Claude Code** - [claude.ai/code](https://claude.ai/code) (installed and authenticated)
- **Node.js >= 18** - [nodejs.org](https://nodejs.org) (for CLI tools only)
- **Git** - For version control

Verify your setup:

```bash
claude --version
node --version   # >= 18
git --version
```

## Installation

### Option A: Clone the repository

```bash
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine
```

### Option B: Install into an existing project

```bash
# From the claude-workflow-engine repo:
cd cli && npm install && npm run build

# Then install into your project:
node dist/index.js install --dry-run /path/to/your/project   # Preview first
node dist/index.js install /path/to/your/project             # Install
```

See [Integration Guide](integration.md) for details on integrating with existing projects.

## What you get

After installation, your project has this structure:

```
.claude/
  agents/              # 7 specialized agents
  commands/workflow/    # 8 slash commands
  skills/workflow/      # 7 standards skills (auto-matching)

workflow/
  config.yml           # Main configuration
  orchestration.yml    # Task delegation config
  product/             # Mission, roadmap, architecture
  standards/           # 11 standards in 7 domains
  specs/               # Feature specs (created per feature)

cli/                   # Safety tools (optional)
```

## Your first workflow

Start Claude Code in your project directory:

```bash
claude
```

Then run the 5-phase workflow:

### 1. Plan your product

```
/workflow/plan-product
```

Interactive questions about your product vision. Creates `workflow/product/mission.md`, `roadmap.md`, and `tech-stack.md`.

### 2. Shape a feature

```
/workflow/shape-spec
```

Requires plan mode. Gathers requirements, references, and applicable standards into a spec folder.

### 3. Write the technical spec

```
/workflow/write-spec
```

Transforms the shape into a detailed technical specification with API design, data models, and testing strategy.

### 4. Create tasks

```
/workflow/create-tasks
```

Breaks the spec into atomic, agent-assignable tasks with dependencies and acceptance criteria.

### 5. Orchestrate

```
/workflow/orchestrate-tasks
```

Delegates tasks to specialized agents, tracks progress, and enforces quality gates.

## Quick verification

After cloning or installing, verify the system is loaded:

```
claude> Which agents are available?
```

Claude should list all 7 agents. If it doesn't, check that `.claude/agents/` contains the agent files and that `CLAUDE.md` is present.

## Data privacy

Claude Workflow Engine itself makes **no API calls** and stores **no data externally**. All standards, specs, and configurations stay in your local filesystem and version control.

However: Claude Code uses the Anthropic API. Your prompts and code context are sent to Anthropic's servers as part of normal Claude Code operation. This is not something the Workflow Engine controls -- it's how Claude Code works. See [Anthropic's privacy policy](https://www.anthropic.com/privacy) for details.

## Install CLI tools (optional)

The CLI provides safety tools for health monitoring, conflict detection, and GDPR checks:

```bash
cd cli
npm install
npm run build
node dist/index.js --help
```

See [CLI Reference](cli.md) for all commands.

## Next steps

- [Workflow Guide](workflow.md) - Understand each phase in detail
- [Agents](agents.md) - Learn what each agent does and when to use it
- [Standards](standards.md) - How the standards system works
- [Configuration](configuration.md) - Customize the engine for your project
