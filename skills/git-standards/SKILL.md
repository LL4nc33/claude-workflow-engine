---
name: git-standards
description: >
  Use PROACTIVELY when writing commit messages, creating branches,
  or preparing releases. Enforces Conventional Commits and branch naming.
  Enforced via PreToolUse hooks on git commit and git checkout -b.
---

# Git Standards

Consistent git practices for all CWE-managed projects.

## Conventional Commits

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, tooling |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change, no feature/fix |
| `test` | Adding/fixing tests |
| `perf` | Performance improvement |
| `ci` | CI/CD configuration |
| `build` | Build system changes |
| `revert` | Reverting previous commit |

### Rules

1. **Type is required** — must be one of the types above
2. **Scope is optional** — module/component name in parentheses
3. **Subject is required** — imperative mood, lowercase, no period
4. **Body is optional** — explain "why", not "what"
5. **Breaking changes** — add `!` after type/scope: `feat!: remove v1 API`
6. **Footer** — `BREAKING CHANGE:`, `Closes #123`, `Co-Authored-By:`

### Examples

```
feat(auth): add JWT token refresh
fix: prevent crash when user has no profile
docs: update API endpoint documentation
refactor(api): extract validation middleware
chore: update dependencies to latest versions
feat!: drop Node.js 16 support
```

## Branch Naming

### Patterns

| Pattern | Purpose |
|---------|---------|
| `main` | Production branch |
| `develop` | Integration branch |
| `feature/<ticket>-<description>` | New features |
| `fix/<ticket>-<description>` | Bug fixes |
| `hotfix/<description>` | Urgent production fixes |
| `chore/<description>` | Maintenance |
| `release/<version>` | Release preparation |

### Rules

1. All lowercase
2. Hyphens for word separation (not underscores)
3. Prefix required (feature/, fix/, etc.) except for main/develop
4. Short, descriptive slug after prefix

### Examples

```
feature/123-user-authentication
fix/456-login-crash
hotfix/session-timeout
chore/update-dependencies
release/0.4.2
```

## Auto-Generated Release Notes

Triggered by `/cwe:devops release`:

1. Parse commits since last git tag
2. Group by type:
   - **Features** (feat)
   - **Bug Fixes** (fix)
   - **Performance** (perf)
   - **Breaking Changes** (feat!, fix!, BREAKING CHANGE)
   - **Other** (chore, docs, style, refactor, test, ci, build)
3. Generate CHANGELOG.md entry
4. Create git tag `v<VERSION>`

## Enforcement

- **Commit format**: PreToolUse hook validates on `git commit`
- **Branch naming**: PreToolUse hook validates on `git checkout -b` / `git switch -c`
- **Bypass**: `--no-verify` for emergencies (gets logged)
