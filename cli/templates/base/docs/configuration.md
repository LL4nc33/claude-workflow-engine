# Configuration

Claude Workflow Engine uses several configuration files. This reference explains each file, its options, and how they interact.

## Configuration files overview

| File | Purpose | Required |
|------|---------|----------|
| `workflow/config.yml` | Main engine configuration | Yes |
| `workflow/orchestration.yml` | Task delegation and quality gates | Yes |
| `workflow/standards/index.yml` | Standards registry | Yes |
| `.claude/CLAUDE.md` | Project context for Claude Code | Yes |
| `.claude/settings.local.json` | Claude Code permissions | Yes |

---

## workflow/config.yml

The main configuration file. Controls which features are enabled, how the context model is structured, and which agents are available.

### Full reference

```yaml
version: 0.1.0
default_profile: default

# --- Claude Code Integration ---

# Enable workflow slash commands
claude_code_commands: true

# Allow delegation to subagents
use_claude_code_subagents: true

# Register standards as Claude Code Skills for context-efficient auto-matching
# When true: Claude auto-applies relevant standards based on task context
# When false: Standards must be manually injected or orchestrator-injected
standards_as_claude_code_skills: true

# Disable non-Claude-Code outputs (Cursor, Codex, Gemini)
workflow_engine_commands: false

# --- 3-Layer Context Model ---

context_model:
  # Layer 1: HOW (conventions, patterns)
  standards:
    path: workflow/standards/       # Where standards live
    auto_inject: false              # Use skills-based matching instead
    domains:                        # Registered domains
      - global
      - devops
      - agents
      - api
      - database
      - frontend
      - testing

  # Layer 2: WHAT/WHY (mission, vision)
  product:
    path: workflow/product/
    files:
      - mission.md
      - roadmap.md
      - architecture.md

  # Layer 3: WHAT NEXT (feature specs)
  specs:
    path: workflow/specs/
    naming_convention: "{timestamp}-{feature-name}/"

# --- Agent System ---

agents:
  directory: .claude/agents/
  available:
    - name: architect
      access: read-only
      purpose: System design, ADRs, architectural review
    - name: ask
      access: read-only
      purpose: Explanations, learning, documentation queries
    - name: debug
      access: full
      purpose: Bug investigation with full filesystem access
    - name: orchestrator
      access: task-delegation
      purpose: Task delegation using the Task tool
    - name: researcher
      access: read-only
      purpose: Codebase analysis and documentation generation
    - name: security
      access: read-only
      purpose: OWASP audits, vulnerability assessment
    - name: devops
      access: full
      purpose: CI/CD, Docker, Kubernetes, IaC

# --- GDPR / EU Compliance ---

gdpr:
  enabled: true
  data_residency: eu-central-1     # Frankfurt region

  # The engine makes NO external API calls
  local_only: true

  sensitive_data:
    pii_in_standards: forbidden     # No personal data in standards
    pii_in_specs: forbidden         # No personal data in specs
    local_files_only: true          # Use .local.md for personal data
    gitignored_patterns:
      - "CLAUDE.local.md"
      - "*.local.md"
      - ".env*"
      - "credentials.*"
      - "secrets.*"

  audit:
    log_spec_changes: true
    log_standard_changes: true

# --- Orchestration ---

orchestration:
  config_file: workflow/orchestration.yml
  per_spec_config: workflow/specs/{folder}/orchestration.yml
  default_execution_mode: phase-by-phase
  track_progress: true

# --- Profiles ---

profiles:
  default:
    description: Base standards applicable to all projects
```

### Key settings to customize

| Setting | Default | Effect |
|---------|---------|--------|
| `standards_as_claude_code_skills` | `true` | Standards are auto-matched via Skills system |
| `context_model.standards.auto_inject` | `false` | If true, all standards injected always (expensive) |
| `orchestration.default_execution_mode` | `phase-by-phase` | How orchestration runs by default |
| `gdpr.enabled` | `true` | Enables GDPR compliance checks |
| `gdpr.data_residency` | `eu-central-1` | Target AWS region for infrastructure |

---

## workflow/orchestration.yml

Controls how tasks are delegated, which quality gates are enforced, and how failures are handled. This is the most complex configuration file.

### Workflow phases

Defines the 5-phase command chain:

