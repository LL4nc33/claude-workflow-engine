# Use Case: REST API from Idea to Implementation

A complete walkthrough of all 5 workflow phases using the example of a new `/api/tasks` endpoint with CRUD operations.

## Scenario

Your team is developing a project management tool. You now need a new REST API endpoint `/api/tasks` that can create, read, update, and delete tasks. The backend runs on Express.js with PostgreSQL, and the frontend is a React application.

**Starting point:**

- Existing project with Claude Workflow Engine
- `workflow/product/` already exists with a basic product vision
- Standards for API and testing are defined
- No task-related functionality exists yet

---

## Walkthrough

### Phase 1: Plan Product

```
> /workflow/plan-product
```

If your project does not yet have `workflow/product/` files, this phase creates the foundations. In our case they already exist, so we update the tech stack:

**Result in `workflow/product/tech-stack.md`:**

```markdown
## Backend
- Runtime: Node.js 20 LTS
- Framework: Express.js 4.x
- ORM: Prisma 5.x
- Database: PostgreSQL 16
- Validation: Zod
- Testing: Vitest + Supertest

## Frontend
- Framework: React 18
- State: Zustand
- HTTP Client: Axios
- Testing: Vitest + Testing Library
```

**When to skip this phase:** If your project already has fully defined product files and nothing changes about the product direction, you can start directly with Phase 2.

---

### Phase 2: Shape Spec

```
> /workflow/shape-spec
```

Claude asks about the requirements for the new feature. You describe:

```
You:  I need a /api/tasks endpoint with CRUD.
      Tasks have: title, description, status (open/in_progress/done),
      priority (low/medium/high), assignee_id, due_date.
      Pagination, filtering by status and assignee.
      Only authenticated users may access it.
```

**Result in `workflow/specs/api-tasks/`:**

```
workflow/specs/api-tasks/
  references.md      # Collected requirements, constraints
  questions.md       # Open questions (e.g. Soft Delete vs. Hard Delete?)
```

`references.md` contains the consolidated requirements:

```markdown
## Requirements

### Functional
- CRUD operations for tasks
- Pagination (cursor-based, default: 20 items)
- Filters: status, assignee_id, priority
- Sorting: created_at, due_date, priority

### Non-functional
- Authentication via JWT (Bearer Token)
- Response format per api/response-format standard
- Error handling per api/error-handling standard
- Input validation with Zod schemas

### Constraints
- No soft delete (hard deletion, GDPR-compliant)
- Assignee must be an existing user (FK constraint)
- Title: max 200 characters, required
- Description: max 5000 characters, optional
```

---

### Phase 3: Write Spec

```
> /workflow/write-spec
```

Claude creates the technical specification based on the collected requirements and defined standards.

**Result in `workflow/specs/api-tasks/spec.md`:**

```markdown
# Spec: API Tasks Endpoint

## Endpoints

### GET /api/tasks
Query parameters:
- status: open | in_progress | done
- assignee_id: UUID
- priority: low | medium | high
- cursor: string (opaque cursor)
- limit: number (1-100, default 20)
- sort: created_at | due_date | priority
- order: asc | desc (default: desc)

Response (200):
{
  "success": true,
  "data": Task[],
  "pagination": {
    "next_cursor": string | null,
    "has_more": boolean
  }
}

### GET /api/tasks/:id
Response (200):
{
  "success": true,
  "data": Task
}

### POST /api/tasks
Body:
{
  "title": string (required, max 200),
  "description": string (optional, max 5000),
  "status": "open" (default),
  "priority": "medium" (default),
  "assignee_id": UUID (optional),
  "due_date": ISO 8601 (optional)
}

Response (201):
{
  "success": true,
  "data": Task
}

### PUT /api/tasks/:id
Body: Partial<CreateTaskBody>
Response (200): { "success": true, "data": Task }

### DELETE /api/tasks/:id
Response (204): No Content

## Error Responses
- 400: Validation error (invalid input data)
- 401: Not authenticated
- 403: Not authorized (another user's task)
- 404: Task not found
- 500: Internal server error

## Data Model

Task:
  id: UUID (auto-generated)
  title: string
  description: string | null
  status: enum (open, in_progress, done)
  priority: enum (low, medium, high)
  assignee_id: UUID | null (FK -> users.id)
  created_by: UUID (FK -> users.id, from JWT)
  created_at: timestamp
  updated_at: timestamp

## Standards Reference
- api/response-format: Response envelope
- api/error-handling: Error codes and format
- testing/coverage: Minimum coverage 80%
- database/migrations: Naming pattern
```

---

### Phase 4: Create Tasks

```
> /workflow/create-tasks
```

Claude breaks the spec into implementable tasks:

**Result in `workflow/specs/api-tasks/tasks.md`:**

```markdown
# Tasks: API Tasks Endpoint

## Task 1: Database Migration
Agent: debug
Standards: database/migrations
- Extend Prisma schema (Task model)
- Create and run migration
- Seed data for development

## Task 2: Zod Validation Schemas
Agent: debug
Standards: api/error-handling
- CreateTaskSchema
- UpdateTaskSchema
- QueryTaskSchema (filter + pagination)

## Task 3: Task Service Layer
Agent: debug
Standards: global/naming
- TaskService class
- CRUD methods with Prisma
- Cursor-based pagination logic
- Filter composition

## Task 4: Task Router + Controller
Agent: debug
Standards: api/response-format, api/error-handling
- Express router with all endpoints
- Auth middleware integration
- Validation middleware
- Error handling

## Task 5: Integration Tests
Agent: debug
Standards: testing/coverage
- Happy-path tests for all endpoints
- Error-case tests (401, 403, 404)
- Pagination tests
- Filter tests

## Task 6: Architecture Review
Agent: architect
Standards: api/response-format, global/naming
- API consistency with existing endpoints
- Check naming conventions
- Evaluate extensibility
```

