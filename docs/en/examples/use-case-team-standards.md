# Use Case: Establishing and Enforcing Team Standards

Defining, registering, and integrating unified coding standards for a 4-person team into the workflow.

## Scenario

Your team (4 developers) is working on a SaaS platform. Currently everyone has their own style: different error handling patterns, inconsistent component naming, variable test coverage. Code reviews take forever because style discussions keep flaring up.

**Goal:** Define binding standards that are automatically followed by agents during code generation. No more style discussions in reviews -- the standards are the single source of truth.

**Team:**

- Anna (Tech Lead, Backend)
- Ben (Fullstack)
- Clara (Frontend)
- David (Backend, DevOps)

---

## Walkthrough

### Step 1: Understand Existing Standards

The Workflow Engine ships with standard templates in 7 domains:

```bash
workflow status . --standards
```

```
Standards Registry (workflow/standards/index.yml):

  global/tech-stack.md       - Framework versions and tooling
  global/naming.md           - Naming conventions
  api/response-format.md     - API response envelope
  api/error-handling.md      - Error codes and format
  database/migrations.md     - Migration patterns
  devops/ci-cd.md            - Pipeline conventions
  devops/containerization.md - Docker patterns
  devops/infrastructure.md   - IaC conventions
  frontend/components.md     - Component structure
  testing/coverage.md        - Coverage targets
  agents/agent-conventions.md - Agent definition format

Total: 11 standards in 7 domains
Custom: 0 (all defaults)
```

### Step 2: Identify Team Needs

In a team meeting you define three areas that most urgently need standards:

1. **API Error Handling** -- Everyone does it differently, clients cannot rely on a consistent format
2. **Component Naming** -- Frontend components are named `UserCard`, `cardUser`, or `user-card-component` interchangeably
3. **Test Coverage** -- Ranges from 20% to 90%, no unified minimum

The first two require modifications to existing standards. For specific team rules you create a new domain.

### Step 3: Create a Custom Domain

For team-specific standards that go beyond the templates:

**Create directory:**

```
workflow/standards/
  team/                    # New domain
    code-review.md         # Review guidelines
    git-workflow.md        # Branch/commit conventions
```

**`workflow/standards/team/code-review.md`:**

```markdown
# Code Review Standard

## Review Obligations
- Every PR requires at least 1 approval
- PRs over 400 lines must be split
- Self-review before PR creation (go through checklist)

## Review Focus (in this order)
1. Correctness: Does the code do what it is supposed to?
2. Security: Are there obvious vulnerabilities?
3. Tests: Are critical paths covered?
4. Readability: Can you understand the code without explanation?
5. Performance: Only for obvious problems

## What is NOT Discussed in Reviews
- Formatting (handled by the formatter)
- Naming style (handled by the naming standard)
- Import order (handled by the linter)

## Response Times
- PRs under 100 lines: Review within 4 hours
- PRs 100-400 lines: Review within 1 business day
- Urgent fixes (label: hotfix): Review within 1 hour
```

**`workflow/standards/team/git-workflow.md`:**

```markdown
# Git Workflow Standard

## Branch Naming
- Feature: feature/TICKET-123-short-description
- Bugfix: fix/TICKET-456-what-was-fixed
- Hotfix: hotfix/TICKET-789-critical-fix
- Release: release/v1.2.0

## Commit Messages
Format: type(scope): description

Types: feat, fix, refactor, test, docs, chore, ci
Scope: api, frontend, db, infra, auth (optional)

Examples:
- feat(api): add pagination to /users endpoint
- fix(auth): handle expired refresh tokens
- test(api): add integration tests for orders

## Branch Rules
- main: Always deployable, only via PR
- develop: Integration branch, PRs from feature branches
- Feature branches: Short-lived (max 3 days), then PR or split
```

### Step 4: Customize Existing Standards

**`workflow/standards/api/error-handling.md` -- Extended with team specifics:**

