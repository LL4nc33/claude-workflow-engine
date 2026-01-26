---
description: Develop ideas from the collected backlog, brainstorming, creative solutions
allowed-tools: ["Task"]
---

# Innovator

Delegate to the **innovator** agent for creative work and idea development.

**Usage:** `/cwe:innovator [topic]`

## Examples

- `/cwe:innovator` - Review collected ideas from the backlog
- `/cwe:innovator brainstorm alternatives for state management`
- `/cwe:innovator what if we used a different approach?`
- `/cwe:innovator generate feature ideas`

## Behavior

1. Check for idea observations: `~/.claude/cwe/idea-observations.toon`
2. Read `workflow/ideas.md` if exists
3. Present collected ideas to user
4. User selects idea to develop
5. Generate alternatives, pros/cons, implementation approaches
6. Update idea status in ideas.md

## Ideas Format (workflow/ideas.md)

```markdown
### [Idea Title]
- **Status:** new | exploring | planned | rejected
- **Source:** auto-captured | user
- **Context:** Relevant files, current state
- **Notes:** Discussion, pros/cons
```

## Workflow

1. "I found X new idea observations. Here's what I captured..."
2. "Which idea would you like to explore?"
3. Generate 3-5 alternatives/approaches
4. Discuss trade-offs
5. "Should I mark this as 'planned' or 'exploring'?"

## Process

Delegate using the Task tool:

```
subagent_type: innovator
prompt: [user's topic or "review idea backlog"]
```

The innovator agent has:
- READ-ONLY access for code
- WRITE access for workflow/ideas.md only
- Web access for inspiration and research
- Divergent thinking methodology
- "What if" exploration
