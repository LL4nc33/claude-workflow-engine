# Use Case: REST API von Idee bis Implementation

Ein vollständiger Durchlauf aller 5 Workflow-Phasen am Beispiel eines neuen `/api/tasks` Endpoints mit CRUD-Operationen.

## Szenario

Dein Team entwickelt ein Projektmanagement-Tool. Jetzt braucht ihr einen neuen REST API Endpoint `/api/tasks`, der Tasks erstellen, lesen, aktualisieren und löschen kann. Das Backend läuft auf Express.js mit PostgreSQL, das Frontend ist eine React-Applikation.

**Ausgangslage:**

- Bestehendes Projekt mit Claude Workflow Engine
- `workflow/product/` existiert bereits mit grundlegender Produktvision
- Standards für API und Testing sind definiert
- Noch keine Task-bezogene Funktionalität vorhanden

---

## Durchlauf

### Phase 1: Plan Product

```
> /workflow/plan-product
```

Falls dein Projekt noch keine `workflow/product/`-Dateien hat, erstellt diese Phase die Grundlagen. In unserem Fall existieren sie bereits, also aktualisieren wir den Tech Stack:

**Ergebnis in `workflow/product/tech-stack.md`:**

```markdown
## Backend
- Runtime: Node.js 20 LTS
- Framework: Express.js 4.x
- ORM: Prisma 5.x
- Datenbank: PostgreSQL 16
- Validierung: Zod
- Testing: Vitest + Supertest

## Frontend
- Framework: React 18
- State: Zustand
- HTTP Client: Axios
- Testing: Vitest + Testing Library
```

**Wann diese Phase überspringen:** Wenn dein Projekt bereits vollständig definierte Product-Dateien hat und sich an der Produktrichtung nichts ändert, kannst du direkt mit Phase 2 starten.

---

### Phase 2: Shape Spec

```
> /workflow/shape-spec
```

Claude fragt nach den Anforderungen für das neue Feature. Du beschreibst:

```
Du:  Ich brauche einen /api/tasks Endpoint mit CRUD.
     Tasks haben: title, description, status (open/in_progress/done),
     priority (low/medium/high), assignee_id, due_date.
     Pagination, Filtering nach Status und Assignee.
     Nur authentifizierte User dürfen zugreifen.
```

**Ergebnis in `workflow/specs/api-tasks/`:**

```
workflow/specs/api-tasks/
  references.md      # Gesammelte Anforderungen, Constraints
  questions.md       # Offene Fragen (z.B. Soft Delete vs. Hard Delete?)
```

`references.md` enthält die konsolidierten Anforderungen:

```markdown
## Anforderungen

### Funktional
- CRUD-Operationen für Tasks
- Pagination (Cursor-based, Default: 20 Items)
- Filter: status, assignee_id, priority
- Sortierung: created_at, due_date, priority

### Nicht-funktional
- Authentifizierung via JWT (Bearer Token)
- Response-Format gemäß api/response-format Standard
- Error-Handling gemäß api/error-handling Standard
- Input-Validierung mit Zod Schemas

### Constraints
- Kein Soft Delete (harte Löschung, DSGVO-konform)
- Assignee muss existierender User sein (FK Constraint)
- Title: max 200 Zeichen, required
- Description: max 5000 Zeichen, optional
```

---

### Phase 3: Write Spec

```
> /workflow/write-spec
```

Claude erstellt die technische Spezifikation basierend auf den gesammelten Anforderungen und den definierten Standards.

**Ergebnis in `workflow/specs/api-tasks/spec.md`:**

```markdown
# Spec: API Tasks Endpoint

## Endpoints

### GET /api/tasks
Query-Parameter:
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
- 400: Validierungsfehler (ungültige Eingabedaten)
- 401: Nicht authentifiziert
- 403: Nicht autorisiert (fremder Task)
- 404: Task nicht gefunden
- 500: Interner Serverfehler

## Datenmodell

Task:
  id: UUID (auto-generated)
  title: string
  description: string | null
  status: enum (open, in_progress, done)
  priority: enum (low, medium, high)
  assignee_id: UUID | null (FK -> users.id)
  created_by: UUID (FK -> users.id, aus JWT)
  created_at: timestamp
  updated_at: timestamp

## Standards-Referenz
- api/response-format: Response-Envelope
- api/error-handling: Error-Codes und -Format
- testing/coverage: Mindestabdeckung 80%
- database/migrations: Naming-Pattern
```

---

### Phase 4: Create Tasks

```
> /workflow/create-tasks
```

Claude zerlegt die Spec in implementierbare Tasks:

**Ergebnis in `workflow/specs/api-tasks/tasks.md`:**

