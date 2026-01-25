# How-To: Extend Standards

This guide shows you how to create new standards for the Claude Workflow Engine. Standards are the "HOW" layer in the context model -- they define conventions and patterns that agents follow during implementation.

## Goal

After completing this guide, you will have:

- Created a new standard in the appropriate domain
- Registered the standard in the index
- Configured a skill for automatic matching
- Validated and tested the standard

## Prerequisites

- Claude Workflow Engine is installed (see [CLI Installation](cli-installation.md))
- Understanding of the 3-layer context model (see [Standards Reference](../standards.md))
- A concrete pattern or convention you want to document

## The 3-Layer Context Model

```
Layer 1: Standards (HOW)     -> workflow/standards/   <-- you work here
Layer 2: Product (WHAT/WHY)  -> workflow/product/
Layer 3: Specs (WHAT NEXT)   -> workflow/specs/
```

Standards are injected into agents and determine **how** code is written. They ensure consistency across features and agents.

---

## Step 1: Identify the Domain

Standards are organized into domains. Choose the appropriate one:

| Domain | Path | For |
|--------|------|-----|
| `global/` | `workflow/standards/global/` | Cross-cutting conventions |
| `api/` | `workflow/standards/api/` | API design patterns |
| `database/` | `workflow/standards/database/` | Schema and migrations |
| `devops/` | `workflow/standards/devops/` | Infrastructure conventions |
| `frontend/` | `workflow/standards/frontend/` | UI component patterns |
| `testing/` | `workflow/standards/testing/` | Test structure and coverage |
| `agents/` | `workflow/standards/agents/` | Agent definition standards |

### Creating a New Domain

If no existing domain fits, create a new one:

```bash
mkdir -p workflow/standards/monitoring/
```

Add the domain to `workflow/config.yml` under `context_model.standards.domains`:

```yaml
context_model:
  standards:
    domains:
      - global
      - devops
      - agents
      - api
      - database
      - frontend
      - testing
      - monitoring    # New domain
```

---

## Step 2: Create the Standard File

Create a Markdown file in the appropriate domain folder.

### Example: Logging Standard

File: `workflow/standards/api/logging.md`

```markdown
# Logging

## Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| ERROR | Unexpected errors requiring intervention | DB connection lost |
| WARN | Degraded state, system still functional | Cache miss, retry |
| INFO | Business events, state changes | User created, order placed |
| DEBUG | Developer details, only active in dev | Request payload, query timing |

## Format

Structured JSON logging:

```json
{
  "timestamp": "2026-01-23T14:30:00.000Z",
  "level": "ERROR",
  "service": "auth-service",
  "message": "Token validation failed",
  "context": {
    "userId": "anonymized-hash",
    "endpoint": "/api/auth/refresh",
    "errorCode": "AUTH_003"
  },
  "traceId": "abc-123-def"
}
```

## Rules

- Always use structured logging (no `console.log("error: " + msg)`)
- Never log PII (no emails, names, or IPs in plain text)
- User IDs only as anonymized hashes
- TraceId for request correlation in every log entry
- ERROR level triggers alerts -- use sparingly
- Log retention: 30 days (GDPR-compliant)

## Anti-Patterns

- `console.log` in production code
- Returning stack traces to the client
- Password fields in builder logs
- Log level per environment instead of per configuration
```

### Writing Rules for Good Standards

Standards are injected into AI context windows. Every word costs tokens.

**Do:**

- Rule first, explanation after (if needed)
- Use code examples -- show, don't tell
- Omit the obvious
- One standard per concept
- Bullet points instead of paragraphs
- Tables for structured information

**Don't:**

- Long introductory paragraphs
- Repetition of information the code already shows
- General best practices everyone knows
- Multiple unrelated topics in one file

### Finding the Right Granularity

| Too coarse | Right | Too fine |
|------------|-------|----------|
| `backend.md` (everything) | `response-format.md` | `json-key-casing.md` |
| `quality.md` (everything) | `coverage.md` | `unit-test-naming.md` |
| `infrastructure.md` (everything) | `containerization.md` | `dockerfile-from-line.md` |

Rule of thumb: A standard should be 20-80 lines long. Shorter is usually better.

---

## Step 3: Register in the Index

Open `workflow/standards/index.yml` and add the new standard:

```yaml
api:
  response-format:
    description: API response envelope structure, pagination, status codes
    tags: [api, response, json, http, rest, status-code]
  error-handling:
    description: Error hierarchy, error codes, logging levels, GDPR-compliant error responses
    tags: [error, exception, logging, error-code, gdpr]
  logging:                                                          # NEW
    description: Structured JSON logging, log levels, GDPR-compliant log format
    tags: [logging, log-level, structured, json, tracing, gdpr]
```

### Index Rules

- Entries alphabetically within each domain
- Each entry needs `description` and `tags`
- `description`: One sentence summarizing the content
- `tags`: 4-8 keywords for intelligent matching

### Alternative: Automatic Indexing

```
> /workflow/index-standards
```

This command scans `workflow/standards/` for all `.md` files and updates the index automatically.

---

## Step 4: Create a Skill for Standards Injection

