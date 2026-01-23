# Getting Started Guide

## What is Claude Workflow Engine?

Claude Workflow Engine is a professional Multi-Agent System that extends Claude Code
with structured workflows and specialized AI agents.

**Before:** "Claude, build me a login function"
- Unclear requirements
- Inconsistent implementation
- No architecture documentation
- Manual code reviews

**After:** Structured 5-phase workflow
1. **Product Planning:** What should be built and why?
2. **Spec Shaping:** What do the requirements look like exactly?
3. **Technical Writing:** What architecture and APIs do we need?
4. **Task Creation:** What concrete steps are necessary?
5. **Orchestration:** Automatic delegation to specialized agents

## System Architecture

### The 3-Layer Context Model

```
Layer 1: Standards (HOW)
  Global Standards - Naming, Tech-Stack
  Domain Standards - API, Database, DevOps, Testing, Frontend, Agents

Layer 2: Product (WHAT and WHY)
  Mission - Product Vision
  Architecture - System Design
  Roadmap - Feature Pipeline

Layer 3: Specs (WHAT NEXT)
  Feature Specs - Concrete requirements
  Tasks - Implementation steps
```

**Why this structure?**
- **Standards:** Ensure consistency across projects
- **Product:** Keep the "big picture" in view
- **Specs:** Concrete, actionable work items

### Agent Hierarchy

| Agent | What it does | When to use it |
|-------|-------------|----------------|
| **Architect** | System design, ADRs, architecture decisions | "How should I architect X?" |
| **Ask** | Explanations, tutorials, code understanding | "How does Y work?" |
| **Debug** | Implementation, bugfixes, problem solving | "Fix this bug" or "Implement Z" |
| **DevOps** | CI/CD, Docker, Kubernetes, IaC | "Set up CI/CD for me" |
| **Orchestrator** | Task delegation, multi-agent coordination | "Distribute these 10 tasks" |
| **Researcher** | Codebase analysis, documentation generation | "What does this code do?" |
| **Security** | OWASP checks, vulnerability assessment | "Is this secure?" |

## Installation Step by Step

### Step 1: Check Prerequisites

```bash
# Claude Code installed?
claude --version

# Node.js for CLI tools
node --version  # Should be >= 18

# Git for version control
git --version
```

**Not yet installed?**
- **Claude Code:** [claude.com/claude-code](https://claude.com/claude-code)
- **Node.js:** [nodejs.org](https://nodejs.org) (LTS version)

### Step 2: Clone Repository

```bash
# Navigate to your projects directory
cd ~/projects

# Clone repository
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine

# View structure
ls -la
```

**What you should see:**
```
.claude/                 # Claude Code configuration
  agents/                # 7 specialized agents
  commands/workflow/      # 8 workflow commands
  skills/workflow/        # 7 standards skills

workflow/                # Knowledge layer
  config.yml             # Main configuration
  product/               # Product vision and mission
  standards/             # 11 standards in 7 domains
  specs/                 # Feature specifications (empty, gets populated)

cli/                     # Safety tools
docs/                    # This documentation
```

### Step 3: Activate System

```bash
# Start Claude Code in the project
claude

# Run a system check
claude> Which agents are available?
```

**Expected response:**
Claude should list the 7 agents and explain that the Workflow Engine system is loaded.

### Step 4: Optional - Install CLI Tools

```bash
# For extended safety features
cd cli
npm install
npm run build

# Test CLI
node dist/index.js --help
```

**CLI Features:**
- **Health Check:** Verify system state
- **Conflict Detection:** Compatibility with existing setups
- **GDPR Validation:** Automatic compliance checks
- **Installation Safety:** Rollback on problems

## Your First Workflow

### Scenario: Developing a Login Function

We will develop a complete login function together from idea to implementation.

#### Phase 1: Product Planning

```bash
claude> /workflow/plan-product
```

**What happens:**
1. Interactive questions about your product vision
2. Definition of mission and goals
3. Tech stack selection
4. Roadmap creation

**Example questions:**
- "What is the main function of your application?"
- "Who is the target audience?"
- "Which tech stack do you prefer?"

**Output:** `workflow/product/mission.md`, `roadmap.md`, `architecture.md`

#### Phase 2: Spec Shaping

```bash
claude> /workflow/shape-spec
```

**Important:** This command requires **Plan Mode**! Claude switches to plan mode automatically.

**What happens:**
1. Capture feature idea in structured form
2. Define requirements and user stories
3. Find references to existing code
4. Identify relevant standards

**Example input:** "I need a login function with email/password"

**Output:** `workflow/specs/20260123-1425-login/shape.md`, `references.md`, `standards.md`

#### Phase 3: Technical Writing

```bash
claude> /workflow/write-spec
```

**What happens:**
1. Architect agent takes over
2. Technical specification based on the shape
3. API design, data model, security considerations
4. Architecture decisions documented

**Output:** `workflow/specs/20260123-1425-login/spec.md`

#### Phase 4: Task Creation

```bash
claude> /workflow/create-tasks
```

**What happens:**
1. Orchestrator agent breaks spec into tasks
2. Automatic agent assignment
3. Dependencies defined
4. Quality gates set

**Output:** `workflow/specs/20260123-1425-login/tasks.md`, `orchestration.yml`

#### Phase 5: Orchestration

```bash
claude> /workflow/orchestrate-tasks
```

**What happens:**
1. Tasks are delegated to specialized agents
2. **Security agent** checks for OWASP compliance
3. **Debug agent** implements backend logic
4. **DevOps agent** sets up tests and CI/CD
5. **Architect agent** reviews architecture decisions

**Output:** `progress.md`, `delegation.log`

## Extended Features

### Customize Standards

```bash
# Discover new standards
claude> /workflow/discover-standards

# Update standards index
claude> /workflow/index-standards

# Manually inject standards into context
claude> /workflow/inject-standards
```

### Health Monitoring

```bash
# CLI health check
node cli/dist/index.js health --verbose

# GDPR compliance check
node cli/dist/index.js check --gdpr --fix
```

### Integrate Existing Projects

```bash
# Conflict check before integration
node cli/dist/index.js check --conflicts

# Dry-run installation
node cli/dist/index.js install --dry-run /path/to/project

# Safe integration with backup
node cli/dist/index.js install --backup /path/to/project
```

## Troubleshooting

### Problem: "Agent not found"

**Cause:** CLAUDE.md was not loaded or agents are not correctly installed.

**Solution:**
```bash
# Check structure
ls .claude/agents/

# Restart Claude Code with explicit project path
claude --project /full/path/to/claude-workflow-engine
```

### Problem: "Standards not loaded"

**Cause:** Skills system not activated or index.yml corrupt.

**Solution:**
```bash
# Check standards index
cat workflow/standards/index.yml

# Regenerate index
claude> /workflow/index-standards
```

### Problem: "Command not available"

**Cause:** Commands are not correctly installed or permissions missing.

**Solution:**
```bash
# Check commands structure
ls .claude/commands/workflow/

# Check settings
cat .claude/settings.local.json
```

### Problem: GDPR Warnings

**Cause:** PII in configuration files or missing gitignore patterns.

**Solution:**
```bash
# GDPR check with auto-fix
node cli/dist/index.js check --gdpr --fix
```

## Next Steps

1. Study each agent's capabilities in `.claude/agents/`
2. Explore the standards in `workflow/standards/`
3. Try the CLI tools for health monitoring
4. Create your first feature specification

## Support

- **GitHub Issues:** For bugs and feature requests
- **Discussions:** For questions and community exchange

---

*You are now ready to conduct professional AI-supported development!*
