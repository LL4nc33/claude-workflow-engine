# CWE - Claude Workflow Engine

Spec-driven development with specialized agents.

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

## What is CWE?

CWE provides:
- **3 Commands** for guided spec-driven development
- **9 Specialized Agents** (architect, builder, devops, quality, security, researcher, explainer, innovator, guide)
- **Standards Skills** embedded for consistent code quality

## Workflow Phases

1. **Plan** - Define product vision
2. **Spec** - Write feature specifications
3. **Tasks** - Break into implementable tasks
4. **Build** - Implement with agents
5. **Review** - Quality verification

## Superpowers Integration

CWE works best with [superpowers](https://github.com/obra/superpowers) plugin:

```bash
claude plugin install superpowers
```

CWE agents automatically reference superpowers skills:
- builder -> TDD, debugging
- architect -> writing-plans
- quality -> verification, code-review

## Fresh Install Test

```bash
export HOME=/tmp/fresh-cwe-test
mkdir -p $HOME
cd /path/to/test-project && git init
claude --plugin-dir /path/to/plugin-dist
```

## Structure

```
plugin-dist/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── commands/            # 3 commands (init, start, help)
├── agents/              # 9 specialized agents
├── skills/              # 12 standards skills
└── hooks/               # 2 hooks (SessionStart, Stop)
```

## Version History

- **0.3.1** - Simplified: 3 commands, superpowers integration, English only
- **0.3.0** - Plugin structure created
- **0.2.9a** - Last CLI-focused version

## See Also

- [Superpowers Plugin](https://github.com/obra/superpowers)
- [Claude Code Plugins Docs](https://docs.claude.com/en/docs/claude-code/plugins)
