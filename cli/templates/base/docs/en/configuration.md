# Configuration

Claude Workflow Engine uses several configuration files. This reference explains each file, its options, and how they interact.

---

## Configuration Files Overview

| File | Purpose | Required |
|------|---------|:--------:|
| `workflow/config.yml` | Main configuration | Yes |
| `workflow/orchestration.yml` | Task delegation and quality gates | Yes |
| `workflow/standards/index.yml` | Standards registry | Yes |
| `.claude/CLAUDE.md` | Project context for Claude Code | Yes |
| `.claude/settings.local.json` | Claude Code permissions | Yes |
| `.claude-plugin/plugin.json` | Plugin manifest (6-layer architecture) | Yes |
| `hooks/hooks.json` | Hook definitions (event-based automation) | Yes |

---

## workflow/config.yml

The main configuration controls which features are active, how the context model is structured, and which agents are available.

### Full Reference

```yaml
version: 0.2.7
default_profile: default

# --- Claude Code Integration ---

# Enable workflow slash commands
# Controls: /plan-product, /shape-spec, /write-spec, /create-tasks, /orchestrate-tasks
claude_code_commands: true

# Allow delegation to specialized subagents
# If false: All tasks are handled by the main agent
use_claude_code_subagents: true

# Register standards as Claude Code skills
# true:  Claude automatically applies relevant standards based on task context
# false: Standards must be injected manually or by the orchestrator
standards_as_claude_code_skills: true

# Disable outputs for other AI tools (Cursor, Codex, Gemini)
workflow_engine_commands: false

# --- 3-Layer Context Model ---

context_model:
  # Layer 1: HOW - Conventions, patterns, best practices
  standards:
    path: workflow/standards/       # Standards directory
    auto_inject: false              # Skills-based matching instead of full inject
    domains:                        # Registered domains
      - global       # Cross-cutting: tech-stack, naming
      - devops       # CI/CD, Docker, K8s, IaC
      - agents       # Agent-specific standards
      - api          # Response format, error handling
      - database     # Migration patterns
      - frontend     # Component standards
      - testing      # Coverage targets, test structure

  # Layer 2: WHAT/WHY - Mission, vision, roadmap
  product:
    path: workflow/product/
    files:
      - mission.md
      - roadmap.md
      - architecture.md

  # Layer 3: WHAT NEXT - Feature specifications
  specs:
    path: workflow/specs/
    naming_convention: "{timestamp}-{feature-name}/"

# --- Agent System ---

agents:
  directory: .claude/agents/       # Agent definitions directory
  available:
    - name: architect
      access: read-only
      purpose: System Design, ADRs, Architecture Review
    - name: explainer
      access: read-only
      purpose: Explanations, learning queries, documentation queries
    - name: builder
      access: full
      purpose: Bug investigation with full file system access
    - name: guide
      access: read-only
      purpose: NaNo Evolution, Pattern-to-Standards, Process Improvement
    - name: innovator
      access: read-only
      purpose: Brainstorming, Creative Solutions, "What if" Scenarios
    - name: quality
      access: read-only
      purpose: Testing, Coverage, Quality Gates, Code Health
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
  data_residency: eu-central-1     # Frankfurt - Austrian/EU compliance

  # The engine makes NO external API calls
  local_only: true

  sensitive_data:
    pii_in_standards: forbidden     # No personally identifiable data in standards
    pii_in_specs: forbidden         # No personally identifiable data in specs
    local_files_only: true          # Use .local.md for personal data
    gitignored_patterns:
      - "CLAUDE.local.md"
      - "*.local.md"
      - ".env*"
      - "credentials.*"
      - "secrets.*"

  audit:
    log_spec_changes: true          # Log changes to specs
    log_standard_changes: true      # Log changes to standards

# --- Orchestration ---

orchestration:
  config_file: workflow/orchestration.yml
  per_spec_config: workflow/specs/{folder}/orchestration.yml
  default_execution_mode: phase-by-phase
  track_progress: true

# --- Profile Configuration ---

profiles:
  default:
    description: Baseline standards for all projects
```

### Key Settings

