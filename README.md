<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/hero-light.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/hero-dark.svg">
    <img alt="Claude Workflow Engine" src="assets/hero-light.svg" width="800">
  </picture>
</p>

<p align="center">
  Spec-driven development with 9 specialized agents.
</p>

---

## Installation

```bash
claude plugin install cwe
# Or local:
claude --plugin-dir /path/to/plugin-dist
```

## Quick Start

```bash
/cwe:init     # Initialize project
/cwe:start    # Guided workflow
/cwe:help     # Documentation
```

## Features

- **12 Commands** (3 workflow + 9 agent shortcuts)
- **9 Specialized Agents** (builder, architect, devops, security, researcher, explainer, quality, innovator, guide)
- **Auto-Delegation** - just describe what you need
- **Superpowers Integration** - TDD, debugging, code review

## Documentation

See [plugin-dist/README.md](plugin-dist/README.md) for full documentation.

## License

MIT
