---
description: Phase 5 - Tasks an spezialisierte Agents delegieren
interactive: true
---

# Orchestrate Tasks

Delegate tasks from a task list to specialized agents, respecting dependencies and execution phases. This is the final command in the 5-phase workflow.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Respect dependencies** — Never start a task before its dependencies are complete
- **Inject standards** — Each delegated task must include relevant standards context
- **Track progress** — Update task status as work completes
- **Verify quality** — Check each task's acceptance criteria before marking complete

## Prerequisites

A spec folder must contain `tasks.md` and `orchestration.yml` from `/create-tasks`:
```
workflow/specs/{timestamp}-{feature-slug}/
├── shape.md
├── spec.md
├── tasks.md           (REQUIRED)
├── orchestration.yml  (REQUIRED)
├── references.md
└── standards.md
```

If required files are missing:
```
Missing task list or orchestration config. Run /create-tasks first to generate the task breakdown and delegation configuration.
```

## Process

### Step 1: Load Orchestration Config

1. Locate the spec folder (same logic as other commands)
2. Read `orchestration.yml` for task groups, dependencies, and agent mapping
3. Read `tasks.md` for full task descriptions and acceptance criteria
4. Read `standards.md` for standards to inject per task

### Step 2: Present Execution Plan

Use AskUserQuestion to confirm the execution strategy:

```
Orchestration plan for: {Feature Name}

Phases:
  Phase 1: [task IDs] — [agent types] (parallel)
  Phase 2: [task IDs] — [agent types] (after Phase 1)
  Phase 3: [task IDs] — [agent types] (after Phase 2)
  ...

Agent assignments:
  - backend tasks -> {mapped agent}
  - frontend tasks -> {mapped agent}
  - testing tasks -> {mapped agent}

Execution mode:
  1. Automatic — Execute all phases sequentially, pause only on failures
  2. Phase-by-phase — Confirm after each phase before proceeding
  3. Task-by-task — Confirm after each individual task
  4. Selective — Pick specific tasks to execute now

Which mode? (1/2/3/4)
```

### Step 3: Execute Tasks by Phase

For each phase, in order:

#### 3a. Prepare Task Context

For each task in the current phase, build a delegation prompt that includes:

1. **Task description** from `tasks.md`
2. **Acceptance criteria** — Checkboxes that must pass
3. **Relevant standards** — Read from `workflow/standards/` based on `orchestration.yml`
4. **Spec context** — Relevant sections from `spec.md`
5. **Reference implementations** — From `references.md` if applicable
6. **Files to create/modify** — Specific file paths from the task

#### 3b. Delegate to Agent

Use the **Task tool** to delegate work to the appropriate agent. Structure the delegation prompt:

```
## Task {ID}: {Title}

### Context
You are implementing part of the "{Feature Name}" feature.
Full spec: @workflow/specs/{folder-name}/spec.md

### What to do
{Task description from tasks.md}

### Files to create/modify
{File list from the task}

### Standards to follow
{Inject relevant standards content here — NOT just file references}

### Acceptance Criteria
{Checkboxes from the task — the agent must satisfy all of these}

### Reference
{Relevant reference implementations if any}
```

#### 3c. Verify Completion

After each task completes:

1. Check acceptance criteria against the actual output
2. Verify files were created/modified as expected
3. Run any available tests related to this task
4. If verification fails, provide feedback and re-delegate

### Step 4: Track Progress

Maintain a progress tracker in the spec folder. Create/update `progress.md`:

```markdown
# Progress: {Feature Name}

**Started:** {date}
**Last Updated:** {timestamp}

## Overview

```
Phase 1: Data       ████████████ 100% ✓
Phase 2: Models     ████████████ 100% ✓
Phase 3: API        ██████▓▓▓▓▓▓  50% ← current
Phase 4: Frontend   ░░░░░░░░░░░░   0%
Phase 5: Testing    ░░░░░░░░░░░░   0%

Progress: 4/10 tasks | ETA: ~{remaining phases} phases
```

## Status

| Task | Title | Agent | Status | Notes |
|------|-------|-------|--------|-------|
| 1.1 | Schema | backend | done | Completed {time} |
| 1.2 | Models | backend | done | Completed {time} |
| 2.1 | API Endpoints | backend | in-progress | Delegated {time} |
| 2.2 | Validation | backend | blocked | Waiting for 2.1 |
| 3.1 | Components | frontend | pending | Phase 4 |

## Phase Progress

- [x] Phase 1: Data Layer foundations
- [x] Phase 2: Models and types
- [ ] Phase 3: API implementation (IN PROGRESS)
- [ ] Phase 4: Frontend
- [ ] Phase 5: Testing

## Issues

- {timestamp}: [Issue description and resolution]
```

### Progress Bar Generation

When updating `progress.md`, calculate progress bars using this logic:

```
Completed tasks / Total tasks = percentage
████ = filled blocks (percentage / 8.33, rounded)
▓▓▓▓ = partial block (for in-progress phase only)
░░░░ = empty blocks (remaining)

Status indicators:
✓ = phase complete
← current = active phase
(nothing) = pending phase
```

Example calculation for 50% progress:
- 50 / 8.33 = 6 filled blocks
- Add ▓▓ for "in progress" visual
- Fill remaining with ░

### Step 5: Handle Failures

When a task fails or produces inadequate results:

1. **Diagnose** — What went wrong? Missing context? Ambiguous spec?
2. **Fix context** — Add missing information to the delegation prompt
3. **Re-delegate** — Send the task again with improved context
4. **Escalate** — If re-delegation fails, use AskUserQuestion:

```
Task {ID} ({Title}) failed after {N} attempts.

Issue: {What went wrong}

Options:
1. Try again with adjusted instructions
2. Skip this task and continue
3. Pause orchestration — I'll handle this manually
4. Modify the spec — This task needs rethinking

What should we do? (1/2/3/4)
```