| Setting | Default | Effect |
|---------|---------|--------|
| `standards_as_claude_code_skills` | `true` | Standards are automatically matched via the skills system |
| `context_model.standards.auto_inject` | `false` | If true: all standards always injected (token-intensive) |
| `orchestration.default_execution_mode` | `phase-by-phase` | Default execution mode for orchestration |
| `gdpr.enabled` | `true` | Enable GDPR compliance checks |
| `gdpr.data_residency` | `eu-central-1` | Target AWS region for infrastructure |

---

## workflow/orchestration.yml

Controls task delegation, quality gates, and error handling. This is the most complex configuration file.

### Workflow Phases

The 5-phase command chain defines the flow from planning to execution:

```yaml
workflow:
  phases:
    - name: plan-product
      command: /plan-product
      description: Define mission, goals, and constraints
      output_path: workflow/product/
      outputs: [mission.md, roadmap.md, architecture.md]
      prerequisites: []
      responsible_agent: architect
      review_agent: null
      quality_gate: null

    - name: shape-spec
      command: /shape-spec
      description: Gather requirements, references, and stakeholder input
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [shape.md, references.md, standards.md, visuals/]
      prerequisites: [plan-product]
      responsible_agent: researcher
      review_agent: architect
      quality_gate: null

    - name: write-spec
      command: /write-spec
      description: Create technical specification from shape
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [spec.md]
      prerequisites: [shape-spec]
      responsible_agent: architect
      review_agent: security
      quality_gate: gate_1_pre_implementation

    - name: create-tasks
      command: /create-tasks
      description: Break spec into implementable, delegatable tasks
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [tasks.md, orchestration.yml]
      prerequisites: [write-spec]
      responsible_agent: orchestrator
      review_agent: architect
      quality_gate: gate_2_pre_execution

    - name: orchestrate-tasks
      command: /orchestrate-tasks
      description: Delegate tasks to specialized agents, track progress
      output_path: workflow/specs/{timestamp}-{feature-slug}/
      outputs: [progress.md, delegation.log]
      prerequisites: [create-tasks]
      responsible_agent: orchestrator
      review_agent: null
      quality_gate: gate_3_post_phase
```

Each phase requires completion of its prerequisite phase. Phases are strictly sequential.

### Agent Registry

Complete capability definition for each agent:

```yaml
agents:
  registry:
    architect:
      access: read-only
      tools: [Read, Grep, Glob, WebSearch, WebFetch]
      strengths:
        - System Design and Decomposition
        - Architecture Decision Records (ADRs)
        - API Design Review and Consistency
        - Dependency Analysis and Technology Evaluation
        - Trade-off Analysis
      standards_domains: [global, agents]

    explainer:
      access: read-only
      tools: [Read, Grep, Glob]
      strengths:
        - Code Explanations and Walkthroughs
        - Concept Clarification
        - Pattern Identification and Explanation
      standards_domains: [global]

    builder:
      access: full
      tools: [Read, Write, Edit, Bash, Grep, Glob]
      strengths:
        - Bug Investigation and Root Cause Analysis
        - Code Implementation from Specs
        - Performance Profiling and Optimization
        - Test Creation and Regression Prevention
      standards_domains: [global, api, database, frontend, testing]

    security:
      access: restricted
      tools: [Read, Grep, Glob, "Bash(trivy:*)", "Bash(grype:*)", "Bash(semgrep:*)"]
      strengths:
        - OWASP Top 10 Vulnerability Assessment
        - Authentication and Authorization Review
        - Input Validation and Sanitization
        - Secrets Management and Credential Detection
        - Dependency CVE Scanning
        - GDPR/EU Compliance Verification
      standards_domains: [global, api]

    devops:
      access: full
      tools: [Read, Write, Edit, Bash, Grep, Glob]
      strengths:
        - CI/CD Pipeline Design (GitHub Actions)
        - Docker Multi-Stage Builds
        - Kubernetes Manifests and Helm Charts
        - Terraform Infrastructure as Code
        - EU-compliant Infrastructure
      standards_domains: [devops, global]

    researcher:
      access: read-only
      tools: [Read, Grep, Glob, WebSearch, WebFetch]
      strengths:
        - Codebase Analysis and Pattern Discovery
        - Documentation Generation
        - Standards Extraction and Formalization
        - Technology Comparison and Evaluation
      standards_domains: [global, agents]

    main_chat:
      access: task-delegation
      tools: [Task, Read, Grep, Glob]
      strengths:
        - Task Decomposition and Dependency Resolution
        - Agent Selection and Delegation
        - Progress Tracking and Status Reporting
        - Quality Gate Enforcement
        - Failure Handling and Escalation
      standards_domains: [agents, global]
```

