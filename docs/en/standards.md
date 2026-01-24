# Standards

Standards are the "HOW" layer in the 3-layer context model. They define conventions, patterns, and best practices that agents follow when implementing tasks. Standards live in `workflow/standards/` and are organized by domain.

## The 3-Layer Context Model

```
Layer 1: Standards (HOW)     -> workflow/standards/
Layer 2: Product (WHAT/WHY)  -> workflow/product/
Layer 3: Specs (WHAT NEXT)   -> workflow/specs/
```

- **Standards** ensure consistency across features and agents
- **Product** keeps the big picture visible (mission, roadmap, architecture)
- **Specs** define concrete, actionable work packages

## Domains and Standards

Claude Workflow Engine ships with 11 standards across 7 domains:

| Domain | Standards | Purpose |
|--------|-----------|---------|
| `global/` | tech-stack, naming | Cross-cutting conventions |
| `api/` | response-format, error-handling | API design patterns |
| `database/` | migrations | Schema change patterns |
| `devops/` | ci-cd, containerization, infrastructure | Infrastructure conventions |
| `frontend/` | components | UI component patterns |
| `testing/` | coverage | Test structure and targets |
| `agents/` | agent-conventions | Agent definition standards |

### Directory Structure

```
workflow/standards/
  index.yml                    # Registry of all standards
  global/
    tech-stack.md              # Framework versions, tooling
    naming.md                  # File/variable/API naming
  api/
    response-format.md         # Response envelope, status codes
    error-handling.md          # Error codes, logging, GDPR
  database/
    migrations.md              # Migration naming, reversibility
  devops/
    ci-cd.md                   # Pipeline patterns
    containerization.md        # Docker conventions
    infrastructure.md          # Terraform/K8s patterns
  frontend/
    components.md              # Component structure, accessibility
  testing/
    coverage.md                # Coverage targets, test structure
  agents/
    agent-conventions.md       # Agent permissions, skill formats
```

## How Standards Are Used

Standards are consumed in three ways:

### 1. Skills-based Auto-Matching

When `standards_as_claude_code_skills: true` is set in `config.yml` (the default), standards are registered as Claude Code skills in `.claude/skills/workflow/`. Claude automatically applies relevant standards based on task context -- without loading all 11 into every prompt.

Skills directories:

```
.claude/skills/workflow/
  global-standards/
  api-standards/
  database-standards/
  devops-standards/
  frontend-standards/
  testing-standards/
  agent-standards/
```

### 2. Inline Injection During Orchestration

When the orchestrator delegates tasks, it reads the relevant standards files and embeds their full content into the delegation prompt. Subagents cannot read file references -- they need the text inline.

Which standards are injected depends on the task type:

| Task Domain | Injected Standards |
|-------------|-------------------|
| backend | global/tech-stack, global/naming, api/response-format, api/error-handling |
| frontend | global/tech-stack, global/naming, frontend/components |
| database | global/tech-stack, global/naming, database/migrations |
| testing | global/tech-stack, testing/coverage |
| devops | devops/ci-cd, devops/containerization, devops/infrastructure |
| security | global/tech-stack, global/naming |

`global/tech-stack` is always injected, regardless of task type.

### 3. Manual Injection via Command

You can inject standards into the current conversation at any time:

```
/workflow/inject-standards                        # Suggest relevant ones automatically
/workflow/inject-standards api                    # All standards in api/
/workflow/inject-standards api/response-format    # A specific standard
```

## The Standards Index

`workflow/standards/index.yml` is the registry that maps each standard to a description and tags for matching:

```yaml
global:
  tech-stack:
    description: Technology stack definitions, framework versions, and tooling choices
    tags: [technology, framework, tooling, infrastructure-choice]
  naming:
    description: Naming conventions for files, code identifiers, APIs, and git artifacts
    tags: [naming, convention, files, variables, endpoints]

api:
  response-format:
    description: API response envelope structure, pagination, status codes
    tags: [api, response, json, http, rest, status-code]
  error-handling:
    description: Error hierarchy, error codes, logging levels, GDPR-compliant error responses
    tags: [error, exception, logging, error-code, gdpr]
```

