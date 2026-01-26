---
description: Initialize CWE in current project - creates workflow structure with documentation
allowed-tools: ["Write", "Bash", "Read", "Glob"]
---

# Initialize CWE Project

Create the workflow structure for spec-driven development.

## Check existing setup

First, check if workflow/ already exists:
- If exists: Ask user if they want to reinitialize
- If not: Proceed with creation

## Create structure

Create the following structure:

```
workflow/
├── README.md              # Overview of workflow system
├── config.yml             # Project configuration
├── ideas.md               # Ideas backlog for future development
├── product/
│   ├── README.md          # What goes here
│   └── mission.md         # Product vision template
├── specs/
│   └── README.md          # How to write specs
└── standards/
    └── README.md          # Project-specific standards (optional)
```

## File contents

### workflow/README.md
```markdown
# Workflow

This directory contains your project's workflow artifacts.

## Structure

- `config.yml` - Project configuration
- `ideas.md` - Ideas backlog for future development
- `product/` - Product vision, goals, roadmap
- `specs/` - Feature specifications
- `standards/` - Project-specific coding standards (optional)

## Quick Start

Run `/cwe:start` to begin guided development.

## Learn More

Run `/cwe:help` for full documentation.
```

### workflow/config.yml
```yaml
# CWE Project Configuration
version: "1.0"

project:
  name: "{{PROJECT_NAME}}"

workflow:
  phases:
    - plan      # Define product vision
    - spec      # Write feature specifications
    - tasks     # Break into implementable tasks
    - build     # Implement with agents
    - review    # Quality gates and verification
```

### workflow/ideas.md
```markdown
# Ideas Backlog

Collected ideas for future development.

## Status Legend

- **new** - Just captured, not yet reviewed
- **exploring** - Being discussed/developed
- **planned** - Approved for implementation
- **rejected** - Decided against

---

## Ideas

<!-- Ideas will be added here by the innovator agent -->
```

### workflow/product/README.md
```markdown
# Product

Define your product's vision, goals, and constraints here.

## Files

- `mission.md` - Core vision and goals (required)
- `roadmap.md` - Feature roadmap (optional)
- `constraints.md` - Technical/business constraints (optional)
```

### workflow/product/mission.md
```markdown
# Product Mission

## Vision

[What problem does this product solve? Who is it for?]

## Goals

- [ ] Primary goal
- [ ] Secondary goal

## Non-Goals

- What this product will NOT do

## Success Metrics

- How will you measure success?
```

### workflow/specs/README.md
```markdown
# Specifications

Feature specifications live here. Each feature gets its own folder.

## Structure

```
specs/
├── feature-name/
│   ├── spec.md       # Technical specification
│   ├── tasks.md      # Implementation tasks
│   └── progress.md   # Progress tracking
```

## Creating a Spec

Run `/cwe:start` and follow the guided workflow.
```

### workflow/standards/README.md
```markdown
# Project Standards

Add project-specific coding standards here.

CWE includes built-in standards for common patterns. Add files here only for project-specific conventions.

## Built-in Standards (via Skills)

- API design patterns
- Database conventions
- Testing practices
- Frontend components
- Agent conventions

## Adding Custom Standards

Create `your-standard.md` with clear rules and examples.
```

## After creation

Show success message:
```
CWE initialized successfully!

Next steps:
1. Edit workflow/product/mission.md with your product vision
2. Run /cwe:start to begin guided development

Tip: Install 'superpowers' plugin for TDD, debugging, and code review skills.
```