### Task-to-Agent Mapping

Maps abstract task types to concrete agents with override conditions:

```yaml
task_groups:
  backend:
    primary_agent: builder
    review_agent: architect
    standards: [global/tech-stack, global/naming, api/response-format, api/error-handling]
    override_when:
      security_sensitive: security    # Auth endpoints, cryptography, etc.

  frontend:
    primary_agent: builder
    review_agent: architect
    standards: [global/tech-stack, global/naming, frontend/components]

  testing:
    primary_agent: builder
    review_agent: null
    standards: [global/tech-stack, testing/coverage]

  database:
    primary_agent: builder
    review_agent: architect
    standards: [global/tech-stack, global/naming, database/migrations]
    override_when:
      schema_breaking_change: architect   # Needs architecture review first

  security:
    primary_agent: security
    review_agent: architect
    standards: [global/tech-stack, global/naming, api/error-handling]
    override_when:
      implementation_needed: builder        # When fix requires code changes

  infrastructure:
    primary_agent: devops
    review_agent: architect
    standards: [devops/ci-cd, devops/containerization, devops/infrastructure]

  ci_cd:
    primary_agent: devops
    review_agent: security
    standards: [devops/ci-cd, devops/containerization]

  architecture:
    primary_agent: architect
    review_agent: security
    standards: [global/tech-stack, agents/agent-conventions]

  documentation:
    primary_agent: researcher
    review_agent: null
    standards: [global/tech-stack, global/naming]

  review:
    primary_agent: architect
    review_agent: null
    standards: [global/tech-stack, agents/agent-conventions]
    override_when:
      security_review: security
      infra_review: devops

  explanation:
    primary_agent: explainer
    review_agent: null
    standards: [global/tech-stack]

  coordination:
    primary_agent: orchestrator
    review_agent: null
    standards: [agents/agent-conventions, global/tech-stack]

  research:
    primary_agent: researcher
    review_agent: null
    standards: [global/tech-stack]
```

### Standards Injection Configuration

Controls how standards content is passed to delegated agents:

```yaml
standards_injection:
  # Method: inline = embed full content into the delegation prompt
  # Subagents cannot read file references - they need content inline
  method: inline
  standards_path: workflow/standards/

  # Always injected, regardless of task type (global baseline)
  always_inject:
    - global/tech-stack

  # Domain-specific injection rules
  domain_mapping:
    backend: [global/naming, api/response-format, api/error-handling]
    frontend: [global/naming, frontend/components]
    database: [database/migrations, global/naming]
    testing: [testing/coverage]
    devops: [devops/ci-cd, devops/containerization, devops/infrastructure]
    security: [global/naming, api/error-handling]
    agents: [agents/agent-conventions]

  # Token optimization
  optimization:
    max_standards_per_task: 5         # Prevent context overflow
    prefer_skill_reference: false     # Skills do not work in subagent context
    cache_standard_content: true      # Orchestrator caches file reads within session
```

### Quality Gates (4-Gate Architecture)

Quality gates enforce review checkpoints at critical workflow transitions:

**Gate 1: Pre-Implementation** -- Fires after `/write-spec`, before `/create-tasks`:

```yaml
gate_1_pre_implementation:
  trigger: after_write_spec
  blocking: true
  reviewers:
    - agent: architect
      checks:
        - spec_architecturally_sound      # Spec is architecturally sound
        - dependencies_identified         # Dependencies identified
        - tech_stack_aligned              # Tech stack aligned
        - scope_reasonable                # Scope is reasonable
    - agent: security
      checks:
        - no_security_antipatterns        # No security antipatterns
        - auth_model_defined              # Auth model defined
        - data_flow_gdpr_compliant        # Data flow GDPR-compliant
        - threat_model_considered         # Threat model considered
  pass_condition: all_reviewers_approve
  on_failure:
    action: pause_and_report
    notify: user
    allow_override: true
    override_requires: user_acknowledgement
```

