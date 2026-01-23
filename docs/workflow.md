# Workflow Guide

The Claude Workflow Engine uses a 5-phase workflow that takes you from product idea to implemented feature. Each phase builds on the previous one and produces specific artifacts.

```
/plan-product --> /shape-spec --> /write-spec --> /create-tasks --> /orchestrate-tasks
```

## Overview

| Phase | Command | What it does | Output |
|-------|---------|-------------|--------|
| 1 | `/workflow/plan-product` | Define product vision | `workflow/product/` |
| 2 | `/workflow/shape-spec` | Gather requirements | `workflow/specs/{folder}/` |
| 3 | `/workflow/write-spec` | Technical specification | `spec.md` |
| 4 | `/workflow/create-tasks` | Task breakdown | `tasks.md`, `orchestration.yml` |
| 5 | `/workflow/orchestrate-tasks` | Agent delegation | `progress.md` |

## Phase 1: Plan Product

**Command:** `/workflow/plan-product`

**Purpose:** Establish the foundational product documentation. This only needs to run once per project (or when the product direction changes).

**What happens:**

1. Claude asks about your product's problem, target users, and differentiator
2. You describe your MVP features and post-launch plans
3. You specify (or confirm) the tech stack
4. Three files are created in `workflow/product/`

**Output files:**

| File | Contains |
|------|----------|
| `mission.md` | Problem, target users, unique solution |
| `roadmap.md` | MVP features, post-launch features |
| `tech-stack.md` | Frontend, backend, database, other tools |

**Example interaction:**

```
> /workflow/plan-product

Claude: What problem does this product solve?
You:    We need a dashboard for monitoring IoT sensor data in real time.

Claude: Who is this product for?
You:    Operations engineers at manufacturing plants.

Claude: What makes your solution unique?
You:    Predictive alerts based on historical patterns, not just thresholds.
```

**When to re-run:** When your product direction fundamentally changes. You can also update individual files manually.

## Phase 2: Shape Spec

**Command:** `/workflow/shape-spec`

**Prerequisite:** Must be in plan mode. Phase 1 should be completed (product docs exist).

**Purpose:** Gather all context needed before writing a technical spec. This is the "thinking before coding" phase.

**What happens:**

1. You describe what you want to build
2. Claude asks for visuals (mockups, screenshots, examples)
3. You point to reference implementations in the codebase
4. Claude surfaces relevant standards from `workflow/standards/`
5. A spec folder is created with structured planning documents

**Output files:**

```
workflow/specs/2026-01-23-1430-sensor-dashboard/
  plan.md          # The full execution plan
  shape.md         # Scope, decisions, context
  standards.md     # Full content of applicable standards
  references.md    # Pointers to similar code
  visuals/         # Mockups if provided
```

**The shape.md captures:**

- What you're building (scope)
- Key decisions made during shaping
- Visual references
- Code references studied
- Product alignment notes
- Which standards apply and why

**Example interaction:**

```
> /workflow/shape-spec

Claude: What are we building?
You:    A real-time sensor data chart component with 5-minute rolling window.

Claude: Do you have any visuals to reference?
You:    Look at docs/mockups/chart-widget.png

Claude: Is there similar code in this codebase?
You:    The notifications panel in src/features/notifications/ does real-time updates.

Claude: Based on what we're building, these standards may apply:
        1. frontend/components - UI component structure
        2. api/response-format - API response envelope
        Should I include these? (yes / adjust)
You:    yes
```

## Phase 3: Write Spec

**Command:** `/workflow/write-spec`

**Prerequisite:** A spec folder must exist from Phase 2 (containing `shape.md`).

**Purpose:** Transform the shaped requirements into an unambiguous technical specification that agents can implement from.

**What happens:**

1. Claude reads the shape, references, and standards
2. You confirm or adjust key technical decisions (data model, API design, state management)
3. A complete `spec.md` is generated

**Output file:** `spec.md` added to the spec folder.

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

Claude: I found one spec: 2026-01-23-1430-sensor-dashboard/
        Should I write the technical specification for this?
You:    yes

Claude: Before writing the spec, I need to clarify:
        1. Data Model: WebSocket stream with 5-min ring buffer? (yes / alternative)
        2. API Design: GET /api/sensors/:id/stream via SSE? (yes / alternative)
