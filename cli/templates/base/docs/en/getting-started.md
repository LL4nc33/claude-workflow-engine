# Getting Started

## What is Claude Workflow Engine?

Claude Workflow Engine is a multi-agent system that extends Claude Code with structured workflows, specialized AI agents, and a standards-based context model. Instead of simply "ask Claude," you get a repeatable, spec-driven development process.

**What you get:**

- 7 specialized agents (Architect, Debug, Security, DevOps, and more)
- A 5-phase workflow from idea to implementation
- Standards that are automatically applied to delegated tasks
- CLI safety tools for installation and health monitoring

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Claude Code | current | [claude.ai/code](https://claude.ai/code) -- installed and authenticated |
| Node.js | >= 18 | [nodejs.org](https://nodejs.org) -- only for CLI tools |
| Git | current | Version control |

Verify your setup:

```bash
claude --version
node --version   # >= 18
git --version
```

Expected output (versions may vary):

```
1.0.x
v20.x.x
git version 2.x.x
```

## Installation

### Option A: Clone the Repository

```bash
git clone https://github.com/LL4nc33/claude-workflow-engine.git
cd claude-workflow-engine
```

This is the fastest path for a new project. You immediately have all agents, commands, and standards available.

### Option B: Integrate into an Existing Project

If you want to add Claude Workflow Engine to an existing project, use the CLI installer. See the [Integration Guide](integration.md) for details.

Quick summary:

```bash
# Build CLI (from the claude-workflow-engine repo)
cd cli && npm install && npm run build

# Preview (no changes)
node dist/index.js install --dry-run /path/to/your/project

# Run the installation
node dist/index.js install /path/to/your/project
```

## What You Get

After installation, your project has this structure:

```
.claude/
  agents/              # 7 specialized agents
  commands/workflow/    # 8 slash commands
  skills/workflow/      # 13 skills (7 standards + 6 plugin skills)

.claude-plugin/
  plugin.json          # Plugin manifest (6-layer architecture)

hooks/
  hooks.json           # Hook definitions
  scripts/             # Hook scripts (SessionStart, Pre/PostToolUse)

workflow/
  config.yml           # Main configuration
  orchestration.yml    # Task delegation config
  product/             # Mission, roadmap, architecture
  standards/           # 11 standards across 7 domains
  specs/               # Feature specs (created per feature)

cli/                   # Safety tools (optional)
```

The key directories:

- **`.claude/agents/`** -- Agent definitions live here. Each agent has its own Markdown file with personality, access level, and scope of responsibilities.
- **`.claude/commands/workflow/`** -- The slash commands you will use in the next section.
- **`.claude-plugin/`** -- The plugin manifest that bundles all 6 layers.
- **`hooks/`** -- Event-based automation (secrets protection, change logging).
- **`workflow/standards/`** -- Conventions and patterns that are automatically injected as context into tasks.
- **`workflow/specs/`** -- Where your feature specifications are created.

## Your First Workflow

Start Claude Code in your project directory:

```bash
claude
```

Now you will walk through the 5 phases of the workflow. Each phase builds on the previous one.

---

### Phase 1: Plan the Product

```
/workflow/plan-product
```

Claude asks you interactive questions about your product vision, target audience, and constraints.

**Example interaction:**

```
claude> /workflow/plan-product

Claude: What is the mission of your product? What problem does it solve?

You: A task management app for small teams with a focus on simplicity.

Claude: What are the technical constraints?

You: TypeScript, React frontend, Node.js backend, PostgreSQL.

Claude: Are there any regulatory requirements?

You: GDPR-compliant, data stored in the EU.
```

**Expected result:**

```
workflow/product/mission.md     # Product mission and vision
workflow/product/roadmap.md     # Feature roadmap
workflow/product/architecture.md  # Architecture overview (if defined)
```

---

### Phase 2: Shape a Feature

```
/workflow/shape-spec
```

Here you gather requirements for a specific feature. Claude asks about user stories, references, and applicable standards.

**Example interaction:**

```
claude> /workflow/shape-spec

Claude: Which feature would you like to specify?

You: User Authentication with email/password and OAuth.

Claude: Which standards are relevant?

You: API Response Format, Error Handling, Testing Coverage.

Claude: Are there reference implementations or external APIs?

You: Google OAuth 2.0, existing user table in the DB.
```

**Expected result:**

```
workflow/specs/20260123-user-auth/
  shape.md              # Gathered requirements
  references/           # Linked references
  standards.md          # Applicable standards
```

---

### Phase 3: Write the Technical Spec

```
/workflow/write-spec
```

The shape is transformed into a detailed technical specification -- including API design, data models, and test strategy.

**Example interaction:**

```
claude> /workflow/write-spec

Claude: I will write the technical spec based on the shape in
        workflow/specs/20260123-user-auth/shape.md.
        Should I use a specific API pattern?

You: REST with the standard response format from our standards.
```

**Expected result:**

```
workflow/specs/20260123-user-auth/
  spec.md               # Complete technical specification
  api-design.md         # API endpoints and contracts
  data-model.md         # Database schema
  test-strategy.md      # Test strategy and coverage targets
```

---

### Phase 4: Create Tasks

```
/workflow/create-tasks
```

The spec is broken down into atomic, agent-assignable tasks. Each task has dependencies and acceptance criteria.

**Example interaction:**

```
claude> /workflow/create-tasks

Claude: I am breaking the spec into tasks. The following agents are needed:
        - architect: API Design Review
        - devops: Database Migration Setup
        - debug: Auth logic implementation
        - security: OWASP Audit of auth endpoints

        Should I proceed?

You: Yes, create the tasks.
```

**Expected result:**

```
workflow/specs/20260123-user-auth/
  tasks.md              # All tasks with dependencies
  orchestration.yml     # Agent assignments and execution order
```

---

### Phase 5: Orchestrate Tasks

```
/workflow/orchestrate-tasks
```

Tasks are delegated to specialized agents. The orchestrator tracks progress and enforces quality gates.

**Example interaction:**

```
claude> /workflow/orchestrate-tasks

Claude: Starting orchestration for 20260123-user-auth.
        Phase 1/3: Design Review (architect agent)
        [...]
        Phase 2/3: Implementation (debug agent)
        [...]
        Phase 3/3: Security Audit (security agent)
        [...]
        All tasks completed. 2 findings from the security audit.
```

**Expected result:**

Implemented code according to spec, including tests and security review.

---

## Verification

After cloning or installation, verify that the system loaded correctly.

### Check Agents

Start Claude Code and ask:

```
claude> Which agents are available?
```

**Expected response:** Claude lists all 7 agents (architect, ask, debug, devops, orchestrator, researcher, security). If not, check whether `.claude/agents/` contains the agent files and whether `CLAUDE.md` is present.

### Check Commands

```
claude> /workflow/
```

Claude should offer autocompletion for the 8 workflow commands:

```
/workflow/plan-product
/workflow/shape-spec
/workflow/write-spec
/workflow/create-tasks
/workflow/orchestrate-tasks
/workflow/discover-standards
/workflow/index-standards
/workflow/inject-standards
```

### Health Check (with CLI)

If you have installed the CLI tools:

```bash
cd cli
node dist/index.js health .
```

**Expected output:**

```
Health Check Results:
  Agents:     7/7 loaded
  Commands:   8/8 available
  Standards:  11/11 indexed
  Config:     valid
  GDPR:       compliant

Overall: HEALTHY
```

## Privacy Notice

Claude Workflow Engine itself makes **no API calls** and stores **no data externally**. All standards, specs, and configurations remain in your local file system and your version control.

**Important:** Claude Code itself uses the Anthropic API. Your prompts and code context are sent to Anthropic servers as part of normal Claude Code operation. This is not something the Workflow Engine controls -- it is how Claude Code works. See [Anthropic's Privacy Policy](https://www.anthropic.com/privacy) for details.

**GDPR Measures in the Project:**

- Data residency configured to `eu-central-1` (Frankfurt)
- No PII (personally identifiable information) allowed in standards or specs
- Sensitive data belongs in `.local.md` files (automatically gitignored)
- Patterns like `.env*`, `credentials.*`, `secrets.*` are excluded

## Installing CLI Tools (optional)

The CLI provides safety tools for health monitoring, conflict detection, and GDPR checks:

```bash
cd cli
npm install
npm run build
node dist/index.js --help
```

**Available commands:**

```
install     Install the Workflow Engine into a project
health      Run system health check
check       Check for conflicts, GDPR compliance
rollback    Undo an installation
```

See [CLI Reference](cli.md) for all commands in detail.

## Next Steps

- [Workflow Guide](workflow.md) -- Understand each phase in detail
- [Agents](agents.md) -- What each agent can do and when to use it
- [Standards](standards.md) -- How the standards system works
- [Configuration](configuration.md) -- Customize the engine for your project
- [Platform Architecture](platform-architecture.md) -- 6-layer architecture, hooks, and MCP servers