**Gate 2: Pre-Execution** -- Fires after `/create-tasks`, before `/orchestrate-tasks`:

```yaml
gate_2_pre_execution:
  trigger: after_create_tasks
  blocking: true
  reviewers:
    - agent: architect
      checks:
        - tasks_cover_spec_requirements   # Tasks cover spec requirements
        - dependencies_correctly_ordered  # Dependencies correctly ordered
        - agent_assignments_appropriate   # Agent assignments appropriate
        - no_scope_creep                  # No scope creep
  pass_condition: all_reviewers_approve
  on_failure:
    action: pause_and_report
    notify: user
    allow_override: true
```

**Gate 3: Post-Phase** -- Fires after each orchestration phase:

```yaml
gate_3_post_phase:
  trigger: after_each_phase
  blocking: true
  checks_by_phase:
    data_layer:
      - schema_valid                    # Schema valid
      - types_consistent                # Types consistent
      - migrations_reversible           # Migrations reversible
    api_layer:
      - endpoints_documented            # Endpoints documented
      - error_handling_present          # Error handling present
      - standards_compliant             # Standards-compliant
      - response_format_correct         # Response format correct
    frontend_layer:
      - components_typed                # Components typed
      - state_managed                   # State managed
      - accessibility_basic             # Basic accessibility
      - naming_conventions_followed     # Naming conventions followed
    testing_layer:
      - coverage_threshold_met          # 80% minimum
      - edge_cases_covered              # Edge cases covered
      - integration_passing             # Integration tests passing
      - no_flaky_tests                  # No flaky tests
    infrastructure_layer:
      - iac_valid                       # terraform validate / docker build --check
      - security_scanned                # Security scan completed
      - eu_compliance_verified          # EU compliance verified
      - rollback_path_defined           # Rollback path defined
  on_failure:
    action: retry_phase
    max_retries: 1
    then: pause_and_report
```

**Gate 4: Final Acceptance** -- Fires after all orchestration phases are complete:

```yaml
gate_4_final_acceptance:
  trigger: after_orchestration_complete
  blocking: true
  reviewers:
    - agent: security
      checks:
        - no_new_vulnerabilities          # No new vulnerabilities
        - secrets_not_exposed             # Secrets not exposed
        - dependency_cves_addressed       # Dependency CVEs addressed
        - gdpr_compliance_verified        # GDPR compliance verified
    - agent: architect
      checks:
        - implementation_matches_spec     # Implementation matches spec
        - no_architectural_drift          # No architectural drift
        - standards_followed              # Standards followed
        - documentation_complete          # Documentation complete
    - agent: user
      checks:
        - acceptance_criteria_met         # Acceptance criteria met
        - manual_review_complete          # Manual review complete
  pass_condition: all_reviewers_approve
  on_failure:
    action: create_remediation_tasks
    # Main Chat coordinates remediation
```

### Execution Config

Runtime behavior of the orchestration:

```yaml
execution:
  # Execution mode
  # automatic:      Run everything automatically
  # phase-by-phase: Pause after each phase
  # task-by-task:   Pause after each task
  # selective:      Only run selected tasks
  default_mode: phase-by-phase

  max_retries: 2                   # Retries before escalation to user
  verify_after_each: true          # Verify acceptance criteria after each task
  track_progress: true             # Track progress in progress.md
  parallel_within_phase: true      # Run independent tasks within a phase in parallel
  task_timeout: 300                # Seconds per task (0 = no timeout)

  # Conditions that pause orchestration
  pause_on:
    - task_failure                  # Task failed
    - dependency_missing            # Dependency missing
    - standards_violation           # Standards violation
    - quality_gate_failed           # Quality gate failed
    - security_finding_critical     # Critical security finding

  # Context window management
  context_optimization:
    selective_injection: true       # Only inject relevant standards
    summarize_completed: true       # Summarize completed tasks
    max_delegation_tokens: 8000    # Approximate token budget per delegation
```

### Fallback Strategies

Define behavior when primary delegation fails:

