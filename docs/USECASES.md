# CWE Use Cases

Real-world examples showing CWE v0.4.0a in action.

## Table of Contents

- [Interactive Menus](#interactive-menus)
- [Web Application Development](#web-application-development)
- [API Development](#api-development)
- [Bug Investigation](#bug-investigation)
- [Security Audit](#security-audit)
- [DevOps & Deployment](#devops--deployment)
- [Code Refactoring](#code-refactoring)
- [Documentation](#documentation)
- [Ideation & Planning](#ideation--planning)

---

## Interactive Menus

### Guided Agent Selection

**Scenario**: You want to do something but aren't sure which agent to use.

**Conversation**:
```
User: /cwe:builder

CWE: What type of work?
  1. Fix a bug
  2. Implement feature
  3. Refactor code
  4. Write tests
  (Other) - type your own

User: 1

CWE: How would you describe the bug?
  1. Error/Exception - Code throws an error
  2. Wrong behavior - Works but incorrect result
  3. Performance issue - Too slow
  4. UI/Display issue - Visual problem

User: 2

CWE: Describe what needs to be done:
  1. Show me the code first - Explore before deciding
  2. I'll describe it - (type via Other)

User: Other → "The login form accepts empty passwords"

CWE: [Delegates to builder + systematic-debugging]
```

### All Commands Support Interactive Mode

| Command | First Menu |
|---------|------------|
| `/cwe:builder` | Task type (fix/implement/refactor/test) |
| `/cwe:architect` | Design type (system/API/data/ADR) |
| `/cwe:devops` | Operation (container/CI/deploy/release) |
| `/cwe:security` | Audit type (full/scan/specific/compliance) |
| `/cwe:quality` | QA type (tests/coverage/review/metrics) |
| `/cwe:innovator` | Action (review/brainstorm/backlog) |
| `/cwe:ask` | Topic (code/architecture/idea) |
| `/cwe:explainer` | Explain (walkthrough/concept/error) |
| `/cwe:researcher` | Research (analyze/document/compare) |
| `/cwe:guide` | Improve (workflow/standards/efficiency) |

**Tip**: Providing arguments skips the menus:
```
/cwe:builder fix the login validation  # Direct, no menus
/cwe:builder                            # Interactive menus
```

---

## Web Application Development

### Building a User Dashboard

**Scenario**: You need to build a user dashboard with profile info, activity feed, and settings.

**Conversation**:
```
User: Build a user dashboard with profile info, activity feed, and settings

CWE: [Delegates to builder + frontend-design]

Builder Agent:
- Creates dashboard component structure
- Implements responsive layout
- Adds profile card, activity feed, settings panel
- Uses project's design system
- Writes component tests

Result: Dashboard implemented with tests, following project conventions
```

### Full-Stack Feature

**Scenario**: Add a comment system to a blog.

**Conversation**:
```
User: I want to add comments to blog posts

CWE: [Starts guided workflow]
- Helps create spec in workflow/specs/comments/spec.md
- Breaks into tasks: API, database, UI, notifications

User: Design the database schema for comments

CWE: [Delegates to architect]
- Creates ADR for comment schema
- Considers threading, soft deletes, moderation

User: Implement the comments API

CWE: [Delegates to builder + TDD]
- Writes tests first
- Implements CRUD endpoints
- Follows API standards

User: Build the comment UI component

CWE: [Delegates to builder + frontend-design]
- Creates CommentList, CommentForm components
- Implements real-time updates
- Adds loading states and error handling
```

---

## API Development

### RESTful API Design

**Scenario**: Design and implement a products API.

**Conversation**:
```
User: Design a REST API for product management

CWE: [Delegates to architect]

Architect Agent:
## API Review: Products API

### Endpoints
- GET /api/v1/products
- GET /api/v1/products/:id
- POST /api/v1/products
- PUT /api/v1/products/:id
- DELETE /api/v1/products/:id

### Consistency Check
- Naming conventions: PASS
- Error handling: PASS
- Versioning: PASS

### ADR-001: Product API Structure
[Full ADR with decision rationale]
```

**Follow-up**:
```
User: Implement the products API

CWE: [Delegates to builder + TDD]
- Writes integration tests
- Implements endpoints
- Adds validation and error handling
- Follows API standards from spec
```

---

## Bug Investigation

### Debugging a Production Issue

**Scenario**: Users report 500 errors on checkout.

**Conversation**:
```
User: Users are getting 500 errors on checkout, please investigate

CWE: [Delegates to builder + systematic-debugging]

Builder Agent:
## Bug Report: Checkout 500 Error

### Symptoms
- 500 errors on POST /api/checkout
- Intermittent, ~15% of requests

### Investigation
1. Hypothesis: Payment gateway timeout
   - Test: Check gateway response times
   - Result: Confirmed - avg 8s, timeout at 5s

### Root Cause
Payment gateway timeout set to 5s, gateway sometimes responds in 6-8s

### Fix Applied
- Increased timeout to 15s
- Added retry logic with exponential backoff
- Added circuit breaker pattern

### Prevention
- Added monitoring alert for gateway latency
- Added integration test for timeout scenarios

### Regression Test
tests/integration/checkout.test.ts:45-72
```

---

## Security Audit

### OWASP Security Review

**Scenario**: Security audit before launch.

**Conversation**:
```
User: Audit the security of our authentication system

CWE: [Delegates to security]

Security Agent:
## Security Audit: Authentication

**Framework:** OWASP Top 10 (2021)

### Executive Summary
- Critical: 0
- High: 1
- Medium: 2
- Low: 1

### Findings

#### [HIGH] JWT Token Stored in localStorage
- **Category:** A02:2021 Cryptographic Failures
- **Location:** src/auth/storage.ts:15
- **Impact:** XSS attacks can steal tokens
- **Remediation:** Use httpOnly cookies instead

#### [MEDIUM] No Rate Limiting on Login
- **Category:** A07:2021 Identification and Authentication Failures
- **Location:** src/api/auth.ts:42
- **Remediation:** Add rate limiting (max 5 attempts/minute)

### GDPR Compliance Check
| Requirement | Status |
|-------------|--------|
| Data minimization | PASS |
| Encryption at rest | PASS |
| Right to erasure | FAIL - Need endpoint |

### Recommendations Priority
1. [Immediate] Move JWT to httpOnly cookies
2. [This week] Add rate limiting
3. [This sprint] Implement data deletion endpoint
```

---

## DevOps & Deployment

### Docker Setup

**Scenario**: Containerize the application.

**Conversation**:
```
User: Set up Docker for this Node.js application

CWE: [Delegates to devops]

DevOps Agent:
## Container: app

### Base Image
node:20-alpine (security + size optimization)

### Build Stages
1. **deps** - Install dependencies
2. **build** - Compile TypeScript
3. **production** - Minimal runtime (~150MB)

### Security
- Non-root user: YES (node:node)
- Read-only filesystem: YES
- No secrets in image: VERIFIED

### Files Created
- Dockerfile (multi-stage)
- docker-compose.yml
- .dockerignore

### Usage
docker compose up -d
docker compose logs -f app
```

### CI/CD Pipeline

**Scenario**: Set up GitHub Actions CI/CD.

**Conversation**:
```
User: Create a CI/CD pipeline with GitHub Actions

CWE: [Delegates to devops]

DevOps Agent:
## Pipeline: CI/CD

### Trigger
- Push to main/develop
- Pull requests

### Stages
1. **Lint** - ESLint + Prettier
2. **Test** - Jest with coverage
3. **Security** - Trivy scan
4. **Build** - Docker image
5. **Deploy** - Staging (develop) / Production (main)

### Files Created
- .github/workflows/ci.yml
- .github/workflows/deploy.yml

### Secrets Required
- DOCKER_REGISTRY_TOKEN
- DEPLOY_SSH_KEY
```

---

## Code Refactoring

### Simplifying Complex Code

**Scenario**: The auth middleware is too complex.

**Conversation**:
```
User: Simplify the authentication middleware, it's become hard to maintain

CWE: [Delegates to code-simplifier]

Code-Simplifier Agent:
## Refactoring: auth.middleware.ts

### Before
- 250 lines
- Cyclomatic complexity: 18
- 5 nested conditionals

### Changes
1. Extracted token validation to separate function
2. Replaced nested ifs with early returns
3. Created AuthError class for error handling
4. Split into 3 focused middlewares

### After
- 180 lines (-28%)
- Cyclomatic complexity: 8 (-56%)
- Max nesting: 2

### Files Modified
- src/middleware/auth.middleware.ts (refactored)
- src/middleware/token.validator.ts (new)
- src/errors/auth.error.ts (new)
- tests/middleware/auth.test.ts (updated)
```

---

## Documentation

### Generating API Docs

**Scenario**: Document the API endpoints.

**Conversation**:
```
User: Document all the API endpoints

CWE: [Delegates to researcher]

Researcher Agent:
## Analysis Report: API Endpoints

**Analyzed:** 2026-01-26
**Scope:** src/api/**/*.ts

### Endpoints Found

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/v1/users | List users | Admin |
| GET | /api/v1/users/:id | Get user | User |
| POST | /api/v1/auth/login | Login | None |
| POST | /api/v1/auth/refresh | Refresh token | Bearer |
...

### Generated Documentation
- docs/api/endpoints.md (created)
- docs/api/authentication.md (created)
- docs/api/errors.md (created)
```

---

## Ideation & Planning

### Brainstorming Features

**Scenario**: Exploring new feature ideas.

**Conversation**:
```
User: What if we added real-time collaboration to the editor?

CWE: [Delegates to innovator + brainstorming]

Innovator Agent:
## Brainstorm: Real-time Collaboration

### Problem Space
Users want to collaborate on documents simultaneously

### Current Approach
Single-user editing with manual save/share

### Ideas Generated

#### Idea 1: WebSocket-based OT
**Concept**: Operational Transformation via WebSockets
**Pros**: Proven technology, works offline
**Cons**: Complex conflict resolution
**Feasibility**: Medium

#### Idea 2: CRDT with Yjs
**Concept**: Conflict-free data types
**Pros**: No central server needed, handles conflicts
**Cons**: Learning curve, larger payloads
**Feasibility**: Medium

#### Idea 3: Google Docs-style
**Concept**: Real-time cursors + auto-save
**Pros**: Familiar UX
**Cons**: Requires Google-level infrastructure
**Feasibility**: Hard

### Recommendation
**Top pick**: CRDT with Yjs
**Rationale**: Best conflict handling, growing ecosystem
```

### Architecture Decision

**Scenario**: Choosing a database.

**Conversation**:
```
User: Should we use PostgreSQL or MongoDB for this project?

CWE: [Delegates to ask for discussion]

Ask Agent:
## Database Discussion

### Understanding Your Needs
Based on the codebase, you have:
- User data (structured)
- Blog posts (semi-structured)
- Analytics events (high volume)

### Considerations

**PostgreSQL**
- Pro: Strong consistency, ACID compliance
- Pro: Complex queries, joins
- Con: Requires schema migrations

**MongoDB**
- Pro: Flexible schema, fast writes
- Pro: Good for analytics data
- Con: No joins, eventual consistency

### Related Patterns
Your current ORM (Prisma) supports both.

### Next Steps
If you want a deeper analysis, use `/cwe:architect` to create an ADR.
Or use `/cwe:innovator` to explore hybrid approaches.
```

---

## Multi-Agent Workflows

### Feature Implementation with Quality Gates

**Scenario**: Full feature development with quality checks.

```
1. "Plan the notification system"
   → architect + writing-plans
   → Creates implementation plan

2. "Implement the notification service"
   → builder + TDD
   → Writes tests, implements service

3. "Check the test coverage"
   → quality
   → Reports coverage metrics

4. "Review the implementation"
   → quality + code-review
   → Provides detailed review

5. "Fix the issues from review"
   → builder
   → Addresses feedback

6. "Verify everything is complete"
   → quality + verification-before-completion
   → Final check before merge
```

This demonstrates CWE's ability to coordinate multiple agents and plugins for a complete development workflow.
