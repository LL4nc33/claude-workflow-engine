# Use Case: Setting Up a New Project from Scratch

Starting a greenfield project with the Claude Workflow Engine -- from product vision to the first implemented feature.

## Scenario

You are starting a new SaaS project: a time tracking app for freelancers. No code, no repository, and no infrastructure exists yet. You want to work in a structured manner from the start and use the Claude Workflow Engine as your development framework.

**Starting point:**

- Empty project directory
- Node.js 20 LTS installed
- Idea in mind but not yet documented
- Team: 1 developer (you), with 2-3 people joining later

---

## Walkthrough

### Step 1: Install the CLI and Initialize the Project

```bash
# Create new project directory
mkdir timetrack-app && cd timetrack-app
git init

# Set up Claude Workflow Engine CLI
# (Assuming the CLI is installed globally or available as a local dependency)
workflow install . --dry-run
```

**Dry-run output:**

```
[DRY RUN] Would create the following structure:

  .claude/
    agents/
      architect.md
      ask.md
      debug.md
      devops.md
      orchestrator.md
      researcher.md
      security.md
    settings.local.json
    CLAUDE.md

  workflow/
    config.yml
    orchestration.yml
    product/          (empty, filled by plan-product)
    specs/            (empty, filled by shape-spec)
    standards/
      index.yml
      global/
        tech-stack.md
        naming.md
      api/
        response-format.md
        error-handling.md
      database/
        migrations.md
      devops/
        ci-cd.md
        containerization.md
        infrastructure.md
      frontend/
        components.md
      testing/
        coverage.md

No conflicts detected.
Proceed with installation? (--dry-run mode, no changes made)
```

Everything looks good. Now the actual installation:

```bash
workflow install .
```

```
Installation complete.
  Created: .claude/ (7 agents, settings, CLAUDE.md)
  Created: workflow/ (config, standards, product/, specs/)
  Run 'workflow health .' to verify the installation.
```

**Health check:**

```bash
workflow health .
```

```
Health Check Results:
  [OK] .claude/agents/ - 7 agent files present
  [OK] .claude/CLAUDE.md - Project instructions present
  [OK] workflow/config.yml - Valid configuration
  [OK] workflow/standards/index.yml - 11 standards registered
  [OK] workflow/product/ - Directory exists (empty, run plan-product)
  [OK] workflow/specs/ - Directory exists (empty, run shape-spec)

Status: HEALTHY (6/6 checks passed)
```

---

### Step 2: Define the Product Vision (Phase 1)

```
> /workflow/plan-product
```

**Interaction with Claude:**

```
Claude: What problem does this product solve?

You:    Freelancers waste time on manual time tracking.
        They forget entries, estimate instead of measuring, and have
        chaos at month-end when invoicing.

Claude: Who is this product for?

You:    Solo freelancers and small agencies (2-5 people) in the
        DACH region. Technically savvy but not developers.

Claude: What is the unique solution?

You:    Automatic time detection based on calendar events and
        project assignment. One-click export for invoices.
        Privacy-first: All data local or in EU cloud.
```

**Result in `workflow/product/`:**

`workflow/product/mission.md`:

```markdown
# Mission

## Problem
Freelancers and small teams waste productive time on manual
time tracking. Missing or inaccurate entries lead to
revenue losses during invoicing.

## Target Users
- Solo freelancers in the DACH region
- Small agencies (2-5 people)
- Technically savvy but not developers

## Unique Solution
Automatic time detection based on calendar integration
with a privacy-first approach (EU data residency, local processing).
```

`workflow/product/roadmap.md`:

```markdown
# Roadmap

## MVP (Phase 1)
- Manual time tracking (start/stop timer)
- Project and client management
- Daily/weekly/monthly view
- CSV export for invoices

## Post-Launch (Phase 2)
- Calendar integration (Google Calendar, Outlook)
- Automatic project assignment
- PDF invoice generation
- Team functionality (invitations, shared projects)

## Future (Phase 3)
- AI-based time estimation for new projects
- Integration API (Zapier, Make)
- Mobile app (React Native)
```

`workflow/product/tech-stack.md`:

```markdown
# Tech Stack

## Backend
- Runtime: Node.js 20 LTS
- Framework: Fastify 4.x
- ORM: Prisma 5.x
- Database: PostgreSQL 16
- Auth: Lucia Auth (session-based)
- Validation: Zod

## Frontend
- Framework: SvelteKit 2.x
- Styling: Tailwind CSS 3.x
- Charts: Chart.js
- Forms: Superforms

## Infrastructure
- Hosting: Hetzner Cloud (EU)
- Containers: Docker + Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Grafana + Loki

## Development
- Package Manager: pnpm
- Monorepo: Turborepo
- Testing: Vitest + Playwright
- Linting: ESLint + Prettier
```

---

### Step 3: Customize Standards

The Workflow Engine ships with standard templates. You customize them for your project:

**Customize `workflow/standards/global/tech-stack.md`:**

```markdown
# Tech Stack Standard

## Mandatory Versions
- Node.js: 20.x LTS (no odd major versions)
- TypeScript: 5.x (strict mode enabled)
- pnpm: 8.x (no npm or yarn)

## Package Guidelines
- New dependencies: Always pin exact version
- Peer dependencies: Range allowed
- Dev dependencies: Caret (^) allowed
- No dependencies with fewer than 1000 weekly downloads
  (document exceptions)

## Monorepo Structure
packages/
  backend/        # Fastify API
  frontend/       # SvelteKit App
  shared/         # Shared types, utils
  db/             # Prisma schema + migrations
```

**Customize `workflow/standards/api/error-handling.md` (excerpt):**

```markdown
# Error Handling Standard

## HTTP Status Codes
- 200: Successful operation
- 201: Resource created
- 204: Successful, no content (DELETE)
- 400: Validation error
- 401: Not authenticated
- 403: Not authorized
- 404: Resource not found
- 409: Conflict (e.g. duplicate timer)
- 422: Semantically invalid (e.g. end before start)
- 500: Internal error

## Error Response Format
{
  "success": false,
  "error": {
    "code": "TIMER_ALREADY_RUNNING",
    "message": "A timer is already running for this project",
    "details": {}  // Optional, only for validation errors
  }
}

## Logging
- 4xx errors: Level WARN (no alerting)
- 5xx errors: Level ERROR (alerting active)
- No PII in logs (GDPR)
- Request ID in every log entry
```

---

### Step 4: Specify the First Feature (Phases 2-3)

Now you specify the first MVP feature: the timer.

```
> /workflow/shape-spec
```

```
You: I need a timer. User clicks start, selects a project,
     timer runs. User clicks stop, time entry is saved.
     Only one timer per user at a time.
```

**Result in `workflow/specs/timer/references.md`:**

```markdown
## Timer Requirements

### User Stories
- As a freelancer I want to start a timer so that my working time is tracked
- As a freelancer I want to stop the timer and receive a time entry
- As a freelancer I want to see how long the current timer has been running
- As a freelancer I want to assign the running timer to a project

### Rules
- Maximum one running timer per user
- Minimum duration: 1 minute (shorter entries are discarded)
- Timer runs even when the browser is closed (server-side)
- Timer can be edited after the fact (start/end time)

### Open Questions
- Should the timer automatically pause on inactivity (> 8h)?
- Should timer entries under 1 minute be silently discarded or shown as an error?
```

```
> /workflow/write-spec
```

**Result in `workflow/specs/timer/spec.md`** (abbreviated):

```markdown
# Spec: Timer Feature

## API Endpoints

### POST /api/timer/start
Body: { "project_id": UUID }
Response (201): { "success": true, "data": RunningTimer }
Error (409): Timer already running

### POST /api/timer/stop
Response (200): { "success": true, "data": TimeEntry }
Error (404): No running timer

### GET /api/timer/current
Response (200): { "success": true, "data": RunningTimer | null }

## Data Model

TimeEntry:
  id: UUID
  user_id: UUID (FK)
  project_id: UUID (FK)
  started_at: timestamp
  stopped_at: timestamp
  duration_minutes: integer (computed)
  note: string | null
  created_at: timestamp

RunningTimer:
  id: UUID
  user_id: UUID (FK)
  project_id: UUID (FK)
  started_at: timestamp
  elapsed_seconds: integer (computed, not persisted)
```