```yaml
workflow:
  phases:
    - name: plan-product
      command: /plan-product
      output_path: workflow/product/
      outputs: [mission.md, roadmap.md, architecture.md]
      prerequisites: []
      responsible_agent: architect

    - name: shape-spec
      command: /shape-spec
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [shape.md, references.md, standards.md, visuals/]
      prerequisites: [plan-product]
      responsible_agent: researcher
      review_agent: architect

    - name: write-spec
      command: /write-spec
      outputs: [spec.md]
      prerequisites: [shape-spec]
      responsible_agent: architect
      review_agent: security
      quality_gate: gate_1_pre_implementation

    - name: create-tasks
      command: /create-tasks
      outputs: [tasks.md, orchestration.yml]
      prerequisites: [write-spec]
      responsible_agent: orchestrator
      review_agent: architect
      quality_gate: gate_2_pre_execution

    - name: orchestrate-tasks
      command: /orchestrate-tasks
      outputs: [progress.md, delegation.log]
      prerequisites: [create-tasks]
      responsible_agent: orchestrator
      quality_gate: gate_3_post_phase
```

### Agent registry

Full capability definition for each agent:

```yaml
agents:
  registry:
    architect:
      access: read-only
      tools: [Read, Grep, Glob, WebSearch, WebFetch]
      strengths: [System design, ADRs, API review, Trade-offs]
      standards_domains: [global, agents]

    debug:
      access: full
      tools: [Read, Write, Edit, Bash, Grep, Glob]
      strengths: [Bug investigation, Implementation, Testing]
      standards_domains: [global, api, database, frontend, testing]

    # ... (see full file for all 7 agents)
```

### Task-to-agent mapping

Maps abstract task types to concrete agents with override conditions:

```yaml
task_groups:
  backend:
    primary_agent: debug
    review_agent: architect
    standards: [global/tech-stack, global/naming, api/response-format, api/error-handling]
    override_when:
      security_sensitive: security

  frontend:
    primary_agent: debug
    review_agent: architect
    standards: [global/tech-stack, global/naming, frontend/components]

  security:
    primary_agent: security
    review_agent: architect
    standards: [global/tech-stack, global/naming, api/error-handling]
    override_when:
      implementation_needed: debug

  infrastructure:
    primary_agent: devops
    review_agent: architect
    standards: [devops/ci-cd, devops/containerization, devops/infrastructure]

  # ... (12 task groups total)
```

### Standards injection

Controls how standards are provided to delegated agents:

```yaml
standards_injection:
  method: inline                    # Paste full content (not file refs)
  standards_path: workflow/standards/
  always_inject: [global/tech-stack]  # Always included
  domain_mapping:
    backend: [global/naming, api/response-format, api/error-handling]
    frontend: [global/naming, frontend/components]
    database: [database/migrations, global/naming]
    testing: [testing/coverage]
    devops: [devops/ci-cd, devops/containerization, devops/infrastructure]
    security: [global/naming, api/error-handling]
  optimization:
    max_standards_per_task: 5       # Prevent context overflow
    cache_standard_content: true    # Cache reads within session
```

### Quality gates

4-gate architecture for quality enforcement:

```yaml
quality_gates:
  gate_1_pre_implementation:
    trigger: after_write_spec
    blocking: true
    reviewers:
      - agent: architect
        checks: [spec_architecturally_sound, dependencies_identified, scope_reasonable]
      - agent: security
        checks: [no_security_antipatterns, auth_model_defined, gdpr_compliant]
    on_failure:
      action: pause_and_report
      allow_override: true

  gate_2_pre_execution:
    trigger: after_create_tasks
    blocking: true
    reviewers:
      - agent: architect
        checks: [tasks_cover_spec, dependencies_ordered, assignments_appropriate]

  gate_3_post_phase:
    trigger: after_each_phase
    blocking: true
    checks_by_phase:
      data_layer: [schema_valid, types_consistent, migrations_reversible]
      api_layer: [endpoints_documented, error_handling_present]
      frontend_layer: [components_typed, accessibility_basic]
      testing_layer: [coverage_threshold_met, no_flaky_tests]

  gate_4_final_acceptance:
    trigger: after_orchestration_complete
    blocking: true
    reviewers: [security, architect, user]
```

### Execution configuration

Runtime behavior settings:

```yaml
execution:
  default_mode: phase-by-phase     # automatic | phase-by-phase | task-by-task | selective
  max_retries: 2                   # Retries before escalating
  verify_after_each: true          # Verify acceptance criteria per task
  parallel_within_phase: true      # Run independent tasks in parallel
  task_timeout: 300                # Seconds per task (0 = no timeout)
  pause_on:
    - task_failure
    - dependency_missing
    - standards_violation
    - quality_gate_failed
    - security_finding_critical
  context_optimization:
    selective_injection: true       # Only relevant standards
    summarize_completed: true       # Summarize done tasks, don't include full output
    max_delegation_tokens: 8000    # Approximate token budget per delegation
```

### Fallback strategies

What happens when things go wrong:

```yaml
fallbacks:
  agent_unavailable:
    architect: { fallback_to: researcher }
    security: { fallback_to: debug }
    devops: { fallback_to: debug }
    researcher: { fallback_to: ask }
    debug: { fallback_to: null, escalation: user }
    orchestrator: { fallback_to: null, escalation: user }

  task_failure:
    strategy: escalate
    steps:
      - retry_with_additional_context
      - retry_with_different_approach
      - escalate_to_user

  gate_failure:
    strategy: remediate
    max_remediation_cycles: 2
    then: escalate_to_user
```

### Escalation and conflict resolution

```yaml
escalation:
  agent_conflicts:
    architect_vs_security: { priority: security }
    debug_vs_architect: { priority: architect }
    devops_vs_security: { priority: security }
```

---

## workflow/standards/index.yml

Registry of all standards with descriptions and tags for matching:

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

database:
  migrations:
    description: Database migration naming, reversibility rules, safe schema change patterns
    tags: [database, migration, sql, schema, orm]

testing:
  coverage:
    description: Test coverage targets, test structure (AAA), CI integration, test data rules
    tags: [test, coverage, unit-test, integration, e2e, ci]

frontend:
  components:
    description: UI component structure, naming, accessibility, state management patterns
    tags: [component, ui, react, accessibility, a11y, state]

devops:
  ci-cd:
    description: CI/CD pipeline conventions, GitHub Actions patterns, deployment workflows
    tags: [ci, cd, pipeline, github-actions, deployment]
  containerization:
    description: Docker multi-stage builds, security scanning, image optimization
    tags: [docker, container, image, registry]
  infrastructure:
    description: Infrastructure as Code patterns, Terraform, Kubernetes conventions
    tags: [terraform, kubernetes, iac, cloud, aws, hetzner]

agents:
  agent-conventions:
    description: Agent definition standards, permission models, skill formats
    tags: [agent, skill, permission, orchestration]
```

**Rules:**

- Alphabetize domains, then standards within each domain
- Descriptions are one short sentence (used for matching, not documentation)
- Tags are lowercase, hyphenated keywords
- Managed by `/workflow/index-standards`

---

## .claude/CLAUDE.md

Project context file read by Claude Code on startup. Contains:

- System overview (what the engine is)
- Agent hierarchy diagram
- Agent directory table (name, purpose, access)
- Workflow command chain
- Context model description
- Standards domains table
- Key configuration file paths
- GDPR/EU compliance notes

This file is what tells Claude Code about the multi-agent system. Without it, Claude won't know the agents exist or how the workflow operates.

---

## .claude/settings.local.json

Claude Code permissions file. The engine requires these tool permissions:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Bash(*)",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
      "Task"
    ]
  }
}
```

The CLI's `install` command merges these permissions with any existing ones. The `health` command verifies they're present.

---

## Per-spec orchestration.yml

When `/workflow/create-tasks` runs, it generates a spec-specific orchestration config:

```
workflow/specs/{folder}/orchestration.yml
```

This file contains:
- Feature name and spec folder reference
- Task groups with agent assignments
- Task dependencies
- Execution phases
- Agent mapping overrides (if different from global)
- Quality gate configurations specific to this feature

This per-spec config is what `/workflow/orchestrate-tasks` reads to know which tasks to delegate and in what order.

---

## Environment and sensitive files

These files are gitignored and used for local-only configuration:

| File | Purpose |
|------|---------|
| `CLAUDE.local.md` | Personal preferences, API keys, local paths |
| `*.local.md` | Any agent-specific local overrides |
| `.env*` | Environment variables |
| `credentials.*` | Credentials (never committed) |
| `secrets.*` | Secrets (never committed) |
| `.workflow-state.json` | CLI installation state |
| `.workflow-health-report.json` | Health check output |

---

## Common customizations

### Change the default execution mode

In `workflow/orchestration.yml`:

```yaml
execution:
  default_mode: automatic   # or: task-by-task, selective
```

### Increase task timeout

```yaml
execution:
  task_timeout: 600   # 10 minutes instead of 5
```

### Disable a quality gate

```yaml
quality_gates:
  gate_1_pre_implementation:
    blocking: false   # Gate still runs but doesn't block
```

### Add a new standards domain

1. Create the directory: `workflow/standards/new-domain/`
2. Add standards files: `workflow/standards/new-domain/my-standard.md`
3. Update `config.yml` domains list
4. Run `/workflow/index-standards`
5. Add domain mapping in `orchestration.yml` under `standards_injection.domain_mapping`

### Change data residency

In `workflow/config.yml`:

```yaml
gdpr:
  data_residency: eu-west-1   # Ireland instead of Frankfurt
```

## See also

- [Standards](standards.md) - How to write and manage standards
- [Agents](agents.md) - Agent capabilities and tools
- [CLI Reference](cli.md) - Commands that manage these files
- [Workflow Guide](workflow.md) - How configuration affects the workflow