```yaml
fallbacks:
  # Agent unavailable
  agent_unavailable:
    architect:
      fallback_to: researcher
      reason: "Researcher can analyze but cannot produce ADRs"
      limitation: "No architectural authority - results are advisory"
    security:
      fallback_to: builder
      reason: "Debug has full access for security-relevant code review"
      limitation: "No access to trivy/grype/semgrep scanning tools"
    devops:
      fallback_to: builder
      reason: "Debug has full file system access for infrastructure code"
      limitation: "Possible gaps in infrastructure-specific domain knowledge"
    researcher:
      fallback_to: explainer
      reason: "Ask can explain and analyze in read-only mode"
      limitation: "No WebSearch/WebFetch for external research"
    explainer:
      fallback_to: researcher
      reason: "Researcher has similar read + explain capabilities"
      limitation: "Responses may be more formal/report-oriented"
    builder:
      fallback_to: null
      reason: "No fallback - Debug is the primary implementor"
      escalation: user
    main_chat:
      fallback_to: null
      reason: "No fallback - Orchestrator is the unique coordinator"
      escalation: user

  # Task failed after max_retries
  task_failure:
    strategy: escalate
    steps:
      - retry_with_additional_context     # Add more spec/standards context
      - retry_with_different_approach     # Rephrase delegation prompt
      - escalate_to_user                  # Report failure with diagnostics

  # Quality gate failed
  gate_failure:
    strategy: remediate
    steps:
      - identify_failing_checks           # Identify failing checks
      - create_remediation_tasks          # Create remediation tasks
      - delegate_remediation              # Delegate remediation
      - re_run_gate                       # Re-run gate
    max_remediation_cycles: 2
    then: escalate_to_user
```

### Escalation and Conflict Resolution

```yaml
escalation:
  # Priority levels
  levels:
    - name: info
      action: log_only
      notify: none
    - name: warning
      action: log_and_flag
      notify: progress_file
    - name: error
      action: pause_task
      notify: user
    - name: critical
      action: pause_orchestration
      notify: user

  # Conflict resolution between agents
  agent_conflicts:
    # When architect and security disagree
    architect_vs_security:
      priority: security                  # Security wins by default
      escalate_if: architect_flags_blocking_concern
      resolution: user_decision

    # When builder implementation diverges from architect spec
    debug_vs_architect:
      priority: architect                 # Spec authority wins
      action: debug_must_justify_divergence
      resolution: architect_reviews_justification

    # When devops and security collide on infrastructure
    devops_vs_security:
      priority: security                  # Security constraints are non-negotiable
      action: devops_proposes_alternative
      resolution: security_approves_alternative
```

---

## workflow/standards/index.yml

The standards registry enables intelligent matching based on task context.

### Format

```yaml
# Each entry maps to: workflow/standards/{domain}/{topic}.md
# Skills load automatically from: .claude/skills/workflow/{domain}-standards/SKILL.md

global:
  tech-stack:
    description: Technology stack definitions, framework versions, and tooling choices
    tags: [technology, framework, tooling, infrastructure-choice]
  naming:
    description: Naming conventions for files, code identifiers, APIs, and git artifacts
    tags: [naming, convention, files, variables, endpoints]

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
```

### Rules

- Order domains alphabetically, then standards within each domain
- Descriptions are a short sentence (used for matching, not documentation)
- Tags are lowercase, hyphen-separated keywords
- Always manage new standards via the `/workflow/index-standards` command

### Management

The `/workflow/index-standards` command synchronizes the index file with the standards files present in the file system. It:

1. Scans `workflow/standards/` for all `.md` files
2. Detects new, changed, or removed standards
3. Updates descriptions and tags
4. Validates the YAML format

---

## .claude/CLAUDE.md

The project context file that Claude Code reads on startup.

### What It Contains

- System overview (what the engine is)
- Agent hierarchy diagram
- Agent directory table (name, purpose, access level)
- Workflow command chain
- Context model description (3 layers)
- Standards domain table
- Paths to key configuration files
- GDPR/EU compliance notes

### Why It Matters

This file is what informs Claude Code about the multi-agent system. Without it, Claude knows neither that the agents exist nor how the workflow operates. It is automatically loaded as context with every conversation.

