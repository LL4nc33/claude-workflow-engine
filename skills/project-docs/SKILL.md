---
name: project-docs
description: >
  Use when docs need updating: README generation, docs freshness checks,
  tech stack badge detection, architecture diagram updates.
  Triggered by researcher (docs update|check) or devops (release).
allowed-tools: ["Read", "Write", "Edit", "Glob", "Bash"]
---

# Project Documentation Skill

Generate and maintain project documentation from source truth.

## When to Use

- After `/cwe:init` — generate initial docs from mission.md
- After spec completion — update docs to reflect new features
- After release — update VERSION references, CHANGELOG
- On `docs update` — full refresh
- On `docs check` — validate freshness

## README Generation

### Step 1: Gather Project Metadata

Read these files (if they exist):
- `VERSION` — current version
- `workflow/product/mission.md` — vision, goals
- `workflow/config.yml` — project config
- `package.json` / `Cargo.toml` / `go.mod` / `pyproject.toml` — tech stack
- `Dockerfile` — containerization
- `.github/workflows/` — CI/CD

### Step 2: Auto-Detect Tech Stack

Scan project root for indicators:

| File | Technology | Badge |
|------|-----------|-------|
| `package.json` | Node.js | `node`, `npm`/`yarn`/`pnpm` |
| `tsconfig.json` | TypeScript | `typescript` |
| `Cargo.toml` | Rust | `rust` |
| `go.mod` | Go | `go` |
| `pyproject.toml` / `requirements.txt` | Python | `python` |
| `Dockerfile` | Docker | `docker` |
| `.github/workflows/` | GitHub Actions | `actions` |
| `terraform/` | Terraform | `terraform` |

### Step 3: Generate docs/README.md

Use template from `${CLAUDE_PLUGIN_ROOT}/templates/docs/README.md`.
Replace placeholders with detected values.

### Step 4: Architecture Diagram

If `docs/ARCHITECTURE.md` exists, check if the Mermaid diagram matches current structure.
If not, suggest updates based on actual file structure.

## Docs Freshness Check

Compare docs against codebase:

| Check | Method |
|-------|--------|
| VERSION matches | Compare `VERSION` file with docs references |
| API docs current | Compare API.md endpoints with actual route files |
| SETUP accurate | Verify install/dev commands still work |
| ARCHITECTURE current | Check if documented components still exist |

Output a report:

```
Docs Freshness Report:
  docs/README.md      — current (VERSION matches)
  docs/API.md         — STALE (3 endpoints missing)
  docs/SETUP.md       — current
  docs/ARCHITECTURE.md — STALE (new module not documented)
```

## VERSION Cascade

When VERSION changes, update these files:
1. `docs/README.md` — version reference
2. `CHANGELOG.md` — new version section header
3. `.claude-plugin/plugin.json` — `version` field (if CWE plugin project)
4. `package.json` — `version` field (if exists)
5. Any other files containing the old version string

## Rules

1. **Never invent content** — only generate from actual project data
2. **Preserve custom edits** — detect `<!-- custom -->` markers and keep them
3. **Template-first** — always start from templates, never from scratch
4. **Idempotent** — running twice produces the same result
