# Workflow Guide

Claude Workflow Engine (v0.2.7) offers three development paths:

## Quick Start

### 1. Auto-Delegation (recommended)

Simply describe what you want in chat — the engine recognizes intent and delegates automatically:

```
"Implement user auth"              → builder agent
"Explain the login flow"           → explainer agent
"Audit the API endpoints"          → security agent
"Setup Docker for the project"     → devops agent
"Check test coverage"              → quality agent
"Brainstorm alternatives"          → innovator agent
```

### 2. Smart Workflow (1 command)

```
/workflow:smart-workflow
```

Auto-detects your current phase and guides you through all 5 phases with minimal questions.

### 3. Explicit 5-Phase (full control)

```
/workflow:plan-product --> /workflow:shape-spec --> /workflow:write-spec --> /workflow:create-tasks --> /workflow:orchestrate-tasks
```

## Overview

| Phase | Command | What it does | Output |
|-------|---------|--------------|--------|
| 1 | `/workflow/plan-product` | Define product vision | `workflow/product/` |
| 2 | `/workflow/shape-spec` | Gather requirements | `workflow/specs/{folder}/` |
| 3 | `/workflow/write-spec` | Technical specification | `spec.md` |
| 4 | `/workflow/create-tasks` | Task breakdown | `tasks.md`, `orchestration.yml` |
| 5 | `/workflow/orchestrate-tasks` | Agent delegation | `progress.md` |

## Phase 1: Plan Product

**Command:** `/workflow/plan-product`

**Purpose:** Create the foundational product documentation. This phase only needs to run once per project (or when the product direction changes).

**What happens:**

1. Claude asks about your product's problem, target users, and unique value proposition
2. You describe your MVP features and post-launch plans
3. You specify the tech stack (or confirm the suggested one)
4. Three files are created in `workflow/product/`

**Output files:**

| File | Content |
|------|---------|
| `mission.md` | Problem, target users, unique solution |
| `roadmap.md` | MVP features, post-launch features |
| `tech-stack.md` | Frontend, backend, database, additional tools |

**Example interaction:**

```
> /workflow/plan-product

Claude: What problem does this product solve?
You:    We need a dashboard for real-time monitoring of IoT sensor data.

Claude: Who is this product for?
You:    Operations engineers in manufacturing plants.

Claude: What makes your solution unique?
You:    Predictive alerts based on historical patterns, not just thresholds.
```

**Expected output:**

```
workflow/product/
  mission.md       # Problem: IoT monitoring, Target: Ops Engineers
  roadmap.md       # MVP: Dashboard + Alerts, Post-Launch: ML models
  tech-stack.md    # React, Node.js, TimescaleDB, MQTT
```

**When to re-run:** When the product direction changes fundamentally. You can also update individual files manually.

## Phase 2: Shape Spec

**Command:** `/workflow/shape-spec`

**Prerequisite:** Phase 1 must be completed (product documentation exists). You must be in Plan Mode.

**Purpose:** Gather all context needed before writing a technical specification. This is the "think first, code later" phase.

**What happens:**

1. You describe what you want to build
2. Claude asks about visuals (mockups, screenshots, examples)
3. You reference implementations in the codebase
4. Claude identifies relevant standards from `workflow/standards/`
5. A spec folder is created with structured planning documents

**Output files:**

```
workflow/specs/2026-01-23-1430-sensor-dashboard/
  plan.md          # The complete execution plan
  shape.md         # Scope, decisions, context
  standards.md     # Full content of applicable standards
  references.md    # References to similar code
  visuals/         # Mockups if provided
```

**What shape.md captures:**

- What you are building (scope)
- Decisions made during shaping
- Visual references
- Code references examined
- Product alignment notes
- Which standards apply and why

**Example interaction:**

```
> /workflow/shape-spec

Claude: What are we building?
You:    A real-time sensor data chart component with a 5-minute rolling window.

Claude: Do you have visuals for reference?
You:    Look at docs/mockups/chart-widget.png.

Claude: Is there similar code in this codebase?
You:    The Notifications Panel in src/features/notifications/ does real-time updates.

Claude: Based on what we are building, these standards might be relevant:
        1. frontend/components - UI component structure
        2. api/response-format - API response envelope
        Should I include these? (yes / customize)
You:    yes
```

**Expected output:**

```
Spec folder created: workflow/specs/2026-01-23-1430-sensor-dashboard/
  - shape.md: Scope, 3 decisions, 2 standards
  - references.md: 1 code reference (notifications/)
  - standards.md: frontend/components + api/response-format
  - visuals/: 1 mockup linked
```

## Phase 3: Write Spec

**Command:** `/workflow/write-spec`

**Prerequisite:** A spec folder must exist from Phase 2 (with `shape.md`).

**Purpose:** Transform the shaped requirements into an unambiguous technical specification that agents can implement from.

**What happens:**

