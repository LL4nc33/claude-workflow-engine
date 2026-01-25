# Agents

Claude Workflow Engine includes 9 specialized agents, each with a defined role, access level, and toolset. Agents are defined as Markdown files in `.claude/agents/` and are automatically available as Claude Code subagents.

**Note:** Orchestration is handled directly by Main Chat, not by a dedicated agent.

## Overview

| Agent | Access | Purpose | Tools | MCP Tools |
|-------|--------|---------|-------|-----------|
| [architect](#architect) | READ-ONLY | System Design, ADRs, API Review | Read, Grep, Glob, WebSearch, WebFetch | Serena: find_symbol, get_symbols_overview, find_referencing_symbols |
| [builder](#builder) | FULL | Bug Investigation, Implementation | Read, Write, Edit, Bash, Grep, Glob | Serena: find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview |
| [devops](#devops) | FULL | CI/CD, Docker, K8s, IaC | Read, Write, Edit, Bash, Grep, Glob | - |
| [explainer](#explainer) | READ-ONLY | Explanations, Learning | Read, Grep, Glob | Serena: get_symbols_overview, find_symbol |
| [guide](#guide) | READ-ONLY | NaNo Evolution, Pattern-to-Standards | Read, Grep, Glob | Serena: search_for_pattern, get_symbols_overview |
| [innovator](#innovator) | READ-ONLY | Brainstorming, Creative Solutions | Read, Grep, Glob, WebSearch, WebFetch | - |
| [quality](#quality) | READ-ONLY | Testing, Coverage, Quality Gates | Read, Grep, Glob, Bash (test tools) | Greptile: search_greptile_comments |
| [researcher](#researcher) | READ-ONLY | Analysis, Documentation | Read, Grep, Glob, WebSearch, WebFetch | Serena: search_for_pattern, find_symbol, get_symbols_overview |
| [security](#security) | RESTRICTED | OWASP Audits, Vulnerability Scanning | Read, Grep, Glob, Bash (security tools only) | Greptile: search_greptile_comments, list_merge_request_comments |

## Access Levels

| Level | Meaning | Agents |
|-------|---------|--------|
| **READ-ONLY** | Can read and search files, but cannot modify anything | architect, explainer, guide, innovator, quality, researcher |
| **FULL** | Can read, write, edit, and execute commands | builder, devops |
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

**When to use:**

- "How should I architect the notification system?"
- "Review the API design for consistency"
- "What are the trade-offs between PostgreSQL and MongoDB here?"
- "Create an ADR for the switch to event-driven architecture"

**Collaborates with:** Main Chat (receives tasks), security (architecture review), builder (provides guidance), devops (infrastructure design), innovator (reviews concepts), quality (architectural quality gates)

---

## Builder

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

**When to use:**

- "Fix the NullPointerException in the User Service"
- "Implement the payment processing endpoint from the spec"
- "Why is the API response time 3x slower than last week?"
- "Write unit tests for the notification module"

**Collaborates with:** Main Chat (receives tasks), architect (receives guidance), devops (deployment issues), security (flags problems), quality (test coverage)

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
- EU-compliant Infrastructure (GDPR Data Residency)

**Context Sources:** ci-cd, containerization, infrastructure, tech-stack, mission, architecture

**When to use:**

- "Set up a GitHub Actions pipeline for this project"
- "Create a multi-stage Dockerfile for the API"
- "Deploy this to Kubernetes with a canary strategy"
- "Set up Terraform for the database infrastructure"

**Collaborates with:** Main Chat (receives tasks), security (deployment hardening), builder (environment-specific issues), architect (infrastructure design), quality (CI quality gates)

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

**When to use:**

- "How does the authentication middleware work?"
- "Explain the Observer Pattern as used in this project"
- "What does this regex do?"
- "Why was Redis chosen over Memcached?"

**Collaborates with:** Main Chat (question routing), architect (for "why" questions), researcher (for deep dives), builder (when questions become implementation tasks), innovator (explains creative concepts)

---

## Guide

**File:** `.claude/agents/guide.md`

**Role:** Process coach and learning specialist. Analyzes NaNo patterns and extracts standards from successful practices.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob

**MCP Tools (optional):** Serena: `search_for_pattern`, `get_symbols_overview`

**Specializations:**

- Pattern recognition from historical data
- Standards extraction from successful practices
- Workflow optimization and efficiency
- Anti-pattern detection and remediation
- Continuous improvement facilitation

**Context Sources:** agent-conventions, tech-stack, mission, roadmap

**When to use:**

- "Analyze the delegation patterns from recent sessions"
- "What standards are we missing based on repeated decisions?"
- "What are the anti-patterns in our workflow?"
- "Suggest improvements for the development process"

**Collaborates with:** Main Chat (process insights), researcher (data supply), architect (standards review), quality (metrics trends)

---

## Innovator

**File:** `.claude/agents/innovator.md`

**Role:** Creative technologist and ideation specialist. Generates possibilities others don't see.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**Specializations:**

- Divergent thinking and brainstorming
- Alternative solution generation
- "What if" scenario exploration
- Cross-domain inspiration
- Feature ideation and concepting

**Context Sources:** mission, roadmap, tech-stack

**When to use:**

- "Brainstorm alternatives for the authentication system"
- "What if we didn't need a server?"
- "What innovative approaches exist for this problem?"
- "Generate feature ideas for the next release"

**Collaborates with:** Main Chat (ideation requests), architect (concept validation), researcher (prior art research), builder (feasibility), security (security implications)

---

## Quality

**File:** `.claude/agents/quality.md`

**Role:** QA engineer and code health guardian. Validates test coverage, analyzes metrics, and enforces quality gates.

**Access:** READ-ONLY (plus test commands)

**Tools:** Read, Grep, Glob, Bash (jest, npm test, nyc)

**MCP Tools (optional):** Greptile: `search_greptile_comments`

**Specializations:**

- Test coverage analysis and trending
- Code complexity metrics (cyclomatic, cognitive)
- Flaky test detection and remediation
- Quality gate enforcement
- Technical debt assessment

**Context Sources:** coverage, tech-stack, naming, mission

**When to use:**

- "What is the current test coverage?"
- "Which functions have excessive complexity?"
- "Are there flaky tests?"
- "Check if we are release-ready"

**Collaborates with:** Main Chat (quality validation), builder (coverage issues), architect (structural complexity), devops (CI quality gates), researcher (metrics documentation)

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

**Context Sources:** tech-stack, agent-conventions, mission, architecture, roadmap

**When to use:**

- "Analyze the error handling patterns in this codebase"
- "Compare Prisma vs TypeORM for our use case"
- "What conventions do we already follow but have not documented yet?"
- "Research current best practices for WebSocket authentication"

**Collaborates with:** architect (delivers findings), Main Chat (provides context), security (vulnerability research), devops (infrastructure best practices), guide (pattern data), innovator (prior art)

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
- GDPR/EU Data Protection Compliance

**Context Sources:** tech-stack, naming, error-handling, response-format, mission, architecture

**When to use:**

- "Run a security audit on the authentication module"
- "Check dependencies for known vulnerabilities"
- "Review this PR for security concerns"
- "Are we GDPR-compliant in our data processing?"

**Collaborates with:** Main Chat (receives tasks), architect (security design), devops (secure deployment), builder (implementation fixes), researcher (compliance documentation), quality (security quality gates)

---

## Agent Hierarchy

```
                         +-------------+
                         |  Main Chat  |  (Orchestration)
                         +------+------+
                                |
    +-------+-------+-------+---+---+-------+-------+-------+
    |       |       |       |       |       |       |       |
+---+---+ +-+--+ +--+--+ +--+---+ +-+--+ +--+---+ +--+--+ +-+---+
|architect|builder|devops|explainer|guide|innovator|quality|researcher|
+---------+------+------+---------+-----+---------+-------+----------+
                                                              |
                                                         +----+----+
                                                         | security |
                                                         +----------+
```

Main Chat orchestrates all agents. The architect provides guidance for builder and devops. Security reviews architecture and deployment decisions. Quality monitors test coverage and code health. Guide analyzes patterns for process improvement.

**Task-to-Agent Mapping:**

| Task Type | Default Agent | Override when |
|-----------|---------------|--------------|
| backend | builder | security_sensitive --> security |
| frontend | builder | -- |
| testing | builder | coverage_analysis --> quality |
| database | builder | schema_breaking --> architect |
| security | security | implementation_needed --> builder |
| infrastructure | devops | -- |
| ci_cd | devops | -- |
| architecture | architect | -- |
| documentation | researcher | -- |
| review | architect | security_review --> security |
| explanation | explainer | implementation_needed --> builder |
| quality_assurance | quality | -- |
| ideation | innovator | -- |
| process_evolution | guide | -- |

---

## MCP Tool Integration

Agents can optionally use MCP servers (Model Context Protocol) for enhanced capabilities. MCP tools are not required -- agents automatically fall back to standard tools when a server is unavailable.

| MCP Server | Function | Used By |
|------------|----------|---------|
| **Serena** | Semantic code navigation (symbol search, reference tracking, code manipulation) | architect, explainer, builder, researcher, guide, quality |
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
