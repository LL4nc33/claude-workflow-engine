# How-To: Develop a New Feature

This guide walks you through the complete 5-phase workflow of the Claude Workflow Engine -- from the initial product idea to the finished implementation. As an example, we use "implement user authentication".

## Goal

After completing this guide, you will have:

- Documented the product vision
- Created a technical specification
- Split tasks and delegated them to specialized agents
- A fully implemented feature with tests and documentation

## Prerequisites

- Claude Workflow Engine is installed (see [CLI Installation](cli-installation.md))
- `workflow health` shows no errors
- You are in the project directory
- Claude Code is active and recognizes the slash commands

## The 5-Phase Workflow at a Glance

```
/workflow/plan-product --> /workflow/shape-spec --> /workflow/write-spec --> /workflow/create-tasks --> /workflow/orchestrate-tasks
```

| Phase | Command | Output |
|-------|---------|--------|
| 1 | `/workflow/plan-product` | `workflow/product/` |
| 2 | `/workflow/shape-spec` | `workflow/specs/{folder}/` |
| 3 | `/workflow/write-spec` | `spec.md` |
| 4 | `/workflow/create-tasks` | `tasks.md`, `orchestration.yml` |
| 5 | `/workflow/orchestrate-tasks` | `progress.md` |

---

## Phase 1: Define the Product Vision

**Command:** `/workflow/plan-product`

This phase defines the big picture of your project. It only needs to be run once per project (or when the product direction fundamentally changes).

### Execution

```
> /workflow/plan-product
```

### Interaction with Claude

```
Claude: What problem does this product solve?
You:    We need a secure login system with OAuth2 and session management
        for our SaaS platform.

Claude: Who is this product for?
You:    B2B customers managing their teams. Admins create accounts,
        employees log in.

Claude: What makes your solution unique?
You:    Multi-tenant capable with role-based access, GDPR-compliant,
        and social login for quick onboarding.

Claude: What tech stack are you using?
You:    TypeScript, Node.js with Express, PostgreSQL, React frontend.
```

### Generated Files

```
workflow/product/
  mission.md       # Problem: Secure authentication, Target: B2B teams
  roadmap.md       # MVP: Login + OAuth2, Post-Launch: MFA, SSO
  tech-stack.md    # TypeScript, Node.js, PostgreSQL, React
```

### Expected Output

```
Product documentation created in workflow/product/:
  - mission.md: Problem, target users, unique selling point
  - roadmap.md: MVP features (3), post-launch features (4)
  - tech-stack.md: 4 technologies defined
```

### Note

If you already have a product vision, you can skip this phase and manually create the files in `workflow/product/`.

---

## Phase 2: Gather Requirements (Shape Spec)

**Command:** `/workflow/shape-spec`

**Prerequisite:** Phase 1 completed (product documentation exists).

In this phase, you gather all context needed before writing the technical specification: visuals, code references, relevant standards.

### Execution

```
> /workflow/shape-spec
```

### Interaction with Claude

```
Claude: What are we building?
You:    User authentication with email/password and Google OAuth2.
        Session management via JWT with refresh tokens.

Claude: Do you have visuals as reference?
You:    No, no mockups available.

Claude: Is there similar code in this codebase?
You:    The user model in src/models/user.ts already has a schema.
        The middleware in src/middleware/auth.ts has a placeholder.

Claude: Based on what we are building, these standards could be relevant:
        1. api/response-format - API Response Envelope
        2. api/error-handling - Error Codes and GDPR-compliant Responses
        3. database/migrations - Schema Changes
        4. testing/coverage - Test Requirements
        Should I include these?
You:    Yes, all of them.
```

### Generated Files

```
workflow/specs/2026-01-23-1430-user-auth/
  shape.md         # Scope, decisions, context
  references.md    # Code references (user.ts, auth.ts)
  standards.md     # 4 relevant standards (full text)
  plan.md          # Execution plan
```

### Expected Output

```
Spec folder created: workflow/specs/2026-01-23-1430-user-auth/
  - shape.md: Scope defined, 2 code references, 4 standards
  - references.md: user.ts, auth.ts analyzed
  - standards.md: api/response-format, api/error-handling,
                  database/migrations, testing/coverage
```

---

## Phase 3: Create the Technical Specification

**Command:** `/workflow/write-spec`

**Prerequisite:** Spec folder from Phase 2 exists (with `shape.md`).

Claude transforms the gathered requirements into a complete technical specification.

### Execution