1. Claude reads shape, references, and standards
2. You confirm or adjust key technical decisions (data model, API design, state management)
3. A complete `spec.md` is generated

**Output file:** `spec.md` is added to the spec folder.

**Spec structure:**

```markdown
# Technical Specification: {Feature Name}

## Overview
## Summary
## Technical Design
  ### Data Model
  ### API / Interface Design
  ### Implementation Details
  ### State Management
  ### Error Handling
## Standards Compliance
## Dependencies
## Testing Strategy
## Security Considerations
## Performance Considerations
## Migration / Rollout
## Open Questions
```

**Example interaction:**

```
> /workflow/write-spec

Claude: I found a spec: 2026-01-23-1430-sensor-dashboard/
        Should I write the technical specification for it?
You:    yes

Claude: Before writing the spec, I need to clarify:
        1. Data Model: WebSocket stream with 5-min ring buffer? (yes / alternative)
        2. API Design: GET /api/sensors/:id/stream via SSE? (yes / alternative)
You:    1. yes, 2. use WebSocket instead of SSE
```

**Expected output:**

```
spec.md created in workflow/specs/2026-01-23-1430-sensor-dashboard/
  - 12 sections
  - Data Model: WebSocket + Ring Buffer
  - API: WebSocket endpoint /ws/sensors/:id
  - 3 open questions flagged for clarification
```

## Phase 4: Create Tasks

**Command:** `/workflow/create-tasks`

**Prerequisite:** `spec.md` must exist in the spec folder.

**Purpose:** Break the specification into atomic, implementable tasks that can be delegated to specialized agents.

**What happens:**

1. Claude analyzes the spec and identifies task groups
2. You confirm the breakdown structure
3. Each task receives: description, agent assignment, dependencies, acceptance criteria, and file list
4. An execution order (critical path) is calculated
5. A spec-specific `orchestration.yml` is generated for delegation

**Output files:**

| File | Purpose |
|------|---------|
| `tasks.md` | Complete task list with acceptance criteria |
| `orchestration.yml` | Machine-readable delegation configuration |

**Task sizes:**

| Size | Scope |
|------|-------|
| S | Single file, simple logic |
| M | 2-4 files, moderate complexity |
| L | 5+ files, complex logic |

**Agent mapping:**

| Task Type | Assigned Agent |
|-----------|----------------|
| backend, frontend, testing, database | builder |
| security | security |
| infrastructure, ci_cd | devops |
| architecture, review | architect |
| documentation | researcher |
| explanation | explainer |

**Example interaction:**

```
> /workflow/create-tasks

Claude: I am analyzing the spec "Sensor Dashboard"...
        Proposed breakdown: 12 tasks in 4 groups.
        Should I show the details? (yes / customize)
You:    yes

Claude: Phase 1 - Foundation:
          Task 1.1: DB Schema (S, builder)
          Task 1.2: TypeScript Types (S, builder)
        Phase 2 - Backend:
          Task 2.1: WebSocket Handler (M, builder)
          Task 2.2: API Endpoint (M, builder)
        Phase 3 - Frontend:
          Task 3.1: Chart Component (M, builder)
          Task 3.2: State Management (M, builder)
        Phase 4 - Quality:
          Task 4.1: Unit Tests (M, builder)
          Task 4.2: Integration Tests (M, builder)
          Task 4.3: Security Review (S, security)
        Phase 5 - Docs:
          Task 5.1: API Documentation (S, researcher)
        Does this work? (yes / customize)
You:    yes
```

**Expected output:**

```
Task breakdown complete:
  - 12 tasks in 4 groups
  - 5 execution phases
  - Estimated effort: M

Phase 1: Task 1.1 (Schema), Task 1.2 (Types)
Phase 2: Task 2.1 (WebSocket Handler), Task 2.2 (API Endpoint)
Phase 3: Task 3.1 (Chart Component), Task 3.2 (State Management)
Phase 4: Task 4.1 (Unit Tests), Task 4.2 (Integration Tests)
Phase 5: Task 5.1 (Documentation)
```

## Phase 5: Orchestrate Tasks

**Command:** `/workflow/orchestrate-tasks`

**Prerequisite:** `tasks.md` and `orchestration.yml` must exist in the spec folder.

**Purpose:** Delegate tasks to specialized agents, track progress, and enforce quality gates.

**What happens:**

1. You select an execution mode
2. Tasks are delegated phase by phase to the responsible agents
3. Each delegation includes: task description, relevant standards (injected inline), spec context, and acceptance criteria
4. After each task, the output is verified against the acceptance criteria
5. Quality gates run at phase transitions
6. Progress is tracked in `progress.md`

**Execution modes:**

| Mode | Behavior |
|------|----------|
| automatic | Execute all phases, only pause on errors |
| phase-by-phase | Confirm after each phase (default) |
| task-by-task | Confirm after each individual task |
| selective | Choose specific tasks for execution |