```markdown
# Tasks: API Tasks Endpoint

## Task 1: Datenbank-Migration
Agent: debug
Standards: database/migrations
- Prisma Schema erweitern (Task Model)
- Migration erstellen und ausführen
- Seed-Daten für Development

## Task 2: Zod Validation Schemas
Agent: debug
Standards: api/error-handling
- CreateTaskSchema
- UpdateTaskSchema
- QueryTaskSchema (Filter + Pagination)

## Task 3: Task Service Layer
Agent: debug
Standards: global/naming
- TaskService Klasse
- CRUD-Methoden mit Prisma
- Cursor-based Pagination Logik
- Filter-Komposition

## Task 4: Task Router + Controller
Agent: debug
Standards: api/response-format, api/error-handling
- Express Router mit allen Endpoints
- Auth Middleware Integration
- Validation Middleware
- Error Handling

## Task 5: Integration Tests
Agent: debug
Standards: testing/coverage
- Happy-Path Tests für alle Endpoints
- Error-Case Tests (401, 403, 404)
- Pagination Tests
- Filter Tests

## Task 6: Architecture Review
Agent: architect
Standards: api/response-format, global/naming
- API-Konsistenz mit bestehenden Endpoints
- Naming-Konventionen prüfen
- Erweiterbarkeit bewerten
```

---

### Phase 5: Orchestrate Tasks

```
> /workflow/orchestrate-tasks
```

Der Orchestrator delegiert die Tasks an die spezialisierten Agenten. Die Reihenfolge ergibt sich aus den Abhängigkeiten.

**Durchlauf:**

**Task 1 - Migration (debug Agent):**

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

**Task 2 - Validation Schemas (debug Agent):**

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

**Task 4 - Router (debug Agent):**

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

**Task 5 - Tests (debug Agent):**

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

  it("gibt 401 ohne Token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("gibt paginierte Tasks zurück", async () => {
    const res = await request(app)
      .get("/api/tasks?limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toHaveProperty("has_more");
  });

  it("filtert nach Status", async () => {
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

  it("erstellt einen neuen Task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Neuer Task", priority: "high" });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Neuer Task");
    expect(res.body.data.priority).toBe("high");
    expect(res.body.data.status).toBe("open");
  });

  it("gibt 400 bei fehlendem Title", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Ohne Titel" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```

**Task 6 - Architecture Review (architect Agent):**

Der Architect Agent prüft die Implementation auf Konsistenz:

```markdown
## Review-Ergebnis

### Positiv
- Response-Format konsistent mit api/response-format Standard
- Error-Handling folgt api/error-handling Standard
- Naming folgt global/naming Konventionen
- Cursor-based Pagination skaliert besser als Offset-based

### Empfehlungen
- Rate Limiting für POST/PUT/DELETE Endpoints hinzufügen
- OpenAPI/Swagger-Dokumentation generieren
- Bulk-Delete Endpoint für spätere Phase vormerken
```

---

## Ergebnis

Nach Abschluss aller Phasen hast du:

| Artefakt | Pfad |
|----------|------|
| Produktdokumentation | `workflow/product/tech-stack.md` (aktualisiert) |
| Feature-Spezifikation | `workflow/specs/api-tasks/spec.md` |
| Implementierte Migration | `prisma/schema.prisma` |
| Validation Schemas | `src/schemas/task.schema.ts` |
| Service Layer | `src/services/task.service.ts` |
| Router + Controller | `src/routes/task.router.ts` |
| Integration Tests | `tests/integration/tasks.test.ts` |
| Architecture Review | `workflow/specs/api-tasks/review.md` |

---

## Variationen

### Minimaler Durchlauf

Wenn du nur einen einfachen Endpoint ohne komplexe Anforderungen brauchst, kannst du Phase 2 (Shape Spec) verkürzen, indem du alle Anforderungen direkt in der Konversation beschreibst statt sie in separaten Dokumenten zu sammeln.

### Mehrere Features parallel

Bei größeren Releases kannst du mehrere Specs parallel erstellen (Phase 2-3), dann die Tasks zusammen orchestrieren. Der Orchestrator erkennt Abhängigkeiten zwischen Features und ordnet die Ausführung entsprechend.

### Ohne Frontend

Wenn du nur die API ohne Frontend brauchst, entfällt der Frontend-Task in Phase 4. Der Orchestrator delegiert ausschließlich an den Debug-Agent für Backend-Arbeit und den Architect-Agent für das Review.

### Mit Security Review

Für sicherheitskritische APIs (z.B. mit personenbezogenen Daten) füge einen zusätzlichen Task für den Security-Agent hinzu:

```markdown
## Task 7: Security Audit
Agent: security
- OWASP Top 10 Check
- Input Sanitization Review
- Authorization-Logik prüfen
```

---

## Verwandte Dokumentation

- [Workflow-Phasen im Detail](../workflow.md)
- [Agenten und ihre Rollen](../agenten.md)
- [Standards-Referenz](../standards.md)
- [CLI-Befehle](../cli.md)