You:    1. yes, 2. Use WebSocket instead of SSE
```

## Phase 4: Create Tasks

**Command:** `/workflow/create-tasks`

**Prerequisite:** `spec.md` must exist in the spec folder.

**Purpose:** Break the specification into atomic, implementable tasks that can be delegated to specialized agents.

**What happens:**

1. Claude analyzes the spec and identifies task groups
2. You confirm the breakdown structure
3. Each task gets: description, agent assignment, dependencies, acceptance criteria, and file list
4. An execution order (critical path) is calculated
5. A per-spec `orchestration.yml` is generated for delegation

**Output files:**

| File | Purpose |
|------|---------|
| `tasks.md` | Full task list with acceptance criteria |
| `orchestration.yml` | Machine-readable delegation config |

**Task sizing:**

| Size | Scope |
|------|-------|
| S | Single file, simple logic |
| M | 2-4 files, moderate complexity |
| L | 5+ files, complex logic |

**Agent mapping:**

| Task type | Assigned agent |
|-----------|---------------|
| backend, frontend, testing, database | debug |
| security | security |
| infrastructure, ci_cd | devops |
| architecture, review | architect |
| documentation | researcher |
| explanation | ask |

**Example output:**

```
Task breakdown complete:
  - 12 tasks in 4 groups
  - 5 execution phases
  - Estimated effort: M

Phase 1: Task 1.1 (Schema), Task 1.2 (Types)
Phase 2: Task 2.1 (WebSocket handler), Task 2.2 (API endpoint)
Phase 3: Task 3.1 (Chart component), Task 3.2 (State management)
Phase 4: Task 4.1 (Unit tests), Task 4.2 (Integration tests)
Phase 5: Task 5.1 (Documentation)
```

## Phase 5: Orchestrate Tasks

**Command:** `/workflow/orchestrate-tasks`

**Prerequisite:** `tasks.md` and `orchestration.yml` must exist in the spec folder.

**Purpose:** Delegate tasks to specialized agents, track progress, and enforce quality gates.

**What happens:**

1. You choose an execution mode
2. Tasks are delegated phase by phase to the appropriate agents
3. Each delegation includes: task description, relevant standards (injected inline), spec context, and acceptance criteria
4. After each task, output is verified against acceptance criteria
5. Quality gates run at phase transitions
6. Progress is tracked in `progress.md`

**Execution modes:**

| Mode | Behavior |
|------|----------|
| automatic | Execute all phases, pause only on failures |
| phase-by-phase | Confirm after each phase (default) |
| task-by-task | Confirm after each individual task |
| selective | Pick specific tasks to execute |

**Quality gates:**

The orchestration enforces 4 quality gates:

1. **Pre-Implementation** (after write-spec): Architect + Security review the spec
2. **Pre-Execution** (after create-tasks): Architect verifies task coverage
3. **Post-Phase** (after each phase): Phase-specific checks (schema valid, tests passing, etc.)
4. **Final Acceptance** (after all phases): Security scan + architecture review + user sign-off

Gate results: `PASS` (proceed), `WARN` (log and continue), `BLOCK` (stop and report).

**Failure handling:**

When a task fails:
1. Retry with additional context (up to 2 retries)
2. Retry with rephrased instructions
3. Escalate to user with diagnostics

**Output file:** `progress.md` in the spec folder, continuously updated.

## Skipping phases

You don't have to run every phase every time:

- **Already have a product vision?** Skip Phase 1.
- **Know exactly what to build?** Start at Phase 3 (manually create a spec).
- **Want to implement manually?** Stop after Phase 4 and pick tasks yourself.
- **Only need one agent?** Skip orchestration entirely and delegate directly.

## Tips

- Run phases in order the first time to understand the full flow
- Phase 2 (shape-spec) is the most valuable for preventing scope creep
- Use `phase-by-phase` execution mode until you trust the workflow
- Standards are injected as full text into delegation prompts (agents can't read file references)
- Progress.md serves as an audit trail -- check it when something goes wrong

## See also

- [Agents](agents.md) - Which agent handles which task type
- [Standards](standards.md) - How standards are injected during orchestration
- [Configuration](configuration.md) - Customize execution modes and quality gates