---

### Step 5: Create Tasks and Orchestrate (Phases 4-5)

```
> /workflow/create-tasks
```

```markdown
# Tasks: Timer Feature

## Task 1: Database Schema
Agent: debug
- TimeEntry model in Prisma
- Create migration
- Unique constraint: max 1 active timer per user

## Task 2: Timer Service
Agent: debug
- start(userId, projectId): Start timer
- stop(userId): Stop timer, create TimeEntry
- current(userId): Query running timer
- Validation: No duplicate timer

## Task 3: Timer Router
Agent: debug
- POST /api/timer/start
- POST /api/timer/stop
- GET /api/timer/current
- Auth middleware

## Task 4: Frontend Timer Component
Agent: debug
- Timer display with real-time counter
- Start/stop button
- Project selection dropdown
- WebSocket or polling for timer sync

## Task 5: Tests
Agent: debug
- Unit tests for timer service
- Integration tests for API
- E2E test: Start timer, wait, stop
```

```
> /workflow/orchestrate-tasks
```

The orchestrator executes the tasks in sequence and delegates to the debug agent.

---

### Bonus: DevOps Agent for CI/CD

Once the first feature is implemented, you set up CI/CD:

```markdown
## Task (manually delegated): CI/CD Pipeline
Agent: devops
Standards: devops/ci-cd, devops/containerization

Requirements:
- GitHub Actions workflow
- Steps: Lint, type-check, test, build
- Build and push Docker image (only on main)
- Deployment to Hetzner Cloud (Docker Compose)
```

**Result from the devops agent:**

`.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  build:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker Image
        run: docker build -t timetrack-app:${{ github.sha }} .
      - name: Push to Registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push timetrack-app:${{ github.sha }}
```

---

## Result

After this walkthrough you have:

| What | Where |
|------|-------|
| Git repository | Initialized with .gitignore |
| Workflow Engine | `.claude/` and `workflow/` complete |
| Product vision | `workflow/product/mission.md`, `roadmap.md`, `tech-stack.md` |
| Customized standards | `workflow/standards/` (configured for your project) |
| First feature spec | `workflow/specs/timer/spec.md` |
| Implemented feature | Timer API with tests |
| CI/CD pipeline | `.github/workflows/ci.yml` |

**Project structure:**

```
timetrack-app/
  .claude/
    agents/ (7 agents)
    CLAUDE.md
    settings.local.json
  .github/
    workflows/
      ci.yml
  workflow/
    config.yml
    orchestration.yml
    product/
      mission.md
      roadmap.md
      tech-stack.md
    specs/
      timer/
        references.md
        spec.md
        tasks.md
    standards/
      index.yml
      global/
      api/
      database/
      devops/
      frontend/
      testing/
  packages/
    backend/
      src/
        services/timer.service.ts
        routes/timer.router.ts
      tests/
    frontend/
      src/
        components/Timer.svelte
    shared/
    db/
      prisma/schema.prisma
  Dockerfile
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
```

---

## Variations

### Solo Developer vs. Team

As a solo developer you can keep the product phase leaner -- a short mission file is often sufficient. As soon as a second team member joins, the standards and documented product vision become significantly more valuable.

### Different Tech Stack

The Workflow Engine is stack-agnostic. Instead of Fastify/SvelteKit you could just as well work with Django/React or Go/HTMX. The `tech-stack.md` in the standards defines what applies to your project.

### Taking Over an Existing Team Project

If you are taking over a project from another team, still start with `plan-product`. Use the researcher agent to analyze the existing codebase and derive the product files from it:

```
Researcher agent: Analyze the codebase and create
a mission.md based on README, package.json, and
the directory structure.
```

### Microservices Instead of Monolith

For microservices you install the Workflow Engine in the root repository. Each service can have its own standards (as a subdomain), but the product vision and orchestration remain centralized.

---

## See Also

- [Workflow Phases in Detail](../workflow.md)
- [CLI Reference](../cli.md) -- install, health, status
- [Configuring Standards](../standards.md)
- [Configuration File](../configuration.md) -- config.yml options
- [How-To: Extend Standards](../how-to/extend-standards.md) -- Creating custom standards