When `standards_as_claude_code_skills: true` is set in `config.yml` (default), standards are registered as Claude Code skills. For Claude to automatically apply your standard, create a skill.

### Skill Directory

```
.claude/skills/workflow/{domain}-standards/
```

### Create a New Skill

For an existing domain: Extend the existing skill.
For a new domain: Create a new directory.

Example for a new domain `monitoring`:

```bash
mkdir -p .claude/skills/workflow/monitoring-standards/
```

Create `.claude/skills/workflow/monitoring-standards/SKILL.md`:

```markdown
---
name: monitoring-standards
description: Apply monitoring and observability standards when working on logging, metrics, alerting, or tracing code.
---

When working on monitoring, logging, metrics, or observability:

@workflow/standards/monitoring/logging.md
@workflow/standards/monitoring/metrics.md
```

### Extend an Existing Skill

For a standard in an existing domain (e.g., `api/logging.md`), extend the existing skill in `.claude/skills/workflow/api-standards/SKILL.md`:

```markdown
---
name: api-standards
description: Apply API standards when working on endpoints, responses, error handling, or logging.
---

When working on API endpoints, responses, or error handling:

@workflow/standards/api/response-format.md
@workflow/standards/api/error-handling.md
@workflow/standards/api/logging.md
```

---

## Step 5: Reference in orchestration.yml

For the orchestrator to inject the standard during delegation, add it to the domain mapping.

### Standards Injection Mapping

Open `workflow/orchestration.yml` and add under `standards_injection.domain_mapping`:

```yaml
standards_injection:
  domain_mapping:
    backend:
      - global/naming
      - api/response-format
      - api/error-handling
      - api/logging              # NEW
    # ... other domains ...
```

### New Task Group (optional)

If your standard needs its own task category:

```yaml
task_groups:
  monitoring:
    primary_agent: devops
    review_agent: null
    standards: [global/tech-stack, monitoring/logging, monitoring/metrics]
    override_when: {}
```

### Respect Max Standards Limit

The configuration allows a maximum of 5 standards per task (token optimization):

```yaml
standards_injection:
  optimization:
    max_standards_per_task: 5
```

If you have more than 5 standards in a domain, prioritize the most important ones.

---

## Step 6: Validate and Test the Standard

### Health Check

Run a health check after making changes:

```bash
workflow health
```

### Test Standards Injection

Test whether the standard is correctly injected:

```
> /workflow/inject-standards api/logging
```

Expected output: The full content of `workflow/standards/api/logging.md` is loaded into the current context.

### Test Delegation

Create a test task and verify the standard is included:

```
> Delegate a backend task to builder: "Implement a
  health-check endpoint with structured logging."
```

Verify that `api/logging` is included in the standards block of the delegation.

### Checklist

- [ ] Standard file exists at `workflow/standards/{domain}/{name}.md`
- [ ] Format is concise and scannable (rules, code examples, anti-patterns)
- [ ] Index entry exists in `workflow/standards/index.yml`
- [ ] Tags are meaningful (4-8 keywords)
- [ ] Skill references the standard (for skills-based matching)
- [ ] Domain mapping in `orchestration.yml` updated
- [ ] Health check shows no errors
- [ ] Standard is injected for relevant tasks

---

## Discover Existing Standards from Code

If you want to formalize existing patterns in your codebase:

```
> /workflow/discover-standards
```

### Interaction

```
Claude: I analyzed your code and found these patterns:
        1. Structured Logging - All services use winston with JSON format
        2. Request Correlation - TraceId is propagated via X-Request-ID header
        3. Error Wrapping - All services wrap errors in AppError class

        Which would you like to document?
You:    All three.

Claude: For Structured Logging:
        - What problem does it solve?
        - Are there exceptions?
You:    Consistent log aggregation in CloudWatch. No exceptions.

Claude: Standard draft created: api/logging.md
        Create this file?
You:    Yes.
```

---

## Result

You now have:

- A new standard at `workflow/standards/{domain}/{name}.md`
- The standard registered in the index at `workflow/standards/index.yml`
- A skill configured for automatic context matching
- The standard referenced in the orchestration configuration
- Validated that the standard is correctly injected

## Next Steps

- **More standards:** Repeat the process for other patterns in your codebase
- **Discover standards:** Use `/workflow/discover-standards` to formalize implicit patterns
- **Team alignment:** Ensure the team knows and accepts the standards
- **Iteration:** Observe whether agents apply the standards correctly and adjust them

## Best Practices for Good Standards

1. **From practice:** Document what already works, not what is theoretically ideal
2. **Minimal:** Only the essentials -- agents can apply general knowledge on their own
3. **Opinionated:** Standards that say "it depends" help no one
4. **Keep current:** Outdated standards are worse than no standards
5. **Team consensus:** Standards that nobody follows are documentation waste
6. **Testable:** Every rule should be verifiable with a check

## See Also

- [Standards Reference](../standards.md) -- Complete standards documentation
- [Agents Overview](../agents.md) -- Which standards each agent receives
- [Workflow Guide](../workflow.md) -- How standards appear in spec shaping
- [CLI Reference](../cli.md) -- Health checks and index rebuild
