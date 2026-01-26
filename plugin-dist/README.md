# CWE - Claude Workflow Engine v0.4.0a

Natural language orchestration for spec-driven development.

## Installation

```bash
claude --plugin-dir /path/to/plugin-dist
# Or when published:
claude plugin install cwe
```

## Quick Start

```bash
/cwe:init     # Initialize project
/cwe:start    # Guided workflow
/cwe:help     # Documentation
```

Or just say what you need:

```
"Fix the login bug"           → builder + systematic-debugging
"Build a user profile page"   → builder + frontend-design
"Explain how auth works"      → explainer + serena
"What if we used GraphQL?"    → innovator + brainstorming
```

## What is CWE?

CWE provides:
- **13 Commands** (3 workflow + 10 agent commands)
- **10 Specialized Agents** (ask, architect, builder, devops, quality, security, researcher, explainer, innovator, guide)
- **Auto-Delegation** - just describe what you need, CWE picks the right agent/skill
- **Full Plugin Integration** - orchestrates all installed plugins

## 5 Core Principles

1. **Agent-First** - All work delegated to specialized agents
2. **Auto-Delegation** - Intent recognition maps requests to agents/skills
3. **Spec-Driven** - Features: specs → tasks → implementation
4. **Context Isolation** - Agent work returns only compact summaries
5. **Plugin Integration** - Agents leverage installed plugin skills

## Integrated Plugins

| Plugin | Components |
|--------|------------|
| **superpowers** | 12 skills (TDD, debugging, planning, code-review) |
| **serena** | MCP tools (find_symbol, code analysis) |
| **feature-dev** | 3 agents (code-explorer, code-architect, code-reviewer) |
| **frontend-design** | 1 skill (production-grade UI) |
| **code-simplifier** | 1 agent (refactoring) |
| **claude-md-management** | 1 skill + command (CLAUDE.md maintenance) |
| **plugin-dev** | 7 skills + 3 agents (plugin creation) |

## Workflow Phases

1. **Plan** - Define product vision
2. **Spec** - Write feature specifications
3. **Tasks** - Break into implementable tasks
4. **Build** - Implement with agents
5. **Review** - Quality verification

## Idea Capture

Ideas auto-captured via hooks:
- Say "I have an idea..." or "what if we..."
- Review with `/cwe:innovator`
- Stored in `workflow/ideas.md`

## Structure

```
plugin-dist/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── CLAUDE.md            # Auto-delegation rules
├── commands/            # 13 commands
├── agents/              # 10 specialized agents
├── skills/              # Standards skills
├── templates/           # ideas.md template
└── hooks/               # 3 hooks (UserPromptSubmit, SessionStart, Stop)
```

## Version History

- **0.4.0a** - Full plugin integration (superpowers, serena, feature-dev, frontend-design, code-simplifier, claude-md-management, plugin-dev), ask agent, idea capture system
- **0.3.1** - Simplified: 12 commands, auto-delegation, superpowers integration
- **0.3.0** - Plugin structure created
- **0.2.9a** - Last CLI-focused version

## See Also

- [Superpowers Plugin](https://github.com/obra/superpowers)
- [Claude Code Plugins Docs](https://docs.claude.com/en/docs/claude-code/plugins)