```
> /workflow/write-spec
```

### Interaction with Claude

```
Claude: I found a spec: 2026-01-23-1430-user-auth/
        Should I write the technical specification for it?
You:    Yes.

Claude: Before I write the spec, I need to clarify:
        1. Data Model: users table with email, password_hash, oauth_provider?
        2. API Design: POST /api/auth/login, POST /api/auth/register,
           POST /api/auth/refresh, DELETE /api/auth/logout?
        3. Token Strategy: JWT Access (15min) + Refresh Token (7d)?
You:    1. Yes, plus role and tenant_id columns.
        2. Yes, exactly.
        3. Access Token 30min, Refresh Token 30d.
```

### Generated File

The `spec.md` is added to the spec folder with the following structure:

```markdown
# Technical Specification: User Authentication

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

### Expected Output

```
spec.md created in workflow/specs/2026-01-23-1430-user-auth/
  - 12 sections
  - Data Model: users + sessions + oauth_tokens
  - API: 4 endpoints defined
  - Testing: Unit + Integration + E2E planned
  - 2 open questions marked
```

### Quality Gate 1: Pre-Implementation

After writing the spec, a quality gate is automatically executed:

- **Architect** checks: Architecturally sound? Dependencies identified? Tech stack aligned?
- **Security** checks: No security anti-patterns? Auth model defined? GDPR-compliant?

```
Quality Gate 1 (Pre-Implementation): PASS
  - Architect: PASS (4/4 Checks)
  - Security: PASS (4/4 Checks)
```

---

## Phase 4: Split into Tasks

**Command:** `/workflow/create-tasks`

**Prerequisite:** `spec.md` exists in the spec folder.

The specification is split into atomic, implementable tasks and assigned to the appropriate agents.

### Execution

```
> /workflow/create-tasks
```

### Interaction with Claude

```
Claude: I am analyzing the spec "User Authentication"...
        Proposed split: 10 tasks in 5 phases.

        Phase 1 - Data Layer:
          Task 1.1: DB schema and migration (S, builder)
          Task 1.2: TypeScript types and interfaces (S, builder)
        Phase 2 - Backend:
          Task 2.1: Auth service with bcrypt (M, builder)
          Task 2.2: JWT token management (M, builder)
          Task 2.3: OAuth2 Google integration (M, builder)
          Task 2.4: Auth middleware (S, builder)
        Phase 3 - API:
          Task 3.1: Auth endpoints (M, builder)
        Phase 4 - Quality:
          Task 4.1: Unit tests (M, builder)
          Task 4.2: Integration tests (M, builder)
          Task 4.3: Security review (S, security)
        Phase 5 - Docs:
          Task 5.1: API documentation (S, researcher)

        Does this work?
You:    Yes, exactly.
```

### Generated Files

```
workflow/specs/2026-01-23-1430-user-auth/
  tasks.md            # Complete task list with acceptance criteria
  orchestration.yml   # Machine-readable delegation configuration
```

### Example from tasks.md

```markdown
## Task 2.1: Auth Service

**Agent:** builder
**Size:** M (2-4 files)
**Dependencies:** Task 1.1, Task 1.2

**Description:**
Implement the AuthService with register(), login(), logout() methods.
Use bcrypt for password hashing with cost factor 12.

**Acceptance Criteria:**
- [ ] register() creates user with hashed password
- [ ] login() validates credentials and returns token pair
- [ ] logout() invalidates refresh token
- [ ] All methods throw typed errors (AUTH_001 through AUTH_005)

**Files:**
- src/services/auth.service.ts (create)
- src/types/auth.types.ts (extend)
```

### Quality Gate 2: Pre-Execution

```
Quality Gate 2 (Pre-Execution): PASS
  - Architect: PASS - Tasks cover spec requirements,
    dependencies correctly ordered
```

---

## Phase 5: Delegate Tasks to Agents

**Command:** `/workflow/orchestrate-tasks`

**Prerequisite:** `tasks.md` and `orchestration.yml` exist in the spec folder.

Main Chat delegates tasks phase by phase to the responsible agents and tracks progress.

### Execution

```
> /workflow/orchestrate-tasks
```

### Interaction with Claude

```
Claude: Spec found: 2026-01-23-1430-user-auth/
        10 tasks in 5 phases ready.
        Execution mode? (automatic / phase-by-phase / task-by-task / selective)
You:    phase-by-phase

