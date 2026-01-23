# Naming Conventions

## General Rules

- Use English for all identifiers, comments, and documentation
- Be descriptive over terse: `userAuthentication` > `usrAuth`
- Avoid abbreviations unless universally understood (e.g., `id`, `url`, `api`)

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Agent definitions | `{role}.md` (lowercase, hyphenated) | `code-reviewer.md` |
| Skills | `SKILL.md` in named directory | `devops-standards/SKILL.md` |
| Commands | `{verb}-{noun}.md` | `discover-standards.md` |
| Standards | `{topic}.md` (lowercase, hyphenated) | `error-handling.md` |
| Specs | `{YYYYMMDD}-{feature-name}/` | `20260123-auth-flow/` |
| Config files | lowercase, dot-separated | `.claude/settings.json` |

## Code Identifiers

| Language | Variables | Functions | Classes | Constants |
|----------|-----------|-----------|---------|-----------|
| TypeScript/JS | camelCase | camelCase | PascalCase | UPPER_SNAKE |
| Python | snake_case | snake_case | PascalCase | UPPER_SNAKE |
| Go | camelCase | PascalCase (exported) | PascalCase | PascalCase |
| Shell/Bash | UPPER_SNAKE (env) | snake_case | N/A | UPPER_SNAKE |

## Project-Specific Conventions

- Workflow paths: `workflow/standards/{domain}/{topic}.md`
- Skill paths: `.claude/skills/workflow/{domain}-standards/SKILL.md`
- Standard index keys: `{domain}.{topic}` (dot-notation in YAML)
- Environment variables: `OIDANICE_{COMPONENT}_{SETTING}`

## Git Conventions

- Branch names: `{type}/{short-description}` (e.g., `feature/add-auth`)
- Commit messages: imperative mood, max 72 chars first line
- Tag format: `v{MAJOR}.{MINOR}.{PATCH}` (semver)

## API Naming

- Endpoints: `/api/v{n}/{resource}` (plural nouns, kebab-case)
- Query params: camelCase
- JSON fields: camelCase
- Headers: Title-Case with `X-` prefix for custom headers
