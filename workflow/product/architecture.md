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
| builder     | FULL            | Read, Write, Edit, Bash, Grep |
| devops      | FULL            | All tools                     |
| explainer   | READ-ONLY       | Read, Grep, Glob              |
| guide       | READ-ONLY       | Read, Grep, Glob              |
| innovator   | READ-ONLY       | Read, Grep, Glob, WebSearch   |
| quality     | READ-ONLY       | Read, Grep, Glob, Bash(test)  |
| researcher  | READ-ONLY       | Read, Grep, Glob, WebFetch    |
| security    | RESTRICTED      | Read, Grep, Glob, Bash(audit) |

## Integration Flow

```
1. /shape-spec    → Creates specification (Plan mode)
2. architect      → Reviews for architectural soundness
3. security       → Reviews for vulnerabilities
4. Main Chat      → Delegates tasks to specialists
5. devops/builder → Executes implementation
6. quality        → Validates test coverage and quality gates
7. /inject-standards → Ensures compliance during implementation
```

## Data Flow and Privacy

- All workflow data is LOCAL ONLY (no cloud sync)
- Standards and specs live in version control
- Sensitive config uses .local.md files (gitignored)
- No PII in standards or spec examples
- Claude API calls: code context only, zero-retention option available