Claude: Starting Phase 1 - Data Layer...
        > Task 1.1: DB schema delegated to builder agent...
          Standards injected: global/tech-stack, global/naming, database/migrations
        > Task 1.1: PASS - Migration created, schema valid
        > Task 1.2: TypeScript types delegated to builder agent...
        > Task 1.2: PASS - Interfaces generated, consistent with schema
        Phase 1 completed. Quality Gate: PASS
        Continue with Phase 2?
You:    Yes.

Claude: Starting Phase 2 - Backend...
        > Task 2.1: Auth service delegated to builder agent...
          Standards injected: global/tech-stack, global/naming,
                             api/response-format, api/error-handling
        > Task 2.1: PASS - AuthService implemented, 5 error codes defined
        > Task 2.2: JWT token management delegated to builder agent...
        > Task 2.2: PASS - Token generation and validation implemented
        > Task 2.3: OAuth2 integration delegated to builder agent...
        > Task 2.3: PASS - Google OAuth2 flow implemented
        > Task 2.4: Auth middleware delegated to builder agent...
        > Task 2.4: PASS - Middleware protects routes, validates tokens
        Phase 2 completed. Quality Gate: PASS
        Continue with Phase 3?
You:    Yes.
```

### Generated File: progress.md

```markdown
# Progress: User Authentication

**Started:** 2026-01-23T14:45:00Z
**Last Updated:** 2026-01-23T15:30:00Z
**Mode:** phase-by-phase
**Health:** HEALTHY

## Status

| Task | Title | Agent | Status | Duration |
|------|-------|-------|--------|----------|
| 1.1 | DB Schema | builder | PASS | 45s |
| 1.2 | TypeScript Types | builder | PASS | 30s |
| 2.1 | Auth Service | builder | PASS | 120s |
| 2.2 | JWT Management | builder | PASS | 90s |
| 2.3 | OAuth2 Google | builder | PASS | 150s |
| 2.4 | Auth Middleware | builder | PASS | 60s |
| 3.1 | Auth Endpoints | builder | PASS | 100s |
| 4.1 | Unit Tests | builder | PASS | 180s |
| 4.2 | Integration Tests | builder | PASS | 200s |
| 4.3 | Security Review | security | PASS | 90s |
| 5.1 | API Documentation | researcher | PASS | 60s |

## Quality Gates

| Gate | Status |
|------|--------|
| Gate 1: Pre-Implementation | PASS |
| Gate 2: Pre-Execution | PASS |
| Gate 3: Post-Phase (5/5) | PASS |
| Gate 4: Final Acceptance | PASS |
```

### Quality Gate 4: Final Acceptance

At the end, the final checks run automatically:

- **Security Agent:** No new vulnerabilities, secrets not exposed, GDPR-compliant
- **Architect Agent:** Implementation matches spec, no architectural drift
- **User:** Acceptance criteria met

---

## Result

After completing all 5 phases, you have:

| Artifact | Path |
|----------|------|
| Product vision | `workflow/product/mission.md`, `roadmap.md`, `tech-stack.md` |
| Specification | `workflow/specs/2026-01-23-1430-user-auth/spec.md` |
| Task breakdown | `workflow/specs/2026-01-23-1430-user-auth/tasks.md` |
| Progress log | `workflow/specs/2026-01-23-1430-user-auth/progress.md` |
| Implementation | `src/services/`, `src/middleware/`, `src/routes/` |
| Tests | `tests/unit/auth/`, `tests/integration/auth/` |
| API docs | `docs/api/auth.md` |

## Next Steps

- **Another feature?** Start again at Phase 2 (`/workflow/shape-spec`) -- the product vision persists.
- **Adjust standards?** See [Extend Standards](extend-standards.md).
- **Custom agents?** See [Create a Custom Agent](create-custom-agent.md).
- **Skip phases?** You can enter at any later phase as long as the prerequisites are met.

## Tips

- Use the `phase-by-phase` mode the first time to understand the flow
- Phase 2 (shape-spec) is the most valuable phase for avoiding scope creep
- The `progress.md` serves as an audit trail -- check it when something goes wrong
- Every phase is idempotent: re-running it overwrites previous results
- Standards are injected as full text in delegation prompts (agents cannot read file references)

## See Also

- [Workflow Reference](../workflow.md) -- Detailed description of each phase
- [Agents Overview](../agents.md) -- Which agent handles which task type
- [Standards](../standards.md) -- How standards are injected during orchestration
- [CLI Reference](../cli.md) -- All CLI commands