---

## .claude/settings.local.json

The permissions file for Claude Code. The engine requires the following tool permissions:

### Required Permissions

```json
{
  "permissions": {
    "allow": [
      "Agent(architect)",
      "Agent(builder)",
      "Agent(devops)",
      "Agent(explainer)",
      "Agent(guide)",
      "Agent(innovator)",
      "Agent(quality)",
      "Agent(researcher)",
      "Agent(security)",
      "Skill(architect)",
      "Skill(builder)",
      "Skill(devops)",
      "Skill(explainer)",
      "Skill(guide)",
      "Skill(innovator)",
      "Skill(quality)",
      "Skill(researcher)",
      "Skill(security)",
      "Bash(git clone:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(mkdir:*)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(docker:*)",
      "Bash(terraform:*)",
      "Bash(kubectl:*)",
      "Bash(helm:*)",
      "WebSearch",
      "WebFetch"
    ]
  }
}
```

### CLI Management

The CLI `install` command merges these permissions with existing ones. The `health` command verifies their presence. You can also add permissions manually -- the format is:

- `Agent(name)` -- Allow agent delegation
- `Skill(name)` -- Allow skill usage
- `Bash(command:*)` -- Allow specific Bash command
- `WebSearch` / `WebFetch` -- Allow web access

---

## Per-Spec orchestration.yml

When `/workflow/create-tasks` is run, it generates a spec-specific orchestration configuration:

```
workflow/specs/{folder}/orchestration.yml
```

### What /create-tasks Generates

This file contains:

- Feature name and spec folder reference
- Task groups with agent assignments
- Task dependencies (dependency order)
- Execution phases
- Agent mapping overrides (if different from global mapping)
- Quality gate configurations specific to this feature

### Content

```yaml
feature: "Feature Name"
spec_folder: workflow/specs/20250115-feature-name/

phases:
  - name: data_layer
    tasks: [task-1, task-2]
  - name: api_layer
    tasks: [task-3, task-4]
    depends_on: [data_layer]
  - name: frontend_layer
    tasks: [task-5]
    depends_on: [api_layer]
  - name: testing_layer
    tasks: [task-6, task-7]
    depends_on: [frontend_layer]

tasks:
  task-1:
    title: "Create database schema"
    agent: builder
    group: database
    standards: [database/migrations, global/naming]
    depends_on: []
  # ...
```

This per-spec configuration is what `/workflow/orchestrate-tasks` reads to know which tasks to delegate in which order.

---

## Environment and Sensitive Files

These files are gitignored and serve local configuration:

| File | Purpose |
|------|---------|
| `CLAUDE.local.md` | Personal preferences, API keys, local paths |
| `*.local.md` | Agent-specific local overrides |
| `.env*` | Environment variables |
| `credentials.*` | Credentials (never committed) |
| `secrets.*` | Secrets (never committed) |
| `.workflow-state.json` | CLI installation state |
| `.workflow-health-report.json` | Health check output |

All sensitive files remain local. The engine makes no external API calls and syncs no data to the cloud (GDPR-compliant).

---

## Common Customizations

### Changing the Execution Mode

In `workflow/orchestration.yml`:

```yaml
execution:
  # Options: automatic, phase-by-phase, task-by-task, selective
  default_mode: automatic   # Run everything without pausing
```

- `automatic` -- Runs completely, only pauses on errors
- `phase-by-phase` -- Pauses after each phase for review
- `task-by-task` -- Pauses after each individual task
- `selective` -- Only run selected tasks

### Increasing Task Timeout

```yaml
execution:
  task_timeout: 600   # 10 minutes instead of the default 5 minutes
```

Set to `0` for no timeout (not recommended in production environments).

### Disabling a Quality Gate

```yaml
quality_gates:
  gate_1_pre_implementation:
    blocking: false   # Gate still runs but no longer blocks
```

You can also remove individual checks instead of disabling the entire gate:

```yaml
quality_gates:
  gate_1_pre_implementation:
    reviewers:
      - agent: architect
        checks:
          - spec_architecturally_sound
          # dependencies_identified removed - no longer checked
          - tech_stack_aligned
```

### Adding a New Standards Domain

1. Create the directory:

