# CWE How-To Guide

Common tasks and step-by-step instructions for CWE v0.4.0a.

## Table of Contents

- [Getting Started](#getting-started)
- [Working with Agents](#working-with-agents)
- [Using Plugin Skills](#using-plugin-skills)
- [Idea Management](#idea-management)
- [Workflow Phases](#workflow-phases)
- [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Initialize a New Project

```bash
/cwe:init
```

This creates:
```
workflow/
├── README.md
├── config.yml
├── ideas.md           # Idea backlog
├── product/
│   ├── README.md
│   └── mission.md     # Define your vision here
├── specs/
│   └── README.md
└── standards/
    └── README.md
```

### Start Guided Workflow

```bash
/cwe:start
```

CWE detects your current phase and guides you through the next steps.

### Get Help

```bash
/cwe:help
```

Shows all commands, agents, and installed plugins.

---

## Working with Agents

### Let CWE Choose the Right Agent (Auto-Delegation)

Just describe what you need:

| You Say | Agent Selected |
|---------|----------------|
| "Fix the login bug" | builder |
| "Explain how the auth system works" | explainer |
| "What do you think about using Redis?" | ask |
| "Audit the security of the API" | security |
| "Set up Docker for this project" | devops |
| "Design the database schema" | architect |
| "Document the API endpoints" | researcher |
| "Run the tests and check coverage" | quality |
| "What if we used GraphQL instead?" | innovator |
| "How can we improve our workflow?" | guide |

### Use Explicit Agent Commands

```bash
/cwe:builder fix the login validation
/cwe:architect design user authentication
/cwe:security audit the payment flow
```

### Disable Auto-Delegation

Say "manual" to disable auto-delegation for a request:

```
manual - I want to discuss this without delegating to an agent
```

---

## Using Plugin Skills

### superpowers Skills

| Task | Skill | How to Invoke |
|------|-------|---------------|
| Write tests first | TDD | "Use TDD to implement user registration" |
| Debug systematically | Debugging | "Debug why the API returns 500" |
| Plan implementation | Planning | "Write a plan for the refactoring" |
| Review code | Code Review | "Review my changes before commit" |
| Verify completion | Verification | "Verify the feature is complete" |

### frontend-design Skill

For UI components:

```
Build a user profile page with avatar, stats, and recent activity
```

The builder agent automatically uses the `frontend-design` skill for UI work.

### code-simplifier Agent

For refactoring:

```
Simplify the authentication middleware
```

### serena MCP Tools

For code navigation (used automatically by agents):

- Finding symbols: "Where is the User class defined?"
- Finding references: "What uses the validateToken function?"
- Understanding structure: "Show me the structure of the API module"

---

## Idea Management

### How Ideas Are Captured

1. **Automatic capture**: When you mention ideas in conversation, the `idea-observer` hook captures them
2. **Keywords that trigger capture**:
   - English: idea, what if, could we, maybe, alternative, improvement
   - German: idee, was wäre wenn, könnte man, vielleicht, alternativ, verbesserung

### Review Captured Ideas

```bash
/cwe:innovator
```

The innovator agent will:
1. Show you captured ideas from `~/.claude/cwe/idea-observations.toon`
2. Let you select an idea to develop
3. Generate alternatives and trade-offs
4. Update `workflow/ideas.md` with developed ideas

### Ideas Backlog Format

In `workflow/ideas.md`:

```markdown
### [Idea Title]
- **Status:** new | exploring | planned | rejected
- **Source:** auto-captured | user
- **Date:** 2026-01-26
- **Context:** Relevant files, current state
- **Notes:** Discussion, pros/cons
```

---

## Workflow Phases

### Phase 1: Plan

Define your product vision in `workflow/product/mission.md`:

```markdown
# Product Mission

## Vision
What problem does this product solve?

## Goals
- Primary goal
- Secondary goal

## Non-Goals
What this product will NOT do
```

### Phase 2: Spec

Create feature specifications:

```bash
/cwe:start
# When prompted, describe the feature you want to build
```

Creates `workflow/specs/<feature>/spec.md`.

### Phase 3: Tasks

Break the spec into implementable tasks:

```bash
/cwe:start
# CWE will analyze the spec and create tasks
```

Creates `workflow/specs/<feature>/tasks.md`.

### Phase 4: Build

Implement with agents:

```
Implement the user authentication from the spec
```

CWE delegates to appropriate agents (builder, devops, security, etc.).

### Phase 5: Review

Quality verification:

```
Review the authentication implementation
```

Uses quality agent + code-review skills.

---

## Tips & Tricks

### Combine Agents and Skills

```
Use TDD to implement the payment service, then have it reviewed
```

CWE will:
1. Use builder + TDD skill
2. Then use quality + code-review skill

### Check What Plugins Are Available

```bash
/cwe:help
```

Shows all installed plugins and their components.

### Override Agent Choice

If auto-delegation picks the wrong agent:

```
manual - use the architect agent instead
/cwe:architect <your request>
```

### Context Isolation

Agent work stays in agent context. You only see a compact summary. This saves tokens and keeps your conversation clean.

### Session Notifications

At session end, if ideas were captured, you'll see:

```
3 idea(s) captured. Review with /cwe:innovator.
```

---

## Common Workflows

### Bug Fix Workflow

```
1. "Fix the login validation bug"
   → builder + systematic-debugging

2. "Verify the fix works"
   → quality + verification-before-completion

3. "Review before committing"
   → quality + code-review
```

### New Feature Workflow

```
1. /cwe:init (if not done)

2. "I want to add user profiles"
   → /cwe:start guides you through spec creation

3. "Design the database schema for profiles"
   → architect

4. "Implement the profile API"
   → builder + TDD

5. "Build the profile page"
   → builder + frontend-design

6. "Review everything"
   → quality + code-review
```

### Exploration Workflow

```
1. "What if we used GraphQL instead of REST?"
   → innovator + brainstorming

2. "Explain how our current REST API works"
   → explainer + serena

3. "What are the security implications?"
   → ask (discussion) or security (audit)
```
