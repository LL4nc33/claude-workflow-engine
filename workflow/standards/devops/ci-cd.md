# CI/CD Pipeline Standards

## GitHub Actions Conventions

- Use composite actions for reusable workflows
- Pin action versions to full SHA, not tags
- Cache dependencies (npm, pip, docker layers)
- Run tests before build, build before deploy
- Use environment protection rules for production

## Pipeline Structure

```yaml
# Standard job ordering
jobs:
  lint → test → build → security-scan → deploy
```

- Fail fast: lint and test run first
- Security scanning before any deployment
- Use matrix builds for multi-version testing
- Artifacts: upload build outputs between jobs

## Deployment Patterns

- Blue-green or canary for zero-downtime
- Always include rollback mechanism
- Use `--dry-run` equivalent before destructive operations
- Tag images with git SHA, not `latest`
- Environment variables via secrets, never hardcoded

## Branch Strategy

- `main` = production-ready
- `develop` = integration branch
- Feature branches: `feature/description`
- Hotfix branches: `hotfix/description`
- PR required for main, auto-merge for passing checks on develop