```markdown
# Error Handling Standard

## Error Response Format (binding)

Every error response follows this schema:

{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": null,
    "request_id": "req_a1b2c3d4"
  }
}

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Machine-readable error code (SCREAMING_SNAKE_CASE) |
| message | string | Yes | Human-readable description (German or English depending on Accept-Language) |
| details | object/null | No | Additional information (e.g. validation errors per field) |
| request_id | string | Yes | Unique request ID for log correlation |

### Error Code Naming Convention

Format: DOMAIN_ACTION_REASON

Examples:
- AUTH_LOGIN_INVALID_CREDENTIALS
- USER_CREATE_EMAIL_EXISTS
- ORDER_PAYMENT_INSUFFICIENT_FUNDS
- VALIDATION_FIELD_REQUIRED

### Validation Errors (Details Format)

{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The input data is invalid",
    "details": {
      "fields": {
        "email": ["Must be a valid email address"],
        "password": ["At least 8 characters", "At least one number"]
      }
    },
    "request_id": "req_x9y8z7"
  }
}

### HTTP Status Mapping

| Status | When | Example Code |
|--------|------|--------------|
| 400 | Syntactically invalid input | VALIDATION_FAILED |
| 401 | Not authenticated | AUTH_TOKEN_MISSING |
| 403 | Authenticated but not authorized | AUTH_INSUFFICIENT_PERMISSIONS |
| 404 | Resource does not exist | RESOURCE_NOT_FOUND |
| 409 | Conflict state | USER_EMAIL_ALREADY_EXISTS |
| 422 | Semantically invalid | ORDER_AMOUNT_NEGATIVE |
| 429 | Rate limit exceeded | RATE_LIMIT_EXCEEDED |
| 500 | Internal error | INTERNAL_SERVER_ERROR |

### Implementation (Express Middleware)

// src/middleware/error-handler.ts
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";

  // 5xx errors: Do not leak details to client
  const message = statusCode >= 500
    ? "An internal error occurred"
    : err.message;

  const details = statusCode < 500 ? err.details : null;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      request_id: req.id,
    },
  });

  // Logging
  if (statusCode >= 500) {
    logger.error({ err, requestId: req.id }, "Internal server error");
  } else {
    logger.warn({ code, requestId: req.id }, "Client error");
  }
}

### Rules
- NEVER send stack traces to the client
- NEVER include internal IDs or database details in error messages
- ALWAYS log the request ID (for support inquiries)
- NEVER include PII in error messages (GDPR)
```

**`workflow/standards/frontend/components.md` -- Extended with team specifics:**

```markdown
# Component Naming Standard

## File Naming

All component files use PascalCase:

  src/components/
    UserCard.tsx           (not: userCard.tsx, user-card.tsx)
    OrderList.tsx          (not: orderList.tsx, order_list.tsx)
    PaymentForm.tsx

## Component Naming Pattern

Format: [Domain][Element][Variant]

Examples:
- UserCard          (Domain: User, Element: Card)
- UserCardSkeleton  (Domain: User, Element: Card, Variant: Skeleton)
- OrderListItem     (Domain: Order, Element: ListItem)
- OrderListEmpty    (Domain: Order, Element: List, Variant: Empty)
- PaymentFormStep   (Domain: Payment, Element: Form, Variant: Step)

## Directory Structure

For simple components (1 file):
  src/components/UserCard.tsx

For complex components (multiple files):
  src/components/UserCard/
    index.tsx              # Re-export
    UserCard.tsx           # Main component
    UserCard.test.tsx      # Tests
    UserCard.stories.tsx   # Storybook (optional)
    useUserCard.ts         # Component-specific hook (optional)

## Prop Naming

- Boolean props: is/has/can/should prefix
    isLoading, hasError, canEdit, shouldAutoFocus

- Handler props: on + verb
    onClick, onSubmit, onChange, onUserSelect

- Render props: render + element
    renderHeader, renderFooter, renderEmptyState

- Data props: noun (no prefix)
    user, orders, selectedItem

## Export Rules

- Named exports (no default export)
- Re-export via index.ts per feature directory
- Export types separately: export type { UserCardProps }

## Example

// src/components/UserCard/UserCard.tsx
import type { User } from "@/types";

export interface UserCardProps {
  user: User;
  isCompact?: boolean;
  onSelect?: (userId: string) => void;
}

export function UserCard({ user, isCompact = false, onSelect }: UserCardProps) {
  return (
    <div className={isCompact ? "p-2" : "p-4"}>
      <h3>{user.name}</h3>
      {onSelect && (
        <button onClick={() => onSelect(user.id)}>
          Select
        </button>
      )}
    </div>
  );
}

// src/components/UserCard/index.ts
export { UserCard } from "./UserCard";
export type { UserCardProps } from "./UserCard";
```

