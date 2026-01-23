# Agent Convention Standards

## Agent Definition Format

Every agent requires frontmatter with:
- `name`: Unique identifier
- `description`: Purpose description (include PROACTIVELY for auto-delegation)
- `tools`: Allowed tool list (principle of least privilege)

## Permission Model

| Access Level     | Allowed Tools                              |
|-----------------|-------------------------------------------|
| READ-ONLY       | Read, Grep, Glob                          |
| TASK-DELEGATION | Task, Read, Grep, Glob                    |
| FULL            | Read, Write, Edit, Bash, Grep, Glob       |
| RESTRICTED      | Read, Grep, Glob, Bash(specific commands) |

## Skill File Format

```markdown
---
name: skill-name
description: Clear purpose. Use PROACTIVELY when [trigger condition].
allowed-tools: Read, Grep, Glob
context: fork
agent: Explore
---

# Skill Title

## Instructions
[Concise instructions for the skill]
```

## Agent Communication Patterns

- Agents communicate through file artifacts, not direct messaging
- Specs folder is the shared communication channel
- Each agent reads relevant standards automatically (via Skills)
- Orchestrator delegates via Task tool with clear scope

## Naming Conventions

- Agent files: `{role}.md` (lowercase, hyphenated)
- Skill files: `SKILL.md` inside named directories
- Command files: `{verb}-{noun}.md` (e.g., discover-standards.md)
- Spec folders: `{YYYYMMDD}-{feature-name}/`
