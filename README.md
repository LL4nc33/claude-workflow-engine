<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/hero-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/hero-dark.svg">
    <img alt="Claude Workflow Engine" src="assets/hero-light.svg" width="800">
  </picture>
</p>

<p align="center">
  <strong>Natural language orchestration for spec-driven development.</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## Installation

```bash
claude plugin install cwe
# Or local development:
claude --plugin-dir /path/to/plugin-dist
```

## Quick Start

```bash
/cwe:init     # Initialize project + install recommended plugins
/cwe:start    # Guided workflow
/cwe:help     # Documentation
```

`/cwe:init` automatically detects and offers to install missing plugins:

| Plugin | Level | Purpose |
|--------|-------|---------|
| superpowers | Required | TDD, debugging, planning |
| serena | Recommended | Semantic code analysis |
| feature-dev | Recommended | 7-phase feature workflow |
| frontend-design | Optional | Production-grade UI |
| code-simplifier | Optional | Refactoring |
| claude-md-management | Optional | CLAUDE.md maintenance |
| plugin-dev | Optional | Plugin creation |

Or just say what you need:

```
"Fix the login bug"           → builder + systematic-debugging
"Build a user profile page"   → builder + frontend-design
"Explain how auth works"      → explainer + serena
"What if we used GraphQL?"    → innovator + brainstorming
"Review my changes"           → quality + code-reviewer
```

## Features

### 10 Specialized Agents

| Agent | Purpose | Access |
|-------|---------|--------|
| **ask** | Questions, discussions | READ-ONLY |
| **builder** | Implementation, bug fixes | FULL |
| **architect** | System design, ADRs | READ-ONLY |
| **devops** | CI/CD, Docker, K8s | FULL |
| **security** | Audits, OWASP | RESTRICTED |
| **researcher** | Documentation, analysis | READ-ONLY |
| **explainer** | Explanations, walkthroughs | READ-ONLY |
| **quality** | Tests, coverage, metrics | READ-ONLY |
| **innovator** | Brainstorming, idea backlog | READ-ONLY |
| **guide** | Process improvement | READ-ONLY |

### Full Plugin Integration

CWE orchestrates all installed plugins automatically:

| Plugin | Components |
|--------|------------|
| **superpowers** | 12 skills (TDD, debugging, planning, code-review) |
| **serena** | MCP tools (find_symbol, code analysis) |
| **feature-dev** | 3 agents (code-explorer, code-architect, code-reviewer) |
| **frontend-design** | Production-grade UI skill |
| **code-simplifier** | Refactoring agent |
| **claude-md-management** | CLAUDE.md maintenance |
| **plugin-dev** | 7 skills for plugin creation |

### Idea Capture System

Ideas mentioned in conversations are automatically captured:

1. Say "I have an idea..." or "what if we..."
2. Ideas are auto-captured by hooks
3. Review with `/cwe:innovator`
4. Developed ideas stored in `workflow/ideas.md`

### 5-Phase Workflow

1. **Plan** - Define product vision
2. **Spec** - Write feature specifications
3. **Tasks** - Break into implementable tasks
4. **Build** - Implement with agents
5. **Review** - Quality verification

## Documentation

| Document | Description |
|----------|-------------|
| [Plugin README](plugin-dist/README.md) | Full plugin documentation |
| [How-To Guide](docs/HOWTO.md) | Common tasks and examples |
| [Use Cases](docs/USECASES.md) | Real-world examples |
| [CHANGELOG](CHANGELOG.md) | Version history |

## 5 Core Principles

1. **Agent-First** - All work delegated to specialized agents
2. **Auto-Delegation** - Intent recognition maps requests to agents/skills
3. **Spec-Driven** - Features: specs → tasks → implementation
4. **Context Isolation** - Agent work returns only compact summaries
5. **Plugin Integration** - Agents leverage installed plugin skills

## License

MIT

---

<p align="center">
  <sub>Built with Claude Code</sub>
</p>
