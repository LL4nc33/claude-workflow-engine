# Tips & Best Practices

Proven recommendations for the effective use of the Claude Workflow Engine Multi-Agent System.

---

## Agent Selection Cheat Sheet

| Situation | Recommended Agent | Reason |
|-----------|-------------------|--------|
| Plan system architecture | `architect` | READ-ONLY analysis, ADRs, design decisions |
| Production bug | `debug` | Full access, hypothesis-driven investigation |
| Implement new feature | `debug` (via `orchestrator`) | Orchestrator delegates, debug implements |
| Set up CI/CD pipeline | `devops` | Specialized in Docker, K8s, IaC |
| Check code for vulnerabilities | `security` | OWASP audits, RESTRICTED access |
| Understand/explain codebase | `ask` | READ-ONLY, didactic explanations |
| Evaluate technology | `researcher` | Analysis, comparisons, reports |
| Coordinate multiple tasks | `orchestrator` | Task delegation, parallelization |
| Refactor existing code | `debug` | Full access, minimal changes |
| API design review | `architect` | API conventions, response formats |
| GDPR compliance check | `security` | Data protection audit, vulnerability assessment |
| Analyze performance issue | `debug` | Profiling, log analysis, state inspection |
| Write documentation | `researcher` | READ-ONLY analysis, structured reports |

**Rule of thumb:** When in doubt, use the `orchestrator` -- it delegates to the appropriate agent.

---

## Workflow Shortcuts

Not every project requires all 5 phases. Here you can learn when to take shortcuts.

```
plan-product -> shape-spec -> write-spec -> create-tasks -> orchestrate-tasks
```

| Situation | Skip | Start with |
|-----------|------|------------|
| Product already exists | `plan-product` | `shape-spec` |
| Spec is clear in your head | `shape-spec` | `write-spec` |
| Only 1-2 small tasks | `create-tasks` | Direct agent delegation |
| Bugfix | Everything | `debug` directly |
| Prototyping | Standards injection | `write-spec` (minimal) |
| Known pattern | Detailed `shape-spec` | One-liner shape is sufficient |

### Examples

**Quick bugfix:**
```bash
# Go directly to the debug agent, no workflow needed
claude agents/debug "Fix the TypeError in api/handler.ts line 42"
```

**Feature with known pattern:**
```bash
# shape-spec is a one-liner
claude /workflow/write-spec
# In the spec: "CRUD endpoint for Users, analogous to Products endpoint"
```

**Large feature:**
```bash
# Full workflow
claude /workflow/plan-product       # Define mission & goals
claude /workflow/shape-spec         # Gather requirements
claude /workflow/write-spec         # Technical spec
claude /workflow/create-tasks       # Split into tasks
claude /workflow/orchestrate-tasks  # Delegate & execute
```

---

## Standards Design Rules

### Do

- **Keep it short and scannable** -- Agents read standards in the context window, every token counts
- **One concept per standard** -- Focused and clearly scoped
- **Code examples instead of lengthy explanations** -- Show, don't tell
- **Opinionated** -- Make clear decisions, do not list options
- **Testable rules** -- Every rule must be verifiable

### Don't

- **"It depends" standards** -- If there is no clear answer, it is not a standard
- **Common knowledge** -- DRY, SOLID basics do not belong in standards
- **Unreviewed standards** -- Standards without team review lead to resistance
- **Overly granular standards** -- One file per rule creates token overhead
- **Standards without code examples** -- Abstract rules are interpreted differently

### Good Standard (Example)

```yaml
# workflow/standards/api/response-format.yml
name: API Response Format
rules:
  - All responses use the envelope pattern
  - Errors always include error.code and error.message
  - Pagination via cursor, not offset

example: |
  // Success
  { "data": { ... }, "meta": { "cursor": "abc123" } }

  // Error
  { "error": { "code": "NOT_FOUND", "message": "User not found" } }
```

### Bad Standard (Example)

```yaml
# Too vague, not testable, no example
name: Code Quality
rules:
  - Code should be clean
  - Use best practices
  - It depends on the context
```

---

## Common Mistakes

| No. | Mistake | Problem | Solution |
|-----|---------|---------|----------|
| 1 | Injecting too many standards at once | Context window overflow, agent loses focus | Max 5 standards per delegation |
| 2 | Configuring agent with wrong tools | Failures during delegation | Check agent boundaries in definition |
| 3 | Specs without acceptance criteria | Vague implementation, endless iterations | Every spec needs measurable criteria |
| 4 | Skipping the product phase | Disconnected features, no common thread | At minimum define mission and architecture |
| 5 | Using orchestrator for single tasks | Unnecessary overhead | Delegate directly to the appropriate agent |
| 6 | Never updating standards | Drift between code and standards | Schedule quarterly reviews |
| 7 | Running all tasks sequentially instead of in parallel | Slow execution | Use `parallel: true` in orchestration.yml |
| 8 | Quality gates too strict | Blocked workflows, frustration | Gates only at critical transitions |
| 9 | Spec folders too large | Hard to navigate, unclear structure | 1 spec = 1 feature, not 1 project |
| 10 | Agent definitions without clear boundaries | Overlapping responsibilities | Define access level and scope explicitly |

