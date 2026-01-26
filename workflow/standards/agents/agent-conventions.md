# Agent Convention Standards

## Agent-First Enforcement

Main Chat orchestriert, Agents arbeiten. Diese Trennung ist nicht optional.

### Write Permission Matrix

| File Pattern | Main Chat | builder | devops |
|--------------|-----------|---------|--------|
| `workflow/*.md` | OK | OK | OK |
| `.claude/**/*.md` | OK | OK | - |
| `CHANGELOG.md`, `VERSION` | OK | - | OK |
| `src/**/*`, `lib/**/*` | BLOCK | OK | - |
| `Dockerfile`, `*.yml` (CI) | BLOCK | - | OK |
| Everything else | BLOCK | OK | OK |

### Enforcement Modes

Configure in `.claude/nano.local.md`:

```yaml
agent_first:
  enforcement: warn  # warn | block | off
```

| Mode | Behavior |
|------|----------|
| `block` | PreToolUse hook rejects unauthorized writes |
| `warn` | Log warning, allow write (default) |
| `off` | No enforcement (development mode) |

### Self-Check vor Writes

Main Chat MUSS vor jedem Write/Edit fragen:
1. Ist es `workflow/*.md` oder `.claude/**/*.md`? -> OK
2. Ist es `CHANGELOG.md` oder `VERSION`? -> OK
3. Alles andere -> Delegiere an builder/devops

### Violation Recovery

Bei versehentlichem Direct-Write:
1. `git checkout -- {file}` um Aenderung rueckgaengig zu machen
2. Korrekt an Agent delegieren
3. NaNo trackt Violations fuer Pattern-Analyse

## Auto-Documentation Triggers

### Wann `/workflow:devlog` anbieten

| Trigger | Condition |
|---------|-----------|
| Task-Completion | >3 Dateien geaendert in einer Orchestration |
| Bug-Fix | builder meldet "Root Cause found" |
| Feature-Done | Alle Tasks einer Spec auf "completed" |
| Session-Ende | >30 Minuten aktive Arbeit |

### NaNo Integration

NaNo trackt automatisch:
- Anzahl geaenderter Dateien pro Task
- Zeit zwischen Task-Start und Completion
- Delegation-Patterns (welcher Agent fuer welchen Task)

Diese Daten informieren intelligente devlog-Suggestions.

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
