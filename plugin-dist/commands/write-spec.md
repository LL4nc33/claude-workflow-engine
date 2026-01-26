---
description: Phase 3 - Technische Spezifikation erstellen
interactive: true
---

# Write Spec

Transform shaped requirements into a detailed technical specification. This command takes the output of `/shape-spec` and produces an implementation-ready technical document.

## Important Guidelines

- **Always use AskUserQuestion tool** when asking the user anything
- **Be precise** — Technical specs must be unambiguous
- **Reference standards** — Include relevant standards from `workflow/standards/`
- **Build on shape output** — Never start from scratch; always read the existing shape

## Prerequisites

A spec folder must exist from a prior `/shape-spec` run:
```
workflow/specs/{timestamp}-{feature-slug}/
├── shape.md
├── plan.md (may exist)
├── references.md
└── standards.md
```

If no spec folder exists, tell the user:
```
No shaped spec found. Run /shape-spec first to gather requirements, then run /write-spec to create the technical specification.
```

## Process

### Step 1: Locate the Spec Folder

List directories in `workflow/specs/` and identify the target spec.

**If multiple spec folders exist**, use AskUserQuestion:

```
I found multiple specs:

1. 2026-01-15-1430-user-comment-system/
2. 2026-01-20-0900-auth-refactor/
3. 2026-01-22-1100-dashboard-widgets/

Which spec should I write the technical specification for? (Pick a number)
```

**If only one spec folder exists**, confirm with the user:

```
I found one spec: {folder-name}/

Should I write the technical specification for this? (yes / no)
```

### Step 2: Read Existing Context

Read these files from the spec folder:
1. `shape.md` — Scope, decisions, context (REQUIRED)
2. `references.md` — Similar implementations studied
3. `standards.md` — Applicable standards

Also read product context:
4. `workflow/product/mission.md` — Product alignment
5. `workflow/product/architecture.md` — Architectural constraints
6. `workflow/product/roadmap.md` — Roadmap positioning

### Step 3: Identify Technical Decisions

Based on the shape and references, identify decisions that need to be made. Use AskUserQuestion:

```
Before writing the spec, I need to clarify some technical decisions:

1. **Data Model**: [Proposed approach based on shape] — Agree? (yes / alternative)
2. **API Design**: [Proposed endpoints/interfaces] — Agree? (yes / alternative)
3. **State Management**: [Proposed approach] — Agree? (yes / alternative)

(Answer each, or say "looks good" to accept all)
```

Only ask about decisions that genuinely have multiple valid approaches. Skip anything obvious from the shape/standards.

### Step 4: Draft the Technical Specification

Create `spec.md` in the spec folder with this structure:

```markdown
# Technical Specification: {Feature Name}

## Overview

**Status:** Draft
**Created:** {date}
**Spec Folder:** workflow/specs/{folder-name}/
**Shape Reference:** ./shape.md

## Summary

[1-2 sentence summary of what this spec covers]

## Technical Design

### Data Model

[Database schema, types, interfaces — whatever data structures are needed]

```[language]
// Schema/type definitions
```

### API / Interface Design

[Endpoints, function signatures, component interfaces]

```[language]
// Interface definitions with types
```

### Implementation Details

[Step-by-step implementation approach]

1. [First implementation step]
2. [Second implementation step]
3. ...

### State Management

[How state is managed — if applicable]

### Error Handling

[Error cases and how they're handled]

| Error Case | Handling | User-Facing Message |
|------------|----------|---------------------|
| [case 1]   | [how]    | [message]           |
| [case 2]   | [how]    | [message]           |

## Standards Compliance

[Which standards apply and how this spec satisfies them]

- **{standard-name}**: [How this spec complies]
- **{standard-name}**: [How this spec complies]

## Dependencies

[External dependencies, other features, services]

- [Dependency 1]: [Why needed, version]
- [Dependency 2]: [Why needed, version]

## Testing Strategy

### Unit Tests
- [Key unit test scenarios]

### Integration Tests
- [Key integration test scenarios]

### Edge Cases
- [Edge cases to test]

## Security Considerations

[Security implications — authentication, authorization, data validation]

## Performance Considerations

[Performance implications — caching, query optimization, lazy loading]

## Migration / Rollout

[How to deploy — feature flags, database migrations, backwards compatibility]

## Open Questions

[Any remaining decisions or unknowns — update as they're resolved]

- [ ] [Question 1]
- [ ] [Question 2]
```

### Step 5: Review with User

Present the draft spec summary and use AskUserQuestion:

```
I've drafted the technical specification. Key decisions:

- **Data Model**: [summary]
- **API Design**: [summary]
- **Testing**: [summary]

Review the full spec at: workflow/specs/{folder-name}/spec.md

Is this ready to proceed to task creation, or does it need adjustments?

1. Approve — Ready for /create-tasks
2. Adjust — [Tell me what to change]
3. Add detail — [Which section needs more depth?]
```

### Step 6: Save and Confirm

After approval (or adjustments), save the final `spec.md` and update `plan.md` if it exists.

Output:

```
Technical specification complete:

  workflow/specs/{folder-name}/spec.md

Spec folder now contains:
  - shape.md      (requirements & context)
  - spec.md       (technical specification) [NEW]
  - references.md (similar implementations)
  - standards.md  (applicable standards)
  - plan.md       (execution plan)

Next step: Run /create-tasks to break this spec into implementable tasks.
```

## Tips

- **Don't over-specify** — Enough detail to implement unambiguously, no more
- **Use code examples** — Show interfaces, schemas, not just describe them
- **Reference standards inline** — Don't just list them; show how they apply
- **Flag unknowns** — Open questions are better than wrong assumptions
- **Keep it updatable** — Specs evolve; structure for easy editing