Rules for the index:

- Entries sorted alphabetically within each domain
- Each entry requires `description` and `tags`
- Tags enable `/inject-standards` to suggest relevant standards without reading all files

## Managing Standards

### Discovering Standards from the Codebase

```
/workflow/discover-standards
```

This command:

1. Analyzes your codebase for patterns (unusual, opinionated, tribal, consistent)
2. Presents results and lets you choose which to document
3. Asks for the "why" behind each pattern
4. Creates concise standards files
5. Updates the index

**Example interaction:**

```
Claude: I analyzed your API code and found these patterns:
        1. Response Envelope - All responses use { success, data, error }
        2. Error Codes - Custom codes like AUTH_001, DB_002
        3. Pagination - Cursor-based with consistent param names

        Which would you like to document?
You:    Yes, all of them

Claude: For the response envelope pattern:
        - What problem does it solve?
        - Are there exceptions?
You:    Frontend always knows where the data is. No exceptions.

Claude: Here is the draft for api/response-format.md:
        [Draft content]
        Create this file?
```

### Rebuilding the Index

```
/workflow/index-standards
```

Scans `workflow/standards/` for all `.md` files, compares with the existing index, adds new entries, and removes stale ones. Run this after manually creating or deleting standards files.

### Injecting Standards into Context

```
/workflow/inject-standards
```

Three modes depending on context:

1. **Conversation** -- Reads standards content into the current chat
2. **Skill creation** -- Outputs `@file` references or full content for skills
3. **Planning** -- Outputs references or content for specs

## Writing Good Standards

Standards are injected into AI context windows. Every word costs tokens. Write them to be scannable:

**Do:**

```markdown
# Error Responses

Use error codes: `AUTH_001`, `DB_001`, `VAL_001`

{ "success": false, "error": { "code": "AUTH_001", "message": "..." } }

- Always include code and message
- Log full error server-side, return safe message to client
```

**Don't:**

```markdown
# Error Handling Guidelines

When an error occurs in our application, we have established a consistent
pattern for how errors should be formatted and returned to the client.
This helps maintain consistency across our API and makes it easier for
frontend developers to handle errors appropriately...
[continues for 3 more paragraphs]
```

Rules for concise standards:

- Rule first, explanation after (if needed)
- Use code examples -- show, don't tell
- Omit the obvious (don't document what the code makes clear)
- One standard per concept
- Bullet points over paragraphs

## Creating Your Own Standards

To add a new standard manually:

1. **Create the file** in the appropriate domain folder:
   ```
   workflow/standards/api/authentication.md
   ```

2. **Write the content** (see guidelines above)

3. **Update the index:**
   ```
   /workflow/index-standards
   ```

4. **Skill discovery:** With skills-based matching, the standard is discovered automatically. For explicit control, add it to the relevant skill in `.claude/skills/workflow/`.

## Standards in Orchestration

During `/workflow/orchestrate-tasks`, standards injection follows these rules from `orchestration.yml`:

- **Method:** `inline` (embed full content, no file references)
- **Always injected:** `global/tech-stack`
- **Max per task:** 5 standards (to prevent context overflow)
- **Cache:** Orchestrator caches reads within a session

The orchestrator maps task domains to standards via `standards_injection.domain_mapping` in `orchestration.yml`. See [Configuration](configuration.md) for details.

## See Also

- [Workflow Guide](workflow.md) -- How standards surface during spec shaping
- [Agents](agents.md) -- Which standards each agent receives as context
- [Configuration](configuration.md) -- standards_injection settings in orchestration.yml
- [Integration](integration.md) -- How standards work when integrating into existing projects