---

### Phase 5: Orchestrate Tasks

```
> /workflow/orchestrate-tasks
```

The orchestrator delegates the tasks to the specialized agents. The order is determined by dependencies.

**Walkthrough:**

**Task 1 - Migration (debug agent):**

```prisma
// prisma/schema.prisma
model Task {
  id          String    @id @default(uuid())
  title       String    @db.VarChar(200)
  description String?   @db.VarChar(5000)
  status      TaskStatus @default(open)
  priority    TaskPriority @default(medium)
  assigneeId  String?   @map("assignee_id")
  createdBy   String    @map("created_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  assignee    User?     @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creator     User      @relation("TaskCreator", fields: [createdBy], references: [id])

  @@map("tasks")
}

enum TaskStatus {
  open
  in_progress
  done
}

enum TaskPriority {
  low
  medium
  high
}
```

**Task 2 - Validation Schemas (debug agent):**

```typescript
// src/schemas/task.schema.ts
import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["open", "in_progress", "done"]).default("open"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const QueryTaskSchema = z.object({
  status: z.enum(["open", "in_progress", "done"]).optional(),
  assignee_id: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(["created_at", "due_date", "priority"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

**Task 4 - Router (debug agent):**

```typescript
// src/routes/task.router.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { TaskService } from "../services/task.service";
import { CreateTaskSchema, UpdateTaskSchema, QueryTaskSchema } from "../schemas/task.schema";

const router = Router();
const taskService = new TaskService();

router.use(authenticate);

router.get("/", validate(QueryTaskSchema, "query"), async (req, res, next) => {
  try {
    const result = await taskService.findAll(req.validatedQuery);
    res.json({ success: true, data: result.tasks, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const task = await taskService.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: { code: "TASK_NOT_FOUND", message: "Task not found" }
      });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

router.post("/", validate(CreateTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.create({
      ...req.validatedBody,
      created_by: req.user.id,
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", validate(UpdateTaskSchema), async (req, res, next) => {
  try {
    const task = await taskService.update(req.params.id, req.validatedBody);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await taskService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Task 5 - Tests (debug agent):**

```typescript
// tests/integration/tasks.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { createTestUser, generateToken } from "../helpers";

describe("GET /api/tasks", () => {
  let token: string;

  beforeAll(async () => {
    const user = await createTestUser();
    token = generateToken(user.id);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns paginated tasks", async () => {
    const res = await request(app)
      .get("/api/tasks?limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toHaveProperty("has_more");
  });

  it("filters by status", async () => {
    const res = await request(app)
      .get("/api/tasks?status=open")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((task: any) => {
      expect(task.status).toBe("open");
    });
  });
});

describe("POST /api/tasks", () => {
  let token: string;

  beforeAll(async () => {
    const user = await createTestUser();
    token = generateToken(user.id);
  });

  it("creates a new task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Task", priority: "high" });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("New Task");
    expect(res.body.data.priority).toBe("high");
    expect(res.body.data.status).toBe("open");
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Without title" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```

**Task 6 - Architecture Review (architect agent):**

The architect agent reviews the implementation for consistency:

```markdown
## Review Result

### Positive
- Response format consistent with api/response-format standard
- Error handling follows api/error-handling standard
- Naming follows global/naming conventions
- Cursor-based pagination scales better than offset-based

### Recommendations
- Add rate limiting for POST/PUT/DELETE endpoints
- Generate OpenAPI/Swagger documentation
- Note bulk-delete endpoint for a later phase
```

---

## Result

After completing all phases you have:

| Artifact | Path |
|----------|------|
| Product documentation | `workflow/product/tech-stack.md` (updated) |
| Feature specification | `workflow/specs/api-tasks/spec.md` |
| Implemented migration | `prisma/schema.prisma` |
| Validation schemas | `src/schemas/task.schema.ts` |
| Service layer | `src/services/task.service.ts` |
| Router + controller | `src/routes/task.router.ts` |
| Integration tests | `tests/integration/tasks.test.ts` |
| Architecture review | `workflow/specs/api-tasks/review.md` |

---

## Variations

### Minimal Walkthrough

If you only need a simple endpoint without complex requirements, you can shorten Phase 2 (Shape Spec) by describing all requirements directly in the conversation instead of collecting them in separate documents.

### Multiple Features in Parallel

For larger releases you can create multiple specs in parallel (Phases 2-3), then orchestrate the tasks together. The orchestrator detects dependencies between features and orders the execution accordingly.

### Without Frontend

If you only need the API without a frontend, the frontend task in Phase 4 is omitted. The orchestrator delegates exclusively to the debug agent for backend work and the architect agent for the review.

### With Security Review

For security-critical APIs (e.g. with personal data), add an additional task for the security agent:

```markdown
## Task 7: Security Audit
Agent: security
- OWASP Top 10 check
- Input sanitization review
- Verify authorization logic
```

---

## See Also

- [Workflow Phases in Detail](../workflow.md)
- [Agents and Their Roles](../agents.md)
- [Standards Reference](../standards.md)
- [CLI Commands](../cli.md)
