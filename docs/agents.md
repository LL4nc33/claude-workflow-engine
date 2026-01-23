# Agents

Claude Workflow Engine includes 7 specialized agents, each with a defined role, access level, and toolset. Agents are defined as markdown files in `.claude/agents/` and are automatically available as Claude Code subagents.

## Agent overview

| Agent | Access | Purpose | Tools |
|-------|--------|---------|-------|
| [architect](#architect) | READ-ONLY | System design, ADRs, API review | Read, Grep, Glob, WebSearch, WebFetch |
| [ask](#ask) | READ-ONLY | Explanations, learning | Read, Grep, Glob |
| [debug](#debug) | FULL | Bug investigation, implementation | Read, Write, Edit, Bash, Grep, Glob |
| [devops](#devops) | FULL | CI/CD, Docker, K8s, IaC | Read, Write, Edit, Bash, Grep, Glob |
| [orchestrator](#orchestrator) | TASK-DELEGATION | Coordination, delegation | Task, Read, Grep, Glob |
| [researcher](#researcher) | READ-ONLY | Analysis, documentation | Read, Grep, Glob, WebSearch, WebFetch |
| [security](#security) | RESTRICTED | OWASP audits, vulnerability scanning | Read, Grep, Glob, Bash (security tools only) |

## Access levels explained

- **READ-ONLY**: Can read and search files, but cannot modify anything
- **FULL**: Can read, write, edit, and execute commands
- **TASK-DELEGATION**: Can read files and delegate tasks to other agents via the Task tool
- **RESTRICTED**: Read-only plus a limited set of Bash commands (security scanning tools only)

---

## Architect

**File:** `.claude/agents/architect.md`

**Role:** Senior systems architect. Thinks in systems, not files. Analyzes, recommends, and documents architectural decisions.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**Specializations:**

- Architecture Decision Records (ADRs)
- System design and component decomposition
- API design review and consistency checks
- Dependency analysis and technology evaluation
- Trade-off analysis (scalability, maintainability, performance)

**Context sources:** tech-stack, agent-conventions, mission, architecture, roadmap

**Output formats:**

- Architecture Reviews (current state, observations, recommendations, risks)
- ADRs (status, context, decision, consequences)
- API Reviews (consistency check, suggestions)

**When to use:**

- "How should I architect the notification system?"
- "Review the API design for consistency"
- "What are the trade-offs between PostgreSQL and MongoDB here?"
- "Create an ADR for switching to event-driven architecture"

**Collaborates with:** security (architecture review), debug (provides guidance), devops (infrastructure design), researcher (pattern documentation)

---

## Ask

**File:** `.claude/agents/ask.md`

**Role:** Patient technical educator. Explains complex things simply without being condescending.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob

**Specializations:**

- Code walkthroughs and explanations
- Concept clarification (basics to advanced)
- Pattern identification and explanation
- Decision rationale documentation

**Context sources:** tech-stack, mission, architecture

**Output formats:**

- Code Explanations (TL;DR, how it works, why this way, related)
- Concept Explanations (simple terms, in this project, example, further reading)
- How-to Guides (quick answer, step by step, pitfalls, standards)

**When to use:**

- "How does the authentication middleware work?"
- "Explain the observer pattern as used in this project"
- "What does this regex do?"
- "Why was Redis chosen over Memcached?"

**Collaborates with:** architect (for "why" questions), researcher (for deep dives), debug (when questions become tasks)

---

## Debug

**File:** `.claude/agents/debug.md`

**Role:** Methodical debugging specialist and implementation expert. Full filesystem access for code modification.

**Access:** FULL

**Tools:** Read, Write, Edit, Bash, Grep, Glob

**Specializations:**

- Hypothesis-driven bug investigation
- Root cause analysis (not symptom treatment)
- Performance profiling and optimization
- Test writing and regression prevention
- Code implementation from specs

**Context sources:** tech-stack, naming, error-handling, response-format, migrations, components, coverage, mission, architecture

**Debugging methodology:**

1. **REFLECT** - Expected vs actual behavior, when it started, reproducibility
2. **HYPOTHESIZE** - Rank causes by probability with evidence
3. **DIAGNOSE** - Design tests to prove/disprove each hypothesis
4. **ISOLATE** - Create minimal reproduction, verify fix in isolation
5. **FIX** - Implement minimal fix, add regression test, document

**Output formats:**

- Bug Reports (symptoms, root cause, fix applied, prevention, regression test)
- Implementation Reports (what was built, design decisions, files, testing, standards compliance)

**When to use:**

- "Fix the null pointer exception in the user service"
- "Implement the payment processing endpoint from the spec"
- "Why is the API response time 3x slower than last week?"
- "Write unit tests for the notification module"

**Collaborates with:** architect (gets guidance), devops (deployment issues), security (flags issues), orchestrator (receives tasks)

---

## DevOps

**File:** `.claude/agents/devops.md`

**Role:** Infrastructure and deployment specialist. Automates everything that can be automated.

**Access:** FULL

**Tools:** Read, Write, Edit, Bash, Grep, Glob

**Specializations:**

- CI/CD pipeline design (GitHub Actions)
- Docker multi-stage builds and optimization
- Kubernetes manifests and Helm charts
- Terraform Infrastructure as Code
- Deployment strategies (blue-green, canary, rolling)
- Monitoring, logging, and alerting
- EU-compliant infrastructure (GDPR data residency)

**Context sources:** ci-cd, containerization, infrastructure, tech-stack, mission, architecture

**Key principles:**

- Infrastructure as Code (no manual changes)
- Security-first (no secrets in code)
- EU data residency (eu-central-1)
- Immutable infrastructure
- Observability (everything must be monitorable)
- Rollback-ready (every deployment has a rollback path)

**Output formats:**

- CI/CD Pipelines (trigger, stages, files, environment variables)
- Docker Configuration (base image, build stages, security)
- Infrastructure Changes (what changed, terraform resources, rollback plan, cost impact)

**When to use:**

- "Set up a GitHub Actions pipeline for this project"
- "Create a multi-stage Dockerfile for the API"
- "Deploy this to Kubernetes with a canary strategy"
- "Set up Terraform for the database infrastructure"

**Collaborates with:** security (deployment hardening), debug (environment issues), architect (infrastructure design)

---

## Orchestrator

**File:** `.claude/agents/orchestrator.md`

**Role:** Coordination hub. Delegates work, tracks progress, enforces quality gates. Never implements directly.

**Access:** TASK-DELEGATION

**Tools:** Task, Read, Grep, Glob

**Specializations:**

- Task decomposition and dependency resolution
- Agent selection and delegation
- Progress tracking and status reporting
- Quality gate enforcement
- Failure handling and escalation
- Parallel execution coordination

**Context sources:** agent-conventions, tech-stack, mission, architecture

**Delegation protocol:**

1. Analyze task list and identify dependencies
2. Build execution plan (phases of independent tasks)
3. Delegate each task with: description, standards (inline), spec context, acceptance criteria
4. Verify completion against acceptance criteria
5. Handle failures (retry up to 2x, then escalate)
6. Track progress in `progress.md`

**Execution modes:** automatic, phase-by-phase, task-by-task, selective

**Standards injection:** The orchestrator reads standards files and pastes their full content into delegation prompts. Subagents cannot read file references.

**When to use:**

- After `/workflow/create-tasks` to execute the task list
- When you have multiple independent tasks to distribute
- When you need coordinated multi-agent work

**Collaborates with:** All other agents (delegates to them). Never delegates to itself.

---

## Researcher

**File:** `.claude/agents/researcher.md`

**Role:** Meticulous technical researcher. Thorough, structured, and citation-oriented. Every claim has evidence.

**Access:** READ-ONLY

**Tools:** Read, Grep, Glob, WebSearch, WebFetch

**Specializations:**

- Codebase analysis and pattern discovery
- Documentation generation from existing code
- Standards extraction and formalization
- Technology comparison and evaluation
- Best practice research via web sources

**Context sources:** tech-stack, agent-conventions, mission, architecture, roadmap

**Output formats:**

- Codebase Analysis (findings with file paths, statistics, recommendations)
- Technology Research (options evaluated, pros/cons, recommendation, sources)
- Standards Extraction (pattern description, evidence, proposed standard, exceptions)

**When to use:**

- "Analyze the error handling patterns in this codebase"
- "Compare Prisma vs TypeORM for our use case"
- "What conventions are we already following but haven't documented?"
- "Research current best practices for WebSocket authentication"

**Collaborates with:** architect (feeds findings), orchestrator (provides context), security (vulnerability research), devops (infrastructure best practices)

---

## Security

**File:** `.claude/agents/security.md`

**Role:** Security specialist. Cautious, thorough, assumes breach. "Trust nothing, verify everything."

**Access:** RESTRICTED (Read-only + specific audit Bash commands)

**Tools:** Read, Grep, Glob, Bash (trivy, grype, semgrep, nmap, curl only)

**Specializations:**

- OWASP Top 10 vulnerability assessment
- Authentication and authorization review
- Input validation and sanitization analysis
- Secrets management and credential detection
- Dependency vulnerability scanning (CVEs)
- Security header and TLS configuration
- GDPR/EU data protection compliance

**Context sources:** tech-stack, naming, error-handling, response-format, mission, architecture

**Key principles:**

- Never expose found secrets (report location, not value)
- OWASP Top 10 as primary framework
- Severity ratings: Critical, High, Medium, Low, Informational
- Every finding includes remediation
- Least privilege everywhere
- Defense in depth

**Available audit commands:**

```bash
trivy fs --severity HIGH,CRITICAL .    # Dependency scanning
grype dir:.                             # Alternative dependency scanning
semgrep --config=p/owasp-top-ten .     # Static analysis
semgrep --config=p/secrets .           # Secret detection
nmap -sV -sC localhost                 # Network recon
curl -I https://target.example.com     # Header inspection
```

**Output formats:**

- Security Audits (executive summary, findings by severity, GDPR compliance check)
- Dependency Reports (CVE table, upgrade recommendations)
- Security Code Reviews (input validation, auth, data handling checklists)

**When to use:**

- "Run a security audit on the authentication module"
- "Check dependencies for known vulnerabilities"
- "Review this PR for security concerns"
- "Is our API properly validating input?"

**Collaborates with:** architect (security design), devops (secure deployment), debug (implementation fixes), researcher (compliance documentation)

---

## Agent hierarchy

```
                 +------------------+
                 |   orchestrator   |  (Coordination)
                 +--------+---------+
                          |
      +-------------------+-------------------+
      |         |         |         |         |
 +----+---+ +---+----+ +-+------+ +-+------+ +---+-----+
 |architect| |  debug | |devops  | |security| |researcher|
 +---------+ +--------+ +--------+ +--------+ +----------+
      |
 +----+---+
 |  ask   |  (Explanations)
 +---------+
```

The orchestrator delegates to all other agents. The architect provides guidance to debug and devops. Security reviews architecture and deployment decisions. The ask agent handles user questions that don't require implementation.

## See also

- [Workflow Guide](workflow.md) - How agents are used in the 5-phase workflow
- [Standards](standards.md) - Which standards each agent receives
- [Configuration](configuration.md) - Agent registry in orchestration.yml