### Step 6: Phase Transitions

Between phases (in phase-by-phase mode):

```
Phase {N} complete:
  - Task {ID}: {Title} [done]
  - Task {ID}: {Title} [done]

Phase {N+1} is ready:
  - Task {ID}: {Title} — depends on [{completed dependencies}]
  - Task {ID}: {Title} — depends on [{completed dependencies}]

Proceed to Phase {N+1}? (yes / pause / adjust)
```

### Step 7: Final Verification

After all phases complete:

1. Run the full test suite if available
2. Check all acceptance criteria across all tasks
3. Verify standards compliance for the complete feature
4. Update `progress.md` with final status

Use AskUserQuestion for the final report:

```
Orchestration complete: {Feature Name}

Results:
  - {total} tasks executed
  - {passed} passed verification
  - {failed} required intervention
  - {skipped} skipped

All acceptance criteria met: {yes/no}

Files created/modified:
  - {list of affected files}

Next steps:
  1. Review the implementation
  2. Run full test suite
  3. Create a pull request
  4. Run /shape-spec for the next feature

Would you like me to do anything else with this feature?
```

### Step 8: Archive

After confirmation, update the spec folder status:

```markdown
<!-- Add to top of spec.md -->
**Status:** Implemented
**Completed:** {date}
**Tasks:** {completed}/{total}
```

## Delegation Prompt Template

When delegating via the Task tool, use this template:

```
You are working on the "{feature-name}" feature for this project.

## Your Task

{Task title and full description}

## Context

This task is part of a larger feature. Here's what you need to know:

### Spec Summary
{Relevant excerpt from spec.md — not the whole thing}

### What's Already Done
{List of completed tasks that this one depends on}

### Standards
{Full content of relevant standards — inject them, don't just reference}

## Acceptance Criteria

You MUST satisfy all of these:
{Checkboxes from tasks.md}

## Files

Create or modify these files:
{File list with descriptions}

## Constraints

- Follow the project's existing patterns
- Don't modify files outside your task scope
- If you're unsure about something, flag it rather than guessing
```

## Agent Mapping

The orchestration.yml maps abstract agent types to your actual agents.
All 9 agents are available in `.claude/agents/`:

| Abstract Type | Default Agent | Strengths | When to Override |
|---------------|---------------|-----------|-----------------|
| backend | builder | Code implementation, bug fixes | - |
| frontend | builder | UI implementation, state | - |
| testing | builder | Test writing, coverage | - |
| database | builder | Schema, models, queries | - |
| security | security | OWASP audits, auth review | Implementation needed -> builder |
| infrastructure | devops | CI/CD, Docker, K8s, IaC | - |
| ci_cd | devops | Pipelines, workflows | - |
| architecture | architect | ADRs, design reviews | - |
| documentation | researcher | Analysis, reports | - |
| review | architect | API/design review | Security review -> security |
| explanation | explainer | Walkthroughs, concept help | - |

## Quality Gates

**MANDATORY:** After each phase transition, run quality checks as defined in `workflow/orchestration.yml` under `quality_gates`.

### Security Review Gate (after API/Auth phases)

Delegate a review task to the **security** agent:

```
You are reviewing the "{feature-name}" implementation for security concerns.

## Review Scope
{List of files created/modified in the completed phase}

## Checks Required
- [ ] Input validation on all user-facing endpoints
- [ ] Authentication/authorization enforced correctly
- [ ] No secrets or PII in code/logs
- [ ] GDPR-compliant data handling
- [ ] OWASP Top 10 basics covered

## Standards
{Inject relevant standards content}

Report findings as: PASS (no issues), WARN (minor concerns), or BLOCK (must fix before proceeding).
```

### Architecture Review Gate (after major design phases)

Delegate a review task to the **architect** agent:

```
You are reviewing the "{feature-name}" implementation for architectural consistency.

## Review Scope
{List of files created/modified in the completed phase}

## Checks Required
- [ ] Follows established patterns from architecture.md
- [ ] API consistency with existing endpoints
- [ ] No unnecessary dependencies introduced
- [ ] Naming conventions followed
- [ ] Component boundaries respected

## Standards
{Inject relevant standards content}

Report findings as: PASS (consistent), WARN (minor deviations), or BLOCK (architectural violation).
```

### Gate Enforcement

- **PASS:** Proceed to next phase
- **WARN:** Log in progress.md, proceed with caution
- **BLOCK:** Stop execution, report to user for decision

## Standards Injection Reference

Based on `workflow/orchestration.yml` domain mapping, inject these standards per task type:

| Task Domain | Standards to Inject (from workflow/standards/) |
|-------------|------------------------------------------------|
| backend | global/tech-stack, global/naming, api/response-format, api/error-handling |
| frontend | global/tech-stack, global/naming, frontend/components |
| database | global/tech-stack, global/naming, database/migrations |
| testing | global/tech-stack, testing/coverage |
| devops | devops/ci-cd, devops/containerization, devops/infrastructure |
| security | global/tech-stack, global/naming |

**Always inject:** `global/tech-stack` (regardless of task type)

**Method:** Read the actual file content from `workflow/standards/{domain}/{file}.md` and paste it into the delegation prompt. Delegated agents cannot read file references.

## Tips

- **Start with phase-by-phase mode** until you trust the workflow
- **Inject standards content, not references** — Delegated agents can't read file references
- **Keep delegation prompts focused** — Don't dump the entire spec into every task
- **Track issues in progress.md** — Creates an audit trail for future reference
- **Parallelize within phases** — Tasks in the same phase have no mutual dependencies
- **Verify before proceeding** — A bad foundation cascades into all subsequent phases