---

## Performance Tips

### Context Window Optimization

- **Max 5 standards per delegation** -- More leads to quality degradation
- **Mind standards granularity** -- Short but complete, no novel-length standards
- **Keep task descriptions compact** -- Precise rather than verbose
- **Use specialized agents** -- Better results with fewer tokens than general-purpose

### Token Optimization

```yaml
# orchestration.yml - Context Optimization
context_optimization:
  max_standards_per_task: 5
  compress_previous_results: true
  include_only_relevant_standards: true
```

### Parallelization

```yaml
# orchestration.yml - Parallel execution
tasks:
  - id: api-endpoints
    agent: debug
    parallel_group: "implementation"
  - id: database-migration
    agent: debug
    parallel_group: "implementation"  # Runs in parallel with api-endpoints
  - id: integration-tests
    agent: debug
    depends_on: [api-endpoints, database-migration]  # Waits for both
```

### Measurable Improvements

| Optimization | Token Savings | Speed |
|--------------|---------------|-------|
| Limit standards to 5 | ~30% fewer input tokens | - |
| Parallel tasks | - | 2-3x faster |
| Specialized agent | ~20% fewer output tokens | More precise results |
| Compact task descriptions | ~15% fewer input tokens | - |

---

## Orchestration Strategies

### Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `automatic` | All tasks execute without intervention | Known, safe workflows |
| `phase-by-phase` | Pause after each phase for review | New features, critical changes |
| `manual` | Each task requires explicit approval | Production deployments, security fixes |

### Identifying Parallel vs. Sequential Tasks

**Parallelizable:**
- Independent API endpoints
- Tests for different modules
- Frontend components without shared dependencies
- Documentation and implementation

**Sequential:**
- Database migration before API code
- API before frontend integration
- Implementation before tests (when tests validate the implementation)
- Security audit before deployment

### Using Quality Gates Effectively

```yaml
# Not after every task -- only at critical transitions
quality_gates:
  - after_phase: "implementation"
    checks: [lint, type-check, unit-tests]
  - after_phase: "integration"
    checks: [integration-tests, security-scan]
  - before_phase: "deployment"
    checks: [all-tests, security-audit, performance-baseline]
```

### Fallback Agents

```yaml
# When the primary agent fails
task:
  agent: devops
  fallback_agent: debug
  retry_count: 2
  escalation: orchestrator
```

---

## Project Structure Tips

### Setup Order

1. **Product layer first** -- Define mission, architecture, tech stack
2. **Define standards early** -- Not only when problems arise, but proactively
3. **Structure spec folders** -- Chronologically or thematically, but consistently
4. **Establish agent boundaries** -- Clear responsibilities from the start

### Folder Naming

```
workflow/
  product/
    mission.md
    architecture.md
    roadmap.md
  specs/
    2024-01-auth-system/        # Date + feature for chronological ordering
    2024-02-payment-integration/
    2024-03-notification-service/
  standards/
    global/                     # Project-wide standards
    api/                        # Domain-specific
    frontend/
    team/                       # Team standards (separate from engine standards)
```

### Separating Team Standards

```yaml
# workflow/standards/index.yml
domains:
  global:
    path: workflow/standards/global/
    scope: engine        # Engine standards (do not modify)
  team:
    path: workflow/standards/team/
    scope: project       # Project-specific standards (freely customizable)
```

**Why separate?**
- Engine standards are updated with releases
- Team standards remain project-specific
- No merge conflicts during engine upgrades

---

## Further Documentation

- [Workflow Guide](workflow.md) -- Detailed description of all 5 phases
- [Agents](agents.md) -- All agents in detail
- [Standards](standards.md) -- Standards system explained
- [CLI Reference](cli.md) -- All commands and options
- [Configuration](configuration.md) -- config.yml and orchestration.yml
- [FAQ](faq.md) -- Answers to frequently asked questions

### How-Tos

- [Develop a New Feature](how-to/develop-new-feature.md)
- [Create a Custom Agent](how-to/create-custom-agent.md)
- [Extend Standards](how-to/extend-standards.md)

### Examples

- [Use Case: API Feature](examples/use-case-api-feature.md)
- [Use Case: Bugfix Workflow](examples/use-case-bugfix-workflow.md)
