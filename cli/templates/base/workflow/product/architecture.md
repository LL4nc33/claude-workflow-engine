# System Architecture

## Overview

```
+-------------------+     +-------------------+     +-------------------+
|  Workflow Engine   |     |  Claude Code      |     |  Specialized      |
|  (Standards +     |---->|  (Skills +        |---->|  Agents           |
|   Specs)          |     |   Commands)       |     |  (Execution)      |
+-------------------+     +-------------------+     +-------------------+
```

## 3-Layer Context Model

```
Layer 1: Standards (HOW)
├── global/         → Cross-cutting conventions
├── devops/         → CI/CD, containers, IaC
└── agents/         → Agent definition patterns

Layer 2: Product (WHAT & WHY)
├── mission.md      → Purpose and target users
├── roadmap.md      → Phased development plan
└── architecture.md → This file

Layer 3: Specs (WHAT NEXT)
└── {timestamp}-{feature}/
    ├── plan.md
    ├── shape.md
    ├── references.md
    └── standards.md
```

## Agent Permission Model

| Agent        | Access Level    | Tools                          |
|-------------|-----------------|--------------------------------|
| architect   | READ-ONLY       | Read, Grep, Glob              |
| explainer         | READ-ONLY       | Read, Grep, Glob              |
| builder       | FULL            | Read, Write, Edit, Bash, Grep |
| orchestrator| TASK-DELEGATION | Task, Read, Grep, Glob        |
| researcher  | READ-ONLY       | Read, Grep, Glob, WebFetch    |
| security    | READ-ONLY       | Read, Grep, Glob, Bash(audit) |
| devops      | FULL            | All tools                     |

## Integration Flow

```
1. /shape-spec    → Creates specification (Plan mode)
2. architect      → Reviews for architectural soundness
3. security       → Reviews for vulnerabilities
4. orchestrator   → Delegates tasks to specialists
5. devops/builder   → Executes implementation
6. /inject-standards → Ensures compliance during implementation
```

## Data Flow and Privacy

- All workflow data is LOCAL ONLY (no cloud sync)
- Standards and specs live in version control
- Sensitive config uses .local.md files (gitignored)
- No PII in standards or spec examples
- Claude API calls: code context only, zero-retention option available