**Quality Gates:**

The orchestration enforces 4 quality gates:

1. **Pre-Implementation** (after write-spec): Architect + Security review the spec
2. **Pre-Execution** (after create-tasks): Architect verifies task coverage
3. **Post-Phase** (after each phase): Phase-specific checks (schema valid, tests pass, etc.)
4. **Final Acceptance** (after all phases): Security scan + architecture review + user sign-off

Gate results: `PASS` (continue), `WARN` (log and proceed), `BLOCK` (stop and report).

**Error handling:**

When a task fails:
1. Retry with additional context (up to 2 retries)
2. Retry with rephrased instructions
3. Escalate to the user with diagnostics

**Example interaction:**

```
> /workflow/orchestrate-tasks

Claude: Spec found: 2026-01-23-1430-sensor-dashboard/
        12 tasks in 5 phases ready.
        Execution mode? (automatic / phase-by-phase / task-by-task / selective)
You:    phase-by-phase

Claude: Starting Phase 1 - Foundation...
        > Task 1.1: DB Schema delegated to builder agent...
        > Task 1.1: PASS - Schema created, migration runnable
        > Task 1.2: TypeScript Types delegated to builder agent...
        > Task 1.2: PASS - Types generated, consistent with schema
        Phase 1 complete. Quality Gate: PASS
        Continue with Phase 2? (yes / stop / details)
You:    yes
```

**Output file:** `progress.md` in the spec folder, updated continuously.

**Expected output (progress.md):**

```markdown
# Progress: Sensor Dashboard

## Status: In Progress (Phase 2/5)

| Task | Agent | Status | Duration |
|------|-------|--------|----------|
| 1.1 Schema | builder | PASS | 45s |
| 1.2 Types | builder | PASS | 30s |
| 2.1 WebSocket | builder | IN_PROGRESS | - |
| 2.2 API | builder | PENDING | - |
```

## Skipping Phases

You do not have to run every phase every time:

- **Product vision already exists?** Skip Phase 1.
- **You know exactly what to build?** Start at Phase 3 (create a spec manually).
- **Want to implement manually?** Stop after Phase 4 and pick tasks yourself.
- **Only need one agent?** Skip orchestration entirely and delegate directly.

## Convenience Commands

For quick start and daily usage:

| Command | Purpose | Shortcut |
|---------|---------|----------|
| `/workflow:smart-workflow` | Auto-detection + guided 5-phase workflow | `sw` |
| `/workflow:quick` | 3-step MVP workflow (Plan -> Spec -> Build) | `q` |
| `/workflow:help` | Contextual help based on current status | `h` |
| `/workflow:undo` | Git-based workflow revert | - |

---

## NaNo Learning System

The NaNo (Nano-Homunculus) Learning System observes workflow patterns and learns from usage:

### NaNo Commands

| Command | Function |
|---------|----------|
| `/workflow:nano-toggle` | Enable/disable NaNo + first-run setup |
| `/workflow:nano-session` | Show current session observations |
| `/workflow:nano-config` | Interactive NaNo configuration |
| `/workflow:nano-reset` | Reset NaNo data (with confirmation) |
| `/workflow:homunculus-status` | NaNo learning status + quick actions |
| `/workflow:learning-report` | Comprehensive NaNo analysis report |
| `/workflow:review-candidates` | Interactive review of evolution candidates |

### How NaNo Works

1. **Observation**: Hooks capture workflow events (delegations, file changes)
2. **Pattern Detection**: Patterns are analyzed at session end
3. **Evolution Candidates**: Frequent patterns are suggested as improvement candidates
4. **Review**: You decide which patterns to adopt into standards/workflows

Configuration in `nano.local.md` (automatically gitignored, GDPR-compliant).

---

## Token Optimization: TOON Format

JSON data in delegation prompts is automatically converted to [TOON format](https://github.com/toon-format/toon) for ~40% token savings. This happens transparently during orchestration.

---

## Tips

- **For beginners:** Use `/workflow:smart-workflow` -- it guides you through everything
- **For daily use:** Simply describe what you want in chat (Auto-Delegation)
- **For full control:** Use the 5 explicit commands
- Phase 2 (shape-spec) is most valuable for preventing scope creep
- Use `phase-by-phase` mode until you trust the workflow
- Standards are selectively injected (only relevant ones, based on tag matching)
- The progress.md serves as an audit trail -- check it when something goes wrong
- For errors: See `workflow/ERROR-RECOVERY.md` for recovery strategies
- Say "manual" or "without delegation" to disable auto-delegation

## See Also

- [Agents](agents.md) - Which agent handles which task type
- [Standards](standards.md) - How standards are injected during orchestration
- [Configuration](configuration.md) - Customize execution modes and quality gates
- [Platform Architecture](platform-architecture.md) - 6-layer architecture and hooks