**`workflow/standards/testing/coverage.md` -- Extended with team specifics:**

```markdown
# Test Coverage Standard

## Minimum Coverage

| Area | Line Coverage | Branch Coverage | Exceptions |
|------|--------------|----------------|------------|
| Services (business logic) | 90% | 85% | - |
| Controllers/Routes | 80% | 75% | - |
| Utils/Helpers | 95% | 90% | - |
| Frontend components | 70% | 60% | Purely visual components |
| E2E critical paths | - | - | All happy paths covered |

## Test Naming

Format: [Unit under test] + [Scenario] + [Expected result]

Examples:
- "UserService.create creates user with valid data"
- "UserService.create throws error on duplicate email"
- "OrderController.getById returns 404 for unknown ID"

## Test Structure

describe("[Class/Module]", () => {
  describe("[Method]", () => {
    it("[Scenario] -> [Expected result]", () => {
      // Arrange
      // Act
      // Assert
    });
  });
});

## What MUST Be Tested

- Every API endpoint (happy path + most important error cases)
- Every business logic method
- Every validation rule
- Auth/authz logic (positive and negative)
- Edge cases: empty lists, null values, boundary values

## What CAN Be Skipped

- Purely decorative frontend components (styling only, no logic)
- Auto-generated code (Prisma Client, GraphQL types)
- Configuration files
- One-off scripts (migrations, seeds)

## Test Types and Responsibility

| Type | Who Writes | When | Where |
|------|-----------|------|-------|
| Unit tests | Feature developer | With the feature | tests/unit/ |
| Integration tests | Feature developer | With the feature | tests/integration/ |
| E2E tests | Team (rotating) | 2-3 new per sprint | tests/e2e/ |
| Performance tests | David (DevOps) | Before major releases | tests/performance/ |

## CI Integration

- Tests run on every push
- Coverage report is posted as a PR comment
- PR is blocked if coverage drops below minimum
- Coverage trend is discussed weekly in the team meeting

## Configuration (vitest.config.ts)

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/generated/**",
        "**/node_modules/**",
      ],
    },
  },
});
```

### Step 5: Register Standards in the Registry

Extend `workflow/standards/index.yml` with the new domain:

```yaml
# workflow/standards/index.yml
version: "1.0"
domains:
  global:
    standards:
      - name: tech-stack
        file: global/tech-stack.md
        description: Framework versions and tooling
      - name: naming
        file: global/naming.md
        description: Naming conventions

  api:
    standards:
      - name: response-format
        file: api/response-format.md
        description: API response envelope
      - name: error-handling
        file: api/error-handling.md
        description: Error codes and format

  database:
    standards:
      - name: migrations
        file: database/migrations.md
        description: Migration patterns

  devops:
    standards:
      - name: ci-cd
        file: devops/ci-cd.md
        description: Pipeline conventions
      - name: containerization
        file: devops/containerization.md
        description: Docker patterns
      - name: infrastructure
        file: devops/infrastructure.md
        description: IaC conventions

  frontend:
    standards:
      - name: components
        file: frontend/components.md
        description: Component structure and naming

  testing:
    standards:
      - name: coverage
        file: testing/coverage.md
        description: Coverage targets and test structure

  agents:
    standards:
      - name: agent-conventions
        file: agents/agent-conventions.md
        description: Agent definition format

  # New team domain
  team:
    standards:
      - name: code-review
        file: team/code-review.md
        description: Review process and guidelines
      - name: git-workflow
        file: team/git-workflow.md
        description: Branch and commit conventions
```

