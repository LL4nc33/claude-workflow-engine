---
description: Delegate to devops agent - CI/CD, Docker, infrastructure, releases
allowed-tools: ["Task"]
---

# DevOps

Delegate to the **devops** agent for infrastructure work.

**Usage:** `/cwe:devops <task>`

## Examples

- `/cwe:devops setup Docker for the project`
- `/cwe:devops create GitHub Actions pipeline`
- `/cwe:devops prepare release v1.0.0`

## Process

Delegate using the Task tool:

```
subagent_type: devops
prompt: [user's task]
```

The devops agent has:
- Full filesystem access for infrastructure code
- Docker, Kubernetes, Terraform expertise
- Release management (version bumps, changelogs, tags)
