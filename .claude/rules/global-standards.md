---
paths:
  - "**/*"
---

# Global Standards

## Naming Conventions
- Files: lowercase, hyphenated (`user-service.ts`)
- Agent files: `{role}.md`
- Skills: `SKILL.md` in named directories
- Code identifiers: language-appropriate casing
- API endpoints: plural nouns, kebab-case
- Environment vars: `SCREAMING_SNAKE_CASE` (project may use a prefix like `MYAPP_{COMPONENT}_{SETTING}` — define in project-specific standards)

## General Principles
- No secrets or credentials in source code
- No PII in error messages, logs, or commit messages
- Reproducible builds and deterministic tests
- Document decisions and trade-offs, not just what code does

## Optional Project Overrides
- Add project-specific standards in `.claude/rules/` inside your target project
- Override any default by shadowing the file name (e.g. local `global-standards.md` takes precedence)
- For compliance needs (GDPR, HIPAA, SOC2, etc.) add a matching `compliance-standards.md`
- For cloud/infra preferences add a matching `infra-standards.md`
