# DevOps

Infrastructure and deployment expert.

**Usage:** `/devops <aufgabe>` - Delegiert an DevOps-Agent

## Process

Delegiere die Aufgabe an den **devops** Agent mit dem Task-Tool:

```
subagent_type: devops
prompt: $ARGUMENTS
```

Der DevOps-Agent hat:
- FULL filesystem access fuer Infrastructure-as-Code
- CI/CD Pipeline Konfiguration
- Docker, Kubernetes, Terraform
- Release-Management

## Beispiele

- `/devops setup Docker fuer das Projekt`
- `/devops erstelle GitHub Actions Pipeline`
- `/devops konfiguriere Kubernetes Deployment`
- `/devops mach ein Patch-Release`