### Step 6: Verify Standards Injection in Workflows

When you now create a task, the relevant standards are automatically injected:

```
> /workflow/create-tasks
```

```markdown
## Task: New API Endpoint POST /api/orders
Agent: builder
Standards:
  - api/response-format    # Follow response envelope
  - api/error-handling     # Error codes per convention
  - testing/coverage       # Meet minimum coverage
  - team/git-workflow      # Name branch per convention
```

The builder agent receives these standards as context and implements accordingly:

- Error responses in the defined format
- Error codes following the DOMAIN_ACTION_REASON pattern
- Tests meeting the defined minimum coverage
- Commit messages in type(scope): description format

---

## How Standards Are Enforced

### Automatically (by Agents)

When agents generate code, they follow the injected standards. The architect agent checks compliance during reviews.

### Manually (through Team Processes)

Standards do not replace CI checks. Augment your pipeline:

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: pnpm lint  # ESLint rules complement the standards

- name: Type Check
  run: pnpm typecheck

- name: Test with Coverage
  run: pnpm test -- --coverage
  # Vitest thresholds from the coverage standard

- name: Workflow Health
  run: workflow health . --exit-code
```

### On Conflicts

When a team member wants to deviate from a standard:

1. Discuss in the team (not in the PR)
2. If justified: Update the standard (do not make an exception)
3. Commit the change so everyone has the new state

---

## Result

| Artifact | Path | Content |
|----------|------|---------|
| Error Handling Standard | `workflow/standards/api/error-handling.md` | Error codes, format, middleware |
| Component Standard | `workflow/standards/frontend/components.md` | Naming, structure, props |
| Coverage Standard | `workflow/standards/testing/coverage.md` | Minimum coverage, test structure |
| Code Review Standard | `workflow/standards/team/code-review.md` | Review process |
| Git Workflow Standard | `workflow/standards/team/git-workflow.md` | Branch/commit conventions |
| Registry | `workflow/standards/index.yml` | All standards registered |

**Effect in daily work:**

- Code reviews focus on logic instead of style
- New team members understand the conventions immediately
- Agents generate consistent code
- Fewer "but we do it differently" discussions

---

## Variations

### Introducing Standards Gradually

You do not need to define all standards at once. Start with the biggest pain point (e.g. error handling) and add more standards as the team needs them.

### Deriving Standards from Existing Code

Use the researcher agent to identify patterns in existing code:

```
Researcher agent: Analyze the existing API endpoints and
identify the most common error handling pattern. Create
a standard proposal from it.
```

### Sharing Standards Across Multiple Projects

If your team has multiple projects, you can share standards as a Git submodule or package:

```bash
# Shared standards as a separate repository
git submodule add git@github.com:team/shared-standards.git workflow/standards/shared
```

Or as an npm package:

```json
{
  "devDependencies": {
    "@team/workflow-standards": "^1.0.0"
  }
}
```

### Resistance in the Team

If team members perceive standards as "bureaucracy":

- Standards should document decisions, not invent them
- If a standard has no consensus, it is not ready yet
- Standards can be changed at any time (they are code, not law)
- The benefit shows especially when onboarding new team members

---

## See Also

- [Standards in Detail](../standards.md) -- Registry, domains, format
- [Configuration](../configuration.md) -- Referencing standards in config.yml
- [Agents and Standards Injection](../agents.md) -- How agents use standards
- [How-To: Extend Standards](../how-to/extend-standards.md) -- Step-by-step guide
