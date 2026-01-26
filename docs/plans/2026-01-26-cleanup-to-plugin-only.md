# CWE Cleanup: Plugin-Only Migration

> **For Claude:** Use superpowers:executing-plans to implement this plan.

**Goal:** Remove CLI, keep only plugin-dist, update all docs.

---

## Task 1: Delete CLI directory

```bash
rm -rf cli/
git add -A && git commit -m "chore: Remove CLI (replaced by plugin)"
```

---

## Task 2: Update Root README.md

Replace entire content with:

```markdown
# Claude Workflow Engine (CWE)

Spec-driven development with 9 specialized agents.

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
```

```bash
git add README.md && git commit -m "docs: Simplify README for plugin-only"
```

---

## Task 3: Sync .claude/CLAUDE.md with plugin

```bash
cp plugin-dist/CLAUDE.md .claude/CLAUDE.md
git add .claude/CLAUDE.md && git commit -m "docs: Sync CLAUDE.md with plugin version"
```

---

## Task 4: Simplify docs/ directory

Delete outdated docs, keep only essential:

```bash
# Delete all old docs
rm -rf docs/en/
rm docs/workflow.md docs/plattform-architektur.md docs/erste-schritte.md
rm docs/cli.md docs/nano-learning-system.md docs/agenten.md
rm docs/standards.md docs/konfiguration.md docs/integration.md
rm docs/tipps.md docs/faq.md

# Keep only plans/
git add -A && git commit -m "docs: Remove outdated CLI documentation"
```

---

## Task 5: Create simple docs/README.md

```markdown
# CWE Documentation

Main documentation is in [plugin-dist/README.md](../plugin-dist/README.md).

## Plans

Implementation plans are stored in `plans/` directory.
```

```bash
git add docs/README.md && git commit -m "docs: Add minimal docs README"
```

---

## Task 6: Update VERSION and tag

```bash
# VERSION already at 0.3.1, just ensure clean state
git status
git log --oneline -5
```

---

## Summary

| Task | Action |
|------|--------|
| 1 | Delete cli/ |
| 2 | Rewrite README.md |
| 3 | Sync CLAUDE.md |
| 4 | Delete old docs |
| 5 | Minimal docs/README.md |
| 6 | Verify clean state |

**Result:** Clean plugin-only repository.
