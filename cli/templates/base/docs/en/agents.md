# Agents

Claude Workflow Engine includes 9 specialized agents, each with a defined role, access level, and toolset. Agents are defined as Markdown files in `.claude/agents/` and are automatically available as Claude Code subagents.

## Overview

| Agent | Access | Purpose | Tools | MCP Tools |
|-------|--------|---------|-------|-----------|
| [architect](#architect) | READ-ONLY | System Design, ADRs, API Review | Read, Grep, Glob, WebSearch, WebFetch | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| [explainer](#explainer) | READ-ONLY | Explanations, Learning | Read, Grep, Glob | Serena: get_symbols_overview, find_symbol |
| [builder](#builder) | FULL | Bug Investigation, Implementation | Read, Write, Edit, Bash, Grep, Glob | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| [devops](#devops) | FULL | CI/CD, Docker, K8s, IaC | Read, Write, Edit, Bash, Grep, Glob | - |
| [orchestrator](#orchestrator) | TASK-DELEGATION | Coordination, Delegation | Task, Read, Grep, Glob | Greptile: list_merge_requests, get_merge_request |
| [researcher](#researcher) | READ-ONLY | Analysis, Documentation | Read, Grep, Glob, WebSearch, WebFetch | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| [security](#security) | RESTRICTED | OWASP Audits, Vulnerability Scanning | Read, Grep, Glob, Bash (security tools only) | Greptile: search_greptile_comments, list_merge_request_comments |

## Access Levels

| Level | Meaning | Agents |
|-------|---------|--------|
| **READ-ONLY** | Can read and search files, but cannot modify anything | architect, explainer, researcher |
| **FULL** | Can read, write, edit, and execute commands | builder, devops |
| **TASK-DELEGATION** | Can read files and delegate tasks to other agents via the Task tool | orchestrator |
| **RESTRICTED** | Read-only plus a limited set of Bash commands (security scanning tools only) | security |

Access levels define what an agent is technically allowed to do. They are specified in the frontmatter of each agent file and enforced by the system.

---

## Architect

**File:** `.claude/agents/architect.md`

**Role:** Senior Systems Architect. Thinks in systems, not files. Analyzes, recommends, and documents architectural decisions.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**MCP Tools (optional):** Serena: `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`

**Specializations:**

- Architecture Decision Records (ADRs)
- System Design and Component Decomposition
- API Design Review and Consistency Checks
- Dependency Analysis and Technology Evaluation
- Trade-off Analysis (scalability, maintainability, performance)
- Integration Patterns and Data Flow Design

**Context Sources:** tech-stack, agent-conventions, mission, architecture, roadmap

**Output Formats:**

- Architecture Reviews (current state, observations, recommendations, risks)
- ADRs (Status, Context, Decision, Consequences)
- API Reviews (consistency checks, improvement suggestions)

**When to use:**

- "How should I architect the notification system?"
- "Review the API design for consistency"
- "What are the trade-offs between PostgreSQL and MongoDB here?"
- "Create an ADR for the switch to event-driven architecture"
- "Analyze the dependencies of the auth module"

**Collaborates with:** security (architecture review), builder (provides guidance), devops (infrastructure design), researcher (pattern documentation)

---

## Explainer

**File:** `.claude/agents/explainer.md`

**Role:** Patient technical educator. Explains complex topics simply, without being condescending. Uses analogies when helpful and examples when needed.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob

**MCP Tools (optional):** Serena: `get_symbols_overview`, `find_symbol`

**Specializations:**

- Code Walkthroughs and Explanations
- Concept Clarification (from basics to advanced)
- Pattern Recognition and Explanation
- Documenting Decision Rationale
- Learning-oriented Responses (teach to fish, not hand a fish)

**Context Sources:** tech-stack, mission, architecture

**Output Formats:**

- Code Explanations (TL;DR, how it works, rationale, related topics)
- Concept Explanations (plain language, project relevance, examples, further reading)
- How-to Guides (short answer, step by step, pitfalls, standards)

**When to use:**

- "How does the authentication middleware work?"
- "Explain the Observer Pattern as used in this project"
- "What does this regex do?"
- "Why was Redis chosen over Memcached?"
- "Walk me through the login data flow"

**Collaborates with:** architect (for "why" questions), researcher (for deep dives), builder (when questions become implementation tasks)

---

## Debug

**File:** `.claude/agents/builder.md`

**Role:** Methodical debugging specialist and implementation expert. Full file system access for code modification. The "coroner" -- finds out why code died.

**Access:** FULL

**Tools:** Read, Write, Edit, Bash, Grep, Glob

**MCP Tools (optional):** Serena: `find_referencing_symbols`, `replace_symbol_body`, `find_symbol`, `get_symbols_overview`

**Specializations:**

- Hypothesis-driven Bug Investigation
- Root Cause Analysis (no symptom treatment)
- Performance Profiling and Optimization
- Test Creation and Regression Prevention
- Code Implementation from Specs

**Context Sources:** tech-stack, naming, error-handling, response-format, migrations, components, coverage, mission, architecture

**Debugging Methodology:**

| Phase | Action | Description |
|-------|--------|-------------|
| 1 | REFLECT | Expected vs. actual behavior, when it started, reproducibility |
| 2 | HYPOTHESIZE | Rank causes by probability, gather evidence |
| 3 | DIAGNOSE | Design tests that prove/disprove each hypothesis |
| 4 | ISOLATE | Create minimal reproduction case, verify fix in isolation |
| 5 | FIX | Implement minimal fix, add regression test, document |

**Output Formats:**

- Bug Reports (symptoms, root cause, applied fix, prevention, regression test)
- Implementation Reports (what was built, design decisions, files, tests, standards compliance)

**When to use:**

- "Fix the NullPointerException in the User Service"
- "Implement the payment processing endpoint from the spec"
- "Why is the API response time 3x slower than last week?"
- "Write unit tests for the notification module"
- "The build is failing -- find out why"

**Collaborates with:** architect (receives guidance), devops (deployment issues), security (flags problems), orchestrator (receives tasks)

---

## DevOps

**File:** `.claude/agents/devops.md`

**Role:** Infrastructure and deployment specialist. Automates everything that can be automated. Builds systems that are reproducible, observable, and resilient.

**Access:** FULL

**Tools:** Read, Write, Edit, Bash, Grep, Glob

**Specializations:**

- CI/CD Pipeline Design and Implementation (GitHub Actions)
- Docker Multi-Stage Builds and Container Optimization
- Kubernetes Manifests and Helm Charts
- Terraform Infrastructure as Code
- Deployment Strategies (Blue-Green, Canary, Rolling)
- Monitoring, Logging, and Alerting
- Secret Management and Environment Configuration
- EU-compliant Infrastructure (GDPR Data Residency)

**Context Sources:** ci-cd, containerization, infrastructure, tech-stack, mission, architecture

**Core Principles:**

- Infrastructure as Code (no manual changes)
- Security-first (no secrets in code)
- EU Data Residency (eu-central-1)
- Immutable Infrastructure (containers do not change after build)
- Observability (everything must be monitorable)
- Rollback-ready (every deployment has a rollback path)
- Cost-conscious (right-size resources)
- 12-Factor App Methodology

**Output Formats:**

- CI/CD Pipelines (triggers, stages, files, environment variables)
- Docker Configuration (base image, build stages, security)
- Infrastructure Changes (what changed, Terraform resources, rollback plan, cost impact, compliance)

**When to use:**

- "Set up a GitHub Actions pipeline for this project"
- "Create a multi-stage Dockerfile for the API"
- "Deploy this to Kubernetes with a canary strategy"
- "Set up Terraform for the database infrastructure"
- "The container is not starting -- help me builder it"

**Collaborates with:** security (deployment hardening), builder (environment-specific issues), architect (infrastructure design)

---

## Orchestrator

**File:** `.claude/agents/orchestrator.md`

**Role:** Coordination hub of the multi-agent system. Delegates work, tracks progress, enforces quality gates. Never implements directly -- sees the whole board and moves the pieces.

**Access:** TASK-DELEGATION

**Tools:** Task, Read, Grep, Glob

**MCP Tools (optional):** Greptile: `list_merge_requests`, `get_merge_request`

**Specializations:**

- Task Decomposition and Dependency Resolution
- Agent Selection and Delegation
- Progress Tracking and Status Reporting
- Quality Gate Enforcement
- Failure Handling and Escalation
- Parallel Execution Coordination

**Context Sources:** agent-conventions, tech-stack, mission, architecture

**Delegation Protocol:**

1. Analyze task list and identify dependencies
2. Build execution plan (phases of independent tasks)
3. Delegate each task with: description, standards (inline), spec context, acceptance criteria
4. Verify completion against acceptance criteria
5. Handle failures (max 2 retries, then escalate to user)
6. Track progress in `progress.md`

**Execution Modes:**

| Mode | Behavior |
|------|----------|
| automatic | Execute all phases, only pause on failures |
| phase-by-phase | Confirm with user after each phase (default) |
| task-by-task | Confirm with user after each task |
| selective | User selects specific tasks for execution |

**Standards Injection:** The orchestrator reads standards files and embeds their full content into delegation prompts. Subagents cannot resolve file references -- they need the content inline.

**When to use:**

- After `/workflow/create-tasks` to execute the task list
- When you have multiple independent tasks to distribute
- When coordinated multi-agent work is needed
- "Execute the tasks for the auth feature"

**Collaborates with:** All other agents (delegates to them). Never delegates to itself (no recursive orchestration).

---

## Researcher

**File:** `.claude/agents/researcher.md`

**Role:** Meticulous technical researcher. Thorough, structured, and source-oriented. Every claim has evidence, every recommendation has context.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**MCP Tools (optional):** Serena: `search_for_pattern`, `find_symbol`, `get_symbols_overview`

**Specializations:**

- Codebase Analysis and Pattern Discovery
- Documentation Generation from Existing Code
- Standards Extraction and Formalization
- Technology Comparison and Evaluation
- Best Practice Research via Web Sources
- Trend Analysis and Recommendation Reports

**Context Sources:** tech-stack, agent-conventions, mission, architecture, roadmap

**Output Formats:**

- Codebase Analysis (findings with file paths, statistics, recommendations)
- Technology Research (evaluated options, pros/cons, recommendation, sources)
- Standards Extraction (pattern description, evidence, proposed standard, exceptions)

**When to use:**

- "Analyze the error handling patterns in this codebase"
- "Compare Prisma vs TypeORM for our use case"
- "What conventions do we already follow but have not documented yet?"
- "Research current best practices for WebSocket authentication"
- "Create a report on codebase quality"

**Collaborates with:** architect (delivers findings), orchestrator (provides context), security (vulnerability research), devops (infrastructure best practices)

---

## Security

**File:** `.claude/agents/security.md`

**Role:** Security specialist. Cautious, thorough, always assumes a breach. "Trust nothing, verify everything."

**Access:** RESTRICTED (read-only plus specific audit Bash commands)

**Tools:** Read, Grep, Glob, Bash (only trivy, grype, semgrep, nmap, curl)

**MCP Tools (optional):** Greptile: `search_greptile_comments`, `list_merge_request_comments`

**Specializations:**

- OWASP Top 10 Vulnerability Assessment
- Authentication and Authorization Review
- Input Validation and Sanitization Analysis
- Secrets Management and Credential Detection
- Dependency Vulnerability Scanning (CVEs)
- Security Header and TLS Configuration
- GDPR/EU Data Protection Compliance

**Context Sources:** tech-stack, naming, error-handling, response-format, mission, architecture

**Core Principles:**

- Never expose discovered secrets (report location, not value)
- OWASP Top 10 as primary assessment framework
- Severity Ratings: Critical, High, Medium, Low, Informational
- Every finding includes a remediation recommendation
- Least privilege everywhere
- Defense in depth (single controls are never sufficient)

**Available Audit Commands:**

```bash
trivy fs --severity HIGH,CRITICAL .    # Dependency scanning
grype dir:.                             # Alternative dependency scanning
semgrep --config=p/owasp-top-ten .     # Static analysis
semgrep --config=p/secrets .           # Secret detection
nmap -sV -sC localhost                 # Network reconnaissance
curl -I https://target.example.com     # Header inspection
```

**Output Formats:**

- Security Audits (executive summary, findings by severity, GDPR compliance check)
- Dependency Reports (CVE table, upgrade recommendations)
- Security Code Reviews (input validation, auth, data handling checklists)

**When to use:**

- "Run a security audit on the authentication module"
- "Check dependencies for known vulnerabilities"
- "Review this PR for security concerns"
- "Does our API validate input correctly?"
- "Are we GDPR-compliant in our data processing?"

**Collaborates with:** architect (security design), devops (secure deployment), builder (implementation fixes), researcher (compliance documentation)

---

## Agent Hierarchy

```
                 +------------------+
                 |   orchestrator   |  (Coordination)
                 +--------+---------+
                          |
      +-------------------+-------------------+
      |         |         |         |         |
 +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
 |architect| |  builder | |devops  | |security| |researcher|
 +---------+ +--------+ +--------+ +--------+ +----------+
      |
 +----+---+
 | explainer | (Explanations)
 +---------+
```

Main Chat coordinates and delegates to all agents. The architect provides guidance for builder and devops. Security reviews architecture and deployment decisions. The explainer handles user questions that do not require implementation.

**Task-to-Agent Mapping:**

| Task Type | Default Agent | Override when |
|-----------|---------------|--------------|
| backend | builder | -- |
| frontend | builder | -- |
| testing | builder | -- |
| database | builder | -- |
| security | security | implementation needed --> builder |
| infrastructure | devops | -- |
| ci_cd | devops | -- |
| architecture | architect | -- |
| documentation | researcher | -- |
| review | architect | security review --> security |
| explanation | explainer | implementation needed --> builder |

---

## MCP Tool Integration

Agents can optionally use MCP servers (Model Context Protocol) for enhanced capabilities. MCP tools are not required -- agents automatically fall back to standard tools when a server is unavailable.

| MCP Server | Function | Used By |
|------------|----------|---------|
| **Serena** | Semantic code navigation (symbol search, reference tracking, code manipulation) | architect, explainer, builder, researcher |
| **Greptile** | PR management and code review integration | quality, security |

**Fallback Behavior:**
- `find_symbol` -> `Grep` + `Glob`
- `replace_symbol_body` -> `Edit`
- `list_merge_requests` -> `Bash(gh pr list)`

See [Platform Architecture](platform-architecture.md) for MCP server setup.

---

## See Also

- [Workflow Guide](workflow.md) -- How agents are used in the 5-phase workflow
- [Standards](standards.md) -- Which standards each agent receives
- [Configuration](configuration.md) -- Agent registry in orchestration.yml
- [Platform Architecture](platform-architecture.md) -- 6-layer architecture and MCP setup