```bash
mkdir -p workflow/standards/new-domain/
```

2. Create a standards file:

```bash
# Create workflow/standards/new-domain/my-standard.md
```

3. Update `config.yml`:

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
      - new-domain    # Newly added
```

4. Update the index:

```bash
# Run /workflow/index-standards
```

5. Add domain mapping in `orchestration.yml`:

```yaml
standards_injection:
  domain_mapping:
    # ... existing mappings ...
    new-domain: [new-domain/my-standard]

task_groups:
  my-task-type:
    primary_agent: builder
    standards: [new-domain/my-standard]
```

### Changing Data Residency

In `workflow/config.yml`:

```yaml
gdpr:
  data_residency: eu-west-1   # Ireland instead of Frankfurt
```

Available EU regions:

| Region | Location |
|--------|----------|
| `eu-central-1` | Frankfurt (default) |
| `eu-west-1` | Ireland |
| `eu-west-2` | London |
| `eu-west-3` | Paris |
| `eu-south-1` | Milan |
| `eu-north-1` | Stockholm |

---

## .claude-plugin/plugin.json

The plugin manifest bundles all 6 layers of the engine into a Claude Code plugin:

```json
{
  "name": "claude-workflow-engine",
  "version": "0.2.7",
  "description": "Multi-Agent Workflow System",
  "author": "LL4nc33",
  "license": "MIT",
  "commands": "./.claude/commands",
  "agents": "./.claude/agents",
  "skills": "./.claude/skills",
  "hooks": "./hooks/hooks.json"
}
```

### Effect

Claude Code recognizes the plugin automatically on startup. The manifest references commands, agents, skills, and hooks -- Claude loads these components accordingly.

---

## hooks/hooks.json

The hook configuration defines event-based automation:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/session-start.sh",
      "timeout": 10000
    },
    {
      "event": "PreToolUse",
      "matcher": {"tool_name": ["Write", "Edit"]},
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pre-write-validate.sh",
      "timeout": 5000
    },
    {
      "event": "PostToolUse",
      "matcher": {"tool_name": ["Write", "Edit"]},
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/post-write-log.sh",
      "timeout": 5000
    }
  ]
}
```

### Implemented Hooks

| Hook | Event | Function |
|------|-------|----------|
| SessionStart | Session begins | Checks standards freshness, provides workflow context |
| PreToolUse | Before Write/Edit | Secrets protection (blocks .env, credentials.*, secrets.*, *.local.md) |
| PostToolUse | After Write/Edit | Logs filename + timestamp during active orchestration (GDPR-compliant) |

### Hook Scripts

All scripts reside in `hooks/scripts/`:

| Script | Function |
|--------|----------|
| `session-start.sh` | Context check and workflow status |
| `pre-write-validate.sh` | Secrets pattern detection |
| `post-write-log.sh` | Change logging to delegation.log |
| `common.sh` | Shared utilities (get_project_root, json_escape, etc.) |

See [Platform Architecture](platform-architecture.md#layer-5-hooks) for details and debugging tips.

---

## MCP Servers (optional)

MCP servers extend agent capabilities with semantic code analysis and PR management.

### Recommended Servers

| Server | Function | Used By |
|--------|----------|---------|
| **Serena** | Language Server-based code navigation | architect, researcher, builder, explainer |
| **Greptile** | PR management and code review | quality, security |

### Configuration in config.yml

```yaml
# MCP servers are optional and NOT shipped in the repository.
# Configuration is done locally via Claude Code MCP settings.
mcp:
  recommended_servers:
    - name: serena
      purpose: Semantic code analysis via Language Server
      setup: Create .serena/ configuration in project
    - name: greptile
      purpose: PR management and code review
      setup: Configure Greptile MCP server with API key
```

### Fallback Behavior

When an MCP server is unavailable, agents automatically fall back to standard tools:
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

---

## See Also

- [Standards](standards.md) -- How to write and manage standards
- [Agents](agents.md) -- Agent capabilities and MCP tools
- [CLI Reference](cli.md) -- Commands that manage these files
- [Workflow Guide](workflow.md) -- How configuration affects the workflow
- [Platform Architecture](platform-architecture.md) -- 6-layer architecture in detail
