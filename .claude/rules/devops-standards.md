---
paths:
  - "**/docker*"
  - "**/Dockerfile*"
  - "**/.github/**"
  - "**/terraform/**"
  - "**/k8s/**"
  - "**/docker-compose*.yml"
  - "**/.github/**/*.yml"
---

# DevOps Standards

## CI/CD
- Fail fast: lint → test → build → security-scan → deploy
- Pin action versions to SHA
- Tag images with git SHA, never `latest`
- Include rollback mechanisms

## Containers
- Multi-stage builds, Alpine base, non-root user
- HEALTHCHECK required
- Scan images before push
- Set resource limits

## Infrastructure
- IaC for everything, remote state
- Encryption at rest and in transit
- Observability: structured logs + metrics + traces (pick any stack — Prometheus/Grafana/OTel, Datadog, CloudWatch, etc.)
- For data-residency requirements (GDPR EU-only, HIPAA US-BA, country-bound clouds), set this in a project-specific `compliance-standards.md` or `infra-standards.md`

