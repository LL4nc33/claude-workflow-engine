# Plugin Extension Rules

How to add new Agents, Skills, and Commands to the Workflow Engine.

## Adding an Agent

Path: `.claude/agents/{name}.md`

Frontmatter (required):

```yaml
---
name: {name}
description: Role description. Use PROACTIVELY when {trigger conditions}.
tools: Tool1, Tool2, mcp__server__tool (if MCP)
---
```

Body sections (in order):
1. `# {Name} Agent`
2. `## Identity` - Role description, specializations
3. `## Context Sources` - `@workflow/standards/...` references
4. `## Rules` - Numbered constraints
5. `## MCP Tool Usage` (if applicable) - When/how to use MCP tools

Rules:
- `tools` field: comma-separated, no quotes
- MCP tools: full path (`mcp__plugin_serena_serena__find_symbol`)
- Access level in CLAUDE.md table: READ-ONLY, FULL, RESTRICTED, TASK-DELEGATION
- After creating: update CLAUDE.md agent table + hierarchy diagram

## Adding a Skill

Path: `.claude/skills/workflow/{name}/SKILL.md`

Frontmatter (required):

```yaml
---
name: {name}
description: Purpose. Trigger keywords: keyword1, keyword2, keyword3
---
```

Body: Concise reference content (tables, code examples, rules).

Rules:
- Description doubles as trigger text (agent loads skill when keywords match)
- One `SKILL.md` per directory
- Keep under 200 lines (context window budget)
- Standards skills: `{domain}-standards` naming

## Adding a Command

Path: `.claude/commands/workflow/{name}.md`

No frontmatter. Pure markdown with:
1. `# Title`
2. One-line description
3. `## Important Guidelines`
4. `## Process` (numbered steps)

Rules:
- Commands are interactive (use AskUserQuestion)
- One question at a time
- Reference standards via `@workflow/standards/...`
- Output locations clearly documented

## Sync Checklist

After any extension:
- [ ] Update CLAUDE.md (agent table, hierarchy, or standards list)
- [ ] Update `workflow/standards/index.yml` (if new standard)
- [ ] Copy to `cli/templates/base/` (matching path mapping)
- [ ] Update `docs/` (DE + EN)
